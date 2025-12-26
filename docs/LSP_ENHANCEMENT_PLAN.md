# LSP Enhancement Plan for ahk-mcp

## Current LSP Features

### Existing Tools:

- **AHK_LSP** (`src/tools/ahk-analyze-lsp.ts`)
  - Diagnostics (syntax, semantic, standards)
  - Auto-fix with multiple levels (safe, aggressive, style-only)
  - Performance metrics

### Existing Infrastructure:

- **Diagnostic Provider** (`src/lsp/diagnostics.ts`)
- **Compiler Suite** (`src/compiler/`)
  - `ahk-compiler.ts` - Main compiler
  - `ahk-lexer.ts` - Tokenization
  - `ahk-parser.ts` - AST generation
  - `ahk-linter.ts` - Code quality checks
  - `ahk-semantic-tokens.ts` - Syntax highlighting data

---

## Enhancement Opportunities

### 1. Add LSP Completion (IntelliSense) as MCP Tool

**New Tool:** `AHK_LSP_Completion`

```typescript
// src/tools/ahk-lsp-completion.ts
export const AhkLspCompletionToolDefinition = {
  name: 'AHK_LSP_Completion',
  description:
    'Get code completion suggestions (IntelliSense) for AutoHotkey v2',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Full code context' },
      line: { type: 'number', description: 'Line number (0-indexed)' },
      character: { type: 'number', description: 'Character position in line' },
      triggerCharacter: {
        type: 'string',
        description: 'Trigger character (., :, etc.)',
        optional: true,
      },
    },
  },
};
```

**Features:**

- Variable completion (local, global, class properties)
- Function/method completion with signatures
- Built-in AHK v2 function completion
- Keyword completion
- Class member completion (after `.` or `::`)

**Implementation:**

```typescript
class AhkLspCompletionTool {
  async execute(args) {
    const { code, line, character, triggerCharacter } = args;

    // Parse code to get symbols
    const symbols = this.parser.parseSymbols(code);

    // Get completion items based on context
    const completions = this.getCompletionsAtPosition(
      code,
      line,
      character,
      symbols,
      triggerCharacter
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              completions: completions.map(c => ({
                label: c.label,
                kind: c.kind, // function, variable, class, keyword
                detail: c.detail,
                documentation: c.documentation,
                insertText: c.insertText,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
```

---

### 2. Add LSP Hover Information

**New Tool:** `AHK_LSP_Hover`

```typescript
export const AhkLspHoverToolDefinition = {
  name: 'AHK_LSP_Hover',
  description: 'Get hover information (documentation) for symbol at position',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      line: { type: 'number' },
      character: { type: 'number' },
    },
  },
};
```

**Features:**

- Show function signatures with parameter documentation
- Show variable types and values
- Show class/method documentation
- Link to AHK v2 documentation

---

### 3. Add LSP Go to Definition

**New Tool:** `AHK_LSP_Definition`

```typescript
export const AhkLspDefinitionToolDefinition = {
  name: 'AHK_LSP_Definition',
  description: 'Find definition location of symbol at cursor position',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      filePath: { type: 'string' },
      line: { type: 'number' },
      character: { type: 'number' },
    },
  },
};
```

**Returns:**

```json
{
  "definitions": [
    {
      "filePath": "script.ahk",
      "range": {
        "start": { "line": 10, "character": 0 },
        "end": { "line": 15, "character": 1 }
      },
      "preview": "MyFunction(param1, param2) {\n  ; function body\n}"
    }
  ]
}
```

---

### 4. Add LSP Find References

**New Tool:** `AHK_LSP_References`

```typescript
export const AhkLspReferencesToolDefinition = {
  name: 'AHK_LSP_References',
  description: 'Find all references to a symbol',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      filePath: { type: 'string' },
      symbolName: { type: 'string' },
    },
  },
};
```

---

### 5. Add LSP Code Actions (Quick Fixes)

**New Tool:** `AHK_LSP_Code_Actions`

```typescript
export const AhkLspCodeActionsToolDefinition = {
  name: 'AHK_LSP_Code_Actions',
  description:
    'Get available code actions (quick fixes, refactorings) for a range',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      range: {
        type: 'object',
        properties: {
          start: {
            type: 'object',
            properties: {
              line: { type: 'number' },
              character: { type: 'number' },
            },
          },
          end: {
            type: 'object',
            properties: {
              line: { type: 'number' },
              character: { type: 'number' },
            },
          },
        },
      },
      diagnostics: {
        type: 'array',
        description: 'Diagnostics at this location (optional)',
      },
    },
  },
};
```

**Actions:**

- Quick fixes for diagnostics (convert `=` to `:=`, add missing brackets)
- Refactorings (extract function, rename symbol)
- Source actions (organize imports, format document)

---

### 6. Add LSP Document Symbols (Outline)

**New Tool:** `AHK_LSP_Document_Symbols`

```typescript
export const AhkLspDocumentSymbolsToolDefinition = {
  name: 'AHK_LSP_Document_Symbols',
  description:
    'Get document outline (all symbols: functions, classes, variables)',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      hierarchical: {
        type: 'boolean',
        default: true,
        description: 'Return hierarchical structure (classes contain methods)',
      },
    },
  },
};
```

**Returns:**

```json
{
  "symbols": [
    {
      "name": "MyClass",
      "kind": "class",
      "range": {
        "start": { "line": 0, "character": 0 },
        "end": { "line": 20, "character": 1 }
      },
      "children": [
        {
          "name": "__New",
          "kind": "constructor",
          "range": {
            "start": { "line": 1, "character": 2 },
            "end": { "line": 5, "character": 3 }
          }
        },
        {
          "name": "DoSomething",
          "kind": "method",
          "range": {
            "start": { "line": 7, "character": 2 },
            "end": { "line": 12, "character": 3 }
          }
        }
      ]
    }
  ]
}
```

---

### 7. Add LSP Formatting

**New Tool:** `AHK_LSP_Format`

```typescript
export const AhkLspFormatToolDefinition = {
  name: 'AHK_LSP_Format',
  description: 'Format AutoHotkey code according to style rules',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      options: {
        type: 'object',
        properties: {
          indentSize: { type: 'number', default: 2 },
          useTabs: { type: 'boolean', default: false },
          maxLineLength: { type: 'number', default: 120 },
        },
      },
    },
  },
};
```

---

### 8. Add LSP Rename Symbol

**New Tool:** `AHK_LSP_Rename`

```typescript
export const AhkLspRenameToolDefinition = {
  name: 'AHK_LSP_Rename',
  description: 'Rename a symbol and all its references',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      filePath: { type: 'string' },
      line: { type: 'number' },
      character: { type: 'number' },
      newName: { type: 'string' },
    },
  },
};
```

**Returns:**

```json
{
  "changes": [
    {
      "range": {
        "start": { "line": 5, "character": 10 },
        "end": { "line": 5, "character": 20 }
      },
      "newText": "newFunctionName"
    },
    {
      "range": {
        "start": { "line": 15, "character": 5 },
        "end": { "line": 15, "character": 15 }
      },
      "newText": "newFunctionName"
    }
  ]
}
```

---

## Implementation Priority

### Phase 1 (High Value, Low Effort):

1. ✅ **AHK_LSP_Document_Symbols** - Already have parser, just expose symbols
2. ✅ **AHK_LSP_Hover** - Reuse existing documentation data
3. ✅ **AHK_LSP_Format** - Add simple formatter

### Phase 2 (High Value, Medium Effort):

4. **AHK_LSP_Completion** - Most requested feature
5. **AHK_LSP_Code_Actions** - Extend existing auto-fix
6. **AHK_LSP_References** - Use existing parser

### Phase 3 (Medium Value, Higher Effort):

7. **AHK_LSP_Definition** - Requires cross-file analysis
8. **AHK_LSP_Rename** - Requires reference tracking

---

## Integration with VS Code

### Option A: MCP Tools Only (Current)

Agents call MCP tools to get LSP-like functionality:

```
Agent: Use AHK_LSP_Completion to get completions at line 10, character 5
Agent: Use AHK_LSP_Hover to get documentation for symbol at cursor
```

### Option B: Real VS Code LSP Extension

Create a VS Code extension that wraps your MCP server:

```typescript
// vscode-ahk-lsp-extension/src/extension.ts
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';

export function activate(context: vscode.ExtensionContext) {
  const client = new LanguageClient(
    'ahkLsp',
    'AutoHotkey LSP',
    {
      command: 'node',
      args: ['/path/to/ahk-mcp/dist/lsp-server.js'], // New LSP server mode
    },
    {
      documentSelector: [{ scheme: 'file', language: 'ahk' }],
    }
  );

  client.start();
}
```

### Option C: Hybrid Approach

- Use MCP tools for AI agent interactions
- Use native LSP for real-time VS Code editing
- Share same compiler/parser infrastructure

---

## Example Usage After Implementation

### Agent Using LSP Tools:

```
Agent: I need to understand what MyFunction does at line 50

1. Call AHK_LSP_Hover({ code, line: 50, character: 10 })
   → Returns: "MyFunction(x, y) - Calculates distance between two points"

2. Call AHK_LSP_Definition({ code, line: 50, character: 10 })
   → Returns: Definition at line 20-25 with code preview

3. Call AHK_LSP_References({ code, symbolName: "MyFunction" })
   → Returns: Used at lines 50, 75, 120
```

### Efficiency with New Tools:

```
Traditional:
- AHK_File_View (5KB → 1,250 tokens)
- Manual search for function (500 tokens)
- Read function definition (300 tokens)
Total: 2,050 tokens

With LSP Tools:
- AHK_LSP_Document_Symbols (returns outline only: 200 tokens)
- AHK_LSP_Definition for specific function (150 tokens)
Total: 350 tokens (83% reduction!)
```

---

## Next Steps

1. **Quick Win:** Implement AHK_LSP_Document_Symbols (1-2 hours)
2. **High Impact:** Implement AHK_LSP_Completion (4-6 hours)
3. **Documentation:** Update MCP tool catalog with new LSP tools
4. **Testing:** Create test suite for LSP features

Would you like me to implement any of these LSP enhancements?
