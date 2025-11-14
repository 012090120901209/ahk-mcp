import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export type ToolCallResult = CallToolResult;

export type ToolCallArguments = Record<string, unknown>;

export interface CallAhkToolOptions {
  name: string;
  args?: ToolCallArguments;
}

