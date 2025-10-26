import { z } from 'zod';
import path from 'path';
import logger from '../logger.js';
import {
  loadConfig,
  saveConfig,
  detectFilePaths,
  resolveFilePath
} from '../core/config.js';
import { setActiveFilePath, getActiveFilePath } from '../core/active-file.js';
import { safeParse } from '../core/validation-middleware.js';

export const AhkAutoFileArgsSchema = z.object({
  text: z.string().describe('Text that may contain file paths to detect'),
  autoSet: z.boolean().optional().default(true).describe('Automatically set as active file if found'),
  scriptDir: z.string().optional().describe('Base directory to search for files')
});

export const ahkAutoFileToolDefinition = {
  name: 'AHK_File_Detect',
  description: `Ahk auto file
Automatically detect and set active AutoHotkey file from user text`,
  inputSchema: {
    type: 'object',
    properties: {
      text: { 
        type: 'string', 
        description: 'Text that may contain file paths to detect' 
      },
      autoSet: { 
        type: 'boolean', 
        default: true,
        description: 'Automatically set as active file if found' 
      },
      scriptDir: { 
        type: 'string', 
        description: 'Base directory to search for files' 
      }
    },
    required: ['text']
  }
};

export class AhkAutoFileTool {
  /**
   * Detect and optionally set active file from text
   */
  async execute(args: unknown): Promise<any> {
    const parsed = safeParse(args, AhkAutoFileArgsSchema, 'AHK_File_Detect');
    if (!parsed.success) return parsed.error;

    try {
      const { text, autoSet, scriptDir } = parsed.data;
      
      // Update script directory if provided
      if (scriptDir) {
        const cfg = loadConfig();
        cfg.scriptDir = path.resolve(scriptDir);
        saveConfig(cfg);
        logger.info(`Updated script directory: ${cfg.scriptDir}`);
      }
      
      // Detect potential file paths in the text
      const detectedPaths = detectFilePaths(text);
      
      if (detectedPaths.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No AutoHotkey file paths detected in the provided text.'
          }]
        };
      }
      
      // Try to resolve each detected path
      const resolvedFiles: string[] = [];
      const unresolvedPaths: string[] = [];
      
      for (const detectedPath of detectedPaths) {
        const resolved = resolveFilePath(detectedPath);
        if (resolved) {
          resolvedFiles.push(resolved);
        } else {
          unresolvedPaths.push(detectedPath);
        }
      }
      
      // If we found files and autoSet is true, set the first one as active
      let activeFileSet = false;
      if (autoSet && resolvedFiles.length > 0) {
        const setSuccess = setActiveFilePath(resolvedFiles[0]);
        activeFileSet = setSuccess;
      }

      // Build response
      let response = '📁 **AutoHotkey File Detection Results**\n\n';

      if (resolvedFiles.length > 0) {
        response += '✅ **Found Files:**\n';
        resolvedFiles.forEach((file, index) => {
          const isActive = index === 0 && activeFileSet;
          response += `• ${file}${isActive ? ' (set as active)' : ''}\n`;
        });
        response += '\n';
      }

      if (unresolvedPaths.length > 0) {
        response += '❓ **Unresolved Paths:**\n';
        unresolvedPaths.forEach(p => {
          response += `• ${p}\n`;
        });
        response += '\n';
        response += 'Tip: Set scriptDir or provide full paths for these files.\n';
      }

      if (autoSet && resolvedFiles.length > 0 && !activeFileSet) {
        response += '\n⚠️ Failed to set an active file automatically. Check file permissions or path validity.\n';
      }

      // Add current config info
      const cfg = loadConfig();
      const currentActive = getActiveFilePath();
      response += '\n**Current Configuration:**\n';
      response += `• Active File: ${currentActive || 'None'}\n`;
      response += `• Script Directory: ${cfg.scriptDir || 'Not set'}\n`;

      return {
        content: [
          { type: 'text', text: response.trim() },
          { 
            type: 'text', 
            text: JSON.stringify({
              detected: detectedPaths,
              resolved: resolvedFiles,
              unresolved: unresolvedPaths,
              activeFile: currentActive
            }, null, 2)
          }
        ]
      };
      
    } catch (error) {
      logger.error('Error in AHK_File_Detect tool:', error);
      return {
        content: [{
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }],

      };
    }
  }
  
  /**
   * Quick method to set active file from a path
   */
  static setActive(filePath: string): boolean {
    try {
      const resolved = resolveFilePath(filePath);
      if (resolved) {
        return setActiveFilePath(resolved);
      }
      return false;
    } catch (error) {
      logger.error('Error setting active file:', error);
      return false;
    }
  }
  
  /**
   * Get current active file
   */
  static getActive(): string | undefined {
    return getActiveFilePath();
  }
}