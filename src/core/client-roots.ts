import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROTOCOL_VERSION_META_KEY,
  type Server,
  type ServerContext,
} from '@modelcontextprotocol/server';
import logger from '../logger.js';

/** Modern (2026-07-28) requests declare their revision per-request in `_meta`. */
function isModernRequest(ctx: ServerContext): boolean {
  const version = ctx.mcpReq._meta?.[PROTOCOL_VERSION_META_KEY];
  return typeof version === 'string' && version >= '2026-07-28';
}

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

  async resolveForRequest(server: Server, ctx?: ServerContext): Promise<string[]> {
    const cached = this.rootsByServer.get(server);
    if (cached) {
      return this.getDirectories(server);
    }

    // Roots is deprecated as of protocol revision 2026-07-28 (SEP-2577) and the
    // push-style `roots/list` request is absent from that revision — the SDK throws
    // before the transport. Skip the call rather than let it fail on every tool call;
    // modern clients pass directories via tool parameters or server configuration.
    if (ctx && isModernRequest(ctx)) {
      this.rootsByServer.set(server, []);
      return [];
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
