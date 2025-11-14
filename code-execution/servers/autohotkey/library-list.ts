// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Library_List',
  slug: 'library-list',
  category: 'library',
  description: `List and search AutoHotkey libraries in the catalog. Search by query string or filter by category. Returns library names with descriptions.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query (searches name, description, category)"
    },
    "category": {
      "type": "string",
      "description": "Filter by category name"
    }
  },
  "additionalProperties": false
}
} as const;

export type LibraryListArgs = ToolCallArguments;

export async function callLibraryList(args: LibraryListArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
