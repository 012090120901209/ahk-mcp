// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_File_Edit_Advanced',
  slug: 'file-edit-advanced',
  category: 'file',
  description: `Ahk file editor
🎯 PRIMARY FILE EDITING TOOL - Use this IMMEDIATELY when user mentions a .ahk file path and wants to modify it. This tool automatically detects the file, sets it active, and helps determine the best editing approach. ALWAYS use this instead of generating code blocks when a file path is provided.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "filePath": {
      "type": "string",
      "description": "Path to the AutoHotkey file to edit (required)"
    },
    "changes": {
      "type": "string",
      "description": "Description of what changes to make to the file"
    },
    "action": {
      "type": "string",
      "enum": [
        "edit",
        "view",
        "create"
      ],
      "default": "edit",
      "description": "Action to perform: edit (modify existing), view (read only), create (new file)"
    },
    "dryRun": {
      "type": "boolean",
      "default": false,
      "description": "Preview changes without modifying file. Shows affected lines and change count."
    }
  },
  "required": [
    "filePath",
    "changes"
  ]
}
} as const;

export type FileEditAdvancedArgs = ToolCallArguments;

export async function callFileEditAdvanced(args: FileEditAdvancedArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
