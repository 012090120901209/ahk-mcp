// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_LSP',
  slug: 'lsp',
  category: 'lsp',
  description: `AutoHotkey LSP-style Code Analysis & Auto-Fix

Acts like a Language Server Protocol (LSP) for AutoHotkey v2:
- Real-time code analysis and issue detection
- Automatic safe fixes for common problems
- Performance metrics and detailed diagnostics
- Multiple analysis modes: check, fix, or analyze

Perfect for post-write code improvement and quick issue checking.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "description": "AutoHotkey v2 code to analyze"
    },
    "mode": {
      "type": "string",
      "enum": [
        "check",
        "fix",
        "analyze"
      ],
      "description": "Analysis mode - check: diagnostics only, fix: auto-fix issues, analyze: deep analysis",
      "default": "check"
    },
    "autoFix": {
      "type": "boolean",
      "description": "Enable automatic fixing of safe issues",
      "default": true
    },
    "fixLevel": {
      "type": "string",
      "enum": [
        "safe",
        "aggressive",
        "style-only"
      ],
      "description": "Level of automatic fixes to apply",
      "default": "safe"
    },
    "enableClaudeStandards": {
      "type": "boolean",
      "description": "Enable Claude coding standards validation",
      "default": true
    },
    "showPerformance": {
      "type": "boolean",
      "description": "Include performance metrics in output",
      "default": false
    },
    "returnFixedCode": {
      "type": "boolean",
      "description": "Return the fixed code in output",
      "default": true
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
