# Release Notes - AutoHotkey v2 MCP Server

## 🚀 v2.1.0 - "Advanced File Management & Alpha Versioning" (2024-01-15)

### Major New Features

#### 🆕 Complete File Management System

- **Smart Active File Detection**: Automatically detects and manages `.ahk` file
  paths from user messages
- **Unified File Variable**: Single shared `activeFilePath` variable used by all
  tools
- **Cross-Platform Path Resolution**: Intelligent path handling for Windows,
  Linux, and Mac
- **Persistent File Tracking**: Active file survives server restarts

#### 🆕 Advanced Editing Tools

- **`AHK_File_Edit`**: Comprehensive text editing with replace, insert, delete,
  append, prepend operations
- **`AHK_File_Edit_Diff`**: Apply unified diff patches (Git-style diffs) with
  validation and dry-run mode
- **Regex Support**: Full regex pattern matching for search and replace
  operations
- **Automatic Backups**: Creates `.bak` files before any modification
- **Token-Efficient**: Minimal token usage compared to diff-based approaches

#### 🆕 Alpha Versioning System

- **Automatic Version Creation**: Creates `script_a1.ahk`, `script_a2.ahk` when
  development stalls
- **Failure Tracking**: Monitors edit failures and triggers alpha creation after
  3 attempts
- **Version Management**: Track and switch between multiple alpha versions
- **Metadata Headers**: Each alpha includes creation timestamp and reason
- **State Persistence**: Version history preserved across sessions

#### 🆕 Tool Settings & Configuration

- **Granular Control**: Enable/disable individual tools and features
- **Tool Groups**: Quick enable/disable for file editing vs analysis-only modes
- **Safety Settings**: Configure automatic backups, file restrictions, and size
  limits
- **Environment Overrides**: Customize behavior via environment variables

### New Tools Added

1. **`AHK_File_Active`** - Active file management (get, set, detect, clear)
2. **`AHK_File_Edit`** - Text editing operations with regex support
3. **`AHK_File_Edit_Diff`** - Apply unified diff patches
4. **`AHK_Alpha`** - Alpha version creation and management
5. **`AHK_Settings`** - Tool configuration and feature toggles
6. **`AHK_File_Detect`** - Automatic file path detection from text
7. **`AHK_Process_Request`** - Multi-line input processing

### Enhanced Existing Tools

#### `AHK_Run`

- **Active File Integration**: Uses active file when no path specified
- **Enhanced Process Management**: Better PID tracking and cleanup
- **Window Detection**: Verify GUI script window creation with timing
- **Error Handling**: Improved error messages with suggestions

#### `AHK_Diagnostics` & `AHK_Analyze`

- **Auto File Detection**: Automatically detect file paths in code input
- **Active File Support**: Work with active file when no code provided

#### Server Core

- **Automatic Path Detection**: Scans all tool inputs for file paths
- **Smart Tool Routing**: Route requests to appropriate tools based on content
- **Enhanced Error Handling**: Better error messages and recovery

### Configuration & Settings

#### Tool Settings (`AHK_Settings`)

```json
// Disable all file editing tools
{"action": "disable_editing"}

// Enable specific tool
{"action": "enable_tool", "tool": "AHK_File_Edit"}

// Configure global settings
{"action": "set", "settings": {"alwaysBackup": true, "maxFileSize": 5242880}}
```

#### Environment Variables

- `AHK_MCP_DATA_MODE=light` - Minimal documentation loading
- `AHK_MCP_SETTINGS_PATH` - Custom settings location
- `AHK_SCRIPT_DIR` - Default script directory

#### File Locations

- Settings: `%APPDATA%\ahk-mcp\tool-settings.json`
- Alpha History: `%APPDATA%\ahk-mcp\alpha-versions.json`
- Config: `%APPDATA%\ahk-mcp\config.json`

### Usage Examples

#### Smart File Detection

```
User: "C:\Scripts\test.ahk - fix the syntax errors"
→ File automatically detected and set as active
→ AHK_Diagnostics runs on the file
→ Issues identified and fixed
```

#### Alpha Versioning Workflow

```
1. Edit script.ahk → Fails (tracked: 1/3)
2. Edit script.ahk → Fails (tracked: 2/3)
3. Edit script.ahk → Fails (tracked: 3/3)
4. AUTO: Creates script_a1.ahk
5. Switches to alpha version
6. Fresh approach on alpha
```

#### Diff-Based Editing

```
User provides Git diff patch:
--- calculator.ahk
+++ calculator.ahv
@@ -1,3 +1,4 @@
 ; Calculator Script
+#SingleInstance Force

 F1::MsgBox("Calculator")

→ Patch applied with validation
→ Backup created automatically
```

### Technical Improvements

#### Architecture

- **Singleton Pattern**: Ensures single shared state across all tools
- **TypeScript Strict Mode**: Complete type safety throughout
- **Zod Validation**: All tool inputs validated with comprehensive schemas
- **Error-First Design**: Robust error handling with graceful fallbacks

#### Performance

- **Token Efficiency**: `AHK_File_Edit` uses 6x fewer tokens than diff-based
  editing
- **Smart Caching**: File content caching and validation
- **Lazy Loading**: Documentation loaded on-demand
- **Process Management**: Efficient AutoHotkey process tracking

#### Security & Safety

- **Path Validation**: Prevents directory traversal attacks
- **File Extension Enforcement**: Only `.ahk` files can be edited
- **Automatic Backups**: Prevents data loss from failed operations
- **Configurable Restrictions**: Size limits and path constraints

### Documentation

#### New Documentation Files

- `EDIT_TOOLS_GUIDE.md` - Comprehensive editing tools documentation
- `SETTINGS_GUIDE.md` - Tool configuration and settings
- `ALPHA_VERSION_GUIDE.md` - Alpha versioning system documentation
- `SIMPLE_ACTIVE_FILE.md` - Active file system explanation
- `docs/CODE_SPECIFICATION.md` - Complete technical specification

#### Updated Documentation

- `README.md` - Completely revised with new features
- `CLAUDE.md` - Updated coding standards and patterns

### Breaking Changes

None - All changes are additive and backward compatible.

### Migration Guide

No migration needed. Existing functionality preserved and enhanced.

### Bug Fixes

- Fixed TypeScript compilation errors in edit tools
- Improved error handling in file operations
- Better path resolution on cross-platform environments
- Enhanced memory management for large files

---

## v2.0.0 - "MCP Foundation" (Previous Release)

### Initial Features

- Core MCP server implementation
- AutoHotkey v2 diagnostics and analysis
- Documentation search and indexing
- Script execution capabilities
- VS Code integration
- Debug assistance
- Context injection system

---

## Roadmap

### v2.2.0 - "Enhanced Intelligence" (Planned)

- **AI-Powered Refactoring**: Intelligent code restructuring
- **Performance Profiling**: Script performance analysis and optimization
- **Test Generation**: Automatic unit test creation
- **Code Completion**: Advanced IntelliSense-like completions

### v2.3.0 - "Collaboration Features" (Planned)

- **Team Settings**: Multi-user configuration management
- **Project Management**: Workspace and project organization
- **Version Control Integration**: Direct Git integration
- **Shared Templates**: Community template library

### Long-term Vision

- **Visual Editor**: GUI designer for AutoHotkey applications
- **Package Manager**: AutoHotkey library management
- **Cloud Synchronization**: Cross-device settings and project sync
- **Plugin System**: Extensible architecture for third-party tools

---

**Full Changelog**:
[v2.0.0...v2.1.0](https://github.com/TrueCrimeAudit/ahk-mcp/compare/v2.0.0...v2.1.0)
