import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getAhkPath } from './core/config.js';
import { pathConverter, PathFormat } from './utils/path-converter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
/**
 * The AHK REPL host script, shipped in the repo's `scripts/` dir. Resolved
 * relative to the compiled `dist/` output (one level up), matching how the
 * tool registry resolves other shipped assets.
 */
const HOST_SCRIPT = join(__dirname, '..', 'scripts', 'repl-host.ahk');

const FIELD_SEP = '\x1F'; // separates <seq> from <payload> on the wire
const NL_ENCODE = '\x1A'; // stands in for a literal newline inside a payload
const ERR_PREFIX = '\x02'; // host tags error lines with this leading byte

/**
 * Translate a path into the Windows form the AutoHotkey `.exe` expects as an
 * argument. On native Windows the path is already Windows-style and passes
 * through untouched; under WSL a `/mnt/c/...` path is converted via ahk-mcp's
 * shared pathConverter (the same helper the run/diagnostics tools rely on).
 */
function toWinArg(p: string): string {
  const fmt = pathConverter.detectPathFormat(p);
  if (fmt === PathFormat.WSL || fmt === PathFormat.UNIX) {
    const r = pathConverter.wslToWindows(p);
    if (r.success) return r.convertedPath;
  }
  return p;
}

export interface EvalResult {
  output: string[];
  error: string[];
  timedOut: boolean;
}

interface Pending {
  marker: string;
  output: string[];
  error: string[];
  resolve: (r: EvalResult) => void;
  timer: NodeJS.Timeout;
}

const DEFAULT_TIMEOUT = 10000;

/**
 * A persistent AutoHotkey interpreter. One binary stays alive running
 * repl-host.ahk; each `send` writes a framed expression to its stdin and reads
 * back the lineout up to a per-command end marker. Interpreter state (variables,
 * defined via Eval) persists across calls until `reset`.
 *
 * Requires the alpha.30+Console fork of AutoHotkey (`Print()` BIF, `#EnableEval`
 * / `Eval()`). The binary is resolved via `getAhkPath()` — the same path ahk-mcp
 * uses for its run/diagnostics tools — so set it once via `AHK_PATH` or the
 * `ahkPath` config value.
 */
export class ReplSession {
  private child: ChildProcessWithoutNullStreams | null = null;
  private seq = 0;
  private pending: Pending | null = null;
  private stdoutBuf = '';

  private ensureStarted(): void {
    if (this.child) return;
    const bin = getAhkPath() ?? 'AutoHotkey64.exe';
    this.child = spawn(bin, ['/ErrorStdOut=utf-8', toWinArg(HOST_SCRIPT)], {
      windowsHide: true,
    }) as ChildProcessWithoutNullStreams;

    this.child.stdout.on('data', (chunk: Buffer) => this.onStdout(chunk));
    this.child.stderr.on('data', (chunk: Buffer) => {
      // Host load-time errors land here; attach to the in-flight command if any.
      const text = chunk.toString('utf-8');
      if (this.pending) {
        for (const line of text.split('\n')) {
          const t = line.replace(/\r$/, '');
          if (t) this.pending.error.push(t);
        }
      }
    });
    this.child.on('exit', () => {
      this.child = null;
      if (this.pending) {
        clearTimeout(this.pending.timer);
        const p = this.pending;
        this.pending = null;
        p.error.push('REPL host exited unexpectedly.');
        p.resolve({ output: p.output, error: p.error, timedOut: false });
      }
    });
    this.child.on('error', err => {
      if (this.pending) {
        this.pending.error.push(`spawn error: ${err.message} (binary: ${bin})`);
      }
    });
  }

  private onStdout(chunk: Buffer): void {
    this.stdoutBuf += chunk.toString('utf-8');
    let nl: number;
    while ((nl = this.stdoutBuf.indexOf('\n')) !== -1) {
      const line = this.stdoutBuf.slice(0, nl).replace(/\r$/, '');
      this.stdoutBuf = this.stdoutBuf.slice(nl + 1);
      this.routeLine(line);
    }
  }

  private routeLine(line: string): void {
    const p = this.pending;
    if (!p) return; // unsolicited output (e.g. before first command)
    if (line === p.marker) {
      clearTimeout(p.timer);
      this.pending = null;
      p.resolve({ output: p.output, error: p.error, timedOut: false });
      return;
    }
    if (line.startsWith(ERR_PREFIX)) {
      p.error.push(line.slice(ERR_PREFIX.length));
    } else {
      p.output.push(line);
    }
  }

  /** Evaluate a single AHK expression in the live interpreter. */
  async send(expr: string, timeoutMs: number = DEFAULT_TIMEOUT): Promise<EvalResult> {
    this.ensureStarted();
    if (this.pending) {
      throw new Error('REPL is busy with another expression.');
    }
    const seq = ++this.seq;
    const marker = `\x1E${seq}\x1E`;
    const payload = expr.replace(/\\/g, '\\\\').replace(/\n/g, NL_ENCODE);

    return await new Promise<EvalResult>(resolve => {
      const timer = setTimeout(() => {
        const p = this.pending;
        if (p && p.marker === marker) {
          this.pending = null;
          resolve({ output: p.output, error: p.error, timedOut: true });
        }
      }, timeoutMs);

      this.pending = { marker, output: [], error: [], resolve, timer };
      this.child!.stdin.write(`${seq}${FIELD_SEP}${payload}\n`);
    });
  }

  /** Kill the interpreter; the next `send` respawns a fresh one (state cleared). */
  reset(): void {
    this.stop();
  }

  /** Stop the interpreter and clear any pending command. */
  stop(): void {
    if (this.pending) {
      clearTimeout(this.pending.timer);
      this.pending = null;
    }
    if (this.child) {
      try {
        this.child.stdin.end();
      } catch {
        /* ignore */
      }
      this.child.kill();
      this.child = null;
    }
    this.stdoutBuf = '';
  }
}

/** Render an EvalResult into LLM-friendly text. */
export function formatEval(r: EvalResult): string {
  const lines: string[] = [];
  if (r.timedOut) lines.push('(timed out — interpreter still alive)');
  if (r.output.length) lines.push(r.output.join('\n'));
  if (r.error.length) lines.push('ERROR:', r.error.join('\n'));
  if (!lines.length) lines.push('(no output)');
  return lines.join('\n');
}
