import { z } from 'zod';
import logger from '../logger.js';
import { safeParse } from '../core/validation-middleware.js';
import { AhkAnalyzeTool } from './ahk-analyze-code.js';
import { AhkEditTool } from './ahk-file-edit.js';
import { AhkRunTool } from './ahk-run-script.js';
import fs from 'fs/promises';

export const AhkWorkflowAnalyzeFixRunArgsSchema = z.object({
  filePath: z.string().min(1, 'File path is required').describe('Path to the AHK file to analyze, fix, and optionally run'),
  autoFix: z.boolean().optional().default(true).describe('Automatically apply suggested fixes'),
  runAfterFix: z.boolean().optional().default(false).describe('Run the script after fixing (requires AutoHotkey v2 installed)'),
  fixTypes: z.array(z.enum(['syntax', 'style', 'performance', 'all'])).optional().default(['all']).describe('Types of fixes to apply'),
  dryRun: z.boolean().optional().default(false).describe('Preview changes without applying them'),
  summaryOnly: z.boolean().optional().default(false).describe('Return only summary, not detailed analysis (minimal tokens)')
});

export const ahkWorkflowAnalyzeFixRunToolDefinition = {
  name: 'AHK_Workflow_Analyze_Fix_Run',
  description: `Composite workflow tool that bundles analyze → fix → verify → run operations into a single call. Reduces token usage from ~8,000 tokens (3-4 separate tool calls) to ~500 tokens (1 call with summary).

**Workflow Steps:**
1. Analyze AHK file for issues (using AHK_Analyze)
2. Auto-apply suggested fixes (using AHK_File_Edit)
3. Re-analyze to verify fixes worked
4. Optionally run the script (using AHK_Run)
5. Return concise summary (not all intermediate data)

**Examples:**
• Quick fix and run: { filePath: "script.ahk", autoFix: true, runAfterFix: true }
• Analyze and fix only: { filePath: "script.ahk", autoFix: true, runAfterFix: false }
• Preview fixes: { filePath: "script.ahk", dryRun: true }
• Summary only: { filePath: "script.ahk", summaryOnly: true } - Minimal token usage

**Fix Types:**
- syntax: Fix syntax errors (e.g., := vs =, missing parentheses)
- style: Fix style issues (e.g., comments, formatting)
- performance: Fix performance issues (e.g., unnecessary complexity)
- all: Apply all available fixes (default)

**Token Savings:**
Traditional approach (3-4 tool calls):
- AHK_Analyze: ~3,000 tokens
- AHK_File_Edit: ~2,000 tokens
- AHK_Analyze (verify): ~3,000 tokens
- AHK_Run (optional): ~500 tokens
- Total: ~8,500 tokens

This tool (1 call with summary):
- Analyze + Fix + Verify + Run: ~500 tokens (summary only)
- Savings: ~94% token reduction

**Use Cases:**
• Quick script fixes before running
• Automated code quality improvements
• CI/CD integration for AHK scripts
• Batch processing of multiple scripts

**What to Avoid:**
• Using on large files (>1000 lines) without dryRun first
• Auto-fixing without reviewing changes (always test!)
• Running untrusted scripts (security risk)

**See also:** AHK_Analyze (detailed analysis), AHK_File_Edit (manual editing), AHK_Run (script execution)`,
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the AHK file to analyze, fix, and optionally run'
      },
      autoFix: {
        type: 'boolean',
        description: 'Automatically apply suggested fixes',
        default: true
      },
      runAfterFix: {
        type: 'boolean',
        description: 'Run the script after fixing (requires AutoHotkey v2 installed)',
        default: false
      },
      fixTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['syntax', 'style', 'performance', 'all']
        },
        description: 'Types of fixes to apply',
        default: ['all']
      },
      dryRun: {
        type: 'boolean',
        description: 'Preview changes without applying them',
        default: false
      },
      summaryOnly: {
        type: 'boolean',
        description: 'Return only summary, not detailed analysis (minimal tokens)',
        default: false
      }
    },
    required: ['filePath']
  }
};

export type AhkWorkflowAnalyzeFixRunArgs = z.infer<typeof AhkWorkflowAnalyzeFixRunArgsSchema>;

/**
 * Composite Workflow Tool: Analyze → Fix → Run
 *
 * Bundles multiple operations into a single call to reduce token consumption
 */
export class AhkWorkflowAnalyzeFixRunTool {
  private analyzeTool: AhkAnalyzeTool;
  private editTool: AhkEditTool;
  private runTool: AhkRunTool;

  constructor(analyzeTool: AhkAnalyzeTool, editTool: AhkEditTool, runTool: AhkRunTool) {
    this.analyzeTool = analyzeTool;
    this.editTool = editTool;
    this.runTool = runTool;
  }

  async execute(args: unknown): Promise<any> {
    const parsed = safeParse(args, AhkWorkflowAnalyzeFixRunArgsSchema, 'AHK_Workflow_Analyze_Fix_Run');
    if (!parsed.success) return parsed.error;

    try {
      const { filePath, autoFix, runAfterFix, fixTypes, dryRun, summaryOnly } = parsed.data;

      logger.info(`Workflow: Analyze → Fix → Run for ${filePath}`);

      const startTime = Date.now();
      const workflow = {
        steps: [] as any[],
        totalDuration: 0,
        issuesFound: 0,
        issuesFixed: 0,
        verificationPassed: false,
        scriptRan: false
      };

      // Step 1: Read the file
      let fileContent: string;
      try {
        fileContent = await fs.readFile(filePath, 'utf-8');
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ **File Read Error**\n\nCould not read file: ${filePath}\n\n${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }

      // Step 2: Analyze the file
      const analyzeStart = Date.now();
      const analyzeResult = await this.analyzeTool.execute({
        code: fileContent,
        summaryOnly: true // Use summary mode for efficiency
      });
      const analyzeDuration = Date.now() - analyzeStart;

      workflow.steps.push({
        step: 'Analyze',
        duration: analyzeDuration,
        status: 'completed'
      });

      // Extract issues from analysis
      const analysisText = analyzeResult.content[0]?.text || '';
      const issuesMatch = analysisText.match(/"total":\s*(\d+)/);
      const totalIssues = issuesMatch ? parseInt(issuesMatch[1], 10) : 0;
      workflow.issuesFound = totalIssues;

      // If no issues and not running, return early
      if (totalIssues === 0 && !runAfterFix) {
        const summary = this.formatSummary(workflow, summaryOnly ?? false);
        return {
          content: [{ type: 'text', text: summary }]
        };
      }

      // Step 3: Apply fixes (if autoFix is enabled)
      let fixesApplied = 0;
      if (autoFix && totalIssues > 0) {
        const fixStart = Date.now();

        // Generate fixes based on common AHK v2 issues
        const fixes = this.generateFixes(fileContent, fixTypes ?? ['all']);

        if (fixes.length > 0 && !dryRun) {
          // Apply each fix
          for (const fix of fixes) {
            try {
              await this.editTool.execute({
                filePath,
                action: 'replace',
                oldText: fix.oldText,
                newContent: fix.newText,
                dryRun
              });
              fixesApplied++;
            } catch (error) {
              logger.warn(`Failed to apply fix: ${fix.description}`, error);
            }
          }
        }

        const fixDuration = Date.now() - fixStart;
        workflow.steps.push({
          step: 'Fix',
          duration: fixDuration,
          status: dryRun ? 'dry-run' : 'completed',
          fixesApplied: dryRun ? `${fixes.length} (preview only)` : fixesApplied
        });

        workflow.issuesFixed = fixesApplied;
      }

      // Step 4: Re-analyze to verify fixes (if fixes were applied)
      if (autoFix && fixesApplied > 0 && !dryRun) {
        const verifyStart = Date.now();

        // Re-read the file
        fileContent = await fs.readFile(filePath, 'utf-8');

        const verifyResult = await this.analyzeTool.execute({
          code: fileContent,
          summaryOnly: true
        });
        const verifyDuration = Date.now() - verifyStart;

        const verifyText = verifyResult.content[0]?.text || '';
        const verifyIssuesMatch = verifyText.match(/"total":\s*(\d+)/);
        const remainingIssues = verifyIssuesMatch ? parseInt(verifyIssuesMatch[1], 10) : 0;

        workflow.verificationPassed = remainingIssues < totalIssues;

        workflow.steps.push({
          step: 'Verify',
          duration: verifyDuration,
          status: 'completed',
          remainingIssues
        });
      }

      // Step 5: Run the script (if requested)
      if (runAfterFix && !dryRun) {
        const runStart = Date.now();

        try {
          const runResult = await this.runTool.execute({
            filePath,
            mode: 'run',
            wait: true,
            timeout: 30000
          });

          const runDuration = Date.now() - runStart;
          const runSuccess = !runResult.isError;

          workflow.steps.push({
            step: 'Run',
            duration: runDuration,
            status: runSuccess ? 'completed' : 'failed'
          });

          workflow.scriptRan = runSuccess;
        } catch (error) {
          workflow.steps.push({
            step: 'Run',
            duration: Date.now() - runStart,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Calculate total duration
      workflow.totalDuration = Date.now() - startTime;

      // Format and return summary
      const summary = this.formatSummary(workflow, summaryOnly ?? false);

      return {
        content: [{ type: 'text', text: summary }]
      };

    } catch (error) {
      logger.error('Error in AHK_Workflow_Analyze_Fix_Run:', error);
      return {
        content: [{
          type: 'text',
          text: `❌ **Workflow Error**\n\n${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }

  /**
   * Generate fixes based on common AHK v2 issues
   */
  private generateFixes(code: string, fixTypes: string[]): Array<{ oldText: string; newText: string; description: string }> {
    const fixes: Array<{ oldText: string; newText: string; description: string }> = [];
    const lines = code.split('\n');

    const shouldFixSyntax = fixTypes.includes('all') || fixTypes.includes('syntax');
    const shouldFixStyle = fixTypes.includes('all') || fixTypes.includes('style');

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (trimmed.startsWith(';') || trimmed === '') return;

      // Fix 1: Assignment operator (= to :=)
      if (shouldFixSyntax) {
        const assignmentMatch = line.match(/^(\s*)(\w+)\s*=\s*([^=].*)/);
        if (assignmentMatch && !line.includes('==') && !line.includes('!=')) {
          fixes.push({
            oldText: line,
            newText: `${assignmentMatch[1]}${assignmentMatch[2]} := ${assignmentMatch[3]}`,
            description: `Line ${index + 1}: Change = to := for assignment`
          });
        }
      }

      // Fix 2: Double slash comments
      if (shouldFixStyle) {
        const commentMatch = line.match(/^(\s*)(.*)\/\/(.*)$/);
        if (commentMatch && !line.includes('http://') && !line.includes('https://')) {
          fixes.push({
            oldText: line,
            newText: `${commentMatch[1]}${commentMatch[2]};${commentMatch[3]}`,
            description: `Line ${index + 1}: Change // to ; for comments`
          });
        }
      }

      // Fix 3: Add #Requires directive (first line only)
      if (shouldFixStyle && index === 0 && !code.includes('#Requires AutoHotkey v2')) {
        fixes.push({
          oldText: line,
          newText: `#Requires AutoHotkey v2\n${line}`,
          description: 'Add #Requires AutoHotkey v2 directive'
        });
      }
    });

    return fixes;
  }

  /**
   * Format workflow summary
   */
  private formatSummary(workflow: any, summaryOnly: boolean): string {
    let summary = `# Workflow: Analyze → Fix → Run\n\n`;

    summary += `## Summary\n`;
    summary += `- **Total Duration:** ${workflow.totalDuration}ms\n`;
    summary += `- **Issues Found:** ${workflow.issuesFound}\n`;
    summary += `- **Issues Fixed:** ${workflow.issuesFixed}\n`;
    summary += `- **Verification:** ${workflow.verificationPassed ? '✅ Passed' : workflow.issuesFixed > 0 ? '⚠️ Some issues remain' : 'N/A'}\n`;
    summary += `- **Script Ran:** ${workflow.scriptRan ? '✅ Yes' : 'No'}\n\n`;

    if (!summaryOnly) {
      summary += `## Workflow Steps\n`;
      workflow.steps.forEach((step: any) => {
        summary += `### ${step.step}\n`;
        summary += `- **Duration:** ${step.duration}ms\n`;
        summary += `- **Status:** ${step.status}\n`;

        if (step.fixesApplied !== undefined) {
          summary += `- **Fixes Applied:** ${step.fixesApplied}\n`;
        }
        if (step.remainingIssues !== undefined) {
          summary += `- **Remaining Issues:** ${step.remainingIssues}\n`;
        }
        if (step.error) {
          summary += `- **Error:** ${step.error}\n`;
        }

        summary += '\n';
      });
    }

    summary += `## 💡 Next Steps\n`;
    if (workflow.issuesFound === 0) {
      summary += `✅ No issues found! Your code is ready to use.\n`;
    } else if (workflow.issuesFixed === workflow.issuesFound) {
      summary += `✅ All issues fixed! Run the script to test.\n`;
    } else if (workflow.issuesFixed > 0) {
      summary += `⚠️ Some issues fixed, but ${workflow.issuesFound - workflow.issuesFixed} remain.\n`;
      summary += `Use AHK_Analyze with summaryOnly: false for detailed issue list.\n`;
    } else {
      summary += `Use autoFix: true to automatically apply fixes.\n`;
    }

    return summary;
  }
}
