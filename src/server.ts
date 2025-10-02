import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { initializeDataLoader, getAhkIndex } from './core/loader.js';
import logger from './logger.js';

import { logDebugEvent, logDebugError } from './debug-journal.js';
// Import tool classes and definitions
import { AhkDiagnosticsTool, ahkDiagnosticsToolDefinition } from './tools/ahk-analyze-diagnostics.js';
import { AhkSummaryTool, ahkSummaryToolDefinition } from './tools/ahk-analyze-summary.js';
import { AhkPromptsTool, ahkPromptsToolDefinition, getPromptCatalog } from './tools/ahk-docs-prompts.js';
import { AhkAnalyzeTool, ahkAnalyzeToolDefinition } from './tools/ahk-analyze-code.js';
import { AhkContextInjectorTool, ahkContextInjectorToolDefinition } from './tools/ahk-docs-context.js';
import { AhkSamplingEnhancer, ahkSamplingEnhancerToolDefinition } from './tools/ahk-docs-samples.js';
import { AhkDebugAgentTool, ahkDebugAgentToolDefinition } from './tools/ahk-run-debug.js';
import { AhkDocSearchTool, ahkDocSearchToolDefinition } from './tools/ahk-docs-search.js';
import { AhkVSCodeProblemsTool, ahkVSCodeProblemsToolDefinition } from './tools/ahk-analyze-vscode.js';
import { AhkRunTool, ahkRunToolDefinition } from './tools/ahk-run-script.js';
import { AhkRecentTool, ahkRecentToolDefinition } from './tools/ahk-file-recent.js';
import { AhkConfigTool, ahkConfigToolDefinition } from './tools/ahk-system-config.js';
import { AhkActiveFileTool, ahkActiveFileToolDefinition } from './tools/ahk-active-file.js';
import { AhkLspTool, ahkLspToolDefinition } from './tools/ahk-analyze-lsp.js';
import { AhkFileViewTool, ahkFileViewToolDefinition } from './tools/ahk-file-view.js';
import { AhkAutoFileTool, ahkAutoFileToolDefinition } from './tools/ahk-file-detect.js';
import { AhkProcessRequestTool, ahkProcessRequestToolDefinition } from './tools/ahk-run-process.js';
import { AhkFileTool, ahkFileToolDefinition } from './tools/ahk-file-active.js';
import { AhkEditTool, ahkEditToolDefinition } from './tools/ahk-file-edit.js';
import { AhkDiffEditTool, ahkDiffEditToolDefinition } from './tools/ahk-file-edit-diff.js';
import { AhkSettingsTool, ahkSettingsToolDefinition } from './tools/ahk-system-settings.js';
import { AhkAlphaTool, ahkAlphaToolDefinition } from './tools/ahk-system-alpha.js';
import { AhkFileEditorTool, ahkFileEditorToolDefinition, AhkFileEditorArgs } from './tools/ahk-file-edit-advanced.js';
import { AhkSmallEditTool, ahkSmallEditToolDefinition } from './tools/ahk-file-edit-small.js';
import { autoDetect, activeFile } from './core/active-file.js';
import { toolSettings } from './core/tool-settings.js';
import { toolAnalytics } from './core/tool-analytics.js';
import { orchestrationContext } from './core/orchestration-context.js';
import { resourceSubscriptions } from './core/resource-subscriptions.js';
import { AhkAnalyticsTool, ahkAnalyticsToolDefinition } from './tools/ahk-system-analytics.js';
import { AhkTestInteractiveTool, testInteractiveToolDefinition } from './tools/ahk-test-interactive.js';
import { memoryContextDefinition, handleMemoryContext, MemoryContextArgs } from './tools/ahk-memory-context.js';
import { AhkSmartOrchestratorTool, ahkSmartOrchestratorToolDefinition } from './tools/ahk-smart-orchestrator.js';

export class AutoHotkeyMcpServer {
  private server: Server;
  private ahkDiagnosticsToolInstance: AhkDiagnosticsTool;
  private ahkSummaryToolInstance: AhkSummaryTool;
  private ahkPromptsToolInstance: AhkPromptsTool;
  private ahkAnalyzeToolInstance: AhkAnalyzeTool;
  private ahkContextInjectorToolInstance: AhkContextInjectorTool;
  private ahkSamplingEnhancerToolInstance: AhkSamplingEnhancer;
  private ahkDebugAgentToolInstance: AhkDebugAgentTool;
  private ahkDocSearchToolInstance: AhkDocSearchTool;
  private ahkRunToolInstance: AhkRunTool;
  private ahkVSCodeProblemsToolInstance: AhkVSCodeProblemsTool;
  private ahkRecentToolInstance: AhkRecentTool;
  private ahkConfigToolInstance: AhkConfigTool;
  private ahkActiveFileToolInstance: AhkActiveFileTool;
  private ahkLspToolInstance: AhkLspTool;
  private ahkFileViewToolInstance: AhkFileViewTool;
  private ahkAutoFileToolInstance: AhkAutoFileTool;
  private ahkProcessRequestToolInstance: AhkProcessRequestTool;
  private ahkFileToolInstance: AhkFileTool;
  private ahkEditToolInstance: AhkEditTool;
  private ahkDiffEditToolInstance: AhkDiffEditTool;
  private ahkSettingsToolInstance: AhkSettingsTool;
  private ahkAlphaToolInstance: AhkAlphaTool;
  private ahkFileEditorToolInstance: AhkFileEditorTool;
  private ahkSmallEditToolInstance: AhkSmallEditTool;
  private ahkAnalyticsToolInstance: AhkAnalyticsTool;
  private ahkTestInteractiveToolInstance: AhkTestInteractiveTool;
  private ahkSmartOrchestratorToolInstance: AhkSmartOrchestratorTool;

  constructor() {
    this.server = new Server(
      {
        name: 'ahk-mcp-server',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
          sampling: {},
        },
      }
    );

    // Initialize tool instances
    this.ahkDiagnosticsToolInstance = new AhkDiagnosticsTool();
    this.ahkSummaryToolInstance = new AhkSummaryTool();
    this.ahkPromptsToolInstance = new AhkPromptsTool();
    this.ahkAnalyzeToolInstance = new AhkAnalyzeTool();
    this.ahkContextInjectorToolInstance = new AhkContextInjectorTool();
    this.ahkSamplingEnhancerToolInstance = new AhkSamplingEnhancer();
    this.ahkDebugAgentToolInstance = new AhkDebugAgentTool();
    this.ahkDocSearchToolInstance = new AhkDocSearchTool();
    this.ahkRunToolInstance = new AhkRunTool();
    this.ahkVSCodeProblemsToolInstance = new AhkVSCodeProblemsTool();
    this.ahkRecentToolInstance = new AhkRecentTool();
    this.ahkConfigToolInstance = new AhkConfigTool();
    this.ahkActiveFileToolInstance = new AhkActiveFileTool();
    this.ahkLspToolInstance = new AhkLspTool();
    this.ahkFileViewToolInstance = new AhkFileViewTool();
    this.ahkAutoFileToolInstance = new AhkAutoFileTool();
    this.ahkProcessRequestToolInstance = new AhkProcessRequestTool();
    this.ahkFileToolInstance = new AhkFileTool();
    this.ahkEditToolInstance = new AhkEditTool();
    this.ahkDiffEditToolInstance = new AhkDiffEditTool();
    this.ahkSettingsToolInstance = new AhkSettingsTool();
    this.ahkAlphaToolInstance = new AhkAlphaTool();
    this.ahkFileEditorToolInstance = new AhkFileEditorTool();
    this.ahkSmallEditToolInstance = new AhkSmallEditTool();
    this.ahkAnalyticsToolInstance = new AhkAnalyticsTool();
    this.ahkTestInteractiveToolInstance = new AhkTestInteractiveTool();
    this.ahkSmartOrchestratorToolInstance = new AhkSmartOrchestratorTool();

    this.setupToolHandlers();
    this.setupPromptHandlers();
    this.setupResourceHandlers();
  }

  /**
   * Setup MCP tool handlers
   */
  private setupToolHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Listing available AutoHotkey tools');

      // Check if we're in SSE mode (for ChatGPT compatibility)
      const useSSE = process.argv.includes('--sse') || process.env.PORT;
      logDebugEvent('tools.list', { status: 'start', message: useSSE ? 'Including SSE-specific tools' : 'Standard tool listing' });

      // Get active file context
      const activeFilePath = activeFile.getActiveFile();
      const activeFileContext = activeFilePath ? `\n\n📎 **Active File:** ${activeFilePath}` : '';

      const standardTools = [
        ahkSmartOrchestratorToolDefinition, // SMART ORCHESTRATOR - Reduces tool calls
        ahkFileEditorToolDefinition, // PRIMARY FILE EDITING TOOL - Listed first for priority
        ahkEditToolDefinition,
        ahkFileToolDefinition,
        ahkDiffEditToolDefinition,
        ahkDiagnosticsToolDefinition,
        ahkRunToolDefinition,
        ahkAnalyzeToolDefinition,
        ahkContextInjectorToolDefinition,
        ahkSummaryToolDefinition,
        ahkPromptsToolDefinition,
        ahkSamplingEnhancerToolDefinition,
        ahkDebugAgentToolDefinition,
        ahkDocSearchToolDefinition,
        ahkVSCodeProblemsToolDefinition,
        ahkRecentToolDefinition,
        ahkConfigToolDefinition,
        ahkActiveFileToolDefinition,
        ahkLspToolDefinition,
        ahkFileViewToolDefinition,
        ahkAutoFileToolDefinition,
        ahkProcessRequestToolDefinition,
        ahkSettingsToolDefinition,
        ahkSmallEditToolDefinition,
        ahkAlphaToolDefinition,
        ahkAnalyticsToolDefinition,
        testInteractiveToolDefinition,
        memoryContextDefinition,
      ].map(tool => {
        // Add active file context to file-related tools
        if (activeFilePath && tool.name.startsWith('AHK_File')) {
          return {
            ...tool,
            description: tool.description + activeFileContext
          };
        }
        return tool;
      });

      // Add ChatGPT-compatible tools when in SSE mode
      const chatGPTTools = useSSE ? [
        {
          name: 'search',
          description: 'Search AutoHotkey v2 documentation and code examples',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for AutoHotkey documentation'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'fetch',
          description: 'Fetch detailed AutoHotkey documentation for a specific item',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique identifier for the AutoHotkey documentation item'
              }
            },
            required: ['id']
          }
        }
      ] : [];
      const tools = [...standardTools, ...chatGPTTools];
      logDebugEvent('tools.list', { status: 'success', message: `Returned ${tools.length} tools`, details: { mode: useSSE ? 'sse' : 'stdio' } });

      return {
        tools,
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();

      logDebugEvent('tools.call', { status: 'start', message: name, details: {
        hasArgs: Boolean(args && typeof args === 'object' && Object.keys(args as Record<string, unknown>).length),
        argCount: args && typeof args === 'object' ? Object.keys(args as Record<string, unknown>).length : 0,
        toolType: name.split('_')[1] || 'unknown'
      } });
      logger.info(`🔧 Tool called: ${name}`);
      logger.debug(`🔧 Tool arguments:`, args);
      
      // AUTO-DETECT FILE PATHS IN ANY TOOL INPUT (if enabled)
      // Check all string arguments for potential file paths
      if (toolSettings.isFileDetectionAllowed() && args && typeof args === 'object') {
        for (const value of Object.values(args)) {
          if (typeof value === 'string') {
            autoDetect(value);
          }
        }
      }

      try {
        let result: any;

        switch (name) {
          case 'AHK_Smart_Orchestrator':
            result = await this.ahkSmartOrchestratorToolInstance.execute(args as any);
            break;

          case 'AHK_File_Edit_Advanced':
            result = await this.ahkFileEditorToolInstance.execute(args as AhkFileEditorArgs);
            break;

          case 'AHK_Diagnostics':
            result = await this.ahkDiagnosticsToolInstance.execute(args as any);
            break;

          case 'AHK_Summary':
            result = await this.ahkSummaryToolInstance.execute();
            break;

          case 'AHK_Prompts':
            result = await this.ahkPromptsToolInstance.execute();
            break;

          case 'AHK_Analyze':
            result = await this.ahkAnalyzeToolInstance.execute(args as any);
            break;

          case 'AHK_Context_Injector':
            result = await this.ahkContextInjectorToolInstance.execute(args as any);
            break;

          case 'AHK_Sampling_Enhancer':
            result = await this.ahkSamplingEnhancerToolInstance.execute(args as any);
            break;

          case 'AHK_Debug_Agent':
            result = await this.ahkDebugAgentToolInstance.execute(args as any);
            break;

          case 'AHK_Doc_Search':
            result = await this.ahkDocSearchToolInstance.execute(args as any);
            break;

          case 'AHK_Run':
            result = await this.ahkRunToolInstance.execute(args as any);
            break;

          case 'AHK_VSCode_Problems':
            result = await this.ahkVSCodeProblemsToolInstance.execute(args as any);
            break;

          case 'AHK_File_Recent':
            result = await this.ahkRecentToolInstance.execute(args as any);
            break;

          case 'AHK_Config':
            result = await this.ahkConfigToolInstance.execute(args as any);
            break;

          case 'AHK_Active_File':
            result = await this.ahkActiveFileToolInstance.execute(args as any);
            break;

          case 'AHK_LSP':
            result = await this.ahkLspToolInstance.execute(args as any);
            break;

          case 'AHK_File_View':
            result = await this.ahkFileViewToolInstance.execute(args as any);
            break;

          case 'AHK_File_Detect':
            result = await this.ahkAutoFileToolInstance.execute(args as any);
            break;

          case 'AHK_Process_Request':
            result = await this.ahkProcessRequestToolInstance.execute(args as any);
            break;

          case 'AHK_File_Active':
            result = await this.ahkFileToolInstance.execute(args as any);
            break;

          case 'AHK_File_Edit':
            result = await this.ahkEditToolInstance.execute(args as any);
            break;

          case 'AHK_File_Edit_Diff':
            result = await this.ahkDiffEditToolInstance.execute(args as any);
            break;

          case 'AHK_Settings':
            result = await this.ahkSettingsToolInstance.execute(args as any);
            break;

          case 'AHK_File_Edit_Small':
            result = await this.ahkSmallEditToolInstance.execute(args as any);
            break;

          case 'AHK_Alpha':
            result = await this.ahkAlphaToolInstance.execute(args as any);
            break;

          case 'AHK_Analytics':
            result = await this.ahkAnalyticsToolInstance.execute(args as any);
            break;

          case 'AHK_Test_Interactive':
            result = await this.ahkTestInteractiveToolInstance.execute(args as any);
            break;

          case 'AHK_Memory_Context':
            result = await handleMemoryContext(args as MemoryContextArgs);
            break;

          // ChatGPT-compatible tools (SSE mode only)
          case 'search':
            result = await this.ahkDocSearchToolInstance.execute({
              query: (args as any).query,
              category: 'auto',
              limit: 10
            });
            break;

          case 'fetch': {
            const fetchResult = await this.ahkDocSearchToolInstance.execute({
              query: (args as any).id,
              category: 'auto',
              limit: 5
            });

            if (fetchResult.content && fetchResult.content.length > 0) {
              const searchData = JSON.parse(fetchResult.content[0].text);
              const results = searchData.results || [];
              const firstResult = results.find((r: any) => r.id === (args as any).id) || results[0];

              if (firstResult) {
                const docResponse = {
                  id: firstResult.id,
                  title: firstResult.title,
                  text: firstResult.description || firstResult.summary || 'AutoHotkey documentation item',
                  url: firstResult.url,
                  metadata: { source: 'autohotkey_docs', version: 'v2' }
                };

                result = {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify(docResponse)
                    }
                  ]
                };
                break;
              }
            }

            result = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    id: (args as any).id,
                    title: 'AutoHotkey Documentation Item',
                    text: 'Documentation not found for this item. Try searching for related terms.',
                    url: `https://www.autohotkey.com/docs/v2/search.htm?q=${(args as any).id}`,
                    metadata: { source: 'autohotkey_docs', version: 'v2' }
                  })
                }
              ]
            };
            break;
          }

          default:
            logger.error(`Unknown tool: ${name}`);
            throw new Error(`Unknown tool: ${name}`);
        }

        const duration = Date.now() - startTime;

        // Record analytics
        toolAnalytics.recordCall(name, true, duration);

        logDebugEvent('tools.call', { status: 'success', message: name, details: {
          duration,
          hasResult: Boolean(result && result.content && result.content.length > 0)
        } });
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        // Record analytics for failure
        toolAnalytics.recordCall(name, false, duration, error as Error);

        logger.error(`Error executing tool ${name}:`, error);
        logDebugError('tools.call', error, { details: { tool: name } });
        throw error;
      }
    });
  }

  /**
   * Setup MCP prompt handlers
   */
  private setupPromptHandlers(): void {
    // List prompts handler
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      logger.debug('Listing available AutoHotkey prompts');
      logDebugEvent('prompts.list', { status: 'start', message: 'Gathering prompt catalog' });
      const prompts = await getPromptCatalog();

      const promptList = prompts.map((prompt) => {
        const description = prompt.source === 'module' && prompt.module
          ? `AutoHotkey v2 module prompt from ${prompt.module}`
          : `AutoHotkey v2: ${prompt.title}`;

        return {
          name: this.createPromptName(prompt.slug ?? prompt.title),
          description,
          arguments: []
        };
      });

      // Add coding context prompt
      promptList.push({
        name: 'ahk-coding-context',
        description: 'AutoHotkey v2 elite coding standards with cognitive tier system (Thinking/Ultrathink)',
        arguments: []
      });

      logDebugEvent('prompts.list', { status: 'success', message: `Returned ${promptList.length} prompts` });

      return {
        prompts: promptList,
      };

    });

    // Get prompt handler
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name } = request.params;

      logger.info(`Getting prompt: ${name}`);
      logDebugEvent('prompts.get', { status: 'start', message: name });

      // Handle coding context prompt
      if (name === 'ahk-coding-context') {
        const fs = await import('fs/promises');
        const path = await import('path');

        try {
          const currentDir = process.cwd();
          let projectRoot = currentDir;

          while (projectRoot !== path.dirname(projectRoot)) {
            try {
              await fs.access(path.join(projectRoot, 'package.json'));
              break;
            } catch {
              projectRoot = path.dirname(projectRoot);
            }
          }

          const instructionsPath = path.join(projectRoot, 'docs', 'Modules', 'Module_Instructions.md');
          const content = await fs.readFile(instructionsPath, 'utf-8');

          logDebugEvent('prompts.get', { status: 'success', message: name });

          return {
            description: 'AutoHotkey v2 Elite Coding Standards',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: content
                }
              }
            ]
          };
        } catch (error) {
          logger.error('Failed to load Module_Instructions.md:', error);
          throw new Error('Coding context not available');
        }
      }

      const prompts = await getPromptCatalog();
      const prompt = prompts.find((p) => this.createPromptName(p.slug ?? p.title) === name);

      if (!prompt) {
        logDebugEvent('prompts.get', { status: 'error', message: `Prompt not found: ${name}` });
        throw new Error(`Prompt not found: ${name}`);
      }

      logDebugEvent('prompts.get', { status: 'success', message: name });

      return {
        description: prompt.title,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: prompt.body
            }
          }
        ]
      };
    });
  }

  /**
   * Create a URL-safe prompt name from title
   */
  private createPromptName(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove unsupported characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-{2,}/g, '-') // Collapse multiple hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
  private normalizeResourceUri(uri: string): string {
    if (!uri) {
      return uri;
    }

    const colonIndex = uri.indexOf(':');
    const schemeIndex = uri.indexOf('://');

    if (colonIndex > -1 && (schemeIndex === -1 || colonIndex < schemeIndex)) {
      const possibleUri = uri.slice(colonIndex + 1);
      if (possibleUri.startsWith('ahk://')) {
        return possibleUri;
      }
    }

    return uri;
  }


  /**
   * Setup MCP resource handlers for automatic context injection
   */
  private setupResourceHandlers(): void {
    // List resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      logger.debug('Listing available AutoHotkey resources');
      logDebugEvent('resources.list', { status: 'start', message: 'Enumerating exposed resources' });

      const resources = [
        {
          uri: 'ahk://instructions/coding-standards',
          name: 'AHK v2 Elite Coding Standards',
          description: 'Comprehensive AutoHotkey v2 coding instructions with cognitive tier system (Thinking/Ultrathink), module routing, and best practices',
          mimeType: 'text/markdown'
        },
        {
          uri: 'ahk://context/auto',
          name: 'AutoHotkey Auto-Context',
          description: 'Automatically provides relevant AutoHotkey documentation based on detected keywords',
          mimeType: 'text/markdown'
        },
        {
          uri: 'ahk://docs/functions',
          name: 'AutoHotkey Functions Reference',
          description: 'Complete reference of AutoHotkey v2 built-in functions',
          mimeType: 'application/json'
        },
        {
          uri: 'ahk://docs/variables',
          name: 'AutoHotkey Variables Reference',
          description: 'Complete reference of AutoHotkey v2 built-in variables',
          mimeType: 'application/json'
        },
        {
          uri: 'ahk://docs/classes',
          name: 'AutoHotkey Classes Reference',
          description: 'Complete reference of AutoHotkey v2 built-in classes',
          mimeType: 'application/json'
        },
        {
          uri: 'ahk://docs/methods',
          name: 'AutoHotkey Methods Reference',
          description: 'Complete reference of AutoHotkey v2 built-in methods',
          mimeType: 'application/json'
        },
        {
          uri: 'ahk://templates/file-system-watcher',
          name: 'File System Watcher Template',
          description: 'AutoHotkey v2 script template for monitoring file system changes',
          mimeType: 'text/plain'
        },
        {
          uri: 'ahk://templates/clipboard-manager',
          name: 'Clipboard Manager Template',
          description: 'AutoHotkey v2 script template for clipboard management',
          mimeType: 'text/plain'
        },
        {
          uri: 'ahk://templates/cpu-monitor',
          name: 'CPU Monitor Template',
          description: 'AutoHotkey v2 script template for system monitoring',
          mimeType: 'text/plain'
        },
        {
          uri: 'ahk://templates/hotkey-toggle',
          name: 'Hotkey Toggle Template',
          description: 'AutoHotkey v2 script template for hotkey management',
          mimeType: 'text/plain'
        },
        {
          uri: 'ahk://system/clipboard',
          name: 'Live Clipboard Content',
          description: 'Real-time clipboard content (read-only)',
          mimeType: 'text/plain'
        },
        {
          uri: 'ahk://system/info',
          name: 'System Information',
          description: 'Current system information and AutoHotkey environment',
          mimeType: 'application/json'
        }
        ];

      logDebugEvent('resources.list', { status: 'success', message: `Returned ${resources.length} resources` });

      return {
        resources,
      };
    });

    // Read resource handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const normalizedUri = this.normalizeResourceUri(uri);
      const baseDetails = uri !== normalizedUri ? { requested: uri, normalized: normalizedUri } : undefined;
      const mergeDetails = (details?: Record<string, unknown>): Record<string, unknown> | undefined => {
        return baseDetails ? { ...baseDetails, ...(details ?? {}) } : details;
      };

      logger.info(`Reading resource: ${normalizedUri}`);
      logDebugEvent('resources.read', { status: 'start', message: normalizedUri, details: mergeDetails() });

      // Track resource subscription
      resourceSubscriptions.subscribe(normalizedUri);

      if (normalizedUri === 'ahk://instructions/coding-standards') {
        const fs = await import('fs/promises');
        const path = await import('path');

        try {
          const currentDir = process.cwd();
          let projectRoot = currentDir;

          while (projectRoot !== path.dirname(projectRoot)) {
            try {
              await fs.access(path.join(projectRoot, 'package.json'));
              break;
            } catch {
              projectRoot = path.dirname(projectRoot);
            }
          }

          const instructionsPath = path.join(projectRoot, 'docs', 'Modules', 'Module_Instructions.md');
          const content = await fs.readFile(instructionsPath, 'utf-8');

          logDebugEvent('resources.read', { status: 'success', message: normalizedUri, details: mergeDetails({ kind: 'coding-standards' }) });

          return {
            contents: [
              {
                uri,
                mimeType: 'text/markdown',
                text: content
              }
            ]
          };
        } catch (error) {
          logger.error('Failed to load Module_Instructions.md:', error);
          return {
            contents: [
              {
                uri,
                mimeType: 'text/markdown',
                text: '# AutoHotkey v2 Coding Standards\n\nCoding standards not available. Use AHK_Context_Injector tool for module-based guidance.'
              }
            ]
          };
        }
      }

      if (normalizedUri === 'ahk://context/auto') {
        // This would normally be triggered by analyzing user input
        // For now, return a placeholder
        logDebugEvent('resources.read', { status: 'success', message: normalizedUri, details: mergeDetails({ kind: 'auto-context' }) });
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: '## 🎯 AutoHotkey Context Available\n\nUse the `AHK_Context_Injector` tool to analyze your prompts and get relevant AutoHotkey documentation automatically injected.'
            }
          ]
        };
      }

      if (normalizedUri === 'ahk://docs/functions') {
        const ahkIndex = getAhkIndex();
        logDebugEvent('resources.read', { status: 'success', message: normalizedUri, details: mergeDetails({ kind: 'functions' }) });
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(ahkIndex?.functions || [], null, 2)
            }
          ]
        };
      }

      if (normalizedUri === 'ahk://docs/variables') {
        const ahkIndex = getAhkIndex();
        logDebugEvent('resources.read', { status: 'success', message: normalizedUri, details: mergeDetails({ kind: 'variables' }) });
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json', 
              text: JSON.stringify(ahkIndex?.variables || [], null, 2)
            }
          ]
        };
      }

      if (normalizedUri === 'ahk://docs/classes') {
        const ahkIndex = getAhkIndex();
        logDebugEvent('resources.read', { status: 'success', message: normalizedUri, details: mergeDetails({ kind: 'classes' }) });
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(ahkIndex?.classes || [], null, 2)
            }
          ]
        };
      }

      if (normalizedUri === 'ahk://docs/methods') {
        const ahkIndex = getAhkIndex();
        logDebugEvent('resources.read', { status: 'success', message: normalizedUri, details: mergeDetails({ kind: 'methods' }) });
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(ahkIndex?.methods || [], null, 2)
            }
          ]
        };
      }

      // Script templates
      if (normalizedUri === 'ahk://templates/file-system-watcher') {
        logDebugEvent('resources.read', { status: 'success', message: normalizedUri, details: mergeDetails({ kind: 'template', name: 'file-system-watcher' }) });
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `; AutoHotkey v2 File System Watcher Template
; Monitors a directory for file changes and triggers callbacks

class FileSystemWatcher {
    __New(directory, callback) {
        this.directory := directory
        this.callback := callback
        this.timer := ObjBindMethod(this, "CheckChanges")
        this.lastModified := Map()
        this.Initialize()
    }
    
    Initialize() {
        ; Store initial state
        Loop Files, this.directory "\\*.*", "R" {
            this.lastModified[A_LoopFileFullPath] := A_LoopFileTimeModified
        }
        ; Start monitoring
        SetTimer(this.timer, 1000)
    }
    
    CheckChanges() {
        currentFiles := Map()
        
        ; Check all files in directory
        Loop Files, this.directory "\\*.*", "R" {
            currentFiles[A_LoopFileFullPath] := A_LoopFileTimeModified
            
            ; Check if file is new or modified
            if (!this.lastModified.Has(A_LoopFileFullPath)) {
                this.callback.Call("created", A_LoopFileFullPath)
            } else if (this.lastModified[A_LoopFileFullPath] != A_LoopFileTimeModified) {
                this.callback.Call("modified", A_LoopFileFullPath)
            }
        }
        
        ; Check for deleted files
        for file, _ in this.lastModified {
            if (!currentFiles.Has(file)) {
                this.callback.Call("deleted", file)
            }
        }
        
        this.lastModified := currentFiles
    }
    
    Stop() {
        SetTimer(this.timer, 0)
    }
}

; Example usage:
; watcher := FileSystemWatcher("C:\\MyFolder", (action, file) => {
;     ToolTip(action ": " file)
;     SetTimer(() => ToolTip(), -2000)
; })
`
            }
          ]
        };
      }

      if (normalizedUri === 'ahk://templates/clipboard-manager') {
        logDebugEvent('resources.read', { status: 'success', message: normalizedUri, details: mergeDetails({ kind: 'template', name: 'clipboard-manager' }) });
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `; AutoHotkey v2 Clipboard Manager Template
; Opens GUI with clipboard content and text transformation options

class ClipboardManager {
    __New() {
        this.CreateGUI()
        this.LoadClipboard()
    }
    
    CreateGUI() {
        this.gui := Gui("+Resize", "Clipboard Manager")
        this.gui.SetFont("s10", "Consolas")
        
        ; Main edit control
        this.editControl := this.gui.Add("Edit", "x10 y10 w400 h300 VScroll")
        
        ; Buttons
        this.gui.Add("Button", "x10 y320 w80 h30 gUpperCase", "UPPER").OnEvent("Click", (*) => this.UpperCase())
        this.gui.Add("Button", "x100 y320 w80 h30 gLowerCase", "lower").OnEvent("Click", (*) => this.LowerCase())
        this.gui.Add("Button", "x190 y320 w80 h30 gTitleCase", "Title Case").OnEvent("Click", (*) => this.TitleCase())
        this.gui.Add("Button", "x280 y320 w80 h30 gSaveClip", "Save to Clipboard").OnEvent("Click", (*) => this.SaveToClipboard())
        this.gui.Add("Button", "x370 y320 w50 h30 gReload", "Reload").OnEvent("Click", (*) => this.LoadClipboard())
        
        ; Status bar
        this.statusBar := this.gui.Add("StatusBar")
        this.statusBar.SetText("Ready")
        
        this.gui.OnEvent("Close", (*) => ExitApp())
        this.gui.Show()
    }
    
    LoadClipboard() {
        this.editControl.Text := A_Clipboard
        this.statusBar.SetText("Clipboard loaded - " StrLen(A_Clipboard) " characters")
    }
    
    UpperCase() {
        this.editControl.Text := StrUpper(this.editControl.Text)
        this.statusBar.SetText("Converted to UPPERCASE")
    }
    
    LowerCase() {
        this.editControl.Text := StrLower(this.editControl.Text)
        this.statusBar.SetText("Converted to lowercase")
    }
    
    TitleCase() {
        this.editControl.Text := StrTitle(this.editControl.Text)
        this.statusBar.SetText("Converted to Title Case")
    }
    
    SaveToClipboard() {
        A_Clipboard := this.editControl.Text
        this.statusBar.SetText("Saved to clipboard - " StrLen(A_Clipboard) " characters")
    }
}

; Create and show clipboard manager
clipManager := ClipboardManager()
`
            }
          ]
        };
      }

      if (normalizedUri === 'ahk://templates/cpu-monitor') {
        logDebugEvent('resources.read', { status: 'success', message: normalizedUri, details: mergeDetails({ kind: 'template', name: 'cpu-monitor' }) });
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `; AutoHotkey v2 CPU Monitor Template
; Displays current CPU usage as an updating tooltip

class CPUMonitor {
    __New() {
        this.Initialize()
    }
    
    Initialize() {
        ; Start monitoring timer
        this.timer := ObjBindMethod(this, "UpdateCPU")
        SetTimer(this.timer, 1000)
        
        ; Initial update
        this.UpdateCPU()
    }
    
    UpdateCPU() {
        try {
            ; Get CPU usage using WMI
            cpuUsage := this.GetCPUUsage()
            
            ; Display as tooltip
            ToolTip("CPU Usage: " cpuUsage "%\\nPress Ctrl+Alt+Q to quit", 10, 10)
        } catch Error as e {
            ToolTip("Error reading CPU: " e.Message, 10, 10)
        }
    }
    
    GetCPUUsage() {
        ; Use WMI to get CPU usage
        for objItem in ComObjGet("winmgmts:").ExecQuery("SELECT * FROM Win32_Processor") {
            return Round(objItem.LoadPercentage, 1)
        }
        return 0
    }
    
    Stop() {
        SetTimer(this.timer, 0)
        ToolTip()
    }
}

; Hotkey to quit
^!q::ExitApp()

; Start CPU monitor
cpuMonitor := CPUMonitor()
`
            }
          ]
        };
      }

      if (normalizedUri === 'ahk://templates/hotkey-toggle') {
        logDebugEvent('resources.read', { status: 'success', message: normalizedUri, details: mergeDetails({ kind: 'template', name: 'hotkey-toggle' }) });
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `; AutoHotkey v2 Hotkey Toggle Template
; Function to toggle any hotkey on/off with visual feedback

class HotkeyManager {
    __New() {
        this.hotkeyStates := Map()
    }
    
    ; Toggle a hotkey on/off
    ToggleHotkey(hotkey, callback, description := "") {
        if (this.hotkeyStates.Has(hotkey)) {
            ; Hotkey exists, toggle it
            if (this.hotkeyStates[hotkey].enabled) {
                this.DisableHotkey(hotkey)
            } else {
                this.EnableHotkey(hotkey)
            }
        } else {
            ; New hotkey, register it
            this.RegisterHotkey(hotkey, callback, description)
        }
    }
    
    RegisterHotkey(hotkey, callback, description := "") {
        try {
            Hotkey(hotkey, callback)
            this.hotkeyStates[hotkey] := {
                enabled: true,
                callback: callback,
                description: description
            }
            this.ShowStatus(hotkey, "ENABLED", description)
        } catch Error as e {
            this.ShowStatus(hotkey, "ERROR: " e.Message)
        }
    }
    
    EnableHotkey(hotkey) {
        if (this.hotkeyStates.Has(hotkey)) {
            try {
                Hotkey(hotkey, "On")
                this.hotkeyStates[hotkey].enabled := true
                this.ShowStatus(hotkey, "ENABLED", this.hotkeyStates[hotkey].description)
            } catch Error as e {
                this.ShowStatus(hotkey, "ERROR: " e.Message)
            }
        }
    }
    
    DisableHotkey(hotkey) {
        if (this.hotkeyStates.Has(hotkey)) {
            try {
                Hotkey(hotkey, "Off")
                this.hotkeyStates[hotkey].enabled := false
                this.ShowStatus(hotkey, "DISABLED", this.hotkeyStates[hotkey].description)
            } catch Error as e {
                this.ShowStatus(hotkey, "ERROR: " e.Message)
            }
        }
    }
    
    ShowStatus(hotkey, status, description := "") {
        message := "Hotkey: " hotkey "\\nStatus: " status
        if (description) {
            message .= "\\nDescription: " description
        }
        ToolTip(message)
        SetTimer(() => ToolTip(), -2000)
    }
    
    ListHotkeys() {
        message := "Registered Hotkeys:\\n"
        for hotkey, state in this.hotkeyStates {
            status := state.enabled ? "ON" : "OFF"
            desc := state.description ? " - " state.description : ""
            message .= hotkey " [" status "]" desc "\\n"
        }
        MsgBox(message, "Hotkey Manager")
    }
}

; Create hotkey manager
hkManager := HotkeyManager()

; Example usage:
; Toggle F1 key
F12::hkManager.ToggleHotkey("F1", (*) => MsgBox("F1 pressed!"), "Example hotkey")

; List all hotkeys
^F12::hkManager.ListHotkeys()
`
            }
          ]
        };
      }

      if (normalizedUri === 'ahk://system/clipboard') {
        logDebugEvent('resources.read', { status: 'success', message: normalizedUri, details: mergeDetails({ kind: 'system' }) });
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: "(Live clipboard access not available in MCP server context)\nUse AutoHotkey scripts with A_Clipboard variable to access clipboard content."
            }
          ]
        };
      }

      if (normalizedUri === 'ahk://system/info') {
        const systemInfo = {
          autohotkeyVersion: "v2.0+",
          operatingSystem: "Windows",
          computerName: "Unknown",
          userName: "Unknown",
          timestamp: new Date().toISOString(),
          processId: process.pid,
          workingDirectory: process.cwd(),
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime()
        };
        
        logDebugEvent('resources.read', { status: 'success', message: normalizedUri, details: mergeDetails({ kind: 'system-info' }) });
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(systemInfo, null, 2)
            }
          ]
        };
      }

      logDebugEvent('resources.read', { status: 'error', message: `Resource not found: ${uri}` });
      throw new Error(`Resource not found: ${uri}`);
    });
  }


  /**
   * Initialize the server and load data
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing AutoHotkey MCP Server...');
      logDebugEvent('server.initialize', { status: 'start', message: 'Loading AutoHotkey documentation' });

      // Load AutoHotkey documentation data
      await initializeDataLoader();

      logger.info('AutoHotkey MCP Server initialized successfully');
      logDebugEvent('server.initialize', { status: 'success', message: 'Documentation cache ready' });
    } catch (error) {
      logger.error('Failed to initialize AutoHotkey MCP Server:', error);
      logDebugError('server.initialize', error);
      throw error;
    }
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      await this.initialize();

      // Check if we should use SSE transport for ChatGPT (via --sse flag or PORT env var)
      const useSSE = process.argv.includes('--sse') || process.env.PORT;

      if (useSSE) {
        const port = parseInt(process.env.PORT || '3000');

        logDebugEvent('server.start', { status: 'start', message: `Launching SSE transport on port ${port}` });

        // Import express for SSE transport
        const express = await import('express');
        const app = express.default();

        app.use(express.default.json());

        // Store active transports by session
        const activeTransports = new Map();

        // Set up SSE endpoint
        app.get('/sse', (req, res) => {
          try {
            // Create SSE transport for this specific response
            const transport = new SSEServerTransport('/message', res);

            // Store the transport for handling POST messages
            const sessionId = transport.sessionId;
            activeTransports.set(sessionId, transport);
            logDebugEvent('transport.sse', { status: 'start', message: `Session ${sessionId} connected` });

            // Connect MCP server to this transport
            this.server.connect(transport).then(() => {
              logger.info(`SSE transport connected with session ID: ${sessionId}`);
              logDebugEvent('transport.sse', { status: 'info', message: `Session ${sessionId} handshake established` });
            }).catch(error => {
              logger.error('Failed to connect SSE transport:', error);
              logDebugError('transport.sse', error, { details: { sessionId, phase: 'connect' } });
              res.status(500).end();
            });

            // Start the SSE connection
            transport.start().then(() => {
              logger.info('SSE transport started successfully');
              logDebugEvent('transport.sse', { status: 'success', message: `Session ${sessionId} streaming` });
            }).catch(error => {
              logger.error('Failed to start SSE transport:', error);
              logDebugError('transport.sse', error, { details: { sessionId, phase: 'start' } });
              res.status(500).end();
            });

            // Clean up on close
            req.on('close', () => {
              activeTransports.delete(sessionId);
              logger.info(`SSE connection closed for session: ${sessionId}`);
              logDebugEvent('transport.sse', { status: 'info', message: `Session ${sessionId} closed` });
            });

          } catch (error) {
            logger.error('Error setting up SSE endpoint:', error);
            logDebugError('transport.sse', error, { details: { phase: 'setup' } });
            res.status(500).end();
          }
        });

        // Handle POST messages to /message endpoint
        app.post('/message', async (req, res) => {
          try {
            logger.debug('Received POST message:', req.body);

            // Try to find the appropriate transport and let it handle the message
            for (const [sessionId, transport] of activeTransports.entries()) {
              try {
                await transport.handlePostMessage(req, res);
                return; // Message handled successfully
              } catch (error) {
                logger.debug(`Transport ${sessionId} couldn't handle message:`, error);
                continue; // Try next transport
              }
            }

            // If no transport handled it, return an error
            logger.error('No active transport could handle the POST message');
            logDebugEvent('transport.sse', { status: 'error', message: 'POST message received without an active transport' });
            res.status(500).json({
              jsonrpc: '2.0',
              error: { code: -32603, message: 'No active transport available' }
            });

          } catch (error) {
            logger.error('Error handling POST message:', error);
            logDebugError('transport.sse', error, { details: { phase: 'post' } });
            res.status(500).json({
              jsonrpc: '2.0',
              error: { code: -32603, message: 'Internal server error' }
            });
          }
        });

        // Start express server
        app.listen(port, () => {
          logger.info(`AutoHotkey MCP Server started with SSE transport on port ${port}`);
          logger.info(`ChatGPT URL: http://localhost:${port}/sse`);
          logDebugEvent('server.start', { status: 'success', message: `SSE transport listening on port ${port}` });
        });
      } else {
        logDebugEvent('server.start', { status: 'start', message: 'Launching stdio transport (Claude Desktop)' });

        // Connect to stdio (for Claude Desktop)
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        logger.info('AutoHotkey MCP Server started and connected to stdio');
        logDebugEvent('server.start', { status: 'success', message: 'Stdio transport ready (Claude Desktop)' });
      }

      // Handle process termination gracefully
      process.on('SIGINT', () => {
        logger.info('Received SIGINT, shutting down gracefully...');
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        logger.info('Received SIGTERM, shutting down gracefully...');
        process.exit(0);
      });

    } catch (error) {
      logger.error('Failed to start AutoHotkey MCP Server:', error);
      process.exit(1);
    }
  }

  /**
   * Get the server instance (for testing)
   */
  getServer(): Server {
    return this.server;
  }
} 

