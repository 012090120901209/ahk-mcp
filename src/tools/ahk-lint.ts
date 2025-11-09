/**
 * AHK_Lint Tool
 *
 * Comprehensive code quality analysis for AutoHotkey v2 scripts
 * with tiered linting levels, caching, and optional auto-fix.
 */

import { z } from 'zod';
import logger from '../logger.js';
import { activeFile } from '../core/active-file.js';
import { safeParse } from '../core/validation-middleware.js';
import { codeQualityManager, LintLevel } from '../core/linting/code-quality-manager.js';
import { structureAnalyzer } from '../core/linting/structure-analyzer.js';

// ===== Schema Definition =====

export const AhkLintArgsSchema = z.object({
  filePath: z.string()
    .optional()
    .describe('Path to .ahk file to lint (defaults to active file)'),

  level: z.enum(['fast', 'standard', 'thorough'])
    .default('standard')
    .describe('Analysis depth: fast (syntax), standard (+structure), thorough (+semantics)'),

  includeStructure: z.boolean()
    .default(true)
    .describe('Include code structure map in output'),

  forceRefresh: z.boolean()
    .default(false)
    .describe('Bypass cache and force fresh analysis'),

  autoFix: z.boolean()
    .default(false)
    .describe('Automatically fix issues (not yet implemented)'),

  outputFormat: z.enum(['text', 'json'])
    .default('text')
    .describe('Output format: text (markdown) or json (structured)')
});

// ===== Tool Definition =====

export const ahkLintToolDefinition = {
  name: 'AHK_Lint',
  description: `Comprehensive code quality analysis for AutoHotkey v2 scripts with tiered linting levels and intelligent caching.

**Quick Start:**
\`\`\`json
{ "filePath": "MyScript.ahk" }
\`\`\`

**Lint Levels:**

🏃 **fast** (15ms): Basic syntax validation
- Balanced braces/parentheses
- Unterminated strings
- V1 syntax detection

🚶 **standard** (45ms): Syntax + Structure (default)
- All fast checks
- Class/function extraction
- Code metrics
- Complexity analysis

🔍 **thorough** (180ms): Full semantic analysis
- All standard checks
- Deep complexity warnings
- Maintainability suggestions
- Large class detection

**Examples:**

Fast syntax check:
\`\`\`json
{
  "filePath": "MyScript.ahk",
  "level": "fast"
}
\`\`\`

Full analysis with structure map:
\`\`\`json
{
  "filePath": "MyScript.ahk",
  "level": "thorough",
  "includeStructure": true
}
\`\`\`

Force fresh analysis (bypass cache):
\`\`\`json
{
  "filePath": "MyScript.ahk",
  "forceRefresh": true
}
\`\`\`

**Performance:**
- Cached results: ~5ms
- Uncached: 15-180ms depending on level
- Cache automatically invalidates on file changes

**See also:** AHK_Diagnostics, AHK_File_View, AHK_Smart_Orchestrator`,

  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to .ahk file (defaults to active file)'
      },
      level: {
        type: 'string',
        enum: ['fast', 'standard', 'thorough'],
        default: 'standard',
        description: 'Analysis depth'
      },
      includeStructure: {
        type: 'boolean',
        default: true,
        description: 'Include code structure map'
      },
      forceRefresh: {
        type: 'boolean',
        default: false,
        description: 'Bypass cache'
      },
      autoFix: {
        type: 'boolean',
        default: false,
        description: 'Auto-fix issues (coming soon)'
      },
      outputFormat: {
        type: 'string',
        enum: ['text', 'json'],
        default: 'text',
        description: 'Output format'
      }
    }
  }
};

// ===== Tool Implementation =====

export class AhkLintTool {
  async execute(args: unknown): Promise<any> {
    const startTime = Date.now();

    // Validate arguments
    const parsed = safeParse(args, AhkLintArgsSchema, 'AHK_Lint');
    if (!parsed.success) {
      return parsed.error;
    }

    const validatedArgs = parsed.data;

    try {
      // Determine file path
      const filePath = validatedArgs.filePath || activeFile.activeFilePath;

      if (!filePath) {
        return {
          content: [{
            type: 'text',
            text: '❌ **No File Specified**\n\nPlease provide a `filePath` parameter or set an active file first using AHK_File_Active.'
          }],
          isError: true
        };
      }

      // Validate .ahk extension
      if (!filePath.toLowerCase().endsWith('.ahk')) {
        return {
          content: [{
            type: 'text',
            text: `❌ **Invalid File Type**\n\nFile must have .ahk extension. Got: ${filePath}`
          }],
          isError: true
        };
      }

      logger.info(`Running code quality analysis on ${filePath} (level: ${validatedArgs.level})`);

      // Check if auto-fix is requested (not yet implemented)
      if (validatedArgs.autoFix) {
        return {
          content: [{
            type: 'text',
            text: '⚠️ **Auto-Fix Not Yet Implemented**\n\nAuto-fix functionality is coming soon. For now, the tool will analyze and suggest fixes without applying them.'
          }],
          isError: false
        };
      }

      // Run code quality analysis
      const report = await codeQualityManager.analyzeFile(filePath, {
        level: validatedArgs.level as LintLevel,
        forceRefresh: validatedArgs.forceRefresh,
        includeStructure: validatedArgs.includeStructure
      });

      const totalDuration = Date.now() - startTime;

      // Format output
      if (validatedArgs.outputFormat === 'json') {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: report.errors.length === 0 ? 'passed' : 'failed',
              filePath: report.filePath,
              level: report.level,
              duration: totalDuration,
              cached: report.cached,
              summary: {
                errors: report.errors.length,
                warnings: report.warnings.length,
                suggestions: report.suggestions.length
              },
              errors: report.errors,
              warnings: report.warnings,
              suggestions: report.suggestions,
              structure: report.structure,
              metrics: report.structure?.metrics
            }, null, 2)
          }]
        };
      }

      // Text format (markdown)
      const formattedReport = codeQualityManager.formatReport(report);

      // Add structure outline if available and requested
      let content = formattedReport;

      if (validatedArgs.includeStructure && report.structure) {
        content += '\n---\n\n';
        content += structureAnalyzer.generateOutline(report.structure);
      }

      // Add cache info
      content += '\n---\n\n';
      content += `**Analysis Time:** ${totalDuration}ms ${report.cached ? '⚡ (from cache)' : ''}`;

      return {
        content: [{
          type: 'text',
          text: content
        }]
      };

    } catch (error) {
      logger.error('AHK_Lint execution error:', error);

      return {
        content: [{
          type: 'text',
          text: `❌ **Linting Failed**\n\n${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
}
