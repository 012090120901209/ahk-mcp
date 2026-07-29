import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from '@modelcontextprotocol/server';
import logger from '../logger.js';

interface ClientRootEntry {
  uri: string;
  name?: string;
  path?: string;
}

class ClientRootsManager {
  private rootsByServer = new WeakMap<Server, ClientRootEntry[]>();

  private normalizeRootPath(uri: string): string | undefined {
    if (!uri.startsWith('file://')) {
      return undefined;
    }

    try {
      const resolvedPath = path.resolve(fileURLToPath(uri));
      if (!fs.existsSync(resolvedPath)) {
        return undefined;
      }

      const stats = fs.statSync(resolvedPath);
      return stats.isDirectory() ? resolvedPath : path.dirname(resolvedPath);
    } catch (error) {
      logger.debug(`Failed to normalize client root ${uri}: ${error}`);
      return undefined;
    }
  }

  getDirectories(server: Server): string[] {
    return (this.rootsByServer.get(server) || [])
      .map(root => root.path)
      .filter((rootPath): rootPath is string => Boolean(rootPath));
  }

  async resolveForRequest(server: Server): Promise<string[]> {
    const cached = this.rootsByServer.get(server);
    if (cached) {
      return this.getDirectories(server);
    }

    const clientCapabilities = server.getClientCapabilities();
    if (!clientCapabilities?.roots) {
      this.rootsByServer.set(server, []);
      return [];
    }

    try {
      const response = await server.listRoots();
      const roots = response.roots.map(root => ({
        uri: root.uri,
        name: root.name,
        path: this.normalizeRootPath(root.uri),
      }));

      this.rootsByServer.set(server, roots);
      return this.getDirectories(server);
    } catch (error) {
      logger.warn('Failed to refresh client roots:', error);
      return this.getDirectories(server);
    }
  }

  invalidate(server: Server): void {
    this.rootsByServer.delete(server);
  }

  clear(server: Server): void {
    this.rootsByServer.delete(server);
  }
}

export const clientRoots = new ClientRootsManager();
