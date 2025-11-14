// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_LSP_Hover',
  slug: 'lsp-hover',
  category: 'lsp',
  description: `Get hover information (documentation) for symbol at cursor position

Returns detailed documentation for the symbol under the cursor:
- Function signatures with parameter types and defaults
- Variable types and scope information
- Class and method documentation
- Built-in AHK v2 function documentation
- Usage examples (optional)

Perfect for understanding code without reading full files.
Reduces token usage by showing only relevant documentation.

**Example Usage:**
\`\`\`
// Get info for symbol at line 10, character 15
{ code: "...", line: 10, character: 15 }

// Include usage examples
{ code: "...", line: 10, character: 15, includeExamples: true }
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
      "description": "Line number where cursor is positioned (0-indexed)",
      "minimum": 0
    },
    "character": {
      "type": "number",
      "description": "Character position in the line (0-indexed)",
      "minimum": 0
    },
    "includeExamples": {
      "type": "boolean",
      "description": "Include usage examples in documentation",
      "default": false
    }
  },
  "required": [
    "code",
    "line",
    "character"
  ]
}
} as const;

export type LspHoverArgs = ToolCallArguments;

export async function callLspHover(args: LspHoverArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
