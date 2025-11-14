// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Test_Interactive',
  slug: 'test-interactive',
  category: 'execution',
  description: `Run AHK script with interactive GUI feedback interface. Opens a GUI with PASS/FAIL buttons, captures script output, and waits for manual test verification. Returns pass/fail status and any output captured.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "scriptContent": {
      "type": "string",
      "description": "AutoHotkey v2 script code to test"
    },
    "testDescription": {
      "type": "string",
      "description": "Description of what this test validates"
    },
    "timeout": {
      "type": "number",
      "description": "Maximum wait time in milliseconds (default: 300000 = 5 minutes)",
      "default": 300000
    },
    "ahkPath": {
      "type": "string",
      "description": "Path to AutoHotkey v2 executable (auto-detected if not provided)"
    }
  },
  "required": [
    "scriptContent",
    "testDescription"
  ]
}
} as const;

export type TestInteractiveArgs = ToolCallArguments;

export async function callTestInteractive(args: TestInteractiveArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
