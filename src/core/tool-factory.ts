import { AhkDiagnosticsTool } from '../tools/ahk-analyze-diagnostics.js';
import { AhkSummaryTool } from '../tools/ahk-analyze-summary.js';
import { AhkPromptsTool } from '../tools/ahk-docs-prompts.js';
import { AhkAnalyzeTool } from '../tools/ahk-analyze-code.js';
import { AhkContextInjectorTool } from '../tools/ahk-docs-context.js';
import { AhkSamplingEnhancer } from '../tools/ahk-docs-samples.js';
import { AhkDebugAgentTool } from '../tools/ahk-run-debug.js';
import { AhkDocSearchTool } from '../tools/ahk-docs-search.js';
import { AhkVSCodeProblemsTool } from '../tools/ahk-analyze-vscode.js';
import { AhkRunTool } from '../tools/ahk-run-script.js';
import { AhkRecentTool } from '../tools/ahk-file-recent.js';
import { AhkConfigTool } from '../tools/ahk-system-config.js';
import { AhkActiveFileTool } from '../tools/ahk-active-file.js';
import { AhkLspTool } from '../tools/ahk-analyze-lsp.js';
import { AhkFileViewTool } from '../tools/ahk-file-view.js';
import { AhkFileListTool } from '../tools/ahk-file-list.js';
import { AhkAutoFileTool } from '../tools/ahk-file-detect.js';
import { AhkProcessRequestTool } from '../tools/ahk-run-process.js';
import { AhkFileTool } from '../tools/ahk-file-active.js';
import { AhkFileCreateTool } from '../tools/ahk-file-create.js';
import { AhkEditTool } from '../tools/ahk-file-edit.js';
import { AhkDiffEditTool } from '../tools/ahk-file-edit-diff.js';
import { AhkSettingsTool } from '../tools/ahk-system-settings.js';
import { AhkAlphaTool } from '../tools/ahk-system-alpha.js';
import { AhkFileEditorTool } from '../tools/ahk-file-edit-advanced.js';
import { AhkSmallEditTool } from '../tools/ahk-file-edit-small.js';
import { AhkAnalyticsTool } from '../tools/ahk-system-analytics.js';
import { AhkTestInteractiveTool } from '../tools/ahk-test-interactive.js';
import { AhkSmartOrchestratorTool } from '../tools/ahk-smart-orchestrator.js';
import { ToolRegistry as CoreToolRegistry } from './tool-registry.js';

/**
 * Base interface for all tools
 */
interface ITool {
  execute(args?: any): Promise<any>;
}

/**
 * Tool registry entry containing constructor and metadata
 */
interface ToolRegistryEntry {
  constructor: new () => ITool;
  toolName: string;
}

/**
 * Registry for all available tools
 */
class ToolRegistry {
  private tools = new Map<string, ToolRegistryEntry>();

  /**
   * Register a tool with the factory
   */
  register<T extends ITool>(
    toolName: string,
    constructor: new () => T
  ): void {
    this.tools.set(toolName, { constructor, toolName });
  }

  /**
   * Create a tool instance by name
   */
  create(toolName: string): ITool {
    const entry = this.tools.get(toolName);
    if (!entry) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    return new entry.constructor();
  }

  /**
   * Get all registered tool names
   */
  getRegisteredTools(): string[] {
    return Array.from(this.tools.keys());
  }
}

/**
 * Tool factory interface for creating and managing tool instances
 */
export interface IToolFactory {
  createDiagnosticsTool(): AhkDiagnosticsTool;
  createSummaryTool(): AhkSummaryTool;
  createPromptsTool(): AhkPromptsTool;
  createAnalyzeTool(): AhkAnalyzeTool;
  createContextInjectorTool(): AhkContextInjectorTool;
  createSamplingEnhancerTool(): AhkSamplingEnhancer;
  createDebugAgentTool(): AhkDebugAgentTool;
  createDocSearchTool(): AhkDocSearchTool;
  createVSCodeProblemsTool(): AhkVSCodeProblemsTool;
  createRunTool(): AhkRunTool;
  createRecentTool(): AhkRecentTool;
  createConfigTool(): AhkConfigTool;
  createActiveFileTool(): AhkActiveFileTool;
  createLspTool(): AhkLspTool;
  createFileViewTool(): AhkFileViewTool;
  createFileListTool(): AhkFileListTool;
  createAutoFileTool(): AhkAutoFileTool;
  createProcessRequestTool(): AhkProcessRequestTool;
  createFileTool(): AhkFileTool;
  createFileCreateTool(): AhkFileCreateTool;
  createEditTool(): AhkEditTool;
  createDiffEditTool(): AhkDiffEditTool;
  createSettingsTool(): AhkSettingsTool;
  createAlphaTool(): AhkAlphaTool;
  createFileEditorTool(): AhkFileEditorTool;
  createSmallEditTool(): AhkSmallEditTool;
  createAnalyticsTool(): AhkAnalyticsTool;
  createTestInteractiveTool(): AhkTestInteractiveTool;
  createSmartOrchestratorTool(): AhkSmartOrchestratorTool;
}

/**
 * Concrete implementation of the tool factory using registry pattern
 */
export class ToolFactory implements IToolFactory {
  private registry = new ToolRegistry();

  constructor() {
    this.initializeRegistry();
  }

  /**
   * Initialize the tool registry with all available tools
   */
  private initializeRegistry(): void {
    // Register all tools - this is much cleaner than individual methods
    this.registry.register('AhkDiagnosticsTool', AhkDiagnosticsTool);
    this.registry.register('AhkSummaryTool', AhkSummaryTool);
    this.registry.register('AhkPromptsTool', AhkPromptsTool);
    this.registry.register('AhkAnalyzeTool', AhkAnalyzeTool);
    this.registry.register('AhkContextInjectorTool', AhkContextInjectorTool);
    this.registry.register('AhkSamplingEnhancer', AhkSamplingEnhancer);
    this.registry.register('AhkDebugAgentTool', AhkDebugAgentTool);
    this.registry.register('AhkDocSearchTool', AhkDocSearchTool);
    this.registry.register('AhkVSCodeProblemsTool', AhkVSCodeProblemsTool);
    this.registry.register('AhkRunTool', AhkRunTool);
    this.registry.register('AhkRecentTool', AhkRecentTool);
    this.registry.register('AhkConfigTool', AhkConfigTool);
    this.registry.register('AhkActiveFileTool', AhkActiveFileTool);
    this.registry.register('AhkLspTool', AhkLspTool);
    this.registry.register('AhkFileViewTool', AhkFileViewTool);
    this.registry.register('AhkFileListTool', AhkFileListTool);
    this.registry.register('AhkAutoFileTool', AhkAutoFileTool);
    this.registry.register('AhkProcessRequestTool', AhkProcessRequestTool);
    this.registry.register('AhkFileTool', AhkFileTool);
    this.registry.register('AhkFileCreateTool', AhkFileCreateTool);
    this.registry.register('AhkEditTool', AhkEditTool);
    this.registry.register('AhkDiffEditTool', AhkDiffEditTool);
    this.registry.register('AhkSettingsTool', AhkSettingsTool);
    this.registry.register('AhkAlphaTool', AhkAlphaTool);
    this.registry.register('AhkFileEditorTool', AhkFileEditorTool);
    this.registry.register('AhkSmallEditTool', AhkSmallEditTool);
    this.registry.register('AhkAnalyticsTool', AhkAnalyticsTool);
    this.registry.register('AhkTestInteractiveTool', AhkTestInteractiveTool);
    // Note: AhkSmartOrchestratorTool is handled specially in createSmartOrchestratorTool() due to constructor dependencies
  }

  // All the individual create methods now use the registry
  createDiagnosticsTool(): AhkDiagnosticsTool {
    return this.registry.create('AhkDiagnosticsTool') as AhkDiagnosticsTool;
  }

  createSummaryTool(): AhkSummaryTool {
    return this.registry.create('AhkSummaryTool') as AhkSummaryTool;
  }

  createPromptsTool(): AhkPromptsTool {
    return this.registry.create('AhkPromptsTool') as AhkPromptsTool;
  }

  createAnalyzeTool(): AhkAnalyzeTool {
    return this.registry.create('AhkAnalyzeTool') as AhkAnalyzeTool;
  }

  createContextInjectorTool(): AhkContextInjectorTool {
    return this.registry.create('AhkContextInjectorTool') as AhkContextInjectorTool;
  }

  createSamplingEnhancerTool(): AhkSamplingEnhancer {
    return this.registry.create('AhkSamplingEnhancer') as AhkSamplingEnhancer;
  }

  createDebugAgentTool(): AhkDebugAgentTool {
    return this.registry.create('AhkDebugAgentTool') as AhkDebugAgentTool;
  }

  createDocSearchTool(): AhkDocSearchTool {
    return this.registry.create('AhkDocSearchTool') as AhkDocSearchTool;
  }

  createVSCodeProblemsTool(): AhkVSCodeProblemsTool {
    return this.registry.create('AhkVSCodeProblemsTool') as AhkVSCodeProblemsTool;
  }

  createRunTool(): AhkRunTool {
    return this.registry.create('AhkRunTool') as AhkRunTool;
  }

  createRecentTool(): AhkRecentTool {
    return this.registry.create('AhkRecentTool') as AhkRecentTool;
  }

  createConfigTool(): AhkConfigTool {
    return this.registry.create('AhkConfigTool') as AhkConfigTool;
  }

  createActiveFileTool(): AhkActiveFileTool {
    return this.registry.create('AhkActiveFileTool') as AhkActiveFileTool;
  }

  createLspTool(): AhkLspTool {
    return this.registry.create('AhkLspTool') as AhkLspTool;
  }

  createFileViewTool(): AhkFileViewTool {
    return this.registry.create('AhkFileViewTool') as AhkFileViewTool;
  }

  createFileListTool(): AhkFileListTool {
    return this.registry.create('AhkFileListTool') as AhkFileListTool;
  }

  createAutoFileTool(): AhkAutoFileTool {
    return this.registry.create('AhkAutoFileTool') as AhkAutoFileTool;
  }

  createProcessRequestTool(): AhkProcessRequestTool {
    return this.registry.create('AhkProcessRequestTool') as AhkProcessRequestTool;
  }

  createFileTool(): AhkFileTool {
    return this.registry.create('AhkFileTool') as AhkFileTool;
  }

  createFileCreateTool(): AhkFileCreateTool {
    return this.registry.create('AhkFileCreateTool') as AhkFileCreateTool;
  }

  createEditTool(): AhkEditTool {
    return this.registry.create('AhkEditTool') as AhkEditTool;
  }

  createDiffEditTool(): AhkDiffEditTool {
    return this.registry.create('AhkDiffEditTool') as AhkDiffEditTool;
  }

  createSettingsTool(): AhkSettingsTool {
    return this.registry.create('AhkSettingsTool') as AhkSettingsTool;
  }

  createAlphaTool(): AhkAlphaTool {
    return this.registry.create('AhkAlphaTool') as AhkAlphaTool;
  }

  createFileEditorTool(): AhkFileEditorTool {
    return this.registry.create('AhkFileEditorTool') as AhkFileEditorTool;
  }

  createSmallEditTool(): AhkSmallEditTool {
    return this.registry.create('AhkSmallEditTool') as AhkSmallEditTool;
  }

  createAnalyticsTool(): AhkAnalyticsTool {
    return this.registry.create('AhkAnalyticsTool') as AhkAnalyticsTool;
  }

  createTestInteractiveTool(): AhkTestInteractiveTool {
    return this.registry.create('AhkTestInteractiveTool') as AhkTestInteractiveTool;
  }

  createSmartOrchestratorTool(): AhkSmartOrchestratorTool {
    // Smart Orchestrator requires ToolFactory and ToolRegistry dependencies
    // Create it directly with the required parameters
    // Note: ToolRegistry will be injected from server instance
    return new AhkSmartOrchestratorTool(this, {} as CoreToolRegistry);
  }
}

/**
 * Singleton instance of the tool factory
 */
export const toolFactory = new ToolFactory();
