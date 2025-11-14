// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Prompts',
  slug: 'prompts',
  category: 'docs',
  description: `AHK Prompts
Returns a set of built-in AHK v2 prompt templates for code generation and learning.`,
  inputSchema: {
  "type": "object",
  "properties": {},
  "required": []
}
} as const;

export type PromptsArgs = ToolCallArguments;

export async function callPrompts(args: PromptsArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
