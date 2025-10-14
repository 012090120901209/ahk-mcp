#Requires AutoHotkey v2.1-alpha.14
#SingleInstance Force

#Include ClipboardHistory.ahk
#Include ToolTipEx.ahk

;#Region Classes
class Cmd {
    static UseBeeps := true
    static DoBeep(beepType) {
        if (!this.UseBeeps)
            return
        switch beepType {
            case "Tap": Beep.Tap()
            case "Hold": Beep.Hold()
            case "Double": Beep.DoubleTap()
            case "Triple": Beep.TripleTap()
            case "Run": Beep.RunSound()
        }
    }
    ; Modifier key management
    static ReleaseAllModifiers() {
        Send("{LControl Up}{RControl Up}")
        Send("{LShift Up}{RShift Up}")
        Send("{LWin Up}{RWin Up}")
        Send("{LAlt Up}{RAlt Up}")
    }
    static ReleaseFKeys() {
        Send("{F12 Up}{F13 Up}{F14 Up}")
    }
    static ReleaseAll() {
        this.ReleaseAllModifiers()
        this.ReleaseFKeys()
    }
    static SendEnter() {
        Send("{LControl Down}{Enter}{LControl Up}")
    }
    static RestartOSD() {
        Send("{LShift Down}{ScrollLock}{LShift Up}")
    }
    static Run() {
        Send("{LControl Down}{F5}{LControl Up}")
    }
    static SnippingTool() {
        Send("{LShift Down}{LWin Down}{s}{LWin Up}{LShift Up}")
    }
    static GoogleIt() {
        Send("{LWin Down}{g}{LWin Up}")
    }
    static Copy() {
        Send("{LControl Down}{c}{LControl Up}")
    }
    static superCopy() {
        Send("{LControl Down}{LAlt Down}{c}{LAlt Up}{LControl Up}")
    }
    static CopyURL() {
        Send("{LAlt Down}d{LAlt Up}")
        Sleep(50)
        Send("{LControl Down}c{LControl Up}")
    }
    static GrabAll() {
        Send("{LControl Down}{a}{c}{LControl Up}")
        Sleep(50)
        Send("{LButton}")
        this.DoBeep("double")
    }
    static Grab() {
        Send("{LControl Down}{LAlt Down}{c}{LAlt Up}{LControl Up}")
        Sleep(50)
    }
    static SwitchAccount() {
        Send("^l")
        Sleep(50)
        Send("/SwitchAccount")
        Sleep(50)
        Send("{Enter}")
    }
    static Paste() {
        Send("{LControl Down}{v}{LControl Up}")
    }
    static ColorPicker() {
        Send("{LShift Down}{LWin Down}{c}{LWin Up}{LShift Up}")
    }
    static Undo() {
        Send("{LControl Down}{z}{LControl Up}")
    }
    static Redo() {
        Send("{LControl Down}{y}{LControl Up}")
    }
    static ClipHistory() {
        Send("{RWin Down}{v}{RWin Up}")
    }
    static Paste2ndClip() {
        Send("{RWin Down}{v}{RWin Up}{Down}{Enter}")
    }
    static RestartExplorer() {
        Send("{LShift Down}{LWin Down}{r}{LWin Up}{LShift Up}")
    }
    static SelectAll() {
        Send("{LControl Down}{a}{LControl Up}")
    }
    static Backspace() {
        Send("{BackSpace}")
    }
    static wordBackspace() {
        Send("{LControl Down}{BackSpace}{LControl Up}")
    }
    static wordDelete() {
        Send("{LControl Down}{Delete}{LControl Up}")
    }
    ; Navigation commands
    static PlayingTab() {
        if WinActive("ahk_exe msedge.exe") {
            Send "^+n"
        } else {
            if WinExist("ahk_exe msedge.exe") {
                WinActivate "ahk_exe msedge.exe"
            } else {
                try {
                    Run "msedge.exe"
                } catch Error as err {
                    MsgBox "Error launching Edge: " err.Message
                }
            }
        }
    }
    static NextTab() {
        Send("{LControl Down}{Tab}{LControl Up}")
    }
    static PlayPause() {
        Send("{Media_Play_Pause}")
    }
    static PrevTab() {
        Send("{LControl Down}{LShift Down}{Tab}{LShift Up}{LControl Up}")
    }
    static NewTab() {
        Send("{LControl Down}{t}{LControl Up}")
    }
    static DuplicateTab() {
        Send("^+k")
    }
    static ReopenTab() {
        Send("{LControl Down}{LShift Down}t{LShift Up}{LControl Up}")
    }
    static CloseTab() {
        Send("{LControl Down}w{LControl Up}")
    }
    static DeleteWord() {
        Send("{LControl Down}{Backspace}{LControl Up}")
    }
    static GameBar() {
        Send("{LWin Down}{g}{LWin Up}")
    }
    ; Document navigation
    static Home() {
        Send("{LControl Down}{Home}{LControl Up}")
    }
    static End() {
        Send("{LControl Down}{End}{LControl Up}")
    }
    ; Window2 management
    static SwitchWindow2(num) {
        Send("{LWin Down}{" num "}{LWin Up}")
    }
    static SwitchMonitor() {
        Send("{LWin Down}{LShift Down}{Left}{LWin Up}{LShift Up}")
    }

    static RotateWindow() {
        Send("{LWin Down}{LControl Down}{LShift Down}{Tab}{LShift Down}{LControl Up}{LWin Up}")
    }
    ; Simple key sends
    static SendUp() {
        Send("{Up}")
    }
    static SendDown() {
        Send("{Down}")
    }
    static SendLeft() {
        Send("{Left}")
    }
    static SendRight() {
        Send("{Right}")
    }
    static SendBackspace() {
        Send("{Backspace}")
    }
    static PgUp() {
        Send("{PgUp}")
    }
    static PgDn() {
        Send("{PgDn}")
    }
    ; Function key sends
    static SendF20() {
        Send("{F20}")
    }
    static SendF23() {
        Send("{F23}")
    }
    static OpenNotes() {
        Run("!!!GUI_DarkScintilla.ahk")
    }
    ; Media control
    static VolumeUp() {
        Send("{Volume_Up}")
    }
    static VolumeDown() {
        Send("{Volume_Down}")
    }
    ; Line operations
    static DeleteLine() {
        Send("{Home}{LShift Down}{End}{LShift Up}{Delete}")
    }
    static CopyLine() {
        ; Use Ctrl+Home and Ctrl+End to avoid window repositioning issues
        Send("{LControl Down}{Home}{LControl Up}")  ; Start of line without repositioning
        Send("{LShift Down}{End}{LShift Up}")  ; Select to end
        Send("{LControl Down}c{LControl Up}")  ; Copy
        Send("{Escape}")  ; Deselect
    }
    static PasteLine() {
        Send("{End}{Enter}{LControl Down}v{LControl Up}")
    }
    ; Desktop navigation
    static NextDesktop() {
        Send("{LWin Down}{LControl Down}{Right}{LControl Up}{LWin Up}")
    }
    static PrevDesktop() {
        Send("{LWin Down}{LControl Down}{Left}{LControl Up}{LWin Up}")
    }
    ; Window management
    static CloseWindow() {
        Send("{Alt Down}{F4}{Alt Up}")
    }
    static ExitAllScriptsExcept() {
        DetectHiddenWindows(true)
        for hwnd in WinGetList("ahk_class AutoHotkey") {
            title := WinGetTitle("ahk_id " hwnd)
            if !RegExMatch(title, "(_zHolder.ahk|_!Always.ahk)") {
                PostMessage(0x111, 65405, 0, , title)
            }
        }
    }
}
;#EndRegion

;#Region Runner
class Runner {

    static EmptyBin(*) {
        try {
            FileRecycleEmpty()
            ToolTip("Recycle Bin Emptied")
            SetTimer(() => ToolTip(), -1000)
        }
        catch {
            ToolTip("Failed to empty Recycle Bin")
            SetTimer(() => ToolTip(), -1000)
        }
    }

    static OpenRecycleBin(*) {
        Run "shell:RecycleBinFolder"
    }

    static RemoveComments(text := "") {
        if (text = "") {
            prevClip := A_Clipboard
            A_Clipboard := ""
            Send "^c"
            if !ClipWait(1)
                return
            text := A_Clipboard
        }

        lines := StrSplit(text, "`n", "`r")
        result := ""

        for line in lines {
            originalLine := line
            cleanLine := this.RemoveLineComment(line)

            originalIsBlank := Trim(originalLine) = ""
            commentOnly := Trim(originalLine) != "" && Trim(cleanLine) = ""

            if (originalIsBlank || Trim(cleanLine) != "") {
                result .= cleanLine . "`n"
            }
        }

        result := RTrim(result, "`n")

        if (result = "") {
            A_Clipboard := prevClip
            return
        } else {
            A_Clipboard := result
            Send "^v"
            Sleep 50
            A_Clipboard := prevClip
        }

        return result
    }

    static RemoveLineComment(line) {
        len := StrLen(line)
        result := ""
        inString := false
        quoteChar := ""

        loop len {
            char := SubStr(line, A_Index, 1)
            prevChar := A_Index > 1 ? SubStr(line, A_Index - 1, 1) : ""

            if (char = '"' || char = "'") {
                if (prevChar != "``") {
                    if (!inString) {
                        inString := true
                        quoteChar := char
                    } else if (char = quoteChar) {
                        inString := false
                    }
                }
            }

            if (char = ";" && !inString) {
                return result
            }

            result .= char
        }

        return result
    }
}
;#EndRegion

/**
 * @class Beep
 * @description Handles various sound effects and audio playback functionality
 * @static
 */
class Beep {
    /** @property {Number} DefaultFrequency - The default frequency in Hz for beep sounds */
    static DefaultFrequency := 500

    /** @property {Number} DefaultDuration - The default duration in milliseconds for beep sounds */
    static DefaultDuration := 100

    /** @property {Number} DefaultDelay - The default delay in milliseconds between beep sounds */
    static DefaultDelay := 100

    /**
     * @method Tap
     * @description Plays a single beep sound at default frequency and duration
     * @static
     */
    static Tap() {
        SoundBeep(this.DefaultFrequency, this.DefaultDuration)
    }

    /**
     * @method Hold
     * @description Plays a longer, higher-pitched beep sound
     * @static
     */
    static Hold() {
        SoundBeep(600, 500)
    }

    /**
     * @method DoubleTap
     * @description Plays two conseculetive beep sounds with default delay between them
     * @static
     */
    static DoubleTap() {
        SoundBeep(this.DefaultFrequency, this.DefaultDuration)
        Sleep(this.DefaultDelay)
        SoundBeep(this.DefaultFrequency, this.DefaultDuration)
    }

    /**
     * @method TapHold
     * @description Plays a tap sound followed by a hold sound
     * @static
     */
    static TapHold() {
        this.Tap()
        Sleep(this.DefaultDelay)
        this.Hold()
    }

    /**
     * @method TripleTap
     * @description Plays three consecutive beep sounds with default delay between them
     * @static
     */
    static TripleTap() {
        Loop 3 {
            SoundBeep(this.DefaultFrequency, this.DefaultDuration)
            if (A_Index < 3)
                Sleep(this.DefaultDelay)
        }
    }

    /**
     * @method QuadTap
     * @description Plays four consecutive beep sounds with default delay between them
     * @static
     */
    static QuadTap() {
        Loop 4 {
            SoundBeep(this.DefaultFrequency, this.DefaultDuration)
            if (A_Index < 4)
                Sleep(this.DefaultDelay)
        }
    }

    /**
     * @method IsSoundAvailable
     * @description Tests if sound playback is available
     * @returns {Boolean} True if sound is available
     * @static
     */
    static IsSoundAvailable() {
        SoundBeep(1000, 1)
        return true
    }

    /**
     * @method SetVolume
     * @description Sets the system volume level
     * @param {Number} level - The volume level to set
     * @static
     */
    static SetVolume(level) {
        SoundSetVolume(level)
    }

    /**
     * @method PlaySoundAtHalfVolume
     * @description Plays an audio file at reduced volume
     * @param {String} filePath - Path to the audio file
     * @static
     */
    static PlaySoundAtHalfVolume(filePath) {
        currentVolume := SoundGetVolume()
        this.SetVolume(currentVolume / 2)
        try {
            static wmp := ComObject("WMPlayer.OCX")
            wmp.URL := filePath
            wmp.controls.play()
            While wmp.playState != 1
                Sleep(100)
        } catch {
            Run(filePath)
            Sleep(3000)
        }
        this.SetVolume(currentVolume)
    }

    static PlaySound(filePath) {
        try {
            static wmp := ComObject("WMPlayer.OCX")
            wmp.URL := filePath
            wmp.controls.play()
            While wmp.playState != 1
                Sleep(100)
        } catch {
            Run(filePath)
            Sleep(3000)
        }
    }
    /**
     * @method RunSound
     * @description Plays the run sound effect from the Lib/Sounds folder
     * @static
     */
    static RunSound() {
        static soundFile := A_ScriptDir "\Lib\Sounds\Run.mp3"
        this.PlaySoundAtHalfVolume(soundFile)
    }
    /**
     * @method Run
     * @description Plays the record sound effect from the Lib/Sounds folder
     * @static
     */
    static Run() {
        static soundFile := A_ScriptDir "\Lib\Sounds\Record.mp3"
        this.PlaySoundAtHalfVolume(soundFile)
    }
    static SoundCopy() {
        static soundFile := A_ScriptDir "\Lib\Sounds\Click.wav"
        this.PlaySoundAtHalfVolume(soundFile)
    }

    static SoundClick() {
        static soundFile := A_ScriptDir "\Lib\Sounds\Click.wav"
        this.PlaySound(soundFile)
    }

    static SoundSelect() {
        static soundFile := A_ScriptDir "\Lib\Sounds\Select.wav"
        this.PlaySoundAtHalfVolume(soundFile)
    }

    static SoundAlert() {
        static soundFile := A_ScriptDir "\Lib\Sounds\Alert.wav"
        this.PlaySoundAtHalfVolume(soundFile)
    }

    static SoundError() {
        static soundFile := A_ScriptDir "\Lib\Sounds\Error.wav"
        this.PlaySoundAtHalfVolume(soundFile)
    }
}
;#EndRegion

class KeyThrottle {
    static lastPress := 0
    static threshold := 400

    static CheckThrottle() {
        if (A_TickCount - this.lastPress < this.threshold)
            return false
        this.lastPress := A_TickCount
        return true
    }
}

class BambuMonitor {
    __New() {
        this.studioRunning := ProcessExist("Bambu-Studio.exe")
        this.runningIcon := A_ScriptDir "\Lib\Icons\bKeyDark.png"
        this.stoppedIcon := A_ScriptDir "\Lib\Icons\Icon_GreenCheck.png"
        this.checkTimer := ""

        TraySetIcon(this.studioRunning ? this.runningIcon : this.stoppedIcon)
        A_IconHidden := false

        ; Use a timer instead of WinEvent for less overhead
        this.checkTimer := SetTimer(this.CheckBambuStatus.Bind(this), 2000)
        
        this.UpdateTray()
    }
    
    CheckBambuStatus() {
        newStatus := ProcessExist("Bambu-Studio.exe") ? true : false
        if (newStatus != this.studioRunning) {
            this.studioRunning := newStatus
            this.UpdateTray()
        }
    }
    
    __Delete() {
        if this.checkTimer
            SetTimer(this.checkTimer, 0)
    }
    UpdateTray() {
        TraySetIcon(this.studioRunning ? this.runningIcon : this.stoppedIcon)
    }
}

/**
 * Window2State Class
 * Manages window2 states including minimizing, unminimizing, and handling window2s with same titles or processes.
 * 
 * Properties:
 * - Minimized: Static array storing minimized window2 IDs
 * - State_Minimized: Static constant defining minimized state (-1)
 * 
 * Methods:
 * - Minimize(): Minimizes the active window2
 * - UnMinimize(): Restores the most recently minimized window2
 * - HandleChromeWindow2sWithSameTitle(): Manages multiple Chrome window2s with identical titles
 * - HandleWindow2sWithSameProcessAndClass(): Manages multiple window2s of the same process and class
 * - ExtractAppTitle(): Extracts application title from full window2 title
 */
class WinState {
    static Minimized := []
    static State_Minimized := -1

    static Minimize() {
        if (hwnd := WinExist("A")) {
            WinID := "ahk_id " hwnd
            if (WinGetMinMax(WinID) != this.State_Minimized) {
                if this.SendMinimize(WinID)
                    this.Minimized.Push({ id: WinID, title: WinGetTitle(WinID) })
            }
        }
    }

    static UnMinimize() {
        while (this.Minimized.Length) {
            winInfo := this.Minimized.Pop()
            if WinExist(winInfo.id) {
                this.SendRestore(winInfo.id)
                return true
            }
        }
        return false
    }

    static SendMinimize(winId) {
        try {
            PostMessage(0x0112, 0xF020, 0, , winId)
            return true
        }
        return false
    }

    static MaximizeActive() {
        hwnd := WinActive("A")
        if !hwnd
            return false
        try {
            WinMaximize("ahk_id " hwnd)
            return true
        }
        return false
    }

    static SendRestore(winId) {
        try {
            PostMessage(0x0112, 0xF120, 0, , winId)
            return true
        }
        return false
    }
    /**
     * Handles multiple Chrome window2s with the same title by cycling through them.
     * Activates the last window2 in the list of window2s with matching titles.
     */
    static HandleChromeWindow2s() {
        if !(hwnd := WinActive("A"))
            return

        fullTitle := WinGetTitle(hwnd)
        appTitle := this.ExtractAppTitle(fullTitle)
        SetTitleMatchMode(2)

        if (window2s := WinGetList(appTitle)) && window2s.Length {
            WinActivate("ahk_id " window2s[window2s.Length])
        }
    }

    /**
     * Extracts the application title from a full window2 title.
     * @param {string} fullTitle - The complete window2 title
     * @returns {string} The extracted application title
     */
    static ExtractAppTitle(fullTitle) {
        return fullTitle
    }

    /**
     * Cycles through window2s of the same application, with special handling for Explorer window2s.
     */
    static SameApp() {
        if !(win_id := WinActive("A"))
            return

        win_class := WinGetClass(win_id)
        active_process := WinGetProcessName(win_id)

        ; Get window2 list based on process and optionally class
        win_list := (active_process = "explorer.exe")
            ? WinGetList("ahk_exe " active_process " ahk_class " win_class)
            : WinGetList("ahk_exe " active_process)

        if (win_list && win_list.Length) {
            next_id := win_list[win_list.Length]
            WinMoveTop("ahk_id " next_id)
            WinActivate("ahk_id " next_id)
        }
    }
}
;#EndRegion

;#Region Clipboard
class ClipboardMonitor {
    static isCapturing := false
    static captureEndTime := 0
    static Clipboard := ""
    static DataTransfer := ""
    static StandardDataFormats := ""
    static historyInitialized := false

    __New() {
        OnClipboardChange(ObjBindMethod(this, "OnClipboardChange"), 1)
        this.InitializeHistory()
    }

    InitializeHistory() {
        if !ClipboardMonitor.historyInitialized {
            try {
                ClipboardMonitor.DataTransfer := Windows.ApplicationModel.DataTransfer
                ClipboardMonitor.Clipboard := ClipboardMonitor.DataTransfer.Clipboard
                ClipboardMonitor.StandardDataFormats := ClipboardMonitor.DataTransfer.StandardDataFormats
                
                if !ClipboardMonitor.Clipboard.IsHistoryEnabled() {
                    ClipboardMonitor.DataTransfer.ClipboardContentOptions().IsAllowedInHistory := true
                }
                ClipboardMonitor.historyInitialized := true
            } catch {
                ClipboardMonitor.historyInitialized := false
            }
        }
    }

    OnClipboardChange(dataType) {
        if (ClipboardMonitor.isCapturing || A_TickCount < ClipboardMonitor.captureEndTime) {
            return
        }
        if (dataType != 1) {
            return
        }
        this.ProcessClipboardChange()
    }

    ProcessClipboardChange() {
        try {
            content := A_Clipboard
            if (content != "") {
                Beep.SoundClick()
                trimmedText := Trim(content)
                if (StrLen(trimmedText) > 0) {
                    previewText := RegExReplace(SubStr(trimmedText, 1, 20), "[\r\n]+", " ") " ..."
                    ToolTipEx("Copied: " previewText, 1)
                }
            }
        }
    }

    static CaptureText() {
        this.isCapturing := true

        saved := ClipboardAll()
        A_Clipboard := ""

        Send("^a^c")

        if (!ClipWait(0.1, 1)) {
            A_Clipboard := saved
            this.isCapturing := false
            this.captureEndTime := A_TickCount + 50
            Beep.SoundError()
            return ""
        }

        captured := A_Clipboard
        A_Clipboard := saved

        this.isCapturing := false
        this.captureEndTime := A_TickCount + 50

        return captured
    }

    static GetHistoryItems() {
        if !this.historyInitialized
            return false
        
        try {
            result := this.Clipboard.GetHistoryItemsAsync().Await()
            if result.Status.n
                return false
            return result.Items
        } catch {
            return false
        }
    }

    static GetHistoryCount() {
        items := this.GetHistoryItems()
        return items ? items.Size : 0
    }

    static GetHistoryText(index := 1) {
        items := this.GetHistoryItems()
        if !items || index > items.Size || index < 1
            return ""
        
        try {
            item := items.GetAt(index - 1)
            content := item.Content
            
            if !content.Contains(this.StandardDataFormats.Text)
                return ""
            
            return content.GetTextAsync().Await()
        } catch {
            return ""
        }
    }

    static GetRecentHistoryItems(minutes := 1) {
        recentItems := []
        items := this.GetHistoryItems()
        
        if !items
            return recentItems
        
        itemCount := items.Size
        if itemCount = 0
            return recentItems
        
        currentUnix := DateDiff(A_NowUTC, "19700101", "Seconds")
        cutoffTime := currentUnix - (minutes * 60)
        
        Loop itemCount {
            try {
                item := items.GetAt(A_Index - 1)
                if !item
                    continue
                
                timestamp := item.Timestamp
                universalTime := timestamp.UniversalTime
                itemUnix := universalTime / 10000000 - 11644473600
                
                if itemUnix >= cutoffTime {
                    content := item.Content
                    text := ""
                    
                    if content.Contains(this.StandardDataFormats.Text) {
                        text := content.GetTextAsync().Await()
                    }
                    
                    itemData := Map()
                    itemData["index"] := A_Index
                    itemData["text"] := text
                    itemData["timestamp"] := FormatTime(itemUnix, "yyyy-MM-dd HH:mm:ss")
                    itemData["secondsAgo"] := currentUnix - itemUnix
                    recentItems.Push(itemData)
                }
            } catch {
                continue
            }
        }
        
        return recentItems
    }

    static GetItemsFromLastMinute() {
        return this.GetRecentHistoryItems(1)
    }

    static GetCombinedRecentClipboard(minutes := 1, separator := "`n`n", reverseOrder := false, includeTimestamps := false) {
        recentItems := this.GetRecentHistoryItems(minutes)
        
        if recentItems.Length = 0
            return ""
        
        combinedText := ""
        itemsToProcess := reverseOrder ? this.ReverseArray(recentItems) : recentItems
        
        for item in itemsToProcess {
            if item["text"] = ""
                continue
            
            if includeTimestamps {
                combinedText .= "[" . item["timestamp"] . "]`n"
                combinedText .= item["text"]
            } else {
                combinedText .= item["text"]
            }
            
            if A_Index < itemsToProcess.Length
                combinedText .= separator
        }
        
        return RTrim(combinedText, separator)
    }

    static GetCombinedLastMinute(separator := "`n`n", reverseOrder := false) {
        return this.GetCombinedRecentClipboard(1, separator, reverseOrder, false)
    }

    static CopyLastMinuteCombined(separator := "`n`n", reverseOrder := false) {
        combined := this.GetCombinedLastMinute(separator, reverseOrder)
        if combined != "" {
            A_Clipboard := combined
            return true
        }
        return false
    }

    static ReverseArray(arr) {
        reversed := []
        Loop arr.Length {
            reversed.Push(arr[arr.Length - A_Index + 1])
        }
        return reversed
    }

    static GetAllHistoryWithTimestamps() {
        results := []
        items := this.GetHistoryItems()
        
        if !items
            return results
        
        itemCount := items.Size
        if itemCount = 0
            return results
        
        currentUnix := DateDiff(A_NowUTC, "19700101", "Seconds")
        
        Loop itemCount {
            try {
                item := items.GetAt(A_Index - 1)
                if !item
                    continue
                
                timestamp := item.Timestamp
                universalTime := timestamp.UniversalTime
                itemUnix := universalTime / 10000000 - 11644473600
                
                content := item.Content
                text := ""
                
                if content.Contains(this.StandardDataFormats.Text) {
                    text := content.GetTextAsync().Await()
                }
                
                itemData := Map()
                itemData["index"] := A_Index
                itemData["text"] := text
                itemData["timestamp"] := FormatTime(itemUnix, "yyyy-MM-dd HH:mm:ss")
                itemData["secondsAgo"] := currentUnix - itemUnix
                results.Push(itemData)
            } catch {
                continue
            }
        }
        
        return results
    }

    static ClearHistory() {
        if !this.historyInitialized
            return false
        
        try {
            this.Clipboard.ClearHistory()
            return true
        } catch {
            return false
        }
    }

    static DeleteHistoryItem(index) {
        items := this.GetHistoryItems()
        if !items || index > items.Size || index < 1
            return false
        
        try {
            item := items.GetAt(index - 1)
            return this.Clipboard.DeleteItemFromHistory(item)
        } catch {
            return false
        }
    }
}
;#EndRegion

;#Region TextSend Functions
class TextSend {
    static stateList := [
        "Illinois",
        "Indiana",
        "Iowa",
        "Kansas",
        "Michigan",
        "Minnesota",
        "Missouri",
        "Nebraska",
        "Ohio",
        "Wisconsin"
    ]

    static cityList := [
        "Chicago",
        "Columbus",
        "Des Moines",
        "Detroit",
        "Grand Rapids",
        "Indianapolis",
        "Kansas City",
        "Minneapolis",
        "St. Louis"
    ]

    __New() {
        Hotkey("^!s", this.SendStates.Bind(this))
        Hotkey("^!c", this.SendCities.Bind(this))
        Hotkey("^!a", this.SendCustomArray.Bind(this, ["Custom Item 1", "Custom Item 2"]))
    }

    SendStates(*) {
        this.SendArrayText(TextSend.stateList)
    }

    SendCities(*) {
        this.SendArrayText(TextSend.cityList)
    }

    SendCustomArray(customArray, *) {
        this.SendArrayText(customArray)
    }

    SendArrayText(arr) {
        for _, item in arr {
            Send(item)
            Send("{Enter}")
        }
    }
}
;#EndRegion

;#Region Text Functions
class Text {
    class FormatHeaders {
        static Title := "Format Text as Header"
        static Hotkey := "^+H"

        static Run(*) {
            savedClip := ClipboardAll()
            A_Clipboard := ""
            Send("^c")
            ClipWait(1)

            if (A_Clipboard) {
                headerText := Trim(A_Clipboard)
                headerText := RegExReplace(headerText, "[^\w\s]", "")
                headerText := Trim(headerText)
                headerText := StrReplace(headerText, " ", "_")
                headerText := Format("{:U}", headerText)
                headerText := "<" headerText ">"

                A_Clipboard := headerText
                Send("^v")
            }

            Sleep(100)
            A_Clipboard := savedClip
        }
    }

    class CapitalizeTag {
        static Title := "Capitalize Content Inside Tags"
        static Hotkey := "^+T"

        static Run(*) {
            savedClip := ClipboardAll()
            A_Clipboard := ""
            Send("^c")
            ClipWait(1)

            if (A_Clipboard) {
                clipText := A_Clipboard
                clipText := RegExReplace(clipText, ">([^<>]+)<", Text.CapitalizeTag.CapitalizeMatch)
                A_Clipboard := clipText
                Send("^v")
            }
            Sleep(100)
            A_Clipboard := savedClip
        }

        static CapitalizeMatch(match) {
            content := match[1]
            uppercaseContent := StrUpper(content)
            return ">" uppercaseContent "<"
        }
    }

    class ChangeFirst {
        static Title := "Change First Word"
        static Hotkey := "^+1"

        static Run(*) {
            Send("{LControl Down}{Left}{LControl Up}{LControl Down}{LShift Down}{Right}{LShift Up}{LControl Up}")
            Sleep(50)
            SendInput("Changed 1")
        }
    }

    class ChangeSecond {
        static Title := "Change Second Word"
        static Hotkey := "^+2"

        static Run(*) {
            Send("{LControl Down}{Left}{LControl Up}{LControl Down}{LShift Down}{Right}{LShift Up}{LControl Up}")
            Sleep(50)
            SendInput("Changed 2")
        }
    }

    class ChangeThird {
        static Title := "Change Third Word"
        static Hotkey := "^+3"

        static Run(*) {
            Send("{LControl Down}{Left}{LControl Up}{LControl Down}{LShift Down}{Right}{LShift Up}{LControl Up}")
            Sleep(50)
            SendInput("Changed 3")
        }
    }

    class ListNumbers {
        static Title := "Extract and List Numbers"
        static Hotkey := "^+N"

        static Run(*) {
            numbers := []
            uniqueNums := Map()
            clipContent := A_Clipboard

            if (clipContent) {
                Loop Parse, clipContent, "`n", "`r" {
                    if RegExMatch(A_LoopField, "\b\d{7}\b", &match) {
                        if !uniqueNums.Has(match[0]) {
                            numbers.Push(match[0])
                            uniqueNums[match[0]] := true
                        }
                    }
                }
            }

            result := ""
            for index, num in numbers {
                result .= num (index < numbers.Length ? "`n" : "")
            }

            A_Clipboard := result
        }
    }

    class CleanNumber {
        static Title := "Clean Number in Clipboard"
        static Hotkey := "^+C"

        static Run(*) {
            if RegExMatch(A_Clipboard, "\b\d{7}\b", &match)
                A_Clipboard := StrReplace(match[0], A_Space)
        }
    }
}
;#EndRegion Text Functions

class RestartHolder {
    __New() {
        this.RestartScript("_zHolder.ahk")
    }

    RestartScript(scriptName) {
        DetectHiddenWindows(true)
        WinTitle := "ahk_class AutoHotkey"
        ScriptList := WinGetList(WinTitle)

        foundScript := false

        for i, hwnd in ScriptList {
            WinTitle := WinGetTitle("ahk_id " hwnd)
            if InStr(WinTitle, scriptName) {
                pid := WinGetPID("ahk_id " hwnd)
                ProcessClose(pid)
                Sleep(200)
                foundScript := true
                break
            }
        }

        if (foundScript) {
            Run(A_AhkPath " " A_ScriptDir "\" scriptName)
            ToolTip(scriptName " has been restarted")
        } else {
            ToolTip("Could not find " scriptName)
            Run(A_AhkPath " " A_ScriptDir "\" scriptName)
        }

        SetTimer(() => ToolTip(), -3000)
    }
}


Array.Prototype.DefineProp("Sort", {
    call: (a, f := unset) {
        loop a.Length - 1 {
            i := A_Index
            loop a.Length - i {
                j := i + A_Index
                if IsSet(f) ? f(a[j], a[i]) < 0 : a[j] < a[i]
                    a[i] := a[j], a[j] := a[i], a[i] := a[j]
            }
        }
        return a
    }
})