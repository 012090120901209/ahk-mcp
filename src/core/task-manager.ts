import { randomUUID } from 'crypto';
import type { Task, TaskStatus } from '@modelcontextprotocol/server';
import logger from '../logger.js';
import type { ToolResponse } from './server-interface.js';
import { ErrorCode, ErrorCategory, ErrorSeverity } from './error-types.js';

export type TaskInfo = Task;

interface TaskRecord extends TaskInfo {
  toolName: string;
  result?: ToolResponse;
  expiresAt?: number;
  abortController: AbortController;
  waiters: Set<() => void>;
}

export interface TaskCreateOptions {
  toolName: string;
  ttl?: number | null;
  pollInterval?: number;
  execute: (signal: AbortSignal) => Promise<ToolResponse>;
}

export class TaskManager {
  private tasks = new Map<string, TaskRecord>();

  createTask(options: TaskCreateOptions): TaskInfo {
    this.pruneExpired();

    const now = new Date();
    const taskId = randomUUID();
    const ttl = options.ttl ?? null;
    const abortController = new AbortController();
    const record: TaskRecord = {
      taskId,
      toolName: options.toolName,
      status: 'working',
      statusMessage: 'Task started',
      createdAt: now.toISOString(),
      lastUpdatedAt: now.toISOString(),
      ttl,
      pollInterval: options.pollInterval,
      abortController,
      waiters: new Set(),
    };

    this.tasks.set(taskId, record);
    this.runTask(record, options.execute);

    logger.info(`Task created: ${taskId} for ${options.toolName}`);
    return this.toTaskInfo(record);
  }

  listTasks(cursor?: string, pageSize: number = 50): { tasks: TaskInfo[]; nextCursor?: string } {
    this.pruneExpired();
    const offset = this.decodeCursor(cursor);
    const items = Array.from(this.tasks.values())
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;

    return {
      tasks: items.map(task => this.toTaskInfo(task)),
      ...(nextOffset < this.tasks.size ? { nextCursor: this.encodeCursor(nextOffset) } : {}),
    };
  }

  getTask(taskId: string): TaskInfo | undefined {
    this.pruneExpired();
    const record = this.tasks.get(taskId);
    return record ? this.toTaskInfo(record) : undefined;
  }

  getTaskResult(
    taskId: string
  ): { status: TaskStatus; result?: ToolResponse; message?: string } | undefined {
    this.pruneExpired();
    const record = this.tasks.get(taskId);
    if (!record) return undefined;

    if (record.status === 'working') {
      return { status: 'working', message: 'Task still running' };
    }

    if (record.status === 'cancelled') {
      return {
        status: 'cancelled',
        result: record.result ?? this.createErrorResult('Task cancelled', taskId),
      };
    }

    if (record.result) {
      return { status: record.status, result: record.result };
    }

    return {
      status: record.status,
      result: this.createErrorResult(record.statusMessage || 'Task failed'),
    };
  }

  async waitForTaskResult(
    taskId: string,
    signal?: AbortSignal
  ): Promise<{ status: TaskStatus; result?: ToolResponse; message?: string } | undefined> {
    let outcome = this.getTaskResult(taskId);
    while (outcome?.status === 'working') {
      const record = this.tasks.get(taskId);
      if (!record) return undefined;
      await this.waitForChange(record, signal);
      outcome = this.getTaskResult(taskId);
    }

    return outcome;
  }

  cancelTask(taskId: string): TaskInfo | undefined {
    this.pruneExpired();
    const record = this.tasks.get(taskId);
    if (!record) return undefined;

    if (record.status === 'working') {
      record.abortController.abort(new Error('Task cancelled by client'));
      record.status = 'cancelled';
      record.statusMessage = 'Task cancelled by client';
      record.result = this.createErrorResult('Task cancelled by client', taskId);
      record.lastUpdatedAt = new Date().toISOString();
      this.startRetentionWindow(record);
      this.notifyWaiters(record);
      logger.info(`Task cancelled: ${taskId}`);
    }

    return this.toTaskInfo(record);
  }

  private runTask(
    record: TaskRecord,
    execute: (signal: AbortSignal) => Promise<ToolResponse>
  ): void {
    const taskId = record.taskId;
    const toolName = record.toolName;

    void (async () => {
      try {
        const result = await execute(record.abortController.signal);
        if (record.status !== 'working') {
          return;
        }

        record.result = result;
        record.status = result.isError ? 'failed' : 'completed';
        record.statusMessage = result.isError ? 'Task completed with errors' : 'Task completed';
        record.lastUpdatedAt = new Date().toISOString();
        this.startRetentionWindow(record);
        this.notifyWaiters(record);
        logger.info(`Task completed: ${taskId} (${toolName})`);
      } catch (error) {
        if (record.status !== 'working') {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        record.status = 'failed';
        record.statusMessage = message;
        record.result = this.createErrorResult(message);
        record.lastUpdatedAt = new Date().toISOString();
        this.startRetentionWindow(record);
        this.notifyWaiters(record);
        logger.error(`Task failed: ${taskId} (${toolName})`, error);
      }
    })();
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [taskId, record] of this.tasks) {
      if (!record.expiresAt || now <= record.expiresAt) continue;

      record.abortController.abort(new Error('Task expired'));
      this.notifyWaiters(record);
      this.tasks.delete(taskId);
      logger.warn(`Task expired and removed: ${taskId}`);
    }
  }

  private toTaskInfo(record: TaskRecord): TaskInfo {
    const { taskId, status, statusMessage, createdAt, lastUpdatedAt, ttl, pollInterval } = record;
    return { taskId, status, statusMessage, createdAt, lastUpdatedAt, ttl, pollInterval };
  }

  private encodeCursor(offset: number): string {
    return Buffer.from(`offset:${offset}`, 'utf8').toString('base64url');
  }

  private decodeCursor(cursor?: string): number {
    if (!cursor) return 0;

    try {
      const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
      const match = /^offset:(\d+)$/.exec(decoded);
      if (!match) throw new Error('invalid cursor');
      return Number(match[1]);
    } catch {
      throw new Error('Invalid tasks/list cursor');
    }
  }

  private waitForChange(record: TaskRecord, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) {
      return Promise.reject(
        signal.reason instanceof Error ? signal.reason : new Error('Task result request cancelled')
      );
    }

    return new Promise((resolve, reject) => {
      const finish = () => {
        signal?.removeEventListener('abort', abort);
        record.waiters.delete(finish);
        resolve();
      };
      const abort = () => {
        record.waiters.delete(finish);
        reject(
          signal?.reason instanceof Error
            ? signal.reason
            : new Error('Task result request cancelled')
        );
      };

      record.waiters.add(finish);
      signal?.addEventListener('abort', abort, { once: true });
    });
  }

  private notifyWaiters(record: TaskRecord): void {
    for (const waiter of [...record.waiters]) {
      waiter();
    }
  }

  private startRetentionWindow(record: TaskRecord): void {
    record.expiresAt = record.ttl === null ? undefined : Date.now() + record.ttl;
  }

  private createErrorResult(message: string, taskId?: string): ToolResponse {
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
      _meta: {
        error: {
          errorCode: ErrorCode.TOOL_EXECUTION_FAILED,
          category: ErrorCategory.TOOL,
          severity: ErrorSeverity.ERROR,
          recoverable: false,
          title: 'Task Error',
          description: message,
          timestamp: new Date().toISOString(),
          ...(taskId && {
            context: {
              details: { taskId },
            },
          }),
        },
      },
    };
  }
}
