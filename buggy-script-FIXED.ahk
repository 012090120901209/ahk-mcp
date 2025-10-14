#Requires AutoHotkey v2.1

class VSCodeMenuManager {
    static settings := Map()

    ; FIXED BUG #2: Static methods moved outside instance method context
    UpdateSetting(key, value) {  ; Line 162 area
        if (key = "theme") {
            this.theme := value
        }
    }

    ; Static utility methods properly placed at class level
    static ToggleTheme() {
        current := VSCodeMenuManager.settings["theme"]
        VSCodeMenuManager.settings["theme"] := (current = "dark") ? "light" : "dark"
    }

    static UpdateTheme() {
        theme := VSCodeMenuManager.settings["theme"]
        ; Apply theme logic here
    }

    ; FIXED BUG #1: Complete if-else block with proper else clause
    UpdateVSCodeMenu() {  ; Line 185 area
        if (VSCodeMenuManager.settings["showMenu"] = true) {
            ; Show VSCode menu logic
            this.ShowMenu()
        } else {
            ; Hide VSCode menu logic
            this.HideMenu()
        }
    }

    ShowMenu() {
        ; Menu display logic
    }

    HideMenu() {
        ; Menu hide logic
    }
}

class CommandMenuBuilder {
    static commands := []

    ; FIXED BUG #3: Correct method reference using proper class name
    Build() {  ; Line 832 area
        for command in this.commands {
            ; Corrected to use CommandMenuBuilder instead of MenuBuilder
            result := CommandMenuBuilder.AddCommand(command)
        }
        return result
    }

    static AddCommand(command) {
        ; Add command logic
        return true
    }
}

; Test the classes
manager := VSCodeMenuManager()
builder := CommandMenuBuilder()