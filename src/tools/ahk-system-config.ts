import { z } from 'zod';
import logger from '../logger.js';
import { loadConfig, saveConfig, normalizeDir } from '../core/config.js';

export const AhkConfigArgsSchema = z.object({
  action: z.enum(['get', 'set']).default('get'),
  scriptDir: z.string().optional(),
  searchDirs: z.array(z.string()).optional(),
});

export const ahkConfigToolDefinition = {
  name: 'ahk_config',
  description: `Ahk config
Get/Set MCP configuration for A_ScriptDir and additional search directories.`,
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['get', 'set'], default: 'get' },
      scriptDir: { type: 'string', description: 'Default A_ScriptDir-like root used by tools' },
      searchDirs: { type: 'array', items: { type: 'string' }, description: 'Additional directories to scan' },
    }
  }
};

export class AhkConfigTool {
  async execute(args: z.infer<typeof AhkConfigArgsSchema>): Promise<any> {
    try {
      const { action, scriptDir, searchDirs } = AhkConfigArgsSchema.parse(args || {});
      if (action === 'get') {
        const cfg = loadConfig();
        return {
          content: [
            { type: 'text', text: JSON.stringify({ config: cfg }, null, 2) },
            { type: 'text', text: `scriptDir: ${cfg.scriptDir || '(unset)'}\nsearchDirs: ${(cfg.searchDirs || []).join('; ')}` },
          ],
        };
      }

      // set
      const cfg = loadConfig();
      if (typeof scriptDir === 'string') {
        cfg.scriptDir = normalizeDir(scriptDir);
      }
      if (Array.isArray(searchDirs)) {
        cfg.searchDirs = (searchDirs || []).map((d) => normalizeDir(d)!).filter(Boolean) as string[];
      }
      saveConfig(cfg);

      return {
        content: [
          { type: 'text', text: 'Configuration updated.' },
          { type: 'text', text: JSON.stringify({ config: cfg }, null, 2) },
        ],
      };
    } catch (error) {
      logger.error('Error in ahk_config tool:', error);
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }]
      };
    }
  }
}


