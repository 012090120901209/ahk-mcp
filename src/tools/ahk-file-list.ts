import { z } from 'zod';
import fs from 'fs/promises';
import type { Stats } from 'fs';
import path from 'path';
import logger from '../logger.js';
import { activeFile } from '../core/active-file.js';
import { safeParse } from '../core/validation-middleware.js';
import { checkToolAvailability } from '../core/tool-settings.js';

export const AhkFileListArgsSchema = z.object({
  directory: z.string().optional().describe('Directory root to enumerate (defaults to active file directory or current working directory).'),
  recursive: z.boolean().optional().default(false).describe('Include files from subdirectories.'),
  includeDirectories: z.boolean().optional().default(false).describe('Include directories in the results.'),
  includeHidden: z.boolean().optional().default(false).describe('Include entries beginning with .'),
  extensions: z
    .array(z.string())
    .optional()
    .describe('Limit results to specific file extensions (defaults to [".ahk"]). Use empty array to include all files.'),
  maxResults: z.number().min(1).max(2000).optional().default(200).describe('Maximum number of entries to return.'),
  maxDepth: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .default(5)
    .describe('Maximum directory depth when recursive listing is enabled (root depth = 1).'),
  includeStats: z.boolean().optional().default(true).describe('Include size and modified timestamps when available.'),
  absolutePaths: z.boolean().optional().default(true).describe('Return absolute paths (false = relative to directory root).'),
});

export const ahkFileListToolDefinition = {
  name: 'AHK_File_List',
  description: `Ahk file listing\nEnumerate AutoHotkey project files within a directory using native path policies. Supports recursion, extension filters, and lightweight metadata for downstream edits.`,
  inputSchema: {
    type: 'object',
    properties: {
      directory: { type: 'string', description: 'Directory root to enumerate (defaults to active file directory or current working directory).' },
      recursive: { type: 'boolean', default: false, description: 'Include files from subdirectories.' },
      includeDirectories: { type: 'boolean', default: false, description: 'Include directories in the results.' },
      includeHidden: { type: 'boolean', default: false, description: 'Include entries beginning with .' },
      extensions: { type: 'array', items: { type: 'string' }, description: 'Limit results to specific file extensions (defaults to [".ahk"]). Use empty array to include all files.' },
      maxResults: { type: 'number', minimum: 1, maximum: 2000, default: 200, description: 'Maximum number of entries to return.' },
      maxDepth: { type: 'number', minimum: 1, maximum: 10, default: 5, description: 'Maximum depth when recursive is true.' },
      includeStats: { type: 'boolean', default: true, description: 'Include size/modified metadata.' },
      absolutePaths: { type: 'boolean', default: true, description: 'Return absolute paths in results.' }
    }
  }
};

interface ListedEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  depth: number;
}

interface QueueItem {
  directory: string;
  depth: number;
  relativePath: string;
}

export class AhkFileListTool {
  async execute(args: unknown): Promise<any> {
    const parsed = safeParse(args, AhkFileListArgsSchema, 'AHK_File_List');
    if (!parsed.success) return parsed.error;

    try {
      const availability = checkToolAvailability('AHK_File_List');
      if (!availability.enabled) {
        return {
          content: [{ type: 'text', text: availability.message || 'Tool is disabled' }]
        };
      }

      const {
        directory,
        recursive = false,
        includeDirectories = false,
        includeHidden = false,
        extensions,
        maxResults = 200,
        maxDepth = 5,
        includeStats = true,
        absolutePaths = true,
      } = parsed.data;

      const rootDirectory = await this.resolveDirectory(directory);
      const normalizedExtensions = this.normalizeExtensions(extensions);

      const entries = await this.collectEntries(rootDirectory, {
        recursive,
        includeDirectories,
        includeHidden,
        extensions: normalizedExtensions,
        maxResults,
        maxDepth,
        includeStats,
        absolutePaths,
      });

      const fileCount = entries.filter((e) => e.type === 'file').length;
      const dirCount = entries.filter((e) => e.type === 'directory').length;

      const lines = entries.map((entry, index) => {
        const statsParts: string[] = [];
        if (includeStats) {
          if (typeof entry.size === 'number') statsParts.push(`${entry.size} bytes`);
          if (entry.modified) statsParts.push(entry.modified);
        }
        const meta = statsParts.length ? ` — ${statsParts.join(' • ')}` : '';
        return `${index + 1}. [${entry.type}] ${entry.path}${meta}`;
      });

      const summary = [
        `📂 Directory: ${rootDirectory}`,
        `📄 Files: ${fileCount}`,
        includeDirectories ? `📁 Directories: ${dirCount}` : undefined,
        recursive ? `🔁 Recursive (max depth ${maxDepth})` : '🔁 Recursive disabled',
        normalizedExtensions.length ? `🎯 Extensions: ${normalizedExtensions.join(', ')}` : '🎯 Extensions: all',
      ]
        .filter(Boolean)
        .join('\n');

      return {
        content: [
          { type: 'text', text: `${summary}\n\n${lines.join('\n') || 'No entries found.'}` },
          {
            type: 'text',
            text: JSON.stringify(
              {
                directory: rootDirectory,
                recursive,
                includeDirectories,
                includeHidden,
                includeStats,
                extensions: normalizedExtensions,
                maxResults,
                maxDepth,
                absolutePaths,
                counts: { files: fileCount, directories: dirCount },
                entries,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      logger.error('Error in AHK_File_List tool:', error);
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

  private async resolveDirectory(explicitDir?: string): Promise<string> {
    let candidate: string | undefined = explicitDir;

    if (!candidate) {
      const active = activeFile.getActiveFile();
      if (active) {
        candidate = path.dirname(active);
      }
    }

    if (!candidate) {
      candidate = process.cwd();
    }

    const resolved = path.resolve(candidate);
    const stat = await fs.stat(resolved).catch(() => {
      throw new Error(`Directory not found: ${resolved}`);
    });

    if (!stat.isDirectory()) {
      throw new Error(`Path is not a directory: ${resolved}`);
    }

    return resolved;
  }

  private normalizeExtensions(raw?: string[]): string[] {
    if (!raw || raw.length === 0) {
      return ['.ahk'];
    }

    return raw
      .map((ext) => ext.trim())
      .filter((ext) => ext.length > 0)
      .map((ext) => (ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`));
  }

  private async collectEntries(
    root: string,
    options: {
      recursive: boolean;
      includeDirectories: boolean;
      includeHidden: boolean;
      extensions: string[];
      maxResults: number;
      maxDepth: number;
      includeStats: boolean;
      absolutePaths: boolean;
    },
  ): Promise<ListedEntry[]> {
    const results: ListedEntry[] = [];
    const queue: QueueItem[] = [{ directory: root, depth: 1, relativePath: '' }];

    while (queue.length > 0 && results.length < options.maxResults) {
      const current = queue.shift()!;

      let dirEntries;
      try {
        dirEntries = await fs.readdir(current.directory, { withFileTypes: true });
      } catch (err) {
        logger.warn('Failed to read directory', { directory: current.directory, error: String(err) });
        continue;
      }

      for (const entry of dirEntries) {
        if (!options.includeHidden && entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(current.directory, entry.name);
        const relativePath = current.relativePath ? path.join(current.relativePath, entry.name) : entry.name;
        const displayPath = options.absolutePaths ? fullPath : relativePath;

        if (entry.isDirectory()) {
          if (options.includeDirectories) {
            const meta = options.includeStats ? await this.safeStat(fullPath) : undefined;
            results.push({
              name: entry.name,
              path: displayPath,
              type: 'directory',
              size: meta?.size,
              modified: meta ? new Date(meta.mtimeMs).toISOString() : undefined,
              depth: current.depth,
            });
          }

          if (options.recursive && current.depth < options.maxDepth) {
            queue.push({ directory: fullPath, depth: current.depth + 1, relativePath });
          }

          if (results.length >= options.maxResults) break;
          continue;
        }

        if (options.extensions.length > 0) {
          const lowerName = entry.name.toLowerCase();
          const matchesExtension = options.extensions.some((ext) => lowerName.endsWith(ext));
          if (!matchesExtension) {
            continue;
          }
        }

        const meta = options.includeStats ? await this.safeStat(fullPath) : undefined;
        results.push({
          name: entry.name,
          path: displayPath,
          type: 'file',
          size: meta?.size,
          modified: meta ? new Date(meta.mtimeMs).toISOString() : undefined,
          depth: current.depth,
        });

        if (results.length >= options.maxResults) break;
      }
    }

    return results;
  }

  private async safeStat(fullPath: string): Promise<Stats | undefined> {
    try {
      return await fs.stat(fullPath);
    } catch (error) {
      logger.debug('Failed to stat path', { fullPath, error: String(error) });
      return undefined;
    }
  }
}


