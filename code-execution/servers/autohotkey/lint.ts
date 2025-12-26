// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Lint',
  slug: 'lint',
  category: 'analysis',
  description: `Lint AHK v2 scripts. Levels: fast (syntax), standard (default, +structure), thorough (+semantics). Supports autoFix with dryRun preview.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "filePath": {
      "type": "string",
      "description": "Path to .ahk file (defaults to active file)"
    },
    "level": {
      "type": "string",
      "enum": [
        "fast",
        "standard",
        "thorough"
      ],
      "default": "standard",
      "description": "Analysis depth"
    },
    "includeStructure": {
      "type": "boolean",
      "default": true,
      "description": "Include code structure map"
    },
    "forceRefresh": {
      "type": "boolean",
      "default": false,
      "description": "Bypass cache"
    },
    "autoFix": {
      "type": "boolean",
      "default": false,
      "description": "Automatically fix fixable issues"
    },
    "dryRun": {
      "type": "boolean",
      "default": false,
      "description": "Preview fixes without modifying file (requires autoFix: true)"
    },
    "outputFormat": {
      "type": "string",
      "enum": [
        "text",
        "json"
      ],
      "default": "text",
      "description": "Output format"
    }
  }
}
} as const;

export type LintArgs = ToolCallArguments;

export async function callLint(args: LintArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
