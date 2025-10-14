# AHK MCP Memory System

This directory contains memory files that work with Claude Code 2.0 and Sonnet 4.5's memory system. These memories provide context that helps Claude identify and fix common AutoHotkey v2 issues automatically.

## How It Works

The `AHK_Memory_Context` MCP tool reads markdown files from this directory and provides them as context to Claude. This helps Claude:

- Remember common AHK v2 pitfalls
- Check for typical migration issues from v1 to v2
- Suggest best practices automatically
- Provide more accurate code suggestions

## Available Memories

### ahk-v2-common-issues.md
Comprehensive guide covering:
- Syntax migration issues (v1 to v2)
- Function definition problems
- Object and class issues
- GUI creation and event handling
- Variable scope problems
- File path handling
- Hotkey and hotstring syntax
- Array and Map usage
- Error handling patterns
- Type coercion issues

## Using the Tool

### From Claude Desktop or Claude Code

Simply use the `AHK_Memory_Context` tool:

```
Use the AHK_Memory_Context tool to load AHK v2 common issues
```

### Tool Parameters

- `memory_type`: (optional) Which memory to load
  - `'all'` (default): Load all memory files
  - `'common-issues'`: Load only common issues memory

### Example Usage

```typescript
// Load all memories
AHK_Memory_Context({ memory_type: 'all' })

// Load only common issues
AHK_Memory_Context({ memory_type: 'common-issues' })
```

## Adding New Memories

To add new memory files:

1. Create a new `.md` file in this directory
2. Update `src/tools/ahk-memory-context.ts`:
   - Add file to `memoryFiles` array
   - Add corresponding enum value to schema if needed
3. Rebuild: `npm run build`

## Memory File Format

Memory files should be markdown with clear sections:

```markdown
# Memory Title

## Section 1: Issue Category

### Specific Issue
**Problem**: Description of the problem
**Solution**: How to fix it

```ahk
; Example code showing the fix
```

## Memory Recall Keywords

When debugging AHK v2 code, include these keywords in your issue descriptions to trigger relevant memory sections:

- "variable undefined" → Check scope issues
- "parameter count" → Check function definitions
- "missing {" → Check syntax
- "invalid path" → Check backslash escaping
- "index out of range" → Remember 1-indexed arrays
- "property not found" → Check 'this.' prefix in classes
- "GUI not working" → Check v2 GUI syntax
- "hotkey not firing" → Check #HotIf context blocks
- "COM error" → Check ComObject() syntax

---

*This memory system helps Claude provide more accurate AutoHotkey v2 assistance by maintaining context about common issues and best practices.*
