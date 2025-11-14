// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_File_Recent',
  slug: 'file-recent',
  category: 'file',
  description: `Ahk recent scripts
List the most recent AutoHotkey scripts from configured directories. Supports overriding A_ScriptDir.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "scriptDir": {
      "type": "string",
      "description": "Override for A_ScriptDir/root scanning directory"
    },
    "extraDirs": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Additional directories to scan"
    },
    "limit": {
      "type": "number",
      "minimum": 1,
      "maximum": 50,
      "default": 10
    },
    "patterns": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "default": [
        "*.ahk"
      ],
      "description": "File glob patterns to include"
    }
  }
}
} as const;

export type FileRecentArgs = ToolCallArguments;

export async function callFileRecent(args: FileRecentArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
