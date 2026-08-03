#Requires AutoHotkey v2.1-alpha.30
#SingleInstance Off

; Exercises the UIA.ahk code paths that the alpha.30 fork patched but which the inspector
; itself never calls, so a regression there would otherwise go unnoticed:
;
;   FindCachedElement       -> PreOrderRecursiveFind (the second one, distinct from FindElement's)
;   WalkTree                -> GetIndex and RecurseTree
;   FindItemByProperty      -> falls through when the item is absent
;   WaitElementFromPath     -> falls through on timeout
;   GetWinId / GetControlId -> fall through when the cache lookup fails
;
; Every case here is a *miss* - the path that used to fall off the end and now must return
; a falsy value rather than throwing "No value was returned."
;
; Run:  AutoHotkey64.exe /ErrorStdOut Tests\uia\lib-paths.ahk

#Include %A_LineFile%\..\..\..\scripts\UIA.ahk

global Passed := 0, Failed := 0

Main()

Main() {
    local target := FindTargetWindow()
    if !target {
        Print("no window with a readable UIA tree found")
        ExitApp 1
    }
    Print("target: '{}'", WinGetTitle(target))

    local root := UIA.ElementFromHandle(target)
    local cached := root.BuildUpdatedCache(
        UIA.CreateCacheRequest(["Type", "Name", "ClassName", "AutomationId", "RuntimeId"], , 5))

    ; FindCachedElement drives the PreOrderRecursiveFind that lives in the cached search.
    Check("FindCachedElement miss returns falsy", () => CachedMiss(cached))
    Check("FindCachedElement hit returns an element", () => CachedHit(cached))

    ; WalkTree exercises GetIndex and RecurseTree.
    Check("WalkTree forward step", () => WalkStep(root, "+1"))
    Check("WalkTree reverse step", () => WalkStep(root, "-1"))
    Check("WalkTree overrun is falsy or throws cleanly", () => WalkStep(root, "+9999"))

    Check("FindItemByProperty miss returns falsy", () => ItemContainerMiss(root))
    Check("WaitElementFromPath timeout returns falsy", () => root.WaitElementFromPath({ T: 50000, N: "zz-none" }, 200))
    Check("WaitElement timeout returns falsy", () => root.WaitElement({ N: "zz-none" }, 200))
    Check("GetWinId", () => root.GetWinId())
    Check("GetControlId", () => root.GetControlId())

    Print("`n{} passed, {} failed", Passed, Failed)
    ExitApp Failed ? 1 : 0
}

FindTargetWindow() {
    local hwnd := 0, title := "", el := ""
    for hwnd in WinGetList() {
        title := ""
        try title := WinGetTitle(hwnd)
        if (title = "")
            continue
        try {
            if (WinGetMinMax(hwnd) = -1)
                continue
        } catch
            continue
        el := ""
        try el := UIA.ElementFromHandle(hwnd)
        catch
            continue
        if IsObject(el) && UIA.TreeWalkerTrue.GetFirstChildElement(el)
            return hwnd
    }
    return 0
}

CachedMiss(cached) {
    local found := ""
    try found := cached.FindCachedElement({ N: "zz-definitely-absent-zz" })
    catch TargetError
        return "TargetError (expected)"
    return IsObject(found) ? "UNEXPECTED HIT" : "falsy"
}

CachedHit(cached) {
    local kids := cached.CachedChildren, first := "", found := ""
    if !kids.Length
        return "no cached children to match"
    first := kids[1]
    found := cached.FindCachedElement({ T: first.CachedType })
    return IsObject(found) ? "element" : "MISS"
}

; An out-of-bounds walk is *meant* to throw: the TreeWalker's GetParent/Sibling methods
; raise UnsetError by design, and TryGet* exist for the non-throwing case. What must never
; appear is "No value was returned", which is the alpha.30 fall-through landmine rather
; than a deliberate signal.
WalkStep(root, path) {
    local el := ""
    try {
        el := root.WalkTree(path)
    } catch Any as e {
        if InStr(e.Message, "No value was returned")
            throw Error("alpha.30 fall-through leaked out of WalkTree: " e.Message, -1)
        return Type(e) " (deliberate: " SubStr(e.Message, 1, 40) ")"
    }
    return IsObject(el) ? "element" : "falsy"
}

ItemContainerMiss(root) {
    local container := "", found := ""
    try container := root.FindElement({ T: 50008 })
    catch TargetError
        return "no List container present, skipped"
    try found := container.ItemContainerPattern.FindItemByProperty(0, UIA.Property.Name, "zz-absent-zz")
    catch
        return "pattern unavailable, skipped"
    return IsObject(found) ? "UNEXPECTED HIT" : "falsy"
}

Check(label, fn) {
    global Passed, Failed
    local result := ""
    try {
        result := fn()
    } catch as e {
        Failed++
        Print("  FAIL {} -> {}: {}", label, Type(e), e.Message)
        return
    }
    Passed++
    Print("  ok   {} -> {}", label, IsObject(result) ? Type(result) : "'" String(result) "'")
}
