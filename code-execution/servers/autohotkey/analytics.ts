// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Analytics',
  slug: 'analytics',
  category: 'observability',
  description: `View tool usage analytics and performance metrics. Track success rates, execution times, common errors, and usage patterns across all MCP tools. Actions: summary (overall stats), tool_stats (specific tool), recent (recent calls), export (JSON data), clear (reset). Use to diagnose tool issues or optimize workflows.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": [
        "summary",
        "tool_stats",
        "recent",
        "export",
        "clear"
      ],
      "default": "summary",
      "description": "Action to perform"
    },
    "toolName": {
      "type": "string",
      "description": "Tool name for tool_stats action"
    },
    "limit": {
      "type": "number",
      "minimum": 1,
      "maximum": 500,
      "default": 50,
      "description": "Limit for recent metrics"
    }
  }
}
} as const;

export type AnalyticsArgs = ToolCallArguments;

export async function callAnalytics(args: AnalyticsArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
