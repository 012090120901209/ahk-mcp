import { z } from 'zod';
import { AhkParser } from '../core/parser.js';
import type {
  AhkFunction,
  AhkClass,
  AhkVariable,
  AhkMethod
} from '../types/ahk-ast.js';
import logger from '../logger.js';
import { safeParse } from '../core/validation-middleware.js';
import { createTextResponse, createErrorResponse, type McpToolResponse } from '../types/mcp-types.js';

// Zod schema for input validation
export const AhkLspHoverArgsSchema = z.object({
  code: z.string().min(1, 'AutoHotkey code is required'),
  line: z.number().min(0, 'Line number must be 0 or greater').describe('Line number (0-indexed)'),
  character: z.number().min(0, 'Character position must be 0 or greater').describe('Character position in line (0-indexed)'),
  includeExamples: z.boolean().default(false).describe('Include usage examples in documentation')
});

export type AhkLspHoverArgs = z.infer<typeof AhkLspHoverArgsSchema>;

// Hover information structure
export interface HoverInfo {
  contents: string;
  range?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

// Tool definition
export const ahkLspHoverToolDefinition = {
  name: 'AHK_LSP_Hover',
  description: `Get documentation for symbol at cursor position. Returns signatures, types, and scope info.`,
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'AutoHotkey v2 code to analyze'
      },
      line: {
        type: 'number',
        description: 'Line number where cursor is positioned (0-indexed)',
        minimum: 0
      },
      character: {
        type: 'number',
        description: 'Character position in the line (0-indexed)',
        minimum: 0
      },
      includeExamples: {
        type: 'boolean',
        description: 'Include usage examples in documentation',
        default: false
      }
    },
    required: ['code', 'line', 'character']
  }
};

/**
 * AHK LSP Hover Tool
 * Provides hover documentation for symbols at specific positions
 */
export class AhkLspHoverTool {
  async execute(args: unknown): Promise<McpToolResponse> {
    try {
      const startTime = Date.now();

      // Validate input
      const validation = safeParse(args, AhkLspHoverArgsSchema, 'AHK_LSP_Hover');
      if (!validation.success) {
        return validation.error;
      }

      const { code, line, character, includeExamples = false } = validation.data;

      // Parse the code
      const parser = new AhkParser(code);
      const parseResult = parser.parse();

      // Get word at position
      const lines = code.split('\n');
      if (line >= lines.length) {
        return createTextResponse('No hover information: Line number out of range');
      }

      const currentLine = lines[line];
      if (character >= currentLine.length) {
        return createTextResponse('No hover information: Character position out of range');
      }

      // Extract word at cursor position
      const word = this.getWordAtPosition(currentLine, character);
      if (!word) {
        return createTextResponse('No hover information: No symbol at cursor position');
      }

      logger.debug(`Looking for hover info for symbol: "${word}" at line ${line}, char ${character}`);

      // Search for the symbol in parsed results
      const hoverInfo = this.findSymbolDocumentation(
        word,
        parseResult,
        includeExamples
      );

      if (!hoverInfo) {
        // Try to provide info for built-in AHK functions
        const builtInInfo = this.getBuiltInFunctionInfo(word, includeExamples);
        if (builtInInfo) {
          return createTextResponse(JSON.stringify({
            symbol: word,
            type: 'builtin',
            documentation: builtInInfo,
            range: this.getWordRange(currentLine, character, word)
          }, null, 2));
        }

        return createTextResponse(`No hover information found for symbol: "${word}"`);
      }

      const duration = Date.now() - startTime;

      return createTextResponse(JSON.stringify({
        symbol: word,
        ...hoverInfo,
        performance: {
          lookupTime: duration
        }
      }, null, 2));

    } catch (error) {
      logger.error('Error in AHK_LSP_Hover:', error);
      return createErrorResponse(error, 'AHK_LSP_Hover');
    }
  }

  /**
   * Extract word at cursor position
   */
  private getWordAtPosition(line: string, character: number): string | null {
    // Find word boundaries (alphanumeric and underscore)
    let start = character;
    let end = character;

    // Move start backward
    while (start > 0 && /\w/.test(line[start - 1])) {
      start--;
    }

    // Move end forward
    while (end < line.length && /\w/.test(line[end])) {
      end++;
    }

    const word = line.substring(start, end);
    return word.length > 0 ? word : null;
  }

  /**
   * Get range for word at position
   */
  private getWordRange(line: string, character: number, word: string): {
    start: { line: number; character: number };
    end: { line: number; character: number };
  } {
    let start = character;
    while (start > 0 && /\w/.test(line[start - 1])) {
      start--;
    }

    return {
      start: { line: 0, character: start },
      end: { line: 0, character: start + word.length }
    };
  }

  /**
   * Find documentation for a symbol
   */
  private findSymbolDocumentation(
    symbolName: string,
    parseResult: any,
    includeExamples: boolean
  ): any {
    // Check functions
    const func = parseResult.functions.find((f: AhkFunction) => f.name === symbolName);
    if (func) {
      return this.formatFunctionDoc(func, includeExamples);
    }

    // Check variables
    const variable = parseResult.variables.find((v: AhkVariable) => v.name === symbolName);
    if (variable) {
      return this.formatVariableDoc(variable);
    }

    // Check classes
    const cls = parseResult.classes.find((c: AhkClass) => c.name === symbolName);
    if (cls) {
      return this.formatClassDoc(cls, includeExamples);
    }

    // Check methods within classes
    for (const cls of parseResult.classes) {
      const method = cls.methods.find((m: AhkMethod) => m.name === symbolName);
      if (method) {
        return this.formatMethodDoc(method, cls.name, includeExamples);
      }
    }

    return null;
  }

  /**
   * Format function documentation
   */
  private formatFunctionDoc(func: AhkFunction, includeExamples: boolean): any {
    const params = func.parameters.map(p => {
      let paramStr = p.name;
      if (p.type) paramStr += `: ${p.type}`;
      if (p.isOptional) paramStr += ' (optional)';
      if (p.defaultValue) paramStr += ` = ${p.defaultValue}`;
      if (p.isVariadic) paramStr += ' (variadic)';
      return paramStr;
    });

    const signature = `${func.name}(${params.join(', ')})`;
    const returnInfo = func.returnType ? ` → ${func.returnType}` : '';

    let documentation = `**Function**\n\n\`\`\`ahk\n${signature}${returnInfo}\n\`\`\`\n\n`;

    if (func.parameters.length > 0) {
      documentation += '**Parameters:**\n';
      func.parameters.forEach(p => {
        documentation += `- \`${p.name}\``;
        if (p.type) documentation += ` (${p.type})`;
        if (p.isOptional) documentation += ' - Optional';
        if (p.defaultValue) documentation += ` - Default: ${p.defaultValue}`;
        documentation += '\n';
      });
      documentation += '\n';
    }

    if (func.visibility) {
      documentation += `**Visibility:** ${func.visibility}\n`;
    }

    if (func.isStatic) {
      documentation += `**Static:** Yes\n`;
    }

    if (includeExamples) {
      documentation += `\n**Usage Example:**\n\`\`\`ahk\nresult := ${func.name}(`;
      documentation += func.parameters.filter(p => !p.isOptional).map(p => p.name).join(', ');
      documentation += `)\n\`\`\``;
    }

    return {
      type: 'function',
      signature,
      documentation,
      line: func.line
    };
  }

  /**
   * Format variable documentation
   */
  private formatVariableDoc(variable: AhkVariable): any {
    let documentation = `**Variable**\n\n\`\`\`ahk\n${variable.name}`;
    if (variable.dataType) {
      documentation += `: ${variable.dataType}`;
    }
    documentation += `\n\`\`\`\n\n`;

    documentation += `**Scope:** ${variable.scope}\n`;

    if (variable.value !== undefined) {
      documentation += `**Initial Value:** \`${variable.value}\`\n`;
    }

    return {
      type: 'variable',
      signature: variable.name,
      documentation,
      scope: variable.scope,
      line: variable.line
    };
  }

  /**
   * Format class documentation
   */
  private formatClassDoc(cls: AhkClass, includeExamples: boolean): any {
    let documentation = `**Class**\n\n\`\`\`ahk\nclass ${cls.name}`;
    if (cls.extends) {
      documentation += ` extends ${cls.extends}`;
    }
    documentation += `\n\`\`\`\n\n`;

    if (cls.methods.length > 0) {
      documentation += `**Methods:** ${cls.methods.length}\n`;
      cls.methods.slice(0, 5).forEach(m => {
        documentation += `- ${m.name}()\n`;
      });
      if (cls.methods.length > 5) {
        documentation += `- ... and ${cls.methods.length - 5} more\n`;
      }
      documentation += '\n';
    }

    if (cls.properties.length > 0) {
      documentation += `**Properties:** ${cls.properties.length}\n`;
      cls.properties.slice(0, 5).forEach(p => {
        documentation += `- ${p.name}\n`;
      });
      if (cls.properties.length > 5) {
        documentation += `- ... and ${cls.properties.length - 5} more\n`;
      }
    }

    if (includeExamples) {
      documentation += `\n**Usage Example:**\n\`\`\`ahk\nobj := ${cls.name}()\n`;
      if (cls.methods.length > 0) {
        documentation += `obj.${cls.methods[0].name}()\n`;
      }
      documentation += `\`\`\``;
    }

    return {
      type: 'class',
      signature: `class ${cls.name}`,
      documentation,
      extends: cls.extends,
      line: cls.line
    };
  }

  /**
   * Format method documentation
   */
  private formatMethodDoc(method: AhkMethod, className: string, includeExamples: boolean): any {
    const params = method.parameters.map(p => {
      let paramStr = p.name;
      if (p.type) paramStr += `: ${p.type}`;
      if (p.isOptional) paramStr += ' (optional)';
      if (p.defaultValue) paramStr += ` = ${p.defaultValue}`;
      return paramStr;
    });

    const signature = `${method.name}(${params.join(', ')})`;
    const returnInfo = method.returnType ? ` → ${method.returnType}` : '';

    let documentation = `**Method** (in class ${className})\n\n\`\`\`ahk\n${signature}${returnInfo}\n\`\`\`\n\n`;

    if (method.parameters.length > 0) {
      documentation += '**Parameters:**\n';
      method.parameters.forEach(p => {
        documentation += `- \`${p.name}\``;
        if (p.type) documentation += ` (${p.type})`;
        if (p.isOptional) documentation += ' - Optional';
        if (p.defaultValue) documentation += ` - Default: ${p.defaultValue}`;
        documentation += '\n';
      });
      documentation += '\n';
    }

    if (method.isStatic) {
      documentation += `**Static:** Yes\n`;
    }

    if (method.visibility) {
      documentation += `**Visibility:** ${method.visibility}\n`;
    }

    if (includeExamples) {
      documentation += `\n**Usage Example:**\n\`\`\`ahk\nobj := ${className}()\n`;
      documentation += `obj.${method.name}(`;
      documentation += method.parameters.filter(p => !p.isOptional).map(p => p.name).join(', ');
      documentation += `)\n\`\`\``;
    }

    return {
      type: 'method',
      signature,
      documentation,
      className,
      line: method.line
    };
  }

  /**
   * Get documentation for built-in AHK v2 functions
   */
  private getBuiltInFunctionInfo(functionName: string, includeExamples: boolean): string | null {
    const builtIns: Record<string, { signature: string; description: string; example?: string }> = {
      'MsgBox': {
        signature: 'MsgBox([Text, Title, Options])',
        description: 'Displays a message box with optional text, title, and buttons.',
        example: 'MsgBox "Hello, World!", "Greeting"'
      },
      'Send': {
        signature: 'Send(Keys)',
        description: 'Sends simulated keystrokes to the active window.',
        example: 'Send "Hello{Enter}"'
      },
      'Sleep': {
        signature: 'Sleep(Delay)',
        description: 'Waits the specified amount of time before continuing (in milliseconds).',
        example: 'Sleep 1000  ; Wait 1 second'
      },
      'FileRead': {
        signature: 'FileRead(Filename [, Options])',
        description: 'Reads the contents of a file into a variable.',
        example: 'contents := FileRead("file.txt")'
      },
      'FileAppend': {
        signature: 'FileAppend(Text, Filename [, Options])',
        description: 'Appends text to the end of a file (creating it if necessary).',
        example: 'FileAppend "New line\\n", "file.txt"'
      },
      'Run': {
        signature: 'Run(Target [, WorkingDir, Options, &OutputVarPID])',
        description: 'Runs an external program or document.',
        example: 'Run "notepad.exe"'
      },
      'WinActivate': {
        signature: 'WinActivate([WinTitle, WinText, ExcludeTitle, ExcludeText])',
        description: 'Activates the specified window.',
        example: 'WinActivate "Untitled - Notepad"'
      },
      'WinWait': {
        signature: 'WinWait([WinTitle, WinText, Timeout, ExcludeTitle, ExcludeText])',
        description: 'Waits until the specified window exists.',
        example: 'WinWait "Untitled - Notepad", , 5'
      },
      'InputBox': {
        signature: 'InputBox([Prompt, Title, Options, Default])',
        description: 'Displays an input box to ask the user to enter a string.',
        example: 'result := InputBox("Please enter your name:", "Name")'
      },
      'StrLen': {
        signature: 'StrLen(String)',
        description: 'Returns the length of a string.',
        example: 'length := StrLen("Hello")  ; Returns 5'
      }
    };

    const info = builtIns[functionName];
    if (!info) {
      return null;
    }

    let documentation = `**Built-in Function**\n\n\`\`\`ahk\n${info.signature}\n\`\`\`\n\n`;
    documentation += `${info.description}\n`;

    if (includeExamples && info.example) {
      documentation += `\n**Example:**\n\`\`\`ahk\n${info.example}\n\`\`\``;
    }

    documentation += `\n\n*See [AutoHotkey v2 Documentation](https://www.autohotkey.com/docs/v2/) for more details.*`;

    return documentation;
  }
}
