import type { Tool } from '@modelcontextprotocol/sdk/types.js';

import { ahkToolsSearchToolDefinition } from '../tools/ahk-tools-search.js';
import { ahkWorkflowAnalyzeFixRunToolDefinition } from '../tools/ahk-workflow-analyze-fix-run.js';
import { ahkFileEditorToolDefinition } from '../tools/ahk-file-edit-advanced.js';
import { ahkEditToolDefinition } from '../tools/ahk-file-edit.js';
import { ahkFileToolDefinition } from '../tools/ahk-file-active.js';
import { ahkFileCreateToolDefinition } from '../tools/ahk-file-create.js';
import { ahkDiffEditToolDefinition } from '../tools/ahk-file-edit-diff.js';
import { ahkDiagnosticsToolDefinition } from '../tools/ahk-analyze-diagnostics.js';
import { ahkRunToolDefinition } from '../tools/ahk-run-script.js';
import { ahkAnalyzeToolDefinition } from '../tools/ahk-analyze-code.js';
import { ahkContextInjectorToolDefinition } from '../tools/ahk-docs-context.js';
import { ahkSummaryToolDefinition } from '../tools/ahk-analyze-summary.js';
import { ahkPromptsToolDefinition } from '../tools/ahk-docs-prompts.js';
import { ahkSamplingEnhancerToolDefinition } from '../tools/ahk-docs-samples.js';
import { ahkDebugAgentToolDefinition } from '../tools/ahk-run-debug.js';
import { ahkDocSearchToolDefinition } from '../tools/ahk-docs-search.js';
import { ahkVSCodeProblemsToolDefinition } from '../tools/ahk-analyze-vscode.js';
import { ahkRecentToolDefinition } from '../tools/ahk-file-recent.js';
import { ahkConfigToolDefinition } from '../tools/ahk-system-config.js';
import { ahkActiveFileToolDefinition } from '../tools/ahk-active-file.js';
import { ahkLspToolDefinition } from '../tools/ahk-analyze-lsp.js';
import { ahkFileViewToolDefinition } from '../tools/ahk-file-view.js';
import { ahkFileListToolDefinition } from '../tools/ahk-file-list.js';
import { ahkAutoFileToolDefinition } from '../tools/ahk-file-detect.js';
import { ahkProcessRequestToolDefinition } from '../tools/ahk-run-process.js';
import { ahkSettingsToolDefinition } from '../tools/ahk-system-settings.js';
import { ahkSmallEditToolDefinition } from '../tools/ahk-file-edit-small.js';
import { ahkAlphaToolDefinition } from '../tools/ahk-system-alpha.js';
import { ahkSmartOrchestratorToolDefinition } from '../tools/ahk-smart-orchestrator.js';
import { ahkAnalyticsToolDefinition } from '../tools/ahk-system-analytics.js';
import { ahkTestInteractiveToolDefinition } from '../tools/ahk-test-interactive.js';
import { ahkTraceViewerToolDefinition } from '../tools/ahk-trace-viewer.js';
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

/**
 * MCP 2025 Tool Annotations
 * @see https://spec.modelcontextprotocol.io/2024-11-05/server/tools/#annotations
 */
export interface ToolAnnotations {
  /** Tool does not modify any state */
  readOnlyHint?: boolean;
  /** Tool may cause irreversible changes (destructive) */
  destructiveHint?: boolean;
  /** Same arguments always produce same result */
  idempotentHint?: boolean;
  /** Tool interacts with external entities */
  openWorldHint?: boolean;
}

export interface ToolMetadataEntry {
  definition: Tool;
  slug: string;
  category: ToolCategory;
  annotations: ToolAnnotations;
}

/** Default annotations by category */
const CATEGORY_DEFAULTS: Record<ToolCategory, ToolAnnotations> = {
  analysis: { readOnlyHint: true, idempotentHint: true },
  debug: { destructiveHint: true, openWorldHint: true },
  docs: { readOnlyHint: true, idempotentHint: true },
  discovery: { readOnlyHint: true, idempotentHint: true },
  execution: { destructiveHint: true, openWorldHint: true },
  file: { readOnlyHint: true }, // file reads default, writes override
  library: { readOnlyHint: true, idempotentHint: true },
  lsp: { readOnlyHint: true, idempotentHint: true },
  observability: { readOnlyHint: true, idempotentHint: true },
  system: { readOnlyHint: true },
  workflow: { destructiveHint: true },
};

function entry(
  definition: unknown,
  slug: string,
  category: ToolCategory,
  overrides?: Partial<ToolAnnotations>
): ToolMetadataEntry {
  return {
    definition: definition as Tool,
    slug,
    category,
    annotations: { ...CATEGORY_DEFAULTS[category], ...overrides },
  };
}

const TOOL_METADATA: ToolMetadataEntry[] = [
  // Discovery (readOnly, idempotent)
  entry(ahkToolsSearchToolDefinition, 'tools-search', 'discovery'),

  // Workflow (destructive)
  entry(ahkWorkflowAnalyzeFixRunToolDefinition, 'workflow-analyze-fix-run', 'workflow'),
  entry(ahkProcessRequestToolDefinition, 'process-request', 'workflow'),
  entry(ahkSmartOrchestratorToolDefinition, 'smart-orchestrator', 'workflow'),

  // File - Read operations (readOnly)
  entry(ahkFileToolDefinition, 'file-active', 'file'),
  entry(ahkFileViewToolDefinition, 'file-view', 'file'),
  entry(ahkFileListToolDefinition, 'file-list', 'file'),
  entry(ahkAutoFileToolDefinition, 'file-detect', 'file'),
  entry(ahkRecentToolDefinition, 'file-recent', 'file'),

  // File - Write operations (destructive override)
  entry(ahkFileEditorToolDefinition, 'file-edit-advanced', 'file', {
    readOnlyHint: false,
    destructiveHint: true,
  }),
  entry(ahkEditToolDefinition, 'file-edit', 'file', { readOnlyHint: false, destructiveHint: true }),
  entry(ahkFileCreateToolDefinition, 'file-create', 'file', {
    readOnlyHint: false,
    destructiveHint: true,
  }),
  entry(ahkSmallEditToolDefinition, 'file-edit-small', 'file', {
    readOnlyHint: false,
    destructiveHint: true,
  }),
  // entry(ahkDiffEditToolDefinition, 'file-edit-diff', 'file'), // Hidden: use file-edit instead

  // Analysis (readOnly, idempotent)
  entry(ahkAnalyzeToolDefinition, 'analyze-code', 'analysis'),
  entry(ahkContextInjectorToolDefinition, 'context-injector', 'analysis'),
  entry(ahkVSCodeProblemsToolDefinition, 'vscode-problems', 'analysis'),
  entry(ahkLintToolDefinition, 'lint', 'analysis'),
  entry(ahkThqbyDocumentSymbolsToolDefinition, 'thqby-document-symbols', 'analysis'),
  // entry(ahkDiagnosticsToolDefinition, 'diagnostics', 'analysis'), // Hidden: use lint instead

  // Docs (readOnly, idempotent)
  entry(ahkPromptsToolDefinition, 'prompts', 'docs'),
  entry(ahkDocSearchToolDefinition, 'doc-search', 'docs'),
  // entry(ahkSummaryToolDefinition, 'summary', 'docs'), // Hidden: low value
  // entry(ahkSamplingEnhancerToolDefinition, 'sampling-enhancer', 'analysis'), // Hidden: unclear value

  // Execution (destructive, openWorld)
  entry(ahkDebugAgentToolDefinition, 'run-debug', 'execution'),
  entry(ahkCloudValidateToolDefinition, 'cloud-validate', 'execution'),
  // entry(ahkRunToolDefinition, 'run-script', 'execution'), // Hidden: use run-debug instead
  // entry(ahkTestInteractiveToolDefinition, 'test-interactive', 'execution'), // Hidden: dev-only

  // Debug (destructive, openWorld)
  entry(ahkDebugDBGpToolDefinition, 'debug-dbgp', 'debug'),

  // System (readOnly)
  entry(ahkConfigToolDefinition, 'config', 'system'),
  entry(ahkVSCodeOpenToolDefinition, 'vscode-open', 'system', { openWorldHint: true }),
  entry(ahkSettingsToolDefinition, 'settings', 'system'),
  // entry(ahkAlphaToolDefinition, 'alpha-channel', 'system'), // Hidden: experimental

  // LSP (readOnly, idempotent)
  entry(ahkLspToolDefinition, 'lsp', 'lsp'),

  // Observability (readOnly, idempotent)
  entry(ahkAnalyticsToolDefinition, 'analytics', 'observability'),
  // entry(ahkTraceViewerToolDefinition, 'trace-viewer', 'observability'), // Hidden: debug-only

  // Library (readOnly, idempotent)
  entry(AHK_Library_List_Definition, 'library-list', 'library'),
  entry(AHK_Library_Info_Definition, 'library-info', 'library'),
  entry(AHK_Library_Import_Definition, 'library-import', 'library'),
  entry(AHK_Library_Search_Definition, 'library-search', 'library'),
  // entry(ahkActiveFileToolDefinition, 'active-file', 'file'), // Hidden: duplicate of file-active
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

/**
 * Get tool annotations by tool name
 */
export function getToolAnnotations(name: string): ToolAnnotations | undefined {
  const metadata = getToolMetadataByName(name);
  return metadata?.annotations;
}

/**
 * Get all tool definitions with annotations included
 */
export function getToolDefinitionsWithAnnotations(): Array<
  Tool & { annotations?: ToolAnnotations }
> {
  return TOOL_METADATA.map(entry => ({
    ...entry.definition,
    annotations: entry.annotations,
  }));
}
