// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_LSP_Format',
  slug: 'lsp-format',
  category: 'lsp',
  description: `Format AutoHotkey v2 code according to style rules

Formats code with configurable options:
- Indentation (spaces or tabs, configurable size)
- Line length limits
- Spacing around operators
- Brace placement styles (K&R, Allman, Compact)
- Trailing whitespace removal
- Alignment options

Perfect for cleaning up code before committing.
Returns formatted code that follows best practices.

**Example Usage:**
\`\`\`
// Format with default settings (2-space indent, K&R braces)
{ code: "..." }

// Format with tabs and Allman-style braces
{ code: "...", options: { useTabs: true, braceStyle: "allman" } }

// Format with 4-space indent and alignment
{ code: "...", options: { indentSize: 4, alignAssignments: true } }
\`\`\``,
  inputSchema: {
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "description": "AutoHotkey v2 code to format"
    },
    "options": {
      "type": "object",
      "properties": {
        "indentSize": {
          "type": "number",
          "description": "Number of spaces per indent level (1-8)",
          "default": 2,
          "minimum": 1,
          "maximum": 8
        },
        "useTabs": {
          "type": "boolean",
          "description": "Use tabs instead of spaces for indentation",
          "default": false
        },
        "maxLineLength": {
          "type": "number",
          "description": "Maximum line length before wrapping (40-200)",
          "default": 120,
          "minimum": 40,
          "maximum": 200
        },
        "trimTrailingWhitespace": {
          "type": "boolean",
          "description": "Remove trailing whitespace from lines",
          "default": true
        },
        "insertFinalNewline": {
          "type": "boolean",
          "description": "Ensure file ends with a newline",
          "default": true
        },
        "spacesAroundOperators": {
          "type": "boolean",
          "description": "Add spaces around operators (:=, +, -, etc.)",
          "default": true
        },
        "spaceAfterComma": {
          "type": "boolean",
          "description": "Add space after commas in parameter lists",
          "default": true
        },
        "alignAssignments": {
          "type": "boolean",
          "description": "Align consecutive assignment operators",
          "default": false
        },
        "braceStyle": {
          "type": "string",
          "enum": [
            "k&r",
            "allman",
            "compact"
          ],
          "description": "Brace placement style: k&r (same line), allman (new line), compact (minimal spacing)",
          "default": "k&r"
        }
      }
    }
  },
  "required": [
    "code"
  ]
}
} as const;

export type LspFormatArgs = ToolCallArguments;

export async function callLspFormat(args: LspFormatArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
