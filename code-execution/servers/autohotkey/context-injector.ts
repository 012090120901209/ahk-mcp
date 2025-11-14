// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Context_Injector',
  slug: 'context-injector',
  category: 'analysis',
  description: `Ahk context injector
Analyzes user prompts and LLM thinking to automatically inject relevant AutoHotkey v2 documentation context.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "userPrompt": {
      "type": "string",
      "description": "User prompt is required"
    },
    "llmThinking": {
      "type": "string",
      "description": "Optional LLM thinking content"
    },
    "contextType": {
      "type": "string",
      "enum": [
        "auto",
        "functions",
        "variables",
        "classes",
        "methods"
      ],
      "description": "Type of context to inject",
      "default": "auto"
    },
    "maxItems": {
      "type": "number",
      "minimum": 1,
      "maximum": 10,
      "description": "Maximum number of context items to return",
      "default": 5
    },
    "includeModuleInstructions": {
      "type": "boolean",
      "description": "Include relevant AHK v2 instruction modules",
      "default": true
    }
  },
  "required": [
    "userPrompt"
  ]
}
} as const;

export type ContextInjectorArgs = ToolCallArguments;

export async function callContextInjector(args: ContextInjectorArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
