import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import logger from '../logger.js';
import { activeFile } from '../core/active-file.js';
import { checkToolAvailability } from '../core/tool-settings.js';
import { pathInterceptor } from '../core/path-interceptor.js';
import { pathConverter, PathFormat } from '../utils/path-converter.js';
import { createErrorResponse } from '../utils/response-helpers.js';
import { safeParse } from '../core/validation-middleware.js';

const UTF8_ENCODING = 'utf8';

export const AhkFileCreateArgsSchema = z.object({
  filePath: z.string().min(1, 'filePath is required').describe('Absolute or relative path to the new AutoHotkey file'),
  content: z.string().default('').describe('Initial content to write into the file'),
  overwrite: z.boolean().default(false).describe('Allow overwriting an existing file'),
  createDirectories: z.boolean().default(true).describe('Create parent directories when they do not exist'),
  dryRun: z.boolean().default(false).describe('Preview the operation without writing to disk'),
  setActive: z.boolean().default(true).describe('Set the newly created file as the active file')
});

export const ahkFileCreateToolDefinition = {
  name: 'AHK_File_Create',
  description: `Create a new AutoHotkey v2 script on disk with full path interception support.

• Validates .ahk extension (case-insensitive)
• Automatically creates parent directories (configurable)
• Prevents accidental overwrite unless explicitly allowed
• Supports dry-run previews and active file management`,
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Absolute or relative path to the new AutoHotkey file'
      },
      content: {
        type: 'string',
        description: 'Initial content to write into the file'
      },
      overwrite: {
        type: 'boolean',
        default: false,
        description: 'Allow overwriting an existing file'
      },
      createDirectories: {
        type: 'boolean',
        default: true,
        description: 'Create parent directories if they are missing'
      },
      dryRun: {
        type: 'boolean',
        default: false,
        description: 'Preview the operation without writing to disk'
      },
      setActive: {
        type: 'boolean',
        default: true,
        description: 'Set the newly created file as the active file'
      }
    },
    required: ['filePath']
  }
};

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export class AhkFileCreateTool {
  async execute(rawArgs: unknown): Promise<any> {
    const parsed = safeParse(rawArgs, AhkFileCreateArgsSchema, 'AHK_File_Create');
    if (!parsed.success) return parsed.error;

    let validatedArgs = parsed.data;

    // Check if the tool is enabled in settings
    const availability = checkToolAvailability('AHK_File_Create');
    if (!availability.enabled) {
      return createErrorResponse(
        availability.message || 'AHK_File_Create tool is disabled.'
      );
    }

    // Intercept incoming paths for cross-platform compatibility
    const interception = pathInterceptor.interceptInput('AHK_File_Create', validatedArgs);
    if (interception.success) {
      validatedArgs = AhkFileCreateArgsSchema.parse(interception.modifiedData);
      if (interception.conversions.length > 0) {
        logger.debug(`AHK_File_Create input conversions: ${interception.conversions.length} path(s) converted.`);
      }
    } else if (interception.error) {
      logger.warn(`AHK_File_Create path interception failed: ${interception.error}`);
    }

    const { overwrite, createDirectories, dryRun, setActive } = validatedArgs;
    let targetFilePath = validatedArgs.filePath.trim();
    const originalRequestPath = targetFilePath;

    try {
      if (targetFilePath.length === 0) {
        throw new Error('filePath cannot be empty.');
      }

      // Normalize to Windows format for AutoHotkey compatibility
      try {
        const conversion = pathConverter.autoConvert(targetFilePath, PathFormat.WINDOWS);
        if (conversion.success) {
          targetFilePath = conversion.convertedPath;
          logger.debug(`Path auto-converted for creation: ${conversion.originalPath} -> ${targetFilePath}`);
        } else if (conversion.error) {
          logger.debug(`Path auto-conversion skipped: ${conversion.error}`);
        }
      } catch (conversionError) {
        logger.warn(`Path conversion error: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`);
      }

      const resolvedPath = path.resolve(targetFilePath);

      if (!resolvedPath.toLowerCase().endsWith('.ahk')) {
        throw new Error('Target file must have a .ahk extension.');
      }

      const directoryPath = path.dirname(resolvedPath);
      const directoryExists = await pathExists(directoryPath);
      const fileAlreadyExists = await pathExists(resolvedPath);
      const directoriesWillBeCreated = !directoryExists && createDirectories;

      if (fileAlreadyExists && !overwrite) {
        throw new Error(`File already exists: ${resolvedPath}. Enable overwrite to replace it.`);
      }

      if (!directoryExists && !createDirectories) {
        throw new Error(`Directory does not exist: ${directoryPath}. Enable createDirectories to create it automatically.`);
      }

      const contentToWrite = validatedArgs.content ?? '';
      const bytesToWrite = Buffer.byteLength(contentToWrite, UTF8_ENCODING);
      let directoriesCreated = false;
      let activeFileSet = false;

      if (!dryRun) {
        if (!directoryExists) {
          await fs.mkdir(directoryPath, { recursive: true });
          directoriesCreated = true;
        }

        if (fileAlreadyExists && overwrite) {
          logger.info(`Overwriting existing file: ${resolvedPath}`);
        }

        await fs.writeFile(resolvedPath, contentToWrite, { encoding: UTF8_ENCODING });

        if (setActive) {
          activeFileSet = activeFile.setActiveFile(resolvedPath);
          if (!activeFileSet) {
            logger.warn(`Failed to set active file after creation: ${resolvedPath}`);
          }
        }
      }

      const resultPayload = {
        filePath: resolvedPath,
        originalRequestPath,
        dryRun,
        overwrite,
        fileExistedBefore: fileAlreadyExists,
        directoriesCreated: !dryRun ? directoriesCreated : false,
        directoriesWillBeCreated,
        bytesPlanned: bytesToWrite,
        bytesWritten: dryRun ? 0 : bytesToWrite,
        encoding: UTF8_ENCODING,
        activeFileSet,
        message: dryRun
          ? 'Dry run complete. No changes were written to disk.'
          : fileAlreadyExists && overwrite
            ? 'Existing file overwritten with new content.'
            : 'New AutoHotkey file created successfully.'
      };

      let response = {
        content: [
          {
            type: 'text',
            text: dryRun
              ? '🔬 Dry run: AutoHotkey file creation preview.'
              : '✅ AutoHotkey file created successfully.'
          },
          {
            type: 'text',
            text: JSON.stringify(resultPayload, null, 2)
          }
        ]
      };

      // Intercept outgoing data for path conversion when needed
      const outputInterception = pathInterceptor.interceptOutput('AHK_File_Create', response);
      if (outputInterception.success) {
        response = outputInterception.modifiedData;
      } else if (outputInterception.error) {
        logger.warn(`AHK_File_Create output interception failed: ${outputInterception.error}`);
      }

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`AHK_File_Create error: ${message}`);

      return createErrorResponse(message);
    }
  }
}
