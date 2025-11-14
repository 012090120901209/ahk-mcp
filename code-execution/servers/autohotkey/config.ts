// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Config',
  slug: 'config',
  category: 'system',
  description: `Ahk config
Get/Set MCP configuration for A_ScriptDir and additional search directories.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": [
        "get",
        "set"
      ],
      "default": "get"
    },
    "scriptDir": {
      "type": "string",
      "description": "Default A_ScriptDir-like root used by tools"
    },
    "searchDirs": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Additional directories to scan"
    }
  }
}
} as const;

export type ConfigArgs = ToolCallArguments;

export async function callConfig(args: ConfigArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
