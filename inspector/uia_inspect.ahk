#Requires AutoHotkey v2.1-alpha.30
#SingleInstance Off
#NoTrayIcon

; Headless UI Automation inspector. Reads one JSON request on stdin, writes one JSON
; response on stdout, exits. Launch with /ErrorStdOut so load-time failures reach stderr
; instead of opening a MsgBox that would hang the caller until its timeout.
;
;   {"op":"uia_tree","hwnd":123456,"depth":4,"filter":"interactive","maxNodes":200}
;   -> {"ok":true,"data":{...},"meta":{"elapsedMs":37,"nodeCount":112,"truncated":false}}
;
; Every operation is read-only. Property values and pattern availability are read; no
; control pattern is ever obtained or invoked, so this cannot activate anything in the
; target application.

#Include %A_LineFile%\..\..\scripts\UIA.ahk
#Include %A_LineFile%\..\json.ahk
#Include %A_LineFile%\..\uia_props.ahk
#Include %A_LineFile%\..\uia_paths.ahk
#Include %A_LineFile%\..\uia_snippet.ahk

; Held in a Map so nested functions can mutate counters without repeating `global`
; declarations - assigning a bare global from inside a function silently creates a local.
global State := Map("startTick", A_TickCount, "nodeCount", 0, "truncated", 0)

; Hard ceiling on the response body. The tree walk truncates at node boundaries and
; Respond() trims whole lines if the budget is still exceeded, so the output is always
; parseable JSON rather than a JSON fragment cut mid-token.
global MaxResponseBytes := 40000

; Only drive stdin when run directly. uia_daemon.ahk includes this file to reuse
; DispatchOp, and must not have the one-shot stdin path fire on load.
if (A_LineFile = A_ScriptFullPath)
    Main()

Main() {
    local raw := "", request := "", op := "", data := ""
    try {
        raw := ReadStdin()
    } catch as e {
        Respond(ErrorPayload("STDIN_READ_FAILED", "Could not read the request from stdin: " e.Message
            , "The inspector expects one JSON object on stdin. Check that the caller writes and closes the pipe."))
        return
    }

    if (Trim(raw) = "") {
        Respond(ErrorPayload("EMPTY_REQUEST", "No request received on stdin."
            , 'Send a JSON object such as {"op":"uia_windows"}.'))
        return
    }

    try {
        request := Json.Parse(raw)
    } catch as e {
        Respond(ErrorPayload("BAD_JSON", "Request was not valid JSON: " e.Message
            , "Send a single JSON object. Strings must be double-quoted and escaped."))
        return
    }

    if !(request is Map) || !request.Has("op") {
        Respond(ErrorPayload("BAD_REQUEST", "Request must be a JSON object with an 'op' field."
            , 'Example: {"op":"uia_windows","filter":"recorder"}'))
        return
    }

    Respond(DispatchOp(request))
}

; Runs one request and returns a complete response payload. Shared by the stdin driver
; and by the scaffolded daemon, so both modes answer identically.
DispatchOp(request) {
    local op := request["op"], data := ""
    try {
        switch op {
            case "uia_windows": data := OpWindows(request)
            case "uia_tree": data := OpTree(request)
            case "uia_find": data := OpFind(request)
            case "uia_element": data := OpElement(request)
            case "uia_under_cursor": data := OpUnderCursor(request)
            case "uia_highlight": data := OpHighlight(request)
            case "ping": data := Map("pong", Json.True, "ahkVersion", A_AhkVersion)
            default:
                return ErrorPayload("UNKNOWN_OP", "Unknown op: " op
                    , "Valid ops: uia_windows, uia_tree, uia_find, uia_element, uia_under_cursor, uia_highlight.")
        }
    } catch UiaError as e {
        return ErrorPayload(e.Code, e.Message, e.Hint)
    } catch as e {
        return ErrorPayload("INTERNAL", Type(e) ": " e.Message
            , "This is an inspector bug. " (e.HasOwnProp("Extra") && e.Extra != "" ? "Detail: " e.Extra : ""))
    }
    return Map("ok", Json.True, "data", data)
}

class UiaError extends Error {
    Code := "INTERNAL"
    Hint := ""
    __New(code, message, hint := "") {
        super.__New(message)
        this.Code := code
        this.Hint := hint
    }
}

Fail(code, message, hint := "") {
    throw UiaError(code, message, hint)
}

ReadStdin() {
    local handle := FileOpen("*", "r", "UTF-8"), text := ""
    text := handle.Read()
    handle.Close()
    return text
}

ErrorPayload(code, message, hint) {
    local err := Map()
    err["code"] := code
    err["message"] := message
    err["hint"] := hint
    return Map("ok", Json.False, "error", err)
}

Respond(payload) {
    ; meta and capNote are attached before trimming, otherwise they are added to an
    ; already-at-budget document and push the response back over the cap.
    AttachMeta(payload)
    Print(TrimToBudget(payload))
    ExitApp 0
}

AttachMeta(payload) {
    local meta := Map()
    meta["elapsedMs"] := A_TickCount - State["startTick"]
    meta["nodeCount"] := State["nodeCount"]
    meta["truncated"] := Json.Bool(State["truncated"])
    payload["meta"] := meta
}

; UTF-8 bytes, not characters. StrLen counts UTF-16 units, so a tree full of non-ASCII
; names would sail past a character-counted cap.
Utf8Len(text) {
    return StrPut(text, "UTF-8") - 1
}

; Drop whole tree lines from the tail until the encoded response fits the cap. Only
; `lines` is trimmed: it is the only unbounded field, and removing entries there always
; leaves a structurally valid document. Every counter that appears in the output is
; refreshed inside the loop so the serialized bytes are what actually gets measured.
TrimToBudget(payload) {
    local text := Json.Stringify(payload), lines := ""
    if (Utf8Len(text) <= MaxResponseBytes)
        return text
    if !payload.Has("data") || !(payload["data"] is Map) || !payload["data"].Has("lines")
        return text

    lines := payload["data"]["lines"]
    payload["data"]["capNote"] := "Response was trimmed to the " MaxResponseBytes "-byte cap. "
        . "Narrow the scope with fromPath, a smaller depth, or filter='interactive'."
    State["truncated"] := 1

    while (lines.Length > 0) {
        State["nodeCount"] := lines.Length
        AttachMeta(payload)
        text := Json.Stringify(payload)
        if (Utf8Len(text) <= MaxResponseBytes)
            return text
        lines.Pop()
    }
    AttachMeta(payload)
    return Json.Stringify(payload)
}

GetParam(request, key, default := "") {
    if !request.Has(key)
        return default
    if (request[key] = "" && default != "")
        return default
    return request[key]
}

IsWindowCloaked(hwnd) {
    local cloaked := 0
    try DllCall("dwmapi\DwmGetWindowAttribute", "ptr", hwnd, "int", 14, "int*", &cloaked, "int", 4)
    catch
        return 0
    return cloaked ? 1 : 0
}

; A window whose process cannot be queried is almost always running elevated while we are
; not, which is the difference between "empty tree" and "access denied".
LooksElevated(hwnd) {
    try {
        WinGetProcessPath(hwnd)
        return 0
    } catch
        return 1
}

ResolveWindow(request) {
    local hwnd := 0, query := "", candidate := 0, title := ""
    hwnd := GetParam(request, "hwnd", 0)
    query := GetParam(request, "titleQuery", "")

    if (hwnd) {
        hwnd := Integer(hwnd)
        if !WinExist("ahk_id " hwnd)
            Fail("WINDOW_NOT_FOUND", "No window with hwnd " hwnd " exists."
                , "Window handles change when an app restarts. Call uia_windows to get a current hwnd.")
        return hwnd
    }

    if (query = "")
        Fail("BAD_REQUEST", "Either 'hwnd' or 'titleQuery' is required."
            , "Call uia_windows first, then pass the hwnd you want to inspect.")

    for candidate in WinGetList() {
        title := ""
        try title := WinGetTitle(candidate)
        catch
            continue
        if (title != "" && InStr(title, query, false))
            return candidate
    }
    Fail("WINDOW_NOT_FOUND", "No visible window title contains " Chr(34) query Chr(34) "."
        , "Match is case-insensitive substring. Call uia_windows to list what is actually open.")
}

RootElementFor(hwnd) {
    local el := ""
    try el := UIA.ElementFromHandle(hwnd)
    catch as e {
        if LooksElevated(hwnd)
            Fail("ACCESS_DENIED", "Cannot read the UI Automation tree for hwnd " hwnd ": " e.Message
                , "That window belongs to an elevated process. Run the MCP server elevated, or use the AutoHotkey64_UIA.exe UI Access build.")
        Fail("UIA_UNAVAILABLE", "UI Automation could not attach to hwnd " hwnd ": " e.Message
            , "The window may have closed between listing and inspection. Re-run uia_windows.")
    }
    return el
}

; Distinguishes a genuinely empty window from a suspended one. Minimised and cloaked UWP
; apps report a valid root element with zero children, which otherwise looks like a bug.
AssertTreeReadable(hwnd, rootEl) {
    local kids := UiaProps.SafeChildren(rootEl), minmax := 0
    if (kids.Length > 0)
        return
    try minmax := WinGetMinMax(hwnd)
    catch
        minmax := 0
    if (minmax = -1)
        Fail("WINDOW_SUSPENDED", "Window " hwnd " has an empty UI Automation tree because it is minimised."
            , "Restore the window and retry. Packaged apps unload their automation tree while minimised.")
    if IsWindowCloaked(hwnd)
        Fail("WINDOW_SUSPENDED", "Window " hwnd " has an empty UI Automation tree because it is cloaked (suspended or on another virtual desktop)."
            , "Switch to that virtual desktop or bring the app to the foreground, then retry.")
    if LooksElevated(hwnd)
        Fail("ACCESS_DENIED", "Window " hwnd " exposes no automation tree and its process cannot be queried."
            , "It is probably elevated. Run elevated or use the AutoHotkey64_UIA.exe UI Access build.")
    Fail("EMPTY_TREE", "Window " hwnd " exposes no UI Automation children."
        , "Some custom-drawn windows publish no automation tree at all. Try uia_under_cursor to confirm.")
}

OpWindows(request) {
    local filter := GetParam(request, "filter", ""), out := [], entry := Map()
    local hwnd := 0, title := "", exe := "", cls := "", pid := 0, minmax := 0

    for hwnd in WinGetList() {
        title := ""
        try title := WinGetTitle(hwnd)
        catch
            continue
        if (title = "")
            continue
        exe := "", cls := "", pid := 0
        try exe := WinGetProcessName(hwnd)
        try cls := WinGetClass(hwnd)
        try pid := WinGetPID(hwnd)
        if (filter != "" && !InStr(title, filter, false) && !InStr(exe, filter, false))
            continue
        minmax := 0
        try minmax := WinGetMinMax(hwnd)
        entry := Map()
        entry["hwnd"] := hwnd
        entry["title"] := UiaProps.Truncate(title, 120)
        entry["class"] := cls
        entry["pid"] := pid
        entry["processName"] := exe
        entry["isVisible"] := Json.Bool(minmax != -1 && !IsWindowCloaked(hwnd))
        if (minmax = -1)
            entry["state"] := "minimized"
        else if IsWindowCloaked(hwnd)
            entry["state"] := "cloaked"
        out.Push(entry)
        State["nodeCount"]++
    }
    return Map("windows", out)
}

OpTree(request) {
    local hwnd := ResolveWindow(request)
    local depth := Integer(GetParam(request, "depth", 4))
    local filter := GetParam(request, "filter", "interactive")
    local maxNodes := Integer(GetParam(request, "maxNodes", 200))
    local fromPath := GetParam(request, "fromPath", "")
    local rootEl := RootElementFor(hwnd), startEl := rootEl
    local basePath := [], lines := [], continuations := []

    if (filter != "interactive" && filter != "all")
        Fail("BAD_REQUEST", "filter must be 'interactive' or 'all', got: " filter
            , "Use 'interactive' (default) for actionable controls, 'all' to include static structure.")

    AssertTreeReadable(hwnd, rootEl)

    if (fromPath != "") {
        try basePath := UiaPath.FromString(fromPath)
        catch as e
            Fail("BAD_PATH", "fromPath is malformed: " e.Message
                , "Pass a path string exactly as returned by a previous uia_tree call.")
        startEl := UiaPath.Resolve(rootEl, basePath)
        if !IsObject(startEl)
            Fail("ELEMENT_NOT_FOUND", "fromPath did not resolve in the current tree: " fromPath
                , "The UI changed since that path was produced. Re-run uia_tree without fromPath.")
    }

    WalkTree(startEl, basePath, 0, depth, filter, maxNodes, lines, continuations)

    local result := Map()
    result["hwnd"] := hwnd
    result["root"] := UiaProps.CoreProps(rootEl)
    result["filter"] := filter
    result["depth"] := depth
    result["lines"] := lines
    if (continuations.Length > 0)
        result["continuations"] := continuations
    result["legend"] := "ControlType `"Name`" #AutomationId $ClassName {flags} @path"
    return result
}

WalkTree(el, basePath, level, maxDepth, filter, maxNodes, lines, continuations) {
    local children := UiaProps.SafeChildren(el), child := "", step := "", childPath := ""
    local line := "", pathString := "", webBudget := 0

    for child in children {
        if (State["nodeCount"] >= maxNodes) {
            State["truncated"] := 1
            return
        }
        step := UiaPath.BuildStep(child, children)
        childPath := CopyPath(basePath)
        childPath.Push(step)
        pathString := UiaPath.ToString(childPath)

        if (filter = "all" || UiaProps.IsInteractive(child)) {
            State["nodeCount"]++
            lines.Push(FormatNode(child, level, pathString))
        }

        if (level + 1 >= maxDepth) {
            if (UiaProps.SafeChildren(child).Length > 0) {
                State["truncated"] := 1
                continuations.Push(pathString)
                lines.Push(Indent(level + 1) "… collapsed subtree, expand with fromPath=" pathString)
            }
            continue
        }

        ; A Chromium/WebView2 host can hold tens of thousands of nodes. Collapsing one on
        ; sight would stub out the whole window in an all-Chromium app like Teams, so
        ; instead a single host may spend at most half the remaining budget before the
        ; rest is stubbed - deep enough to be useful, bounded enough not to starve peers.
        if UiaProps.IsWebContentHost(child) {
            webBudget := State["nodeCount"] + Max(20, (maxNodes - State["nodeCount"]) // 2)
            WalkTree(child, childPath, level + 1, maxDepth, filter, Min(maxNodes, webBudget), lines, continuations)
            if (State["nodeCount"] >= webBudget) {
                State["truncated"] := 1
                continuations.Push(pathString)
                lines.Push(Indent(level + 1) "… web content truncated, expand with fromPath=" pathString)
            }
            continue
        }

        WalkTree(child, childPath, level + 1, maxDepth, filter, maxNodes, lines, continuations)
    }
}

CopyPath(path) {
    local out := [], step := ""
    for step in path
        out.Push(step)
    return out
}

Indent(level) {
    local out := ""
    loop level
        out .= "  "
    return out
}

FormatNode(el, level, pathString) {
    local out := Indent(level) UiaProps.SafeTypeName(el)
    local name := UiaProps.SafeGet(el, "Name")
    local aid := UiaProps.SafeGet(el, "AutomationId")
    local cn := UiaProps.SafeGet(el, "ClassName")
    local flags := UiaProps.StateFlags(el)
    if (name != "")
        out .= ' "' UiaProps.Truncate(name, 40) '"'
    if (aid != "")
        out .= " #" UiaProps.Truncate(aid, 40)
    ; A CSS class list carries no selector value, so it is not worth the characters.
    if UiaProps.IsStableClassName(cn)
        out .= " $" cn
    if (flags != "")
        out .= " {" flags "}"
    return out . " @" pathString
}

OpFind(request) {
    local hwnd := ResolveWindow(request)
    local query := GetParam(request, "query", "")
    local wantType := GetParam(request, "controlType", "")
    local maxResults := Integer(GetParam(request, "maxResults", 10))
    local rootEl := RootElementFor(hwnd)
    local matches := [], scored := []

    if (query = "")
        Fail("BAD_REQUEST", "'query' is required.", "Pass text to match against Name and AutomationId, e.g. 'save'.")

    AssertTreeReadable(hwnd, rootEl)
    CollectMatches(rootEl, [], query, wantType, scored)

    if (scored.Length = 0)
        Fail("NO_MATCHES", "Nothing in window " hwnd " matches " Chr(34) query Chr(34)
            . (wantType != "" ? " with controlType " wantType : "") "."
            , "Try a shorter query, drop controlType, or run uia_tree with filter='all' to see what is actually there.")

    SortByScore(scored)

    local i := 0, hit := "", entry := Map()
    for hit in scored {
        if (++i > maxResults)
            break
        entry := UiaProps.CoreProps(hit["el"])
        entry["path"] := UiaPath.ToString(hit["path"])
        entry["score"] := hit["score"]
        try entry["snippet"] := UiaSnippet.Build(hwnd, rootEl, hit["el"], hit["path"])["snippet"]
        catch as e
            entry["snippet"] := ""
        matches.Push(entry)
        State["nodeCount"]++
    }
    return Map("hwnd", hwnd, "query", query, "matches", matches, "totalMatched", scored.Length)
}

CollectMatches(el, basePath, query, wantType, scored) {
    local children := UiaProps.SafeChildren(el), child := "", step := "", childPath := ""
    local name := "", aid := "", score := 0, entry := Map()

    for child in children {
        if (scored.Length > 400)
            return
        step := UiaPath.BuildStep(child, children)
        childPath := CopyPath(basePath)
        childPath.Push(step)

        name := UiaProps.SafeGet(child, "Name")
        aid := UiaProps.SafeGet(child, "AutomationId")
        score := ScoreMatch(name, aid, query)
        if (score > 0 && (wantType = "" || UiaProps.SafeTypeName(child) = wantType)) {
            entry := Map()
            entry["el"] := child
            entry["path"] := childPath
            entry["score"] := score
            scored.Push(entry)
        }
        CollectMatches(child, childPath, query, wantType, scored)
    }
}

; Exact beats prefix beats substring, and AutomationId beats Name because it is the more
; stable selector - the ranking mirrors the codegen strategy order.
ScoreMatch(name, aid, query) {
    local best := 0
    best := Max(best, FieldScore(aid, query) * 2)
    best := Max(best, FieldScore(name, query))
    return best
}

FieldScore(value, query) {
    if (value = "" || query = "")
        return 0
    if (value = query)
        return 100
    if (InStr(value, query, false) = 1)
        return 60
    if (InStr(value, query, false))
        return 30
    return 0
}

SortByScore(items) {
    local i := 0, j := 0, tmp := ""
    loop items.Length - 1 {
        i := A_Index
        loop items.Length - i {
            j := A_Index
            if (items[j]["score"] < items[j + 1]["score"]) {
                tmp := items[j]
                items[j] := items[j + 1]
                items[j + 1] := tmp
            }
        }
    }
}

ResolveTarget(request, hwnd, rootEl) {
    local pathString := GetParam(request, "path", ""), el := ""
    local condName := GetParam(request, "name", ""), condAid := GetParam(request, "automationId", "")
    local condType := GetParam(request, "controlType", ""), cond := {}, path := []

    if (pathString != "") {
        try path := UiaPath.FromString(pathString)
        catch as e
            Fail("BAD_PATH", "path is malformed: " e.Message
                , "Pass a path string exactly as returned by uia_tree or uia_find.")
        el := UiaPath.Resolve(rootEl, path)
        if !IsObject(el)
            Fail("ELEMENT_NOT_FOUND", "path did not resolve: " pathString
                , "The element vanished or the UI changed. Re-run uia_tree to get a fresh path.")
        return Map("el", el, "path", path)
    }

    if (condAid = "" && condName = "")
        Fail("BAD_REQUEST", "Provide 'path', or 'automationId' and/or 'name'."
            , "uia_tree and uia_find both return ready-to-use path values.")

    if (condAid != "")
        cond.A := condAid
    if (condName != "")
        cond.N := condName
    if (condType != "") {
        if !UIA.Type.HasOwnProp(condType)
            Fail("BAD_REQUEST", "Unknown controlType: " condType
                , "Use a UIA control type name such as Button, Edit, CheckBox, ListItem.")
        cond.T := UIA.Type.%condType%
    }

    try el := rootEl.FindElement(cond)
    catch
        Fail("ELEMENT_NOT_FOUND", "No element matched the supplied condition."
            , "Run uia_find with the same text to see near matches, or uia_tree with filter='all'.")

    return Map("el", el, "path", PathForElement(rootEl, el))
}

; Rebuild a path for an element found by condition or hit-test, so every response can hand
; back a durable handle even when the caller did not select by path.
;
; Walks UP from the element to the window root rather than searching down from it.
; Searching down means comparing every node in the tree, which on a Chromium window is tens
; of thousands of COM round-trips and can outlast the caller's timeout. Ancestry is
; O(depth x siblings-per-level) and finishes in milliseconds on the same window.
PathForElement(rootEl, targetEl) {
    local chain := [], current := targetEl, parent := "", path := [], entry := ""
    local walker := UIA.TreeWalkerTrue

    if UiaSnippet.Same(current, rootEl)
        return []

    loop 60 {
        parent := ""
        try parent := walker.TryGetParentElement(current)
        catch
            return []
        if !IsObject(parent)
            return []
        chain.InsertAt(1, Map("el", current, "parent", parent))
        if UiaSnippet.Same(parent, rootEl)
            break
        current := parent
    }

    ; The chain is only meaningful if it actually terminated at the requested root.
    if (chain.Length = 0 || !UiaSnippet.Same(chain[1]["parent"], rootEl))
        return []

    for entry in chain
        path.Push(UiaPath.BuildStep(entry["el"], UiaProps.SafeChildren(entry["parent"])))
    return path
}

OpElement(request) {
    local hwnd := ResolveWindow(request)
    local rootEl := RootElementFor(hwnd)
    local target := "", el := "", path := [], out := Map()

    AssertTreeReadable(hwnd, rootEl)
    target := ResolveTarget(request, hwnd, rootEl)
    el := target["el"]
    path := target["path"]

    out := UiaProps.CoreProps(el)
    out["hwnd"] := hwnd
    out["path"] := UiaPath.ToString(path)
    out["pathArray"] := UiaPath.ToArray(path)
    out["rect"] := UiaProps.SafeRect(el)
    out["patterns"] := UiaProps.Patterns(el)
    State["nodeCount"]++

    try {
        local built := UiaSnippet.Build(hwnd, rootEl, el, path)
        out["snippet"] := built["snippet"]
        out["snippetStrategy"] := built["strategy"]
        out["snippetVerified"] := built["verified"]
    } catch as e {
        Fail("SNIPPET_UNRESOLVED", "No selector for this element resolved back to it: " e.Message
            , "The element has no stable AutomationId, Name, or position. Use uia_under_cursor to re-acquire it live.")
    }
    return out
}

OpUnderCursor(request) {
    local delayMs := Integer(GetParam(request, "delayMs", 0))
    local el := "", hwnd := 0, rootEl := "", out := Map(), ancestors := []

    if (delayMs < 0 || delayMs > 10000)
        Fail("BAD_REQUEST", "delayMs must be between 0 and 10000, got " delayMs
            , "Use a delay when you want to point at a control first, e.g. 3000 for three seconds.")
    if (delayMs > 0)
        Sleep(delayMs)

    local pt := GetCursorPos()
    try el := UIA.ElementFromPoint(pt["x"], pt["y"])
    catch as e
        Fail("UIA_UNAVAILABLE", "No automation element under the cursor at " pt["x"] "," pt["y"] ": " e.Message
            , "Point at a control and retry with delayMs, e.g. 3000.")

    try hwnd := el.GetPropertyValue(30020)
    catch
        hwnd := 0
    if !hwnd {
        try hwnd := WinExist("ahk_id " DllCall("WindowFromPoint", "int64", (pt["y"] << 32) | (pt["x"] & 0xFFFFFFFF), "ptr"))
        catch
            hwnd := 0
    }
    if !hwnd
        hwnd := WinGetID("A")

    rootEl := RootElementFor(hwnd)
    out := UiaProps.CoreProps(el)
    out["hwnd"] := hwnd
    out["cursor"] := Map("x", pt["x"], "y", pt["y"])
    out["rect"] := UiaProps.SafeRect(el)
    out["patterns"] := UiaProps.Patterns(el)
    State["nodeCount"]++

    local path := PathForElement(rootEl, el)
    out["path"] := UiaPath.ToString(path)
    out["pathArray"] := UiaPath.ToArray(path)

    ancestors := BuildAncestorLines(rootEl, path)
    out["ancestors"] := ancestors

    try {
        local built := UiaSnippet.Build(hwnd, rootEl, el, path)
        out["snippet"] := built["snippet"]
        out["snippetStrategy"] := built["strategy"]
        out["snippetVerified"] := built["verified"]
    } catch as e
        out["snippet"] := ""

    return out
}

BuildAncestorLines(rootEl, path) {
    local lines := [], prefix := [], step := "", el := "", i := 0
    for step in path {
        prefix.Push(step)
        el := UiaPath.Resolve(rootEl, prefix)
        if !IsObject(el)
            continue
        lines.Push(FormatNode(el, i, UiaPath.ToString(prefix)))
        i++
    }
    return lines
}

GetCursorPos() {
    local x := 0, y := 0
    CoordMode("Mouse", "Screen")
    MouseGetPos(&x, &y)
    return Map("x", x, "y", y)
}

OpHighlight(request) {
    local hwnd := ResolveWindow(request)
    local durationMs := Integer(GetParam(request, "durationMs", 2000))
    local rootEl := RootElementFor(hwnd)
    local target := "", el := "", path := [], rect := "", out := Map()

    if (durationMs < 100 || durationMs > 15000)
        Fail("BAD_REQUEST", "durationMs must be between 100 and 15000, got " durationMs
            , "2000 is a good default - long enough to see, short enough not to block.")

    AssertTreeReadable(hwnd, rootEl)
    target := ResolveTarget(request, hwnd, rootEl)
    el := target["el"]
    path := target["path"]
    rect := UiaProps.SafeRect(el)

    if !IsObject(rect)
        Fail("NO_BOUNDS", "The resolved element reports no bounding rectangle."
            , "Offscreen or zero-size elements cannot be highlighted. Check the 'offscreen' flag via uia_element.")

    DrawBorder(rect, durationMs)

    out := UiaProps.CoreProps(el)
    out["hwnd"] := hwnd
    out["path"] := UiaPath.ToString(path)
    out["rect"] := rect
    out["durationMs"] := durationMs
    out["highlighted"] := Json.True
    State["nodeCount"]++
    return out
}

; Click-through, always-on-top border. WS_EX_TRANSPARENT plus WS_EX_NOACTIVATE means the
; overlay cannot steal focus or swallow a click, and the region carves out the interior so
; only the frame is ever painted over the target.
DrawBorder(rect, durationMs) {
    local thickness := 3
    local x := rect["l"] - thickness, y := rect["t"] - thickness
    local w := rect["w"] + thickness * 2, h := rect["h"] + thickness * 2
    local inner := thickness, iw := rect["w"] + thickness, ih := rect["h"] + thickness
    local overlay := Gui("+AlwaysOnTop -Caption +ToolWindow -DPIScale +E0x08000020")

    overlay.BackColor := "Red"
    WinSetRegion("0-0 " w "-0 " w "-" h " 0-" h " 0-0 "
        . inner "-" inner " " iw "-" inner " " iw "-" ih " " inner "-" ih " " inner "-" inner, overlay.Hwnd)
    overlay.Show("NA x" x " y" y " w" w " h" h)
    Sleep(durationMs)
    try overlay.Destroy()
    catch as e
        return
}
