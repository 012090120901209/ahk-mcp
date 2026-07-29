import { TaskManager } from '../../src/core/task-manager';

const okResult = {
  content: [{ type: 'text', text: 'ok' }],
};

describe('TaskManager MCP task contract', () => {
  it('uses the specification task shape and status spelling', async () => {
    const manager = new TaskManager();
    const created = manager.createTask({
      toolName: 'AHK_Analyze',
      pollInterval: 250,
      execute: async () => okResult,
    });

    expect(created).toEqual(
      expect.objectContaining({
        taskId: expect.any(String),
        status: 'working',
        ttl: null,
        pollInterval: 250,
        createdAt: expect.any(String),
        lastUpdatedAt: expect.any(String),
      })
    );

    await new Promise(resolve => setImmediate(resolve));
    expect(manager.getTask(created.taskId)?.status).toBe('completed');
  });

  it('cancels work through an AbortSignal and returns cancelled', async () => {
    const manager = new TaskManager();
    const created = manager.createTask({
      toolName: 'AHK_Run',
      execute: signal =>
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        }),
    });

    const cancelled = manager.cancelTask(created.taskId);
    expect(cancelled?.status).toBe('cancelled');
    expect(cancelled?.statusMessage).toMatch(/cancelled/i);

    await new Promise(resolve => setImmediate(resolve));
    expect(manager.getTask(created.taskId)?.status).toBe('cancelled');
  });

  it('blocks result retrieval until the task reaches a terminal state', async () => {
    const manager = new TaskManager();
    let finish: (() => void) | undefined;
    const created = manager.createTask({
      toolName: 'AHK_Analyze',
      execute: () =>
        new Promise(resolve => {
          finish = () => resolve(okResult);
        }),
    });

    let settled = false;
    const resultPromise = manager.waitForTaskResult(created.taskId).then(result => {
      settled = true;
      return result;
    });

    await new Promise(resolve => setImmediate(resolve));
    expect(settled).toBe(false);

    finish?.();
    const result = await resultPromise;
    expect(result?.status).toBe('completed');
    expect(result?.result).toEqual(okResult);
  });

  it('uses opaque cursors for tasks/list pagination', () => {
    const manager = new TaskManager();
    for (let index = 0; index < 3; index += 1) {
      manager.createTask({
        toolName: `tool-${index}`,
        execute: async () => okResult,
      });
    }

    const firstPage = manager.listTasks(undefined, 2);
    expect(firstPage.tasks).toHaveLength(2);
    expect(firstPage.nextCursor).toEqual(expect.any(String));

    const secondPage = manager.listTasks(firstPage.nextCursor, 2);
    expect(secondPage.tasks).toHaveLength(1);
    expect(secondPage.nextCursor).toBeUndefined();
    expect(() => manager.listTasks('not-a-valid-cursor')).toThrow(/cursor/i);
  });

  it('starts TTL retention only after a task reaches a terminal state', async () => {
    let finish!: (result: typeof okResult) => void;
    const pendingResult = new Promise<typeof okResult>(resolve => {
      finish = resolve;
    });
    const manager = new TaskManager();
    const task = manager.createTask({
      toolName: 'AHK_Diagnostics',
      ttl: 20,
      execute: async () => pendingResult,
    });

    await new Promise(resolve => setTimeout(resolve, 30));
    expect(manager.getTask(task.taskId)?.status).toBe('working');

    finish(okResult);
    await manager.waitForTaskResult(task.taskId);
    expect(manager.getTask(task.taskId)?.status).toBe('completed');

    await new Promise(resolve => setTimeout(resolve, 30));
    expect(manager.getTask(task.taskId)).toBeUndefined();
  });
});
