import { z } from 'zod';
import logger from '../logger.js';
import { safeParse } from '../core/validation-middleware.js';
import { checkToolAvailability } from '../core/tool-settings.js';
import { createErrorResponse } from '../utils/response-helpers.js';
import { requestDocumentSymbols } from '../utils/thqby-lsp-client.js';

export const AhkThqbyDocumentSymbolsArgsSchema = z.object({
  code: z.string().min(1, 'code is required').describe('AutoHotkey v2 source code to analyze'),
  filePath: z
    .string()
    .optional()
    .describe('Optional file path for better symbol resolution (.ahk)'),
  timeoutMs: z
    .number()
    .min(1000)
    .max(60000)
    .optional()
    .describe('Timeout in milliseconds (default 15000)'),
});

export type AhkThqbyDocumentSymbolsArgs = z.infer<typeof AhkThqbyDocumentSymbolsArgsSchema>;

export const ahkThqbyDocumentSymbolsToolDefinition = {
  name: 'AHK_THQBY_Document_Symbols',
  description: `Document symbols via THQBY AutoHotkey v2 LSP (vscode-autohotkey2-lsp). Returns classes, methods, functions, variables, hotkeys, and labels using the external LSP server.`,
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'AutoHotkey v2 source code to analyze',
      },
      filePath: {
        type: 'string',
        description: 'Optional file path for better symbol resolution (.ahk)',
      },
      timeoutMs: {
        type: 'number',
        minimum: 1000,
        maximum: 60000,
        description: 'Timeout in milliseconds (default 15000)',
      },
    },
    required: ['code'],
  },
};

export class AhkThqbyDocumentSymbolsTool {
  async execute(args: unknown): Promise<any> {
    const parsed = safeParse(args, AhkThqbyDocumentSymbolsArgsSchema, 'AHK_THQBY_Document_Symbols');
    if (!parsed.success) return parsed.error;

    const availability = checkToolAvailability('AHK_THQBY_Document_Symbols');
    if (!availability.enabled) {
      return createErrorResponse(
        availability.message || 'AHK_THQBY_Document_Symbols tool is disabled.'
      );
    }

    try {
      const { code, filePath, timeoutMs } = parsed.data;
      if (filePath && !filePath.toLowerCase().endsWith('.ahk')) {
        return createErrorResponse('filePath must end with .ahk');
      }

      const result = await requestDocumentSymbols(code, filePath, { timeoutMs });

      return {
        content: [
          { type: 'text', text: 'Document symbols retrieved from THQBY LSP.' },
          { type: 'text', text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (error) {
      logger.error('Error in AHK_THQBY_Document_Symbols:', error);
      return createErrorResponse(error instanceof Error ? error.message : String(error));
    }
  }
}
