// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_LSP_Completion',
  slug: 'lsp-completion',
  category: 'lsp',
  description: `Get code completion suggestions (IntelliSense) for AutoHotkey v2

Returns context-aware completion suggestions:
- Functions and methods available in scope
- Variables and properties
- Class members (after . or ::)
- Built-in AHK v2 functions and commands
- Keywords and control structures

Perfect for code assistance and discovery.
Reduces time spent looking up function names and signatures.

**Example Usage:**
\`\`\`
// Get completions at cursor position
{ code: "...", line: 10, character: 15 }

// Get member completions (after typing "obj.")
{ code: "obj.", line: 0, character: 4, triggerCharacter: "." }

// Get only custom functions (exclude built-ins)
{ code: "...", line: 10, character: 15, includeBuiltIns: false }
\`\`\``,
  inputSchema: {
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "description": "AutoHotkey v2 code to analyze"
    },
    "line": {
      "type": "number",
      "description": "Line number where completion is requested (0-indexed)",
      "minimum": 0
    },
    "character": {
      "type": "number",
      "description": "Character position in the line (0-indexed)",
      "minimum": 0
    },
    "triggerCharacter": {
      "type": "string",
      "description": "Character that triggered completion (., ::, etc.) - optional"
    },
    "includeBuiltIns": {
      "type": "boolean",
      "description": "Include built-in AHK v2 functions in suggestions",
      "default": true
    },
    "maxSuggestions": {
      "type": "number",
      "description": "Maximum number of suggestions to return (1-100)",
      "default": 20,
      "minimum": 1,
      "maximum": 100
    }
  },
  "required": [
    "code",
    "line",
    "character"
  ]
}
} as const;

export type LspCompletionArgs = ToolCallArguments;

export async function callLspCompletion(args: LspCompletionArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
