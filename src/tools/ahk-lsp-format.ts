import { z } from 'zod';
import logger from '../logger.js';
import { safeParse } from '../core/validation-middleware.js';
import { createTextResponse, createErrorResponse, type McpToolResponse } from '../types/mcp-types.js';

// Zod schema for input validation
export const AhkLspFormatArgsSchema = z.object({
  code: z.string().min(1, 'AutoHotkey code is required'),
  options: z.object({
    indentSize: z.number().min(1).max(8).default(2).describe('Number of spaces per indent level'),
    useTabs: z.boolean().default(false).describe('Use tabs instead of spaces'),
    maxLineLength: z.number().min(40).max(200).default(120).describe('Maximum line length before wrapping'),
    trimTrailingWhitespace: z.boolean().default(true).describe('Remove trailing whitespace'),
    insertFinalNewline: z.boolean().default(true).describe('Ensure file ends with newline'),
    spacesAroundOperators: z.boolean().default(true).describe('Add spaces around operators (:=, +, -, etc.)'),
    spaceAfterComma: z.boolean().default(true).describe('Add space after commas in parameter lists'),
    alignAssignments: z.boolean().default(false).describe('Align consecutive assignment operators'),
    braceStyle: z.enum(['k&r', 'allman', 'compact']).default('k&r').describe('Brace placement style')
  }).default({})
});

export type AhkLspFormatArgs = z.infer<typeof AhkLspFormatArgsSchema>;

// Tool definition
export const ahkLspFormatToolDefinition = {
  name: 'AHK_LSP_Format',
  description: `Format AHK v2 code. Options: indentSize, useTabs, braceStyle (k&r/allman/compact), alignAssignments.`,
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'AutoHotkey v2 code to format'
      },
      options: {
        type: 'object',
        properties: {
          indentSize: {
            type: 'number',
            description: 'Number of spaces per indent level (1-8)',
            default: 2,
            minimum: 1,
            maximum: 8
          },
          useTabs: {
            type: 'boolean',
            description: 'Use tabs instead of spaces for indentation',
            default: false
          },
          maxLineLength: {
            type: 'number',
            description: 'Maximum line length before wrapping (40-200)',
            default: 120,
            minimum: 40,
            maximum: 200
          },
          trimTrailingWhitespace: {
            type: 'boolean',
            description: 'Remove trailing whitespace from lines',
            default: true
          },
          insertFinalNewline: {
            type: 'boolean',
            description: 'Ensure file ends with a newline',
            default: true
          },
          spacesAroundOperators: {
            type: 'boolean',
            description: 'Add spaces around operators (:=, +, -, etc.)',
            default: true
          },
          spaceAfterComma: {
            type: 'boolean',
            description: 'Add space after commas in parameter lists',
            default: true
          },
          alignAssignments: {
            type: 'boolean',
            description: 'Align consecutive assignment operators',
            default: false
          },
          braceStyle: {
            type: 'string',
            enum: ['k&r', 'allman', 'compact'],
            description: 'Brace placement style: k&r (same line), allman (new line), compact (minimal spacing)',
            default: 'k&r'
          }
        }
      }
    },
    required: ['code']
  }
};

/**
 * AHK LSP Format Tool
 * Formats AutoHotkey v2 code according to style rules
 */
export class AhkLspFormatTool {
  async execute(args: unknown): Promise<McpToolResponse> {
    try {
      const startTime = Date.now();

      // Validate input
      const validation = safeParse(args, AhkLspFormatArgsSchema, 'AHK_LSP_Format');
      if (!validation.success) {
        return validation.error;
      }

      const { code, options = {} } = validation.data;

      // Apply default options
      const formatOptions = {
        indentSize: options.indentSize ?? 2,
        useTabs: options.useTabs ?? false,
        maxLineLength: options.maxLineLength ?? 120,
        trimTrailingWhitespace: options.trimTrailingWhitespace ?? true,
        insertFinalNewline: options.insertFinalNewline ?? true,
        spacesAroundOperators: options.spacesAroundOperators ?? true,
        spaceAfterComma: options.spaceAfterComma ?? true,
        alignAssignments: options.alignAssignments ?? false,
        braceStyle: options.braceStyle ?? 'k&r'
      };

      logger.debug(`Formatting code with options:`, formatOptions);

      // Format the code
      let formatted = code;

      // 1. Normalize line endings
      formatted = formatted.replace(/\r\n/g, '\n');

      // 2. Trim trailing whitespace if requested
      if (formatOptions.trimTrailingWhitespace) {
        formatted = this.trimTrailingWhitespace(formatted);
      }

      // 3. Fix indentation
      formatted = this.fixIndentation(formatted, formatOptions);

      // 4. Fix spacing around operators
      if (formatOptions.spacesAroundOperators) {
        formatted = this.fixOperatorSpacing(formatted);
      }

      // 5. Fix spacing after commas
      if (formatOptions.spaceAfterComma) {
        formatted = this.fixCommaSpacing(formatted);
      }

      // 6. Apply brace style
      formatted = this.applyBraceStyle(formatted, formatOptions.braceStyle);

      // 7. Align assignments if requested
      if (formatOptions.alignAssignments) {
        formatted = this.alignAssignments(formatted);
      }

      // 8. Ensure final newline if requested
      if (formatOptions.insertFinalNewline && !formatted.endsWith('\n')) {
        formatted += '\n';
      }

      // Calculate statistics
      const originalLines = code.split('\n').length;
      const formattedLines = formatted.split('\n').length;
      const changeCount = this.countChanges(code, formatted);

      const duration = Date.now() - startTime;

      return createTextResponse(JSON.stringify({
        formatted: formatted,
        statistics: {
          originalLines,
          formattedLines,
          changeCount,
          formatTime: duration
        },
        optionsUsed: formatOptions
      }, null, 2));

    } catch (error) {
      logger.error('Error in AHK_LSP_Format:', error);
      return createErrorResponse(error, 'AHK_LSP_Format');
    }
  }

  /**
   * Trim trailing whitespace from all lines
   */
  private trimTrailingWhitespace(code: string): string {
    return code.split('\n').map(line => line.replace(/\s+$/, '')).join('\n');
  }

  /**
   * Fix indentation according to options
   */
  private fixIndentation(code: string, options: any): string {
    const lines = code.split('\n');
    const indentChar = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
    let indentLevel = 0;
    const formatted: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith(';')) {
        formatted.push(line);
        continue;
      }

      // Decrease indent for closing braces
      if (line.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Apply indentation
      const indented = indentLevel > 0 ? indentChar.repeat(indentLevel) + line : line;
      formatted.push(indented);

      // Increase indent for opening braces
      if (line.endsWith('{')) {
        indentLevel++;
      }
      // Decrease indent after closing brace if it's not the start of line
      else if (line.includes('}') && !line.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
    }

    return formatted.join('\n');
  }

  /**
   * Fix spacing around operators
   */
  private fixOperatorSpacing(code: string): string {
    const lines = code.split('\n');
    const formatted: string[] = [];

    for (const line of lines) {
      // Skip comments
      if (line.trim().startsWith(';')) {
        formatted.push(line);
        continue;
      }

      let fixed = line;

      // Assignment operators
      fixed = fixed.replace(/\s*:=\s*/g, ' := ');
      fixed = fixed.replace(/\s*\+=\s*/g, ' += ');
      fixed = fixed.replace(/\s*-=\s*/g, ' -= ');
      fixed = fixed.replace(/\s*\*=\s*/g, ' *= ');
      fixed = fixed.replace(/\s*\/=\s*/g, ' /= ');
      fixed = fixed.replace(/\s*\.=\s*/g, ' .= ');

      // Comparison operators
      fixed = fixed.replace(/\s*==\s*/g, ' == ');
      fixed = fixed.replace(/\s*!=\s*/g, ' != ');
      fixed = fixed.replace(/\s*<=\s*/g, ' <= ');
      fixed = fixed.replace(/\s*>=\s*/g, ' >= ');

      // Arithmetic operators (but not in function calls or negative numbers)
      fixed = fixed.replace(/(\w)\s*\+\s*(\w)/g, '$1 + $2');
      fixed = fixed.replace(/(\w)\s*-\s*(\w)/g, '$1 - $2');
      fixed = fixed.replace(/(\w)\s*\*\s*(\w)/g, '$1 * $2');
      fixed = fixed.replace(/(\w)\s*\/\s*(\w)/g, '$1 / $2');

      // Logical operators
      fixed = fixed.replace(/\s*&&\s*/g, ' && ');
      fixed = fixed.replace(/\s*\|\|\s*/g, ' || ');

      formatted.push(fixed);
    }

    return formatted.join('\n');
  }

  /**
   * Fix spacing after commas
   */
  private fixCommaSpacing(code: string): string {
    const lines = code.split('\n');
    const formatted: string[] = [];

    for (const line of lines) {
      // Skip comments
      if (line.trim().startsWith(';')) {
        formatted.push(line);
        continue;
      }

      // Add space after comma if not already present
      let fixed = line.replace(/,(\S)/g, ', $1');

      // Remove multiple spaces after comma
      fixed = fixed.replace(/,\s{2,}/g, ', ');

      formatted.push(fixed);
    }

    return formatted.join('\n');
  }

  /**
   * Apply brace style
   */
  private applyBraceStyle(code: string, style: string): string {
    const lines = code.split('\n');
    const formatted: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith(';')) {
        formatted.push(line);
        continue;
      }

      if (style === 'allman') {
        // Opening brace on new line
        if (trimmed.endsWith('{')) {
          const withoutBrace = line.replace(/\s*{\s*$/, '');
          formatted.push(withoutBrace);
          // Add brace on next line with same indentation
          const indent = line.match(/^\s*/)?.[0] || '';
          formatted.push(indent + '{');
        } else {
          formatted.push(line);
        }
      } else if (style === 'compact') {
        // Minimize spacing
        if (trimmed.endsWith('{')) {
          const compact = line.replace(/\s+{/, ' {');
          formatted.push(compact);
        } else {
          formatted.push(line);
        }
      } else {
        // K&R style (opening brace on same line) - default
        formatted.push(line);
      }
    }

    return formatted.join('\n');
  }

  /**
   * Align consecutive assignment operators
   */
  private alignAssignments(code: string): string {
    const lines = code.split('\n');
    const formatted: string[] = [];
    let assignmentBlock: { line: string; index: number; indent: string }[] = [];

    const flushBlock = () => {
      if (assignmentBlock.length > 1) {
        // Find max position of := operator
        const maxPos = Math.max(...assignmentBlock.map(a => a.index));

        // Align all assignments
        for (const assignment of assignmentBlock) {
          const before = assignment.line.substring(0, assignment.index);
          const after = assignment.line.substring(assignment.index);
          const spacesToAdd = maxPos - assignment.index;
          const aligned = before + ' '.repeat(spacesToAdd) + after;
          formatted.push(aligned);
        }
      } else if (assignmentBlock.length === 1) {
        formatted.push(assignmentBlock[0].line);
      }
      assignmentBlock = [];
    };

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith(';')) {
        flushBlock();
        formatted.push(line);
        continue;
      }

      // Check if line contains assignment
      const assignmentMatch = line.match(/^(\s*)([^:]+)(:=)/);
      if (assignmentMatch) {
        const indent = assignmentMatch[1];
        const index = assignmentMatch[0].length - 2; // Position of :=

        // Check if same indent level as previous assignments
        if (assignmentBlock.length === 0 || assignmentBlock[0].indent === indent) {
          assignmentBlock.push({ line, index, indent });
        } else {
          flushBlock();
          assignmentBlock.push({ line, index, indent });
        }
      } else {
        flushBlock();
        formatted.push(line);
      }
    }

    flushBlock();

    return formatted.join('\n');
  }

  /**
   * Count number of changes between original and formatted code
   */
  private countChanges(original: string, formatted: string): number {
    const originalLines = original.split('\n');
    const formattedLines = formatted.split('\n');
    let changes = 0;

    const maxLines = Math.max(originalLines.length, formattedLines.length);
    for (let i = 0; i < maxLines; i++) {
      if (originalLines[i] !== formattedLines[i]) {
        changes++;
      }
    }

    return changes;
  }
}
