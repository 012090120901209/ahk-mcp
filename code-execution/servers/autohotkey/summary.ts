// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Summary',
  slug: 'summary',
  category: 'docs',
  description: `Ahk summary
Returns a summary of built-in variables, classes, and coding standards for AutoHotkey v2.`,
  inputSchema: {
  "type": "object",
  "properties": {},
  "required": []
}
} as const;

export type SummaryArgs = ToolCallArguments;

export async function callSummary(args: SummaryArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
