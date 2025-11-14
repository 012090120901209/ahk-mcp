// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Run',
  slug: 'run-script',
  category: 'execution',
  description: `Ahk run
Run an AutoHotkey v2 script, or watch a file and auto-run it after edits.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "mode": {
      "type": "string",
      "enum": [
        "run",
        "watch"
      ],
      "default": "run",
      "description": "Run once or enable edit watch"
    },
    "filePath": {
      "type": "string",
      "description": "Absolute path to .ahk file. If omitted, falls back to active file."
    },
    "ahkPath": {
      "type": "string",
      "description": "Path to AutoHotkey v2 executable (auto-detected if not provided)"
    },
    "errorStdOut": {
      "type": "string",
      "enum": [
        "utf-8",
        "cp1252"
      ],
      "default": "utf-8",
      "description": "Encoding for /ErrorStdOut"
    },
    "workingDirectory": {
      "type": "string",
      "description": "Working directory for the script"
    },
    "enabled": {
      "type": "boolean",
      "default": true,
      "description": "Enable/disable watcher in watch mode"
    },
    "runner": {
      "type": "string",
      "enum": [
        "native",
        "powershell"
      ],
      "default": "native",
      "description": "Process runner: native spawn or PowerShell Start-Process"
    },
    "wait": {
      "type": "boolean",
      "default": true,
      "description": "Wait for process to exit (run mode only)"
    },
    "scriptArgs": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "default": [],
      "description": "Arguments forwarded to the AHK script"
    },
    "timeout": {
      "type": "number",
      "default": 30000,
      "description": "Process timeout in milliseconds"
    },
    "killOnExit": {
      "type": "boolean",
      "default": true,
      "description": "Kill running processes when stopping watcher"
    },
    "detectWindow": {
      "type": "boolean",
      "default": false,
      "description": "Detect if script creates a window"
    },
    "windowDetectTimeout": {
      "type": "number",
      "default": 3000,
      "description": "Time to wait for window detection (ms)"
    },
    "windowTitle": {
      "type": "string",
      "description": "Expected window title pattern (optional)"
    },
    "windowClass": {
      "type": "string",
      "description": "Expected window class pattern (optional)"
    }
  }
}
} as const;

export type RunScriptArgs = ToolCallArguments;

export async function callRunScript(args: RunScriptArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
