// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_LSP_Document_Symbols',
  slug: 'lsp-document-symbols',
  category: 'lsp',
  description: `Get document outline (symbol tree) for AutoHotkey v2 code

Returns a structured list of all symbols in the code:
- Functions with parameters
- Classes with methods and properties
- Global variables
- Hotkeys and hotstrings
- Directives

Perfect for understanding code structure without reading the entire file.
Reduces token usage by 80-90% compared to reading full files.

**Example Usage:**
\`\`\`
// Get hierarchical outline (classes contain methods)
{ code: "...", hierarchical: true }

// Get flat list of all symbols
{ code: "...", hierarchical: false }

// Get only functions and classes
{ code: "...", symbolTypes: ["function", "class"] }
\`\`\``,
  inputSchema: {
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "description": "AutoHotkey v2 code to analyze"
    },
    "hierarchical": {
      "type": "boolean",
      "description": "Return hierarchical structure (classes contain methods/properties)",
      "default": true
    },
    "includePrivate": {
      "type": "boolean",
      "description": "Include private/internal symbols (variables, internal methods)",
      "default": true
    },
    "symbolTypes": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "function",
          "class",
          "variable",
          "hotkey",
          "directive",
          "method",
          "property"
        ]
      },
      "description": "Types of symbols to include (default: all except directives)",
      "default": [
        "function",
        "class",
        "variable",
        "hotkey",
        "method",
        "property"
      ]
    }
  },
  "required": [
    "code"
  ]
}
} as const;

export type LspDocumentSymbolsArgs = ToolCallArguments;

export async function callLspDocumentSymbols(args: LspDocumentSymbolsArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
