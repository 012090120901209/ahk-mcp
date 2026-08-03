#Requires AutoHotkey v2.1-alpha.30

; Minimal JSON encoder/decoder. The alpha.30+Console fork has no JSON built-in and the
; inspector must stay self-contained, so this ships with it rather than pulling a Lib
; dependency from another repo.
;
; Encoding maps: Map -> object, Array -> array, JsonRaw -> verbatim text (used for
; true/false/null), Integer/Float -> number, everything else -> string.

class JsonRaw {
    Text := ""
    __New(text) {
        this.Text := text
    }
}

class Json {
    static True => JsonRaw("true")
    static False => JsonRaw("false")
    static Null => JsonRaw("null")

    static Bool(v) => v ? JsonRaw("true") : JsonRaw("false")

    static Stringify(value) {
        local out := ""
        if (value is JsonRaw)
            return value.Text
        if (value is Map) {
            out := "{"
            for k, v in value
                out .= (StrLen(out) > 1 ? "," : "") '"' Json.EscapeString(String(k)) '":' Json.Stringify(v)
            return out "}"
        }
        if (value is Array) {
            out := "["
            for v in value
                out .= (StrLen(out) > 1 ? "," : "") Json.Stringify(v)
            return out "]"
        }
        if (value is Integer)
            return String(value)
        if (value is Float) {
            ; JSON has no NaN/Infinity; degrade to null rather than emit invalid output.
            if (value != value || Abs(value) = 9223372036854775807)
                return "null"
            return String(value)
        }
        return '"' Json.EscapeString(String(value)) '"'
    }

    static EscapeString(s) {
        local out := "", ch := "", code := 0
        s := StrReplace(s, "\", "\\")
        s := StrReplace(s, '"', '\"')
        s := StrReplace(s, "`n", "\n")
        s := StrReplace(s, "`r", "\r")
        s := StrReplace(s, "`t", "\t")
        s := StrReplace(s, Chr(8), "\b")
        s := StrReplace(s, Chr(12), "\f")
        ; Remaining C0 control characters are rare, so only pay for the scan when present.
        if !RegExMatch(s, "[\x00-\x1F]")
            return s
        loop StrLen(s) {
            ch := SubStr(s, A_Index, 1)
            code := Ord(ch)
            out .= (code < 0x20) ? Format("\u{:04x}", code) : ch
        }
        return out
    }

    static Parse(text) {
        local parser := Json.Parser(text)
        return parser.ParseValue()
    }

    class Parser {
        Text := ""
        Pos := 1
        Len := 0

        __New(text) {
            this.Text := text
            this.Len := StrLen(text)
        }

        SkipWhitespace() {
            local ch := ""
            while (this.Pos <= this.Len) {
                ch := SubStr(this.Text, this.Pos, 1)
                if (ch != " " && ch != "`t" && ch != "`n" && ch != "`r")
                    break
                this.Pos++
            }
        }

        Fail(what) {
            throw ValueError("Malformed JSON: " what " at position " this.Pos, -1)
        }

        ParseValue() {
            local ch := ""
            this.SkipWhitespace()
            if (this.Pos > this.Len)
                this.Fail("unexpected end of input")
            ch := SubStr(this.Text, this.Pos, 1)
            if (ch = "{")
                return this.ParseObject()
            if (ch = "[")
                return this.ParseArray()
            if (ch = '"')
                return this.ParseString()
            if (SubStr(this.Text, this.Pos, 4) = "true") {
                this.Pos += 4
                return true
            }
            if (SubStr(this.Text, this.Pos, 5) = "false") {
                this.Pos += 5
                return false
            }
            if (SubStr(this.Text, this.Pos, 4) = "null") {
                this.Pos += 4
                return ""
            }
            return this.ParseNumber()
        }

        ParseObject() {
            local result := Map(), key := "", ch := ""
            this.Pos++
            this.SkipWhitespace()
            if (SubStr(this.Text, this.Pos, 1) = "}") {
                this.Pos++
                return result
            }
            loop {
                this.SkipWhitespace()
                if (SubStr(this.Text, this.Pos, 1) != '"')
                    this.Fail("expected object key")
                key := this.ParseString()
                this.SkipWhitespace()
                if (SubStr(this.Text, this.Pos, 1) != ":")
                    this.Fail("expected ':'")
                this.Pos++
                result[key] := this.ParseValue()
                this.SkipWhitespace()
                ch := SubStr(this.Text, this.Pos, 1)
                this.Pos++
                if (ch = "}")
                    return result
                if (ch != ",")
                    this.Fail("expected ',' or '}'")
            }
        }

        ParseArray() {
            local result := [], ch := ""
            this.Pos++
            this.SkipWhitespace()
            if (SubStr(this.Text, this.Pos, 1) = "]") {
                this.Pos++
                return result
            }
            loop {
                result.Push(this.ParseValue())
                this.SkipWhitespace()
                ch := SubStr(this.Text, this.Pos, 1)
                this.Pos++
                if (ch = "]")
                    return result
                if (ch != ",")
                    this.Fail("expected ',' or ']'")
            }
        }

        ParseString() {
            local out := "", ch := "", esc := "", hex := ""
            this.Pos++
            loop {
                if (this.Pos > this.Len)
                    this.Fail("unterminated string")
                ch := SubStr(this.Text, this.Pos, 1)
                this.Pos++
                if (ch = '"')
                    return out
                if (ch != "\") {
                    out .= ch
                    continue
                }
                esc := SubStr(this.Text, this.Pos, 1)
                this.Pos++
                switch esc {
                    case '"': out .= '"'
                    case "\": out .= "\"
                    case "/": out .= "/"
                    case "b": out .= Chr(8)
                    case "f": out .= Chr(12)
                    case "n": out .= "`n"
                    case "r": out .= "`r"
                    case "t": out .= "`t"
                    case "u":
                        hex := SubStr(this.Text, this.Pos, 4)
                        if !RegExMatch(hex, "^[0-9a-fA-F]{4}$")
                            this.Fail("bad \u escape")
                        this.Pos += 4
                        out .= Chr(Integer("0x" hex))
                    default: this.Fail("unknown escape '\" esc "'")
                }
            }
        }

        ParseNumber() {
            local start := this.Pos, text := ""
            if (SubStr(this.Text, this.Pos, 1) = "-")
                this.Pos++
            while (this.Pos <= this.Len && RegExMatch(SubStr(this.Text, this.Pos, 1), "[0-9]"))
                this.Pos++
            if (SubStr(this.Text, this.Pos, 1) = ".") {
                this.Pos++
                while (this.Pos <= this.Len && RegExMatch(SubStr(this.Text, this.Pos, 1), "[0-9]"))
                    this.Pos++
            }
            if (RegExMatch(SubStr(this.Text, this.Pos, 1), "[eE]")) {
                this.Pos++
                if (RegExMatch(SubStr(this.Text, this.Pos, 1), "[+-]"))
                    this.Pos++
                while (this.Pos <= this.Len && RegExMatch(SubStr(this.Text, this.Pos, 1), "[0-9]"))
                    this.Pos++
            }
            text := SubStr(this.Text, start, this.Pos - start)
            if (text = "" || text = "-")
                this.Fail("expected a number")
            return InStr(text, ".") || RegExMatch(text, "[eE]") ? Float(text) : Integer(text)
        }
    }
}
