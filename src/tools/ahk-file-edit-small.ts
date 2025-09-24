import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import logger from '../logger.js';
import { activeFile } from '../core/active-file.js';
import { checkToolAvailability, toolSettings } from '../core/tool-settings.js';
import { createUnifiedDiff } from './ahk-file-edit-diff.js';
import { AhkRunTool } from './ahk-run-script.js';

type EditAction =
  | 'replace_regex'
  | 'replace_literal'
  | 'line_replace'
  | 'line_delete'
  | 'line_insert_before'
  | 'line_insert_after';

export const AhkSmallEditArgsSchema = z.object({
  action: z.enum([
    'replace_regex',
    'replace_literal',
    'line_replace',
    'line_delete',
    'line_insert_before',
    'line_insert_after',
  ] as const).default('replace_regex'),
  file: z.string().optional().describe('Target file to edit. Defaults to the active file when omitted.'),
  files: z.array(z.string()).optional().describe('Apply the same edit to multiple files.'),
  find: z.string().optional().describe('Text (or pattern) to search for when using replace actions.'),
  replace: z.string().optional().describe('Replacement text for replace actions.'),
  regexFlags: z.string().optional().describe('Additional RegExp flags (e.g. "i" for case-insensitive).'),
  all: z.boolean().optional().default(true).describe('Replace all occurrences (false = first only).'),
  line: z.number().optional().describe('Line number for line-based actions (1-based).'),
  startLine: z.number().optional().describe('Start line for range operations (1-based).'),
  endLine: z.number().optional().describe('End line for range delete or replace (1-based, inclusive).'),
  content: z.string().optional().describe('Content to insert or replace when using line actions.'),
  preview: z.boolean().optional().default(false).describe('Show a unified diff instead of writing to disk.'),
  backup: z.boolean().optional().default(false).describe('Create a .bak backup before writing changes.'),
  runAfter: z.boolean().optional().describe('Run the script after edits complete (single file only).'),
});

export const ahkSmallEditToolDefinition = {
  name: 'AHK_File_Edit_Small',
  description: `AHK Small Edit
Token-efficient file editing for simple replacements and line edits. Supports regex or literal replacements and line targeting with optional preview.`,
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: [
          'replace_regex',
          'replace_literal',
          'line_replace',
          'line_delete',
          'line_insert_before',
          'line_insert_after',
        ],
        default: 'replace_regex',
        description: 'Edit action to perform',
      },
      file: {
        type: 'string',
        description: 'Target file to edit. Defaults to the active file when omitted.',
      },
      files: {
        type: 'array',
        description: 'Apply the same edit to multiple files.',
        items: { type: 'string' },
      },
      find: {
        type: 'string',
        description: 'Text (or pattern) to search for when using replace actions.',
      },
      replace: {
        type: 'string',
        description: 'Replacement text for replace actions.',
      },
      regexFlags: {
        type: 'string',
        description: 'Additional RegExp flags (e.g. "i" for case-insensitive).',
      },
      all: {
        type: 'boolean',
        default: true,
        description: 'Replace all occurrences (false = first only).',
      },
      line: {
        type: 'number',
        description: 'Line number for line-based actions (1-based).',
      },
      startLine: {
        type: 'number',
        description: 'Start line for range operations (1-based).',
      },
      endLine: {
        type: 'number',
        description: 'End line for range delete or replace (1-based, inclusive).',
      },
      content: {
        type: 'string',
        description: 'Content to insert or replace when using line actions.',
      },
      preview: {
        type: 'boolean',
        default: false,
        description: 'Show a unified diff instead of writing to disk.',
      },
      backup: {
        type: 'boolean',
        default: false,
        description: 'Create a .bak backup before writing changes.',
      },
      runAfter: {
        type: 'boolean',
        description: 'Run the script after edits complete (single file only).',
      },
    },
  },
};

interface EditResult {
  changed: boolean;
  newContent: string;
  summary: string;
}

interface ToolMessage {
  type: 'text';
  text: string;
}

interface ToolResponse {
  content: ToolMessage[];
  isError?: boolean;
}

export class AhkSmallEditTool {
  private runTool: AhkRunTool;

  constructor() {
    this.runTool = new AhkRunTool();
  }

  async execute(rawArgs: z.infer<typeof AhkSmallEditArgsSchema>): Promise<ToolResponse> {
    try {
      const availability = checkToolAvailability('AHK_File_Edit_Small');
      if (!availability.enabled) {
        return {
          content: [{ type: 'text', text: availability.message || 'Tool is disabled' }],
        };
      }

      const args = AhkSmallEditArgsSchema.parse(rawArgs || {});
      const runAfter = typeof args.runAfter === 'boolean' ? args.runAfter : toolSettings.shouldAutoRunAfterEdit();
      const targets = await this.resolveTargets(args.file, args.files);

      if (targets.length === 0) {
        throw new Error('No target file provided and no active file set.');
      }

      const reports: string[] = [];
      const runMessages: string[] = [];
      let runHandled = false;

      for (const target of targets) {
        const absolutePath = path.resolve(target);

        let original: string;
        try {
          original = await fs.readFile(absolutePath, 'utf-8');
        } catch (error) {
          reports.push(`❌ ${absolutePath}: failed to read file (${error instanceof Error ? error.message : String(error)})`);
          continue;
        }

        const result = this.applyEdit(absolutePath, original, args);

        if (!result.changed) {
          reports.push(`⚠️ ${absolutePath}: no changes detected`);
          continue;
        }

        if (args.preview) {
          const diff = createUnifiedDiff(original, result.newContent, `${absolutePath}.orig`, `${absolutePath}.preview`);
          reports.push(`📝 ${absolutePath}: preview diff:\n${diff}`);
          if (runAfter && !runHandled) {
            runMessages.push('⚠️ Run skipped during preview mode. Apply changes without preview to execute the script.');
            runHandled = true;
          }
          continue;
        }

        if (args.backup) {
          try {
            await fs.writeFile(`${absolutePath}.bak`, original, 'utf-8');
          } catch (error) {
            reports.push(`❌ ${absolutePath}: failed to write backup (${error instanceof Error ? error.message : String(error)})`);
            continue;
          }
        }

        try {
          await fs.writeFile(absolutePath, result.newContent, 'utf-8');
          reports.push(`✅ ${absolutePath}: ${result.summary}${args.backup ? ' (backup saved as .bak)' : ''}`);

          if (runAfter && !runHandled) {
            if (targets.length > 1) {
              runMessages.push('⚠️ Run skipped because multiple files were edited. Run the primary script manually if needed.');
              runHandled = true;
            } else if (!absolutePath.toLowerCase().endsWith('.ahk')) {
              runMessages.push(`⚠️ Run skipped because ${absolutePath} is not an AutoHotkey script.`);
              runHandled = true;
            } else {
              try {
                const runResult = await this.runTool.execute({
                  mode: 'run',
                  filePath: absolutePath,
                  wait: true,
                  runner: 'native',
                  scriptArgs: [],
                  timeout: 30000,
                  killOnExit: true,
                  detectWindow: false,
                } as any);

                if (runResult?.content?.length) {
                  const runText = runResult.content
                    .filter((item: any) => item.type === 'text')
                    .map((item: any) => item.text)
                    .join('\n');
                  runMessages.push(runText || 'Script executed.');
                } else {
                  runMessages.push('Script executed successfully.');
                }
              } catch (runError) {
                runMessages.push(`⚠️ Failed to run script: ${runError instanceof Error ? runError.message : String(runError)}`);
              }
              runHandled = true;
            }
          }
        } catch (error) {
          reports.push(`❌ ${absolutePath}: failed to write changes (${error instanceof Error ? error.message : String(error)})`);
        }
      }

      if (runMessages.length > 0) {
        reports.push(runMessages.join('\n'));
      }

      return {
        content: [{ type: 'text', text: reports.join('\n\n') }],
      };
    } catch (error) {
      logger.error('Error in AHK_File_Edit_Small tool:', error);
      return {
        content: [{
          type: 'text',
          text: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
        }]
      };
    }
  }

  private async resolveTargets(file?: string, files?: string[]): Promise<string[]> {
    if (files && files.length > 0) {
      return Array.from(new Set(files.map(f => f.trim()).filter(Boolean)));
    }

    if (file) {
      return [file];
    }

    const active = activeFile.getActiveFile();
    return active ? [active] : [];
  }

  private applyEdit(file: string, original: string, args: z.infer<typeof AhkSmallEditArgsSchema>): EditResult {
    switch (args.action as EditAction) {
      case 'replace_regex':
        return this.applyRegexReplace(original, args);
      case 'replace_literal':
        return this.applyLiteralReplace(original, args);
      case 'line_replace':
        return this.applyLineReplace(original, args);
      case 'line_delete':
        return this.applyLineDelete(original, args);
      case 'line_insert_before':
      case 'line_insert_after':
        return this.applyLineInsert(original, args);
      default:
        throw new Error(`Unsupported action: ${args.action}`);
    }
  }

  private applyRegexReplace(content: string, args: z.infer<typeof AhkSmallEditArgsSchema>): EditResult {
    if (!args.find) {
      throw new Error('Missing "find" pattern for regex replace.');
    }

    const flags = this.buildRegexFlags(args.regexFlags, args.all);
    const regex = new RegExp(args.find, flags);
    const replacement = args.replace ?? '';

    const matches = content.match(regex);
    if (!matches) {
      return { changed: false, newContent: content, summary: 'pattern not found' };
    }

    // Create a fresh regex for replacement to avoid lastIndex side-effects
    const replaceRegex = new RegExp(args.find, flags);
    const newContent = content.replace(replaceRegex, replacement);
    const replacements = args.all ? matches.length : 1;

    return {
      changed: newContent !== content,
      newContent,
      summary: `applied regex replace (${replacements} replacement${replacements === 1 ? '' : 's'})`,
    };
  }

  private applyLiteralReplace(content: string, args: z.infer<typeof AhkSmallEditArgsSchema>): EditResult {
    if (!args.find) {
      throw new Error('Missing "find" text for literal replace.');
    }

    const replacement = args.replace ?? '';

    if (args.all) {
      if (!content.includes(args.find)) {
        return { changed: false, newContent: content, summary: 'text not found' };
      }
      const occurrences = content.split(args.find).length - 1;
      const newContent = content.split(args.find).join(replacement);
      return {
        changed: newContent !== content,
        newContent,
        summary: `replaced ${occurrences} occurrence${occurrences === 1 ? '' : 's'}`,
      };
    }

    const index = content.indexOf(args.find);
    if (index === -1) {
      return { changed: false, newContent: content, summary: 'text not found' };
    }

    const newContent = content.slice(0, index) + replacement + content.slice(index + args.find.length);
    return {
      changed: true,
      newContent,
      summary: 'replaced first occurrence',
    };
  }

  private applyLineReplace(content: string, args: z.infer<typeof AhkSmallEditArgsSchema>): EditResult {
    const { line, startLine, endLine, content: replacement } = args;

    if (typeof replacement !== 'string') {
      throw new Error('Line replace requires "content" to provide new text.');
    }

    const lines = content.split('\n');
    const start = this.resolveLineIndex(line ?? startLine, lines.length);
    const end = this.resolveLineIndex(endLine ?? line ?? startLine, lines.length);

    if (start > end) {
      throw new Error('startLine cannot be greater than endLine.');
    }

    const updated = [...lines];
    const replacementLines = replacement.split('\n');
    updated.splice(start, end - start + 1, ...replacementLines);

    const newContent = updated.join('\n');

    return {
      changed: newContent !== content,
      newContent,
      summary: `replaced lines ${start + 1}-${end + 1}`,
    };
  }

  private applyLineDelete(content: string, args: z.infer<typeof AhkSmallEditArgsSchema>): EditResult {
    const { line, startLine, endLine } = args;
    const lines = content.split('\n');
    const start = this.resolveLineIndex(line ?? startLine, lines.length);
    const end = this.resolveLineIndex(endLine ?? line ?? startLine, lines.length);

    if (start > end) {
      throw new Error('startLine cannot be greater than endLine for delete.');
    }

    const updated = [...lines];
    updated.splice(start, end - start + 1);

    const newContent = updated.join('\n');

    return {
      changed: newContent !== content,
      newContent,
      summary: `deleted lines ${start + 1}-${end + 1}`,
    };
  }

  private applyLineInsert(content: string, args: z.infer<typeof AhkSmallEditArgsSchema>): EditResult {
    if (typeof args.line !== 'number') {
      throw new Error('Line insert actions require a specific line number.');
    }
    if (typeof args.content !== 'string') {
      throw new Error('Line insert actions require "content".');
    }

    const lines = content.split('\n');
    const index = this.resolveLineIndex(args.line, lines.length);
    const insertLines = args.content.split('\n');
    const updated = [...lines];

    if (args.action === 'line_insert_before') {
      updated.splice(index, 0, ...insertLines);
      return {
        changed: true,
        newContent: updated.join('\n'),
        summary: `inserted ${insertLines.length} line${insertLines.length === 1 ? '' : 's'} before line ${args.line}`,
      };
    }

    updated.splice(index + 1, 0, ...insertLines);
    return {
      changed: true,
      newContent: updated.join('\n'),
      summary: `inserted ${insertLines.length} line${insertLines.length === 1 ? '' : 's'} after line ${args.line}`,
    };
  }

  private resolveLineIndex(line: number | undefined, totalLines: number): number {
    if (typeof line !== 'number' || Number.isNaN(line)) {
      throw new Error('A valid line number is required.');
    }

    if (line < 1) {
      throw new Error('Line numbers are 1-based.');
    }

    if (line > totalLines) {
      throw new Error(`Line ${line} is out of range (file has ${totalLines} line${totalLines === 1 ? '' : 's'}).`);
    }

    return line - 1;
  }

  private buildRegexFlags(userFlags: string | undefined, replaceAll: boolean): string {
    let flags = userFlags || '';
    if (replaceAll && !flags.includes('g')) {
      flags += 'g';
    }
    return flags;
  }

}
