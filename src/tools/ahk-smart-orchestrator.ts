import { z } from 'zod';
import { OrchestrationEngine, OrchestrationRequest } from '../core/orchestration-engine.js';
import { ToolFactory } from '../core/tool-factory.js';
import { ToolRegistry } from '../core/tool-registry.js';
import logger from '../logger.js';
import { safeParse } from '../core/validation-middleware.js';

/**
 * Zod schema for Smart Orchestrator tool arguments
 */
export const AhkSmartOrchestratorArgsSchema = z.object({
  intent: z.string().min(1).describe('High-level description of what you want to do (e.g., "edit the _Dark class checkbox methods")'),
  filePath: z.string().optional().describe('Optional: Direct path to AHK file (skips detection if provided)'),
  targetEntity: z.string().optional().describe('Optional: Specific class, method, or function name to focus on (e.g., "_Dark", "_Dark.ColorCheckbox")'),
  operation: z.enum(['view', 'edit', 'analyze']).default('view').describe('Operation type: view (read-only), edit (prepare for editing), analyze (structure only)'),
  forceRefresh: z.boolean().default(false).describe('Force re-analysis even if cached data exists'),
  debugMode: z.boolean().default(false).describe('Show orchestration decision log with timing and cache info')
});

/**
 * MCP tool definition for Smart Orchestrator
 */
export const ahkSmartOrchestratorToolDefinition = {
  name: 'AHK_Smart_Orchestrator',
  description: `Intelligently orchestrates file detection, analysis, and viewing operations to minimize redundant tool calls. Automatically chains detect → analyze → read → edit workflow with smart caching. Reduces tool calls from 7-10 down to 3-4 by maintaining session context.

Use this tool when you want to efficiently work with AHK files without manually coordinating multiple tools.

**Examples:**
• Basic: { intent: "view the _Dark class" } - Auto-detects file, analyzes, shows class code
• Edit mode: { intent: "edit ColorCheckbox method in _Dark", operation: "edit" } - Finds method, prepares for editing
• Debug orchestration: { intent: "analyze file structure", debugMode: true } - Shows decision log with cache hits, timing, and tool call reasons
• Analyze only: { intent: "show all classes", operation: "analyze" } - Returns structure without reading code

**Debug Mode Output:**
When debugMode: true, you'll see:
- [00:00.123] 🔧 Tool: AHK_File_Detect | Reason: No file path provided | Duration: 45ms
- [00:00.234] 🔧 Tool: AHK_Analyze | Cache: HIT ⚡ | Duration: 2ms

**What to Avoid:**
- ❌ Vague intents (e.g., "fix something") → be specific: "edit NotifyUser() in alerts.ahk"
- ❌ Ignoring cache when files change → set forceRefresh: true after external edits
- ❌ Forgetting debugMode when troubleshooting orchestration decisions

**See also:** AHK_File_Detect (manual detection), AHK_Analyze (manual analysis), AHK_File_View (manual reading)`,
  inputSchema: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        description: 'High-level description of what you want to do (e.g., "edit the _Dark class checkbox methods")'
      },
      filePath: {
        type: 'string',
        description: 'Optional: Direct path to AHK file (skips detection if provided)'
      },
      targetEntity: {
        type: 'string',
        description: 'Optional: Specific class, method, or function name to focus on (e.g., "_Dark", "_Dark.ColorCheckbox")'
      },
      operation: {
        type: 'string',
        enum: ['view', 'edit', 'analyze'],
        description: 'Operation type: view (read-only), edit (prepare for editing), analyze (structure only)',
        default: 'view'
      },
      forceRefresh: {
        type: 'boolean',
        description: 'Force re-analysis even if cached data exists',
        default: false
      },
      debugMode: {
        type: 'boolean',
        description: 'Show orchestration decision log with timing and cache info',
        default: false
      }
    },
    required: ['intent']
  }
};

/**
 * Type exports for the tool arguments
 */
export type AhkSmartOrchestratorArgs = z.infer<typeof AhkSmartOrchestratorArgsSchema>;

/**
 * Smart Orchestrator Tool Class
 * 
 * Provides an intelligent interface for file operations that minimizes redundant tool calls
 * by chaining detection → analysis → reading → editing operations with smart caching.
 */
export class AhkSmartOrchestratorTool {
  private orchestrationEngine: OrchestrationEngine;

  constructor(toolFactory: ToolFactory, toolRegistry: ToolRegistry) {
    this.orchestrationEngine = new OrchestrationEngine(toolFactory, toolRegistry);
  }

  /**
   * Execute the smart orchestration request
   */
  async execute(args: unknown) {
    const parsed = safeParse(args, AhkSmartOrchestratorArgsSchema, 'AHK_Smart_Orchestrator');
    if (!parsed.success) return parsed.error;

    try {
      const validatedArgs = parsed.data;
      
      logger.info(`Smart Orchestrator: ${validatedArgs.operation} operation - ${validatedArgs.intent.substring(0, 50)}...`);

      // Build orchestration request
      const request: OrchestrationRequest = {
        intent: validatedArgs.intent,
        filePath: validatedArgs.filePath,
        targetEntity: validatedArgs.targetEntity,
        operation: validatedArgs.operation,
        forceRefresh: validatedArgs.forceRefresh,
        debugMode: validatedArgs.debugMode
      };

      // Process the request through the orchestration engine
      const result = await this.orchestrationEngine.processIntent(request);

      if (result.success) {
        const responseContent = Array.isArray(result.content) ? [...result.content] : [];

        if (validatedArgs.debugMode && result.debugOutput) {
          responseContent.push({
            type: 'text',
            text: result.debugOutput
          });
        }

        return {
          content: responseContent
        };
      } else {
        // Return error with detailed information
        const errorOutput = this.formatErrorOutput(result);
        return {
          content: [{ type: 'text', text: errorOutput }],
          isError: true
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Smart Orchestrator failed:', error);

      return {
        content: [{
          type: 'text',
          text: `❌ **Smart Orchestrator Error**\n\n${errorMessage}`
        }],
        isError: true
      };
    }
  }

  /**
   * Format error output with helpful suggestions
   */
  private formatErrorOutput(result: any): string {
    let output = `❌ **Orchestration Failed**\n\n`;
    output += `🔧 Tool calls made: ${result.toolCalls}\n\n`;
    
    if (result.error) {
      output += `**Error:**\n  ${result.error}\n\n`;
    }

    // Add helpful suggestions based on common error patterns
    output += `**💡 Suggestions:**\n`;
    
    if (result.error?.includes('Could not auto-detect file')) {
      output += `• Provide explicit filePath parameter if detection fails\n`;
      output += `• Include filename in intent (e.g., "view _Dark class in __Lists.ahk")\n`;
    } else if (result.error?.includes('not found in file')) {
      output += `• Use operation: "analyze" to see available entities\n`;
      output += `• Check spelling of class/function name\n`;
      output += `• Verify the correct file is being analyzed\n`;
    } else {
      output += `• Provide explicit filePath parameter if detection fails\n`;
      output += `• Use operation: "analyze" to see available entities\n`;
      output += `• Check that file exists and has .ahk extension\n`;
    }

    // Add debug output if available
    if (result.debugOutput) {
      output += `\n**🔍 Debug Output:**\n${result.debugOutput}`;
    }

    return output;
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return this.orchestrationEngine.getCacheStats();
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.orchestrationEngine.clearCache();
  }
}
