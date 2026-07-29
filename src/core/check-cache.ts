/**
 * Check Cache
 *
 * Mtime-keyed LRU cache for `AutoHotkey64.exe check` (and equivalent
 * validation spawn) results. The MCP server is a long-lived process, so
 * caching eliminates the ~200ms cold-spawn cost per check when the
 * source file hasn't changed.
 *
 * Cache key:    absolute path
 * Validity:     entry is valid only if the file's current
 *               `{ mtimeMs, size }` matches the stat captured when the
 *               entry was stored.
 * Eviction:     Map-insertion-order LRU. Most recently used entries are
 *               re-inserted on read so they sit at the tail; oldest
 *               (head) entries are evicted first when `maxSize` is hit.
 * Outcomes we cache: only exitCode 0 (clean) and 13 (AHK's "error" exit
 *                    code, treated as a definitive failure). Any other
 *                    exit code could indicate a transient crash/signal
 *                    and is not cached.
 */

import fs from 'fs';
import type { Diagnostic } from '../types/index.js';

/**
 * Result of invoking `AutoHotkey64.exe` (or the equivalent validator)
 * against a file. Kept intentionally lean so it can be populated by
 * either a real spawn or an in-process analysis pipeline.
 */
export interface CachedCheckResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  diagnostics?: Diagnostic[];
}

interface Entry {
  mtimeMs: number;
  size: number;
  result: CachedCheckResult;
}

/**
 * Diagnostic/telemetry snapshot of the cache.
 */
export interface CheckCacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}

const DEFAULT_MAX_SIZE = 2048;

function resolveMaxSize(): number {
  const raw = process.env.AHK_CHECK_CACHE_SIZE;
  if (!raw) return DEFAULT_MAX_SIZE;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_SIZE;
  return parsed;
}

/**
 * Only these exit codes are considered definitive enough to cache.
 * 0  = success (no errors)
 * 13 = AHK's standard "error" exit code
 */
const CACHEABLE_EXIT_CODES: ReadonlySet<number> = new Set<number>([0, 13]);

export class CheckCache {
  private readonly cache: Map<string, Entry> = new Map();
  private readonly maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number = resolveMaxSize()) {
    this.maxSize = maxSize;
  }

  /**
   * Look up a cached result for `absPath`.
   *
   * Re-stats the file synchronously and invalidates the entry if
   * `{ mtimeMs, size }` has changed since the entry was stored.
   */
  get(absPath: string): CachedCheckResult | undefined {
    const entry = this.cache.get(absPath);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    let stat: fs.Stats;
    try {
      stat = fs.statSync(absPath);
    } catch {
      // File vanished or became unreadable — drop entry.
      this.cache.delete(absPath);
      this.misses++;
      return undefined;
    }

    if (stat.mtimeMs !== entry.mtimeMs || stat.size !== entry.size) {
      this.cache.delete(absPath);
      this.misses++;
      return undefined;
    }

    // LRU bump: re-insert so this entry sits at the tail (most recent).
    this.cache.delete(absPath);
    this.cache.set(absPath, entry);
    this.hits++;
    return entry.result;
  }

  /**
   * Store a check result, keyed by the file's current stat.
   *
   * Refuses to cache if `exitCode` isn't a definitive outcome (see
   * `CACHEABLE_EXIT_CODES`) — transient failures shouldn't poison the
   * cache.
   */
  set(absPath: string, result: CachedCheckResult): void {
    if (!CACHEABLE_EXIT_CODES.has(result.exitCode)) {
      return;
    }

    let stat: fs.Stats;
    try {
      stat = fs.statSync(absPath);
    } catch {
      // Nothing to key against — skip caching.
      return;
    }

    const entry: Entry = {
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      result,
    };

    // Re-insert at tail so LRU ordering is respected on updates too.
    if (this.cache.has(absPath)) {
      this.cache.delete(absPath);
    }
    this.cache.set(absPath, entry);

    // Evict oldest (head) entries until we're under the limit.
    while (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey === undefined) break;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Remove a single entry by path. No-op if not present.
   */
  invalidate(absPath: string): void {
    this.cache.delete(absPath);
  }

  /**
   * Drop all cache entries and reset counters.
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Return a snapshot of current cache telemetry.
   */
  stats(): CheckCacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

/**
 * Process-wide singleton. The MCP server itself is long-lived, so a
 * single instance shared across tools gives consumers the full benefit
 * of the cache across tool invocations.
 */
export const checkCache = new CheckCache();
