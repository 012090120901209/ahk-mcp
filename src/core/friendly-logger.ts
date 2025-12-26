import fs from 'fs';
import path from 'path';

export enum LogCategory {
  RUN = '[EXEC]',
  EDIT = '[EDIT]',
  LINT = '[LINT]',
  CREATE = '[MAKE]',
  INFO = '[INFO]',
  ERROR = '[FAIL]',
  SUCCESS = '[DONE]',
  TOOL = '[TOOL]',
}

export class FriendlyLogger {
  private logFile: string;
  private static instance: FriendlyLogger;

  private constructor() {
    // Ensure logs directory exists
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    this.logFile = path.join(logDir, 'activity.log');
  }

  public static getInstance(): FriendlyLogger {
    if (!FriendlyLogger.instance) {
      FriendlyLogger.instance = new FriendlyLogger();
    }
    return FriendlyLogger.instance;
  }

  public log(category: LogCategory, message: string, details?: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] - ${category} - ${message}${details ? ` (${details})` : ''}\n`;

    try {
      fs.appendFileSync(this.logFile, logEntry);
      // Also write to stderr for immediate visibility if needed, but keep it clean
      // process.stderr.write(logEntry);
    } catch (error) {
      console.error('Failed to write to friendly log:', error);
    }
  }

  public info(message: string, details?: string): void {
    this.log(LogCategory.INFO, message, details);
  }

  public success(message: string, details?: string): void {
    this.log(LogCategory.SUCCESS, message, details);
  }

  public error(message: string, details?: string): void {
    this.log(LogCategory.ERROR, message, details);
  }
}

export const friendlyLogger = FriendlyLogger.getInstance();
