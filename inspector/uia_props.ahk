#Requires AutoHotkey v2.1-alpha.30

; Whitelisted property access and read-only pattern probing.
;
; Every accessor here swallows COM failures and returns a neutral value: a UIA tree is
; live and elements disappear mid-walk, so a throw on one node must never abort a whole
; response. Nothing in this file invokes a control pattern - only property reads.

class UiaProps {
    ; Token discipline: this is the whole set carried on a tree node.
    static Whitelist := ["Name", "AutomationId", "ControlType", "ClassName", "enabled", "offscreen"]

    static SafeGet(el, prop) {
        local value := ""
        try value := el.%prop%
        catch
            return ""
        return value = "" ? "" : String(value)
    }

    static SafeType(el) {
        local t := 0
        try t := el.Type
        catch
            return 0
        return t
    }

    static SafeTypeName(el) {
        local t := UiaProps.SafeType(el)
        if (t = 0)
            return "Unknown"
        try return UIA.Type[t]
        catch
            return "Type" t
    }

    static SafeChildren(el) {
        local kids := ""
        try kids := el.GetChildren()
        catch
            return []
        return IsObject(kids) ? kids : []
    }

    static SafeBool(el, propertyId) {
        local v := ""
        try v := el.GetPropertyValue(propertyId)
        catch
            return 0
        return (v = "" || v = 0) ? 0 : 1
    }

    ; Not every AutomationId survives a restart. Chromium hosts mint ordinal ids like
    ; "view_4" and WinUI emits bare integers; both shift when the tree is rebuilt, so a
    ; selector keyed on them would resolve today and silently break tomorrow.
    static IsStableAutomationId(aid) {
        if (aid = "")
            return 0
        if IsInteger(aid)
            return 0
        if RegExMatch(aid, "i)^view_?\d+$")
            return 0
        if RegExMatch(aid, "i)^\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?$")
            return 0
        return 1
    }

    ; HTML elements report their whole CSS class list as ClassName - hundreds of
    ; characters of utility classes that churn on every redeploy. Useless as a selector
    ; and ruinous for the byte budget, so it is not allowed to discriminate a path step.
    static IsStableClassName(cn) {
        if (cn = "" || StrLen(cn) > 40)
            return 0
        return InStr(cn, " ") ? 0 : 1
    }

    static SafeRect(el) {
        local loc := "", rect := Map()
        try loc := el.BoundingRectangle
        catch
            return ""
        if !IsObject(loc)
            return ""
        rect["l"] := loc.l
        rect["t"] := loc.t
        rect["r"] := loc.r
        rect["b"] := loc.b
        rect["w"] := loc.r - loc.l
        rect["h"] := loc.b - loc.t
        return rect
    }

    static Truncate(text, maxLen) {
        if (StrLen(text) <= maxLen)
            return text
        return SubStr(text, 1, maxLen - 1) "…"
    }

    ; A node is "interactive" if a user could act on it. Pattern availability is the
    ; reliable signal; control type is a fallback for providers that under-report.
    static IsInteractive(el) {
        static interactiveTypes := "|50000|50002|50003|50004|50005|50011|50013|50015|50019|50024|50031|50007|"
        local typeId := 0
        if (UiaProps.SafeBool(el, 30031) || UiaProps.SafeBool(el, 30041)
            || UiaProps.SafeBool(el, 30036) || UiaProps.SafeBool(el, 30028)
            || UiaProps.SafeBool(el, 30043))
            return 1
        if (UiaProps.SafeBool(el, 30009))
            return 1
        typeId := UiaProps.SafeType(el)
        return InStr(interactiveTypes, "|" typeId "|") ? 1 : 0
    }

    ; The boundary where a native shell hands off to rendered web content - the render
    ; widget host, or the Document that roots the DOM. Deliberately narrow: in an Electron
    ; or WebView2 app every native View also reports FrameworkId=Chrome, so matching on
    ; that alone would flag the whole window and shrink the budget at every level.
    static IsWebContentHost(el) {
        local cn := UiaProps.SafeGet(el, "ClassName"), fw := ""
        if (InStr(cn, "Chrome_RenderWidgetHostHWND") || InStr(cn, "WebView2"))
            return 1
        if (UiaProps.SafeType(el) != 50030)
            return 0
        try fw := el.GetPropertyValue(30024)
        catch
            fw := ""
        return (fw = "Chrome" || fw = "Edge") ? 1 : 0
    }

    static StateFlags(el) {
        local flags := ""
        if !UiaProps.SafeBool(el, 30010)
            flags .= (flags = "" ? "" : ",") "disabled"
        if UiaProps.SafeBool(el, 30022)
            flags .= (flags = "" ? "" : ",") "offscreen"
        if UiaProps.SafeBool(el, 30009)
            flags .= (flags = "" ? "" : ",") "focusable"
        return flags
    }

    static CoreProps(el) {
        local out := Map()
        out["controlType"] := UiaProps.SafeTypeName(el)
        out["name"] := UiaProps.SafeGet(el, "Name")
        out["automationId"] := UiaProps.SafeGet(el, "AutomationId")
        out["className"] := UiaProps.SafeGet(el, "ClassName")
        out["enabled"] := Json.Bool(UiaProps.SafeBool(el, 30010))
        out["offscreen"] := Json.Bool(UiaProps.SafeBool(el, 30022))
        return out
    }

    ; Read-only pattern report. Availability comes from Is*PatternAvailable properties and
    ; live state from plain property reads - no pattern object is ever obtained or called,
    ; so this cannot press a button, toggle a switch, or delete anything.
    static Patterns(el) {
        local out := Map(), state := Map()

        if UiaProps.SafeBool(el, 30031)
            out["Invoke"] := Map("available", Json.True)

        if UiaProps.SafeBool(el, 30043) {
            state := Map()
            state["available"] := Json.True
            state["value"] := UiaProps.SafeGet(el, "Value")
            state["isReadOnly"] := Json.Bool(UiaProps.SafeBool(el, 30046))
            out["Value"] := state
        }

        if UiaProps.SafeBool(el, 30041) {
            state := Map()
            state["available"] := Json.True
            state["toggleState"] := UiaProps.ToggleStateName(el)
            out["Toggle"] := state
        }

        if UiaProps.SafeBool(el, 30036) {
            state := Map()
            state["available"] := Json.True
            state["isSelected"] := Json.Bool(UiaProps.SafeBool(el, 30079))
            out["SelectionItem"] := state
        }

        if UiaProps.SafeBool(el, 30028) {
            state := Map()
            state["available"] := Json.True
            state["expandCollapseState"] := UiaProps.ExpandStateName(el)
            out["ExpandCollapse"] := state
        }

        if UiaProps.SafeBool(el, 30034) {
            state := Map()
            state["available"] := Json.True
            state["horizontallyScrollable"] := Json.Bool(UiaProps.SafeBool(el, 30057))
            state["verticallyScrollable"] := Json.Bool(UiaProps.SafeBool(el, 30058))
            state["horizontalPercent"] := UiaProps.SafeGet(el, "ScrollHorizontalScrollPercent")
            state["verticalPercent"] := UiaProps.SafeGet(el, "ScrollVerticalScrollPercent")
            out["Scroll"] := state
        }

        if UiaProps.SafeBool(el, 30090) {
            state := Map()
            state["available"] := Json.True
            state["name"] := UiaProps.SafeGet(el, "LegacyIAccessibleName")
            state["value"] := UiaProps.SafeGet(el, "LegacyIAccessibleValue")
            state["defaultAction"] := UiaProps.SafeGet(el, "LegacyIAccessibleDefaultAction")
            out["LegacyIAccessible"] := state
        }

        return out
    }

    static ToggleStateName(el) {
        local v := ""
        try v := el.GetPropertyValue(30086)
        catch
            return "unknown"
        switch v {
            case 0: return "Off"
            case 1: return "On"
            case 2: return "Indeterminate"
            default: return "unknown"
        }
    }

    static ExpandStateName(el) {
        local v := ""
        try v := el.GetPropertyValue(30070)
        catch
            return "unknown"
        switch v {
            case 0: return "Collapsed"
            case 1: return "Expanded"
            case 2: return "PartiallyExpanded"
            case 3: return "LeafNode"
            default: return "unknown"
        }
    }
}
