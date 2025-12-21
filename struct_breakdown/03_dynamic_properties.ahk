; 03_dynamic_properties.ahk
; Concept: Dynamic Properties & Binding
; This combines Concept 1 and 2: using properties to read/write buffer data automatically.
; This is exactly how Struct.ahk maps property names (like "dwSize") to memory offsets.

#requires AutoHotkey v2.0

class MyStruct {
    __New() {
        ; Allocate memory for 2 integers (8 bytes)
        this.buf := Buffer(8, 0)
        this.ptr := this.buf.Ptr
        
        ; Define "FirstNum" at offset 0 (Int)
        ; We bind the offset (0) and type ("Int") to the getter/setter functions
        this.DefineProp("FirstNum", {
            get: this.GetNum.Bind(0, "Int"),
            set: this.SetNum.Bind(0, "Int")
        })
        
        ; Define "SecondNum" at offset 4 (Int)
        this.DefineProp("SecondNum", {
            get: this.GetNum.Bind(4, "Int"),
            set: this.SetNum.Bind(4, "Int")
        })
    }
    
    ; Generic Getter
    GetNum(offset, type, *) {
        return NumGet(this.ptr, offset, type)
    }
    
    ; Generic Setter
    SetNum(offset, type, value, *) {
        NumPut(type, value, this.ptr, offset)
    }
}

; Use the class
instance := MyStruct()

; Write using properties
instance.FirstNum := 42
instance.SecondNum := 99

MsgBox("Values set via properties:`nFirstNum: " instance.FirstNum "`nSecondNum: " instance.SecondNum)

; Verify by reading raw buffer
raw1 := NumGet(instance.buf.Ptr, 0, "Int")
raw2 := NumGet(instance.buf.Ptr, 4, "Int")

MsgBox("Verification via raw NumGet:`nOffset 0: " raw1 "`nOffset 4: " raw2)
