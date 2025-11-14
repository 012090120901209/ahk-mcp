// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Settings',
  slug: 'settings',
  category: 'system',
  description: `Ahk settings
Manage tool settings and enable/disable features`,
  inputSchema: {
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": [
        "get",
        "set",
        "enable_tool",
        "disable_tool",
        "enable_editing",
        "disable_editing",
        "enable_auto_run",
        "disable_auto_run",
        "enable_all",
        "disable_all",
        "reset"
      ],
      "default": "get",
      "description": "Action to perform"
    },
    "tool": {
      "type": "string",
      "description": "Tool name for enable/disable actions"
    },
    "settings": {
      "type": "object",
      "description": "Settings to update",
      "properties": {
        "allowFileEditing": {
          "type": "boolean"
        },
        "allowFileDetection": {
          "type": "boolean"
        },
        "requireExplicitPaths": {
          "type": "boolean"
        },
        "alwaysBackup": {
          "type": "boolean"
        },
        "restrictToAhkFiles": {
          "type": "boolean"
        },
        "maxFileSize": {
          "type": "number"
        },
        "autoRunAfterEdit": {
          "type": "boolean"
        }
      }
    }
  }
}
} as const;

export type SettingsArgs = ToolCallArguments;

export async function callSettings(args: SettingsArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
