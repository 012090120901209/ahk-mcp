# AutoHotkey v2 Common Issues - Memory

## Syntax Migration Issues

### Expression vs Statement Mode
**v1 Problem**: Mixed expression and statement modes caused confusion
**v2 Solution**: Everything is an expression now
```ahk
; WRONG (v1 style)
if var = value

; CORRECT (v2)
if (var = "value")
if (var == value)  ; numeric comparison
```

### String Concatenation
**Common Issue**: Using `.` operator incorrectly
```ahk
; WRONG
result := "Hello" . " " . "World"  ; Works but verbose

; BETTER (v2 native)
result := "Hello" " World"  ; Auto-concatenation
result := `Hello World`     ; Backtick quotes
```

### Assignment Operators
**Common Issue**: Using `:=` vs `=`
```ahk
; WRONG
var = "value"  ; v1 style - will error in v2

; CORRECT
var := "value"  ; Always use := in v2
```

## Function Definition Issues

### Function Declarations
**Common Issue**: Missing parentheses or fat arrow confusion
```ahk
; WRONG
MyFunc {  ; Missing ()
    return "value"
}

; CORRECT
MyFunc() {
    return "value"
}

; Fat arrow for simple returns
MyFunc() => "value"
```

### ByRef Parameters
**Common Issue**: v1 ByRef syntax no longer works
```ahk
; WRONG (v1)
MyFunc(ByRef var)

; CORRECT (v2)
MyFunc(&var)
```

### Default Parameter Values
**Common Issue**: Forgetting to handle optional parameters
```ahk
; GOOD - with defaults
MyFunc(required, optional := "default") {
    ; Use optional
}
```

## Object and Class Issues

### Property Access
**Common Issue**: Bracket notation vs dot notation
```ahk
; Both work, but be consistent
obj.property := "value"  ; Dot notation
obj["property"] := "value"  ; Bracket notation

; Use bracket for dynamic keys
key := "property"
obj[key] := "value"
```

### Class Constructors
**Common Issue**: Wrong constructor syntax
```ahk
; WRONG
class MyClass {
    __New() {  ; v1 style
    }
}

; CORRECT (v2)
class MyClass {
    __New() {  ; Same syntax, but different behavior
        super.__New()  ; Call parent if inheriting
    }
}
```

### Method Definitions
**Common Issue**: Missing 'this' keyword
```ahk
class MyClass {
    property := "value"

    ; WRONG
    GetValue() {
        return property  ; Undefined!
    }

    ; CORRECT
    GetValue() {
        return this.property
    }
}
```

## GUI Issues

### GUI Creation
**Common Issue**: v1 GUI syntax doesn't work
```ahk
; WRONG (v1)
Gui, Add, Text, , Hello

; CORRECT (v2)
myGui := Gui()
myGui.Add("Text", , "Hello")
myGui.Show()
```

### Control References
**Common Issue**: How to reference controls
```ahk
; GOOD - Save control references
myEdit := myGui.Add("Edit", "w200")
value := myEdit.Value  ; Access control properties

; GOOD - Use control name
myGui.Add("Edit", "w200 vMyEdit")
value := myGui["MyEdit"].Value
```

### Event Handlers
**Common Issue**: Wrong callback syntax
```ahk
; WRONG (v1 style)
myButton := myGui.Add("Button", , "Click Me")
myButton.OnEvent("Click", "MyHandler")  ; String handler

; CORRECT (v2)
myButton.OnEvent("Click", MyHandler)  ; Function reference
myButton.OnEvent("Click", (*) => MsgBox("Clicked!"))  ; Fat arrow

MyHandler(*) {  ; Accept any parameters
    MsgBox("Button clicked!")
}
```

## Variable Scope Issues

### Global vs Local
**Common Issue**: Variables not accessible where expected
```ahk
; WRONG - Implicit global in function
MyFunc() {
    myVar := "value"  ; Local to function
}
MyFunc()
MsgBox(myVar)  ; Error! Undefined

; CORRECT - Explicit global
global myVar := "value"  ; At top level

MyFunc() {
    global myVar  ; Declare global usage
    myVar := "value"
}
```

### Super-Global Declarations
**Common Issue**: Variables need to be declared super-global for cross-function access
```ahk
; At script top
global myGlobal := "value"

MyFunc1() {
    global myGlobal
    MsgBox(myGlobal)  ; Works
}
```

## COM Object Issues

### ComObject Creation
**Common Issue**: Wrong COM creation syntax
```ahk
; WRONG (v1)
obj := ComObjCreate("Excel.Application")

; CORRECT (v2)
obj := ComObject("Excel.Application")
```

### Property Access
**Common Issue**: Accessing COM properties incorrectly
```ahk
excel := ComObject("Excel.Application")
excel.Visible := true  ; Simple property

; For complex properties, might need ()
workbook := excel.Workbooks.Add()  ; Method call
```

## File Path Issues

### Path Separators
**Common Issue**: Backslash escaping in strings
```ahk
; WRONG
path := "C:\Users\Name"  ; \U and \N treated as escapes

; CORRECT
path := "C:\\Users\\Name"  ; Escaped backslashes
path := "C:/Users/Name"    ; Forward slashes work
path := A_ScriptDir "\file.txt"  ; Auto-concat with var
```

### A_ScriptDir Usage
**Best Practice**: Always use built-in path variables
```ahk
; GOOD
configPath := A_ScriptDir "\config.ini"
dataPath := A_AppData "\MyApp\data.json"
```

## Hotkey and Hotstring Issues

### Hotkey Syntax
**Common Issue**: Context-sensitive hotkeys
```ahk
; Simple hotkey
^j::MsgBox("Ctrl+J pressed")

; Hotkey with function
^k::MyFunction()

; Context-sensitive
#HotIf WinActive("ahk_class Notepad")
^j::MsgBox("Ctrl+J in Notepad")
#HotIf  ; End context
```

### Hotstring Syntax
**Common Issue**: Options and replacements
```ahk
; Simple replacement
::btw::by the way

; With options
:*:btw::by the way  ; No trigger key needed
:C:BTW::BY THE WAY  ; Case-sensitive

; With function callback
:X:btw::MyHotstringFunc
```

## Array and Map Issues

### Array Indexing
**Important**: Arrays are 1-indexed in v2
```ahk
; CORRECT
myArray := ["first", "second", "third"]
MsgBox(myArray[1])  ; "first" (not 0!)

; Check length
MsgBox(myArray.Length)
```

### Map Creation and Access
**Common Issue**: Using Map incorrectly
```ahk
; CORRECT
myMap := Map()
myMap["key"] := "value"
myMap.Set("key2", "value2")

; Check existence
if myMap.Has("key")
    value := myMap["key"]
```

### Iteration
**Common Issue**: Wrong loop syntax
```ahk
; Array iteration
for index, value in myArray {
    MsgBox("Index: " index ", Value: " value)
}

; Map iteration
for key, value in myMap {
    MsgBox("Key: " key ", Value: " value)
}
```

## Error Handling

### Try-Catch Blocks
**Best Practice**: Always catch specific errors
```ahk
try {
    ; Risky operation
    result := FileRead("nonexistent.txt")
} catch as err {
    MsgBox("Error: " err.Message)
}
```

### Throw Statements
**Common Issue**: Throwing errors correctly
```ahk
; CORRECT
if !FileExist(path)
    throw Error("File not found: " path)

; With custom error
throw ValueError("Invalid input", -1, value)
```

## Threading and Timing

### SetTimer Usage
**Common Issue**: Timer callback syntax
```ahk
; WRONG (v1)
SetTimer, MyFunc, 1000

; CORRECT (v2)
SetTimer(MyFunc, 1000)
SetTimer(() => MsgBox("Timer!"), 1000)
```

### Sleep and Pauses
**Best Practice**: Use appropriate delays
```ahk
Sleep(1000)  ; Sleep 1 second
SetWinDelay(0)  ; Faster window operations
SetControlDelay(-1)  ; No control delays
```

## Type Coercion Issues

### String to Number
**Common Issue**: Unexpected type behavior
```ahk
; Explicit conversion
num := Integer("123")
num := Number("123.45")

; Checking types
if IsNumber(var)
    MsgBox("It's a number")
```

### Empty String vs Zero
**Important**: Empty string != 0 in comparisons
```ahk
var := ""
if (var = 0)  ; False! "" is not 0
if (var == 0)  ; True, type coercion

if (var = "")  ; Correct way to check empty
if (!var)  ; Also works, checks falsy
```

## Common Built-in Function Changes

### Changed Function Names
**Migration**: Many functions renamed in v2
```ahk
; v1 → v2
StringSplit → StrSplit
StringReplace → StrReplace
IfWinExist → WinExist()
IfWinActive → WinActive()
```

### Return Value Changes
**Important**: Some functions return differently
```ahk
; WinExist returns HWND (not 0/1)
if hwnd := WinExist("Notepad")
    MsgBox("Window found: " hwnd)

; StrSplit returns array
parts := StrSplit("a,b,c", ",")
MsgBox(parts[1])  ; "a"
```

## Debugging Tips

### OutputDebug Usage
**Best Practice**: Use for debugging
```ahk
OutputDebug("Variable value: " myVar)
```

### ListVars and ListLines
**Debugging**: View variables and execution
```ahk
ListVars()  ; Show all variables
ListLines()  ; Show line history
```

## Memory Recall Keywords

When you see issues related to:
- **"variable undefined"** → Check scope (global/local)
- **"parameter count"** → Check function definition and calls
- **"missing {"** → Check function/class syntax
- **"invalid path"** → Check backslash escaping
- **"index out of range"** → Remember 1-indexed arrays
- **"property not found"** → Check 'this.' prefix in classes
- **"GUI not working"** → Check v2 GUI syntax (object-based)
- **"hotkey not firing"** → Check #HotIf context blocks
- **"COM error"** → Check ComObject() syntax vs v1

---

*This memory helps Claude identify and fix common AutoHotkey v2 issues automatically.*
