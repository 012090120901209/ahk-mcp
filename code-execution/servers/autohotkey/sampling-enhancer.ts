// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '../../runtime/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '../../runtime/types.js';

export const metadata = {
  name: 'AHK_Sampling_Enhancer',
  slug: 'sampling-enhancer',
  category: 'analysis',
  description: `Ahk sampling enhancer
Automatically enhances prompts with AutoHotkey v2 context using MCP sampling standards when AutoHotkey-related content is detected.`,
  inputSchema: {
  "type": "object",
  "properties": {
    "originalPrompt": {
      "type": "string",
      "description": "Original prompt is required"
    },
    "includeExamples": {
      "type": "boolean",
      "description": "Include code examples",
      "default": true
    },
    "contextLevel": {
      "type": "string",
      "enum": [
        "minimal",
        "standard",
        "comprehensive"
      ],
      "description": "Level of context to include",
      "default": "standard"
    },
    "modelPreferences": {
      "type": "object",
      "properties": {
        "intelligencePriority": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "Intelligence priority (0-1)",
          "default": 0.8
        },
        "costPriority": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "Cost priority (0-1)",
          "default": 0.3
        },
        "speedPriority": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "Speed priority (0-1)",
          "default": 0.5
        }
      }
    },
    "maxTokens": {
      "type": "number",
      "minimum": 50,
      "maximum": 4000,
      "description": "Maximum tokens to generate",
      "default": 1000
    }
  },
  "required": [
    "originalPrompt"
  ]
}
} as const;

export type SamplingEnhancerArgs = ToolCallArguments;

export async function callSamplingEnhancer(args: SamplingEnhancerArgs = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
