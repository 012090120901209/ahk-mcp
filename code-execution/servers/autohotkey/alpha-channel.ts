// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Alpha',
  slug: 'alpha-channel',
  category: 'system',
  description: `Ahk alpha
Create and manage alpha versions of scripts for iterative development`,
  inputSchema: {
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": [
        "create",
        "list",
        "latest",
        "track_failure",
        "reset",
        "auto"
      ],
      "default": "create",
      "description": "Action to perform"
    },
    "filePath": {
      "type": "string",
      "description": "File path (defaults to activeFilePath)"
    },
    "content": {
      "type": "string",
      "description": "Content for the alpha version"
    },
    "reason": {
      "type": "string",
      "description": "Reason for creating alpha version"
    },
    "switchToAlpha": {
      "type": "boolean",
      "default": true,
      "description": "Switch active file to the new alpha version"
    }
  }
}
} as const;

export type AlphaChannelArgs = ToolCallArguments;

export async function callAlphaChannel(args: AlphaChannelArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
