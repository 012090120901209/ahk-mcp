import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import logger from '../logger.js';
import { resolveSearchDirs } from '../core/config.js';
import { safeParse } from '../core/validation-middleware.js';

export const AhkRecentArgsSchema = z.object({
  scriptDir: z.string().optional(),
  extraDirs: z.array(z.string()).optional().default([]),
  limit: z.number().min(1).max(50).optional().default(10),
  patterns: z.array(z.string()).optional().default(['*.ahk']),
});

export const ahkRecentToolDefinition = {
  name: 'AHK_File_Recent',
  description: `Ahk recent scripts
List the most recent AutoHotkey scripts from configured directories. Supports overriding A_ScriptDir.`,
  inputSchema: {
    type: 'object',
    properties: {
      scriptDir: {
        type: 'string',
        description: 'Override for A_ScriptDir/root scanning directory',
      },
      extraDirs: {
        type: 'array',
        items: { type: 'string' },
        description: 'Additional directories to scan',
      },
      limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
      patterns: {
        type: 'array',
        items: { type: 'string' },
        default: ['*.ahk'],
        description: 'File glob patterns to include',
      },
    },
  },
};

interface FoundScript {
  fullPath: string;
  lastWriteTime: number;
}

function enumerateFiles(dir: string, patterns: string[]): FoundScript[] {
  try {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const results: FoundScript[] = [];
    for (const ent of entries) {
      if (!ent.isFile()) continue;
      const fileName = ent.name;
      const matches = patterns.some(pat => matchesPattern(fileName, pat));
      if (!matches) continue;
      const fullPath = path.join(dir, fileName);
      try {
        const stat = fs.statSync(fullPath);
        results.push({ fullPath, lastWriteTime: stat.mtimeMs });
      } catch {
        // Silently ignore files that can't be stat'ed
      }
    }
    return results;
  } catch (err) {
    logger.warn('enumerateFiles error:', { dir, err: String(err) });
    return [];
  }
}

function matchesPattern(fileName: string, pattern: string): boolean {
  // very small glob: supports leading/trailing * and case-insensitive .ahk
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = '^' + pattern.split('*').map(esc).join('.*') + '$';
  const regex = new RegExp(rx, 'i');
  return regex.test(fileName);
}

export class AhkRecentTool {
  async execute(args: unknown): Promise<any> {
    try {
      const parsed = safeParse(args, AhkRecentArgsSchema, 'AHK_File_Recent');
      if (!parsed.success) return parsed.error;

      const { scriptDir, extraDirs = [], limit = 10, patterns = ['*.ahk'] } = parsed.data;

      // Resolve directories: arg -> config -> env -> cwd
      const searchDirs = resolveSearchDirs(scriptDir, extraDirs);

      // Scan only top-level of each directory for performance
      const found: FoundScript[] = [];
      for (const d of searchDirs) {
        found.push(...enumerateFiles(d, patterns));
      }

      // Sort by last write time desc and de-duplicate by path
      found.sort((a, b) => b.lastWriteTime - a.lastWriteTime);
      const seen = new Set<string>();
      const unique: FoundScript[] = [];
      for (const f of found) {
        if (seen.has(f.fullPath)) continue;
        seen.add(f.fullPath);
        unique.push(f);
        if (unique.length >= limit) break;
      }

      const items = unique.map(f => ({
        path: f.fullPath,
        lastWriteTime: new Date(f.lastWriteTime).toISOString(),
      }));

      return {
        content: [
          {
            type: 'text',
            text: items.length
              ? items.map((i, idx) => `${idx + 1}) ${i.path} — ${i.lastWriteTime}`).join('\n')
              : 'No scripts found.',
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                directoriesSearched: searchDirs,
                patterns,
                limit,
                items,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      logger.error('Error in AHK_File_Recent tool:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
}
