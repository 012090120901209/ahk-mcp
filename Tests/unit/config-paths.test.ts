import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { resolveExistingPathSync } from '../../src/core/config.js';

type ExistsStub = typeof fs.existsSync;

function withExistsMap(map: Record<string, boolean>): ExistsStub {
  return ((value: fs.PathLike | number) => {
    const key = typeof value === 'number' ? String(value) : value.toString();
    return map[key] ?? false;
  }) as ExistsStub;
}

const originalExists = fs.existsSync;

describe('resolveExistingPathSync', () => {
  afterEach(() => {
    fs.existsSync = originalExists;
  });

  it('returns normalized Windows path when accessible directly', () => {
    const windowsPath = 'C:\\Scripts\\Demo.ahk';
    fs.existsSync = withExistsMap({
      [path.win32.normalize(windowsPath)]: true
    });

    const result = resolveExistingPathSync(windowsPath);
    assert.strictEqual(result, path.win32.normalize(windowsPath));
  });

  it('returns WSL mount when Windows variant is unavailable', () => {
    const windowsPath = 'C:\\Scripts\\Demo.ahk';
    const wslPath = '/mnt/c/Scripts/Demo.ahk';

    fs.existsSync = withExistsMap({
      [wslPath]: true
    });

    const result = resolveExistingPathSync(windowsPath);
    assert.strictEqual(result, wslPath);
  });

  it('maps WSL mount back to Windows path when only Windows variant exists', () => {
    const windowsPath = 'C:\\Scripts\\Demo.ahk';
    const wslPath = '/mnt/c/Scripts/Demo.ahk';

    fs.existsSync = withExistsMap({
      [path.win32.normalize(windowsPath)]: true
    });

    const result = resolveExistingPathSync(wslPath);
    assert.strictEqual(result, path.win32.normalize(windowsPath));
  });

  it('returns undefined when no variant exists', () => {
    fs.existsSync = withExistsMap({});
    const result = resolveExistingPathSync('C:\\Missing\\Example.ahk');
    assert.strictEqual(result, undefined);
  });
});

