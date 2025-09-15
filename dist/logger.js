// Simple logger that writes only to stderr to prevent stdout pollution
class StderrLogger {
    getThreshold() {
        const raw = (process.env.AHK_MCP_LOG_LEVEL || process.env.LOG_LEVEL || 'warn').toLowerCase();
        const normalized = ['error', 'warn', 'info', 'debug'].includes(raw) ? raw : 'warn';
        return StderrLogger.levelOrder[normalized];
    }
    shouldLog(level) {
        const threshold = this.getThreshold();
        const current = StderrLogger.levelOrder[level] ?? StderrLogger.levelOrder.info;
        return current <= threshold;
    }
    serialize(arg, level) {
        if (typeof arg === 'string')
            return arg;
        if (typeof arg !== 'object' || arg === null)
            return String(arg);
        // Avoid heavy serialization for verbose levels
        if (level === 'debug') {
            try {
                const text = JSON.stringify(arg);
                return text.length > 2000 ? text.slice(0, 2000) + '…' : text;
            }
            catch {
                return '[Object]';
            }
        }
        try {
            const text = JSON.stringify(arg);
            return text.length > 8000 ? text.slice(0, 8000) + '…' : text;
        }
        catch {
            return '[Object]';
        }
    }
    log(level, ...args) {
        if (!this.shouldLog(level))
            return;
        const timestamp = new Date().toISOString();
        const message = args.map(arg => this.serialize(arg, level)).join(' ');
        // Write directly to stderr to avoid stdout pollution
        process.stderr.write(`[${timestamp}] ${level.toUpperCase()}: ${message}\n`);
    }
    error(...args) {
        this.log('error', ...args);
    }
    warn(...args) {
        this.log('warn', ...args);
    }
    info(...args) {
        this.log('info', ...args);
    }
    debug(...args) {
        this.log('debug', ...args);
    }
}
StderrLogger.levelOrder = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};
const logger = new StderrLogger();
// Override console methods to prevent accidental stdout usage
// This is a failsafe in case any dependency tries to use console.log
const originalConsoleLog = console.log;
console.log = (...args) => {
    // Redirect to stderr instead of stdout
    process.stderr.write('[CONSOLE.LOG REDIRECTED] ' + args.join(' ') + '\n');
};
export default logger;
