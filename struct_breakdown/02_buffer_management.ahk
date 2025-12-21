; 02_buffer_management.ahk
; Concept: Buffer Management
; This script demonstrates how to allocate raw memory and read/write to it.
; Struct.ahk uses this to store the actual binary data of the structure.

#Requires AutoHotkey v2.0

; 1. Create a Buffer
; Allocate 16 bytes of memory, initialized to 0
buf := Buffer(16, 0)
MsgBox("Created a buffer of size: " buf.Size " bytes`nPointer address: " buf.Ptr)

; 2. Write data using NumPut
; NumPut(Type, Value, Pointer, Offset)
; Let's write an Integer (4 bytes) at offset 0
NumPut("Int", 123456, buf.Ptr, 0)

; Let's write a Double (8 bytes) at offset 8
NumPut("Double", 3.14159, buf.Ptr, 8)

MsgBox("Data written to buffer.")

; 3. Read data using NumGet
; NumGet(Pointer, Offset, Type)
valInt := NumGet(buf.Ptr, 0, "Int")
valDouble := NumGet(buf.Ptr, 8, "Double")

MsgBox("Read back from buffer:`nInteger at offset 0: " valInt "`nDouble at offset 8: " valDouble)

; 4. View raw bytes (Hex)
hexStr := ""
Loop buf.Size {
    byte := NumGet(buf.Ptr, A_Index - 1, "UChar")
    hexStr .= Format("{:02X} ", byte)
}
MsgBox("Raw Buffer Hex Dump:`n" hexStr)
