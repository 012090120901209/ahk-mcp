import { z } from 'zod';
import { AhkAnalyzeTool } from './ahk-analyze-code.js';
import { AhkDiagnosticsTool } from './ahk-analyze-diagnostics.js';
import { AhkLspTool } from './ahk-analyze-lsp.js';
import { AhkVSCodeProblemsTool } from './ahk-analyze-vscode.js';
import logger from '../logger.js';
import { safeParse } from '../core/validation-middleware.js';
import { createErrorResponse } from '../utils/response-helpers.js';

export const AhkAnalyzeUnifiedArgsSchema = z.object({
  code: z.string().min(1, 'AutoHotkey code is required'),
  mode: z.enum(['quick', 'deep', 'fix', 'complete', 'vscode']).default('quick'),

  // Analysis options
  includeDocumentation: z.boolean().default(true),
  includeUsageExamples: z.boolean().default(false),
  analyzeComplexity: z.boolean().default(true),

  // Diagnostic options
  enableClaudeStandards: z.boolean().default(true),
  severityFilter: z.enum(['error', 'warning', 'info', 'all']).default('all'),

  // LSP/Fix options
  autoFix: z.boolean().default(false),
  fixLevel: z.enum(['safe', 'aggressive', 'style-only']).default('safe'),
  returnFixedCode: z.boolean().default(true),

  // VS Code integration
  includeVSCodeProblems: z.boolean().default(false),

  // Output options
  showPerformance: z.boolean().default(false),
  format: z.enum(['detailed', 'summary', 'json']).default('detailed')
});

export const ahkAnalyzeUnifiedToolDefinition = {
  name: 'AHK_Analyze_Unified',
  description: `Unified AutoHotkey Code Analysis & Improvement Tool

Combines analysis, diagnostics, auto-fixing, and VS Code integration into one powerful tool.

**Modes:**
- \`quick\`: Fast diagnostics and basic analysis
- \`deep\`: Comprehensive analysis with documentation
- \`fix\`: Analysis + automatic issue fixing
- \`complete\`: Full analysis pipeline (analyze → diagnose → fix)
- \`vscode\`: VS Code problems integration

**Workflow:** Instead of using 4+ separate tools, this handles the entire analysis pipeline in one call.`,
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'AutoHotkey v2 code to analyze'
      },
      mode: {
        type: 'string',
        enum: ['quick', 'deep', 'fix', 'complete', 'vscode'],
        description: 'Analysis mode - determines which operations to perform',
        default: 'quick'
      },
      includeDocumentation: {
        type: 'boolean',
        description: 'Include documentation for built-in elements',
        default: true
      },
      includeUsageExamples: {
        type: 'boolean',
        description: 'Include usage examples in analysis',
        default: false
      },
      analyzeComplexity: {
        type: 'boolean',
        description: 'Include complexity analysis',
        default: true
      },
      enableClaudeStandards: {
        type: 'boolean',
        description: 'Enable Claude coding standards validation',
        default: true
      },
      severityFilter: {
        type: 'string',
        enum: ['error', 'warning', 'info', 'all'],
        description: 'Filter diagnostics by severity level',
        default: 'all'
      },
      autoFix: {
        type: 'boolean',
        description: 'Automatically apply safe fixes',
        default: false
      },
      fixLevel: {
        type: 'string',
        enum: ['safe', 'aggressive', 'style-only'],
        description: 'Level of automatic fixes to apply',
        default: 'safe'
      },
      returnFixedCode: {
        type: 'boolean',
        description: 'Return the fixed code in output',
        default: true
      },
      includeVSCodeProblems: {
        type: 'boolean',
        description: 'Include VS Code problems integration',
        default: false
      },
      showPerformance: {
        type: 'boolean',
        description: 'Include performance metrics',
        default: false
      },
      format: {
        type: 'string',
        enum: ['detailed', 'summary', 'json'],
        description: 'Output format style',
        default: 'detailed'
      }
    },
    required: ['code']
  }
};

interface UnifiedAnalysisResult {
  mode: string;
  performance: {
    totalTime: number;
    analysisTime?: number;
    diagnosticsTime?: number;
    fixTime?: number;
    vscodeTime?: number;
  };
  analysis?: any;
  diagnostics?: any;
  fixes?: {
    applied: number;
    remaining: number;
    fixedCode?: string;
    details: Array<{
      line: number;
      description: string;
      before: string;
      after: string;
    }>;
  };
  vscode?: any;
  summary: {
    codeQuality: 'excellent' | 'good' | 'needs-work' | 'poor';
    totalIssues: number;
    issuesFixed: number;
    complexity: number;
    recommendations: string[];
  };
}

export class AhkAnalyzeUnifiedTool {
  private analyzeTool: AhkAnalyzeTool;
  private diagnosticsTool: AhkDiagnosticsTool;
  private lspTool: AhkLspTool;
  private vscodeTool: AhkVSCodeProblemsTool;

  constructor() {
    this.analyzeTool = new AhkAnalyzeTool();
    this.diagnosticsTool = new AhkDiagnosticsTool();
    this.lspTool = new AhkLspTool();
    this.vscodeTool = new AhkVSCodeProblemsTool();
  }

  async execute(args: unknown) {
    const parsed = safeParse(args, AhkAnalyzeUnifiedArgsSchema, 'AHK_Analyze_Unified');
    if (!parsed.success) return parsed.error;

    const startTime = performance.now();

    try {
      const validatedArgs = parsed.data;
      const { mode, code } = validatedArgs;

      logger.info(`Running unified AHK analysis in ${mode} mode`);

      // Create a version with all defaults applied for strict typing
      const argsWithDefaults = {
        code: validatedArgs.code,
        mode: validatedArgs.mode ?? 'quick' as const,
        includeDocumentation: validatedArgs.includeDocumentation ?? true,
        includeUsageExamples: validatedArgs.includeUsageExamples ?? false,
        analyzeComplexity: validatedArgs.analyzeComplexity ?? true,
        enableClaudeStandards: validatedArgs.enableClaudeStandards ?? true,
        severityFilter: validatedArgs.severityFilter ?? 'all' as const,
        autoFix: validatedArgs.autoFix ?? false,
        fixLevel: validatedArgs.fixLevel ?? 'safe' as const,
        returnFixedCode: validatedArgs.returnFixedCode ?? true,
        includeVSCodeProblems: validatedArgs.includeVSCodeProblems ?? false,
        showPerformance: validatedArgs.showPerformance ?? false,
        format: validatedArgs.format ?? 'detailed' as const
      };

      const result = await this.runUnifiedAnalysis(argsWithDefaults);

      // Calculate total time
      result.performance.totalTime = Math.round(performance.now() - startTime);

      // Format output
      const output = this.formatOutput(result, argsWithDefaults.format);

      return {
        content: [{ type: 'text', text: output }]
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Unified AHK analysis failed:', error);

      return {
        content: [{
          type: 'text',
          text: `❌ **Unified Analysis Error**\n\n${errorMessage}`
        }],

      };
    }
  }

  private async runUnifiedAnalysis(args: z.infer<typeof AhkAnalyzeUnifiedArgsSchema>): Promise<UnifiedAnalysisResult> {
    const result: UnifiedAnalysisResult = {
      mode: args.mode,
      performance: { totalTime: 0 },
      summary: {
        codeQuality: 'good',
        totalIssues: 0,
        issuesFixed: 0,
        complexity: 0,
        recommendations: []
      }
    };

    // Phase 1: Always run diagnostics for issue detection
    const diagStart = performance.now();
    const diagnosticsResult = await this.diagnosticsTool.execute({
      code: args.code,
      enableClaudeStandards: args.enableClaudeStandards,
      severity: args.severityFilter
    });
    result.performance.diagnosticsTime = Math.round(performance.now() - diagStart);
    result.diagnostics = diagnosticsResult;

    // Extract issue count for summary
    const diagText = diagnosticsResult.content[0]?.text || '';
    const issueMatch = diagText.match(/Found (\d+) issue\(s\)/);
    result.summary.totalIssues = issueMatch ? parseInt(issueMatch[1]) : 0;

    // Phase 2: Run based on mode
    switch (args.mode) {
      case 'quick':
        // Just diagnostics (already done)
        break;

      case 'deep':
      case 'complete':
        // Add full analysis
        const analysisStart = performance.now();
        const analysisArgs = {
          code: args.code,
          format: args.format ?? 'detailed' as const,
          includeDocumentation: args.includeDocumentation ?? true,
          includeUsageExamples: args.includeUsageExamples ?? false,
          analyzeComplexity: args.analyzeComplexity ?? true,
          enableClaudeStandards: args.enableClaudeStandards ?? true,
          severityFilter: args.severityFilter ?? 'all' as const,
          autoFix: args.autoFix ?? false,
          fixLevel: args.fixLevel ?? 'safe' as const,
          returnFixedCode: args.returnFixedCode ?? true,
          includeVSCodeProblems: args.includeVSCodeProblems ?? false,
          showPerformance: args.showPerformance ?? false
        };
        result.analysis = await this.analyzeTool.execute(analysisArgs);
        result.performance.analysisTime = Math.round(performance.now() - analysisStart);

        // Extract complexity for summary
        const analysisText = result.analysis.content[0]?.text || '';
        const complexityMatch = analysisText.match(/Complexity Score:\*\* (\d+)/);
        result.summary.complexity = complexityMatch ? parseInt(complexityMatch[1]) : 0;

        if (args.mode === 'complete') {
          // Fall through to fix mode
        } else {
          break;
        }

      case 'fix':
        // Apply fixes using LSP tool
        const fixStart = performance.now();
        const lspResult = await this.lspTool.execute({
          code: args.code,
          mode: 'fix',
          autoFix: args.autoFix,
          fixLevel: args.fixLevel,
          enableClaudeStandards: args.enableClaudeStandards,
          returnFixedCode: args.returnFixedCode,
          showPerformance: args.showPerformance
        });
        result.performance.fixTime = Math.round(performance.now() - fixStart);

        // Parse LSP results for fixes
        const lspText = lspResult.content[0]?.text || '';
        const fixesMatch = lspText.match(/Fixes applied: (\d+)/);
        const remainingMatch = lspText.match(/Remaining issues: (\d+)/);

        result.fixes = {
          applied: fixesMatch ? parseInt(fixesMatch[1]) : 0,
          remaining: remainingMatch ? parseInt(remainingMatch[1]) : result.summary.totalIssues,
          details: this.extractFixDetails(lspText),
          fixedCode: this.extractFixedCode(lspText)
        };

        result.summary.issuesFixed = result.fixes.applied;
        break;

      case 'vscode':
        // Add VS Code integration
        const vscodeStart = performance.now();
        result.vscode = await this.vscodeTool.execute({
          content: args.code,
          severity: args.severityFilter,
          limit: 50,
          format: 'summary'
        });
        result.performance.vscodeTime = Math.round(performance.now() - vscodeStart);
        break;
    }

    // Calculate overall quality assessment
    result.summary.codeQuality = this.assessCodeQuality(result);
    result.summary.recommendations = this.generateRecommendations(result);

    return result;
  }

  private extractFixDetails(lspText: string): Array<{ line: number; description: string; before: string; after: string }> {
    const fixes: Array<{ line: number; description: string; before: string; after: string }> = [];
    const fixSection = lspText.match(/Applied Fixes.*?(?=\n\n|\n(?:[🔍📝💡]|$))/s);

    if (fixSection) {
      const fixMatches = fixSection[0].matchAll(/\*\*(\d+)\.\*\* Line (\d+): (.+?)\n.*?Before: `(.+?)`\n.*?After: `(.+?)`/g);
      for (const match of fixMatches) {
        fixes.push({
          line: parseInt(match[2]),
          description: match[3],
          before: match[4],
          after: match[5]
        });
      }
    }

    return fixes;
  }

  private extractFixedCode(lspText: string): string | undefined {
    const codeMatch = lspText.match(/```autohotkey\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1] : undefined;
  }

  private assessCodeQuality(result: UnifiedAnalysisResult): 'excellent' | 'good' | 'needs-work' | 'poor' {
    const { totalIssues, complexity } = result.summary;

    if (totalIssues === 0 && complexity <= 5) return 'excellent';
    if (totalIssues <= 2 && complexity <= 10) return 'good';
    if (totalIssues <= 5 && complexity <= 15) return 'needs-work';
    return 'poor';
  }

  private generateRecommendations(result: UnifiedAnalysisResult): string[] {
    const recommendations: string[] = [];
    const { totalIssues, issuesFixed, complexity, codeQuality } = result.summary;

    if (totalIssues > issuesFixed) {
      recommendations.push(`Address ${totalIssues - issuesFixed} remaining code issues`);
    }

    if (complexity > 10) {
      recommendations.push('Consider breaking down complex functions for better maintainability');
    }

    if (codeQuality === 'poor') {
      recommendations.push('Consider major refactoring to improve code quality');
    }

    if (!result.analysis && result.mode !== 'quick') {
      recommendations.push('Run deep analysis for comprehensive code insights');
    }

    if (result.fixes && result.fixes.applied > 0) {
      recommendations.push('Review auto-applied fixes to ensure they meet your requirements');
    }

    return recommendations;
  }

  private formatOutput(result: UnifiedAnalysisResult, format: string): string {
    if (format === 'json') {
      return JSON.stringify(result, null, 2);
    }

    if (format === 'summary') {
      return this.formatSummaryOutput(result);
    }

    // Detailed format (default)
    return this.formatDetailedOutput(result);
  }

  private formatSummaryOutput(result: UnifiedAnalysisResult): string {
    const { summary, performance } = result;
    const qualityEmoji = {
      excellent: '🎉',
      good: '✅',
      'needs-work': '⚠️',
      poor: '❌'
    }[summary.codeQuality];

    return `${qualityEmoji} **Code Quality: ${summary.codeQuality.toUpperCase()}**

📊 **Quick Stats**
- Issues found: ${summary.totalIssues}
- Issues fixed: ${summary.issuesFixed}
- Complexity: ${summary.complexity}
- Analysis time: ${performance.totalTime}ms

${summary.recommendations.length > 0 ? `💡 **Recommendations**\n${summary.recommendations.map(r => `- ${r}`).join('\n')}` : '🎯 **No additional recommendations**'}`;
  }

  private formatDetailedOutput(result: UnifiedAnalysisResult): string {
    let output = `🔬 **Unified AutoHotkey Analysis** (${result.mode} mode)\n\n`;

    // Performance section
    if (result.performance.totalTime) {
      output += `⚡ **Performance**\n`;
      output += `- Total time: ${result.performance.totalTime}ms\n`;
      if (result.performance.analysisTime) output += `- Analysis: ${result.performance.analysisTime}ms\n`;
      if (result.performance.diagnosticsTime) output += `- Diagnostics: ${result.performance.diagnosticsTime}ms\n`;
      if (result.performance.fixTime) output += `- Fixes: ${result.performance.fixTime}ms\n`;
      if (result.performance.vscodeTime) output += `- VS Code: ${result.performance.vscodeTime}ms\n`;
      output += '\n';
    }

    // Summary section
    const qualityEmoji = {
      excellent: '🎉',
      good: '✅',
      'needs-work': '⚠️',
      poor: '❌'
    }[result.summary.codeQuality];

    output += `${qualityEmoji} **Code Quality Assessment: ${result.summary.codeQuality.toUpperCase()}**\n\n`;
    output += `📈 **Summary**\n`;
    output += `- Total issues: ${result.summary.totalIssues}\n`;
    output += `- Issues fixed: ${result.summary.issuesFixed}\n`;
    output += `- Code complexity: ${result.summary.complexity}\n\n`;

    // Fixes section
    if (result.fixes && result.fixes.applied > 0) {
      output += `🔧 **Applied Fixes** (${result.fixes.applied})\n\n`;
      result.fixes.details.forEach((fix, i) => {
        output += `**${i + 1}.** Line ${fix.line}: ${fix.description}\n`;
        output += `   Before: \`${fix.before}\`\n`;
        output += `   After:  \`${fix.after}\`\n\n`;
      });
    }

    // Include relevant sections from individual tools
    if (result.analysis) {
      output += `\n---\n\n📊 **Detailed Analysis**\n\n`;
      output += result.analysis.content[0]?.text + '\n';
    }

    if (result.diagnostics) {
      output += `\n---\n\n🔍 **Diagnostics**\n\n`;
      output += result.diagnostics.content[0]?.text + '\n';
    }

    if (result.vscode) {
      output += `\n---\n\n🔗 **VS Code Integration**\n\n`;
      output += result.vscode.content[0]?.text + '\n';
    }

    // Fixed code
    if (result.fixes?.fixedCode) {
      output += `\n📝 **Fixed Code**\n\n`;
      output += '```autohotkey\n';
      output += result.fixes.fixedCode;
      output += '\n```\n\n';
    }

    // Recommendations
    if (result.summary.recommendations.length > 0) {
      output += `💡 **Recommendations**\n`;
      result.summary.recommendations.forEach(rec => {
        output += `- ${rec}\n`;
      });
      output += '\n';
    }

    return output;
  }
}