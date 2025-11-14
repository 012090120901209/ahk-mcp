// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Library_Info',
  slug: 'library-info',
  category: 'library',
  description: `Get detailed information about a specific AutoHotkey library. Returns metadata, documentation, classes, functions, and dependencies.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Library name (without .ahk extension)"
    },
    "include_dependencies": {
      "type": "boolean",
      "description": "Include dependency resolution details",
      "default": false
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false
}
} as const;

export type LibraryInfoArgs = ToolCallArguments;

export async function callLibraryInfo(args: LibraryInfoArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
