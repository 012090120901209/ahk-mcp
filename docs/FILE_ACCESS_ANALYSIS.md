# How AutoHotkey MCP Views and Manages Files

## 🔍 **File Access Architecture Overview**

The AHK MCP server uses a **multi-layered file management system** with
automatic detection, active file tracking, and intelligent path resolution.

## 📁 **Core File Management Components**

### 1. **Active File Manager** (`src/core/active-file.ts`)

- **Single shared state**: All tools access one global `activeFilePath` variable
- **Persistent tracking**: Saves active file to config for session continuity
- **Environment variable support**: Can be set via `AHK_ACTIVE_FILE` env var
- **Automatic restoration**: Restores last active file on server startup

```typescript
// Global singleton pattern
class ActiveFileManager {
  public activeFilePath: string | undefined = undefined;
  public lastDetectedPath: string | undefined = undefined;
  public lastModified: Date | undefined = undefined;
}
```

### 2. **Auto-Detection System** (`src/server.ts` + `src/core/config.ts`)

- **Intercepts all tool calls**: Scans every string argument for file paths
- **Multi-pattern detection**: Handles quoted paths, drive letters, relative
  paths, filenames
- **Automatic setting**: Sets detected `.ahk` files as active automatically

```typescript
// Automatic detection on EVERY tool call
if (toolSettings.isFileDetectionAllowed() && args) {
  for (const value of Object.values(args)) {
    if (typeof value === 'string') {
      autoDetect(value); // Scans for file paths
    }
  }
}
```

### 3. **Path Resolution Engine** (`src/core/config.ts`)

- **Multi-location search**: Checks absolute paths, current directory, recent
  files
- **Intelligent fallback**: Tries multiple locations before giving up
- **Recent file cache**: Maintains history of last 10 detected paths

## 🔧 **File Access Patterns**

### **Pattern 1: Direct File Reading**

Most tools use Node.js `fs` module directly:

```typescript
// Synchronous reading (config files)
const text = fs.readFileSync(path, 'utf8');

// Asynchronous reading (script files)
const content = await fs.readFile(targetFile, 'utf-8');
```

### **Pattern 2: Active File Context**

Tools rely on the active file manager:

```typescript
import { getActiveFilePath, setActiveFilePath } from '../core/active-file.js';

const targetFile = getActiveFilePath();
if (!targetFile) {
  throw new Error('No active file set');
}
```

### **Pattern 3: Auto-Detection**

Server automatically detects files in user input:

```typescript
// Patterns detected automatically:
'test.ahk'; // Simple filename
'C:\Scripts\myapp.ahk'; // Absolute Windows path
'./scripts/helper.ahk'; // Relative path
'"My Script.ahk"'; // Quoted filename
```

## 🎯 **File Detection Patterns**

The `detectFilePaths()` function recognizes:

1. **Quoted paths**: `"C:\Scripts\test.ahk"`, `'./myfile.ahk'`
2. **Drive letters**: `C:\path\file.ahk`, `D:/scripts/test.ahk`
3. **Relative paths**: `./folder/file.ahk`, `../parent/file.ahk`
4. **Simple filenames**: `script.ahk`, `my-script.ahk`

## 📚 **Tool-Specific File Access**

### **Primary File Tools**

- **`ahk-file`**: Sets/gets active file, provides file status
- **`ahk-auto-file`**: Auto-detects and sets files from text
- **`ahk-recent`**: Manages recently accessed files

### **File Editing Tools**

- **`ahk-edit`**: Basic file modifications using active file context
- **`ahk-diff-edit`**: Diff-based editing with active file
- **`ahk-small-edit`**: Targeted small edits using active file
- **`ahk-alpha`**: Creates versioned copies of files

### **File Analysis Tools**

- **`ahk-analyze`**: Analyzes active file or provided code
- **`ahk-diagnostics`**: Checks active file for issues
- **`ahk-lsp`**: Provides LSP-style analysis on files/code

## ⚙️ **Configuration and Persistence**

### **Config File Structure** (`~/.ahk-mcp-config.json`)

```json
{
  "activeFile": "/path/to/current/script.ahk",
  "autoDetectedPaths": ["/recent/file1.ahk", "/recent/file2.ahk"],
  "lastModified": "2025-01-20T10:30:00.000Z"
}
```

### **Settings Management**

- **File detection**: Can be enabled/disabled via tool settings
- **Path validation**: Ensures files exist before setting as active
- **Automatic cleanup**: Removes non-existent files from recent list

## 🔒 **Security and Limitations**

### **Security Measures**

- **Path validation**: Checks file existence before operations
- **Extension filtering**: Only `.ahk` files are auto-detected
- **Absolute path resolution**: All paths converted to absolute for security

### **Current Limitations**

1. **No sandboxing**: MCP can access any file the process can read
2. **Windows-centric**: Path patterns optimized for Windows paths
3. **No file permissions**: Doesn't check read/write permissions before
   operations
4. **Limited file types**: Primarily focused on `.ahk` files
5. **No remote files**: Cannot access files over network/HTTP

### **Access Scope**

- **Full filesystem access**: Can read/write any file within process permissions
- **Current working directory**: Defaults to where MCP server was started
- **User's home directory**: Can access config and cache files
- **Cross-platform paths**: Handles both Windows (`C:\`) and Unix (`/`) paths

## 🚀 **Usage Workflow**

### **Typical User Flow**

1. User mentions file: `"Edit my test.ahk script"`
2. **Auto-detection**: Server finds `test.ahk` in current directory
3. **Active file set**: `test.ahk` becomes the active file
4. **Tool execution**: Edit tools work on the active file automatically
5. **Persistence**: File path saved for future sessions

### **Manual File Management**

```typescript
// Set active file explicitly
AHK_File_Active({ action: 'set', path: 'C:/Scripts/myapp.ahk' });

// Get current active file
AHK_File_Active({ action: 'get' });

// Detect files from text
AHK_File_Detect({ text: 'Edit the calculator.ahk file', autoSet: true });
```

## 💡 **Best Practices**

### **For Users**

- Mention file paths clearly in your requests
- Use full paths for files outside current directory
- Check active file status when editing operations fail

### **For Developers**

- Always validate file existence before operations
- Use the active file context when no specific file is provided
- Handle file permission errors gracefully
- Log file operations for debugging

## 🎯 **Summary**

The AHK MCP server provides **intelligent file management** that:

- ✅ **Automatically detects** file references in user input
- ✅ **Maintains active file context** across tool calls
- ✅ **Resolves paths intelligently** across multiple locations
- ✅ **Persists file state** between sessions
- ✅ **Provides secure file access** within process permissions

This creates a **seamless file workflow** where users can naturally reference
files, and the system automatically handles the file management complexity
behind the scenes.
