# Test Cases for Multi-Line Input Processing

## Test Case 1: File Path on First Line, Instruction on Next

```
C:\Scripts\MyScript.ahk

Fix the syntax errors
```

**Expected**: Detects file, sets as active, runs diagnostics

## Test Case 2: File Path with Double Line Break

```
test-gui.ahk


Run this script
```

**Expected**: Detects file, sets as active, executes script

## Test Case 3: Quoted Path with Instructions

```
"C:\My Scripts\automation.ahk"

Analyze the code complexity
```

**Expected**: Handles spaces in path, runs analysis

## Test Case 4: Just Filename with Action

```
calculator.ahk
validate and run
```

**Expected**: Searches in script directory, validates then runs

## Test Case 5: Path Embedded in Sentence

```
Please check C:\Scripts\test.ahk for errors and fix them
```

**Expected**: Extracts path from sentence, runs diagnostics

## Test Case 6: Multiple Line Instructions

```
MyAutomation.ahk

Add error handling
Make it more robust
Include logging
```

**Expected**: Detects file, understands multi-line instructions as edit request

## How to Use in Practice

### With Claude + MCP:

1. **Direct Tool Call**: Use `AHK_Process_Request` tool with the multi-line
   input

2. **Auto-Detection**: Use `AHK_File_Detect` to detect and set from any text

3. **Manual Process**:
   - First: `AHK_File_Detect` to set the file
   - Then: Use any tool without specifying path

### Example MCP Request:

```json
{
  "tool": "AHK_Process_Request",
  "arguments": {
    "input": "C:\\Scripts\\test.ahk\n\nCheck for errors and run it",
    "autoExecute": true,
    "defaultAction": "auto"
  }
}
```

### The Result:

- File automatically set as active
- Action detected from keywords
- Appropriate tool executed
- Results returned with context
