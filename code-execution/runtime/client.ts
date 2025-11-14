import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport, getDefaultEnvironment } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

import type { ToolCallArguments, ToolCallResult } from './types.js';

const DEFAULT_FORWARD_ENV = ['PATH', 'SystemRoot', 'SystemDrive', 'TEMP', 'TMP', 'NODE_ENV'];

export interface AhkMcpCodeClientOptions {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

export class AhkMcpCodeClient {
  private client?: Client;
  private transport?: StdioClientTransport;
  private connectPromise?: Promise<void>;
  private cleanupRegistered = false;

  constructor(private readonly options: AhkMcpCodeClientOptions = {}) {}

  async callTool(name: string, args: ToolCallArguments = {}): Promise<ToolCallResult> {
    if (typeof args !== 'object' || Array.isArray(args)) {
      throw new Error('Tool arguments must be an object.');
    }

    await this.ensureConnected();
    const response = await this.client!.callTool(
      {
        name,
        arguments: args
      },
      CallToolResultSchema
    );

    return response;
  }

  async listTools(): Promise<string[]> {
    await this.ensureConnected();
    const response = await this.client!.listTools();
    return response.tools.map((tool) => tool.name);
  }

  async dispose(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = undefined;
    }
    if (this.client) {
      await this.client.close();
      this.client = undefined;
    }
    this.connectPromise = undefined;
  }

  private async ensureConnected(): Promise<void> {
    if (this.client) {
      return;
    }

    if (!this.connectPromise) {
      this.connectPromise = this.startClient();
    }

    try {
      await this.connectPromise;
    } catch (error) {
      this.connectPromise = undefined;
      throw error;
    }
  }

  private async startClient(): Promise<void> {
    const clientInfo = {
      name: process.env.AHK_MCP_CLIENT_NAME ?? 'ahk-code-exec',
      version: process.env.AHK_MCP_CLIENT_VERSION ?? '1.0.0'
    };

    const client = new Client(clientInfo, {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
        sampling: {}
      }
    });

    const transport = new StdioClientTransport({
      command: this.resolveCommand(),
      args: this.resolveArgs(),
      env: this.buildEnvironment()
    });

    await client.connect(transport);

    this.client = client;
    this.transport = transport;
    this.registerCleanup();
  }

  private resolveCommand(): string {
    return this.options.command ?? process.env.AHK_MCP_SERVER_COMMAND ?? 'node';
  }

  private resolveArgs(): string[] {
    if (this.options.args) {
      return this.options.args;
    }
    if (process.env.AHK_MCP_SERVER_ARGS) {
      const raw = process.env.AHK_MCP_SERVER_ARGS.trim();
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((value) => typeof value === 'string')) {
          return parsed;
        }
      } catch {
        // Fall back to whitespace splitting
      }
      return raw.split(/\s+/).filter(Boolean);
    }
    return ['dist/index.js'];
  }

  private buildEnvironment(): Record<string, string> {
    const env: Record<string, string> = {
      ...getDefaultEnvironment(),
      ...(this.options.env ?? {})
    };

    const forwardList = (process.env.AHK_MCP_FORWARD_ENV ?? DEFAULT_FORWARD_ENV.join(','))
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    for (const key of forwardList) {
      const val = process.env[key];
      if (typeof val === 'string') {
        env[key] = val;
      }
    }

    env.AHK_MCP_CHILD = '1';
    return env;
  }

  private registerCleanup(): void {
    if (this.cleanupRegistered) {
      return;
    }

    const cleanup = () => {
      this.dispose().catch(() => undefined);
    };

    process.once('exit', cleanup);
    process.once('SIGINT', cleanup);
    process.once('SIGTERM', cleanup);

    this.cleanupRegistered = true;
  }
}

