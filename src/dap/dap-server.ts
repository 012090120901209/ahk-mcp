/**
 * DAP TCP server.
 *
 * Listens on a configurable port (default 9001) and, on each client
 * connection, creates a new DapSession bound to the framed-message socket.
 *
 * Wire format (per DAP spec):
 *   Content-Length: N\r\n
 *   \r\n
 *   <JSON payload of N bytes>
 *
 * We accept one DAP client at a time. A second connection while one is active
 * is closed immediately with a log message — generic DAP clients do not
 * multiplex, so this keeps the session model simple.
 */

import * as net from 'net';
import logger from '../logger.js';
import { DapSession } from './dap-session.js';
import type { DapProtocolMessage } from './types.js';

export interface DapServerOptions {
  /** Port to listen on. Defaults to env AHK_DAP_PORT or 9001. */
  port?: number;
  /** Interface to bind. Defaults to 127.0.0.1 (loopback only). */
  host?: string;
}

export interface DapServerHandle {
  readonly port: number;
  close(): Promise<void>;
}

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 9001;

/**
 * Framed-message codec for DAP over TCP.
 *
 * Buffers incoming bytes until a full `Content-Length` frame is available,
 * then invokes `onMessage` with the parsed JSON payload. Malformed frames
 * are logged and discarded without tearing down the socket — a well-behaved
 * DAP client never sends them, but broken ones shouldn't crash the server.
 */
export class DapFrameCodec {
  private buffer: Buffer = Buffer.alloc(0);

  constructor(
    private readonly onMessage: (msg: unknown) => void,
    private readonly onError: (err: Error) => void
  ) {}

  /** Feed raw bytes received from the socket. */
  push(chunk: Buffer): void {
    this.buffer = this.buffer.length === 0 ? chunk : Buffer.concat([this.buffer, chunk]);
    while (this.tryExtractOne()) {
      /* loop until no more complete frames */
    }
  }

  private tryExtractOne(): boolean {
    const headerEnd = this.buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) return false;

    const headerText = this.buffer.subarray(0, headerEnd).toString('utf8');
    const match = headerText.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      // Unrecoverable: header missing Content-Length. Reset buffer.
      this.onError(new Error(`DAP frame missing Content-Length: ${headerText}`));
      this.buffer = this.buffer.subarray(headerEnd + 4);
      return this.buffer.length > 0;
    }

    const length = parseInt(match[1], 10);
    const frameStart = headerEnd + 4;
    if (this.buffer.length < frameStart + length) {
      // Not enough bytes yet; wait for more.
      return false;
    }

    const payload = this.buffer.subarray(frameStart, frameStart + length);
    this.buffer = this.buffer.subarray(frameStart + length);

    try {
      const parsed: unknown = JSON.parse(payload.toString('utf8'));
      this.onMessage(parsed);
    } catch (err) {
      this.onError(err instanceof Error ? err : new Error(String(err)));
    }
    return this.buffer.length > 0;
  }
}

/** Encode a single DAP message as a framed TCP payload. */
export function encodeDapFrame(msg: DapProtocolMessage): Buffer {
  const json = JSON.stringify(msg);
  const body = Buffer.from(json, 'utf8');
  const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'utf8');
  return Buffer.concat([header, body]);
}

/**
 * Start the DAP server. Returns a handle with the resolved port and a
 * graceful-shutdown function. Does NOT throw if the preferred port is in use:
 * it falls back to the next available port and logs a warning, mirroring the
 * behaviour of DBGpClient.listen().
 */
export async function startDapServer(options: DapServerOptions = {}): Promise<DapServerHandle> {
  const host = options.host ?? DEFAULT_HOST;
  let port = options.port ?? resolvePortFromEnv() ?? DEFAULT_PORT;

  let activeSession: DapSession | null = null;

  const server = net.createServer(socket => {
    if (activeSession !== null) {
      logger.warn(
        `DAP server already has an active session; rejecting new connection from ${socket.remoteAddress}:${socket.remotePort}`
      );
      socket.end();
      return;
    }

    logger.info(`DAP client connected from ${socket.remoteAddress}:${socket.remotePort}`);

    const session = new DapSession({
      send: msg => {
        if (socket.destroyed || socket.writableEnded) return;
        socket.write(encodeDapFrame(msg));
      },
      close: () => {
        if (!socket.destroyed) socket.end();
      },
    });
    activeSession = session;

    const codec = new DapFrameCodec(
      msg => void session.handleIncoming(msg),
      err => logger.warn(`DAP codec error: ${err.message}`)
    );

    socket.on('data', data => codec.push(data));
    socket.on('error', err => {
      logger.warn(`DAP socket error: ${err.message}`);
    });
    socket.on('close', () => {
      logger.info('DAP client disconnected');
      void session.dispose().catch(err => {
        logger.warn(`DAP session dispose failed: ${String(err)}`);
      });
      activeSession = null;
    });
  });

  // Binding with EADDRINUSE fallback (same strategy as DBGpClient).
  await new Promise<void>((resolve, reject) => {
    const bind = (attemptPort: number) => {
      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          logger.warn(`DAP port ${attemptPort} in use, trying ${attemptPort + 1}`);
          port = attemptPort + 1;
          bind(port);
        } else {
          reject(err);
        }
      });
      server.listen(attemptPort, host, () => {
        logger.info(`DAP server listening on ${host}:${attemptPort}`);
        resolve();
      });
    };
    bind(port);
  });

  return {
    get port() {
      return port;
    },
    async close() {
      if (activeSession) {
        await activeSession.dispose().catch(() => {
          /* swallow on shutdown */
        });
        activeSession = null;
      }
      await new Promise<void>(resolve => {
        server.close(() => resolve());
      });
      logger.info('DAP server stopped');
    },
  };
}

function resolvePortFromEnv(): number | undefined {
  const raw = process.env.AHK_DAP_PORT;
  if (!raw) return undefined;
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) return undefined;
  return parsed;
}
