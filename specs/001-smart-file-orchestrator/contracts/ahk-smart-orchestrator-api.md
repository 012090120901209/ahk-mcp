# API Contract: AHK_Smart_Orchestrator

**Tool Name**: `AHK_Smart_Orchestrator`
**Version**: 1.0.0
**Protocol**: Model Context Protocol (MCP) v0.5.0

## Overview

The Smart Orchestrator provides an intelligent interface for file operations that minimizes redundant tool calls by chaining detection � analysis � reading � editing operations with smart caching.

## MCP Tool Definition

```json
{
  "name": "AHK_Smart_Orchestrator",
  "description": "Intelligently orchestrates file detection, analysis, and viewing operations to minimize redundant tool calls. Automatically chains detect � analyze � read � edit workflow with smart caching. Reduces tool calls from 7-10 down to 3-4 by maintaining session context.\n\nUse this tool when you want to efficiently work with AHK files without manually coordinating multiple tools.\n\nExamples:\n- \"view the _Dark class\" - Auto-detects file, analyzes, shows class code\n- \"edit ColorCheckbox method in _Dark\" - Finds method, prepares for editing\n- \"analyze file structure\" - Shows all classes and functions",
  "inputSchema": {
    "type": "object",
    "properties": {
      "intent": {
        "type": "string",
        "description": "High-level description of what you want to do (e.g., \"edit the _Dark class checkbox methods\")"
      },
      "filePath": {
        "type": "string",
        "description": "Optional: Direct path to AHK file (skips detection if provided)"
      },
      "targetEntity": {
        "type": "string",
        "description": "Optional: Specific class, method, or function name to focus on (e.g., \"_Dark\", \"_Dark.ColorCheckbox\")"
      },
      "operation": {
        "type": "string",
        "enum": ["view", "edit", "analyze"],
        "default": "view",
        "description": "Operation type: view (read-only), edit (prepare for editing), analyze (structure only)"
      },
      "forceRefresh": {
        "type": "boolean",
        "default": false,
        "description": "Force re-analysis even if cached data exists"
      }
    },
    "required": ["intent"]
  }
}
```

## Request Format

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `intent` | string | Yes | - | Natural language description of the task |
| `filePath` | string | No | - | Absolute path to .ahk file (skips auto-detection) |asfd
| `targetEntity` | string | No | - | Class/method/function name (e.g., "_Dark", "_Dark.ApplyTheme") |
| `operation` | enum | No | "view" | One of: "view", "edit", "analyze" |
| `forceRefresh` | boolean | No | false | Bypass cache, force re-analysis |

### Validation Rules

**intent**:
- MUST NOT be empty
- Should contain context about what file/entity to work with
- Examples: "edit checkbox methods", "view _Dark class", "analyze __Lists.ahk"

**filePath** (if provided):
- MUST be absolute path
- MUST end with `.ahk` (case-insensitive)
- File MUST exist and be readable
- If provided, skips auto-detection step

**targetEntity** (if provided):
- Format: "ClassName" or "ClassName.MethodName"
- MUST match an entity found in analysis
- Case-sensitive (matches AHK v2 naming)

**operation**:
- `view`: Read-only display of code
- `edit`: Prepare for editing (sets active file)
- `analyze`: Show structure only (no code content)

## Response Format

### Success Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "<� **Smart Orchestrator Results**\n\n=� Performance: 2 tool call(s) | Cache: HIT (\n=� File: C:\\...\\__Lists.ahk\n<� Target: _Dark (lines 880-1559)\n� Cache age: 5s\n\n---\n\n[Code content or structure analysis...]"
    }
  ]
}
```

**Response Structure** (parsed from `text` field):
- **Header**: Tool call count, cache status, file path, target entity
- **Performance Metrics**: Number of tool calls made, cache hit/miss indicator
- **Context**: Relevant code sections or structure information
- **Next Steps**: Suggested actions for user

### Error Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "L **Orchestration Failed**\n\n=� Tool calls made: 2\n\n**Errors:**\n" Class '_DarkMode' not found in file\n" Available classes: _Dark, ResponsiveListManager\n\n**=� Suggestions:**\n" Provide explicit filePath parameter if detection fails\n" Use operation: \"analyze\" to see available entities\n" Check that file exists and has .ahk extension"
    }
  ],
  "isError": true
}
```

## Tool Call Optimization

### Performance Targets

| Scenario | Expected Tool Calls | Tools Invoked |
|----------|-------------------|---------------|
| **Fresh file analysis** | d4 calls | AHK_File_Detect (if needed), AHK_Analyze, AHK_File_View, AHK_File_Active (if edit) |
| **Cached file** | d2 calls | AHK_File_View, AHK_File_Active (if edit) |
| **Direct path provided** | d3 calls | AHK_Analyze, AHK_File_View, AHK_File_Active (if edit) |

### Workflow Decision Tree

```
Start
  �
Has filePath? � No � Call AHK_File_Detect (1 call)
  � Yes
File in cache? � Yes � File modified? � No � Use cache (
  � No                    � Yes
Call AHK_Analyze (1 call)
  �
Has targetEntity? � Yes � Find entity in analysis
  � No                    �
Use first class/entire file
  �
operation == 'analyze'? � Yes � Return analysis only
  � No
Call AHK_File_View (1 call)
  �
operation == 'edit'? � Yes � Call AHK_File_Active (1 call)
  � No
Return result
```

## Example Usage

### Example 1: View a Class (Cache Miss)

**Request**:
```json
{
  "intent": "view the _Dark class in __Lists.ahk",
  "operation": "view"
}
```

**Internal Workflow**:
1. AHK_File_Detect extracts path from intent � 1 call
2. No cache � AHK_Analyze runs � 1 call
3. Find "_Dark" class in analysis
4. AHK_File_View reads lines 880-1559 � 1 call
5. **Total: 3 calls**

**Response**:
```
<� **Smart Orchestrator Results**

=� Performance: 3 tool call(s) | Cache: MISS
=� File: C:\Scripts\__Lists.ahk
<� Target: _Dark (lines 880-1559)

---

class _Dark {
  static Dark := Map(
    "Background", 0x171717,
    ...
  )
}
```

### Example 2: Edit Method (Cache Hit)

**Request**:
```json
{
  "intent": "edit the ColorCheckbox method",
  "targetEntity": "_Dark.ColorCheckbox",
  "operation": "edit"
}
```

**Internal Workflow**:
1. File already in cache (from Example 1) � 0 calls
2. Find "_Dark.ColorCheckbox" method in cached analysis
3. AHK_File_View reads method lines � 1 call
4. AHK_File_Active sets active file � 1 call
5. **Total: 2 calls**

**Response**:
```
<� **Smart Orchestrator Results**

=� Performance: 2 tool call(s) | Cache: HIT (
=� File: C:\Scripts\__Lists.ahk
<� Target: _Dark.ColorCheckbox (lines 1234-1278)
� Cache age: 30s

---

[Method code...]

**Next Steps:**
" Use AHK_File_Edit to modify the code
" File is set as active for editing
```

### Example 3: Analyze Structure Only

**Request**:
```json
{
  "filePath": "C:\\Scripts\\__Lists.ahk",
  "operation": "analyze"
}
```

**Internal Workflow**:
1. Path provided � skip detection
2. Cache hit � use cached analysis � 0 calls
3. Return structure only (no file reading)
4. **Total: 0 calls** (pure cache)

**Response**:
```
<� **File Structure Analysis**

=� Performance: 0 tool call(s) | Cache: HIT (
=� File: C:\Scripts\__Lists.ahk

=� **Classes (2):**
" _Dark (lines 880-1559)
" ResponsiveListManager (lines 1600-2300)

=' **Functions (3):**
" InitializeTheme (lines 50-120)
" ApplyColorScheme (lines 150-200)

**Next Steps:**
" Use targetEntity parameter to view specific class/function
" Use operation: "view" to read file content
```

## Error Scenarios

### Error 1: File Not Found

**Request**:
```json
{
  "intent": "view DarkMode class"
}
```

**Response**:
```
L **Orchestration Failed**

=� Tool calls made: 1

**Errors:**
" Could not auto-detect file. No .ahk file references found in intent.

**=� Suggestions:**
" Provide explicit filePath parameter
" Include filename in intent (e.g., "view _Dark class in __Lists.ahk")
```

### Error 2: Entity Not Found

**Request**:
```json
{
  "filePath": "C:\\Scripts\\__Lists.ahk",
  "targetEntity": "DarkMode"
}
```

**Response**:
```
L **Orchestration Failed**

=� Tool calls made: 1

**Errors:**
" Target entity 'DarkMode' not found in file
" Available entities: _Dark, ResponsiveListManager, InitializeTheme, ApplyColorScheme

**=� Suggestions:**
" Use operation: "analyze" to see full file structure
" Check spelling of class/function name
```

## Cache Management

### Cache Entry Structure

Each file has a cache entry containing:
- File path
- Analysis result (classes, methods, functions)
- Analysis timestamp
- File modification time (mtime)
- Operation history

### Cache Invalidation

Cache is invalidated when:
1. File's mtime is newer than cached mtime (external edit)
2. `forceRefresh: true` is set in request
3. Server process restarts (in-memory cache)

### Cache Performance

- **Lookup**: O(1) by file path (Map-based)
- **Storage**: In-memory (no persistence)
- **Lifetime**: Session-scoped (cleared on restart)
- **Size**: Unbounded (YAGNI for typical sessions)

## Testing Contract

### Unit Test Requirements

1. **Parameter Validation**
   - Empty intent � error
   - Invalid filePath � error
   - Invalid operation enum � error
   - Malformed targetEntity � error

2. **Workflow Logic**
   - Provided filePath � skips detection
   - Cache hit � skips analysis
   - Stale cache � re-analyzes
   - forceRefresh � bypasses cache

3. **Entity Resolution**
   - Find class by name
   - Find method by "Class.Method" format
   - Entity not found � error with suggestions

### Integration Test Requirements

1. **End-to-End Workflow**
   - Fresh file � 3-4 tool calls
   - Cached file � 2 tool calls
   - Cache invalidation after file edit

2. **Performance Validation**
   - Measure actual tool calls made
   - Verify cache hit rate > 50% in typical sessions
   - Ensure < 2 second response for files < 5000 lines

## Breaking Change Policy

### Backward Compatibility

- Tool name `AHK_Smart_Orchestrator` is stable
- `intent` parameter is always required
- `operation` enum can be extended (additive only)

### Versioning

Format: `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes to required parameters
- MINOR: New optional parameters, new operation types
- PATCH: Bug fixes, performance improvements

---

**Contract Version**: 1.0.0
**Last Updated**: 2025-10-02
**Status**: Ready for Implementation 
