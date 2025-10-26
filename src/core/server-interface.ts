/**
 * Minimal interface for tool registry's server dependency
 * This breaks the circular dependency between server.ts and tool-registry.ts
 */

/**
 * Server interface that defines the contract for ToolRegistry
 * Instead of depending on the concrete AutoHotkeyMcpServer class,
 * ToolRegistry depends on this interface, which breaks circular imports
 */
export interface IToolServer {
  ahkFileEditorToolInstance: { execute(args: any): Promise<any> };
  ahkDiagnosticsToolInstance: { execute(args: any): Promise<any> };
  ahkSummaryToolInstance: { execute(args: any): Promise<any> };
  ahkPromptsToolInstance: { execute(args: any): Promise<any> };
  ahkAnalyzeToolInstance: { execute(args: any): Promise<any> };
  ahkContextInjectorToolInstance: { execute(args: any): Promise<any> };
  ahkSamplingEnhancerToolInstance: { execute(args: any): Promise<any> };
  ahkDebugAgentToolInstance: { execute(args: any): Promise<any> };
  ahkDocSearchToolInstance: { execute(args: any): Promise<any> };
  ahkRunToolInstance: { execute(args: any): Promise<any> };
  ahkVSCodeProblemsToolInstance: { execute(args: any): Promise<any> };
  ahkRecentToolInstance: { execute(args: any): Promise<any> };
  ahkConfigToolInstance: { execute(args: any): Promise<any> };
  ahkActiveFileToolInstance: { execute(args: any): Promise<any> };
  ahkLspToolInstance: { execute(args: any): Promise<any> };
  ahkFileViewToolInstance: { execute(args: any): Promise<any> };
  ahkAutoFileToolInstance: { execute(args: any): Promise<any> };
  ahkProcessRequestToolInstance: { execute(args: any): Promise<any> };
  ahkFileToolInstance: { execute(args: any): Promise<any> };
  ahkFileCreateToolInstance: { execute(args: any): Promise<any> };
  ahkEditToolInstance: { execute(args: any): Promise<any> };
  ahkDiffEditToolInstance: { execute(args: any): Promise<any> };
  ahkSettingsToolInstance: { execute(args: any): Promise<any> };
  ahkSmallEditToolInstance: { execute(args: any): Promise<any> };
  ahkAlphaToolInstance: { execute(args: any): Promise<any> };
  ahkSmartOrchestratorToolInstance: { execute(args: any): Promise<any> };
}
