/**
 * Unit tests for the mtime-keyed LRU check-result cache.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { CheckCache, type CachedCheckResult } from '../../src/core/check-cache';

function makeResult(exitCode: number = 0): CachedCheckResult {
  return {
    ok: exitCode === 0,
    stdout: 'out',
    stderr: '',
    exitCode,
  };
}

describe('CheckCache', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahk-check-cache-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  function writeFile(name: string, contents: string): string {
    const p = path.join(tmpDir, name);
    fs.writeFileSync(p, contents);
    return p;
  }

  it('miss, then hit after set', () => {
    const cache = new CheckCache(8);
    const file = writeFile('a.ahk', 'MsgBox("hi")');

    expect(cache.get(file)).toBeUndefined();
    expect(cache.stats().misses).toBe(1);

    const result = makeResult(0);
    cache.set(file, result);

    const hit = cache.get(file);
    expect(hit).toEqual(result);
    expect(cache.stats().hits).toBe(1);
    expect(cache.stats().misses).toBe(1);
    expect(cache.stats().size).toBe(1);
  });

  it('invalidates on file stat change (mtime or size)', () => {
    const cache = new CheckCache(8);
    const file = writeFile('b.ahk', 'MsgBox("one")');

    cache.set(file, makeResult(0));
    expect(cache.get(file)).toBeDefined();

    // Mutate content so size differs AND bump mtime explicitly to
    // defeat filesystems with coarse-grained mtime resolution (e.g.
    // some WSL/NTFS combos).
    fs.writeFileSync(file, 'MsgBox("two different")');
    const future = new Date(Date.now() + 5_000);
    fs.utimesSync(file, future, future);

    expect(cache.get(file)).toBeUndefined();
    expect(cache.stats().size).toBe(0);
  });

  it('evicts least-recently-used entries at maxSize', () => {
    const cache = new CheckCache(3);
    const a = writeFile('a.ahk', 'a');
    const b = writeFile('b.ahk', 'b');
    const c = writeFile('c.ahk', 'c');
    const d = writeFile('d.ahk', 'd');

    cache.set(a, makeResult(0));
    cache.set(b, makeResult(0));
    cache.set(c, makeResult(0));
    expect(cache.stats().size).toBe(3);

    // Touch `a` so it's freshest; `b` should now be oldest.
    expect(cache.get(a)).toBeDefined();

    // Insert a fourth -> oldest (b) should be evicted.
    cache.set(d, makeResult(0));
    expect(cache.stats().size).toBe(3);

    expect(cache.get(b)).toBeUndefined();
    expect(cache.get(a)).toBeDefined();
    expect(cache.get(c)).toBeDefined();
    expect(cache.get(d)).toBeDefined();
  });

  it('invalidate() removes a single entry', () => {
    const cache = new CheckCache(8);
    const a = writeFile('a.ahk', 'a');
    const b = writeFile('b.ahk', 'b');

    cache.set(a, makeResult(0));
    cache.set(b, makeResult(0));

    cache.invalidate(a);
    expect(cache.get(a)).toBeUndefined();
    expect(cache.get(b)).toBeDefined();
  });

  it('clear() drops everything and resets counters', () => {
    const cache = new CheckCache(8);
    const a = writeFile('a.ahk', 'a');
    const b = writeFile('b.ahk', 'b');

    cache.set(a, makeResult(0));
    cache.set(b, makeResult(0));
    cache.get(a);
    cache.get('nonexistent');

    expect(cache.stats().size).toBe(2);
    expect(cache.stats().hits).toBeGreaterThan(0);
    expect(cache.stats().misses).toBeGreaterThan(0);

    cache.clear();

    expect(cache.stats()).toEqual({ hits: 0, misses: 0, size: 0, maxSize: 8 });
    expect(cache.get(a)).toBeUndefined();
  });

  it('refuses to cache non-definitive exit codes', () => {
    const cache = new CheckCache(8);
    const file = writeFile('a.ahk', 'a');

    // 1 is not a definitive outcome; should NOT be cached.
    cache.set(file, makeResult(1));
    expect(cache.stats().size).toBe(0);
    expect(cache.get(file)).toBeUndefined();

    // 13 (AHK error) is cacheable.
    cache.set(file, makeResult(13));
    expect(cache.stats().size).toBe(1);
    expect(cache.get(file)?.exitCode).toBe(13);
  });

  it('drops entry when file has been deleted', () => {
    const cache = new CheckCache(8);
    const file = writeFile('gone.ahk', 'x');
    cache.set(file, makeResult(0));
    expect(cache.get(file)).toBeDefined();

    fs.unlinkSync(file);

    expect(cache.get(file)).toBeUndefined();
    expect(cache.stats().size).toBe(0);
  });
});
