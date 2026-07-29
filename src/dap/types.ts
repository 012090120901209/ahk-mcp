/**
 * Debug Adapter Protocol (DAP) message types.
 *
 * Minimal subset of the Microsoft DAP spec that we need for the AHK translator.
 * Keeping these local avoids pulling @vscode/debugprotocol into runtime deps
 * while preserving strict typing. Types mirror the spec field names so a DAP
 * client (VS Code / Cursor / JetBrains) can talk to us unchanged.
 *
 * Spec reference: https://microsoft.github.io/debug-adapter-protocol/specification
 */

/** Top-level envelope for every DAP wire message. */
export interface DapProtocolMessage {
  seq: number;
  type: 'request' | 'response' | 'event';
}

export interface DapRequest extends DapProtocolMessage {
  type: 'request';
  command: string;
  arguments?: unknown;
}

export interface DapResponse extends DapProtocolMessage {
  type: 'response';
  request_seq: number;
  success: boolean;
  command: string;
  message?: string;
  body?: unknown;
}

export interface DapEvent extends DapProtocolMessage {
  type: 'event';
  event: string;
  body?: unknown;
}

// ---------- Capabilities ----------

export interface DapCapabilities {
  supportsConfigurationDoneRequest?: boolean;
  supportsEvaluateForHovers?: boolean;
  supportsSetVariable?: boolean;
  supportsConditionalBreakpoints?: boolean;
  supportsTerminateRequest?: boolean;
  supportsCancelRequest?: boolean;
  supportsStepBack?: boolean;
  supportTerminateDebuggee?: boolean;
  exceptionBreakpointFilters?: Array<{
    filter: string;
    label: string;
    default?: boolean;
  }>;
}

// ---------- Source / Breakpoints ----------

export interface DapSource {
  name?: string;
  path?: string;
  sourceReference?: number;
}

export interface DapSourceBreakpoint {
  line: number;
  column?: number;
  condition?: string;
  hitCondition?: string;
  logMessage?: string;
}

export interface DapBreakpoint {
  id?: number;
  verified: boolean;
  message?: string;
  source?: DapSource;
  line?: number;
  column?: number;
}

// ---------- Stack / Scopes / Variables ----------

export interface DapStackFrame {
  id: number;
  name: string;
  source?: DapSource;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface DapScope {
  name: string;
  variablesReference: number;
  expensive: boolean;
  presentationHint?: 'arguments' | 'locals' | 'registers';
}

export interface DapVariable {
  name: string;
  value: string;
  type?: string;
  variablesReference: number;
  evaluateName?: string;
}

export interface DapThread {
  id: number;
  name: string;
}

// ---------- Request argument shapes (only fields we read) ----------

export interface DapInitializeArguments {
  clientID?: string;
  clientName?: string;
  adapterID: string;
  locale?: string;
  linesStartAt1?: boolean;
  columnsStartAt1?: boolean;
  pathFormat?: 'path' | 'uri';
}

export interface DapLaunchArguments {
  program: string;
  args?: string[];
  cwd?: string;
  ahkPath?: string;
  stopOnEntry?: boolean;
  noDebug?: boolean;
  /** Port DBGp listener binds on. Defaults to 9000. */
  dbgpPort?: number;
}

export interface DapAttachArguments {
  /** Port AHK's DBGp client connects to. Defaults to 9000. */
  dbgpPort?: number;
  /** Optional. If we need to resolve source paths on the DAP-client side. */
  localRoot?: string;
}

export interface DapSetBreakpointsArguments {
  source: DapSource;
  breakpoints?: DapSourceBreakpoint[];
  lines?: number[];
  sourceModified?: boolean;
}

export interface DapSetExceptionBreakpointsArguments {
  filters: string[];
}

export interface DapStackTraceArguments {
  threadId: number;
  startFrame?: number;
  levels?: number;
}

export interface DapScopesArguments {
  frameId: number;
}

export interface DapVariablesArguments {
  variablesReference: number;
  filter?: 'indexed' | 'named';
  start?: number;
  count?: number;
}

export interface DapContinueArguments {
  threadId: number;
}

export interface DapNextArguments {
  threadId: number;
}

export interface DapStepInArguments {
  threadId: number;
}

export interface DapStepOutArguments {
  threadId: number;
}

export interface DapPauseArguments {
  threadId: number;
}

export interface DapEvaluateArguments {
  expression: string;
  frameId?: number;
  context?: 'watch' | 'repl' | 'hover' | 'clipboard' | 'variables';
}

export interface DapSourceArguments {
  sourceReference: number;
  source?: DapSource;
}

export interface DapDisconnectArguments {
  restart?: boolean;
  terminateDebuggee?: boolean;
}

// ---------- Event body shapes ----------

export interface DapStoppedEventBody {
  reason: 'step' | 'breakpoint' | 'exception' | 'pause' | 'entry' | 'goto' | 'function breakpoint';
  description?: string;
  threadId?: number;
  preserveFocusHint?: boolean;
  text?: string;
  allThreadsStopped?: boolean;
  hitBreakpointIds?: number[];
}

export interface DapContinuedEventBody {
  threadId: number;
  allThreadsContinued?: boolean;
}

export interface DapOutputEventBody {
  category?: 'console' | 'stdout' | 'stderr' | 'telemetry' | 'important';
  output: string;
  variablesReference?: number;
  source?: DapSource;
  line?: number;
  column?: number;
  data?: unknown;
}

export interface DapThreadEventBody {
  reason: 'started' | 'exited';
  threadId: number;
}

export interface DapTerminatedEventBody {
  restart?: unknown;
}

// ---------- Internal handle types ----------

/**
 * Reference stored in the session's handle cache. Decoded during
 * `variables` requests to know *which* DBGp query to issue.
 */
export type VariableRef =
  | { kind: 'scope'; frameId: number; scopeId: number /** 0 local, 1 global */ }
  | { kind: 'child'; fullname: string; frameId: number };

export interface BreakpointRecord {
  /** DBGp-assigned breakpoint id. */
  dbgpId: string;
  /** Absolute file path as supplied by the DAP client. */
  file: string;
  line: number;
  condition?: string;
}
