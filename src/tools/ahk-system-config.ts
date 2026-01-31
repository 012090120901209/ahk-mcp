import { z } from 'zod';
import logger from '../logger.js';
import { loadConfig, saveConfig, normalizeDir } from '../core/config.js';
import { safeParse, createValidationErrorResponse } from '../core/validation-middleware.js';

export const AhkConfigArgsSchema = z.object({
  action: z.enum(['get', 'set']).default('get'),
  scriptDir: z.string().optional(),
  searchDirs: z.array(z.string()).optional(),
  ahkPath: z.string().optional().describe('Path to AutoHotkey v2 executable'),
  vscodeWorkspace: z.string().optional().describe('VS Code workspace folder for opening files'),
});

export const ahkConfigToolDefinition = {
  name: 'AHK_Config',
  description: `Ahk config
Get/Set MCP configuration for script directories, AutoHotkey executable path, and VS Code workspace.`,
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['get', 'set'], default: 'get' },
      scriptDir: { type: 'string', description: 'Default A_ScriptDir-like root used by tools' },
      searchDirs: {
        type: 'array',
        items: { type: 'string' },
        description: 'Additional directories to scan',
      },
      ahkPath: {
        type: 'string',
        description: 'Path to AutoHotkey v2 executable (e.g., C:\\Path\\AutoHotkey64.exe)',
      },
      vscodeWorkspace: {
        type: 'string',
        description: 'VS Code workspace folder - files open in this window',
      },
    },
  },
};

export class AhkConfigTool {
  async execute(args: unknown): Promise<any> {
    // Validate arguments using middleware
    const parsed = safeParse(args, AhkConfigArgsSchema, 'AHK_Config');
    if (!parsed.success) return parsed.error;

    const { action, scriptDir, searchDirs, ahkPath, vscodeWorkspace } = parsed.data;

    try {
      if (action === 'get') {
        const cfg = loadConfig();
        const summary = [
          `scriptDir: ${cfg.scriptDir || '(unset)'}`,
          `searchDirs: ${(cfg.searchDirs || []).join('; ') || '(none)'}`,
          `ahkPath: ${cfg.ahkPath || '(auto-detect)'}`,
          `vscodeWorkspace: ${cfg.vscodeWorkspace || '(none)'}`,
        ].join('\n');
        return {
          content: [
            { type: 'text', text: JSON.stringify({ config: cfg }, null, 2) },
            { type: 'text', text: summary },
          ],
        };
      }

      // set
      const cfg = loadConfig();
      if (typeof scriptDir === 'string') {
        cfg.scriptDir = normalizeDir(scriptDir);
      }
      if (Array.isArray(searchDirs)) {
        cfg.searchDirs = (searchDirs || []).map(d => normalizeDir(d)!).filter(Boolean) as string[];
      }
      if (typeof ahkPath === 'string') {
        cfg.ahkPath = ahkPath;
      }
      if (typeof vscodeWorkspace === 'string') {
        cfg.vscodeWorkspace = vscodeWorkspace;
      }
      saveConfig(cfg);

      return {
        content: [
          { type: 'text', text: 'Configuration updated.' },
          { type: 'text', text: JSON.stringify({ config: cfg }, null, 2) },
        ],
      };
    } catch (error) {
      logger.error('Error in AHK_Config tool:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Runtime Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
