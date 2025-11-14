// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_File_Active',
  slug: 'file-active',
  category: 'file',
  description: `Ahk file
DETECT AND SET ACTIVE FILE FOR EDITING - Use this immediately when user mentions any .ahk file path. This enables all other editing tools to work on the specified file. Essential first step before any file modifications.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": [
        "get",
        "set",
        "detect",
        "clear"
      ],
      "default": "get",
      "description": "Action to perform"
    },
    "path": {
      "type": "string",
      "description": "File path for set action"
    },
    "text": {
      "type": "string",
      "description": "Text to detect paths from"
    }
  }
}
} as const;

export type FileActiveArgs = ToolCallArguments;

export async function callFileActive(args: FileActiveArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
