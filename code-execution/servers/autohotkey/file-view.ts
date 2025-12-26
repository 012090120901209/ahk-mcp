// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_File_View',
  slug: 'file-view',
  category: 'file',
  description: `View AHK files with structure analysis. Modes: structured (default), raw, summary, outline. Supports line ranges and syntax highlighting.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "file": {
      "type": "string",
      "description": "Path to AutoHotkey file to view (defaults to active file)"
    },
    "mode": {
      "type": "string",
      "enum": [
        "structured",
        "raw",
        "summary",
        "outline"
      ],
      "default": "structured",
      "description": "View mode"
    },
    "lineStart": {
      "type": "number",
      "minimum": 1,
      "description": "Starting line number (1-based)"
    },
    "lineEnd": {
      "type": "number",
      "minimum": 1,
      "description": "Ending line number (1-based)"
    },
    "maxLines": {
      "type": "number",
      "minimum": 1,
      "maximum": 1000,
      "default": 100,
      "description": "Maximum lines to display"
    },
    "showLineNumbers": {
      "type": "boolean",
      "default": true,
      "description": "Show line numbers"
    },
    "showMetadata": {
      "type": "boolean",
      "default": true,
      "description": "Show file metadata"
    },
    "highlightSyntax": {
      "type": "boolean",
      "default": true,
      "description": "Apply syntax highlighting"
    },
    "showStructure": {
      "type": "boolean",
      "default": true,
      "description": "Show code structure info"
    }
  },
  "additionalProperties": false
}
} as const;

export type FileViewArgs = ToolCallArguments;

export async function callFileView(args: FileViewArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
