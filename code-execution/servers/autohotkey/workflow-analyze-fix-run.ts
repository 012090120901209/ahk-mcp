// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Workflow_Analyze_Fix_Run',
  slug: 'workflow-analyze-fix-run',
  category: 'workflow',
  description: `Analyze→fix→verify→run workflow in one call. Fix types: syntax, style, performance, all. Use dryRun to preview, summaryOnly for minimal tokens.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "filePath": {
      "type": "string",
      "description": "Path to the AHK file to analyze, fix, and optionally run"
    },
    "autoFix": {
      "type": "boolean",
      "description": "Automatically apply suggested fixes",
      "default": true
    },
    "runAfterFix": {
      "type": "boolean",
      "description": "Run the script after fixing (requires AutoHotkey v2 installed)",
      "default": false
    },
    "fixTypes": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "syntax",
          "style",
          "performance",
          "all"
        ]
      },
      "description": "Types of fixes to apply",
      "default": [
        "all"
      ]
    },
    "dryRun": {
      "type": "boolean",
      "description": "Preview changes without applying them",
      "default": false
    },
    "summaryOnly": {
      "type": "boolean",
      "description": "Return only summary, not detailed analysis (minimal tokens)",
      "default": false
    }
  },
  "required": [
    "filePath"
  ]
}
} as const;

export type WorkflowAnalyzeFixRunArgs = ToolCallArguments;

export async function callWorkflowAnalyzeFixRun(args: WorkflowAnalyzeFixRunArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
