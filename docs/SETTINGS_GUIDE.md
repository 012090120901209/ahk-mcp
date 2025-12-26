# Tool Settings System

## Overview

You now have a comprehensive settings system that allows you to **enable or
disable individual tools** and control various features of the MCP server.

## 🎛️ The `AHK_Settings` Tool

### Get Current Settings

```json
{
  "tool": "AHK_Settings",
  "arguments": {
    "action": "get"
  }
}
```

### Disable File Editing Tools

```json
{
  "tool": "AHK_Settings",
  "arguments": {
    "action": "disable_editing"
  }
}
```

### Enable File Editing Tools

```json
{
  "tool": "AHK_Settings",
  "arguments": {
    "action": "enable_editing"
  }
}
```

### Enable Auto Run After Edits

```json
{
  "tool": "AHK_Settings",
  "arguments": {
    "action": "enable_auto_run"
  }
}
```

### Disable Auto Run After Edits

```json
{
  "tool": "AHK_Settings",
  "arguments": {
    "action": "disable_auto_run"
  }
}
```

### Disable a Specific Tool

```json
{
  "tool": "AHK_Settings",
  "arguments": {
    "action": "disable_tool",
    "tool": "AHK_File_Edit"
  }
}
```

### Enable a Specific Tool

```json
{
  "tool": "AHK_Settings",
  "arguments": {
    "action": "enable_tool",
    "tool": "AHK_File_Edit"
  }
}
```

## 🔧 Available Actions

| Action             | Description                       | Example                                    |
| ------------------ | --------------------------------- | ------------------------------------------ |
| `get`              | Show current settings             | View all tool states                       |
| `enable_tool`      | Enable a specific tool            | `"tool": "AHK_File_Edit"`                  |
| `disable_tool`     | Disable a specific tool           | `"tool": "AHK_File_Active"`                |
| `enable_editing`   | Enable ALL file editing tools     | Enables 7 tools at once                    |
| `disable_editing`  | Disable ALL file editing tools    | Disables 7 tools at once                   |
| `enable_auto_run`  | Enable automatic run after edits  | Persists the `runAfter` preference         |
| `disable_auto_run` | Disable automatic run after edits | Keeps scripts from launching automatically |
| `enable_all`       | Enable all optional tools         | Everything on                              |
| `disable_all`      | Disable all non-core tools        | Minimal mode                               |
| `reset`            | Reset to default settings         | Factory defaults                           |
| `set`              | Update specific settings          | Custom configuration                       |

## 📦 Tool Groups

### File Editing Tools (Can be disabled)

- `AHK_File_Edit` - Text editing operations
- `AHK_File_Edit_Diff` - Diff patch application
- `AHK_File_Active` - Active file management
- `AHK_File_Detect` - Automatic file detection
- `AHK_Active_File` - Legacy active file tool
- `AHK_Process_Request` - Multi-line request processing
- `AHK_File_Edit_Small` - Lightweight line/pattern edits

### Core Tools (Always enabled)

- `AHK_Diagnostics` - Code validation
- `AHK_Analyze` - Code analysis
- `AHK_Run` - Script execution
- `AHK_Summary` - Documentation summary
- `AHK_Settings` - This settings tool

## 🛡️ Global Settings

### Configure Global Options

```json
{
  "tool": "AHK_Settings",
  "arguments": {
    "action": "set",
    "settings": {
      "allowFileEditing": false,
      "allowFileDetection": false,
      "alwaysBackup": true,
      "maxFileSize": 5242880
    }
  }
}
```

### Available Global Settings

| Setting                | Type    | Description                           | Default         |
| ---------------------- | ------- | ------------------------------------- | --------------- |
| `allowFileEditing`     | boolean | Allow file modification tools         | true            |
| `allowFileDetection`   | boolean | Auto-detect file paths in text        | true            |
| `requireExplicitPaths` | boolean | Require full paths (no auto-detect)   | false           |
| `alwaysBackup`         | boolean | Force backups on all edits            | true            |
| `restrictToAhkFiles`   | boolean | Only allow .ahk file operations       | true            |
| `maxFileSize`          | number  | Max file size in bytes                | 10485760 (10MB) |
| `autoRunAfterEdit`     | boolean | Run scripts automatically after edits | false           |

## 💾 Settings Storage

Settings are persisted in:

- **Windows**: `%APPDATA%\ahk-mcp\tool-settings.json`
- **Linux/Mac**: `~/.config/ahk-mcp/tool-settings.json`

### Settings File Format

```json
{
  "enabledTools": {
    "AHK_File_Edit": true,
    "AHK_File_Edit_Diff": true,
    "AHK_File_Active": true,
    "AHK_File_Detect": true,
    "AHK_Active_File": true,
    "AHK_Process_Request": true,
    "AHK_File_Edit_Small": true
  },
  "allowFileEditing": true,
  "allowFileDetection": true,
  "requireExplicitPaths": false,
  "alwaysBackup": true,
  "restrictToAhkFiles": true,
  "maxFileSize": 10485760,
  "autoRunAfterEdit": false
}
```

## 🚀 Use Cases

### 1. Read-Only Mode

Disable all file editing but keep analysis:

```json
{
  "tool": "AHK_Settings",
  "arguments": {
    "action": "disable_editing"
  }
}
```

### 2. Minimal Mode

Only core tools, no file operations:

```json
{
  "tool": "AHK_Settings",
  "arguments": {
    "action": "disable_all"
  }
}
```

### 3. No Auto-Detection

Require explicit file paths:

```json
{
  "tool": "AHK_Settings",
  "arguments": {
    "action": "set",
    "settings": {
      "allowFileDetection": false,
      "requireExplicitPaths": true
    }
  }
}
```

### 4. Maximum Safety

Always backup, restrict to .ahk only:

```json
{
  "tool": "AHK_Settings",
  "arguments": {
    "action": "set",
    "settings": {
      "alwaysBackup": true,
      "restrictToAhkFiles": true,
      "maxFileSize": 1048576
    }
  }
}
```

## ⚠️ What Happens When Tools Are Disabled

When you try to use a disabled tool, you'll get:

```
⚠️ Tool 'AHK_File_Edit' is currently disabled.

To enable it, use the 'AHK_Settings' tool:
{
  "tool": "AHK_Settings",
  "arguments": {
    "action": "enable_tool",
    "tool": "AHK_File_Edit"
  }
}
```

## 🔄 Environment Variables

You can override the settings file location:

```bash
export AHK_MCP_SETTINGS_PATH=/custom/path/settings.json
```

## 📋 Quick Commands

### Check What's Enabled

```json
{ "tool": "AHK_Settings", "arguments": { "action": "get" } }
```

### Turn Off File Editing

```json
{ "tool": "AHK_Settings", "arguments": { "action": "disable_editing" } }
```

### Turn On File Editing

```json
{ "tool": "AHK_Settings", "arguments": { "action": "enable_editing" } }
```

### Reset Everything

```json
{ "tool": "AHK_Settings", "arguments": { "action": "reset" } }
```

## 🎯 Benefits

1. **Security**: Disable file editing when only reading/analyzing
2. **Control**: Fine-grained control over each tool
3. **Safety**: Prevent accidental file modifications
4. **Flexibility**: Different modes for different use cases
5. **Persistence**: Settings survive server restarts

## Notes

- Core tools (`AHK_Diagnostics`, `AHK_Analyze`, `AHK_Run`, `AHK_Summary`)
  **cannot be disabled**
- The `AHK_Settings` tool itself **cannot be disabled**
- Settings are loaded on server start and saved immediately on change
- Disabled tools return helpful messages explaining how to re-enable them
