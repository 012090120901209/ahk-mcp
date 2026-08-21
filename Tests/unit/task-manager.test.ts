import { describe, it, expect } from '@jest/globals';
import { TaskManager } from '../../src/core/task-manager.js';
import type { ToolResponse } from '../../src/core/server-interface.js';

const okResult: ToolResponse = {
  content: [{ type: 'text', text: 'done' }],
};

function waitFor(condition: () => boolean, timeoutMs = 2000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (condition()) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        reject(new Error('waitFor timed out'));
      }
    }, 10);
  });
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('TaskManager', () => {
  it('completes a task and exposes its result', async () => {
    const manager = new TaskManager(0);
    const { taskId } = manager.createTask({
      toolName: 'AHK_Test',
      execute: async () => okResult,
    });

    await waitFor(() => manager.getTask(taskId)?.status === 'completed');
    expect(manager.getTaskResult(taskId)).toEqual({ status: 'completed', result: okResult });
  });

  it('prunes finished tasks without a ttl once the retention window passes', async () => {
    const manager = new TaskManager(50);
    const { taskId } = manager.createTask({
      toolName: 'AHK_Test',
      execute: async () => okResult,
    });

    await waitFor(() => manager.getTask(taskId)?.status === 'completed');
    await sleep(80);

    expect(manager.getTask(taskId)).toBeUndefined();
    expect(manager.listTasks()).toEqual([]);
  });

  it('keeps finished tasks when retention is disabled', async () => {
    const manager = new TaskManager(0);
    const { taskId } = manager.createTask({
      toolName: 'AHK_Test',
      execute: async () => okResult,
    });

    await waitFor(() => manager.getTask(taskId)?.status === 'completed');
    await sleep(80);

    expect(manager.getTask(taskId)?.status).toBe('completed');
  });

  it('still honors a client-supplied ttl', async () => {
    const manager = new TaskManager(0);
    const { taskId } = manager.createTask({
      toolName: 'AHK_Test',
      ttl: 40,
      execute: async () => okResult,
    });

    await waitFor(() => manager.getTask(taskId)?.status === 'completed');
    await sleep(80);

    // First prune deletes the expired finished record.
    expect(manager.getTask(taskId)).toBeUndefined();
  });

  it('marks canceled tasks and ignores their late results', async () => {
    const manager = new TaskManager(0);
    let release: (() => void) | undefined;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });

    const { taskId } = manager.createTask({
      toolName: 'AHK_Test',
      execute: async () => {
        await gate;
        return okResult;
      },
    });

    expect(manager.cancelTask(taskId)?.status).toBe('canceled');
    release?.();
    await sleep(20);

    expect(manager.getTask(taskId)?.status).toBe('canceled');
    expect(manager.getTaskResult(taskId)?.status).toBe('canceled');
  });
});
