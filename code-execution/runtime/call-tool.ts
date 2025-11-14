import { AhkMcpCodeClient } from './client.js';
import type { ToolCallArguments, ToolCallResult } from './types.js';

const client = new AhkMcpCodeClient();

export async function callAhkTool(
  toolName: string,
  args: ToolCallArguments = {}
): Promise<ToolCallResult> {
  return client.callTool(toolName, args);
}

export async function shutdownAhkClient(): Promise<void> {
  await client.dispose();
}

