// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_File_Edit_Small',
  slug: 'file-edit-small',
  category: 'file',
  description: `Token-efficient editor for small, targeted changes. Ideal when you need a lightweight replace or line edit without loading the full diff engine. Supports regex and literal replacements, multi-file batches, optional diff previews, and dry-run mode.

**Common Replace**
\`\`\`json
{
  "action": "replace_literal",
  "file": "C:\\Scripts\\MyScript.ahk",
  "find": "Sleep(500)",
  "replace": "Sleep(100)"
}
\`\`\`

**Insert Before a Line (Preview)**
\`\`\`json
{
  "action": "line_insert_before",
  "file": "C:\\Scripts\\TrayMenu.ahk",
  "line": 42,
  "newContent": "    TrayTip(\"Menu refreshed\")",
  "dryRun": true
}
\`\`\`

**Multi-File Regex Replace**
\`\`\`json
{
  "action": "replace_regex",
  "files": ["core.ahk", "ui.ahk"],
  "find": "SetTimer\\((\\w+), 5000\\)",
  "replace": "SetTimer($1, 10000)",
  "all": true
}
\`\`\`

**What to Avoid**
- Mixing deprecated "content" parameter with newContent - prefer newContent
- Running multi-file edits without \`dryRun: true\` to preview
- Forgetting \`backup: true\` when touching critical scripts

**See also:** AHK_File_Edit (full-featured editor), AHK_File_Edit_Diff (complex diffs), AHK_File_Edit_Advanced`,
  inputSchema: {
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": [
        "replace_regex",
        "replace_literal",
        "line_replace",
        "line_delete",
        "line_insert_before",
        "line_insert_after"
      ],
      "default": "replace_literal",
      "description": "Edit action to perform (default: replace_literal for safe string matching)"
    },
    "file": {
      "type": "string",
      "description": "Target file to edit. Defaults to the active file when omitted."
    },
    "files": {
      "type": "array",
      "description": "Apply the same edit to multiple files.",
      "items": {
        "type": "string"
      }
    },
    "find": {
      "type": "string",
      "description": "Text (or pattern) to search for when using replace actions."
    },
    "replace": {
      "type": "string",
      "description": "Replacement text for replace actions."
    },
    "regexFlags": {
      "type": "string",
      "description": "Additional RegExp flags (e.g. \"i\" for case-insensitive)."
    },
    "all": {
      "type": "boolean",
      "default": true,
      "description": "Replace all occurrences (false = first only)."
    },
    "line": {
      "type": "number",
      "description": "Line number for line-based actions (1-based)."
    },
    "startLine": {
      "type": "number",
      "description": "Start line for range operations (1-based)."
    },
    "endLine": {
      "type": "number",
      "description": "End line for range delete or replace (1-based, inclusive)."
    },
    "content": {
      "type": "string",
      "description": "⚠️ Deprecated alias for newContent. Prefer newContent for new text."
    },
    "newContent": {
      "type": "string",
      "description": "Content to insert or replace when using line actions. Example: \"MsgBox(\\\"Done\\\")\"."
    },
    "preview": {
      "type": "boolean",
      "default": false,
      "description": "Show a unified diff instead of writing to disk."
    },
    "dryRun": {
      "type": "boolean",
      "default": false,
      "description": "Preview changes without modifying file. Shows affected lines and change count."
    },
    "backup": {
      "type": "boolean",
      "default": false,
      "description": "Create a .bak backup before writing changes."
    },
    "runAfter": {
      "type": "boolean",
      "description": "Run the script after edits complete (single file only)."
    }
  }
}
} as const;

export type FileEditSmallArgs = ToolCallArguments;

export async function callFileEditSmall(args: FileEditSmallArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
