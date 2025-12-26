/**
 * Unified Real-Time Logger for AHK MCP Server
 *
 * Replaces the fragmented 3-logger system (Logger, FriendlyLogger, DebugJournal)
 * with a single, human-readable, real-time log that streams tool call events.
 *
 * Output format:
 * [14:32:05] > AHK_File_Edit started
 * [14:32:05]   file: MyScript.ahk
 * [14:32:05] < AHK_File_Edit [42ms] +5 -2 lines
 */

import * as fs from 'fs';
import * as path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ToolLogEntry {
  id: string;
  tool: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'success' | 'error';
  args: Record<string, unknown>;
  result?: string;
  error?: string;
}

export interface ToolResponse {
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool-Specific Summarizers
// ─────────────────────────────────────────────────────────────────────────────

type Summarizer = (
  args: Record<string, unknown>,
  result?: ToolResponse
) => {
  argLines: string[];
  resultLine: string;
};

const summarizers: Record<string, Summarizer> = {
  // File operations
  AHK_File_View: (args, result) => ({
    argLines: [args.filePath ? `file: ${path.basename(String(args.filePath))}` : ''],
    resultLine: result?.content?.[0]?.text
      ? `${countLines(result.content[0].text)} lines`
      : 'viewed',
  }),

  AHK_File_Edit: (args, result) => ({
    argLines: [
      args.filePath ? `file: ${path.basename(String(args.filePath))}` : '',
      args.action ? `action: ${args.action}` : '',
    ].filter(Boolean),
    resultLine: extractEditSummary(result),
  }),

  AHK_File_Edit_Small: (args, result) => ({
    argLines: [
      args.filePath ? `file: ${path.basename(String(args.filePath))}` : '',
      args.action ? `action: ${args.action}` : '',
    ].filter(Boolean),
    resultLine: extractEditSummary(result),
  }),

  AHK_File_Edit_Advanced: (args, result) => ({
    argLines: [
      args.filePath ? `file: ${path.basename(String(args.filePath))}` : '',
      args.action ? `action: ${args.action}` : '',
    ].filter(Boolean),
    resultLine: extractEditSummary(result),
  }),

  AHK_File_Create: args => ({
    argLines: [args.filePath ? `file: ${path.basename(String(args.filePath))}` : ''],
    resultLine: 'created',
  }),

  // Run/Debug operations
  AHK_Run: (args, result) => ({
    argLines: [args.filePath ? `file: ${path.basename(String(args.filePath))}` : ''],
    resultLine: extractRunSummary(result),
  }),

  AHK_Run_Debug: (args, result) => ({
    argLines: [args.filePath ? `file: ${path.basename(String(args.filePath))}` : ''],
    resultLine: extractRunSummary(result),
  }),

  // Analysis operations
  AHK_Analyze: (args, result) => ({
    argLines: [args.code ? `code: ${String(args.code).length} chars` : ''],
    resultLine: extractAnalyzeSummary(result),
  }),

  AHK_Analyze_Complete: (args, result) => ({
    argLines: [args.filePath ? `file: ${path.basename(String(args.filePath))}` : ''],
    resultLine: extractAnalyzeSummary(result),
  }),

  // Documentation
  AHK_Doc_Search: (args, result) => ({
    argLines: [args.query ? `query: "${args.query}"` : ''],
    resultLine: extractDocSummary(result),
  }),

  AHK_Docs_Context: (args, result) => ({
    argLines: [args.topic ? `topic: "${args.topic}"` : ''],
    resultLine: extractDocSummary(result),
  }),

  // Library operations
  AHK_Library_Import: args => ({
    argLines: [
      args.libraryName ? `library: ${args.libraryName}` : '',
      args.filePath ? `target: ${path.basename(String(args.filePath))}` : '',
    ].filter(Boolean),
    resultLine: 'imported',
  }),

  AHK_Library_List: (_args, result) => ({
    argLines: [],
    resultLine: result?.content?.[0]?.text
      ? `${countJsonArrayItems(result.content[0].text)} libraries`
      : 'listed',
  }),
};

// Default summarizer for unknown tools
const defaultSummarizer: Summarizer = (args, result) => ({
  argLines: Object.entries(args)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${summarizeValue(v)}`),
  resultLine: result?.isError ? 'error' : 'done',
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function countLines(text: string): number {
  return text.split('\n').length;
}

function countJsonArrayItems(text: string): number {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.length : 1;
  } catch {
    return 0;
  }
}

function summarizeValue(value: unknown): string {
  if (typeof value === 'string') {
    if (value.length > 50) return `"${value.slice(0, 47)}..."`;
    if (value.includes('\n')) return `"${value.split('\n')[0].slice(0, 30)}..." (multiline)`;
    return `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).length} keys}`;
  }
  return String(value);
}

function extractEditSummary(result?: ToolResponse): string {
  if (!result?.content?.[0]?.text) return 'edited';
  const text = result.content[0].text;

  // Try to extract line counts from common patterns
  const addMatch = text.match(/\+(\d+)/);
  const delMatch = text.match(/-(\d+)/);
  if (addMatch || delMatch) {
    const adds = addMatch ? `+${addMatch[1]}` : '';
    const dels = delMatch ? `-${delMatch[1]}` : '';
    return `${adds} ${dels} lines`.trim();
  }

  if (text.includes('success') || text.includes('Success')) return 'success';
  if (text.includes('no changes')) return 'no changes';
  return 'edited';
}

function extractRunSummary(result?: ToolResponse): string {
  if (!result?.content?.[0]?.text) return 'executed';
  const text = result.content[0].text;

  // Extract PID
  const pidMatch = text.match(/pid[:\s]+(\d+)/i);
  const pid = pidMatch ? `pid: ${pidMatch[1]}` : '';

  // Extract window title
  const winMatch = text.match(/window[:\s]+"([^"]+)"/i) || text.match(/title[:\s]+"([^"]+)"/i);
  const win = winMatch ? `window: "${winMatch[1]}"` : '';

  // Extract exit code
  const exitMatch = text.match(/exit[:\s]+(\d+)/i);
  const exit = exitMatch ? `exit: ${exitMatch[1]}` : '';

  const parts = [pid, win, exit].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'executed';
}

function extractAnalyzeSummary(result?: ToolResponse): string {
  if (!result?.content?.[0]?.text) return 'analyzed';
  const text = result.content[0].text;

  const errorMatch = text.match(/(\d+)\s*error/i);
  const warnMatch = text.match(/(\d+)\s*warn/i);

  const errors = errorMatch ? `${errorMatch[1]} errors` : '0 errors';
  const warns = warnMatch ? `, ${warnMatch[1]} warnings` : '';

  return `${errors}${warns}`;
}

function extractDocSummary(result?: ToolResponse): string {
  if (!result?.content?.[0]?.text) return 'searched';
  const text = result.content[0].text;

  const countMatch = text.match(/(\d+)\s*(result|match|item)/i);
  return countMatch ? `${countMatch[1]} results` : 'found';
}

function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified Logger Class
// ─────────────────────────────────────────────────────────────────────────────

export class UnifiedLogger {
  private logPath: string;
  private stream: fs.WriteStream | null = null;
  private activeEntries: Map<string, ToolLogEntry> = new Map();
  private currentSize = 0;
  private maxSize: number;
  private maxFiles: number;
  private enabled: boolean;

  constructor(
    options: {
      logDir?: string;
      logFile?: string;
      maxSize?: number;
      maxFiles?: number;
      enabled?: boolean;
    } = {}
  ) {
    const logDir = options.logDir || path.join(process.cwd(), 'logs');
    const logFile = options.logFile || 'unified.log';
    this.logPath = path.join(logDir, logFile);
    this.maxSize = options.maxSize || 1024 * 1024; // 1MB default
    this.maxFiles = options.maxFiles || 5;
    this.enabled = options.enabled ?? true;

    if (this.enabled) {
      this.ensureLogDir(logDir);
      this.openStream();
    }
  }

  private ensureLogDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private openStream(): void {
    try {
      // Get current file size if exists
      if (fs.existsSync(this.logPath)) {
        const stats = fs.statSync(this.logPath);
        this.currentSize = stats.size;
      }

      this.stream = fs.createWriteStream(this.logPath, { flags: 'a' });
      this.stream.on('error', err => {
        process.stderr.write(`[UnifiedLogger] Stream error: ${err.message}\n`);
      });
    } catch (err) {
      process.stderr.write(`[UnifiedLogger] Failed to open log: ${err}\n`);
    }
  }

  private write(line: string): void {
    if (!this.enabled || !this.stream) return;

    const bytes = Buffer.byteLength(line + '\n', 'utf8');
    this.currentSize += bytes;

    this.stream.write(line + '\n');

    // Check rotation
    if (this.currentSize >= this.maxSize) {
      this.rotate();
    }
  }

  private rotate(): void {
    if (!this.stream) return;

    this.stream.end();

    // Rotate existing files
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const from = i === 1 ? this.logPath : `${this.logPath}.${i - 1}`;
      const to = `${this.logPath}.${i}`;
      if (fs.existsSync(from)) {
        try {
          if (fs.existsSync(to)) fs.unlinkSync(to);
          fs.renameSync(from, to);
        } catch {
          // Ignore rotation errors
        }
      }
    }

    this.currentSize = 0;
    this.openStream();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Public API
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Log tool execution start
   */
  toolStart(id: string, tool: string, args: Record<string, unknown> = {}): void {
    const entry: ToolLogEntry = {
      id,
      tool,
      startTime: Date.now(),
      status: 'running',
      args,
    };
    this.activeEntries.set(id, entry);

    const time = formatTime();
    const summarizer = summarizers[tool] || defaultSummarizer;
    const { argLines } = summarizer(args);

    // Write start line
    this.write(`[${time}] > ${tool} started`);

    // Write argument lines (indented)
    for (const line of argLines) {
      if (line) this.write(`[${time}]   ${line}`);
    }
  }

  /**
   * Log tool execution success
   */
  toolEnd(id: string, result: ToolResponse): void {
    const entry = this.activeEntries.get(id);
    if (!entry) {
      // Tool wasn't tracked, create minimal log
      this.write(`[${formatTime()}] < unknown tool completed`);
      return;
    }

    entry.endTime = Date.now();
    entry.status = result.isError ? 'error' : 'success';
    this.activeEntries.delete(id);

    const time = formatTime();
    const duration = formatDuration(entry.endTime - entry.startTime);
    const summarizer = summarizers[entry.tool] || defaultSummarizer;
    const { resultLine } = summarizer(entry.args, result);

    const status = entry.status === 'error' ? 'ERROR' : resultLine;
    this.write(`[${time}] < ${entry.tool} [${duration}] ${status}`);
  }

  /**
   * Log tool execution error
   */
  toolError(id: string, error: Error | string): void {
    const entry = this.activeEntries.get(id);
    const tool = entry?.tool || 'unknown';
    const startTime = entry?.startTime || Date.now();

    if (entry) {
      entry.endTime = Date.now();
      entry.status = 'error';
      entry.error = error instanceof Error ? error.message : String(error);
      this.activeEntries.delete(id);
    }

    const time = formatTime();
    const duration = formatDuration(Date.now() - startTime);
    const errorMsg = error instanceof Error ? error.message : String(error);
    const shortError = errorMsg.length > 60 ? errorMsg.slice(0, 57) + '...' : errorMsg;

    this.write(`[${time}] < ${tool} [${duration}] ERROR: ${shortError}`);
  }

  /**
   * Log a general message (non-tool)
   */
  log(message: string): void {
    this.write(`[${formatTime()}]   ${message}`);
  }

  /**
   * Close the logger
   */
  close(): void {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
  }

  /**
   * Check if logger is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Instance
// ─────────────────────────────────────────────────────────────────────────────

let instance: UnifiedLogger | null = null;

export function getUnifiedLogger(): UnifiedLogger {
  if (!instance) {
    // Check environment variable for enabled state
    const enabled = process.env.AHK_MCP_UNIFIED_LOG !== 'false';
    instance = new UnifiedLogger({ enabled });
  }
  return instance;
}

export function initUnifiedLogger(
  options?: ConstructorParameters<typeof UnifiedLogger>[0]
): UnifiedLogger {
  if (instance) {
    instance.close();
  }
  instance = new UnifiedLogger(options);
  return instance;
}

// Default export for convenience
export default getUnifiedLogger;
