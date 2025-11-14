// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Debug_Agent',
  slug: 'run-debug',
  category: 'execution',
  description: `Ahk debug agent
Starts a TCP listener for AutoHotkey /Debug and optionally proxies to a real debug adapter while capturing traffic.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "mode": {
      "type": "string",
      "enum": [
        "start",
        "stop",
        "status",
        "get_events",
        "scan"
      ],
      "description": "Control action: start, stop, status, get_events, or scan (multi-port detection)",
      "default": "status"
    },
    "listenHost": {
      "type": "string",
      "description": "Host to listen on for /Debug connections",
      "default": "127.0.0.1"
    },
    "listenPort": {
      "type": "number",
      "description": "Port to listen on for /Debug connections (single-port mode)",
      "default": 9002
    },
    "listenPorts": {
      "type": "array",
      "description": "List of ports to listen on simultaneously (multi-port mode)",
      "items": {
        "type": "number"
      }
    },
    "portRange": {
      "type": "object",
      "description": "Range of ports to listen on (inclusive) when using multi-port or scan modes",
      "properties": {
        "start": {
          "type": "number"
        },
        "end": {
          "type": "number"
        }
      }
    },
    "scanTimeoutMs": {
      "type": "number",
      "description": "Timeout in milliseconds to wait for first connection in scan mode",
      "default": 3000
    },
    "forwardHost": {
      "type": "string",
      "description": "Optional upstream debug adapter host to forward to (proxy mode)"
    },
    "forwardPort": {
      "type": "number",
      "description": "Optional upstream debug adapter port to forward to (proxy mode)"
    },
    "maxEvents": {
      "type": "number",
      "description": "Max number of traffic events to keep in memory",
      "default": 200
    },
    "eventLimit": {
      "type": "number",
      "description": "Number of recent events to return when mode=get_events",
      "default": 100
    }
  }
}
} as const;

export type RunDebugArgs = ToolCallArguments;

export async function callRunDebug(args: RunDebugArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
