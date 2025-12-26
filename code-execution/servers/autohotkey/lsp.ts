// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_LSP',
  slug: 'lsp',
  category: 'lsp',
  description: `Provides LSP-like analysis and auto-fixing for AutoHotkey v2 code.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "description": "The AutoHotkey v2 code to analyze or fix"
    },
    "mode": {
      "type": "string",
      "enum": [
        "analyze",
        "fix"
      ],
      "description": "Mode of operation: analyze (default) or fix",
      "default": "analyze"
    },
    "fixLevel": {
      "type": "string",
      "enum": [
        "safe",
        "style-only",
        "aggressive"
      ],
      "description": "Aggressiveness of fixes (only for mode=\"fix\")",
      "default": "safe"
    },
    "autoFix": {
      "type": "boolean",
      "description": "Automatically apply fixes (legacy parameter, use mode=\"fix\")",
      "default": false
    },
    "returnFixedCode": {
      "type": "boolean",
      "description": "Return the fixed code in the output (legacy parameter)",
      "default": false
    },
    "showPerformance": {
      "type": "boolean",
      "description": "Show performance metrics (legacy parameter)",
      "default": false
    }
  },
  "required": [
    "code"
  ]
}
} as const;

export type LspArgs = ToolCallArguments;

export async function callLsp(args: LspArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
