import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { getActiveFilePath } from '../core/active-file.js';
import { resolveFilePath } from '../core/config.js';
import { AhkCompiler } from '../compiler/ahk-compiler.js';
import logger from '../logger.js';

export const AhkFileViewArgsSchema = z.object({
  file: z.string().optional().describe('Path to AutoHotkey file to view (defaults to active file)'),
  mode: z.enum(['structured', 'raw', 'summary', 'outline']).default('structured').describe('View mode'),
  lineStart: z.number().min(1).optional().describe('Starting line number (1-based)'),
  lineEnd: z.number().min(1).optional().describe('Ending line number (1-based)'),
  maxLines: z.number().min(1).max(1000).default(100).describe('Maximum lines to display'),
  showLineNumbers: z.boolean().default(true).describe('Show line numbers'),
  showMetadata: z.boolean().default(true).describe('Show file metadata'),
  highlightSyntax: z.boolean().default(true).describe('Apply syntax highlighting'),
  showStructure: z.boolean().default(true).describe('Show code structure info')
});

export const ahkFileViewToolDefinition = {
  name: 'ahk_file_view',
  description: `📖 AutoHotkey File Viewer (File Chain)

Premier file viewing tool in the ahk-file-* chain. Provides structured, intelligent viewing of AutoHotkey files with multiple display modes.

**Modes:**
- \`structured\`: Formatted view with line numbers, syntax highlighting, and metadata
- \`raw\`: Plain text content without formatting
- \`summary\`: File overview with statistics and structure
- \`outline\`: Code structure breakdown (classes, functions, hotkeys)

**Features:**
- Automatic syntax highlighting for AutoHotkey v2
- File metadata (size, modified date, encoding)
- Code structure analysis (classes, functions, hotkeys)
- Line range selection for large files
- Integration with active file context

Part of the **ahk-file-*** tool chain for file operations.`,
  inputSchema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        description: 'Path to AutoHotkey file to view (defaults to active file)'
      },
      mode: {
        type: 'string',
        enum: ['structured', 'raw', 'summary', 'outline'],
        description: 'View mode',
        default: 'structured'
      },
      lineStart: {
        type: 'number',
        minimum: 1,
        description: 'Starting line number (1-based)'
      },
      lineEnd: {
        type: 'number',
        minimum: 1,
        description: 'Ending line number (1-based)'
      },
      maxLines: {
        type: 'number',
        minimum: 1,
        maximum: 1000,
        description: 'Maximum lines to display',
        default: 100
      },
      showLineNumbers: {
        type: 'boolean',
        description: 'Show line numbers',
        default: true
      },
      showMetadata: {
        type: 'boolean',
        description: 'Show file metadata',
        default: true
      },
      highlightSyntax: {
        type: 'boolean',
        description: 'Apply syntax highlighting',
        default: true
      },
      showStructure: {
        type: 'boolean',
        description: 'Show code structure info',
        default: true
      }
    }
  }
};

interface FileMetadata {
  path: string;
  name: string;
  size: number;
  sizeFormatted: string;
  modified: Date;
  modifiedFormatted: string;
  lines: number;
  encoding: string;
  extension: string;
}

interface CodeStructure {
  classes: Array<{ name: string; line: number; methods: number }>;
  functions: Array<{ name: string; line: number; params: string }>;
  hotkeys: Array<{ key: string; line: number; description?: string }>;
  variables: Array<{ name: string; line: number; scope: string }>;
  comments: number;
  complexity: number;
}

interface ViewResult {
  metadata: FileMetadata;
  structure?: CodeStructure;
  content: string;
  displayInfo: {
    mode: string;
    linesShown: number;
    totalLines: number;
    truncated: boolean;
    range?: { start: number; end: number };
  };
}

export class AhkFileViewTool {
  async execute(args: z.infer<typeof AhkFileViewArgsSchema>) {
    try {
      const validatedArgs = AhkFileViewArgsSchema.parse(args);
      const { file, mode } = validatedArgs;

      logger.info(`Viewing AutoHotkey file in ${mode} mode`);

      // Resolve file path
      const filePath = await this.resolveTargetFile(file);

      // Generate view result
      const result = await this.generateView(filePath, validatedArgs);

      // Format output based on mode
      const output = this.formatOutput(result, validatedArgs);

      return {
        content: [{ type: 'text', text: output }]
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('AHK file view failed:', error);

      return {
        content: [{
          type: 'text',
          text: `❌ **File View Error**\n\n${errorMessage}`
        }],
      };
    }
  }

  private async resolveTargetFile(file?: string): Promise<string> {
    if (file) {
      // User provided explicit file path
      const resolved = resolveFilePath(file);
      if (!resolved) {
        throw new Error(`File not found: ${file}`);
      }
      return resolved;
    }

    // Use active file
    const activeFile = getActiveFilePath();
    if (!activeFile) {
      throw new Error('No file specified and no active file set. Use ahk-file-active to set an active file.');
    }

    // Verify active file exists
    try {
      await fs.access(activeFile);
      return activeFile;
    } catch {
      throw new Error(`Active file not found: ${activeFile}`);
    }
  }

  private async generateView(filePath: string, args: z.infer<typeof AhkFileViewArgsSchema>): Promise<ViewResult> {
    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Generate metadata
    const metadata = await this.generateMetadata(filePath, content, lines);

    // Generate structure (if needed)
    let structure: CodeStructure | undefined;
    if (args.mode === 'summary' || args.mode === 'outline' || args.showStructure) {
      structure = await this.analyzeCodeStructure(content);
    }

    // Determine line range
    const { start, end, truncated } = this.calculateLineRange(
      lines.length,
      args.lineStart,
      args.lineEnd,
      args.maxLines
    );

    // Extract content for display
    const displayLines = lines.slice(start - 1, end);
    const displayContent = displayLines.join('\n');

    return {
      metadata,
      structure,
      content: displayContent,
      displayInfo: {
        mode: args.mode,
        linesShown: displayLines.length,
        totalLines: lines.length,
        truncated,
        range: { start, end: end - 1 }
      }
    };
  }

  private async generateMetadata(filePath: string, content: string, lines: string[]): Promise<FileMetadata> {
    const stats = await fs.stat(filePath);
    const sizeInBytes = stats.size;

    return {
      path: filePath,
      name: path.basename(filePath),
      size: sizeInBytes,
      sizeFormatted: this.formatFileSize(sizeInBytes),
      modified: stats.mtime,
      modifiedFormatted: this.formatDate(stats.mtime),
      lines: lines.length,
      encoding: 'UTF-8', // Assume UTF-8 for now
      extension: path.extname(filePath)
    };
  }

  private async analyzeCodeStructure(content: string): Promise<CodeStructure> {
    const lines = content.split('\n');
    const structure: CodeStructure = {
      classes: [],
      functions: [],
      hotkeys: [],
      variables: [],
      comments: 0,
      complexity: 1
    };

    // Use the compiler for better analysis
    try {
      const parseResult = AhkCompiler.parse(content);
      if (parseResult.success && parseResult.data) {
        // Extract structure from AST
        this.extractStructureFromAST(parseResult.data, structure);
      }
    } catch (error) {
      logger.warn('Failed to parse for structure, falling back to regex', error);
    }

    // Fallback: regex-based analysis
    if (structure.classes.length === 0 && structure.functions.length === 0) {
      this.extractStructureFromRegex(lines, structure);
    }

    return structure;
  }

  private extractStructureFromAST(ast: any, structure: CodeStructure): void {
    if (!ast.body) return;

    for (const statement of ast.body) {
      switch (statement.type) {
        case 'ClassDeclaration':
          structure.classes.push({
            name: statement.name || 'Unknown',
            line: (statement.line || 0) + 1,
            methods: statement.methods?.length || 0
          });
          structure.complexity += 2;
          break;

        case 'FunctionDeclaration':
          structure.functions.push({
            name: statement.name || 'Unknown',
            line: (statement.line || 0) + 1,
            params: statement.params?.map((p: any) => p.name).join(', ') || ''
          });
          structure.complexity += 1;
          break;

        case 'HotkeyStatement':
          structure.hotkeys.push({
            key: statement.key || 'Unknown',
            line: (statement.line || 0) + 1,
            description: statement.description
          });
          structure.complexity += 1;
          break;
      }
    }
  }

  private extractStructureFromRegex(lines: string[], structure: CodeStructure): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // Comments
      if (line.startsWith(';')) {
        structure.comments++;
        continue;
      }

      // Classes
      const classMatch = line.match(/^class\s+(\w+)/i);
      if (classMatch) {
        structure.classes.push({
          name: classMatch[1],
          line: lineNum,
          methods: 0
        });
        continue;
      }

      // Functions
      const functionMatch = line.match(/^(\w+)\s*\([^)]*\)\s*\{?/);
      if (functionMatch && !line.includes('=') && !line.includes(':=')) {
        structure.functions.push({
          name: functionMatch[1],
          line: lineNum,
          params: ''
        });
        continue;
      }

      // Hotkeys
      const hotkeyMatch = line.match(/^([^:]+)::/);
      if (hotkeyMatch) {
        structure.hotkeys.push({
          key: hotkeyMatch[1],
          line: lineNum
        });
        continue;
      }

      // Variables (basic detection)
      const varMatch = line.match(/^(\w+)\s*:=/);
      if (varMatch) {
        structure.variables.push({
          name: varMatch[1],
          line: lineNum,
          scope: 'local'
        });
      }
    }

    structure.complexity = Math.max(1, structure.classes.length * 2 + structure.functions.length + structure.hotkeys.length);
  }

  private calculateLineRange(totalLines: number, start?: number, end?: number, maxLines?: number): {
    start: number;
    end: number;
    truncated: boolean;
  } {
    let displayStart = start || 1;
    let displayEnd = end || totalLines;

    // Apply max lines limit
    if (maxLines && (displayEnd - displayStart + 1) > maxLines) {
      displayEnd = displayStart + maxLines - 1;
    }

    // Ensure we don't exceed file bounds
    displayStart = Math.max(1, displayStart);
    displayEnd = Math.min(totalLines, displayEnd);

    const truncated = displayEnd < totalLines || displayStart > 1;

    return {
      start: displayStart,
      end: displayEnd + 1, // +1 for slice() end parameter
      truncated
    };
  }

  private formatOutput(result: ViewResult, args: z.infer<typeof AhkFileViewArgsSchema>): string {
    const { metadata, structure, content, displayInfo } = result;

    switch (args.mode) {
      case 'raw':
        return this.formatRawMode(content);
      case 'summary':
        return this.formatSummaryMode(metadata, structure!, displayInfo);
      case 'outline':
        return this.formatOutlineMode(metadata, structure!, displayInfo);
      case 'structured':
      default:
        return this.formatStructuredMode(metadata, structure, content, displayInfo, args);
    }
  }

  private formatRawMode(content: string): string {
    return content;
  }

  private formatSummaryMode(metadata: FileMetadata, structure: CodeStructure, displayInfo: any): string {
    let output = `📄 **File Summary: ${metadata.name}**\n\n`;

    // File info
    output += `📊 **File Information**\n`;
    output += `- **Path**: ${metadata.path}\n`;
    output += `- **Size**: ${metadata.sizeFormatted} (${metadata.lines} lines)\n`;
    output += `- **Modified**: ${metadata.modifiedFormatted}\n`;
    output += `- **Encoding**: ${metadata.encoding}\n\n`;

    // Structure summary
    output += `🏗️ **Code Structure**\n`;
    output += `- **Classes**: ${structure.classes.length}\n`;
    output += `- **Functions**: ${structure.functions.length}\n`;
    output += `- **Hotkeys**: ${structure.hotkeys.length}\n`;
    output += `- **Variables**: ${structure.variables.length}\n`;
    output += `- **Comments**: ${structure.comments}\n`;
    output += `- **Complexity**: ${structure.complexity}\n\n`;

    // Quick highlights
    if (structure.classes.length > 0) {
      output += `**Classes**: ${structure.classes.map(c => c.name).join(', ')}\n`;
    }
    if (structure.functions.length > 0) {
      output += `**Functions**: ${structure.functions.slice(0, 5).map(f => f.name).join(', ')}`;
      if (structure.functions.length > 5) output += ` (and ${structure.functions.length - 5} more)`;
      output += '\n';
    }

    return output;
  }

  private formatOutlineMode(metadata: FileMetadata, structure: CodeStructure, displayInfo: any): string {
    let output = `📋 **Code Outline: ${metadata.name}**\n\n`;

    if (structure.classes.length > 0) {
      output += `## 🏛️ Classes (${structure.classes.length})\n\n`;
      structure.classes.forEach(cls => {
        output += `**${cls.name}** (line ${cls.line})\n`;
        if (cls.methods > 0) output += `  └─ ${cls.methods} methods\n`;
      });
      output += '\n';
    }

    if (structure.functions.length > 0) {
      output += `## ⚙️ Functions (${structure.functions.length})\n\n`;
      structure.functions.forEach(func => {
        output += `**${func.name}**(${func.params}) (line ${func.line})\n`;
      });
      output += '\n';
    }

    if (structure.hotkeys.length > 0) {
      output += `## ⌨️ Hotkeys (${structure.hotkeys.length})\n\n`;
      structure.hotkeys.forEach(hk => {
        output += `**${hk.key}** (line ${hk.line})\n`;
        if (hk.description) output += `  └─ ${hk.description}\n`;
      });
      output += '\n';
    }

    if (structure.variables.length > 0) {
      output += `## 📦 Variables (${structure.variables.length})\n\n`;
      structure.variables.slice(0, 10).forEach(variable => {
        output += `**${variable.name}** (${variable.scope}, line ${variable.line})\n`;
      });
      if (structure.variables.length > 10) {
        output += `... and ${structure.variables.length - 10} more\n`;
      }
    }

    return output;
  }

  private formatStructuredMode(
    metadata: FileMetadata,
    structure: CodeStructure | undefined,
    content: string,
    displayInfo: any,
    args: z.infer<typeof AhkFileViewArgsSchema>
  ): string {
    let output = '';

    // Header with metadata
    if (args.showMetadata) {
      output += `📄 **${metadata.name}** `;
      if (displayInfo.range) {
        output += `(Lines ${displayInfo.range.start}-${displayInfo.range.end} of ${displayInfo.totalLines})`;
      }
      output += '\n';

      output += `📊 **${metadata.sizeFormatted}** • Modified ${metadata.modifiedFormatted}`;

      if (args.showStructure && structure) {
        const structureParts: string[] = [];
        if (structure.classes.length > 0) structureParts.push(`${structure.classes.length} class${structure.classes.length > 1 ? 'es' : ''}`);
        if (structure.functions.length > 0) structureParts.push(`${structure.functions.length} function${structure.functions.length > 1 ? 's' : ''}`);
        if (structure.hotkeys.length > 0) structureParts.push(`${structure.hotkeys.length} hotkey${structure.hotkeys.length > 1 ? 's' : ''}`);

        if (structureParts.length > 0) {
          output += ` • ${structureParts.join(', ')}`;
        }
      }
      output += '\n\n';
    }

    // Content with optional line numbers and syntax highlighting
    if (args.highlightSyntax) {
      output += '```autohotkey\n';
    }

    const lines = content.split('\n');
    const startLineNumber = displayInfo.range?.start || 1;

    lines.forEach((line, index) => {
      if (args.showLineNumbers) {
        const lineNum = startLineNumber + index;
        output += `${lineNum.toString().padStart(3)} │ ${line}\n`;
      } else {
        output += `${line}\n`;
      }
    });

    if (args.highlightSyntax) {
      output += '```\n';
    }

    // Truncation notice
    if (displayInfo.truncated) {
      output += '\n📄 *File truncated for display. Use lineStart/lineEnd or increase maxLines to see more.*\n';
    }

    return output;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }
}