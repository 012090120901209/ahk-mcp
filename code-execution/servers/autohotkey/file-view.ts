// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_File_View',
  slug: 'file-view',
  category: 'file',
  description: `📖 AutoHotkey File Viewer (File Chain)

Premier file viewing tool in the ahk-file-* chain. Provides structured, intelligent viewing of AutoHotkey files with multiple display modes.

**Modes:**
- \`structured\`: Formatted view with line numbers, syntax highlighting, and metadata
- \`raw\`: Plain text content without formatting
- \`summary\`: File overview with statistics and structure
- \`outline\`: Code structure breakdown (classes, functions, hotkeys)

**Features:**
- Automatic syntax highlighting for AutoHotkey v2
- File metadata (size, modified date, encoding)
- Code structure analysis (classes, functions, hotkeys)
- Line range selection for large files
- Integration with active file context

Part of the **ahk-file-*** tool chain for file operations.`,
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
      "description": "View mode",
      "default": "structured"
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
      "description": "Maximum lines to display",
      "default": 100
    },
    "showLineNumbers": {
      "type": "boolean",
      "description": "Show line numbers",
      "default": true
    },
    "showMetadata": {
      "type": "boolean",
      "description": "Show file metadata",
      "default": true
    },
    "highlightSyntax": {
      "type": "boolean",
      "description": "Apply syntax highlighting",
      "default": true
    },
    "showStructure": {
      "type": "boolean",
      "description": "Show code structure info",
      "default": true
    }
  }
}
} as const;

export type FileViewArgs = ToolCallArguments;

export async function callFileView(args: FileViewArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
