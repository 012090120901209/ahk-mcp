#Requires AutoHotkey v2.1-alpha.30

; Property-chain paths. RuntimeIds die with the process, so a path is an ordered list of
; sibling-scoped conditions that re-resolve after the target app restarts.
;
; String form is one compact token per node, which is what the tree op emits:
;   Window/TitleBar/Button#Close
;   Pane$NavigationView/Group"Recordings":2/ListItem#item3
;
; A segment is  TypeName [ '#'AutomationId | '$'ClassName | '"'Name'"' ] [ ':'index ]
; The discriminator characters / : " # $ % are percent-encoded inside a value so the
; grammar stays unambiguous without sacrificing readability in the common case.

class UiaPath {
    static Reserved := '/:"#$%'

    static Encode(value) {
        local out := "", ch := ""
        if (value = "")
            return ""
        if !RegExMatch(value, "[/:`"#$%]")
            return value
        loop StrLen(value) {
            ch := SubStr(value, A_Index, 1)
            out .= InStr(UiaPath.Reserved, ch) ? Format("%{:02X}", Ord(ch)) : ch
        }
        return out
    }

    static Decode(value) {
        local out := "", i := 1, len := StrLen(value), ch := ""
        while (i <= len) {
            ch := SubStr(value, i, 1)
            if (ch = "%" && RegExMatch(SubStr(value, i + 1, 2), "^[0-9A-Fa-f]{2}$")) {
                out .= Chr(Integer("0x" SubStr(value, i + 1, 2)))
                i += 3
                continue
            }
            out .= ch
            i++
        }
        return out
    }

    ; step: Map with typeId, and at most one of automationId / className / name, plus index.
    static StepToString(step) {
        local out := UIA.Type[step["typeId"]]
        if (step.Has("automationId") && step["automationId"] != "")
            out .= "#" UiaPath.Encode(step["automationId"])
        else if (step.Has("className") && step["className"] != "")
            out .= "$" UiaPath.Encode(step["className"])
        else if (step.Has("name") && step["name"] != "")
            out .= '"' UiaPath.Encode(step["name"]) '"'
        if (step["index"] > 1)
            out .= ":" step["index"]
        return out
    }

    static ToString(path) {
        local out := ""
        for step in path
            out .= (out = "" ? "" : "/") UiaPath.StepToString(step)
        return out
    }

    static FromString(text) {
        local path := [], segment := "", m := "", step := Map()
        if (text = "")
            return path
        for segment in StrSplit(text, "/") {
            if (segment = "")
                continue
            if !RegExMatch(segment, '^([A-Za-z]+)(?:#([^:]*)|\$([^:]*)|"([^"]*)")?(?::(-?\d+))?$', &m)
                throw ValueError("Malformed path segment: " segment, -1)
            if !UIA.Type.HasOwnProp(m[1])
                throw ValueError("Unknown control type in path: " m[1], -1)
            step := Map()
            step["typeId"] := UIA.Type.%m[1]%
            step["automationId"] := m[2] != "" ? UiaPath.Decode(m[2]) : ""
            step["className"] := m[3] != "" ? UiaPath.Decode(m[3]) : ""
            step["name"] := m[4] != "" ? UiaPath.Decode(m[4]) : ""
            step["index"] := m[5] != "" ? Integer(m[5]) : 1
            path.Push(step)
        }
        return path
    }

    ; Structured form for single-element responses, where verbosity is affordable.
    static ToArray(path) {
        local out := [], step := "", entry := Map()
        for step in path {
            entry := Map()
            entry["controlType"] := UIA.Type[step["typeId"]]
            if (step.Has("automationId") && step["automationId"] != "")
                entry["automationId"] := step["automationId"]
            if (step.Has("className") && step["className"] != "")
                entry["className"] := step["className"]
            if (step.Has("name") && step["name"] != "")
                entry["name"] := step["name"]
            entry["index"] := step["index"]
            out.Push(entry)
        }
        return out
    }

    ; AHK condition literal for generated snippets, e.g. {T:50032}, {T:50000, A:"Close"}
    static ToConditionLiteral(path) {
        local out := "", step := "", part := ""
        for step in path {
            part := "{T:" step["typeId"]
            if (step.Has("automationId") && step["automationId"] != "")
                part .= ', A:"' UiaSnippet.EscapeAhk(step["automationId"]) '"'
            else if (step.Has("className") && step["className"] != "")
                part .= ', CN:"' UiaSnippet.EscapeAhk(step["className"]) '"'
            else if (step.Has("name") && step["name"] != "")
                part .= ', N:"' UiaSnippet.EscapeAhk(step["name"]) '"'
            if (step["index"] > 1)
                part .= ", i:" step["index"]
            out .= (out = "" ? "" : ", ") part "}"
        }
        return out
    }

    ; Build the discriminating step for `child` among its `siblings` (raw view order).
    ; Prefers AutomationId, then ClassName, then Name, then bare type - matching the
    ; vendored library's own strategy but computed inline during the walk.
    static BuildStep(child, siblings) {
        local step := Map(), typeId := 0, aid := "", cn := "", nm := ""
        local sib := "", index := 0, sTypeId := 0, sameType := 0

        typeId := UiaProps.SafeType(child)
        aid := UiaProps.SafeGet(child, "AutomationId")
        cn := UiaProps.SafeGet(child, "ClassName")
        nm := UiaProps.SafeGet(child, "Name")

        step["typeId"] := typeId
        step["automationId"] := ""
        step["className"] := ""
        step["name"] := ""

        sameType := 0
        for sib in siblings {
            if (UiaProps.SafeType(sib) = typeId)
                sameType++
        }

        ; Only spend characters on a discriminator when the bare control type is ambiguous.
        ; Deep native chains are mostly single-child wrappers, so this keeps a path segment
        ; at "Pane" rather than "Pane$ChromeNodeFrameView", and a lone child stays valid
        ; even if its ClassName is renamed between releases.
        if (sameType = 1) {
            step["index"] := 1
            return step
        }

        if UiaProps.IsStableAutomationId(aid)
            step["automationId"] := aid
        else if (nm != "" && StrLen(nm) <= 60)
            step["name"] := nm
        else if UiaProps.IsStableClassName(cn)
            step["className"] := cn

        index := 0
        for sib in siblings {
            sTypeId := UiaProps.SafeType(sib)
            if (sTypeId != typeId)
                continue
            if (step["automationId"] != "" && UiaProps.SafeGet(sib, "AutomationId") != step["automationId"])
                continue
            if (step["className"] != "" && UiaProps.SafeGet(sib, "ClassName") != step["className"])
                continue
            if (step["name"] != "" && UiaProps.SafeGet(sib, "Name") != step["name"])
                continue
            index++
            if (UIA.CompareElements(sib, child))
                break
        }
        step["index"] := index < 1 ? 1 : index
        return step
    }

    ; Resolve a path with the same raw-view enumeration used to build it, so builder and
    ; resolver can never disagree about which sibling index a step refers to.
    static Resolve(rootEl, path) {
        local el := rootEl, step := "", children := "", candidate := ""
        local matched := 0, sTypeId := 0
        for step in path {
            children := UiaProps.SafeChildren(el)
            matched := 0
            el := ""
            for candidate in children {
                sTypeId := UiaProps.SafeType(candidate)
                if (sTypeId != step["typeId"])
                    continue
                if (step["automationId"] != "" && UiaProps.SafeGet(candidate, "AutomationId") != step["automationId"])
                    continue
                if (step["className"] != "" && UiaProps.SafeGet(candidate, "ClassName") != step["className"])
                    continue
                if (step["name"] != "" && UiaProps.SafeGet(candidate, "Name") != step["name"])
                    continue
                if (++matched = step["index"]) {
                    el := candidate
                    break
                }
            }
            if !IsObject(el)
                return 0
        }
        return el
    }
}
