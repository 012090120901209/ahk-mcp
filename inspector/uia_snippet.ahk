#Requires AutoHotkey v2.1-alpha.30

; Paste-ready AHK v2 selector codegen.
;
; Strategy order is AutomationId, then Name+ControlType, then a full path walk. Each
; candidate is executed against the live tree before it is emitted, and compared back to
; the element it claims to select - a snippet that resolves to nothing, or to a different
; element, is never returned.

class UiaSnippet {
    static EscapeAhk(text) {
        text := StrReplace(text, "``", "````")
        text := StrReplace(text, '"', '`"')
        text := StrReplace(text, "`r", "``r")
        text := StrReplace(text, "`n", "``n")
        text := StrReplace(text, "`t", "``t")
        return text
    }

    static WinTitleExpr(hwnd) {
        local exe := "", title := ""
        try exe := WinGetProcessName(hwnd)
        catch
            exe := ""
        try title := WinGetTitle(hwnd)
        catch
            title := ""
        if (exe != "" && title != "")
            return '"' UiaSnippet.EscapeAhk(title) ' ahk_exe ' UiaSnippet.EscapeAhk(exe) '"'
        if (exe != "")
            return '"ahk_exe ' UiaSnippet.EscapeAhk(exe) '"'
        return '"ahk_id ' Format("0x{:X}", hwnd) '"'
    }

    ; Returns Map(snippet, strategy, verified) - verified is always true on success.
    ; Throws only if no strategy resolves, which the caller reports as a hard failure.
    static Build(hwnd, rootEl, targetEl, path) {
        local aid := UiaProps.SafeGet(targetEl, "AutomationId")
        local name := UiaProps.SafeGet(targetEl, "Name")
        local typeId := UiaProps.SafeType(targetEl)
        local winExpr := UiaSnippet.WinTitleExpr(hwnd)
        local header := "hwnd := WinExist(" winExpr ")`nel := UIA.ElementFromHandle(hwnd)"
        local cond := "", body := ""

        if UiaProps.IsStableAutomationId(aid) {
            cond := '{A: "' UiaSnippet.EscapeAhk(aid) '"}'
            if UiaSnippet.Verify(rootEl, targetEl, "condition", cond)
                return UiaSnippet.Result(header "." "FindElement(" cond ")", "automationId", cond)
        }

        if (name != "" && typeId != 0) {
            cond := "{T: " typeId ', N: "' UiaSnippet.EscapeAhk(name) '"}'
            if UiaSnippet.Verify(rootEl, targetEl, "condition", cond)
                return UiaSnippet.Result(header "." "FindElement(" cond ")", "nameAndType", cond)
        }

        if (path.Length > 0) {
            cond := UiaPath.ToConditionLiteral(path)
            if UiaSnippet.Verify(rootEl, targetEl, "path", path)
                return UiaSnippet.Result(header "." "ElementFromPath(" cond ")", "path", cond)
        }

        throw Error("No selector strategy resolved back to this element", -1
            , "The element may be transient, or its provider may report unstable properties.")
    }

    static Result(snippet, strategy, selector) {
        local out := Map()
        out["snippet"] := snippet
        out["strategy"] := strategy
        out["selector"] := selector
        out["verified"] := Json.True
        return out
    }

    ; Execute the candidate selector for real and confirm it lands on the same element.
    static Verify(rootEl, targetEl, kind, spec) {
        local found := ""
        if (kind = "path") {
            found := UiaPath.Resolve(rootEl, spec)
            return IsObject(found) && UiaSnippet.Same(found, targetEl)
        }
        try found := rootEl.FindElement(UiaSnippet.ParseCondition(spec))
        catch
            return 0
        return IsObject(found) && UiaSnippet.Same(found, targetEl)
    }

    static Same(a, b) {
        try return UIA.CompareElements(a, b) ? 1 : 0
        catch
            return 0
    }

    ; The emitted snippet text is the contract, so verification parses that same text back
    ; into a condition rather than trusting a parallel object built by hand.
    static ParseCondition(literal) {
        local cond := {}, m := ""
        if RegExMatch(literal, '^\{A: "(.*)"\}$', &m) {
            cond.A := UiaSnippet.UnescapeAhk(m[1])
            return cond
        }
        if RegExMatch(literal, '^\{T: (\d+), N: "(.*)"\}$', &m) {
            cond.T := Integer(m[1])
            cond.N := UiaSnippet.UnescapeAhk(m[2])
            return cond
        }
        throw ValueError("Unrecognised condition literal: " literal, -1)
    }

    static UnescapeAhk(text) {
        text := StrReplace(text, "``n", "`n")
        text := StrReplace(text, "``r", "`r")
        text := StrReplace(text, "``t", "`t")
        text := StrReplace(text, '`"', '"')
        text := StrReplace(text, "````", "``")
        return text
    }
}
