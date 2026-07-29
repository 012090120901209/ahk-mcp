import { AsyncLocalStorage } from 'node:async_hooks';

export interface McpRequestContext {
  rootDirectories: string[];
  abortSignal?: AbortSignal;
}

const storage = new AsyncLocalStorage<McpRequestContext>();

function normalizeRootDirectories(rootDirectories?: string[]): string[] {
  return [...new Set((rootDirectories || []).filter(Boolean))];
}

export async function runWithMcpRequestContextAsync<T>(
  context: Partial<McpRequestContext>,
  fn: () => Promise<T>
): Promise<T> {
  return await storage.run(
    {
      rootDirectories: normalizeRootDirectories(context.rootDirectories),
      abortSignal: context.abortSignal,
    },
    fn
  );
}

export function getCurrentRootDirectories(): string[] {
  return storage.getStore()?.rootDirectories || [];
}

export function getCurrentAbortSignal(): AbortSignal | undefined {
  return storage.getStore()?.abortSignal;
}
