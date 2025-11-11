import type { IToolServer } from './server-interface.js';
import path from 'path';

/**
 * Get the project root directory (one level up from dist/)
 */
function getProjectRoot(): string {
  // When running from dist/server.js, go up to project root
  const currentFile = new URL(import.meta.url).pathname;
  const distDir = path.dirname(currentFile);
  return path.dirname(distDir); // Go up from dist/ to project root
}

/**
 * Tool registry for managing tool handler registration
 */
export class ToolRegistry {
  private toolHandlers = new Map<string, (args: any) => Promise<any>>();

  constructor(private serverInstance: IToolServer) {
    this.registerCoreTools();
    this.registerChatGPTTools();
  }

  /**
   * Register core AHK tools
   */
  private registerCoreTools(): void {
    const coreTools = [
      // New efficiency tools
      { name: 'AHK_Tools_Search', instance: 'ahkToolsSearchToolInstance' },
      { name: 'AHK_Workflow_Analyze_Fix_Run', instance: 'ahkWorkflowAnalyzeFixRunToolInstance' },

      // Existing tools
      { name: 'AHK_File_Edit_Advanced', instance: 'ahkFileEditorToolInstance' },
      { name: 'AHK_Diagnostics', instance: 'ahkDiagnosticsToolInstance' },
      { name: 'AHK_Summary', instance: 'ahkSummaryToolInstance' },
      { name: 'AHK_Prompts', instance: 'ahkPromptsToolInstance' },
      { name: 'AHK_Analyze', instance: 'ahkAnalyzeToolInstance' },
      { name: 'AHK_Context_Injector', instance: 'ahkContextInjectorToolInstance' },
      { name: 'AHK_Sampling_Enhancer', instance: 'ahkSamplingEnhancerToolInstance' },
      { name: 'AHK_Debug_Agent', instance: 'ahkDebugAgentToolInstance' },
      { name: 'AHK_Doc_Search', instance: 'ahkDocSearchToolInstance' },
      { name: 'AHK_Run', instance: 'ahkRunToolInstance' },
      { name: 'AHK_VSCode_Problems', instance: 'ahkVSCodeProblemsToolInstance' },
      { name: 'AHK_File_Recent', instance: 'ahkRecentToolInstance' },
      { name: 'AHK_Config', instance: 'ahkConfigToolInstance' },
      { name: 'AHK_Active_File', instance: 'ahkActiveFileToolInstance' },
      { name: 'AHK_LSP', instance: 'ahkLspToolInstance' },
      { name: 'AHK_LSP_Document_Symbols', instance: 'ahkLspDocumentSymbolsToolInstance' },
      { name: 'AHK_LSP_Hover', instance: 'ahkLspHoverToolInstance' },
      { name: 'AHK_LSP_Format', instance: 'ahkLspFormatToolInstance' },
      { name: 'AHK_LSP_Completion', instance: 'ahkLspCompletionToolInstance' },
      { name: 'AHK_File_View', instance: 'ahkFileViewToolInstance' },
      { name: 'AHK_File_Detect', instance: 'ahkAutoFileToolInstance' },
      { name: 'AHK_Process_Request', instance: 'ahkProcessRequestToolInstance' },
      { name: 'AHK_File_Active', instance: 'ahkFileToolInstance' },
      { name: 'AHK_File_Create', instance: 'ahkFileCreateToolInstance' },
      { name: 'AHK_File_Edit', instance: 'ahkEditToolInstance' },
      { name: 'AHK_File_Edit_Diff', instance: 'ahkDiffEditToolInstance' },
      { name: 'AHK_Settings', instance: 'ahkSettingsToolInstance' },
      { name: 'AHK_File_Edit_Small', instance: 'ahkSmallEditToolInstance' },
      { name: 'AHK_Alpha', instance: 'ahkAlphaToolInstance' },
      { name: 'AHK_Smart_Orchestrator', instance: 'ahkSmartOrchestratorToolInstance' },
      { name: 'AHK_Analytics', instance: 'ahkAnalyticsToolInstance' },
      { name: 'AHK_Test_Interactive', instance: 'ahkTestInteractiveToolInstance' },
      { name: 'AHK_Trace_Viewer', instance: 'ahkTraceViewerToolInstance' }
    ];

    coreTools.forEach(tool => {
      this.toolHandlers.set(tool.name, (args) =>
        (this.serverInstance as any)[tool.instance].execute(args)
      );
    });

    // Register library tools with custom handlers
    this.toolHandlers.set('AHK_Library_List', async (args) => {
      const { handleAHK_Library_List } = await import('../tools/ahk-library-list.js');
      const scriptsDir = getProjectRoot();
      return handleAHK_Library_List(args, scriptsDir);
    });

    this.toolHandlers.set('AHK_Library_Info', async (args) => {
      const { handleAHK_Library_Info } = await import('../tools/ahk-library-info.js');
      const scriptsDir = getProjectRoot();
      return handleAHK_Library_Info(args, scriptsDir);
    });

    this.toolHandlers.set('AHK_Library_Import', async (args) => {
      const { handleAHK_Library_Import } = await import('../tools/ahk-library-import.js');
      const scriptsDir = getProjectRoot();
      return handleAHK_Library_Import(args, scriptsDir);
    });
  }

  /**
   * Register ChatGPT-compatible tools (SSE mode only)
   */
  private registerChatGPTTools(): void {
    this.toolHandlers.set('search', (args) =>
      (this.serverInstance as any).ahkDocSearchToolInstance.execute({
        query: (args as any).query,
        category: 'auto',
        limit: 10
      }));

    this.toolHandlers.set('fetch', async (args) => {
      const fetchResult = await (this.serverInstance as any).ahkDocSearchToolInstance.execute({
        query: (args as any).id,
        category: 'auto',
        limit: 5
      });

      if (fetchResult.content && fetchResult.content.length > 0 && fetchResult.content[0].text) {
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

          return {
            content: [{ type: 'text', text: JSON.stringify(docResponse) }]
          };
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            id: (args as any).id,
            title: 'AutoHotkey Documentation Item',
            text: 'Documentation not found for this item. Try searching for related terms.',
            url: `https://www.autohotkey.com/docs/v2/search.htm?q=${(args as any).id}`,
            metadata: { source: 'autohotkey_docs', version: 'v2' }
          })
        }]
      };
    });
  }

  /**
   * Execute a tool by name with given arguments
   */
  async executeTool(toolName: string, args: any): Promise<any> {
    const handler = this.toolHandlers.get(toolName);
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    return await handler(args);
  }

  /**
   * Get all registered tool names
   */
  getToolNames(): string[] {
    return Array.from(this.toolHandlers.keys());
  }

  /**
   * Check if a tool is registered
   */
  hasTool(toolName: string): boolean {
    return this.toolHandlers.has(toolName);
  }
}
