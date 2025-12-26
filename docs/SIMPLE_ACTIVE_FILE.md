# Simple Active File System

## The Single Shared Variable

There is now **ONE shared variable** that ALL tools use:

```typescript
// Located in src/core/active-file.ts
activeFile.activeFilePath; // This is THE variable
```

## How It Works

### Automatic Detection

**Every tool** automatically detects file paths in ANY string input:

1. User mentions a file path anywhere → Variable is set
2. User runs any tool → Variable is available
3. All tools share the same variable

### The Variable is Set When:

- **Any tool receives input** containing a .ahk file path
- User uses `AHK_File_Active` tool to explicitly set it
- User runs `AHK_Run` with a file path
- User provides code to `AHK_Diagnostics` that contains a path
- User mentions a path in `AHK_Analyze` input
- **Basically: ANY TIME a .ahk path appears ANYWHERE**

## Usage Examples

### Example 1: Simple Path Detection

```
User input to ANY tool:
"C:\Scripts\MyScript.ahk"

Result:
✅ activeFile.activeFilePath = "C:\Scripts\MyScript.ahk"
```

### Example 2: Path in a Sentence

```
User input:
"Please check test.ahk for errors"

Result:
✅ activeFile.activeFilePath = "C:\current\dir\test.ahk" (if found)
```

### Example 3: Multi-line Input

```
User input:
C:\Scripts\calculator.ahk

Fix the errors

Result:
✅ activeFile.activeFilePath = "C:\Scripts\calculator.ahk"
Then the tool runs with that file
```

## The Tools

### Primary Tool: `AHK_File_Active`

Simple management of the shared variable:

- `action: "get"` - Show current active file
- `action: "set"` - Set the active file
- `action: "detect"` - Detect from text
- `action: "clear"` - Clear the variable

### All Other Tools

**AUTOMATICALLY** detect and use the variable:

- `AHK_Run` - Uses active file if no path provided
- `AHK_Diagnostics` - Auto-detects paths in code
- `AHK_Analyze` - Auto-detects paths in code
- Every other tool - Same behavior

## Technical Details

### The Singleton Pattern

```typescript
class ActiveFileManager {
  // THE variable
  public activeFilePath: string | undefined = undefined;

  // Single instance
  private static instance: ActiveFileManager;

  static getInstance() {
    if (!this.instance) {
      this.instance = new ActiveFileManager();
    }
    return this.instance;
  }
}

// Global instance used by ALL tools
export const activeFile = ActiveFileManager.getInstance();
```

### Auto-Detection in Server

```typescript
// In server.ts - runs for EVERY tool call
if (args && typeof args === 'object') {
  for (const value of Object.values(args)) {
    if (typeof value === 'string') {
      autoDetect(value); // Check for file paths
    }
  }
}
```

## Benefits

1. **Simplicity**: One variable, shared everywhere
2. **Automatic**: No manual setting needed
3. **Persistent**: Stays set until changed or cleared
4. **Universal**: Works with ALL tools
5. **Smart**: Detects paths in any format

## File Path Patterns Detected

- `"C:\Scripts\file.ahk"` - Quoted paths
- `C:\Scripts\file.ahk` - Direct paths
- `./scripts/file.ahk` - Relative paths
- `file.ahk` - Just filenames
- Paths embedded in sentences

## No Configuration Needed

This is NOT stored in config files. It's a simple in-memory variable that:

- Lives as long as the server runs
- Shared by all tools
- Updated automatically
- No persistence between restarts (unless you want to add it)

## Summary

**One variable. All tools. Automatic detection.**

That's it. Simple and effective.
