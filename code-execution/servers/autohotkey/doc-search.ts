// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Doc_Search',
  slug: 'doc-search',
  category: 'docs',
  description: `Ahk doc search
Full-text search across AutoHotkey v2 docs using FlexSearch (functions, variables, classes, methods).`,
  inputSchema: {
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query"
    },
    "category": {
      "type": "string",
      "enum": [
        "auto",
        "functions",
        "variables",
        "classes",
        "methods"
      ],
      "default": "auto",
      "description": "Restrict search category"
    },
    "limit": {
      "type": "number",
      "minimum": 1,
      "maximum": 50,
      "default": 10
    }
  },
  "required": [
    "query"
  ]
}
} as const;

export type DocSearchArgs = ToolCallArguments;

export async function callDocSearch(args: DocSearchArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
