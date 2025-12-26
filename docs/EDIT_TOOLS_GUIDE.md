# AutoHotkey File Editing Tools

You now have powerful file editing capabilities that work with the
`activeFilePath` variable, similar to Claude's filesystem MCP tools.

## 🔧 Available Tools

### 1. `AHK_File_Edit` - Simple Edit Operations

For basic file editing operations like replace, insert, delete, append, prepend.

### 2. `AHK_File_Edit_Diff` - Unified Diff Patches

For applying unified diff patches (like Git diffs) to files.

### 3. `AHK_File_Edit_Small` - Targeted, Low-Token Updates

Optimised for quick tweaks without sharing whole files. Supports regex or
literal replacements and line-level inserts/deletes across one or many files.
Optional `preview` shows a diff instead of writing.

## 📝 AHK_File_Edit Tool

### Replace Text

```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "replace",
    "search": "old text",
    "content": "new text",
    "all": false
  }
}
```

### Insert at Line

```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "insert",
    "line": 5,
    "content": "; New comment line"
  }
}
```

### Delete Text or Lines

```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "delete",
    "search": "text to remove"
  }
}
```

```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "delete",
    "startLine": 10,
    "endLine": 15
  }
}
```

### Append to End

```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "append",
    "content": "\n; Added at end"
  }
}
```

### Replace and Run Immediately

```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "replace",
    "search": "MsgBox(\"Hello\")",
    "content": "MsgBox(\"Hello world!\")",
    "runAfter": true
  }
}
```

> Tip: Toggle the default behaviour via `AHK_Settings` (`enable_auto_run` /
> `disable_auto_run`).

### Prepend to Beginning

```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "prepend",
    "content": "#Requires AutoHotkey v2.0\n"
  }
}
```

## ⚡ AHK_File_Edit_Small Quick Examples

### Regex Replace with Preview

```json
{
  "tool": "AHK_File_Edit_Small",
  "arguments": {
    "action": "replace_regex",
    "file": "docs/PROJECT_STATUS.md",
    "find": "95%",
    "replace": "96%",
    "preview": true
  }
}
```

### Literal Replace Across Multiple Files

```json
{
  "tool": "AHK_File_Edit_Small",
  "arguments": {
    "action": "replace_literal",
    "files": ["README.md", "docs/PROJECT_STATUS.md"],
    "find": "AutoHotkey v2",
    "replace": "AHK v2",
    "all": true,
    "backup": true
  }
}
```

### Insert After Specific Line

```json
{
  "tool": "AHK_File_Edit_Small",
  "arguments": {
    "action": "line_insert_after",
    "file": "src/server.ts",
    "line": 140,
    "content": "// TODO: Add new transport option",
    "runAfter": true
  }
}
```

> Tip: Enable persistent auto-run with `AHK_Settings` → `enable_auto_run`.

## 🔀 AHK_File_Edit_Diff Tool

Apply unified diff patches like Git diffs:

```json
{
  "tool": "AHK_File_Edit_Diff",
  "arguments": {
    "diff": "--- original.ahk\n+++ modified.ahk\n@@ -1,3 +1,4 @@\n ; My Script\n+#Requires AutoHotkey v2.0\n \n MsgBox(\"Hello World\")",
    "dryRun": false
  }
}
```

### Diff Format Example

```diff
--- test.ahk
+++ test.ahk
@@ -1,5 +1,6 @@
 ; AutoHotkey Test Script
+#Requires AutoHotkey v2.0

 main() {
-    MsgBox("Old message")
+    MsgBox("New message")
 }
```

## 🎯 Usage Examples

### Example 1: Add Error Handling

```
User: Add error handling to the active file

Tool Call:
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "replace",
    "search": "MsgBox(\"Hello\")",
    "content": "try {\n    MsgBox(\"Hello\")\n} catch Error as e {\n    MsgBox(\"Error: \" e.Message)\n}"
  }
}
```

### Apply Diff and Run Right Away

```json
{
  "tool": "AHK_File_Edit_Diff",
  "arguments": {
    "diff": "--- script.ahk\n+++ script.ahk\n@@\n-MsgBox(\"Old\")\n+MsgBox(\"New\")",
    "runAfter": true
  }
}
```

> Tip: Toggle the default behaviour via `AHK_Settings` if you want scripts to
> run automatically every time.

### Example 2: Insert Function

```
User: Add a new function after line 10

Tool Call:
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "insert",
    "line": 11,
    "content": "\nShowMessage(msg) {\n    MsgBox(msg, \"Information\")\n}"
  }
}
```

### Example 3: Apply Git Diff

```
User: Apply this diff patch:

--- script.ahk
+++ script.ahk
@@ -1,3 +1,4 @@
 ; My AutoHotkey Script
+#SingleInstance Force

 F1::MsgBox("F1 pressed")

Tool Call:
{
  "tool": "AHK_File_Edit_Diff",
  "arguments": {
    "diff": "--- script.ahk\n+++ script.ahk\n@@ -1,3 +1,4 @@\n ; My AutoHotkey Script\n+#SingleInstance Force\n \n F1::MsgBox(\"F1 pressed\")"
  }
}
```

## 🔄 Integration with Active File

Both tools automatically work with the `activeFilePath`:

1. **Auto-Detection**: If you mention a file path, it's set as active
2. **Default Target**: Tools edit the active file if no `filePath` specified
3. **Backup Creation**: Both tools create `.bak` files by default
4. **Validation**: Only `.ahk` files can be edited

## 🛡️ Safety Features

### Automatic Backups

Both tools create backup files (`.bak`) before making changes:

- `script.ahk` → `script.ahk.bak`

### Dry Run Mode (AHK_File_Edit_Diff)

```json
{
  "tool": "AHK_File_Edit_Diff",
  "arguments": {
    "diff": "...",
    "dryRun": true
  }
}
```

Shows what would change without applying it.

### Validation

- File existence checks
- `.ahk` extension requirement
- Line number bounds checking
- Search text existence verification

## 🔍 Diff Format Guide

### Basic Unified Diff Structure

```diff
--- original_file
+++ modified_file
@@ -old_start,old_count +new_start,new_count @@
 context line
-removed line
+added line
 context line
```

### Hunk Header Explained

- `@@ -1,3 +1,4 @@` means:
  - Original: start at line 1, 3 lines
  - Modified: start at line 1, 4 lines

### Line Prefixes

- ` ` (space): Context line (unchanged)
- `-`: Removed from original
- `+`: Added to modified

## 🚀 Advanced Usage

### Regex Replace

```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "replace",
    "search": "MsgBox\\(\"[^\"]*\"\\)",
    "content": "MsgBox(\"Updated message\")",
    "regex": true,
    "all": true
  }
}
```

### Range Deletion

```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "delete",
    "startLine": 5,
    "endLine": 10
  }
}
```

## 💡 Tips

1. **Use dryRun first** with `AHK_File_Edit_Diff` to preview changes
2. **Backups are automatic** - disable with `"backup": false`
3. **Line numbers are 1-based** for all operations
4. **Regex patterns** use JavaScript regex syntax
5. **Context matters** - diffs require exact line matches

These tools give you the same powerful editing capabilities as Claude's
filesystem MCP, specifically tailored for AutoHotkey development!
