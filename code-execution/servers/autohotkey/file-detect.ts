// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_File_Detect',
  slug: 'file-detect',
  category: 'file',
  description: `Ahk auto file
Automatically detect and set active AutoHotkey file from user text`,
  inputSchema: {
  "type": "object",
  "properties": {
    "text": {
      "type": "string",
      "description": "Text that may contain file paths to detect"
    },
    "autoSet": {
      "type": "boolean",
      "default": true,
      "description": "Automatically set as active file if found"
    },
    "scriptDir": {
      "type": "string",
      "description": "Base directory to search for files"
    }
  },
  "required": [
    "text"
  ]
}
} as const;

export type FileDetectArgs = ToolCallArguments;

export async function callFileDetect(args: FileDetectArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
