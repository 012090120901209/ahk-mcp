import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import logger from '../logger.js';
import { activeFile } from '../core/active-file.js';
import { checkToolAvailability, toolSettings } from '../core/tool-settings.js';
import { handleEditFailure } from './ahk-system-alpha.js';
import { AhkRunTool } from './ahk-run-script.js';

export const AhkEditArgsSchema = z.object({
  action: z.enum(['replace', 'insert', 'delete', 'append', 'prepend']).default('replace'),
  search: z.string().optional().describe('Text to search for (for replace/delete)'),
  content: z.string().optional().describe('New content to add/replace'),
  line: z.number().optional().describe('Line number for insert/delete (1-based)'),
  startLine: z.number().optional().describe('Start line for range operations'),
  endLine: z.number().optional().describe('End line for range operations'),
  filePath: z.string().optional().describe('File to edit (defaults to activeFilePath)'),
  regex: z.boolean().optional().default(false).describe('Use regex for search'),
  all: z.boolean().optional().default(false).describe('Replace all occurrences'),
  backup: z.boolean().optional().default(true).describe('Create backup before editing'),
  runAfter: z.boolean().optional().describe('Run the script after the edit completes successfully')
});

export const ahkEditToolDefinition = {
  name: 'AHK_File_Edit',
  description: `AHK Edit
DIRECTLY EDIT AND MODIFY AUTOHOTKEY FILES ON DISK - Use this tool when the user provides a file path and wants to make changes to the actual file. Always prefer this over generating code blocks when a file path is mentioned. Supports replace, insert, delete, append, prepend operations.`,
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['replace', 'insert', 'delete', 'append', 'prepend'],
        default: 'replace',
        description: 'Edit action to perform'
      },
      search: {
        type: 'string',
        description: 'Text to search for (for replace/delete)'
      },
      content: {
        type: 'string',
        description: 'New content to add/replace'
      },
      line: {
        type: 'number',
        description: 'Line number for insert/delete (1-based)'
      },
      startLine: {
        type: 'number',
        description: 'Start line for range operations'
      },
      endLine: {
        type: 'number',
        description: 'End line for range operations'
      },
      filePath: {
        type: 'string',
        description: 'File to edit (defaults to activeFilePath)'
      },
      regex: {
        type: 'boolean',
        default: false,
        description: 'Use regex for search'
      },
      all: {
        type: 'boolean',
        default: false,
        description: 'Replace all occurrences'
      },
      backup: {
        type: 'boolean',
        default: true,
        description: 'Create backup before editing'
      },
      runAfter: {
        type: 'boolean',
        description: 'Run the script after the edit completes successfully'
      }
    }
  }
};

export class AhkEditTool {
  private runTool: AhkRunTool;

  constructor() {
    this.runTool = new AhkRunTool();
  }
  /**
   * Perform replace operation
   */
  private replace(content: string, search: string, replacement: string, useRegex: boolean, all: boolean): string {
    if (useRegex) {
      const regex = new RegExp(search, all ? 'g' : '');
      return content.replace(regex, replacement);
    } else {
      if (all) {
        return content.split(search).join(replacement);
      } else {
        const index = content.indexOf(search);
        if (index === -1) {
          throw new Error(`Text not found: "${search}"`);
        }
        return content.substring(0, index) + replacement + content.substring(index + search.length);
      }
    }
  }

  /**
   * Insert content at a specific line
   */
  private insertAtLine(content: string, lineNum: number, newContent: string): string {
    const lines = content.split('\n');
    
    // Convert to 0-based index
    const index = lineNum - 1;
    
    if (index < 0 || index > lines.length) {
      throw new Error(`Line number ${lineNum} is out of range (1-${lines.length + 1})`);
    }
    
    // Insert the new content
    lines.splice(index, 0, newContent);
    
    return lines.join('\n');
  }

  /**
   * Delete lines or content
   */
  private deleteLines(content: string, startLine: number, endLine?: number): string {
    const lines = content.split('\n');
    
    // Convert to 0-based index
    const start = startLine - 1;
    const end = endLine ? endLine - 1 : start;
    
    if (start < 0 || start >= lines.length) {
      throw new Error(`Start line ${startLine} is out of range (1-${lines.length})`);
    }
    
    if (end < start || end >= lines.length) {
      throw new Error(`End line ${endLine} is out of range (${startLine}-${lines.length})`);
    }
    
    // Remove the lines
    lines.splice(start, end - start + 1);
    
    return lines.join('\n');
  }

  /**
   * Append content to the end of file
   */
  private append(content: string, newContent: string): string {
    if (content && !content.endsWith('\n')) {
      content += '\n';
    }
    return content + newContent;
  }

  /**
   * Prepend content to the beginning of file
   */
  private prepend(content: string, newContent: string): string {
    if (newContent && !newContent.endsWith('\n')) {
      newContent += '\n';
    }
    return newContent + content;
  }

  /**
   * Execute the edit tool
   */
  async execute(args: z.infer<typeof AhkEditArgsSchema>): Promise<any> {
    let validatedArgs: z.infer<typeof AhkEditArgsSchema> | undefined;
    
    try {
      // Check if tool is enabled
      const availability = checkToolAvailability('AHK_File_Edit');
      if (!availability.enabled) {
        return {
          content: [{ type: 'text', text: availability.message || 'Tool is disabled' }]
        };
      }
      
      validatedArgs = AhkEditArgsSchema.parse(args);
      const { action, search, content, line, startLine, endLine, filePath, regex, all, backup, runAfter } = validatedArgs;
      const shouldRunAfterEdit = typeof runAfter === 'boolean' ? runAfter : toolSettings.shouldAutoRunAfterEdit();
      
      // Get the target file
      const targetFile = filePath || activeFile.getActiveFile();
      if (!targetFile) {
        throw new Error('No file specified and no active file set. Use AHK_File_Active to set an active file first.');
      }

      // Ensure it's an .ahk file
      if (!targetFile.toLowerCase().endsWith('.ahk')) {
        throw new Error('Can only edit .ahk files');
      }

      // Read the current content
      let currentContent: string;
      try {
        currentContent = await fs.readFile(targetFile, 'utf-8');
      } catch (error) {
        throw new Error(`Failed to read file: ${targetFile}`);
      }

      // Perform the edit operation
      let newContent: string;
      let operationSummary: string;
      
      switch (action) {
        case 'replace':
          if (!search) {
            throw new Error('Search text is required for replace action');
          }
          if (content === undefined) {
            throw new Error('Content is required for replace action');
          }
          newContent = this.replace(currentContent, search, content, regex, all);
          operationSummary = `Replaced ${all ? 'all occurrences of' : 'first occurrence of'} "${search}" with "${content}"`;
          break;
          
        case 'insert':
          if (!line) {
            throw new Error('Line number is required for insert action');
          }
          if (content === undefined) {
            throw new Error('Content is required for insert action');
          }
          newContent = this.insertAtLine(currentContent, line, content);
          operationSummary = `Inserted content at line ${line}`;
          break;
          
        case 'delete':
          if (search) {
            // Delete by search
            newContent = this.replace(currentContent, search, '', regex, all);
            operationSummary = `Deleted ${all ? 'all occurrences of' : 'first occurrence of'} "${search}"`;
          } else if (line || startLine) {
            // Delete by line
            const start = line || startLine!;
            const end = endLine || start;
            newContent = this.deleteLines(currentContent, start, end);
            operationSummary = `Deleted line${start === end ? '' : 's'} ${start}${start === end ? '' : `-${end}`}`;
          } else {
            throw new Error('Either search text or line number is required for delete action');
          }
          break;
          
        case 'append':
          if (content === undefined) {
            throw new Error('Content is required for append action');
          }
          newContent = this.append(currentContent, content);
          operationSummary = `Appended content to end of file`;
          break;
          
        case 'prepend':
          if (content === undefined) {
            throw new Error('Content is required for prepend action');
          }
          newContent = this.prepend(currentContent, content);
          operationSummary = `Prepended content to beginning of file`;
          break;
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Create backup if requested
      if (backup) {
        const backupPath = targetFile + '.bak';
        await fs.writeFile(backupPath, currentContent, 'utf-8');
        logger.info(`Backup created: ${backupPath}`);
      }

      // Write the new content
      await fs.writeFile(targetFile, newContent, 'utf-8');
      
      // Update active file to ensure it's current
      activeFile.setActiveFile(targetFile);

      // Generate response
      let response = `✅ **Edit Successful**\n\n`;
      response += `📄 **File:** ${targetFile}\n`;
      response += `⚙️ **Operation:** ${operationSummary}\n`;
      
      // Show statistics
      const oldLines = currentContent.split('\n').length;
      const newLines = newContent.split('\n').length;
      const linesDiff = newLines - oldLines;
      
      response += `\n**Statistics:**\n`;
      response += `- Lines before: ${oldLines}\n`;
      response += `- Lines after: ${newLines}\n`;
      if (linesDiff > 0) {
        response += `- Lines added: ${linesDiff}\n`;
      } else if (linesDiff < 0) {
        response += `- Lines removed: ${Math.abs(linesDiff)}\n`;
      }
      
      if (backup) {
        response += `\n💾 Backup saved as: ${path.basename(targetFile)}.bak`;
      }

      if (shouldRunAfterEdit) {
        response += '\n\n🚀 **Run Result:**\n';
        try {
          const runResult = await this.runTool.execute({
            mode: 'run',
            filePath: targetFile,
            wait: true,
            runner: 'native',
            scriptArgs: [],
            timeout: 30000,
            killOnExit: true,
            detectWindow: false
          } as any);

          if (runResult?.content?.length) {
            const runText = runResult.content
              .filter((item: any) => item.type === 'text')
              .map((item: any) => item.text)
              .join('\n');
            response += runText || 'Script executed.';
          } else {
            response += 'Script executed.';
          }
        } catch (runError) {
          response += `⚠️ Failed to run script: ${runError instanceof Error ? runError.message : String(runError)}`;
        }
      }

      return {
        content: [{
          type: 'text',
          text: response
        }]
      };
      
    } catch (error) {
      logger.error('Error in AHK_File_Edit tool:', error);
      
      // Check if we should create an alpha version due to failures
      const targetFile = validatedArgs?.filePath || activeFile.getActiveFile();
      if (targetFile) {
        const alphaCreated = await handleEditFailure(targetFile, error as Error);
        if (alphaCreated) {
          return {
            content: [{
              type: 'text',
              text: `⚠️ Edit failed. Alpha version created and set as active.\n\nOriginal error: ${error instanceof Error ? error.message : String(error)}\n\nYou can now retry the edit on the alpha version.`
            }]
          };
        }
      }
      
      return {
        content: [{
          type: 'text',
          text: `❌ Error: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
}

/**
 * Helper function to create edit commands
 */
export class EditBuilder {
  private edits: Array<Partial<z.infer<typeof AhkEditArgsSchema>>> = [];
  
  replace(search: string, content: string, all = false): this {
    this.edits.push({ action: 'replace', search, content, all, regex: false, backup: true });
    return this;
  }
  
  insert(line: number, content: string): this {
    this.edits.push({ action: 'insert', line, content, regex: false, all: false, backup: true });
    return this;
  }
  
  delete(searchOrLine: string | number, endLine?: number): this {
    if (typeof searchOrLine === 'string') {
      this.edits.push({ action: 'delete', search: searchOrLine, regex: false, all: false, backup: true });
    } else {
      this.edits.push({ action: 'delete', startLine: searchOrLine, endLine, regex: false, all: false, backup: true });
    }
    return this;
  }
  
  append(content: string): this {
    this.edits.push({ action: 'append', content, regex: false, all: false, backup: true });
    return this;
  }
  
  prepend(content: string): this {
    this.edits.push({ action: 'prepend', content, regex: false, all: false, backup: true });
    return this;
  }
  
  getEdits(): Array<Partial<z.infer<typeof AhkEditArgsSchema>>> {
    return this.edits;
  }
}
