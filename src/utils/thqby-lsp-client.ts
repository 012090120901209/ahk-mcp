import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import logger from '../logger.js';
import { toolSettings } from '../core/tool-settings.js';

export interface ThqbyLspOptions {
  serverPath?: string;
  nodePath?: string;
  rootPath?: string;
  timeoutMs?: number;
  locale?: string;
}

interface LspResponse {
  jsonrpc: string;
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface PendingRequest {
  resolve: (value: LspResponse) => void;
  reject: (error: Error) => void;
  timeout?: NodeJS.Timeout;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_LOCALE = 'en-us';

function resolveDefaultServerPath(): string | null {
  const envPath = process.env.AHK_THQBY_LSP_SERVER;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const settingsPath = toolSettings.getSettings().thqbyLspServerPath;
  if (settingsPath && fs.existsSync(settingsPath)) return settingsPath;

  const localPath = path.join(
    process.cwd(),
    'vscode-autohotkey2-lsp',
    'server',
    'dist',
    'server.js'
  );
  if (fs.existsSync(localPath)) return localPath;

  return null;
}

function resolveNodePath(): string {
  const settingsNode = toolSettings.getSettings().thqbyLspNodePath;
  if (settingsNode && settingsNode.trim().length > 0) return settingsNode;
  return process.execPath;
}

function toFileUri(targetPath: string): string {
  return pathToFileURL(targetPath).toString();
}

export async function requestDocumentSymbols(
  code: string,
  filePath?: string,
  options: ThqbyLspOptions = {}
): Promise<unknown> {
  const serverPath = options.serverPath ?? resolveDefaultServerPath();
  if (!serverPath) {
    throw new Error(
      'THQBY LSP server not found. Set AHK_THQBY_LSP_SERVER or configure thqbyLspServerPath in AHK_Settings.'
    );
  }

  const nodePath = options.nodePath ?? resolveNodePath();
  const rootPath = options.rootPath ?? process.cwd();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const locale = options.locale ?? DEFAULT_LOCALE;

  if (!fs.existsSync(serverPath)) {
    throw new Error(`THQBY LSP server path does not exist: ${serverPath}`);
  }

  const lsp = new ThqbyLspProcess(nodePath, serverPath, timeoutMs);
  try {
    await lsp.initialize(rootPath, locale);
    const uri = filePath
      ? toFileUri(path.resolve(filePath))
      : toFileUri(path.join(rootPath, 'virtual.ahk'));
    await lsp.didOpen(uri, code);
    const result = await lsp.request('textDocument/documentSymbol', {
      textDocument: { uri },
    });
    await lsp.shutdown();
    return result;
  } finally {
    lsp.dispose();
  }
}

class ThqbyLspProcess {
  private child;
  private buffer = Buffer.alloc(0);
  private nextId = 1;
  private pending = new Map<number, PendingRequest>();
  private timeoutMs: number;
  private initialized = false;

  constructor(nodePath: string, serverPath: string, timeoutMs: number) {
    this.timeoutMs = timeoutMs;
    this.child = spawn(nodePath, [serverPath, '--stdio'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.child.stdout.on('data', (chunk: Buffer) => this.onData(chunk));
    this.child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8').trim();
      if (text.length > 0) logger.debug(`THQBY LSP stderr: ${text}`);
    });
    this.child.on('error', error => {
      this.rejectAll(error);
    });
    this.child.on('exit', (code, signal) => {
      if (code !== 0) {
        const msg = `THQBY LSP exited with code=${code ?? 'null'} signal=${signal ?? 'null'}`;
        this.rejectAll(new Error(msg));
      }
    });
  }

  dispose(): void {
    this.rejectAll(new Error('LSP client disposed'));
    if (!this.child.killed) {
      this.child.kill();
    }
  }

  private rejectAll(error: Error): void {
    for (const pending of this.pending.values()) {
      if (pending.timeout) clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();
  }

  private onData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (true) {
      const headerEnd = this.buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) return;

      const headerText = this.buffer.slice(0, headerEnd).toString('utf8');
      const lengthMatch = /Content-Length:\s*(\d+)/i.exec(headerText);
      if (!lengthMatch) {
        this.buffer = this.buffer.slice(headerEnd + 4);
        continue;
      }

      const contentLength = Number.parseInt(lengthMatch[1], 10);
      const bodyStart = headerEnd + 4;
      if (this.buffer.length < bodyStart + contentLength) return;

      const body = this.buffer.slice(bodyStart, bodyStart + contentLength).toString('utf8');
      this.buffer = this.buffer.slice(bodyStart + contentLength);

      try {
        const message = JSON.parse(body) as LspResponse;
        if (typeof message.id === 'number') {
          const pending = this.pending.get(message.id);
          if (pending) {
            if (pending.timeout) clearTimeout(pending.timeout);
            this.pending.delete(message.id);
            pending.resolve(message);
          }
        }
      } catch (error) {
        logger.warn(
          `Failed to parse THQBY LSP message: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  private sendMessage(payload: Record<string, unknown>): void {
    const json = JSON.stringify(payload);
    const header = `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n`;
    this.child.stdin.write(header + json, 'utf8');
  }

  async request(method: string, params?: Record<string, unknown>): Promise<unknown> {
    const id = this.nextId++;
    const payload = { jsonrpc: '2.0', id, method, params };

    return new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`THQBY LSP request timed out: ${method}`));
      }, this.timeoutMs);

      this.pending.set(id, {
        resolve: response => {
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
        },
        reject,
        timeout,
      });

      this.sendMessage(payload);
    });
  }

  async initialize(rootPath: string, locale: string): Promise<void> {
    if (this.initialized) return;
    const rootUri = toFileUri(path.resolve(rootPath));
    await this.request('initialize', {
      processId: process.pid,
      rootUri,
      capabilities: {},
      initializationOptions: {
        locale,
      },
    });
    this.sendMessage({ jsonrpc: '2.0', method: 'initialized', params: {} });
    this.initialized = true;
  }

  async didOpen(uri: string, text: string): Promise<void> {
    this.sendMessage({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: {
        textDocument: {
          uri,
          languageId: 'ahk2',
          version: 1,
          text,
        },
      },
    });
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) return;
    await this.request('shutdown');
    this.sendMessage({ jsonrpc: '2.0', method: 'exit' });
    this.initialized = false;
  }
}
