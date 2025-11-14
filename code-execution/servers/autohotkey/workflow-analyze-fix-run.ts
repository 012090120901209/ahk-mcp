// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Workflow_Analyze_Fix_Run',
  slug: 'workflow-analyze-fix-run',
  category: 'workflow',
  description: `Composite workflow tool that bundles analyze → fix → verify → run operations into a single call. Reduces token usage from ~8,000 tokens (3-4 separate tool calls) to ~500 tokens (1 call with summary).

**Workflow Steps:**
1. Analyze AHK file for issues (using AHK_Analyze)
2. Auto-apply suggested fixes (using AHK_File_Edit)
3. Re-analyze to verify fixes worked
4. Optionally run the script (using AHK_Run)
5. Return concise summary (not all intermediate data)

**Examples:**
• Quick fix and run: { filePath: "script.ahk", autoFix: true, runAfterFix: true }
• Analyze and fix only: { filePath: "script.ahk", autoFix: true, runAfterFix: false }
• Preview fixes: { filePath: "script.ahk", dryRun: true }
• Summary only: { filePath: "script.ahk", summaryOnly: true } - Minimal token usage

**Fix Types:**
- syntax: Fix syntax errors (e.g., := vs =, missing parentheses)
- style: Fix style issues (e.g., comments, formatting)
- performance: Fix performance issues (e.g., unnecessary complexity)
- all: Apply all available fixes (default)

**Token Savings:**
Traditional approach (3-4 tool calls):
- AHK_Analyze: ~3,000 tokens
- AHK_File_Edit: ~2,000 tokens
- AHK_Analyze (verify): ~3,000 tokens
- AHK_Run (optional): ~500 tokens
- Total: ~8,500 tokens

This tool (1 call with summary):
- Analyze + Fix + Verify + Run: ~500 tokens (summary only)
- Savings: ~94% token reduction

**Use Cases:**
• Quick script fixes before running
• Automated code quality improvements
• CI/CD integration for AHK scripts
• Batch processing of multiple scripts

**What to Avoid:**
• Using on large files (>1000 lines) without dryRun first
• Auto-fixing without reviewing changes (always test!)
• Running untrusted scripts (security risk)

**See also:** AHK_Analyze (detailed analysis), AHK_File_Edit (manual editing), AHK_Run (script execution)`,
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
