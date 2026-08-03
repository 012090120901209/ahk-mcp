#Requires AutoHotkey v2.1-alpha.30
#SingleInstance Force
#NoTrayIcon

; Mode B: resident inspector on a named pipe. SCAFFOLD - OFF BY DEFAULT.
;
; Nothing starts this automatically. The MCP server ships with Mode A (spawn per call)
; and only reaches for the pipe when `uiaDaemonMode` is enabled in tool settings.
;
; Why it exists: spawning AutoHotkey and loading the 7900-line UIA library costs roughly
; 60-120ms before any work happens, and every call re-walks a tree that usually has not
; changed. A resident process amortises both.
;
; The request and response schemas are identical to Mode A - DispatchOp is shared with
; uia_inspect.ahk rather than reimplemented - so the six MCP tools never change regardless
; of which mode serves them.
;
;   Start:  AutoHotkey64.exe /ErrorStdOut inspector\uia_daemon.ahk
;   Pipe:   \\.\pipe\ahk-mcp-uia
;   Wire:   one JSON request per connection, one JSON response, then disconnect.

#Include %A_LineFile%\..\uia_inspect.ahk

global PipeName := "\\.\pipe\ahk-mcp-uia"
global IdleTimeoutMs := 300000
global LastActivity := A_TickCount
global WalkCache := Map()

RunDaemon()

RunDaemon() {
    SetTimer(CheckIdle, 30000)
    loop {
        ServeOnce()
    }
}

CheckIdle() {
    if (A_TickCount - LastActivity > IdleTimeoutMs)
        ExitApp 0
}

; One connection, one request, one response. Message-mode pipes keep the framing simple:
; a request is a single message, so there is no length prefix to get wrong.
ServeOnce() {
    static PIPE_ACCESS_DUPLEX := 3
    static PIPE_TYPE_MESSAGE := 0x4
    static PIPE_READMODE_MESSAGE := 0x2
    static PIPE_UNLIMITED_INSTANCES := 255
    static BUFFER_BYTES := 65536

    local handle := 0, connected := 0, request := "", payload := "", responseText := ""

    handle := DllCall("CreateNamedPipe", "str", PipeName
        , "uint", PIPE_ACCESS_DUPLEX
        , "uint", PIPE_TYPE_MESSAGE | PIPE_READMODE_MESSAGE
        , "uint", PIPE_UNLIMITED_INSTANCES
        , "uint", BUFFER_BYTES, "uint", BUFFER_BYTES
        , "uint", 0, "ptr", 0, "ptr")

    if (handle = -1 || !handle)
        throw OSError("CreateNamedPipe failed for " PipeName, -1)

    try {
        connected := DllCall("ConnectNamedPipe", "ptr", handle, "ptr", 0)
        if (!connected && DllCall("GetLastError", "uint") != 535)
            return

        LastActivity := A_TickCount
        request := ReadPipeMessage(handle, BUFFER_BYTES)
        if (request = "")
            return

        ResetRequestState()
        try {
            payload := DispatchOp(Json.Parse(request))
        } catch as e {
            payload := ErrorPayload("BAD_JSON", "Request was not valid JSON: " e.Message
                , "Send one JSON object per connection.")
        }
        responseText := EncodeWithMeta(payload)
        WritePipeMessage(handle, responseText)
    } finally {
        DllCall("FlushFileBuffers", "ptr", handle)
        DllCall("DisconnectNamedPipe", "ptr", handle)
        DllCall("CloseHandle", "ptr", handle)
    }
}

ReadPipeMessage(handle, capacity) {
    local buffer := Buffer(capacity, 0), read := 0, ok := 0
    ok := DllCall("ReadFile", "ptr", handle, "ptr", buffer, "uint", capacity, "uint*", &read, "ptr", 0)
    if (!ok || !read)
        return ""
    return StrGet(buffer, read, "UTF-8")
}

WritePipeMessage(handle, text) {
    local bytes := StrPut(text, "UTF-8") - 1
    local buffer := Buffer(bytes + 1, 0), written := 0
    StrPut(text, buffer, "UTF-8")
    DllCall("WriteFile", "ptr", handle, "ptr", buffer, "uint", bytes, "uint*", &written, "ptr", 0)
    return written
}

; Mode A exits after each request, so per-request counters are fresh by construction.
; A resident process has to clear them explicitly or meta accumulates across callers.
ResetRequestState() {
    State["startTick"] := A_TickCount
    State["nodeCount"] := 0
    State["truncated"] := 0
}

EncodeWithMeta(payload) {
    local meta := Map()
    meta["elapsedMs"] := A_TickCount - State["startTick"]
    meta["nodeCount"] := State["nodeCount"]
    meta["truncated"] := Json.Bool(State["truncated"])
    payload["meta"] := meta
    return Json.Stringify(payload)
}

; Cached walks, keyed by hwnd. A UIA tree is only stable while the window is; the title is
; a cheap proxy for "the app navigated somewhere else", which is exactly when a cached walk
; becomes a lie. Not yet consulted by DispatchOp - wiring it in is the remaining work.
CacheGet(hwnd) {
    local entry := ""
    if !WalkCache.Has(hwnd)
        return ""
    entry := WalkCache[hwnd]
    if !WinExist("ahk_id " hwnd) {
        WalkCache.Delete(hwnd)
        return ""
    }
    if (WinGetTitle(hwnd) != entry["title"]) {
        WalkCache.Delete(hwnd)
        return ""
    }
    return entry["payload"]
}

CachePut(hwnd, payload) {
    local entry := Map()
    try entry["title"] := WinGetTitle(hwnd)
    catch
        return
    entry["payload"] := payload
    entry["cachedAt"] := A_TickCount
    WalkCache[hwnd] := entry
}

CacheInvalidate(hwnd) {
    if WalkCache.Has(hwnd)
        WalkCache.Delete(hwnd)
}
