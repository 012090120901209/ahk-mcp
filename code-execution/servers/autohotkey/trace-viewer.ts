// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Trace_Viewer',
  slug: 'trace-viewer',
  category: 'observability',
  description: `Query and analyze distributed traces for debugging and performance analysis.

**Actions:**
- \`get\`: Retrieve a specific trace by ID with full span tree
- \`list\`: View recent traces (default, most recent first)
- \`search\`: Find traces by tool name
- \`stats\`: Show tracing system statistics
- \`clear\`: Clear all stored traces

**Use Cases:**
- Debug complex tool orchestration flows
- Analyze performance bottlenecks
- Understand tool call sequences
- Investigate errors with full context
- Track correlation across operations

**Examples:**
\`\`\`
// View recent traces
{ "action": "list", "limit": 10 }

// Get specific trace with tree view
{ "action": "get", "traceId": "abc123", "format": "tree" }

// Find all traces for a tool
{ "action": "search", "toolName": "AHK_Smart_Orchestrator" }

// Export trace as JSON
{ "action": "get", "traceId": "abc123", "format": "json" }
\`\`\`

**Output Formats:**
- \`tree\`: Hierarchical tree view with timings (human-readable)
- \`json\`: Full JSON export (machine-readable)
- \`summary\`: Quick overview with key metrics`,
  inputSchema: {
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": [
        "get",
        "list",
        "search",
        "stats",
        "clear"
      ],
      "default": "list",
      "description": "Action to perform"
    },
    "traceId": {
      "type": "string",
      "description": "Trace ID for \"get\" action"
    },
    "toolName": {
      "type": "string",
      "description": "Tool name for \"search\" action"
    },
    "limit": {
      "type": "number",
      "minimum": 1,
      "maximum": 100,
      "default": 20,
      "description": "Maximum number of traces to return"
    },
    "format": {
      "type": "string",
      "enum": [
        "tree",
        "json",
        "summary"
      ],
      "default": "tree",
      "description": "Output format for trace display"
    }
  }
}
} as const;

export type TraceViewerArgs = ToolCallArguments;

export async function callTraceViewer(args: TraceViewerArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
