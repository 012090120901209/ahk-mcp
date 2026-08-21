import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import type { Express, NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import {
  CancelledNotificationSchema,
  CallToolRequestSchema,
  CompleteRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  SetLevelRequestSchema,
  isInitializeRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { initializeDataLoader, getAhkIndex } from './core/loader.js';
import logger from './logger.js';
import { ToolRegistry } from './core/tool-registry.js';
import { envConfig } from './core/env-config.js';
import { createErrorResponse, ErrorResponseBuilder, ErrorCode } from './utils/response-helpers.js';
import { TaskManager } from './core/task-manager.js';

import { logDebugEvent, logDebugError } from './debug-journal.js';
import { getUnifiedLogger } from './core/unified-logger.js';
// Import tool classes and definitions
import { AhkDiagnosticsTool } from './tools/ahk-analyze-diagnostics.js';
import { AhkSummaryTool } from './tools/ahk-analyze-summary.js';
import { AhkPromptsTool, getPromptCatalog } from './tools/ahk-docs-prompts.js';
import { AhkAnalyzeTool } from './tools/ahk-analyze-code.js';
import { AhkContextInjectorTool } from './tools/ahk-docs-context.js';
import { AhkSamplingEnhancer } from './tools/ahk-docs-samples.js';
import { AhkDebugAgentTool } from './tools/ahk-run-debug.js';
import { AhkDocSearchTool } from './tools/ahk-docs-search.js';
import { AhkVSCodeProblemsTool } from './tools/ahk-analyze-vscode.js';
import { AhkRunTool } from './tools/ahk-run-script.js';
import { AhkRecentTool } from './tools/ahk-file-recent.js';
import { AhkConfigTool } from './tools/ahk-system-config.js';
import { AhkActiveFileTool } from './tools/ahk-active-file.js';
import { AhkLspTool } from './tools/ahk-analyze-lsp.js';
import { AhkFileViewTool } from './tools/ahk-file-view.js';
import { AhkFileListTool } from './tools/ahk-file-list.js';
import { AhkAutoFileTool } from './tools/ahk-file-detect.js';
import { AhkProcessRequestTool } from './tools/ahk-run-process.js';
import { AhkFileTool } from './tools/ahk-file-active.js';
import { AhkEditTool } from './tools/ahk-file-edit.js';
import { AhkDiffEditTool } from './tools/ahk-file-edit-diff.js';
import { AhkSettingsTool } from './tools/ahk-system-settings.js';
import { AhkVSCodeOpenTool } from './tools/ahk-vscode-open.js';
import { AhkAlphaTool } from './tools/ahk-system-alpha.js';
import { AhkFileEditorTool } from './tools/ahk-file-edit-advanced.js';
import { AhkSmallEditTool } from './tools/ahk-file-edit-small.js';
import { AhkSmartOrchestratorTool } from './tools/ahk-smart-orchestrator.js';
import { AhkFileCreateTool } from './tools/ahk-file-create.js';
import { AhkAnalyticsTool } from './tools/ahk-system-analytics.js';
import { AhkTestInteractiveTool } from './tools/ahk-test-interactive.js';
import { AhkTraceViewerTool } from './tools/ahk-trace-viewer.js';
import { AhkLintTool } from './tools/ahk-lint.js';
import { AhkToolsSearchTool } from './tools/ahk-tools-search.js';
import { AhkWorkflowAnalyzeFixRunTool } from './tools/ahk-workflow-analyze-fix-run.js';
import { AhkThqbyDocumentSymbolsTool } from './tools/ahk-thqby-document-symbols.js';
import { AhkCloudValidateTool } from './tools/ahk-cloud-validate.js';
import { AhkDebugDBGpTool } from './tools/ahk-debug-dbgp.js';
import { autoDetect, getActiveFilePath } from './core/active-file.js';
import { toolSettings } from './core/tool-settings.js';
import { configManager } from './core/path-converter-config.js';
import { pathConverter } from './utils/path-converter.js';
import { pathInterceptor } from './core/path-interceptor.js';
import { observabilityServer } from './core/observability-server.js';
import './core/opentelemetry.js'; // Initialize OpenTelemetry (if enabled)
import { tracer } from './core/tracing.js';
import { getToolDefinitionsWithAnnotations, getToolMetadata } from './core/tool-metadata.js';
import { InMemoryEventStore } from './core/in-memory-event-store.js';

type StreamableSessionEntry = {
  protocol: 'streamable';
  server: Server;
  transport: StreamableHTTPServerTransport;
  createdAt: number;
  lastActivity: number;
};

type SseSessionEntry = {
  protocol: 'sse';
  server: Server;
  transport: SSEServerTransport;
  createdAt: number;
  lastActivity: number;
};

type SessionEntry = StreamableSessionEntry | SseSessionEntry;

export class AutoHotkeyMcpServer {
  private server: Server;
  private toolRegistry: ToolRegistry;
  private taskManager: TaskManager;
  public ahkDiagnosticsToolInstance: AhkDiagnosticsTool;
  public ahkSummaryToolInstance: AhkSummaryTool;
  public ahkPromptsToolInstance: AhkPromptsTool;
  public ahkAnalyzeToolInstance: AhkAnalyzeTool;
  public ahkContextInjectorToolInstance: AhkContextInjectorTool;
  public ahkSamplingEnhancerToolInstance: AhkSamplingEnhancer;
  public ahkDebugAgentToolInstance: AhkDebugAgentTool;
  public ahkDocSearchToolInstance: AhkDocSearchTool;
  public ahkRunToolInstance: AhkRunTool;
  public ahkVSCodeProblemsToolInstance: AhkVSCodeProblemsTool;
  public ahkRecentToolInstance: AhkRecentTool;
  public ahkConfigToolInstance: AhkConfigTool;
  public ahkActiveFileToolInstance: AhkActiveFileTool;
  public ahkLspToolInstance: AhkLspTool;
  public ahkFileViewToolInstance: AhkFileViewTool;
  public ahkFileListToolInstance: AhkFileListTool;
  public ahkAutoFileToolInstance: AhkAutoFileTool;
  public ahkProcessRequestToolInstance: AhkProcessRequestTool;
  public ahkFileToolInstance: AhkFileTool;
  public ahkEditToolInstance: AhkEditTool;
  public ahkDiffEditToolInstance: AhkDiffEditTool;
  public ahkSettingsToolInstance: AhkSettingsTool;
  public ahkVSCodeOpenToolInstance: AhkVSCodeOpenTool;
  public ahkAlphaToolInstance: AhkAlphaTool;
  public ahkFileEditorToolInstance: AhkFileEditorTool;
  public ahkSmallEditToolInstance: AhkSmallEditTool;
  public ahkFileCreateToolInstance: AhkFileCreateTool;
  public ahkSmartOrchestratorToolInstance: AhkSmartOrchestratorTool;
  public ahkAnalyticsToolInstance: AhkAnalyticsTool;
  public ahkTestInteractiveToolInstance: AhkTestInteractiveTool;
  public ahkTraceViewerToolInstance: AhkTraceViewerTool;
  public ahkToolsSearchToolInstance: AhkToolsSearchTool;
  public ahkWorkflowAnalyzeFixRunToolInstance: AhkWorkflowAnalyzeFixRunTool;
  public ahkThqbyDocumentSymbolsToolInstance: AhkThqbyDocumentSymbolsTool;
  public ahkLintToolInstance: AhkLintTool;
  public ahkCloudValidateToolInstance: AhkCloudValidateTool;
  public ahkDebugDBGpToolInstance: AhkDebugDBGpTool;

  constructor() {
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
    this.ahkFileListToolInstance = new AhkFileListTool();
    this.ahkAutoFileToolInstance = new AhkAutoFileTool();
    this.ahkProcessRequestToolInstance = new AhkProcessRequestTool();
    this.ahkFileToolInstance = new AhkFileTool();
    this.ahkEditToolInstance = new AhkEditTool();
    this.ahkDiffEditToolInstance = new AhkDiffEditTool();
    this.ahkSettingsToolInstance = new AhkSettingsTool();
    this.ahkVSCodeOpenToolInstance = new AhkVSCodeOpenTool();
    this.ahkAlphaToolInstance = new AhkAlphaTool();
    this.ahkFileEditorToolInstance = new AhkFileEditorTool();
    this.ahkSmallEditToolInstance = new AhkSmallEditTool();
    this.ahkFileCreateToolInstance = new AhkFileCreateTool();
    this.ahkAnalyticsToolInstance = new AhkAnalyticsTool();
    this.ahkTestInteractiveToolInstance = new AhkTestInteractiveTool();
    this.ahkTraceViewerToolInstance = new AhkTraceViewerTool();
    this.ahkToolsSearchToolInstance = new AhkToolsSearchTool();
    this.ahkThqbyDocumentSymbolsToolInstance = new AhkThqbyDocumentSymbolsTool();
    this.ahkLintToolInstance = new AhkLintTool();
    this.ahkCloudValidateToolInstance = new AhkCloudValidateTool();
    this.ahkDebugDBGpToolInstance = new AhkDebugDBGpTool();

    this.toolRegistry = new ToolRegistry(this);
    this.taskManager = new TaskManager();

    // Initialize workflow tool with dependencies (must be after other tools are initialized)
    this.ahkWorkflowAnalyzeFixRunToolInstance = new AhkWorkflowAnalyzeFixRunTool(
      this.ahkAnalyzeToolInstance,
      this.ahkEditToolInstance,
      this.ahkRunToolInstance,
      this.ahkLspToolInstance
    );

    // Initialize Smart Orchestrator after toolRegistry is created
    this.ahkSmartOrchestratorToolInstance = new AhkSmartOrchestratorTool();

    // Initialize path conversion system
    this.initializePathConversion();

    // Single server instance for stdio mode; HTTP mode creates one server per session.
    this.server = this.createServer();
  }

  private createServer(): Server {
    const server = new Server(
      {
        name: 'ahk-mcp-server',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
          completions: {},
          logging: {},
          tasks: {
            list: {},
            cancel: {},
            requests: {
              tools: {
                call: {},
              },
            },
          },
        },
      }
    );

    this.setupToolHandlers(server);
    this.setupTaskHandlers(server);
    this.setupPromptHandlers(server);
    this.setupResourceHandlers(server);
    this.setupCompletionHandlers(server);
    this.setupLoggingHandlers(server);

    return server;
  }

  /**
   * Setup logging handlers to prevent "Method not found" errors
   */
  private setupLoggingHandlers(server: Server): void {
    // Handle logging/setLevel requests (sent by some clients during initialization)
    // We acknowledge the request but use our own server-side logging
    server.setRequestHandler(SetLevelRequestSchema, async request => {
      const level = request.params.level;
      logger.debug(`Client requested log level: ${level} (using server-side logging)`);
      return {};
    });

    server.setNotificationHandler(CancelledNotificationSchema, async notification => {
      logger.info(
        `Client cancelled request ${notification.params.requestId ?? 'unknown'}: ${notification.params.reason ?? 'no reason provided'}`
      );
    });
  }

  /**
   * Setup MCP tool handlers
   */
  private setupToolHandlers(server: Server): void {
    // List tools handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Listing available AutoHotkey tools');

      // Check if we're in SSE mode (for ChatGPT compatibility)
      const useSSE = envConfig.useSSEMode();
      logDebugEvent('tools.list', {
        status: 'start',
        message: useSSE ? 'Including SSE-specific tools' : 'Standard tool listing',
      });

      const standardTools = getToolDefinitionsWithAnnotations();
      const metadataIndex = new Map(getToolMetadata().map(entry => [entry.definition.name, entry]));
      const activeFileAwareNames = new Set(
        getToolMetadata()
          .filter(entry => entry.category === 'file')
          .map(entry => entry.definition.name)
      );
      const activeFilePath = getActiveFilePath();
      const activeFileNote = `\n\n📎 Active File: ${activeFilePath ?? 'Not set. Use AHK_File_Active to select a target.'}`;

      const contextualTools = standardTools.map(tool => {
        if (!activeFileAwareNames.has(tool.name)) {
          return tool;
        }

        const metadata = metadataIndex.get(tool.name);
        const suffix = metadata?.category === 'file' ? activeFileNote : '';

        return {
          ...tool,
          description: `${tool.description}${suffix}`,
        };
      });

      // Add ChatGPT-compatible tools when in SSE mode
      const chatGPTTools = useSSE
        ? [
            {
              name: 'search',
              description: 'Search AutoHotkey v2 documentation and code examples',
              inputSchema: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'Search query for AutoHotkey documentation',
                  },
                },
                required: ['query'],
              },
            },
            {
              name: 'fetch',
              description: 'Fetch detailed AutoHotkey documentation for a specific item',
              inputSchema: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'Unique identifier for the AutoHotkey documentation item',
                  },
                },
                required: ['id'],
              },
            },
          ]
        : [];
      const tools = [...contextualTools, ...chatGPTTools];
      logDebugEvent('tools.list', {
        status: 'success',
        message: `Returned ${tools.length} tools`,
        details: { mode: useSSE ? 'sse' : 'stdio' },
      });

      return {
        tools,
      };
    });

    // Call tool handler
    server.setRequestHandler(CallToolRequestSchema, async request => {
      const params = request.params as typeof request.params & { task?: { ttl?: number } };
      const { name, arguments: args } = params;
      const taskRequest = params.task;
      const startTime = Date.now();
      const toolTimeoutMs = envConfig.getToolTimeoutMs();

      // Unified logging: generate call ID and log start
      const callId = `${name}-${startTime}-${Math.random().toString(36).slice(2, 8)}`;
      const unifiedLog = getUnifiedLogger();
      unifiedLog.toolStart(callId, name, (args as Record<string, unknown>) || {});

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
        if (taskRequest) {
          const ttl =
            typeof taskRequest.ttl === 'number' &&
            Number.isFinite(taskRequest.ttl) &&
            taskRequest.ttl > 0
              ? taskRequest.ttl
              : undefined;
          const pollInterval = envConfig.getTaskPollIntervalMs();
          const taskTimeoutMs = ttl ?? envConfig.getTaskTimeoutMs();

          const task = this.taskManager.createTask({
            toolName: name,
            ttl,
            pollInterval,
            execute: () => this.executeToolWithTimeout(name, args, taskTimeoutMs),
          });

          // Unified logging: task queued (execution is async)
          unifiedLog.toolEnd(callId, {
            content: [{ type: 'text', text: `task queued: ${task.taskId}` }],
          });

          return { task };
        }

        // Execute tool with distributed tracing
        const result = await tracer.trace(
          name,
          async span => {
            // Add tool metadata to span
            span.attributes.tool = name;
            span.attributes.argCount =
              args && typeof args === 'object'
                ? Object.keys(args as Record<string, unknown>).length
                : 0;

            // Execute the tool
            const toolResult = await this.executeToolWithTimeout(name, args, toolTimeoutMs);

            // Add result metadata to span
            if (toolResult && toolResult.content) {
              span.attributes.resultContentCount = toolResult.content.length;
              span.attributes.isError = toolResult.isError || false;
            }

            return toolResult;
          },
          { toolType: name.split('_')[1] || 'unknown' }
        );

        // Unified logging: log success
        unifiedLog.toolEnd(callId, result);
        return result;
      } catch (error) {
        // Unified logging: log error
        unifiedLog.toolError(callId, error instanceof Error ? error : new Error(String(error)));

        // Build rich error response with metadata
        return ErrorResponseBuilder.fromError(error, ErrorCode.TOOL_EXECUTION_FAILED)
          .tool(request.params.name)
          .operation('tool execution')
          .details({
            toolName: request.params.name,
            arguments: request.params.arguments,
          })
          .build();
      }
    });
  }

  /**
   * Setup MCP task handlers
   */
  private setupTaskHandlers(server: Server): void {
    const taskStatusValues = ['working', 'completed', 'failed', 'canceled'] as const;
    const TaskStatusSchema = z.enum(taskStatusValues);

    const TaskListRequestSchema = z.object({
      method: z.literal('tasks/list'),
      params: z
        .object({
          status: TaskStatusSchema.optional(),
        })
        .optional(),
    });

    const TaskGetRequestSchema = z.object({
      method: z.literal('tasks/get'),
      params: z.object({
        taskId: z.string(),
      }),
    });

    const TaskResultRequestSchema = z.object({
      method: z.literal('tasks/result'),
      params: z.object({
        taskId: z.string(),
      }),
    });

    const TaskCancelRequestSchema = z.object({
      method: z.literal('tasks/cancel'),
      params: z.object({
        taskId: z.string(),
      }),
    });

    server.setRequestHandler(TaskListRequestSchema, async request => {
      const status = request.params?.status;
      const tasks = this.taskManager.listTasks(status);
      return { tasks };
    });

    server.setRequestHandler(TaskGetRequestSchema, async request => {
      const { taskId } = request.params;
      const task = this.taskManager.getTask(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      return { task };
    });

    server.setRequestHandler(TaskCancelRequestSchema, async request => {
      const { taskId } = request.params;
      const task = this.taskManager.cancelTask(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      return { task };
    });

    server.setRequestHandler(TaskResultRequestSchema, async request => {
      const { taskId } = request.params;
      const outcome = this.taskManager.getTaskResult(taskId);
      if (!outcome) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const response =
        outcome.result ?? createErrorResponse(outcome.message || 'Task result unavailable');
      const meta = {
        ...(response as { _meta?: Record<string, unknown> })._meta,
        'io.modelcontextprotocol/related-task': { taskId },
      };

      return {
        ...response,
        _meta: meta,
      };
    });
  }

  private async executeToolWithTimeout(
    toolName: string,
    args: unknown,
    timeoutMs: number
  ): Promise<any> {
    if (!timeoutMs || timeoutMs <= 0) {
      return this.toolRegistry.executeTool(toolName, args);
    }

    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Tool '${toolName}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([this.toolRegistry.executeTool(toolName, args), timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Setup MCP prompt handlers
   */
  private setupPromptHandlers(server: Server): void {
    // List prompts handler
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
      logger.debug('Listing available AutoHotkey prompts');
      logDebugEvent('prompts.list', { status: 'start', message: 'Gathering prompt catalog' });
      const prompts = await getPromptCatalog();

      const promptList = prompts.map(prompt => {
        const description =
          prompt.source === 'module' && prompt.module
            ? `AutoHotkey v2 module prompt from ${prompt.module}`
            : `AutoHotkey v2: ${prompt.title}`;

        return {
          name: this.createPromptName(prompt.slug ?? prompt.title),
          description,
          arguments: [],
        };
      });

      logDebugEvent('prompts.list', {
        status: 'success',
        message: `Returned ${promptList.length} prompts`,
      });

      return {
        prompts: promptList,
      };
    });

    // Get prompt handler
    server.setRequestHandler(GetPromptRequestSchema, async request => {
      const { name } = request.params;

      logger.info(`Getting prompt: ${name}`);
      logDebugEvent('prompts.get', { status: 'start', message: name });

      const prompts = await getPromptCatalog();
      const prompt = prompts.find(p => this.createPromptName(p.slug ?? p.title) === name);

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
              text: prompt.body,
            },
          },
        ],
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

  private getResourceDefinitions(): Array<{
    uri: string;
    name: string;
    description: string;
    mimeType: string;
  }> {
    return [
      {
        uri: 'ahk://context/auto',
        name: 'AutoHotkey Auto-Context',
        description:
          'Automatically provides relevant AutoHotkey documentation based on detected keywords',
        mimeType: 'text/markdown',
      },
      {
        uri: 'ahk://docs/functions',
        name: 'AutoHotkey Functions Reference',
        description: 'Complete reference of AutoHotkey v2 built-in functions',
        mimeType: 'application/json',
      },
      {
        uri: 'ahk://docs/variables',
        name: 'AutoHotkey Variables Reference',
        description: 'Complete reference of AutoHotkey v2 built-in variables',
        mimeType: 'application/json',
      },
      {
        uri: 'ahk://docs/classes',
        name: 'AutoHotkey Classes Reference',
        description: 'Complete reference of AutoHotkey v2 built-in classes',
        mimeType: 'application/json',
      },
      {
        uri: 'ahk://docs/methods',
        name: 'AutoHotkey Methods Reference',
        description: 'Complete reference of AutoHotkey v2 built-in methods',
        mimeType: 'application/json',
      },
      {
        uri: 'ahk://templates/file-system-watcher',
        name: 'File System Watcher Template',
        description: 'AutoHotkey v2 script template for monitoring file system changes',
        mimeType: 'text/plain',
      },
      {
        uri: 'ahk://templates/clipboard-manager',
        name: 'Clipboard Manager Template',
        description: 'AutoHotkey v2 script template for clipboard management',
        mimeType: 'text/plain',
      },
      {
        uri: 'ahk://templates/cpu-monitor',
        name: 'CPU Monitor Template',
        description: 'AutoHotkey v2 script template for system monitoring',
        mimeType: 'text/plain',
      },
      {
        uri: 'ahk://templates/hotkey-toggle',
        name: 'Hotkey Toggle Template',
        description: 'AutoHotkey v2 script template for hotkey management',
        mimeType: 'text/plain',
      },
      {
        uri: 'ahk://system/clipboard',
        name: 'Live Clipboard Content',
        description: 'Real-time clipboard content (read-only)',
        mimeType: 'text/plain',
      },
      {
        uri: 'ahk://system/info',
        name: 'System Information',
        description: 'Current system information and AutoHotkey environment',
        mimeType: 'application/json',
      },
    ];
  }

  /**
   * Setup MCP resource handlers for automatic context injection
   */
  private setupResourceHandlers(server: Server): void {
    // List resources handler
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      logger.debug('Listing available AutoHotkey resources');
      logDebugEvent('resources.list', {
        status: 'start',
        message: 'Enumerating exposed resources',
      });

      const resources = this.getResourceDefinitions();

      logDebugEvent('resources.list', {
        status: 'success',
        message: `Returned ${resources.length} resources`,
      });

      return {
        resources,
      };
    });

    // Read resource handler
    server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const { uri } = request.params;
      const normalizedUri = this.normalizeResourceUri(uri);
      const baseDetails =
        uri !== normalizedUri ? { requested: uri, normalized: normalizedUri } : undefined;
      const mergeDetails = (
        details?: Record<string, unknown>
      ): Record<string, unknown> | undefined => {
        return baseDetails ? { ...baseDetails, ...(details ?? {}) } : details;
      };

      logger.info(`Reading resource: ${normalizedUri}`);
      logDebugEvent('resources.read', {
        status: 'start',
        message: normalizedUri,
        details: mergeDetails(),
      });

      if (normalizedUri === 'ahk://context/auto') {
        // This would normally be triggered by analyzing user input
        // For now, return a placeholder
        logDebugEvent('resources.read', {
          status: 'success',
          message: normalizedUri,
          details: mergeDetails({ kind: 'auto-context' }),
        });
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: '## 🎯 AutoHotkey Context Available\n\nUse the `AHK_Context_Injector` tool to analyze your prompts and get relevant AutoHotkey documentation automatically injected.',
            },
          ],
        };
      }

      if (normalizedUri === 'ahk://docs/functions') {
        const ahkIndex = getAhkIndex();
        logDebugEvent('resources.read', {
          status: 'success',
          message: normalizedUri,
          details: mergeDetails({ kind: 'functions' }),
        });
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(ahkIndex?.functions || [], null, 2),
            },
          ],
        };
      }

      if (normalizedUri === 'ahk://docs/variables') {
        const ahkIndex = getAhkIndex();
        logDebugEvent('resources.read', {
          status: 'success',
          message: normalizedUri,
          details: mergeDetails({ kind: 'variables' }),
        });
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(ahkIndex?.variables || [], null, 2),
            },
          ],
        };
      }

      if (normalizedUri === 'ahk://docs/classes') {
        const ahkIndex = getAhkIndex();
        logDebugEvent('resources.read', {
          status: 'success',
          message: normalizedUri,
          details: mergeDetails({ kind: 'classes' }),
        });
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(ahkIndex?.classes || [], null, 2),
            },
          ],
        };
      }

      if (normalizedUri === 'ahk://docs/methods') {
        const ahkIndex = getAhkIndex();
        logDebugEvent('resources.read', {
          status: 'success',
          message: normalizedUri,
          details: mergeDetails({ kind: 'methods' }),
        });
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(ahkIndex?.methods || [], null, 2),
            },
          ],
        };
      }

      // Script templates
      if (normalizedUri === 'ahk://templates/file-system-watcher') {
        logDebugEvent('resources.read', {
          status: 'success',
          message: normalizedUri,
          details: mergeDetails({ kind: 'template', name: 'file-system-watcher' }),
        });
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
`,
            },
          ],
        };
      }

      if (normalizedUri === 'ahk://templates/clipboard-manager') {
        logDebugEvent('resources.read', {
          status: 'success',
          message: normalizedUri,
          details: mergeDetails({ kind: 'template', name: 'clipboard-manager' }),
        });
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
`,
            },
          ],
        };
      }

      if (normalizedUri === 'ahk://templates/cpu-monitor') {
        logDebugEvent('resources.read', {
          status: 'success',
          message: normalizedUri,
          details: mergeDetails({ kind: 'template', name: 'cpu-monitor' }),
        });
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
`,
            },
          ],
        };
      }

      if (normalizedUri === 'ahk://templates/hotkey-toggle') {
        logDebugEvent('resources.read', {
          status: 'success',
          message: normalizedUri,
          details: mergeDetails({ kind: 'template', name: 'hotkey-toggle' }),
        });
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
`,
            },
          ],
        };
      }

      if (normalizedUri === 'ahk://system/clipboard') {
        logDebugEvent('resources.read', {
          status: 'success',
          message: normalizedUri,
          details: mergeDetails({ kind: 'system' }),
        });
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: '(Live clipboard access not available in MCP server context)\nUse AutoHotkey scripts with A_Clipboard variable to access clipboard content.',
            },
          ],
        };
      }

      if (normalizedUri === 'ahk://system/info') {
        const systemInfo = {
          autohotkeyVersion: 'v2.0+',
          operatingSystem: 'Windows',
          computerName: 'Unknown',
          userName: 'Unknown',
          timestamp: new Date().toISOString(),
          processId: process.pid,
          workingDirectory: process.cwd(),
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
        };

        logDebugEvent('resources.read', {
          status: 'success',
          message: normalizedUri,
          details: mergeDetails({ kind: 'system-info' }),
        });
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(systemInfo, null, 2),
            },
          ],
        };
      }

      logDebugEvent('resources.read', { status: 'error', message: `Resource not found: ${uri}` });
      throw new Error(`Resource not found: ${uri}`);
    });
  }

  private setupCompletionHandlers(server: Server): void {
    server.setRequestHandler(CompleteRequestSchema, async request => {
      const { ref, argument, context } = request.params;
      const prefix = argument.value || '';

      let candidates: string[] = [];

      if (ref.type === 'ref/resource') {
        candidates = this.getResourceCompletionCandidates(argument.name, context?.arguments);
      } else {
        candidates = await this.getPromptCompletionCandidates(argument.name, context?.arguments);
      }

      const ranked = this.rankCompletionCandidates(candidates, prefix);
      const values = ranked.slice(0, 100);

      return {
        completion: {
          values,
          total: ranked.length,
          hasMore: ranked.length > values.length,
        },
      };
    });
  }

  private async getPromptCompletionCandidates(
    argumentName: string,
    contextArguments?: Record<string, string>
  ): Promise<string[]> {
    const promptCatalog = await getPromptCatalog();
    const promptNames = promptCatalog.map(prompt =>
      this.createPromptName(prompt.slug ?? prompt.title)
    );
    const contextValues = Object.values(contextArguments || {});
    const activeFilePath = getActiveFilePath();

    if (argumentName.toLowerCase().includes('name')) {
      return promptNames;
    }

    if (argumentName.toLowerCase().includes('file')) {
      return [activeFilePath || '', ...contextValues].filter(Boolean);
    }

    return [
      ...promptNames,
      ...contextValues,
      activeFilePath || '',
      'functions',
      'classes',
      'hotkeys',
      'gui',
      'arrays',
      'objects',
      'windows',
    ].filter(Boolean);
  }

  private getResourceCompletionCandidates(
    argumentName: string,
    contextArguments?: Record<string, string>
  ): string[] {
    const resources = this.getResourceDefinitions();
    const uris = resources.map(resource => resource.uri);
    const names = resources.map(resource => resource.name);
    const contextValues = Object.values(contextArguments || {});

    if (argumentName.toLowerCase().includes('uri')) {
      return [...uris, ...contextValues];
    }

    if (argumentName.toLowerCase().includes('template')) {
      return uris.filter(uri => uri.startsWith('ahk://templates/'));
    }

    if (argumentName.toLowerCase().includes('path')) {
      const activePath = getActiveFilePath();
      return [activePath || '', ...contextValues].filter(Boolean);
    }

    return [...uris, ...names, ...contextValues];
  }

  private rankCompletionCandidates(candidates: string[], prefix: string): string[] {
    const normalizedPrefix = prefix.trim().toLowerCase();
    const uniqueCandidates = Array.from(
      new Set(candidates.map(value => value.trim()).filter(Boolean))
    );

    if (!normalizedPrefix) {
      return uniqueCandidates.sort((a, b) => a.localeCompare(b));
    }

    const filtered = uniqueCandidates.filter(candidate =>
      candidate.toLowerCase().includes(normalizedPrefix)
    );

    return filtered.sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(normalizedPrefix) ? 0 : 1;
      const bStarts = b.toLowerCase().startsWith(normalizedPrefix) ? 0 : 1;
      if (aStarts !== bStarts) {
        return aStarts - bStarts;
      }
      return a.localeCompare(b);
    });
  }

  /**
   * Handle resource requests by delegating to appropriate handlers
   */
  private async handleResourceRequest(
    normalizedUri: string,
    originalUri: string,
    _mergeDetails: (details?: Record<string, unknown>) => Record<string, unknown> | undefined
  ): Promise<any> {
    const ahkIndex = getAhkIndex();

    // Documentation resources
    if (normalizedUri === 'ahk://docs/functions') {
      return {
        contents: [
          {
            uri: originalUri,
            mimeType: 'application/json',
            text: JSON.stringify(ahkIndex?.functions || [], null, 2),
          },
        ],
      };
    }

    if (normalizedUri === 'ahk://docs/variables') {
      return {
        contents: [
          {
            uri: originalUri,
            mimeType: 'application/json',
            text: JSON.stringify(ahkIndex?.variables || [], null, 2),
          },
        ],
      };
    }

    if (normalizedUri === 'ahk://docs/classes') {
      return {
        contents: [
          {
            uri: originalUri,
            mimeType: 'application/json',
            text: JSON.stringify(ahkIndex?.classes || [], null, 2),
          },
        ],
      };
    }

    if (normalizedUri === 'ahk://docs/methods') {
      return {
        contents: [
          {
            uri: originalUri,
            mimeType: 'application/json',
            text: JSON.stringify(ahkIndex?.methods || [], null, 2),
          },
        ],
      };
    }

    // Context resources
    if (normalizedUri === 'ahk://context/auto') {
      return {
        contents: [
          {
            uri: originalUri,
            mimeType: 'text/markdown',
            text: '## 🎯 AutoHotkey Context Available\n\nUse the `AHK_Context_Injector` tool to analyze your prompts and get relevant AutoHotkey documentation automatically injected.',
          },
        ],
      };
    }

    // System resources
    if (normalizedUri === 'ahk://system/info') {
      const systemInfo = {
        autohotkeyVersion: 'v2.0+',
        operatingSystem: 'Windows',
        computerName: 'Unknown',
        userName: 'Unknown',
        timestamp: new Date().toISOString(),
        processId: process.pid,
        workingDirectory: process.cwd(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      };

      return {
        contents: [
          {
            uri: originalUri,
            mimeType: 'application/json',
            text: JSON.stringify(systemInfo, null, 2),
          },
        ],
      };
    }

    if (normalizedUri === 'ahk://system/clipboard') {
      return {
        contents: [
          {
            uri: originalUri,
            mimeType: 'text/plain',
            text: '(Live clipboard access not available in MCP server context)\nUse AutoHotkey scripts with A_Clipboard variable to access clipboard content.',
          },
        ],
      };
    }

    // Template resources
    const templates = {
      'file-system-watcher': this.getFileSystemWatcherTemplate(),
      'clipboard-manager': this.getClipboardManagerTemplate(),
      'cpu-monitor': this.getCpuMonitorTemplate(),
      'hotkey-toggle': this.getHotkeyToggleTemplate(),
    };

    for (const [name, content] of Object.entries(templates)) {
      if (normalizedUri === `ahk://templates/${name}`) {
        return {
          contents: [
            {
              uri: originalUri,
              mimeType: 'text/plain',
              text: content,
            },
          ],
        };
      }
    }

    throw new Error(`Resource not found: ${originalUri}`);
  }

  /**
   * Get file system watcher template
   */
  private getFileSystemWatcherTemplate(): string {
    return `; AutoHotkey v2 File System Watcher Template
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
`;
  }

  /**
   * Get clipboard manager template
   */
  private getClipboardManagerTemplate(): string {
    return `; AutoHotkey v2 Clipboard Manager Template
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
`;
  }

  /**
   * Get CPU monitor template
   */
  private getCpuMonitorTemplate(): string {
    return `; AutoHotkey v2 CPU Monitor Template
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
`;
  }

  /**
   * Get hotkey toggle template
   */
  private getHotkeyToggleTemplate(): string {
    return `; AutoHotkey v2 Hotkey Toggle Template
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
`;
  }

  /**
   * Initialize path conversion system
   */
  private initializePathConversion(): void {
    try {
      logger.debug('Initializing path conversion system...');

      // Load configuration
      const config = configManager.getConfig();

      // Configure path converter with drive mappings
      if (config.driveMappings.length > 0) {
        config.driveMappings.forEach(mapping => {
          pathConverter.addDriveMapping(mapping.windowsDrive, mapping.wslMountPoint);
        });
        logger.debug(`Loaded ${config.driveMappings.length} drive mappings`);
      }

      // Configure path interceptor with tool configurations
      if (config.toolConfigs.length > 0) {
        config.toolConfigs.forEach(toolConfig => {
          pathInterceptor.addToolConfig(toolConfig);
        });
        logger.debug(`Loaded ${config.toolConfigs.length} tool configurations`);
      }

      // Enable/disable path interception based on configuration
      pathInterceptor.setEnabled(config.enabled);

      logger.info('Path conversion system initialized successfully');
      logger.debug(
        `Path conversion enabled: ${config.enabled}, target format: ${config.defaultTargetFormat}`
      );
    } catch (error) {
      logger.error('Failed to initialize path conversion system:', error);
      // Continue without path conversion rather than failing the entire server
    }
  }

  /**
   * Initialize the server and load data
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing AutoHotkey MCP Server...');
      logDebugEvent('server.initialize', {
        status: 'start',
        message: 'Loading AutoHotkey documentation',
      });

      // Load AutoHotkey documentation data
      await initializeDataLoader();

      logger.info('AutoHotkey MCP Server initialized successfully');
      logDebugEvent('server.initialize', {
        status: 'success',
        message: 'Documentation cache ready',
      });
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

      // Start observability server (if enabled)
      try {
        await observabilityServer.start();
      } catch (error) {
        logger.warn('Failed to start observability server:', error);
        // Continue even if observability server fails to start
      }

      // Check if we should use SSE transport for ChatGPT (via --sse flag or PORT env var)
      const useSSE = envConfig.useSSEMode();
      let shutdownHook: (() => Promise<void>) | undefined;

      if (useSSE) {
        shutdownHook = await this.startHttpMode();
      } else {
        logDebugEvent('server.start', {
          status: 'start',
          message: 'Launching stdio transport (Claude Desktop)',
        });

        // Connect to stdio (for Claude Desktop)
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        logger.info('AutoHotkey MCP Server started and connected to stdio');
        logDebugEvent('server.start', {
          status: 'success',
          message: 'Stdio transport ready (Claude Desktop)',
        });
      }

      // Handle process termination gracefully
      process.once('SIGINT', () => {
        void this.handleShutdownSignal('SIGINT', shutdownHook);
      });

      process.once('SIGTERM', () => {
        void this.handleShutdownSignal('SIGTERM', shutdownHook);
      });
    } catch (error) {
      logger.error('Failed to start AutoHotkey MCP Server:', error);
      process.exit(1);
    }
  }

  private async startHttpMode(): Promise<() => Promise<void>> {
    const port = envConfig.getPort();

    logDebugEvent('server.start', {
      status: 'start',
      message: `Launching Streamable HTTP transport on port ${port}`,
    });

    const express = await import('express');
    const app = express.default();
    app.use(express.default.json({ limit: '10mb' }));
    app.use(express.default.urlencoded({ extended: true }));
    this.configureOriginValidation(app);
    this.configureAuthentication(app);

    if (envConfig.isStatelessHttp()) {
      logger.info('Streamable HTTP running in stateless mode (no sessions, POST /mcp only)');
    }

    const activeSessions = new Map<string, SessionEntry>();
    const maxSessions = this.getPositiveIntEnv('AHK_MCP_MAX_SESSIONS', 100);
    const sessionTimeoutMs = this.getPositiveIntEnv('AHK_MCP_SESSION_TIMEOUT_MS', 30 * 60 * 1000);
    const cleanupIntervalMs = this.getPositiveIntEnv(
      'AHK_MCP_SESSION_CLEANUP_INTERVAL_MS',
      5 * 60 * 1000
    );

    const cleanupInterval = setInterval(() => {
      void this.cleanupIdleSessions(activeSessions, sessionTimeoutMs);
    }, cleanupIntervalMs);
    cleanupInterval.unref();

    app.all('/mcp', async (req, res) => {
      await this.handleStreamableRequest(req, res, activeSessions, maxSessions);
    });

    app.get('/sse', async (req, res) => {
      await this.handleLegacySseConnect(req, res, activeSessions, maxSessions);
    });

    app.post('/message', async (req, res) => {
      await this.handleLegacySsePost(req, res, activeSessions);
    });

    app.post('/messages', async (req, res) => {
      await this.handleLegacySsePost(req, res, activeSessions);
    });

    const httpServer = await new Promise<ReturnType<Express['listen']>>((resolve, reject) => {
      const serverInstance = app.listen(port, () => resolve(serverInstance));
      serverInstance.once('error', reject);
    });

    logger.info(`AutoHotkey MCP Server started with Streamable HTTP transport on port ${port}`);
    logger.info(`Primary MCP endpoint: http://localhost:${port}/mcp`);
    logger.info(`Legacy SSE endpoint: http://localhost:${port}/sse`);
    logDebugEvent('server.start', {
      status: 'success',
      message: `Transport endpoints ready on port ${port}`,
      details: {
        streamableHttp: '/mcp',
        legacySse: '/sse',
        legacyMessage: '/message',
      },
    });

    return async () => {
      clearInterval(cleanupInterval);
      await this.closeAllSessions(activeSessions, 'server shutdown');
      await new Promise<void>(resolve => {
        httpServer.close(() => resolve());
      });
    };
  }

  private configureOriginValidation(app: Express): void {
    const allowedOrigins = (process.env.AHK_MCP_ALLOWED_ORIGINS || '')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean);

    if (allowedOrigins.length === 0) {
      return;
    }

    app.use((req: Request, res: Response, next: NextFunction) => {
      const requestOrigin = req.headers.origin;
      if (!requestOrigin) {
        next();
        return;
      }

      if (allowedOrigins.includes(requestOrigin)) {
        next();
        return;
      }

      this.sendTransportError(res, 403, -32097, 'Origin not allowed', {
        phase: 'origin-validation',
        method: req.method,
        path: req.path,
        origin: requestOrigin,
        allowedOrigins,
      });
    });
  }

  private async handleStreamableRequest(
    req: Request,
    res: Response,
    activeSessions: Map<string, SessionEntry>,
    maxSessions: number
  ): Promise<void> {
    if (envConfig.isStatelessHttp()) {
      await this.handleStatelessStreamableRequest(req, res);
      return;
    }

    try {
      const sessionId = this.getHeaderValue(req.headers['mcp-session-id']);
      const session = sessionId ? activeSessions.get(sessionId) : undefined;

      if (session && session.protocol !== 'streamable') {
        this.sendTransportError(res, 400, -32000, 'Session transport mismatch', {
          phase: 'streamable',
          sessionId,
          expectedProtocol: 'streamable',
          actualProtocol: session.protocol,
          method: req.method,
        });
        return;
      }

      let streamableTransport: StreamableHTTPServerTransport;
      if (session) {
        streamableTransport = session.transport;
        session.lastActivity = Date.now();
      } else {
        if (activeSessions.size >= maxSessions) {
          this.sendTransportError(res, 503, -32001, 'Server is at session capacity', {
            phase: 'streamable',
            maxSessions,
            activeSessions: activeSessions.size,
          });
          return;
        }

        const isInitialization = req.method === 'POST' && isInitializeRequest(req.body);
        if (!isInitialization) {
          this.sendTransportError(res, 400, -32000, 'Invalid or missing session for /mcp request', {
            phase: 'streamable',
            method: req.method,
            hasSessionHeader: Boolean(sessionId),
            sessionId: sessionId || null,
            bodyMethod:
              req.body && typeof req.body === 'object' && 'method' in req.body
                ? String((req.body as { method?: unknown }).method)
                : null,
            hint: 'Send initialize via POST /mcp without mcp-session-id first',
          });
          return;
        }

        const server = this.createServer();
        streamableTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true,
          eventStore: new InMemoryEventStore(),
          ...this.getDnsRebindingOptions(),
          onsessioninitialized: initializedSessionId => {
            const now = Date.now();
            activeSessions.set(initializedSessionId, {
              protocol: 'streamable',
              server,
              transport: streamableTransport,
              createdAt: now,
              lastActivity: now,
            });
            logDebugEvent('transport.streamable', {
              status: 'start',
              message: `Session ${initializedSessionId} initialized`,
              details: {
                activeSessions: activeSessions.size,
              },
            });
          },
          onsessionclosed: async closedSessionId => {
            await this.closeSessionById(
              activeSessions,
              closedSessionId,
              'session closed by client'
            );
          },
        });

        streamableTransport.onerror = error => {
          logDebugError('transport.streamable', error, {
            details: {
              phase: 'runtime',
              sessionId: streamableTransport.sessionId ?? 'pending',
            },
          });
        };

        streamableTransport.onclose = () => {
          const closedSessionId = streamableTransport.sessionId;
          if (closedSessionId) {
            void this.closeSessionById(activeSessions, closedSessionId, 'transport closed');
          }
        };

        await server.connect(streamableTransport);
      }

      await streamableTransport.handleRequest(req, res, req.body);

      if (sessionId) {
        const trackedSession = activeSessions.get(sessionId);
        if (trackedSession) {
          trackedSession.lastActivity = Date.now();
        }
      }
    } catch (error) {
      logDebugError('transport.streamable', error, {
        details: {
          phase: 'request-handler',
          method: req.method,
          path: req.path,
        },
      });

      const message = error instanceof Error ? error.message : String(error);
      this.sendTransportError(res, 500, -32603, 'Failed to handle Streamable HTTP request', {
        phase: 'streamable',
        method: req.method,
        path: req.path,
        error: message,
      });
    }
  }

  /**
   * Stateless Streamable HTTP (AHK_MCP_STATELESS=true): a fresh server and
   * transport per request, no Mcp-Session-Id and no resumability, so any
   * instance behind a load balancer can serve any request.
   */
  private async handleStatelessStreamableRequest(req: Request, res: Response): Promise<void> {
    if (req.method !== 'POST') {
      this.sendTransportError(res, 405, -32000, 'Method not allowed in stateless mode', {
        phase: 'streamable-stateless',
        method: req.method,
        hint: 'Stateless mode has no server-to-client streams; send JSON-RPC via POST /mcp',
      });
      return;
    }

    try {
      const server = this.createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
        ...this.getDnsRebindingOptions(),
      });

      res.on('close', () => {
        void transport.close();
        void server.close();
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logDebugError('transport.streamable', error, {
        details: {
          phase: 'stateless-request-handler',
          method: req.method,
          path: req.path,
        },
      });

      const message = error instanceof Error ? error.message : String(error);
      this.sendTransportError(res, 500, -32603, 'Failed to handle Streamable HTTP request', {
        phase: 'streamable-stateless',
        error: message,
      });
    }
  }

  private getDnsRebindingOptions(): {
    enableDnsRebindingProtection?: boolean;
    allowedHosts?: string[];
  } {
    const allowedHosts = envConfig.getAllowedHosts();
    if (allowedHosts.length === 0) {
      return {};
    }

    return { enableDnsRebindingProtection: true, allowedHosts };
  }

  private configureAuthentication(app: Express): void {
    const token = envConfig.getHttpAuthToken();
    if (!token) {
      logger.warn(
        'HTTP transport is running without authentication. Set AHK_MCP_AUTH_TOKEN to require a bearer token.'
      );
      return;
    }

    const expected = Buffer.from(token);
    app.use((req: Request, res: Response, next: NextFunction) => {
      const header = this.getHeaderValue(req.headers.authorization);
      const provided = header?.startsWith('Bearer ') ? Buffer.from(header.slice(7)) : undefined;

      if (provided && provided.length === expected.length && timingSafeEqual(provided, expected)) {
        next();
        return;
      }

      res.setHeader('WWW-Authenticate', 'Bearer');
      this.sendTransportError(res, 401, -32098, 'Missing or invalid bearer token', {
        phase: 'authentication',
        method: req.method,
        path: req.path,
      });
    });
  }

  private async handleLegacySseConnect(
    req: Request,
    res: Response,
    activeSessions: Map<string, SessionEntry>,
    maxSessions: number
  ): Promise<void> {
    try {
      if (activeSessions.size >= maxSessions) {
        this.sendTransportError(res, 503, -32001, 'Server is at session capacity', {
          phase: 'legacy-sse',
          maxSessions,
          activeSessions: activeSessions.size,
        });
        return;
      }

      const server = this.createServer();
      const transport = new SSEServerTransport('/message', res);
      const sessionId = transport.sessionId;
      const now = Date.now();
      activeSessions.set(sessionId, {
        protocol: 'sse',
        server,
        transport,
        createdAt: now,
        lastActivity: now,
      });

      transport.onerror = error => {
        logDebugError('transport.sse', error, {
          details: { sessionId, phase: 'runtime' },
        });
      };

      transport.onclose = () => {
        void this.closeSessionById(activeSessions, sessionId, 'legacy SSE transport closed');
      };

      req.on('close', () => {
        void this.closeSessionById(activeSessions, sessionId, 'legacy SSE client disconnected');
      });

      await server.connect(transport);
      logDebugEvent('transport.sse', {
        status: 'start',
        message: `Legacy SSE session ${sessionId} connected`,
        details: {
          activeSessions: activeSessions.size,
        },
      });
    } catch (error) {
      logDebugError('transport.sse', error, { details: { phase: 'connect' } });
      const message = error instanceof Error ? error.message : String(error);
      this.sendTransportError(res, 500, -32603, 'Failed to establish legacy SSE session', {
        phase: 'legacy-sse',
        error: message,
      });
    }
  }

  private async handleLegacySsePost(
    req: Request,
    res: Response,
    activeSessions: Map<string, SessionEntry>
  ): Promise<void> {
    try {
      const sessionIdFromQuery = this.getQuerySessionId(req.query.sessionId);

      if (sessionIdFromQuery) {
        const session = activeSessions.get(sessionIdFromQuery);
        if (!session) {
          this.sendTransportError(res, 404, -32004, 'Legacy SSE session not found', {
            phase: 'legacy-sse-post',
            sessionId: sessionIdFromQuery,
          });
          return;
        }

        if (session.protocol !== 'sse') {
          this.sendTransportError(res, 400, -32000, 'Session transport mismatch', {
            phase: 'legacy-sse-post',
            sessionId: sessionIdFromQuery,
            expectedProtocol: 'sse',
            actualProtocol: session.protocol,
          });
          return;
        }

        session.lastActivity = Date.now();
        await session.transport.handlePostMessage(req, res, req.body);
        return;
      }

      for (const [sessionId, session] of activeSessions.entries()) {
        if (session.protocol !== 'sse') {
          continue;
        }

        try {
          await session.transport.handlePostMessage(req, res, req.body);
          session.lastActivity = Date.now();
          return;
        } catch (error) {
          logger.debug(`Legacy SSE session ${sessionId} skipped for message routing`, error);
        }
      }

      this.sendTransportError(
        res,
        400,
        -32000,
        'No matching legacy SSE session for POST /message',
        {
          phase: 'legacy-sse-post',
          hint: 'Use /message?sessionId=<id> after opening /sse',
        }
      );
    } catch (error) {
      logDebugError('transport.sse', error, { details: { phase: 'post' } });
      const message = error instanceof Error ? error.message : String(error);
      this.sendTransportError(res, 500, -32603, 'Failed to handle legacy SSE message', {
        phase: 'legacy-sse-post',
        error: message,
      });
    }
  }

  private async cleanupIdleSessions(
    activeSessions: Map<string, SessionEntry>,
    sessionTimeoutMs: number
  ): Promise<void> {
    const now = Date.now();
    const staleSessions = [...activeSessions.entries()].filter(
      ([, session]) => now - session.lastActivity > sessionTimeoutMs
    );

    for (const [sessionId] of staleSessions) {
      await this.closeSessionById(activeSessions, sessionId, 'idle timeout exceeded');
    }

    if (staleSessions.length > 0) {
      logDebugEvent('transport.cleanup', {
        status: 'info',
        message: `Closed ${staleSessions.length} stale sessions`,
        details: {
          remainingSessions: activeSessions.size,
        },
      });
    }
  }

  private async closeAllSessions(
    activeSessions: Map<string, SessionEntry>,
    reason: string
  ): Promise<void> {
    for (const [sessionId] of activeSessions.entries()) {
      await this.closeSessionById(activeSessions, sessionId, reason);
    }
  }

  private async closeSessionById(
    activeSessions: Map<string, SessionEntry>,
    sessionId: string,
    reason: string
  ): Promise<void> {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return;
    }

    activeSessions.delete(sessionId);

    try {
      await session.transport.close();
    } catch (error) {
      logDebugError('transport.cleanup', error, {
        details: {
          sessionId,
          protocol: session.protocol,
          reason,
        },
      });
    }

    logDebugEvent('transport.cleanup', {
      status: 'info',
      message: `Closed ${session.protocol} session ${sessionId}`,
      details: {
        reason,
      },
    });
  }

  private getPositiveIntEnv(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) {
      return fallback;
    }

    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return parsed;
  }

  private getHeaderValue(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }

  private getQuerySessionId(value: unknown): string | undefined {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === 'string' && value[0].length > 0) {
      return value[0];
    }

    return undefined;
  }

  private sendTransportError(
    res: Response,
    httpStatus: number,
    code: number,
    message: string,
    data: Record<string, unknown>
  ): void {
    if (res.headersSent) {
      return;
    }

    res.status(httpStatus).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code,
        message,
        data: {
          timestamp: new Date().toISOString(),
          ...data,
        },
      },
    });
  }

  private async handleShutdownSignal(
    signal: 'SIGINT' | 'SIGTERM',
    shutdownHook?: () => Promise<void>
  ): Promise<void> {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    if (shutdownHook) {
      try {
        await shutdownHook();
      } catch (error) {
        logger.error('Shutdown hook failed:', error);
      }
    }

    process.exit(0);
  }

  /**
   * Get the server instance (for testing)
   */
  getServer(): Server {
    return this.server;
  }
}
