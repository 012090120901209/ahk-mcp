// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_VSCode_Problems',
  slug: 'vscode-problems',
  category: 'analysis',
  description: `Ahk vscode problems
Reads a VS Code Problems list (from file or provided JSON) and summarizes AutoHotkey LSP diagnostics.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Path to a VS Code Problems JSON file"
    },
    "content": {
      "type": "string",
      "description": "Raw JSON string of VS Code Problems"
    },
    "severity": {
      "type": "string",
      "enum": [
        "error",
        "warning",
        "info",
        "all"
      ],
      "description": "Filter by severity",
      "default": "all"
    },
    "fileIncludes": {
      "type": "string",
      "description": "Substring filter for resource path"
    },
    "ownerIncludes": {
      "type": "string",
      "description": "Substring filter for owner"
    },
    "originIncludes": {
      "type": "string",
      "description": "Substring filter for origin"
    },
    "limit": {
      "type": "number",
      "minimum": 1,
      "maximum": 500,
      "description": "Max results in summary",
      "default": 100
    },
    "format": {
      "type": "string",
      "enum": [
        "summary",
        "raw"
      ],
      "description": "Output format",
      "default": "summary"
    }
  },
  "required": []
}
} as const;

export type VscodeProblemsArgs = ToolCallArguments;

export async function callVscodeProblems(args: VscodeProblemsArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
