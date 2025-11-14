# Quickstart: Smart File Operation Orchestrator

**Feature**: Smart File Operation Orchestrator
**Target**: Developers integrating or testing the orchestrator
**Time to Complete**: 15 minutes

## Overview

This quickstart validates the Smart File Operation Orchestrator by walking through typical usage scenarios. Follow these steps to verify the tool works correctly.

---

## Prerequisites

1. **AHK MCP Server Running**
   ```bash
   cd /path/to/ahk-mcp
   npm run build
   npm start
   ```

2. **Test AHK File**
   - Use an existing AHK file like `__Lists.ahk` or `GUI_HotstringManager.ahk`
   - File should have classes, methods, and functions for full testing

3. **MCP Client**
   - Claude Code CLI or Claude Desktop with MCP server configured
   - Can also use manual JSON-RPC calls for testing

---

## Scenario 1: First-Time File Analysis (Cache Miss)

**Goal**: Verify orchestrator can detect, analyze, and read a file with no cached data.

**Steps**:
1. Call `AHK_Smart_Orchestrator` with natural language intent:
   ```json
   {
     "intent": "view the _Dark class methods",
     "targetEntity": "_Dark",
     "operation": "view"
   }
   ```

2. **Expected Behavior**:
   - Tool detects file (or prompts for path if auto-detection fails)
   - Tool analyzes file structure
   - Tool reads _Dark class line range
   - Returns formatted code with line numbers

3. **Expected Output**:
   ```
   🎯 Smart Orchestrator Results

   📊 Performance: 3 tool calls | Cache: MISS
   📁 File: C:\...\__Lists.ahk
   🎯 Target: _Dark class (lines 880-1559)

   [Code snippet here]

   ✅ Next Steps:
   • Use AHK_File_Edit to modify methods
   • File is set as active for editing
   ```

4. **Success Criteria**:
   - ✅ Tool calls ≤ 4
   - ✅ Code snippet shows correct class
   - ✅ Line numbers are accurate
   - ✅ Next steps are provided

---

## Scenario 2: Subsequent Operation (Cache Hit)

**Goal**: Verify orchestrator reuses cached analysis on second request.

**Steps**:
1. Immediately after Scenario 1, call orchestrator again:
   ```json
   {
     "intent": "view the ColorCheckbox method in _Dark class",
     "targetEntity": "_Dark.ColorCheckbox",
     "operation": "view"
   }
   ```

2. **Expected Behavior**:
   - Tool retrieves cached analysis (no re-analysis)
   - Tool calculates ColorCheckbox method line range
   - Tool reads that specific method
   - Returns formatted code

3. **Expected Output**:
   ```
   🎯 Smart Orchestrator Results

   📊 Performance: 1 tool call | Cache: HIT ✨
   📁 File: C:\...\__Lists.ahk
   🎯 Target: _Dark.ColorCheckbox (lines 1050-1080)

   [Method code snippet]

   ✅ Next Steps:
   • Modify styling in ColorCheckbox method
   • Cache analysis is 5 seconds old
   ```

4. **Success Criteria**:
   - ✅ Tool calls ≤ 2
   - ✅ Cache hit indicator present
   - ✅ Method code is shown
   - ✅ Performance better than Scenario 1

---

## Scenario 3: Direct File Path (Skip Detection)

**Goal**: Verify orchestrator can skip detection when file path is provided.

**Steps**:
1. Call orchestrator with explicit file path:
   ```json
   {
     "intent": "analyze the GUI structure",
     "filePath": "C:\\full\\path\\to\\__Lists.ahk",
     "operation": "analyze"
   }
   ```

2. **Expected Behavior**:
   - Tool skips file detection (path provided)
   - Tool checks cache → reuses if available
   - Tool returns class/function structure
   - Does NOT read file content (analyze mode)

3. **Expected Output**:
   ```
   🎯 File Structure Analysis

   📊 Performance: 0-1 tool calls | Cache: HIT
   📁 File: C:\...\__Lists.ahk

   📦 Classes (1):
   • ResponsiveListManager (lines 15-1200)
   • _Dark (lines 880-1559)

   🔧 Functions (1):
   • GuiForm (lines 6-9)

   ⌨️ Hotkeys (1):
   • Esc (line 13)
   ```

4. **Success Criteria**:
   - ✅ Detection step skipped
   - ✅ Structure is accurate
   - ✅ No file content shown (analyze mode)

---

## Scenario 4: Force Refresh (Stale Cache)

**Goal**: Verify orchestrator can detect and handle stale cache.

**Steps**:
1. After previous scenarios, modify the test file externally:
   - Open __Lists.ahk in a text editor
   - Add a comment or change something
   - Save the file

2. Call orchestrator with same target:
   ```json
   {
     "intent": "view updated _Dark class",
     "filePath": "C:\\full\\path\\to\\__Lists.ahk",
     "targetEntity": "_Dark",
     "forceRefresh": true
   }
   ```

3. **Expected Behavior**:
   - Tool detects file modification (mtime check)
   - Tool invalidates stale cache
   - Tool re-analyzes file
   - Tool reads fresh content

4. **Expected Output**:
   ```
   ⚠️ Cache Invalidated: File modified externally

   📊 Performance: 2 tool calls | Cache: MISS (stale)
   📁 File: C:\...\__Lists.ahk

   [Updated code here]
   ```

5. **Success Criteria**:
   - ✅ Staleness detected
   - ✅ Re-analysis performed
   - ✅ Fresh content returned

---

## Scenario 5: Error Handling (Entity Not Found)

**Goal**: Verify orchestrator provides helpful errors and fallbacks.

**Steps**:
1. Call orchestrator with non-existent entity:
   ```json
   {
     "intent": "view the DarkMode class",
     "filePath": "C:\\full\\path\\to\\__Lists.ahk",
     "targetEntity": "DarkMode"
   }
   ```

2. **Expected Behavior**:
   - Tool analyzes file (or uses cache)
   - Tool searches for "DarkMode" class
   - Tool doesn't find it
   - Tool returns error with available options

3. **Expected Output**:
   ```
   ❌ Target Entity Not Found

   Class 'DarkMode' not found in __Lists.ahk

   📦 Available Classes:
   • ResponsiveListManager (lines 15-1200)
   • _Dark (lines 880-1559)

   💡 Did you mean:
   • _Dark

   ✅ Next Steps:
   • Use one of the available class names
   • Try 'analyze' operation to see full structure
   ```

4. **Success Criteria**:
   - ✅ Clear error message
   - ✅ List of available entities
   - ✅ Helpful suggestions

---

## Integration Test Checklist

Run through all scenarios in sequence and verify:

### Performance Targets
- [ ] Scenario 1 (cache miss): ≤4 tool calls, <2 seconds
- [ ] Scenario 2 (cache hit): ≤2 tool calls, <200ms
- [ ] Scenario 3 (skip detection): ≤3 tool calls
- [ ] Scenario 4 (force refresh): ≤3 tool calls
- [ ] Scenario 5 (error case): ≤2 tool calls

### Functional Requirements
- [ ] File detection works (auto or manual)
- [ ] Analysis caching works
- [ ] Staleness detection works
- [ ] Target entity lookup works
- [ ] Line range calculation accurate
- [ ] Error messages are helpful
- [ ] Next steps are actionable

### Cache Behavior
- [ ] Cache stores analysis results
- [ ] Cache reuses data on subsequent calls
- [ ] Cache detects stale data (mtime check)
- [ ] Cache invalidation works
- [ ] forceRefresh bypasses cache

### Edge Cases
- [ ] Handles files with no classes
- [ ] Handles files with only functions
- [ ] Handles very large files (>5000 lines)
- [ ] Handles syntax errors gracefully
- [ ] Handles missing files with clear error

---

## Manual Validation Steps

### Using Claude Code

1. **Install MCP Server**
   ```json
   // In Claude Code MCP settings
   {
     "mcpServers": {
       "ahk-server": {
         "command": "node",
         "args": ["/path/to/ahk-mcp/dist/index.js"]
       }
     }
   }
   ```

2. **Test in Chat**
   ```
   User: View the _Dark class in __Lists.ahk

   Claude: [Uses AHK_Smart_Orchestrator automatically]

   Expected: Code snippet shown with minimal tool calls
   ```

3. **Verify Cache**
   ```
   User: Now show me the ColorCheckbox method

   Claude: [Should use cached analysis]

   Expected: Faster response, cache hit indicator
   ```

### Using Direct JSON-RPC

```bash
# Test tool call directly
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "AHK_Smart_Orchestrator",
      "arguments": {
        "intent": "view _Dark class",
        "targetEntity": "_Dark",
        "operation": "view"
      }
    },
    "id": 1
  }'
```

---

## Troubleshooting

### Issue: "File not found"
- **Cause**: Auto-detection failed or path is incorrect
- **Solution**: Provide explicit `filePath` parameter

### Issue: "Entity not found"
- **Cause**: Typo in targetEntity or class doesn't exist
- **Solution**: Use `operation: "analyze"` to see available entities

### Issue: "Cache always misses"
- **Cause**: File path normalization issue (case sensitivity)
- **Solution**: Check cache uses absolute paths consistently

### Issue: "Slow performance"
- **Cause**: Large file or no caching
- **Solution**: Verify cache is working, consider file size limits

---

## Success Criteria Summary

This quickstart is successful if:

1. ✅ All 5 scenarios pass
2. ✅ Performance targets met (≤4 calls for new, ≤2 for cached)
3. ✅ Cache hit rate >50% in typical usage
4. ✅ Error messages are clear and actionable
5. ✅ Integration with Claude Code feels seamless

---

**Status**: Ready for Testing
**Next Step**: Run /tasks command to generate implementation tasks
