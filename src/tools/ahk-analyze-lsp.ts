import { z } from 'zod';
import { AhkDiagnosticProvider } from '../lsp/diagnostics.js';
import { AhkCompiler } from '../compiler/ahk-compiler.js';
import type { Diagnostic } from '../types/index.js';
import logger from '../logger.js';
import { safeParse } from '../core/validation-middleware.js';

export const AhkLspArgsSchema = z.object({
  code: z.string().min(1, 'AutoHotkey code is required'),
  mode: z.enum(['check', 'fix', 'analyze']).default('check'),
  autoFix: z.boolean().default(true),
  fixLevel: z.enum(['safe', 'aggressive', 'style-only']).default('safe'),
  enableClaudeStandards: z.boolean().default(true),
  showPerformance: z.boolean().default(false),
  returnFixedCode: z.boolean().default(true)
});

export const ahkLspToolDefinition = {
  name: 'AHK_LSP',
  description: `AutoHotkey LSP-style Code Analysis & Auto-Fix

Acts like a Language Server Protocol (LSP) for AutoHotkey v2:
- Real-time code analysis and issue detection
- Automatic safe fixes for common problems
- Performance metrics and detailed diagnostics
- Multiple analysis modes: check, fix, or analyze

Perfect for post-write code improvement and quick issue checking.`,
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'AutoHotkey v2 code to analyze'
      },
      mode: {
        type: 'string',
        enum: ['check', 'fix', 'analyze'],
        description: 'Analysis mode - check: diagnostics only, fix: auto-fix issues, analyze: deep analysis',
        default: 'check'
      },
      autoFix: {
        type: 'boolean',
        description: 'Enable automatic fixing of safe issues',
        default: true
      },
      fixLevel: {
        type: 'string',
        enum: ['safe', 'aggressive', 'style-only'],
        description: 'Level of automatic fixes to apply',
        default: 'safe'
      },
      enableClaudeStandards: {
        type: 'boolean',
        description: 'Enable Claude coding standards validation',
        default: true
      },
      showPerformance: {
        type: 'boolean',
        description: 'Include performance metrics in output',
        default: false
      },
      returnFixedCode: {
        type: 'boolean',
        description: 'Return the fixed code in output',
        default: true
      }
    },
    required: ['code']
  }
};

interface FixableIssue {
  diagnostic: Diagnostic;
  fix?: {
    description: string;
    newText: string;
    range: { start: number; end: number };
  };
}

interface LspResult {
  originalCode: string;
  fixedCode?: string;
  diagnostics: Diagnostic[];
  appliedFixes: Array<{
    description: string;
    line: number;
    before: string;
    after: string;
  }>;
  performance: {
    analysisTime: number;
    tokenCount: number;
    codeComplexity: number;
  };
  summary: {
    totalIssues: number;
    errorsFixed: number;
    warningsFixed: number;
    remainingIssues: number;
  };
}

export class AhkLspTool {
  private diagnosticProvider: AhkDiagnosticProvider;

  constructor() {
    this.diagnosticProvider = new AhkDiagnosticProvider();
  }

  async execute(args: unknown) {
    const parsed = safeParse(args, AhkLspArgsSchema, 'AHK_LSP');
    if (!parsed.success) return parsed.error;

    const startTime = performance.now();

    try {
      const {
        code,
        mode,
        autoFix,
        fixLevel,
        enableClaudeStandards,
        showPerformance,
        returnFixedCode
      } = parsed.data;

      logger.info(`Running AHK LSP analysis in ${mode} mode`);

      // Run analysis
      const result = await this.runLspAnalysis(
        code,
        mode,
        autoFix,
        fixLevel,
        enableClaudeStandards
      );

      // Add performance metrics
      const endTime = performance.now();
      result.performance.analysisTime = Math.round(endTime - startTime);

      // Format output based on mode
      const output = this.formatOutput(result, mode, showPerformance, returnFixedCode);

      return {
        content: [{ type: 'text', text: output }]
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('AHK LSP analysis failed:', error);

      return {
        content: [{
          type: 'text',
          text: `❌ **LSP Analysis Error**\n\n${errorMessage}`
        }],

      };
    }
  }

  private async runLspAnalysis(
    code: string,
    mode: string,
    autoFix: boolean,
    fixLevel: string,
    enableClaudeStandards: boolean
  ): Promise<LspResult> {

    // Get diagnostics
    const diagnostics = await this.diagnosticProvider.getDiagnostics(
      code,
      enableClaudeStandards,
      'all'
    );

    // Get performance metrics
    const tokenResult = AhkCompiler.tokenize(code);
    const tokenCount = tokenResult.success ? tokenResult.data?.length || 0 : 0;

    const parseResult = AhkCompiler.parse(code);
    const codeComplexity = this.calculateComplexity(parseResult);

    let fixedCode = code;
    let appliedFixes: Array<{ description: string; line: number; before: string; after: string }> = [];

    // Apply fixes if requested
    if ((mode === 'fix' || autoFix) && diagnostics.length > 0) {
      const fixResult = this.applyFixes(code, diagnostics, fixLevel);
      fixedCode = fixResult.code;
      appliedFixes = fixResult.fixes;
    }

    // Get remaining diagnostics after fixes
    const remainingDiagnostics = fixedCode !== code
      ? await this.diagnosticProvider.getDiagnostics(fixedCode, enableClaudeStandards, 'all')
      : diagnostics;

    return {
      originalCode: code,
      fixedCode: fixedCode !== code ? fixedCode : undefined,
      diagnostics: remainingDiagnostics,
      appliedFixes,
      performance: {
        analysisTime: 0, // Will be set by caller
        tokenCount,
        codeComplexity
      },
      summary: {
        totalIssues: diagnostics.length,
        errorsFixed: appliedFixes.filter(f => f.description.includes('error')).length,
        warningsFixed: appliedFixes.filter(f => f.description.includes('warning')).length,
        remainingIssues: remainingDiagnostics.length
      }
    };
  }

  private applyFixes(code: string, diagnostics: Diagnostic[], fixLevel: string): {
    code: string;
    fixes: Array<{ description: string; line: number; before: string; after: string }>
  } {
    const lines = code.split('\n');
    const appliedFixes: Array<{ description: string; line: number; before: string; after: string }> = [];

    // Sort diagnostics by line number (descending) to avoid offset issues
    const sortedDiagnostics = [...diagnostics].sort((a, b) => b.range.start.line - a.range.start.line);

    for (const diagnostic of sortedDiagnostics) {
      const fix = this.generateFix(diagnostic, lines, fixLevel);
      if (fix) {
        const lineIndex = diagnostic.range.start.line;
        const originalLine = lines[lineIndex];
        lines[lineIndex] = fix.newText;

        appliedFixes.push({
          description: fix.description,
          line: lineIndex + 1,
          before: originalLine.trim(),
          after: fix.newText.trim()
        });
      }
    }

    return {
      code: lines.join('\n'),
      fixes: appliedFixes.reverse() // Restore original order
    };
  }

  private generateFix(diagnostic: Diagnostic, lines: string[], fixLevel: string): {
    description: string;
    newText: string;
  } | null {
    const line = lines[diagnostic.range.start.line];
    const message = diagnostic.message;

    // Safe fixes (always apply)
    if (fixLevel === 'safe' || fixLevel === 'aggressive') {

      // Fix assignment operator (= → :=)
      if (message.includes('Use ":=" for assignment')) {
        const fixed = line.replace(/(\w+)\s*=\s*([^=])/, '$1 := $2');
        if (fixed !== line) {
          return {
            description: 'Fixed assignment operator (= → :=)',
            newText: fixed
          };
        }
      }

      // Add #Requires directive
      if (message.includes('#Requires AutoHotkey v2') && diagnostic.range.start.line === 0) {
        return {
          description: 'Added #Requires AutoHotkey v2 directive',
          newText: '#Requires AutoHotkey v2.0\n' + line
        };
      }

      // Fix command-style to function-style
      if (message.includes('Use function-call syntax')) {
        const match = line.match(/^(\s*)(\w+)\s+(.+)$/);
        if (match) {
          const [, indent, cmd, args] = match;
          return {
            description: `Fixed command style: ${cmd} → ${cmd}()`,
            newText: `${indent}${cmd}(${args})`
          };
        }
      }
    }

    // Style-only fixes
    if (fixLevel === 'style-only' || fixLevel === 'aggressive') {

      // Fix indentation
      if (message.includes('Expected') && message.includes('spaces')) {
        const expectedMatch = message.match(/Expected (\d+) spaces/);
        if (expectedMatch) {
          const expectedSpaces = parseInt(expectedMatch[1]);
          const trimmed = line.trimStart();
          return {
            description: `Fixed indentation (${expectedSpaces} spaces)`,
            newText: ' '.repeat(expectedSpaces) + trimmed
          };
        }
      }
    }

    return null;
  }

  private calculateComplexity(parseResult: any): number {
    if (!parseResult.success || !parseResult.data) return 0;

    // Simple complexity calculation based on statement types
    let complexity = 1; // Base complexity

    const countComplexStatements = (statements: any[]): number => {
      let count = 0;
      for (const stmt of statements) {
        switch (stmt.type) {
          case 'IfStatement':
          case 'WhileStatement':
          case 'ForStatement':
          case 'TryStatement':
            count += 2;
            break;
          case 'ClassDeclaration':
            count += 1;
            if (stmt.methods) {
              count += countComplexStatements(stmt.methods);
            }
            break;
          case 'FunctionDeclaration':
            count += 1;
            break;
          default:
            count += 0.5;
        }
      }
      return count;
    };

    complexity += countComplexStatements(parseResult.data.body || []);
    return Math.round(complexity);
  }

  private formatOutput(result: LspResult, mode: string, showPerformance: boolean, returnFixedCode: boolean): string {
    const { diagnostics, appliedFixes, performance, summary } = result;

    let output = '';

    // Header with mode indicator
    const modeEmoji = mode === 'check' ? '🔍' : mode === 'fix' ? '🔧' : '📊';
    output += `${modeEmoji} **AutoHotkey LSP Analysis** (${mode} mode)\n\n`;

    // Performance metrics (if requested)
    if (showPerformance) {
      output += `⚡ **Performance**\n`;
      output += `- Analysis time: ${performance.analysisTime}ms\n`;
      output += `- Tokens processed: ${performance.tokenCount}\n`;
      output += `- Code complexity: ${performance.codeComplexity}\n\n`;
    }

    // Summary
    output += `📈 **Summary**\n`;
    output += `- Total issues found: ${summary.totalIssues}\n`;
    if (appliedFixes.length > 0) {
      output += `- Fixes applied: ${appliedFixes.length}\n`;
      output += `- Remaining issues: ${summary.remainingIssues}\n`;
    }
    output += '\n';

    // Applied fixes
    if (appliedFixes.length > 0) {
      output += `✅ **Applied Fixes** (${appliedFixes.length})\n\n`;
      appliedFixes.forEach((fix, i) => {
        output += `**${i + 1}.** Line ${fix.line}: ${fix.description}\n`;
        output += `   Before: \`${fix.before}\`\n`;
        output += `   After:  \`${fix.after}\`\n\n`;
      });
    }

    // Remaining diagnostics
    if (diagnostics.length > 0) {
      output += `🔍 **Remaining Issues** (${diagnostics.length})\n\n`;

      const errors = diagnostics.filter(d => d.severity === 1);
      const warnings = diagnostics.filter(d => d.severity === 2);
      const info = diagnostics.filter(d => d.severity === 3);

      if (errors.length > 0) {
        output += `### ❌ Errors (${errors.length})\n\n`;
        errors.forEach((diag, i) => {
          output += `**${i + 1}.** Line ${diag.range.start.line + 1}, Column ${diag.range.start.character + 1}: ${diag.message}\n`;
          if (diag.code) output += `*Code: ${diag.code}*\n`;
          output += `*Source: ${diag.source}*\n\n`;
        });
      }

      if (warnings.length > 0) {
        output += `### ⚠️ Warnings (${warnings.length})\n\n`;
        warnings.forEach((diag, i) => {
          output += `**${i + 1}.** Line ${diag.range.start.line + 1}, Column ${diag.range.start.character + 1}: ${diag.message}\n`;
          if (diag.code) output += `*Code: ${diag.code}*\n`;
          output += `*Source: ${diag.source}*\n\n`;
        });
      }

      if (info.length > 0) {
        output += `### ℹ️ Information (${info.length})\n\n`;
        info.forEach((diag, i) => {
          output += `**${i + 1}.** Line ${diag.range.start.line + 1}, Column ${diag.range.start.character + 1}: ${diag.message}\n`;
          if (diag.code) output += `*Code: ${diag.code}*\n`;
          output += `*Source: ${diag.source}*\n\n`;
        });
      }
    } else {
      output += `🎉 **No issues found!** Your code looks great.\n\n`;
    }

    // Fixed code (if requested and available)
    if (returnFixedCode && result.fixedCode && result.fixedCode !== result.originalCode) {
      output += `📝 **Fixed Code**\n\n`;
      output += '```autohotkey\n';
      output += result.fixedCode;
      output += '\n```\n\n';
    }

    // Quick tips
    if (mode === 'check') {
      output += `💡 **Tip**: Use \`mode: "fix"\` to automatically apply safe fixes.\n`;
    }

    return output;
  }
}