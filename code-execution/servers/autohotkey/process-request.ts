// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Process_Request',
  slug: 'process-request',
  category: 'workflow',
  description: `Ahk process request
Process user requests that contain file paths and instructions for AutoHotkey scripts`,
  inputSchema: {
  "type": "object",
  "properties": {
    "input": {
      "type": "string",
      "description": "Multi-line input containing file path and instructions"
    },
    "autoExecute": {
      "type": "boolean",
      "default": true,
      "description": "Automatically execute detected actions"
    },
    "defaultAction": {
      "type": "string",
      "enum": [
        "analyze",
        "diagnose",
        "run",
        "edit",
        "auto"
      ],
      "default": "auto",
      "description": "Default action if not specified"
    }
  },
  "required": [
    "input"
  ]
}
} as const;

export type ProcessRequestArgs = ToolCallArguments;

export async function callProcessRequest(args: ProcessRequestArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
