import { envConfig } from './core/env-config.js';
import { tracer } from './core/tracing.js';

// Simple logger that writes only to stderr to prevent stdout pollution
class StderrLogger {
  private static levelOrder: Record<string, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  private useJsonFormat: boolean;

  constructor() {
    // Enable JSON format via environment variable
    this.useJsonFormat = process.env.AHK_MCP_LOG_FORMAT === 'json';
  }

  private getThreshold(): number {
    const level = envConfig.getLogLevel();
    return StderrLogger.levelOrder[level];
  }

  private shouldLog(level: string): boolean {
    const threshold = this.getThreshold();
    const current = StderrLogger.levelOrder[level] ?? StderrLogger.levelOrder.info;
    return current <= threshold;
  }

  private serialize(arg: any, level: string): string {
    if (typeof arg === 'string') return arg;
    if (typeof arg !== 'object' || arg === null) return String(arg);
    // Avoid heavy serialization for verbose levels
    if (level === 'debug') {
      try {
        const text = JSON.stringify(arg);
        return text.length > 2000 ? text.slice(0, 2000) + '…' : text;
      } catch {
        return '[Object]';
      }
    }
    try {
      const text = JSON.stringify(arg);
      return text.length > 8000 ? text.slice(0, 8000) + '…' : text;
    } catch {
      return '[Object]';
    }
  }

  private log(level: string, ...args: any[]): void {
    if (!this.shouldLog(level)) return;
    const timestamp = new Date().toISOString();

    // Get current trace context if available
    const context = tracer.getCurrentContext();

    if (this.useJsonFormat) {
      // Structured JSON logging
      const logEntry: Record<string, unknown> = {
        timestamp,
        level: level.toUpperCase(),
        message: args.map(arg => this.serialize(arg, level)).join(' '),
      };

      // Add trace context if available
      if (context) {
        logEntry.traceId = context.traceId;
        logEntry.spanId = context.spanId;
        if (context.parentSpanId) {
          logEntry.parentSpanId = context.parentSpanId;
        }
      }

      process.stderr.write(JSON.stringify(logEntry) + '\n');
    } else {
      // Human-readable format with trace context
      const message = args.map(arg => this.serialize(arg, level)).join(' ');
      const traceInfo = context ? ` [traceId: ${context.traceId}] [spanId: ${context.spanId}]` : '';

      process.stderr.write(`[${timestamp}] ${level.toUpperCase()}:${traceInfo} ${message}\n`);
    }
  }

  error(...args: any[]): void {
    this.log('error', ...args);
  }

  warn(...args: any[]): void {
    this.log('warn', ...args);
  }

  info(...args: any[]): void {
    this.log('info', ...args);
  }

  debug(...args: any[]): void {
    this.log('debug', ...args);
  }
}

const logger = new StderrLogger();

// Override console methods to prevent accidental stdout usage
// This is a failsafe in case any dependency tries to use console.log
console.log = (...args: any[]) => {
  // Redirect to stderr instead of stdout
  process.stderr.write('[CONSOLE.LOG REDIRECTED] ' + args.join(' ') + '\n');
};

export default logger;
