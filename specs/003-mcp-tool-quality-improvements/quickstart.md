# Quickstart: MCP Tool Quality Improvements

**Feature**: 003-mcp-tool-quality-improvements
**Purpose**: Validate all 4 quality improvements work correctly
**Duration**: ~5 minutes

---

## Prerequisites

- MCP server running with updated tools
- Test AHK file: `test-quality-improvements.ahk`
- MCP client (Claude Desktop, Inspector, or test harness)

---

## Scenario 1: Descriptive Parameter Naming ✅

**Goal**: Verify `newContent` parameter works and `content` remains compatible

### Test 1.1: Using New Parameter Name
```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "replace",
    "search": "oldText",
    "newContent": "replacementText",
    "filePath": "test-quality-improvements.ahk"
  }
}
```

**Expected Output**:
```
✅ Edit Successful
📄 File: test-quality-improvements.ahk
⚙️ Operation: Replaced first occurrence of "oldText" with "replacementText"
```

**Validation**:
- [ ] File was modified correctly
- [ ] Output mentions "newContent" (not "content")

---

### Test 1.2: Backward Compatibility (Old Parameter)
```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "replace",
    "search": "oldText",
    "content": "replacementText"
  }
}
```

**Expected Output**:
```
✅ Edit Successful
⚠️ Parameter 'content' is deprecated, use 'newContent' instead
```

**Validation**:
- [ ] Old parameter still works
- [ ] Deprecation warning shown
- [ ] File modified correctly

---

### Test 1.3: Both Parameters Provided (Priority Test)
```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "replace",
    "search": "oldText",
    "content": "WRONG",
    "newContent": "CORRECT"
  }
}
```

**Expected Behavior**:
- `newContent` takes precedence
- File should contain "CORRECT", not "WRONG"

**Validation**:
- [ ] newContent parameter won
- [ ] Warning shown about providing both

---

## Scenario 2: Debug Mode 🔍

**Goal**: Verify orchestration decisions are visible when debugMode enabled

### Test 2.1: Debug Mode Enabled
```json
{
  "tool": "AHK_Smart_Orchestrator",
  "arguments": {
    "intent": "view the ColorCheckbox method in _Dark class",
    "filePath": "darkmode.ahk",
    "debugMode": true
  }
}
```

**Expected Output**:
```
🎯 Smart Orchestrator Results
📊 Performance: 2 tool call(s) | Cache: MISS

---

[Normal file content output]

---

🔍 DEBUG: Orchestration Log
  [00:00.025] Tool: AHK_Analyze
              Reason: Cache MISS for darkmode.ahk (first access)
              Duration: 18ms

  [00:00.043] Tool: AHK_File_View
              Reason: Found _Dark class at lines 431-1064, reading ColorCheckbox method
              Lines: 644-665
              Duration: 7ms

  Total: 2 tool calls, 25ms
```

**Validation**:
- [ ] Debug section clearly separated with 🔍 marker
- [ ] Each tool call explained with reason
- [ ] Timestamps/durations shown
- [ ] Cache status visible
- [ ] Long logs truncate after 5,000 characters when applicable

---

### Test 2.2: Debug Mode Disabled (Default)
```json
{
  "tool": "AHK_Smart_Orchestrator",
  "arguments": {
    "intent": "view the ColorCheckbox method",
    "filePath": "darkmode.ahk"
  }
}
```

**Expected Output**:
```
🎯 Smart Orchestrator Results
📊 Performance: 2 tool call(s) | Cache: MISS

[Normal file content - no debug section]
```

**Validation**:
- [ ] NO debug output present
- [ ] Output is clean and concise

---

## Scenario 3: Dry-Run Mode 🔬

**Goal**: Verify destructive operations can be previewed safely

### Test 3.1: Single Replacement Dry-Run
```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "replace",
    "search": "DarkMode",
    "newContent": "LightMode",
    "filePath": "darkmode.ahk",
    "dryRun": true
  }
}
```

**Expected Output**:
```
🔬 DRY RUN - No changes made

📄 File: darkmode.ahk
⚙️ Operation: Replace first occurrence

**Would change**:
- Line 18: DarkMode → LightMode

**Summary**:
- 1 file affected
- 1 occurrence would be replaced
- Total characters changed: +9 -8

⚠️ DRY RUN: File was NOT modified
```

**Validation**:
- [ ] File remains unchanged
- [ ] Preview shows exact change location
- [ ] Clear warning that no modifications occurred

---

### Test 3.2: Batch Replacement Dry-Run
```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "replace",
    "search": "DarkMode",
    "newContent": "LightMode",
    "all": true,
    "filePath": "darkmode.ahk",
    "dryRun": true
  }
}
```

**Expected Output**:
```
🔬 DRY RUN - No changes made

📄 File: darkmode.ahk
⚙️ Operation: Replace all occurrences

**Would change** (showing first 3 of 47):
1. Line 18:  this.mode = "DarkMode"  →  this.mode = "LightMode"
2. Line 56:  ; DarkMode initialization  →  ; LightMode initialization
3. Line 103: DarkModeEnabled()  →  LightModeEnabled()

**Summary**:
- 1 file affected
- 47 occurrences would be replaced
- Total characters changed: +423 -376

⚠️ DRY RUN: File was NOT modified
```

**Validation**:
- [ ] Shows first 3 examples (not all 47)
- [ ] Summary shows total count
- [ ] File unchanged
- [ ] Character diff accurate
- [ ] Sample list stops at 3 even when more matches exist

---

### Test 3.3: Verify Actual Edit Still Works
```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "replace",
    "search": "testValue",
    "newContent": "newValue",
    "filePath": "test-quality-improvements.ahk",
    "dryRun": false
  }
}
```

**Expected Output**:
```
✅ Edit Successful
📄 File: test-quality-improvements.ahk
⚙️ Operation: Replaced first occurrence of "testValue" with "newValue"

Statistics:
- Lines before: 50
- Lines after: 50
```

**Validation**:
- [ ] File was actually modified
- [ ] No dry-run warning present
- [ ] Backup created

---

## Scenario 4: Enhanced Tool Descriptions 📚

**Goal**: Verify tool descriptions include helpful examples

### Test 4.1: Read Tool Schema
```json
{
  "method": "tools/list"
}
```

**Expected in AHK_File_Edit description**:
```markdown
Primary tool for direct AutoHotkey file editing operations.

**Common Usage**:
  {
    "action": "replace",
    "search": "oldClassName",
    "newContent": "newClassName",
    "filePath": "script.ahk"
  }

**Advanced: Replace all with regex**:
  {
    "action": "replace",
    "search": "class \\w+",
    "newContent": "class MyClass",
    "regex": true,
    "all": true
  }

**What to avoid**:
  ❌ Don't use 'content' (deprecated)
  ✅ Use 'newContent' instead

**See also**: AHK_File_Edit_Advanced, AHK_File_View
```

**Validation**:
- [ ] Description includes 2-3 concrete examples
- [ ] Examples use realistic code
- [ ] "What to avoid" section present
- [ ] Related tools referenced

---

## End-to-End Integration Test 🎯

**Goal**: Test all 4 improvements working together

```json
{
  "tool": "AHK_Smart_Orchestrator",
  "arguments": {
    "intent": "preview replacing all DarkMode references with ThemeMode",
    "filePath": "darkmode.ahk",
    "operation": "edit",
    "debugMode": true
  }
}
```

**Followed by**:
```json
{
  "tool": "AHK_File_Edit",
  "arguments": {
    "action": "replace",
    "search": "DarkMode",
    "newContent": "ThemeMode",
    "all": true,
    "dryRun": true
  }
}
```

**Expected Workflow**:
1. Orchestrator shows debug log of file detection + analysis
2. Edit tool shows dry-run preview with change count
3. User reviews preview
4. User makes final edit call with `dryRun: false`

**Validation**:
- [ ] Debug mode shows orchestrator decisions
- [ ] Dry-run prevents accidental changes
- [ ] New parameter name used throughout
- [ ] Clear visual separation between modes
- [ ] Workflow respects 5,000-character debug cap and three-sample preview limit

---

## Success Criteria ✅

All tests pass when:
- [x] newContent parameter works (Test 1.1)
- [x] content parameter backward compatible (Test 1.2)
- [x] newContent takes precedence (Test 1.3)
- [x] debugMode shows orchestration log (Test 2.1)
- [x] debugMode off = clean output (Test 2.2)
- [x] dryRun previews single change (Test 3.1)
- [x] dryRun previews batch changes (Test 3.2)
- [x] dryRun=false still modifies (Test 3.3)
- [x] Tool descriptions include examples (Test 4.1)
- [x] All 4 features work together (Integration test)

**Total time**: ~5 minutes for manual validation
**Automation**: All tests can be converted to Jest/Mocha test suites

---

## Troubleshooting

**Issue**: Old parameter 'content' not working
**Fix**: Check parameter alias mapping in `src/core/parameter-aliases.ts`

**Issue**: Debug output too verbose
**Fix**: Verify truncation at 5000 chars (or configured limit)

**Issue**: Dry-run still modifies file
**Fix**: Check `dryRun` flag propagation through edit logic

**Issue**: Tool descriptions missing examples
**Fix**: Verify tool definition updates in `src/tools/*.ts`

---
