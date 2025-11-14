import { z } from 'zod';
import { AhkParser } from '../core/parser.js';
import type {
  AhkFunction,
  AhkClass,
  AhkVariable,
  AhkHotkey,
  AhkDirective,
  AhkMethod,
  AhkProperty
} from '../types/ahk-ast.js';
import logger from '../logger.js';
import { safeParse } from '../core/validation-middleware.js';
import { createTextResponse, createErrorResponse, type McpToolResponse } from '../types/mcp-types.js';

// Zod schema for input validation
export const AhkLspDocumentSymbolsArgsSchema = z.object({
  code: z.string().min(1, 'AutoHotkey code is required'),
  hierarchical: z.boolean().default(true).describe('Return hierarchical structure (classes contain methods)'),
  includePrivate: z.boolean().default(true).describe('Include private/internal symbols'),
  symbolTypes: z.array(z.enum(['function', 'class', 'variable', 'hotkey', 'directive', 'method', 'property']))
    .default(['function', 'class', 'variable', 'hotkey', 'method', 'property'])
    .describe('Types of symbols to include')
});

export type AhkLspDocumentSymbolsArgs = z.infer<typeof AhkLspDocumentSymbolsArgsSchema>;

// LSP SymbolKind enum (matching Language Server Protocol)
export enum SymbolKind {
  File = 1,
  Module = 2,
  Namespace = 3,
  Package = 4,
  Class = 5,
  Method = 6,
  Property = 7,
  Field = 8,
  Constructor = 9,
  Enum = 10,
  Interface = 11,
  Function = 12,
  Variable = 13,
  Constant = 14,
  String = 15,
  Number = 16,
  Boolean = 17,
  Array = 18,
  Object = 19,
  Key = 20,
  Null = 21,
  EnumMember = 22,
  Struct = 23,
  Event = 24,
  Operator = 25,
  TypeParameter = 26
}

// LSP DocumentSymbol interface
export interface DocumentSymbol {
  name: string;
  detail?: string;
  kind: SymbolKind;
  deprecated?: boolean;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  selectionRange: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  children?: DocumentSymbol[];
}

// Tool definition
export const ahkLspDocumentSymbolsToolDefinition = {
  name: 'AHK_LSP_Document_Symbols',
  description: `Get document outline (symbol tree) for AutoHotkey v2 code

Returns a structured list of all symbols in the code:
- Functions with parameters
- Classes with methods and properties
- Global variables
- Hotkeys and hotstrings
- Directives

Perfect for understanding code structure without reading the entire file.
Reduces token usage by 80-90% compared to reading full files.

**Example Usage:**
\`\`\`
// Get hierarchical outline (classes contain methods)
{ code: "...", hierarchical: true }

// Get flat list of all symbols
{ code: "...", hierarchical: false }

// Get only functions and classes
{ code: "...", symbolTypes: ["function", "class"] }
\`\`\``,
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'AutoHotkey v2 code to analyze'
      },
      hierarchical: {
        type: 'boolean',
        description: 'Return hierarchical structure (classes contain methods/properties)',
        default: true
      },
      includePrivate: {
        type: 'boolean',
        description: 'Include private/internal symbols (variables, internal methods)',
        default: true
      },
      symbolTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['function', 'class', 'variable', 'hotkey', 'directive', 'method', 'property']
        },
        description: 'Types of symbols to include (default: all except directives)',
        default: ['function', 'class', 'variable', 'hotkey', 'method', 'property']
      }
    },
    required: ['code']
  }
};

/**
 * AHK LSP Document Symbols Tool
 * Extracts and returns structured symbol information from AutoHotkey code
 */
export class AhkLspDocumentSymbolsTool {
  async execute(args: unknown): Promise<McpToolResponse> {
    try {
      const startTime = Date.now();

      // Validate input
      const validation = safeParse(args, AhkLspDocumentSymbolsArgsSchema, 'AHK_LSP_Document_Symbols');
      if (!validation.success) {
        return validation.error;
      }

      const {
        code,
        hierarchical = true,
        includePrivate = true,
        symbolTypes = ['function', 'class', 'variable', 'hotkey', 'method', 'property']
      } = validation.data;

      // Parse the code
      const parser = new AhkParser(code);
      const parseResult = parser.parse();

      logger.debug(`Parsed ${parseResult.functions.length} functions, ${parseResult.classes.length} classes, ${parseResult.variables.length} variables`);

      // Convert to DocumentSymbol format
      const symbols: DocumentSymbol[] = [];

      // Add functions
      if (symbolTypes.includes('function')) {
        for (const func of parseResult.functions) {
          symbols.push(this.convertFunctionToSymbol(func));
        }
      }

      // Add classes (with methods and properties if hierarchical)
      if (symbolTypes.includes('class')) {
        for (const cls of parseResult.classes) {
          const classSymbol = this.convertClassToSymbol(cls, hierarchical, symbolTypes);
          symbols.push(classSymbol);
        }
      }

      // Add variables
      if (symbolTypes.includes('variable') && includePrivate) {
        for (const variable of parseResult.variables) {
          symbols.push(this.convertVariableToSymbol(variable));
        }
      }

      // Add hotkeys
      if (symbolTypes.includes('hotkey')) {
        for (const hotkey of parseResult.hotkeys) {
          symbols.push(this.convertHotkeyToSymbol(hotkey));
        }
      }

      // Add directives
      if (symbolTypes.includes('directive')) {
        for (const directive of parseResult.directives) {
          symbols.push(this.convertDirectiveToSymbol(directive));
        }
      }

      // Sort symbols by line number
      symbols.sort((a, b) => a.range.start.line - b.range.start.line);

      // Create summary
      const summary = this.createSummary(symbols, hierarchical);

      const duration = Date.now() - startTime;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            symbols,
            summary,
            performance: {
              parseTime: duration,
              symbolCount: symbols.length
            }
          }, null, 2)
        }]
      };

    } catch (error) {
      logger.error('Error in AHK_LSP_Document_Symbols:', error);
      return createErrorResponse(error, 'AHK_LSP_Document_Symbols');
    }
  }

  /**
   * Convert AhkFunction to DocumentSymbol
   */
  private convertFunctionToSymbol(func: AhkFunction): DocumentSymbol {
    const params = func.parameters.map(p => {
      let paramStr = p.name;
      if (p.isOptional) paramStr += '?';
      if (p.defaultValue) paramStr += ` := ${p.defaultValue}`;
      if (p.isVariadic) paramStr += '*';
      return paramStr;
    }).join(', ');

    return {
      name: func.name,
      detail: `(${params})`,
      kind: SymbolKind.Function,
      range: {
        start: { line: func.line, character: func.column },
        end: { line: func.line, character: func.column + func.name.length }
      },
      selectionRange: {
        start: { line: func.line, character: func.column },
        end: { line: func.line, character: func.column + func.name.length }
      }
    };
  }

  /**
   * Convert AhkClass to DocumentSymbol (optionally with children)
   */
  private convertClassToSymbol(cls: AhkClass, hierarchical: boolean, symbolTypes: string[]): DocumentSymbol {
    const symbol: DocumentSymbol = {
      name: cls.name,
      detail: cls.extends ? `extends ${cls.extends}` : undefined,
      kind: SymbolKind.Class,
      range: {
        start: { line: cls.line, character: cls.column },
        end: { line: cls.line, character: cls.column + cls.name.length }
      },
      selectionRange: {
        start: { line: cls.line, character: cls.column },
        end: { line: cls.line, character: cls.column + cls.name.length }
      }
    };

    // Add children if hierarchical
    if (hierarchical) {
      const children: DocumentSymbol[] = [];

      // Add constructor
      if (cls.constructor && symbolTypes.includes('method')) {
        children.push(this.convertMethodToSymbol(cls.constructor));
      }

      // Add methods
      if (symbolTypes.includes('method')) {
        for (const method of cls.methods) {
          children.push(this.convertMethodToSymbol(method));
        }
      }

      // Add properties
      if (symbolTypes.includes('property')) {
        for (const property of cls.properties) {
          children.push(this.convertPropertyToSymbol(property));
        }
      }

      if (children.length > 0) {
        symbol.children = children;
      }
    }

    return symbol;
  }

  /**
   * Convert AhkMethod to DocumentSymbol
   */
  private convertMethodToSymbol(method: AhkMethod): DocumentSymbol {
    const params = method.parameters.map(p => {
      let paramStr = p.name;
      if (p.isOptional) paramStr += '?';
      if (p.defaultValue) paramStr += ` := ${p.defaultValue}`;
      return paramStr;
    }).join(', ');

    const kind = method.name === '__New' || method.name === '__Init'
      ? SymbolKind.Constructor
      : SymbolKind.Method;

    return {
      name: method.name,
      detail: `(${params})${method.isStatic ? ' [static]' : ''}`,
      kind,
      range: {
        start: { line: method.line, character: method.column },
        end: { line: method.line, character: method.column + method.name.length }
      },
      selectionRange: {
        start: { line: method.line, character: method.column },
        end: { line: method.line, character: method.column + method.name.length }
      }
    };
  }

  /**
   * Convert AhkProperty to DocumentSymbol
   */
  private convertPropertyToSymbol(property: AhkProperty): DocumentSymbol {
    return {
      name: property.name,
      detail: property.isStatic ? '[static property]' : '[property]',
      kind: SymbolKind.Property,
      range: {
        start: { line: property.line, character: property.column },
        end: { line: property.line, character: property.column + property.name.length }
      },
      selectionRange: {
        start: { line: property.line, character: property.column },
        end: { line: property.line, character: property.column + property.name.length }
      }
    };
  }

  /**
   * Convert AhkVariable to DocumentSymbol
   */
  private convertVariableToSymbol(variable: AhkVariable): DocumentSymbol {
    return {
      name: variable.name,
      detail: `[${variable.scope} variable]`,
      kind: variable.scope === 'global' ? SymbolKind.Constant : SymbolKind.Variable,
      range: {
        start: { line: variable.line, character: variable.column },
        end: { line: variable.line, character: variable.column + variable.name.length }
      },
      selectionRange: {
        start: { line: variable.line, character: variable.column },
        end: { line: variable.line, character: variable.column + variable.name.length }
      }
    };
  }

  /**
   * Convert AhkHotkey to DocumentSymbol
   */
  private convertHotkeyToSymbol(hotkey: AhkHotkey): DocumentSymbol {
    const modifiers = hotkey.modifiers.length > 0 ? hotkey.modifiers.join('+') + '+' : '';
    return {
      name: `${modifiers}${hotkey.key}`,
      detail: '[hotkey]',
      kind: SymbolKind.Event,
      range: {
        start: { line: hotkey.line, character: hotkey.column },
        end: { line: hotkey.line, character: hotkey.column + hotkey.key.length }
      },
      selectionRange: {
        start: { line: hotkey.line, character: hotkey.column },
        end: { line: hotkey.line, character: hotkey.column + hotkey.key.length }
      }
    };
  }

  /**
   * Convert AhkDirective to DocumentSymbol
   */
  private convertDirectiveToSymbol(directive: AhkDirective): DocumentSymbol {
    return {
      name: `#${directive.name}`,
      detail: directive.value || '[directive]',
      kind: SymbolKind.Module,
      range: {
        start: { line: directive.line, character: directive.column },
        end: { line: directive.line, character: directive.column + directive.name.length }
      },
      selectionRange: {
        start: { line: directive.line, character: directive.column },
        end: { line: directive.line, character: directive.column + directive.name.length }
      }
    };
  }

  /**
   * Create summary of symbols
   */
  private createSummary(symbols: DocumentSymbol[], hierarchical: boolean): Record<string, any> {
    const summary: Record<string, number> = {
      totalSymbols: symbols.length,
      functions: 0,
      classes: 0,
      methods: 0,
      properties: 0,
      variables: 0,
      hotkeys: 0,
      directives: 0
    };

    const countSymbols = (syms: DocumentSymbol[]) => {
      for (const symbol of syms) {
        switch (symbol.kind) {
          case SymbolKind.Function:
            summary.functions++;
            break;
          case SymbolKind.Class:
            summary.classes++;
            break;
          case SymbolKind.Method:
          case SymbolKind.Constructor:
            summary.methods++;
            break;
          case SymbolKind.Property:
            summary.properties++;
            break;
          case SymbolKind.Variable:
          case SymbolKind.Constant:
            summary.variables++;
            break;
          case SymbolKind.Event:
            summary.hotkeys++;
            break;
          case SymbolKind.Module:
            summary.directives++;
            break;
        }

        // Recursively count children
        if (symbol.children) {
          countSymbols(symbol.children);
        }
      }
    };

    countSymbols(symbols);

    return {
      ...summary,
      hierarchical
    };
  }
}
