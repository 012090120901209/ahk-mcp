# Using AHK MCP as a Coding Agent

Complete guide to leveraging the AutoHotkey MCP server as an intelligent coding
agent with automatic context injection.

## Overview

The AHK MCP server acts as a coding agent by:

- Automatically detecting what you're trying to build
- Loading relevant module instructions and documentation
- Providing AHK v2 best practices and patterns
- Guiding code generation with specialized knowledge

## Quick Start

### 1. Enable Context Injection

**Add to your `.mcp.json`:**

```json
{
  "mcpServers": {
    "ahk-mcp": {
      "command": "node",
      "args": ["C:/path/to/ahk-mcp/dist/server.js"],
      "autoApprove": [
        "AHK_Context_Injector",
        "AHK_Analyze",
        "AHK_File_View",
        "AHK_File_Edit",
        "AHK_Run"
      ]
    }
  }
}
```

### 2. Start Using It

Just ask Claude naturally:

**Example:**

> "Create a GUI app with a ListView that shows files from a folder"

The MCP will:

1. Detect keywords: "gui", "listview", "files", "folder"
2. Auto-load: `Module_GUI.md` and `Module_Arrays.md`
3. Inject: Layout rules, ListView patterns, file operations
4. Generate: Clean AHK v2 code with best practices

## Methods to Access Context

### Method 1: AHK_Context_Injector Tool (Recommended)

**Automatic context injection based on your request.**

Claude automatically calls this when you ask AutoHotkey questions:

```json
{
  "userPrompt": "I need to create a GUI with buttons",
  "includeModuleInstructions": true,
  "contextType": "auto",
  "maxItems": 5
}
```

**Parameters:**

- `userPrompt` (required) - Your question or request
- `llmThinking` (optional) - Claude's reasoning process
- `contextType` (optional) - 'auto', 'functions', 'variables', 'classes',
  'methods'
- `maxItems` (optional) - Number of context items (1-10)
- `includeModuleInstructions` (optional) - Include module files (default: true)

**What You Get:**

- Relevant API documentation
- Module-specific instructions
- Code patterns and examples
- Best practices for your use case

### Method 2: MCP Prompt

**Manual context loading via prompts.**

In Claude Desktop:

1. Click the prompt icon
2. Select **"ahk-coding-context"**
3. Full `Module_Instructions.md` loads

**When to Use:**

- Starting a new AHK project
- Need comprehensive coding standards
- Want the full instruction system
- Before writing complex code

### Method 3: MCP Resource

**Persistent context via resource subscription.**

The resource `ahk://instructions/coding-standards` is always available.

In Claude Desktop:

- Automatically exposed when MCP active
- First in resource list
- Subscribe for persistent access

**When to Use:**

- Long coding sessions
- Multiple files in one project
- Continuous development work

### Method 4: Direct API Call

**For custom integrations.**

```typescript
import { AhkContextInjectorTool } from './tools/ahk-docs-context';

const tool = new AhkContextInjectorTool();
const result = await tool.execute({
  userPrompt: 'Build a GUI app',
  includeModuleInstructions: true,
});
```

## Tool Chain Discipline (Stay in AHK Tools)

To keep Claude from falling back to generic `filesystem.*` MCP tools, follow
these guardrails whenever you interact with the AutoHotkey server:

- **Always set context first** – use `AHK_File_Active` (or `AHK_File_List` ➜
  `AHK_File_Active`) before you request edits. This makes the target explicit so
  the agent does not search via non-AHK tools.
- **Declare the desired sequence in your prompt** – e.g. “Use `AHK_File_List`,
  then `AHK_File_View`, then `AHK_File_Edit`. Do not call other filesystem
  tools.” Claude honours explicit scripts.
- **Prefer the orchestrator for multi-step work** – call
  `AHK_Smart_Orchestrator` with your plan. It now knows about `AHK_File_List`
  and generates native-only tool chains.
- **Use hooks to enforce policy** – configure `.claude/settings.json` with a
  `PreToolUse` hook that rejects calls whose name does not start with `AHK_`. A
  sample PowerShell hook lives in `.claude/hooks/require-ahk-tool.ps1` (create
  if missing) and checks `$env:CLAUDE_TOOL_NAME`.
- **Echo next steps** – when you customise tool output (e.g. after
  `AHK_File_View`), include guidance such as “Next tool: `AHK_File_Edit`”.
  Claude tends to follow the instructions it just received.
- **Reset between tasks** – run `AHK_File_Active { "action": "clear" }` when you
  switch projects so stale context does not trigger extra tool calls.

> **Tip:** If you must inspect the directory tree manually, call the native
> `AHK_File_List` tool instead of `filesystem.list_directory`. This keeps path
> conversion, backups, and policy enforcement inside the AutoHotkey server.

## Keyword-Based Module Routing

The context injector automatically detects keywords and loads relevant modules:

### Module_Arrays.md

**Triggers:** array, list, collection, filter, map, reduce, sort, unique,
flatten, iterate, batch, "for each"

**Provides:**

- Array iteration patterns
- Functional programming (filter, map, reduce)
- Sorting algorithms
- Collection utilities

### Module_GUI.md

**Triggers:** gui, window, form, dialog, button, control, layout, position,
section, OnEvent

**Provides:**

- GUI layout system (xm, ym, section)
- Control positioning and sizing
- Event handler patterns (.Bind(this))
- GuiForm helper patterns

### Module_Classes.md

**Triggers:** class, inheritance, extends, super, **New, **Delete, static,
nested class, factory

**Provides:**

- OOP patterns in AHK v2
- Constructor patterns
- Inheritance best practices
- Static vs instance members

### Module_Objects.md

**Triggers:** object, property, descriptor, DefineProp, HasProp, HasMethod,
bound, bind, callback

**Provides:**

- Object property management
- Property descriptors
- Bound function patterns
- Callback handling

### Module_TextProcessing.md

**Triggers:** string, text, escape, quote, regex, pattern, match, replace,
split, join

**Provides:**

- String manipulation
- Regex patterns
- Escape sequences (backtick `)
- Text parsing

### Module_DynamicProperties.md

**Triggers:** =>, fat arrow, lambda, closure, dynamic property, **Get, **Set,
\_\_Call

**Provides:**

- Fat arrow syntax rules
- Dynamic property patterns
- Magic method usage
- Closure patterns

### Module_Errors.md

**Triggers:** error, wrong, broken, fail, syntax error, runtime error,
undefined, not working, v1 to v2

**Provides:**

- Common AHK v2 errors
- v1-to-v2 migration issues
- Error handling patterns
- Debugging strategies

### Module_DataStructures.md

**Triggers:** map, key-value, dictionary, storage, settings, configuration,
cache

**Provides:**

- Map() constructor usage
- Key-value storage patterns
- Configuration management
- Data caching strategies

## The Cognitive Tier System

Module_Instructions.md includes a structured thinking process:

### Tier 1: Thinking Mode (Default)

```
1. Review user prompt
2. Design in-depth plan
3. Pass through all 7 THINKING steps
4. Run mental execution pass
5. Validate GUI controls don't overlap
6. Ensure all methods/properties exist
7. Run full internal validation
```

### Tier 2: Ultrathink Mode (Complex Tasks)

```
1. Review and create in-depth plan
2. Compare 3+ architectural approaches
3. Simulate 3+ edge cases per method
4. Justify every design decision
5. Debate approaches to find best
6. Pass through all 7 THINKING steps
7. Full validation and verification
```

### The 7 THINKING Steps

**Step 1: Understand**

- Parse and restate request
- Identify AHK v2 concepts
- Break into testable components

**Step 2: Analyze**

- Evaluate syntax pitfalls
- Check for v1 patterns
- Identify edge cases

**Step 3: Knowledge Retrieval**

- Route to appropriate modules
- Load relevant documentation
- Access code examples

**Step 4: Solution Design**

- Sketch class structure
- Define data storage
- Plan UI interactions

**Step 5: Implementation Strategy**

- Choose correct syntax patterns
- Avoid JavaScript thinking
- Use .Bind(this) for events

**Step 6: Edge Cases**

- Consider unusual inputs
- Handle uninitialized state
- Check for conflicts

**Step 7: Final Check**

- Confirm all requirements met
- Validate syntax correctness
- Ensure maintainability

## Practical Examples

### Example 1: GUI Application

**User Request:**

> "Create a GUI with a text input and a button that shows a message"

**What Happens:**

1. Keywords detected: `gui`, `text input`, `button`, `message`
2. Module loaded: `Module_GUI.md`
3. Context injected:
   - GUI class structure
   - Control positioning (xm, section)
   - Event handler with .Bind(this)
   - MsgBox syntax

**Generated Code:**

```autohotkey
#Requires AutoHotkey v2

class MyGui {
    __New() {
        this.gui := Gui()
        this.gui.Add("Text", "xm", "Enter text:")
        this.edit := this.gui.Add("Edit", "xm w200")
        this.btn := this.gui.Add("Button", "xm", "Show Message")
        this.btn.OnEvent("Click", this.OnButtonClick.Bind(this))
        this.gui.Show()
    }

    OnButtonClick(ctrl, info) {
        text := this.edit.Value
        MsgBox(text)
    }
}

MyGui()
```

### Example 2: Array Processing

**User Request:**

> "Filter an array to only keep numbers greater than 10"

**What Happens:**

1. Keywords: `filter`, `array`, `numbers`
2. Module: `Module_Arrays.md`
3. Context: Functional patterns, filter syntax

**Generated Code:**

```autohotkey
#Requires AutoHotkey v2

FilterNumbers(arr) {
    result := []
    for num in arr {
        if (num > 10) {
            result.Push(num)
        }
    }
    return result
}

numbers := [5, 12, 8, 15, 3, 20]
filtered := FilterNumbers(numbers)
MsgBox("Filtered: " . filtered.Join(", "))
```

### Example 3: File Operations with GUI

**User Request:**

> "Make a GUI that lists .txt files when I select a folder"

**What Happens:**

1. Keywords: `gui`, `list`, `files`, `folder`, `select`
2. Modules: `Module_GUI.md`, `Module_Arrays.md`
3. Context: ListView patterns, file loops, folder dialog

**Generated Code:**

```autohotkey
#Requires AutoHotkey v2

class FileListGui {
    __New() {
        this.gui := Gui()
        this.btn := this.gui.Add("Button", "xm", "Select Folder")
        this.btn.OnEvent("Click", this.OnSelectFolder.Bind(this))
        this.lv := this.gui.Add("ListView", "xm w400 h300", ["Filename", "Size"])
        this.gui.Show()
    }

    OnSelectFolder(ctrl, info) {
        folder := DirSelect()
        if (!folder)
            return

        this.lv.Delete()
        Loop Files folder "\*.txt" {
            this.lv.Add("", A_LoopFileName, A_LoopFileSize)
        }
    }
}

FileListGui()
```

## Configuration Best Practices

### Recommended autoApprove List

```json
{
  "autoApprove": [
    "AHK_Context_Injector",
    "AHK_Analyze",
    "AHK_Diagnostics",
    "AHK_Doc_Search",
    "AHK_File_Active",
    "AHK_File_View",
    "AHK_File_Edit",
    "AHK_File_Edit_Small",
    "AHK_Run",
    "AHK_Summary",
    "AHK_Config"
  ]
}
```

**Why these tools?**

- Context injection seamless
- File operations uninterrupted
- Analysis without prompts
- Documentation lookup instant

### Environment Variables

```bash
# Optional: Set active file for session
export AHK_ACTIVE_FILE="/path/to/script.ahk"

# Optional: Override script directory
export AHK_SCRIPT_DIR="/path/to/scripts"
```

## Advanced Usage

### Custom Context Injection

If building your own agent:

```typescript
import { smartContext } from './core/smart-context';

// Get usage-based suggestions
const suggestions = smartContext.suggestContext();

// Detect working domain
const domain = smartContext.detectWorkingDomain(); // "GUI", "Debugging", etc.

// Get session context
const sessionInfo = smartContext.getSessionContext();
```

### Analytics Integration

Monitor what context is being used:

```json
{
  "action": "summary"
}
```

Tool: `AHK_Analytics`

Shows:

- Most used tools
- Success rates
- Context effectiveness

## Troubleshooting

### Context Not Loading

**Problem:** Module instructions not appearing

**Solutions:**

1. Verify `includeModuleInstructions: true`
2. Check module files exist in `docs/Modules/`
3. Rebuild: `npm run build`
4. Restart Claude Desktop

### Wrong Module Selected

**Problem:** Got Arrays module when need GUI

**Solutions:**

1. Use clearer keywords: "create a window" not "create a list"
2. Explicitly mention: "I need GUI help with..."
3. Use `contextType` parameter to override

### Too Much Context

**Problem:** Response too long, hitting token limits

**Solutions:**

1. Reduce `maxItems` to 3
2. Use specific `contextType` instead of 'auto'
3. Set `includeModuleInstructions: false` for simple queries

## Tips for Best Results

### 1. Be Specific with Keywords

❌ "Make something that works with windows" ✅ "Create a GUI with a ListView
showing files"

### 2. Mention AHK Version

Always start with: "Using AutoHotkey v2..."

### 3. Include Context in Requests

Good: "I'm building a file manager GUI in AHK v2" Better: "Building an AHK v2
file manager with GUI, need ListView and folder selection"

### 4. Let Auto-Detection Work

Don't specify modules manually. Keywords work better:

- Say "GUI button click event" not "Load Module_GUI"
- Natural language triggers better detection

### 5. Iterate with Context

Build on previous responses: "Now add error handling" - Context remembers you're
doing GUI

## Integration Examples

### Claude Desktop

```json
{
  "mcpServers": {
    "ahk-mcp": {
      "command": "node",
      "args": ["C:/dev/ahk-mcp/dist/server.js"],
      "autoApprove": ["AHK_Context_Injector"]
    }
  }
}
```

### Claude Code

```json
{
  "mcp": {
    "servers": {
      "ahk-mcp": {
        "command": "node",
        "args": ["dist/server.js"]
      }
    }
  }
}
```

### Custom Integration

```typescript
import { AutoHotkeyMcpServer } from './server';

const server = new AutoHotkeyMcpServer();
await server.start();

// Server now provides context to any MCP client
```

## Performance Optimization

### Cache Module Files

Modules are cached after first load. Restart server to reload changes.

### Use Specific Context Types

- `contextType: 'functions'` - Only function docs
- `contextType: 'classes'` - Only class docs
- Faster than 'auto' for simple queries

### Limit Max Items

- `maxItems: 3` - Quick queries
- `maxItems: 5` - Balanced (default)
- `maxItems: 10` - Complex tasks

## Resources

**Module Files Location:** `docs/Modules/`

**Available Modules:**

- Module_Instructions.md (main framework)
- Module_Arrays.md
- Module_Classes.md
- Module_Objects.md
- Module_GUI.md
- Module_TextProcessing.md
- Module_DynamicProperties.md
- Module_Errors.md
- Module_ClassPrototyping.md
- Module_DataStructures.md

**Documentation:**

- CONTEXT_IMPROVEMENTS.md - Context management details
- ADVANCED_FEATURES.md - Analytics and smart context
- PROJECT_STATUS.md - Feature list

---

**Version:** 2.0.0 **Last Updated:** September 29, 2025 **Status:** ✅
Production Ready
