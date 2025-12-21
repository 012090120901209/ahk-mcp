import { z } from 'zod';
import { AhkParser } from '../core/parser.js';
import type {
  AhkFunction,
  AhkClass,
  AhkVariable,
  AhkMethod,
  AhkProperty
} from '../types/ahk-ast.js';
import logger from '../logger.js';
import { safeParse } from '../core/validation-middleware.js';
import { createTextResponse, createErrorResponse, type McpToolResponse } from '../types/mcp-types.js';

// Zod schema for input validation
export const AhkLspCompletionArgsSchema = z.object({
  code: z.string().min(1, 'AutoHotkey code is required'),
  line: z.number().min(0, 'Line number must be 0 or greater').describe('Line number (0-indexed)'),
  character: z.number().min(0, 'Character position must be 0 or greater').describe('Character position in line (0-indexed)'),
  triggerCharacter: z.string().optional().describe('Character that triggered completion (., ::, etc.)'),
  includeBuiltIns: z.boolean().default(true).describe('Include built-in AHK v2 functions'),
  maxSuggestions: z.number().min(1).max(100).default(20).describe('Maximum number of suggestions to return')
});

export type AhkLspCompletionArgs = z.infer<typeof AhkLspCompletionArgsSchema>;

// LSP CompletionItemKind enum
export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25
}

// Completion item structure
export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText?: string;
  sortText?: string;
}

// Tool definition
export const ahkLspCompletionToolDefinition = {
  name: 'AHK_LSP_Completion',
  description: `Get code completions (IntelliSense) at cursor. Returns functions, variables, class members, built-ins.`,
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'AutoHotkey v2 code to analyze'
      },
      line: {
        type: 'number',
        description: 'Line number where completion is requested (0-indexed)',
        minimum: 0
      },
      character: {
        type: 'number',
        description: 'Character position in the line (0-indexed)',
        minimum: 0
      },
      triggerCharacter: {
        type: 'string',
        description: 'Character that triggered completion (., ::, etc.) - optional'
      },
      includeBuiltIns: {
        type: 'boolean',
        description: 'Include built-in AHK v2 functions in suggestions',
        default: true
      },
      maxSuggestions: {
        type: 'number',
        description: 'Maximum number of suggestions to return (1-100)',
        default: 20,
        minimum: 1,
        maximum: 100
      }
    },
    required: ['code', 'line', 'character']
  }
};

/**
 * AHK LSP Completion Tool
 * Provides code completion suggestions at specific positions
 */
export class AhkLspCompletionTool {
  async execute(args: unknown): Promise<McpToolResponse> {
    try {
      const startTime = Date.now();

      // Validate input
      const validation = safeParse(args, AhkLspCompletionArgsSchema, 'AHK_LSP_Completion');
      if (!validation.success) {
        return validation.error;
      }

      const {
        code,
        line,
        character,
        triggerCharacter,
        includeBuiltIns = true,
        maxSuggestions = 20
      } = validation.data;

      // Parse the code
      const parser = new AhkParser(code);
      const parseResult = parser.parse();

      // Get the current line content
      const lines = code.split('\n');
      if (line >= lines.length) {
        return createTextResponse(JSON.stringify({ completions: [] }, null, 2));
      }

      const currentLine = lines[line];
      const textBeforeCursor = currentLine.substring(0, character);

      logger.debug(`Getting completions at line ${line}, char ${character}. Text before cursor: "${textBeforeCursor}"`);
      logger.debug(`Trigger character: ${triggerCharacter || 'none'}`);

      // Determine completion context
      const completions: CompletionItem[] = [];

      // Handle member access (obj.method, class::static)
      if (triggerCharacter === '.' || triggerCharacter === '::') {
        const memberCompletions = this.getMemberCompletions(
          textBeforeCursor,
          parseResult,
          triggerCharacter
        );
        completions.push(...memberCompletions);
      } else {
        // Regular completions (functions, variables, keywords)
        const prefix = this.getCompletionPrefix(textBeforeCursor);

        // Add functions
        for (const func of parseResult.functions) {
          if (this.matchesPrefix(func.name, prefix)) {
            completions.push(this.createFunctionCompletion(func));
          }
        }

        // Add variables
        for (const variable of parseResult.variables) {
          if (this.matchesPrefix(variable.name, prefix)) {
            completions.push(this.createVariableCompletion(variable));
          }
        }

        // Add classes
        for (const cls of parseResult.classes) {
          if (this.matchesPrefix(cls.name, prefix)) {
            completions.push(this.createClassCompletion(cls));
          }
        }

        // Add keywords
        const keywords = this.getKeywordCompletions(prefix);
        completions.push(...keywords);

        // Add built-in functions if requested
        if (includeBuiltIns) {
          const builtIns = this.getBuiltInCompletions(prefix);
          completions.push(...builtIns);
        }
      }

      // Sort and limit results
      const sortedCompletions = this.sortCompletions(completions, textBeforeCursor);
      const limitedCompletions = sortedCompletions.slice(0, maxSuggestions);

      const duration = Date.now() - startTime;

      return createTextResponse(JSON.stringify({
        completions: limitedCompletions,
        context: {
          line,
          character,
          triggerCharacter: triggerCharacter || null,
          prefix: this.getCompletionPrefix(textBeforeCursor)
        },
        statistics: {
          totalSuggestions: completions.length,
          returnedSuggestions: limitedCompletions.length,
          lookupTime: duration
        }
      }, null, 2));

    } catch (error) {
      logger.error('Error in AHK_LSP_Completion:', error);
      return createErrorResponse(error, 'AHK_LSP_Completion');
    }
  }

  /**
   * Get completion prefix from text before cursor
   */
  private getCompletionPrefix(textBeforeCursor: string): string {
    const match = textBeforeCursor.match(/(\w+)$/);
    return match ? match[1] : '';
  }

  /**
   * Check if name matches prefix (case-insensitive)
   */
  private matchesPrefix(name: string, prefix: string): boolean {
    if (!prefix) return true;
    return name.toLowerCase().startsWith(prefix.toLowerCase());
  }

  /**
   * Get member completions for object/class access
   */
  private getMemberCompletions(
    textBeforeCursor: string,
    parseResult: any,
    triggerChar: string
  ): CompletionItem[] {
    const completions: CompletionItem[] = [];

    // Extract the object/class name before the trigger
    const objectMatch = textBeforeCursor.match(/(\w+)[.:]{1,2}$/);
    if (!objectMatch) {
      return completions;
    }

    const objectName = objectMatch[1];

    // Find the class this might be an instance of
    const cls = parseResult.classes.find((c: AhkClass) => c.name === objectName);

    if (cls) {
      // Add class methods
      for (const method of cls.methods) {
        if (triggerChar === '::' && method.isStatic) {
          completions.push(this.createMethodCompletion(method, cls.name));
        } else if (triggerChar === '.') {
          completions.push(this.createMethodCompletion(method, cls.name));
        }
      }

      // Add class properties
      for (const property of cls.properties) {
        if (triggerChar === '::' && property.isStatic) {
          completions.push(this.createPropertyCompletion(property, cls.name));
        } else if (triggerChar === '.') {
          completions.push(this.createPropertyCompletion(property, cls.name));
        }
      }
    }

    return completions;
  }

  /**
   * Get keyword completions
   */
  private getKeywordCompletions(prefix: string): CompletionItem[] {
    const keywords = [
      { label: 'if', detail: 'Conditional statement', insertText: 'if (${1:condition}) {\n\t$0\n}' },
      { label: 'else', detail: 'Else clause', insertText: 'else {\n\t$0\n}' },
      { label: 'while', detail: 'While loop', insertText: 'while (${1:condition}) {\n\t$0\n}' },
      { label: 'for', detail: 'For loop', insertText: 'for ${1:key}, ${2:value} in ${3:collection} {\n\t$0\n}' },
      { label: 'loop', detail: 'Loop statement', insertText: 'loop ${1:count} {\n\t$0\n}' },
      { label: 'return', detail: 'Return from function', insertText: 'return $0' },
      { label: 'break', detail: 'Break from loop', insertText: 'break' },
      { label: 'continue', detail: 'Continue to next iteration', insertText: 'continue' },
      { label: 'class', detail: 'Class declaration', insertText: 'class ${1:ClassName} {\n\t$0\n}' },
      { label: 'try', detail: 'Try-catch block', insertText: 'try {\n\t${1}\n} catch ${2:Error} as err {\n\t$0\n}' },
      { label: 'throw', detail: 'Throw exception', insertText: 'throw ${1:Error}("${2:message}")' },
      { label: 'global', detail: 'Declare global variable', insertText: 'global ${1:varName}' },
      { label: 'static', detail: 'Declare static variable', insertText: 'static ${1:varName}' },
      { label: 'local', detail: 'Declare local variable', insertText: 'local ${1:varName}' }
    ];

    return keywords
      .filter(kw => this.matchesPrefix(kw.label, prefix))
      .map(kw => ({
        label: kw.label,
        kind: CompletionItemKind.Keyword,
        detail: kw.detail,
        insertText: kw.insertText,
        sortText: `2_${kw.label}` // Keywords sort after user-defined symbols
      }));
  }

  /**
   * Get built-in function completions
   */
  private getBuiltInCompletions(prefix: string): CompletionItem[] {
    const builtIns = [
      { name: 'MsgBox', params: '([Text, Title, Options])', detail: 'Display message box' },
      { name: 'Send', params: '(Keys)', detail: 'Send keystrokes' },
      { name: 'Sleep', params: '(Delay)', detail: 'Wait specified milliseconds' },
      { name: 'Run', params: '(Target [, WorkingDir, Options, &PID])', detail: 'Run external program' },
      { name: 'FileRead', params: '(Filename [, Options])', detail: 'Read file contents' },
      { name: 'FileAppend', params: '(Text, Filename [, Options])', detail: 'Append to file' },
      { name: 'FileDelete', params: '(FilePattern)', detail: 'Delete files' },
      { name: 'FileExist', params: '(FilePattern)', detail: 'Check if file exists' },
      { name: 'DirExist', params: '(FilePattern)', detail: 'Check if directory exists' },
      { name: 'WinActivate', params: '([WinTitle, WinText, ExcludeTitle, ExcludeText])', detail: 'Activate window' },
      { name: 'WinWait', params: '([WinTitle, WinText, Timeout, ExcludeTitle, ExcludeText])', detail: 'Wait for window' },
      { name: 'WinExist', params: '([WinTitle, WinText, ExcludeTitle, ExcludeText])', detail: 'Check if window exists' },
      { name: 'InputBox', params: '([Prompt, Title, Options, Default])', detail: 'Display input box' },
      { name: 'StrLen', params: '(String)', detail: 'Get string length' },
      { name: 'SubStr', params: '(String, StartingPos [, Length])', detail: 'Extract substring' },
      { name: 'StrReplace', params: '(Haystack, SearchText [, ReplaceText, CaseSense, &Count, Limit])', detail: 'Replace text in string' },
      { name: 'StrSplit', params: '(String [, Delimiters, OmitChars, MaxParts])', detail: 'Split string into array' },
      { name: 'InStr', params: '(Haystack, Needle [, CaseSense, StartingPos, Occurrence])', detail: 'Find string position' },
      { name: 'RegExMatch', params: '(Haystack, NeedleRegEx [, &Match, StartingPos])', detail: 'Match regular expression' },
      { name: 'RegExReplace', params: '(Haystack, NeedleRegEx [, Replacement, &Count, Limit, StartingPos])', detail: 'Replace using regex' },
      { name: 'Format', params: '(FormatStr, Values*)', detail: 'Format string' },
      { name: 'Array', params: '(Values*)', detail: 'Create array' },
      { name: 'Map', params: '(Key1, Value1, ...)', detail: 'Create map' },
      { name: 'SetTimer', params: '([Callback, Period, Priority])', detail: 'Set timer callback' },
      { name: 'Hotkey', params: '(KeyName [, Action, Options])', detail: 'Create hotkey' },
      { name: 'GetKeyState', params: '(KeyName [, Mode])', detail: 'Get key state' }
    ];

    return builtIns
      .filter(fn => this.matchesPrefix(fn.name, prefix))
      .map(fn => ({
        label: fn.name,
        kind: CompletionItemKind.Function,
        detail: `${fn.name}${fn.params}`,
        documentation: fn.detail,
        insertText: `${fn.name}($0)`,
        sortText: `3_${fn.name}` // Built-ins sort after user symbols and keywords
      }));
  }

  /**
   * Create function completion item
   */
  private createFunctionCompletion(func: AhkFunction): CompletionItem {
    const params = func.parameters.map(p => p.name).join(', ');
    const signature = `${func.name}(${params})`;

    return {
      label: func.name,
      kind: CompletionItemKind.Function,
      detail: signature,
      documentation: func.returnType ? `Returns: ${func.returnType}` : undefined,
      insertText: `${func.name}($0)`,
      sortText: `0_${func.name}` // User functions sort first
    };
  }

  /**
   * Create variable completion item
   */
  private createVariableCompletion(variable: AhkVariable): CompletionItem {
    return {
      label: variable.name,
      kind: CompletionItemKind.Variable,
      detail: `${variable.scope} variable`,
      documentation: variable.dataType ? `Type: ${variable.dataType}` : undefined,
      insertText: variable.name,
      sortText: `0_${variable.name}`
    };
  }

  /**
   * Create class completion item
   */
  private createClassCompletion(cls: AhkClass): CompletionItem {
    return {
      label: cls.name,
      kind: CompletionItemKind.Class,
      detail: cls.extends ? `class ${cls.name} extends ${cls.extends}` : `class ${cls.name}`,
      documentation: `${cls.methods.length} methods, ${cls.properties.length} properties`,
      insertText: `${cls.name}($0)`,
      sortText: `0_${cls.name}`
    };
  }

  /**
   * Create method completion item
   */
  private createMethodCompletion(method: AhkMethod, className: string): CompletionItem {
    const params = method.parameters.map(p => p.name).join(', ');
    const signature = `${method.name}(${params})`;

    return {
      label: method.name,
      kind: CompletionItemKind.Method,
      detail: `${className}.${signature}`,
      documentation: method.returnType ? `Returns: ${method.returnType}` : undefined,
      insertText: `${method.name}($0)`,
      sortText: `0_${method.name}`
    };
  }

  /**
   * Create property completion item
   */
  private createPropertyCompletion(property: AhkProperty, className: string): CompletionItem {
    return {
      label: property.name,
      kind: CompletionItemKind.Property,
      detail: `${className}.${property.name}`,
      insertText: property.name,
      sortText: `0_${property.name}`
    };
  }

  /**
   * Sort completions by relevance
   */
  private sortCompletions(completions: CompletionItem[], textBeforeCursor: string): CompletionItem[] {
    const prefix = this.getCompletionPrefix(textBeforeCursor);

    return completions.sort((a, b) => {
      // Use sortText if provided, otherwise compare labels
      const aSortText = a.sortText || a.label;
      const bSortText = b.sortText || b.label;

      // Exact matches first
      if (a.label === prefix && b.label !== prefix) return -1;
      if (b.label === prefix && a.label !== prefix) return 1;

      // Then by sortText
      return aSortText.localeCompare(bSortText);
    });
  }
}
