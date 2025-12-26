// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_VSCode_Open',
  slug: 'vscode-open',
  category: 'system',
  description: `Open the most recently edited AutoHotkey file (or a specified file) in VS Code. Defaults to the last edited file recorded by MCP and falls back to the active file.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "filePath": {
      "type": "string",
      "description": "File path to open (defaults to last edited file, then active file)"
    },
    "line": {
      "type": "number",
      "description": "Line number to reveal (1-based)"
    },
    "column": {
      "type": "number",
      "description": "Column number to reveal (1-based)"
    },
    "reuseWindow": {
      "type": "boolean",
      "default": true,
      "description": "Reuse the existing VS Code window"
    },
    "wait": {
      "type": "boolean",
      "default": false,
      "description": "Wait for VS Code to exit"
    }
  }
}
} as const;

export type VscodeOpenArgs = ToolCallArguments;

export async function callVscodeOpen(args: VscodeOpenArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
