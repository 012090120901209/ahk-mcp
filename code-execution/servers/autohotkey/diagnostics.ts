// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Diagnostics',
  slug: 'diagnostics',
  category: 'analysis',
  description: `Ahk diagnostics
Validates AutoHotkey v2 code syntax and enforces coding standards with detailed error reporting`,
  inputSchema: {
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "description": "The AutoHotkey v2 code to analyze"
    },
    "enableClaudeStandards": {
      "type": "boolean",
      "description": "Apply Claude coding standards validation",
      "default": true
    },
    "severity": {
      "type": "string",
      "enum": [
        "error",
        "warning",
        "info",
        "all"
      ],
      "description": "Filter diagnostics by severity level",
      "default": "all"
    }
  },
  "required": [
    "code"
  ]
}
} as const;

export type DiagnosticsArgs = ToolCallArguments;

export async function callDiagnostics(args: DiagnosticsArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
