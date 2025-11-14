// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Library_Import',
  slug: 'library-import',
  category: 'library',
  description: `Generate #Include statements for importing a library. Resolves dependencies and provides correct import order. Supports different #Include formats (angle-brackets, relative, absolute).`,
  inputSchema: {
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Library name (without .ahk extension)"
    },
    "include_dependencies": {
      "type": "boolean",
      "description": "Include all dependencies in import order",
      "default": true
    },
    "format": {
      "type": "string",
      "enum": [
        "angle-brackets",
        "relative",
        "absolute"
      ],
      "description": "Format for #Include statements",
      "default": "angle-brackets"
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false
}
} as const;

export type LibraryImportArgs = ToolCallArguments;

export async function callLibraryImport(args: LibraryImportArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
