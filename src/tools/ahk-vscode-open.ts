import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import logger from '../logger.js';
import { safeParse } from '../core/validation-middleware.js';
import { createErrorResponse, createSuccessResponse } from '../utils/response-helpers.js';
import { getLastEditedFile } from '../core/config.js';
import { getActiveFilePath } from '../core/active-file.js';
import { openFileInVSCode } from '../utils/vscode-open.js';
import { pathConverter, PathFormat } from '../utils/path-converter.js';

export const AhkVSCodeOpenArgsSchema = z.object({
  filePath: z
    .string()
    .optional()
    .describe('File path to open in VS Code (defaults to last edited file, then active file)'),
  line: z.number().int().min(1).optional().describe('Line number to reveal (1-based)'),
  column: z.number().int().min(1).optional().describe('Column number to reveal (1-based)'),
  reuseWindow: z.boolean().optional().default(true).describe('Reuse the existing VS Code window'),
  wait: z.boolean().optional().default(false).describe('Wait for VS Code to exit'),
});

export const ahkVSCodeOpenToolDefinition = {
  name: 'AHK_VSCode_Open',
  description: `Open the most recently edited AutoHotkey file (or a specified file) in VS Code. Defaults to the last edited file recorded by MCP and falls back to the active file.`,
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'File path to open (defaults to last edited file, then active file)',
      },
      line: {
        type: 'number',
        description: 'Line number to reveal (1-based)',
      },
      column: {
        type: 'number',
        description: 'Column number to reveal (1-based)',
      },
      reuseWindow: {
        type: 'boolean',
        default: true,
        description: 'Reuse the existing VS Code window',
      },
      wait: {
        type: 'boolean',
        default: false,
        description: 'Wait for VS Code to exit',
      },
    },
  },
};

export class AhkVSCodeOpenTool {
  async execute(rawArgs: unknown): Promise<any> {
    const parsed = safeParse(rawArgs, AhkVSCodeOpenArgsSchema, 'AHK_VSCode_Open');
    if (!parsed.success) return parsed.error;

    try {
      const { filePath, line, column, reuseWindow, wait } = parsed.data;

      const candidatePath = filePath || getLastEditedFile() || getActiveFilePath();
      if (!candidatePath) {
        return createErrorResponse(
          'No file path provided and no last edited or active file available.'
        );
      }

      let convertedPath = candidatePath;
      try {
        const conversion = pathConverter.autoConvert(candidatePath, PathFormat.WINDOWS);
        if (conversion.success) {
          convertedPath = conversion.convertedPath;
        }
      } catch (error) {
        logger.warn(
          `VS Code path conversion failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      const resolvedPath = path.resolve(convertedPath);

      if (!resolvedPath.toLowerCase().endsWith('.ahk')) {
        return createErrorResponse('Target file must end with .ahk.');
      }

      try {
        await fs.access(resolvedPath);
      } catch {
        return createErrorResponse(`File not found: ${resolvedPath}`);
      }

      const launch = await openFileInVSCode(resolvedPath, { line, column, reuseWindow, wait });

      return createSuccessResponse('VS Code opened the target file.', {
        filePath: resolvedPath,
        command: launch.command,
        args: launch.args,
      });
    } catch (error) {
      logger.error('Error in AHK_VSCode_Open tool:', error);
      return createErrorResponse(error instanceof Error ? error.message : String(error));
    }
  }
}
