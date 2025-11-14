// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_File_Edit_Diff',
  slug: 'file-edit-diff',
  category: 'file',
  description: `Ahk diff edit
Apply unified diff patches to edit AutoHotkey files (similar to Claude filesystem MCP)`,
  inputSchema: {
  "type": "object",
  "properties": {
    "diff": {
      "type": "string",
      "description": "Unified diff format patch to apply"
    },
    "filePath": {
      "type": "string",
      "description": "File path to edit (defaults to activeFilePath)"
    },
    "dryRun": {
      "type": "boolean",
      "default": false,
      "description": "Preview changes without applying"
    },
    "createBackup": {
      "type": "boolean",
      "default": true,
      "description": "Create backup before editing"
    },
    "runAfter": {
      "type": "boolean",
      "description": "Run the script after the diff is applied (skipped on dryRun)."
    }
  },
  "required": [
    "diff"
  ]
}
} as const;

export type FileEditDiffArgs = ToolCallArguments;

export async function callFileEditDiff(args: FileEditDiffArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
