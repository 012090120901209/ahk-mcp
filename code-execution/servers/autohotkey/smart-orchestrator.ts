// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Smart_Orchestrator',
  slug: 'smart-orchestrator',
  category: 'workflow',
  description: `Intelligently orchestrates file detection, analysis, and viewing operations to minimize redundant tool calls. Automatically chains detect → analyze → read → edit workflow with smart caching. Reduces tool calls from 7-10 down to 3-4 by maintaining session context.

Use this tool when you want to efficiently work with AHK files without manually coordinating multiple tools.

**Examples:**
• Basic: { intent: "view the _Dark class" } - Auto-detects file, analyzes, shows class code
• Edit mode: { intent: "edit ColorCheckbox method in _Dark", operation: "edit" } - Finds method, prepares for editing
• Debug orchestration: { intent: "analyze file structure", debugMode: true } - Shows decision log with cache hits, timing, and tool call reasons
• Analyze only: { intent: "show all classes", operation: "analyze" } - Returns structure without reading code

**Debug Mode Output:**
When debugMode: true, you'll see:
- [00:00.123] 🔧 Tool: AHK_File_Detect | Reason: No file path provided | Duration: 45ms
- [00:00.234] 🔧 Tool: AHK_Analyze | Cache: HIT ⚡ | Duration: 2ms

**What to Avoid:**
- ❌ Vague intents (e.g., "fix something") → be specific: "edit NotifyUser() in alerts.ahk"
- ❌ Ignoring cache when files change → set forceRefresh: true after external edits
- ❌ Forgetting debugMode when troubleshooting orchestration decisions

**See also:** AHK_File_Detect (manual detection), AHK_Analyze (manual analysis), AHK_File_View (manual reading)`,
  inputSchema: {
  "type": "object",
  "properties": {
    "intent": {
      "type": "string",
      "description": "High-level description of what you want to do (e.g., \"edit the _Dark class checkbox methods\")"
    },
    "filePath": {
      "type": "string",
      "description": "Optional: Direct path to AHK file (skips detection if provided)"
    },
    "targetEntity": {
      "type": "string",
      "description": "Optional: Specific class, method, or function name to focus on (e.g., \"_Dark\", \"_Dark.ColorCheckbox\")"
    },
    "operation": {
      "type": "string",
      "enum": [
        "view",
        "edit",
        "analyze"
      ],
      "description": "Operation type: view (read-only), edit (prepare for editing), analyze (structure only)",
      "default": "view"
    },
    "forceRefresh": {
      "type": "boolean",
      "description": "Force re-analysis even if cached data exists",
      "default": false
    },
    "debugMode": {
      "type": "boolean",
      "description": "Show orchestration decision log with timing and cache info",
      "default": false
    }
  },
  "required": [
    "intent"
  ]
}
} as const;

export type SmartOrchestratorArgs = ToolCallArguments;

export async function callSmartOrchestrator(args: SmartOrchestratorArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
