; 01_property_descriptors.ahk
; Concept: Property Descriptors
; This script demonstrates how to define dynamic properties on an object using DefineProp.
; This is the foundation of the Struct class, which defines properties for each struct member.

#requires AutoHotkey v2.0

obj := {}

; Define a simple value property
obj.DefineProp("SimpleProp", {Value: "Hello World"})
MsgBox("SimpleProp: " obj.SimpleProp)

; Define a property with a Getter
; The getter is a function that runs when you try to access the property.
obj.DefineProp("TimeProp", {
    get: (*) => FormatTime(, "HH:mm:ss")
})

MsgBox("Current Time (TimeProp): " obj.TimeProp)
Sleep(1000)
MsgBox("Current Time (TimeProp) 1 second later: " obj.TimeProp)

; Define a property with Getter and Setter
; This allows us to control what happens when a value is assigned.
storage := "Initial Value"
obj.DefineProp("ControlledProp", {
    get: (*) => storage,
    set: (this, value, *) => (storage := "Stored: " value)
})

MsgBox("ControlledProp before set: " obj.ControlledProp)
obj.ControlledProp := "New Data"
MsgBox("ControlledProp after set: " obj.ControlledProp)

MsgBox("Success! This demonstrates how Struct.ahk uses DefineProp to create custom behaviors for struct members.")
