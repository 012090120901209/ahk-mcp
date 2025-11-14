// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Tools_Search',
  slug: 'tools-search',
  category: 'discovery',
  description: `Efficiently discover available AHK tools without loading all 35+ tool definitions upfront. Progressive tool discovery reduces initial token usage from 17,500-70,000 tokens to 50-1,000 tokens based on detail level.

**Examples:**
• List all file tools: { category: "file", detailLevel: "names" } - Returns only tool names (~50 tokens)
• Search for analysis tools: { category: "analysis", detailLevel: "summary" } - Returns names + brief descriptions (~200 tokens)
• Find tools with keyword: { keyword: "edit", detailLevel: "summary" } - Returns matching tools
• Get full details: { category: "file", detailLevel: "full" } - Returns complete tool definitions (~1000+ tokens)

**Categories:**
- file: File operations (view, edit, create, detect)
- analysis: Code analysis and diagnostics
- execution: Script running and debugging
- docs: Documentation search and context
- library: Library management (list, info, import)
- system: System configuration and settings

**Detail Levels:**
- names: Just tool names (minimal tokens)
- summary: Names + brief descriptions (medium tokens)
- full: Complete tool definitions with all parameters (high tokens)

**Use Cases:**
• Initial exploration: Use "names" or "summary" to see what's available
• Targeted search: Use keyword to find specific functionality
• Full details: Use "full" only when you need complete parameter schemas

**See also:** AHK_Config (system configuration), AHK_Analytics (usage analytics)`,
  inputSchema: {
  "type": "object",
  "properties": {
    "category": {
      "type": "string",
      "enum": [
        "file",
        "analysis",
        "execution",
        "docs",
        "library",
        "system",
        "all"
      ],
      "description": "Tool category to search",
      "default": "all"
    },
    "keyword": {
      "type": "string",
      "description": "Keyword to search in tool names and descriptions"
    },
    "detailLevel": {
      "type": "string",
      "enum": [
        "names",
        "summary",
        "full"
      ],
      "description": "Level of detail: names (~50 tokens), summary (~200 tokens), full (~1000+ tokens)",
      "default": "summary"
    }
  }
}
} as const;

export type ToolsSearchArgs = ToolCallArguments;

export async function callToolsSearch(args: ToolsSearchArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
