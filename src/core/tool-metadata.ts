import type { Tool } from '@modelcontextprotocol/server';

import { ahkToolsSearchToolDefinition } from '../tools/ahk-tools-search.js';
import { ahkWorkflowAnalyzeFixRunToolDefinition } from '../tools/ahk-workflow-analyze-fix-run.js';
import { ahkFileEditorToolDefinition } from '../tools/ahk-file-edit-advanced.js';
import { ahkEditToolDefinition } from '../tools/ahk-file-edit.js';
import { ahkFileToolDefinition } from '../tools/ahk-file-active.js';
import { ahkFileCreateToolDefinition } from '../tools/ahk-file-create.js';
import { ahkDiagnosticsToolDefinition } from '../tools/ahk-analyze-diagnostics.js';
import { ahkRunToolDefinition } from '../tools/ahk-run-script.js';
import { ahkAnalyzeToolDefinition } from '../tools/ahk-analyze-code.js';
import { ahkContextInjectorToolDefinition } from '../tools/ahk-docs-context.js';
import { ahkSummaryToolDefinition } from '../tools/ahk-analyze-summary.js';
import { ahkPromptsToolDefinition } from '../tools/ahk-docs-prompts.js';
import { ahkDebugAgentToolDefinition } from '../tools/ahk-run-debug.js';
import { ahkDocSearchToolDefinition } from '../tools/ahk-docs-search.js';
import { ahkVSCodeProblemsToolDefinition } from '../tools/ahk-analyze-vscode.js';
import { ahkRecentToolDefinition } from '../tools/ahk-file-recent.js';
import { ahkConfigToolDefinition } from '../tools/ahk-system-config.js';
import { ahkLspToolDefinition } from '../tools/ahk-analyze-lsp.js';
import { ahkFileViewToolDefinition } from '../tools/ahk-file-view.js';
import { ahkFileListToolDefinition } from '../tools/ahk-file-list.js';
import { ahkAutoFileToolDefinition } from '../tools/ahk-file-detect.js';
import { ahkProcessRequestToolDefinition } from '../tools/ahk-run-process.js';
import { ahkSettingsToolDefinition } from '../tools/ahk-system-settings.js';
import { ahkSmallEditToolDefinition } from '../tools/ahk-file-edit-small.js';
import { ahkSmartOrchestratorToolDefinition } from '../tools/ahk-smart-orchestrator.js';
import { ahkAnalyticsToolDefinition } from '../tools/ahk-system-analytics.js';
import { ahkLintToolDefinition } from '../tools/ahk-lint.js';
import { ahkVSCodeOpenToolDefinition } from '../tools/ahk-vscode-open.js';
import { ahkThqbyDocumentSymbolsToolDefinition } from '../tools/ahk-thqby-document-symbols.js';
import { AHK_Library_List_Definition } from '../tools/ahk-library-list.js';
import { AHK_Library_Info_Definition } from '../tools/ahk-library-info.js';
import { AHK_Library_Import_Definition } from '../tools/ahk-library-import.js';
import { AHK_Library_Search_Definition } from '../tools/ahk-library-search.js';
import { ahkCloudValidateToolDefinition } from '../tools/ahk-cloud-validate.js';
import { ahkDebugDBGpToolDefinition } from '../tools/ahk-debug-dbgp.js';

export type ToolCategory =
  | 'analysis'
  | 'debug'
  | 'docs'
  | 'discovery'
  | 'execution'
  | 'file'
  | 'library'
  | 'lsp'
  | 'observability'
  | 'system'
  | 'workflow';

export interface ToolMetadataEntry {
  definition: Tool;
  slug: string;
  category: ToolCategory;
}

const TASK_CAPABLE_TOOLS = new Set([
  'AHK_Workflow_Analyze_Fix_Run',
  'AHK_Diagnostics',
  'AHK_Run',
  'AHK_Analyze',
  'AHK_Debug_Agent',
  'AHK_LSP',
  'AHK_Process_Request',
  'AHK_Smart_Orchestrator',
  'AHK_Lint',
  'AHK_Library_Search',
  'AHK_Cloud_Validate',
  'AHK_Debug_DBGp',
]);

const MUTATING_TOOLS = new Set([
  'AHK_Workflow_Analyze_Fix_Run',
  'AHK_File_Edit_Advanced',
  'AHK_File_Edit',
  'AHK_File_Active',
  'AHK_File_Create',
  'AHK_Run',
  'AHK_Debug_Agent',
  'AHK_Process_Request',
  'AHK_Config',
  'AHK_Settings',
  'AHK_Analytics',
  'AHK_VSCode_Open',
  'AHK_File_Edit_Small',
  'AHK_Smart_Orchestrator',
  'AHK_Library_Import',
  'AHK_Debug_DBGp',
]);

const DESTRUCTIVE_TOOLS = new Set([
  'AHK_Workflow_Analyze_Fix_Run',
  'AHK_File_Edit_Advanced',
  'AHK_File_Edit',
  'AHK_File_Edit_Small',
  'AHK_Smart_Orchestrator',
  'AHK_Analytics',
]);

const OPEN_WORLD_TOOLS = new Set([
  'AHK_Run',
  'AHK_Debug_Agent',
  'AHK_Process_Request',
  'AHK_VSCode_Open',
  'AHK_Smart_Orchestrator',
  'AHK_Cloud_Validate',
  'AHK_Debug_DBGp',
]);

function createToolTitle(name: string): string {
  const acronyms = new Set(['AHK', 'DBGp', 'LSP', 'THQBY', 'VSCode']);
  return name
    .split('_')
    .filter(part => part !== 'AHK')
    .map(part => (acronyms.has(part) ? part : `${part.slice(0, 1)}${part.slice(1).toLowerCase()}`))
    .join(' ');
}

function applySpecMetadata(definition: Tool): Tool {
  const readOnly = !MUTATING_TOOLS.has(definition.name);
  return {
    ...definition,
    title: definition.title ?? createToolTitle(definition.name),
    annotations: {
      ...definition.annotations,
      title: definition.annotations?.title ?? createToolTitle(definition.name),
      readOnlyHint: definition.annotations?.readOnlyHint ?? readOnly,
      destructiveHint:
        definition.annotations?.destructiveHint ?? DESTRUCTIVE_TOOLS.has(definition.name),
      idempotentHint: definition.annotations?.idempotentHint ?? readOnly,
      openWorldHint: definition.annotations?.openWorldHint ?? OPEN_WORLD_TOOLS.has(definition.name),
    },
    execution: {
      ...definition.execution,
      taskSupport: TASK_CAPABLE_TOOLS.has(definition.name) ? 'optional' : 'forbidden',
    },
  };
}

function entry(definition: unknown, slug: string, category: ToolCategory): ToolMetadataEntry {
  return {
    definition: applySpecMetadata(definition as Tool),
    slug,
    category,
  };
}

const TOOL_METADATA: ToolMetadataEntry[] = [
  entry(ahkToolsSearchToolDefinition, 'tools-search', 'discovery'),
  entry(ahkWorkflowAnalyzeFixRunToolDefinition, 'workflow-analyze-fix-run', 'workflow'),
  entry(ahkFileEditorToolDefinition, 'file-edit-advanced', 'file'),
  entry(ahkEditToolDefinition, 'file-edit', 'file'),
  entry(ahkFileToolDefinition, 'file-active', 'file'),
  entry(ahkFileCreateToolDefinition, 'file-create', 'file'),
  // entry(ahkDiffEditToolDefinition, 'file-edit-diff', 'file'), // Hidden: use file-edit instead
  entry(ahkDiagnosticsToolDefinition, 'diagnostics', 'analysis'),
  entry(ahkRunToolDefinition, 'run-script', 'execution'),
  entry(ahkAnalyzeToolDefinition, 'analyze-code', 'analysis'),
  entry(ahkContextInjectorToolDefinition, 'context-injector', 'analysis'),
  entry(ahkSummaryToolDefinition, 'summary', 'docs'),
  entry(ahkPromptsToolDefinition, 'prompts', 'docs'),
  // entry(ahkSamplingEnhancerToolDefinition, 'sampling-enhancer', 'analysis'), // Hidden: unclear value
  entry(ahkDebugAgentToolDefinition, 'run-debug', 'execution'),
  entry(ahkDocSearchToolDefinition, 'doc-search', 'docs'),
  entry(ahkVSCodeProblemsToolDefinition, 'vscode-problems', 'analysis'),
  entry(ahkRecentToolDefinition, 'file-recent', 'file'),
  entry(ahkConfigToolDefinition, 'config', 'system'),
  entry(ahkVSCodeOpenToolDefinition, 'vscode-open', 'system'),
  // entry(ahkActiveFileToolDefinition, 'active-file', 'file'), // Hidden: duplicate of file-active
  entry(ahkLspToolDefinition, 'lsp', 'lsp'),
  entry(ahkFileViewToolDefinition, 'file-view', 'file'),
  entry(ahkFileListToolDefinition, 'file-list', 'file'),
  entry(ahkAutoFileToolDefinition, 'file-detect', 'file'),
  entry(ahkProcessRequestToolDefinition, 'process-request', 'workflow'),
  entry(ahkSettingsToolDefinition, 'settings', 'system'),
  entry(ahkSmallEditToolDefinition, 'file-edit-small', 'file'),
  // entry(ahkAlphaToolDefinition, 'alpha-channel', 'system'), // Hidden: experimental
  entry(ahkSmartOrchestratorToolDefinition, 'smart-orchestrator', 'workflow'),
  entry(ahkAnalyticsToolDefinition, 'analytics', 'observability'),
  // entry(ahkTestInteractiveToolDefinition, 'test-interactive', 'execution'), // Hidden: dev-only
  // entry(ahkTraceViewerToolDefinition, 'trace-viewer', 'observability'), // Hidden: debug-only
  entry(ahkLintToolDefinition, 'lint', 'analysis'),
  entry(ahkThqbyDocumentSymbolsToolDefinition, 'thqby-document-symbols', 'analysis'),
  entry(AHK_Library_List_Definition, 'library-list', 'library'),
  entry(AHK_Library_Info_Definition, 'library-info', 'library'),
  entry(AHK_Library_Import_Definition, 'library-import', 'library'),
  entry(AHK_Library_Search_Definition, 'library-search', 'library'),
  entry(ahkCloudValidateToolDefinition, 'cloud-validate', 'execution'),
  entry(ahkDebugDBGpToolDefinition, 'debug-dbgp', 'debug'),
];

export function getToolMetadata(): ToolMetadataEntry[] {
  return TOOL_METADATA;
}

export function getStandardToolDefinitions(): Tool[] {
  return TOOL_METADATA.map(entry => entry.definition);
}

export function getToolMetadataByName(name: string): ToolMetadataEntry | undefined {
  return TOOL_METADATA.find(entry => entry.definition.name === name);
}

export function toolSupportsTasks(name: string): boolean {
  return getToolMetadataByName(name)?.definition.execution?.taskSupport === 'optional';
}
