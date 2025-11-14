// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Active_File',
  slug: 'active-file',
  category: 'file',
  description: `Ahk active file
Get or set the active AHK file path used as a default when invoking tools.`,
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
    "filePath": {
      "type": "string",
      "description": "Absolute AHK file path to set as active"
    }
  }
}
} as const;

export type ActiveFileArgs = ToolCallArguments;

export async function callActiveFile(args: ActiveFileArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
