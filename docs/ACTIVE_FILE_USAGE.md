# Active File System - Usage Guide

## Overview

The AutoHotkey MCP Server now includes an intelligent active file tracking
system that automatically detects and manages AutoHotkey script paths from your
messages.

## How It Works

### Automatic Detection Patterns

The system detects file paths in multiple formats:

1. **Full paths with quotes**: `"C:\Scripts\MyScript.ahk"`
2. **Drive paths**: `C:\Users\Name\script.ahk`
3. **Relative paths**: `./scripts/test.ahk` or `../automation.ahk`
4. **Just filenames**: `MyScript.ahk`

### Multi-Line Input Support

You can paste a file path and instructions on separate lines:

```
C:\Scripts\MyScript.ahk

Fix the syntax errors and add error handling
```

Or:

```
test-gui.ahk

Run this script and check if the window appears
```

## Available Tools

### 1. `AHK_Process_Request`

**Primary tool for handling file paths with instructions**

This tool automatically:

- Detects the file path in your message
- Sets it as the active file
- Determines the action (run, analyze, diagnose, edit)
- Executes the appropriate operation

**Example usage:**

```
Input:
C:\Scripts\calculator.ahk
Check for errors and run it

Response:
📄 File: C:\Scripts\calculator.ahk
📝 Request: Check for errors and run it
⚙️ Action: diagnose
🔍 Running diagnostics...
[Results shown]
```

### 2. `AHK_File_Detect`

**Explicitly detect and set active files**

Use when you want to:

- Set a script directory
- See all detected paths in a message
- Manually control active file setting

### 3. `AHK_Active_File`

**Get or set the current active file**

Actions:

- `get`: Show current active file
- `set`: Manually set a specific file

## Automatic Action Detection

The system intelligently detects what you want to do based on keywords:

| Keywords                              | Action       | What happens               |
| ------------------------------------- | ------------ | -------------------------- |
| run, execute, test                    | **Run**      | Executes the script        |
| analyze, review                       | **Analyze**  | Deep code analysis         |
| diagnose, check, validate, error, fix | **Diagnose** | Syntax and standards check |
| edit, modify, change, update, add     | **Edit**     | Prepares for editing       |
| (none)                                | **View**     | Shows file content         |

## Configuration

### Setting a Script Directory

If your scripts are in a specific folder:

```javascript
// Using AHK_File_Detect tool
{
  "text": "Set my script directory",
  "scriptDir": "C:\\MyScripts"
}
```

### Configuration File Location

- **Windows**: `%APPDATA%\ahk-mcp\config.json`
- **Linux/Mac**: `~/.config/ahk-mcp/config.json`

### Config Structure

```json
{
  "activeFile": "C:\\Scripts\\current.ahk",
  "scriptDir": "C:\\Scripts",
  "lastModified": "2024-01-15T10:30:00Z",
  "autoDetectedPaths": ["C:\\Scripts\\script1.ahk", "C:\\Scripts\\script2.ahk"]
}
```

## Usage Examples

### Example 1: Simple Run

```
Input:
C:\Scripts\HelloWorld.ahk
run it

Output:
✓ Active file set
✓ Script executed
✓ Exit code: 0
```

### Example 2: Diagnosis Request

```
Input:
test-gui.ahk

Check for syntax errors

Output:
✓ File found in script directory
✓ Running diagnostics...
✓ No errors found!
```

### Example 3: Edit Request

```
Input:
MyAutomation.ahk

Add a hotkey for F1 that shows a message

Output:
✓ Active file set: C:\Scripts\MyAutomation.ahk
✓ Ready to edit
[File content shown]
[Edit suggestions provided]
```

## Integration with Other Tools

Once an active file is set:

- **`AHK_Run`**: Runs without needing file path
- **`AHK_Diagnostics`**: Can analyze the active file's code
- **Direct edits**: Work on the active file
- **`AHK_Debug_Agent`**: Debug the active script

## Tips

1. **First time setup**: Set your script directory once, then just use filenames
2. **Quick switching**: Just mention a new file name to switch active files
3. **Persistent**: Active file is saved between sessions
4. **Fallback**: Tools will use active file when no path is specified

## Troubleshooting

### File Not Found

- Check if the path is correct
- Set a script directory if using relative paths
- Ensure .ahk extension is included

### Wrong Action Detected

- Be more explicit with keywords
- Use `defaultAction` parameter in `AHK_Process_Request`
- Or call specific tools directly

### Path Not Detected

- Ensure .ahk extension is present
- Use quotes for paths with spaces
- Check the path format matches detection patterns
