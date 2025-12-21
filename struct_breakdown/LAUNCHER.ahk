; LAUNCHER.ahk
; Simple launcher for the educational examples

#requires AutoHotkey v2.0

examples := [
    "01_property_descriptors.ahk",
    "02_buffer_management.ahk",
    "03_dynamic_properties.ahk"
]

myGui := Gui(, "Struct.ahk Breakdown Launcher")
myGui.SetFont("s10", "Segoe UI")
myGui.Add("Text",, "Select an example to run:")

lb := myGui.Add("ListBox", "r10 w300 vSelectedScript", examples)
btn := myGui.Add("Button", "w300 Default", "Run Example")
btn.OnEvent("Click", RunExample)

myGui.Show()

RunExample(*) {
    selected := lb.Text
    if (selected = "") {
        MsgBox("Please select an example first.")
        return
    }
    
    scriptPath := A_ScriptDir "\" selected
    if !FileExist(scriptPath) {
        MsgBox("File not found: " scriptPath)
        return
    }
    
    Run(scriptPath)
}
