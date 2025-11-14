// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_File_Create',
  slug: 'file-create',
  category: 'file',
  description: `Create a new AutoHotkey v2 script on disk with full path interception support.

• Validates .ahk extension (case-insensitive)
• Automatically creates parent directories (configurable)
• Prevents accidental overwrite unless explicitly allowed
• Supports dry-run previews and active file management`,
  inputSchema: {
  "type": "object",
  "properties": {
    "filePath": {
      "type": "string",
      "description": "Absolute or relative path to the new AutoHotkey file"
    },
    "content": {
      "type": "string",
      "description": "Initial content to write into the file"
    },
    "overwrite": {
      "type": "boolean",
      "default": false,
      "description": "Allow overwriting an existing file"
    },
    "createDirectories": {
      "type": "boolean",
      "default": true,
      "description": "Create parent directories if they are missing"
    },
    "dryRun": {
      "type": "boolean",
      "default": false,
      "description": "Preview the operation without writing to disk"
    },
    "setActive": {
      "type": "boolean",
      "default": true,
      "description": "Set the newly created file as the active file"
    }
  },
  "required": [
    "filePath"
  ]
}
} as const;

export type FileCreateArgs = ToolCallArguments;

export async function callFileCreate(args: FileCreateArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
