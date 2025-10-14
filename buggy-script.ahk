#Requires AutoHotkey v2.1

class VSCodeMenuManager {
    static settings := Map()

    ; Instance method that should contain static utility methods (BUG #2 - incorrect indentation)
    UpdateSetting(key, value) {  ; Line 162 area
        ; This should be an instance method but contains static methods with wrong indentation
        if (key = "theme") {
            this.theme := value
        }
    }

    ; Static utility methods moved outside instance method context
    static ToggleTheme() {
        current := VSCodeMenuManager.settings["theme"]
        VSCodeMenuManager.settings["theme"] := (current = "dark") ? "light" : "dark"
    }

    static UpdateTheme() {
        theme := VSCodeMenuManager.settings["theme"]
        ; Apply theme logic here
    }

    ; Method with incomplete if-else block (BUG #1 - Line 185 area)
    UpdateVSCodeMenu() {  ; Line 185 area
        if (VSCodeMenuManager.settings["showMenu"] = true) {
            ; Show VSCode menu logic
            this.ShowMenu()
            ; BUG: Missing else clause - incomplete if-else block
        }
    }

    ShowMenu() {
        ; Menu display logic
    }
}

class CommandMenuBuilder {
    static commands := []

    ; Method with incorrect method reference (BUG #3 - Line 832 area)
    Build() {  ; Line 832 area
        for command in this.commands {
            ; BUG: Incorrect method reference - should be CommandMenuBuilder.AddCommand()
            result := MenuBuilder.AddCommand(command)  ; Wrong class reference
        }
        return result
    }

    static AddCommand(command) {
        ; Add command logic
    }
}

; Test the classes
manager := VSCodeMenuManager()
builder := CommandMenuBuilder()