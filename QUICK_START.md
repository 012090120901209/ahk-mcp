# AutoHotkey MCP Server - Quick Start Guide

## 🚀 New in v2.1: File Management & Alpha Versioning

### Instant File Editing

**Just mention a file path** - the server automatically detects and manages it:

```
"C:\Scripts\calculator.ahk - add error handling"
```

✅ File detected → Set as active → Ready for editing

### 🔧 Essential Tools

#### Quick Edit
```json
{"tool": "ahk_edit", "arguments": {"action": "replace", "search": "old text", "content": "new text"}}
```

#### Apply Git Diff
```json
{"tool": "ahk_diff_edit", "arguments": {"diff": "--- file.ahk\n+++ file.ahk\n@@ -1,3 +1,4 @@\n code"}}
```

#### Create Alpha Version
```json
{"tool": "ahk_alpha", "arguments": {"action": "create"}}
```

#### Manage Settings
```json
{"tool": "ahk_settings", "arguments": {"action": "disable_editing"}}
```

### 📋 Common Workflows

#### 1. Quick Text Replace
```
User: "Change all 'Hello' to 'Hi' in the active file"
Tool: ahk_edit with action "replace", search "Hello", content "Hi", all true
```

#### 2. Multi-line Input
```
test.ahk

Fix syntax errors and add logging

→ Detects file path
→ Sets as active  
→ Processes request automatically
```

#### 3. Alpha Version Creation
```
Edit fails → Edit fails → Edit fails
→ AUTO: Creates test_a1.ahk
→ Switches to alpha
→ Fresh start
```

### 🛡️ Safety Features

- **Automatic Backups**: `.bak` files created before changes
- **Dry Run Mode**: Preview changes without applying
- **Tool Disable**: Turn off editing for read-only mode
- **Path Validation**: Only `.ahk` files can be modified

### ⚙️ Settings Control

```json
// Read-only mode
{"tool": "ahk_settings", "arguments": {"action": "disable_editing"}}

// Full editing mode  
{"tool": "ahk_settings", "arguments": {"action": "enable_editing"}}

// Check what's enabled
{"tool": "ahk_settings", "arguments": {"action": "get"}}
```

### 🎯 Token Efficiency

**Most Efficient**: `ahk_edit` (20-30 tokens per operation)
**Less Efficient**: `ahk_diff_edit` (100-200 tokens per operation)

**Use `ahk_edit` for**: Simple replacements, line insertions, quick changes
**Use `ahk_diff_edit` for**: Complex multi-location changes, when you have existing diffs

### 📁 File Locations

- **Settings**: `%APPDATA%\ahk-mcp\tool-settings.json`
- **Versions**: `%APPDATA%\ahk-mcp\alpha-versions.json`
- **Backups**: Same directory as original with `.bak` extension

### 🆘 Troubleshooting

**File not detected?**
- Ensure `.ahk` extension is present
- Use full paths or set script directory
- Check path format (quotes for spaces)

**Tool disabled?**
- Run: `{"tool": "ahk_settings", "arguments": {"action": "get"}}`
- Enable with: `{"tool": "ahk_settings", "arguments": {"action": "enable_editing"}}`

**Edit failed?**
- Check file permissions
- Verify file exists and is readable
- Look for syntax in search patterns

### 🎯 Best Practices

1. **Let auto-detection work** - Just mention file paths naturally
2. **Use simple edits** - `ahk_edit` is more token-efficient
3. **Enable alpha versioning** - Great for experimental changes
4. **Check settings first** - Know what tools are available
5. **Backup before big changes** - Use dry-run mode for previews

### 🔗 Full Documentation

- [Edit Tools Guide](EDIT_TOOLS_GUIDE.md) - Complete editing documentation
- [Settings Guide](SETTINGS_GUIDE.md) - Configuration options
- [Alpha Version Guide](ALPHA_VERSION_GUIDE.md) - Versioning system
- [Code Specification](docs/CODE_SPECIFICATION.md) - Technical details

---

**Ready to start?** Just mention an AutoHotkey file path and begin editing!