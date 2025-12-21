import { z } from 'zod';
import { AhkCompiler } from '../compiler/ahk-compiler.js';
import logger from '../logger.js';
import { autoDetect } from '../core/active-file.js';
import { safeParse } from '../core/validation-middleware.js';

export const AhkAnalyzeArgsSchema = z.object({
  code: z.string().min(1, 'AutoHotkey code is required'),
  includeDocumentation: z.boolean().optional().default(true),
  includeUsageExamples: z.boolean().optional().default(false),
  analyzeComplexity: z.boolean().optional().default(false),
  // New filtering parameters for token reduction
  severityFilter: z.array(z.enum(['error', 'warning', 'info'])).optional().describe('Filter issues by severity levels'),
  maxIssues: z.number().optional().describe('Limit number of issues returned'),
  summaryOnly: z.boolean().optional().default(false).describe('Return only summary counts, not detailed issues')
});

export const ahkAnalyzeToolDefinition = {
  name: 'AHK_Analyze',
  description: `Ahk analyze
Analyzes AutoHotkey v2 scripts and provides contextual information about functions, variables, classes, and other elements used in the code.`,
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'AutoHotkey code is required'
      },
      includeDocumentation: {
        type: 'boolean',
        description: 'Include documentation for built-in elements',
        default: true
      },
      includeUsageExamples: {
        type: 'boolean',
        description: 'Include usage examples',
        default: false
      },
      analyzeComplexity: {
        type: 'boolean',
        description: 'Analyze code complexity',
        default: false
      },
      severityFilter: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['error', 'warning', 'info']
        },
        description: 'Filter issues by severity levels (e.g., ["error"] for errors only)'
      },
      maxIssues: {
        type: 'number',
        description: 'Limit number of issues returned (reduces token usage)'
      },
      summaryOnly: {
        type: 'boolean',
        description: 'Return only summary counts, not detailed issues (minimal tokens)',
        default: false
      }
    },
    required: ['code']
  }
};

export interface AnalysisResult {
  summary: {
    totalLines: number;
    functionsUsed: number;
    variablesDeclared: number;
    classesUsed: number;
    hotkeysDefined: number;
    builtInFunctions: number;
    userDefinedFunctions: number;
  };
  elements: {
    builtInFunctions: Array<{
      name: string;
      line: number;
      documentation?: any;
      usage: string;
    }>;
    builtInVariables: Array<{
      name: string;
      line: number;
      documentation?: any;
      usage: string;
    }>;
    userDefinedFunctions: Array<{
      name: string;
      line: number;
      parameters: any[];
    }>;
    userDefinedVariables: Array<{
      name: string;
      line: number;
      value?: string;
      scope: string;
    }>;
    classes: Array<{
      name: string;
      line: number;
      documentation?: any;
      methods?: any[];
    }>;
    hotkeys: Array<{
      key: string;
      modifiers: string[];
      line: number;
    }>;
    directives: Array<{
      name: string;
      value: string;
      line: number;
      documentation?: any;
    }>;
  };
  suggestions: string[];
  warnings: string[];
}

export class AhkAnalyzeTool {
  async execute(args: unknown): Promise<any> {
    try {
      const parsed = safeParse(args, AhkAnalyzeArgsSchema, 'AHK_Analyze');
      if (!parsed.success) return parsed.error;

      const validatedArgs = parsed.data;
      logger.info('Analyzing AutoHotkey script using new compiler system');

      // Auto-detect any file paths in the code
      if (validatedArgs.code) {
        autoDetect(validatedArgs.code);
      }
      const { code, includeDocumentation, includeUsageExamples, analyzeComplexity, severityFilter, maxIssues, summaryOnly } = validatedArgs;

      // Use the new compiler system for comprehensive analysis
      const compilerResults = AhkCompiler.analyze(code);
      const statistics = AhkCompiler.getStatistics(code);

      // If summaryOnly is true, return minimal output
      if (summaryOnly) {
        const syntaxIssues = this.checkAhkV2Syntax(code);
        const diagnostics = compilerResults.diagnostics.data || [];

        const summary = {
          lines: statistics.lines,
          tokens: statistics.tokens,
          functions: statistics.functions,
          classes: statistics.classes,
          complexity: statistics.complexity,
          issues: {
            syntaxErrors: compilerResults.ast.success ? 0 : compilerResults.ast.errors.length,
            diagnostics: diagnostics.length,
            v2SyntaxIssues: syntaxIssues.length,
            total: (compilerResults.ast.success ? 0 : compilerResults.ast.errors.length) + diagnostics.length + syntaxIssues.length
          }
        };

        return {
          content: [{
            type: 'text',
            text: `# Analysis Summary\n\n${JSON.stringify(summary, null, 2)}`
          }]
        };
      }

      // Format the results
      let report = '# AutoHotkey v2 Script Analysis\n\n';

      // Statistics
      report += '## Code Statistics\n';
      report += `- **Lines of Code:** ${statistics.lines}\n`;
      report += `- **Total Tokens:** ${statistics.tokens}\n`;
      report += `- **Functions:** ${statistics.functions}\n`;
      report += `- **Classes:** ${statistics.classes}\n`;
      report += `- **Comments:** ${statistics.comments}\n`;
      report += `- **Complexity Score:** ${statistics.complexity}\n\n`;

      // Parsing Results
      if (compilerResults.ast.success) {
        report += '## Syntax Analysis\n';
        report += 'Code parsed successfully with no syntax errors.\n\n';
      } else {
        report += '## Syntax Errors\n';
        compilerResults.ast.errors.forEach(error => {
          report += `- Line ${error.line}, Column ${error.column}: ${error.message}\n`;
        });
        report += '\n';
      }

      // Linting Results
      if (compilerResults.diagnostics.success && compilerResults.diagnostics.data) {
        const diagnostics = compilerResults.diagnostics.data;
        if (diagnostics.length > 0) {
          report += '## Code Quality Issues\n';
          report += AhkCompiler.formatDiagnostics(diagnostics);
          report += '\n\n';
        } else {
          report += '## Code Quality\n';
          report += 'No issues found! Your code follows AutoHotkey v2 best practices.\n\n';
        }
      }

      // Enhanced Regex-based AutoHotkey v2 Syntax Checking
      let syntaxIssues = this.checkAhkV2Syntax(code);

      // Apply maxIssues filter if specified
      if (maxIssues && maxIssues > 0) {
        syntaxIssues = syntaxIssues.slice(0, maxIssues);
      }

      if (syntaxIssues.length > 0) {
        report += '## AutoHotkey v2 Syntax Issues (Enhanced Detection)\n';
        syntaxIssues.forEach(issue => {
          report += `- **Line ${issue.line}:** ${issue.message}\n`;
          report += `  \`\`\`autohotkey\n  ${issue.code}\n  \`\`\`\n`;
          if (issue.suggestion) {
            report += `  **Suggested fix:** \`${issue.suggestion}\`\n`;
          }
          report += '\n';
        });
      } else {
        report += '## AutoHotkey v2 Syntax (Enhanced Detection)\n';
        report += 'No AutoHotkey v2 syntax issues detected by enhanced regex analysis.\n\n';
      }

      // Semantic Analysis
      if (compilerResults.semanticTokens.success && compilerResults.semanticTokens.data) {
        const tokens = compilerResults.semanticTokens.data;
        const tokenCounts = this.countSemanticTokens(tokens);

        report += '## Code Structure\n';
        Object.entries(tokenCounts).forEach(([type, count]) => {
          if (count > 0) {
            report += `- **${type}:** ${count}\n`;
          }
        });
        report += '\n';
      }

      // Complexity Analysis
      if (analyzeComplexity) {
        report += '## Complexity Analysis\n';
        const complexityLevel = statistics.complexity <= 5 ? 'Low' :
          statistics.complexity <= 15 ? 'Medium' : 'High';
        report += `- **Complexity Level:** ${complexityLevel}\n`;
        report += `- **Maintainability:** ${complexityLevel === 'Low' ? 'Excellent' :
          complexityLevel === 'Medium' ? 'Good' : 'Needs Improvement'}\n\n`;
      }

      // Recommendations
      report += '## Recommendations\n';
      if (statistics.complexity > 20) {
        report += '- Consider breaking down complex functions into smaller, more manageable pieces\n';
      }
      if (statistics.comments === 0 && statistics.lines > 10) {
        report += '- Add comments to explain complex logic and improve code readability\n';
      }
      if (statistics.functions === 0 && statistics.lines > 20) {
        report += '- Consider organizing code into functions for better structure and reusability\n';
      }
      if (!code.includes('#Requires AutoHotkey v2')) {
        report += '- Add "#Requires AutoHotkey v2" directive at the top of your script\n';
      }

      if (includeDocumentation) {
        report += '\n## Documentation Support\n';
        report += 'Leverage the `AHK_Doc_Search` tool or ChatGPT `search`/`fetch` helpers to pull detailed reference material for the functions and directives found in this script.\n';
      }

      if (includeUsageExamples) {
        report += '\n## Usage Examples\n';
        report += 'Invoke `AHK_Sampling_Enhancer` to generate runnable usage samples for the highlighted APIs and hotkeys.\n';
      }

      return {
        content: [
          {
            type: 'text',
            text: report
          }
        ]
      };

    } catch (error) {
      logger.error('Error analyzing AutoHotkey script:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing script: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  private countSemanticTokens(tokens: any[]): Record<string, number> {
    const counts: Record<string, number> = {};

    tokens.forEach(token => {
      const type = token.tokenType || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });

    return counts;
  }

  /**
   * Enhanced regex-based AutoHotkey v2 syntax checking
   */
  private checkAhkV2Syntax(code: string): Array<{ line: number, message: string, code: string, suggestion?: string }> {
    const issues: Array<{ line: number, message: string, code: string, suggestion?: string }> = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();

      // Skip comments and empty lines
      if (trimmedLine.startsWith(';') || trimmedLine === '') return;

      // 1. Check for object literals (should use Map() constructor)
      const objectLiteralRegex = /\{\s*[\w"']+\s*:\s*[^}]+\}/g;
      if (objectLiteralRegex.test(line)) {
        issues.push({
          line: lineNum,
          message: 'Object literal syntax detected - use Map() constructor in AutoHotkey v2',
          code: trimmedLine,
          suggestion: 'Map("key", "value") instead of {key: "value"}'
        });
      }

      // 2. Check for "new" keyword usage
      const newKeywordRegex = /\bnew\s+\w+/g;
      if (newKeywordRegex.test(line)) {
        const match = line.match(newKeywordRegex);
        if (match) {
          issues.push({
            line: lineNum,
            message: 'Remove "new" keyword in AutoHotkey v2',
            code: trimmedLine,
            suggestion: match[0].replace('new ', '')
          });
        }
      }

      // 3. Check for assignment operator (= instead of :=)
      const assignmentRegex = /^\s*\w+\s*=\s*[^=]/;
      if (assignmentRegex.test(line) && !line.includes('==') && !line.includes('!=') && !line.includes('<=') && !line.includes('>=')) {
        issues.push({
          line: lineNum,
          message: 'Use ":=" for assignment, "=" is for comparison in AutoHotkey v2',
          code: trimmedLine,
          suggestion: trimmedLine.replace(/(\w+)\s*=\s*/, '$1 := ')
        });
      }

      // 4. Check for double slash comments
      const doubleSlashRegex = /\/\//;
      if (doubleSlashRegex.test(line) && !line.includes('http://') && !line.includes('https://')) {
        issues.push({
          line: lineNum,
          message: 'Use semicolon (;) for comments in AutoHotkey v2, not double slash (//)',
          code: trimmedLine,
          suggestion: trimmedLine.replace('//', ';')
        });
      }

      // 5. Check for string concatenation with . operator
      const dotConcatRegex = /"\s*\.\s*"/g;
      if (dotConcatRegex.test(line)) {
        issues.push({
          line: lineNum,
          message: 'String concatenation in AutoHotkey v2 uses space or explicit concatenation',
          code: trimmedLine,
          suggestion: 'Use "string1" "string2" or "string1" . "string2"'
        });
      }

      // 6. Check for old-style function calls without parentheses
      const oldFunctionCallRegex = /^[A-Z]\w+\s+[^(=:]/;
      if (oldFunctionCallRegex.test(trimmedLine)) {
        const functionName = trimmedLine.split(/\s+/)[0];
        if (['MsgBox', 'Send', 'Click', 'Sleep', 'Run', 'WinActivate'].includes(functionName)) {
          issues.push({
            line: lineNum,
            message: `Function "${functionName}" requires parentheses in AutoHotkey v2`,
            code: trimmedLine,
            suggestion: `${functionName}(...)`
          });
        }
      }

      // 7. Check for array access with % (legacy syntax)
      const legacyArrayRegex = /%\w+%/g;
      if (legacyArrayRegex.test(line)) {
        issues.push({
          line: lineNum,
          message: 'Legacy variable syntax detected - use direct variable names in AutoHotkey v2',
          code: trimmedLine,
          suggestion: 'Remove % symbols around variable names'
        });
      }

      // 8. Check for missing #Requires directive
      if (lineNum === 1 && !code.includes('#Requires AutoHotkey v2')) {
        issues.push({
          line: 1,
          message: 'Missing #Requires AutoHotkey v2 directive',
          code: 'Top of file',
          suggestion: 'Add "#Requires AutoHotkey v2" at the beginning of your script'
        });
      }

      // 9. Check for old-style hotkey syntax
      const oldHotkeyRegex = /^[^:]+::[^:].*return$/i;
      if (oldHotkeyRegex.test(trimmedLine)) {
        issues.push({
          line: lineNum,
          message: 'Old-style hotkey with "return" - use function syntax in AutoHotkey v2',
          code: trimmedLine,
          suggestion: 'Use "Hotkey::FunctionName" or "Hotkey::() => Action"'
        });
      }

      // 10. Check for quotes that should use backticks for escaping
      const quoteEscapeRegex = /\\"/g;
      if (quoteEscapeRegex.test(line)) {
        issues.push({
          line: lineNum,
          message: 'Use backticks to escape quotes in AutoHotkey v2 strings',
          code: trimmedLine,
          suggestion: 'Use `" instead of \\"'
        });
      }
    });

    return issues;
  }

  private async analyzeScript(parseResult: any, code: string, ahkIndex: any, options: any): Promise<AnalysisResult> {
    const lines = code.split('\n');
    const analysis: AnalysisResult = {
      summary: {
        totalLines: lines.length,
        functionsUsed: 0,
        variablesDeclared: parseResult.variables.length,
        classesUsed: 0,
        hotkeysDefined: parseResult.hotkeys.length,
        builtInFunctions: 0,
        userDefinedFunctions: parseResult.functions.length
      },
      elements: {
        builtInFunctions: [],
        builtInVariables: [],
        userDefinedFunctions: [],
        userDefinedVariables: [],
        classes: [],
        hotkeys: [],
        directives: []
      },
      suggestions: [],
      warnings: []
    };

    // Analyze built-in functions used in the script
    await this.findBuiltInFunctions(code, lines, ahkIndex, analysis, options);

    // Analyze built-in variables used in the script
    await this.findBuiltInVariables(code, lines, ahkIndex, analysis, options);

    // Analyze user-defined elements
    this.analyzeUserDefinedElements(parseResult, analysis);

    // Analyze classes used
    await this.findClassUsage(code, lines, ahkIndex, analysis, options);

    // Generate suggestions and warnings
    this.generateSuggestions(analysis);

    return analysis;
  }

  private async findBuiltInFunctions(code: string, lines: string[], ahkIndex: any, analysis: AnalysisResult, options: any) {
    const builtInFunctions = ahkIndex.functions || [];

    for (const func of builtInFunctions) {
      const funcName = func.Name.split('(')[0]; // Extract function name without parameters
      const regex = new RegExp(`\\b${funcName}\\s*\\(`, 'gi');

      lines.forEach((line, index) => {
        const matches = line.match(regex);
        if (matches) {
          analysis.elements.builtInFunctions.push({
            name: funcName,
            line: index + 1,
            documentation: options.includeDocumentation ? func : undefined,
            usage: line.trim()
          });
          analysis.summary.builtInFunctions++;
        }
      });
    }
  }

  private async findBuiltInVariables(code: string, lines: string[], ahkIndex: any, analysis: AnalysisResult, options: any) {
    const builtInVariables = ahkIndex.variables || [];

    for (const variable of builtInVariables) {
      const varName = variable.Name;
      const regex = new RegExp(`\\b${varName}\\b`, 'gi');

      lines.forEach((line, index) => {
        if (regex.test(line)) {
          analysis.elements.builtInVariables.push({
            name: varName,
            line: index + 1,
            documentation: options.includeDocumentation ? variable : undefined,
            usage: line.trim()
          });
        }
      });
    }
  }

  private async findClassUsage(code: string, lines: string[], ahkIndex: any, analysis: AnalysisResult, options: any) {
    const builtInClasses = ahkIndex.classes || [];

    for (const cls of builtInClasses) {
      const className = cls.Name;
      const regex = new RegExp(`\\b${className}\\s*\\(`, 'gi');

      lines.forEach((line, index) => {
        if (regex.test(line)) {
          analysis.elements.classes.push({
            name: className,
            line: index + 1,
            documentation: options.includeDocumentation ? cls : undefined,
            methods: cls.Methods
          });
          analysis.summary.classesUsed++;
        }
      });
    }
  }

  private analyzeUserDefinedElements(parseResult: any, analysis: AnalysisResult) {
    // User-defined functions
    parseResult.functions.forEach((func: any) => {
      analysis.elements.userDefinedFunctions.push({
        name: func.name,
        line: func.line + 1,
        parameters: func.parameters
      });
    });

    // User-defined variables
    parseResult.variables.forEach((variable: any) => {
      analysis.elements.userDefinedVariables.push({
        name: variable.name,
        line: variable.line + 1,
        value: variable.value,
        scope: variable.scope
      });
    });

    // Hotkeys
    parseResult.hotkeys.forEach((hotkey: any) => {
      analysis.elements.hotkeys.push({
        key: hotkey.key,
        modifiers: hotkey.modifiers,
        line: hotkey.line + 1
      });
    });

    // Directives
    parseResult.directives.forEach((directive: any) => {
      analysis.elements.directives.push({
        name: directive.name,
        value: directive.value,
        line: directive.line + 1
      });
    });
  }

  private generateSuggestions(analysis: AnalysisResult) {
    // Suggest improvements based on analysis
    if (analysis.summary.builtInFunctions === 0 && analysis.summary.userDefinedFunctions === 0) {
      analysis.suggestions.push("Consider organizing your code into functions for better maintainability.");
    }

    if (analysis.elements.userDefinedVariables.length > 10) {
      analysis.suggestions.push("Consider grouping related variables into classes or objects for better organization.");
    }

    if (analysis.elements.hotkeys.length > 5) {
      analysis.suggestions.push("Consider using a configuration file or GUI for managing many hotkeys.");
    }

    // Check for potential issues
    const longFunctions = analysis.elements.userDefinedFunctions.filter(f => f.parameters.length > 5);
    if (longFunctions.length > 0) {
      analysis.warnings.push(`Functions with many parameters found: ${longFunctions.map(f => f.name).join(', ')}. Consider using objects or configuration parameters.`);
    }
  }

  private formatAnalysisReport(analysis: AnalysisResult): string {
    let report = `# AutoHotkey Script Analysis Report\n\n`;

    // Summary
    report += `## Summary\n`;
    report += `- **Total Lines:** ${analysis.summary.totalLines}\n`;
    report += `- **Built-in Functions Used:** ${analysis.summary.builtInFunctions}\n`;
    report += `- **User-defined Functions:** ${analysis.summary.userDefinedFunctions}\n`;
    report += `- **Variables Declared:** ${analysis.summary.variablesDeclared}\n`;
    report += `- **Classes Used:** ${analysis.summary.classesUsed}\n`;
    report += `- **Hotkeys Defined:** ${analysis.summary.hotkeysDefined}\n\n`;

    // Built-in Functions
    if (analysis.elements.builtInFunctions.length > 0) {
      report += `## Built-in Functions Used\n`;
      analysis.elements.builtInFunctions.forEach(func => {
        report += `- **${func.name}** (Line ${func.line})\n`;
        if (func.documentation) {
          report += `  - ${func.documentation.Description}\n`;
        }
        report += `  - Usage: \`${func.usage}\`\n`;
      });
      report += `\n`;
    }

    // Built-in Variables
    if (analysis.elements.builtInVariables.length > 0) {
      report += `## Built-in Variables Used\n`;
      analysis.elements.builtInVariables.forEach(variable => {
        report += `- **${variable.name}** (Line ${variable.line})\n`;
        if (variable.documentation) {
          report += `  - ${variable.documentation.Description}\n`;
        }
        report += `  - Usage: \`${variable.usage}\`\n`;
      });
      report += `\n`;
    }

    // Classes
    if (analysis.elements.classes.length > 0) {
      report += `## Classes Used\n`;
      analysis.elements.classes.forEach(cls => {
        report += `- **${cls.name}** (Line ${cls.line})\n`;
        if (cls.documentation) {
          report += `  - ${cls.documentation.Description}\n`;
        }
      });
      report += `\n`;
    }

    // User-defined Functions
    if (analysis.elements.userDefinedFunctions.length > 0) {
      report += `## User-defined Functions\n`;
      analysis.elements.userDefinedFunctions.forEach(func => {
        const params = func.parameters.map(p => p.name).join(', ');
        report += `- **${func.name}(${params})** (Line ${func.line})\n`;
      });
      report += `\n`;
    }

    // Hotkeys
    if (analysis.elements.hotkeys.length > 0) {
      report += `## Hotkeys Defined\n`;
      analysis.elements.hotkeys.forEach(hotkey => {
        const modifiers = hotkey.modifiers.length > 0 ? hotkey.modifiers.join('+') + '+' : '';
        report += `- **${modifiers}${hotkey.key}** (Line ${hotkey.line})\n`;
      });
      report += `\n`;
    }

    // Suggestions
    if (analysis.suggestions.length > 0) {
      report += `## Suggestions\n`;
      analysis.suggestions.forEach(suggestion => {
        report += `- ${suggestion}\n`;
      });
      report += `\n`;
    }

    // Warnings
    if (analysis.warnings.length > 0) {
      report += `## Warnings\n`;
      analysis.warnings.forEach(warning => {
        report += `- ${warning}\n`;
      });
      report += `\n`;
    }

    return report;
  }
} 
