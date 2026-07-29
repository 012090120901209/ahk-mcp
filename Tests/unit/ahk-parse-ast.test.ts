import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {
  AST_SCHEMA_VERSION,
  parseAst,
  parseAstWithIncludes,
  resolveIncludeSpec,
} from '../../src/tools/ahk-parse-ast';

const FIXTURES = path.resolve(__dirname, '../fixtures/parse-ast');

describe('ahk-parse-ast', () => {
  describe('parseAst - empty script', () => {
    it('returns empty arrays and null requires', async () => {
      const filePath = path.join(FIXTURES, 'empty.ahk');
      const source = await fs.readFile(filePath, 'utf-8');
      const result = parseAst(source, filePath);

      expect(result.schemaVersion).toBe(AST_SCHEMA_VERSION);
      expect(result.path).toBe(filePath);
      expect(result.requires).toBeNull();
      expect(result.includes).toEqual([]);
      expect(result.hotkeys).toEqual([]);
      expect(result.labels).toEqual([]);
      expect(result.globals).toEqual([]);
      expect(result.functions).toEqual([]);
      expect(result.classes).toEqual([]);
      expect(result.diagnostics).toEqual([]);
    });
  });

  describe('parseAst - #Requires extraction', () => {
    it('captures the v2.1-alpha version string', async () => {
      const filePath = path.join(FIXTURES, 'requires-version.ahk');
      const source = await fs.readFile(filePath, 'utf-8');
      const result = parseAst(source, filePath);
      expect(result.requires).toBe('v2.1-alpha.27');
    });
  });

  describe('parseAst - function + class with methods and static property', () => {
    it('produces correctly nested structure', async () => {
      const filePath = path.join(FIXTURES, 'functions-and-class.ahk');
      const source = await fs.readFile(filePath, 'utf-8');
      const result = parseAst(source, filePath);

      expect(result.requires).toBe('v2.0');
      expect(result.functions.length).toBe(1);
      const addFn = result.functions[0];
      expect(addFn.name).toBe('Add');
      expect(addFn.params.length).toBe(2);
      expect(addFn.params[0]).toEqual(
        expect.objectContaining({ name: 'a', byref: false, variadic: false, optional: false })
      );
      expect(addFn.params[1]).toEqual(
        expect.objectContaining({ name: 'b', default: '0', optional: true })
      );
      expect(addFn.docComment).toMatch(/Adds two numbers together/);

      expect(result.classes.length).toBe(1);
      const cls = result.classes[0];
      expect(cls.name).toBe('Widget');
      expect(cls.extends).toBe('Gui');
      expect(cls.methods.length).toBe(2);
      const methodNames = cls.methods.map(m => m.name).sort();
      expect(methodNames).toEqual(['Render', '__New']);
      const ctor = cls.methods.find(m => m.name === '__New');
      expect(ctor?.docComment).toMatch(/Construct a new widget/);

      expect(cls.properties.length).toBe(1);
      expect(cls.properties[0]).toEqual(
        expect.objectContaining({
          name: 'Version',
          isStatic: true,
          defaultValue: '"1.0.0"',
        })
      );
    });
  });

  describe('parseAstWithIncludes - follow_includes merges and dedupes', () => {
    it('merges includes and avoids revisiting A transitively', async () => {
      const rootPath = path.join(FIXTURES, 'with-includes-root.ahk');
      const result = await parseAstWithIncludes(rootPath, true);

      // Original 2 direct includes plus the transitive reference to A from B
      // should appear but A's resolved path must not be re-parsed.
      expect(result.includes.length).toBeGreaterThanOrEqual(2);
      const resolvedPaths = result.includes
        .map(inc => inc.resolved)
        .filter((p): p is string => typeof p === 'string');
      const uniqueResolved = new Set(resolvedPaths.map(p => path.resolve(p)));
      // Both A and B should have resolved to real files
      const aAbs = path.resolve(path.join(FIXTURES, 'with-includes-a.ahk'));
      const bAbs = path.resolve(path.join(FIXTURES, 'with-includes-b.ahk'));
      expect(uniqueResolved.has(aAbs)).toBe(true);
      expect(uniqueResolved.has(bAbs)).toBe(true);

      // No cycle / no crash; diagnostics should not contain the dreaded
      // "Maximum call stack size exceeded" or similar.
      for (const diag of result.diagnostics) {
        expect(diag.message.toLowerCase()).not.toContain('maximum call stack');
      }
    });

    it('with follow_includes=false, only root-level includes are listed', async () => {
      const rootPath = path.join(FIXTURES, 'with-includes-root.ahk');
      const result = await parseAstWithIncludes(rootPath, false);
      expect(result.includes.length).toBe(2);
      expect(result.includes.map(i => i.spec).sort()).toEqual([
        'with-includes-a.ahk',
        'with-includes-b.ahk',
      ]);
    });
  });

  describe('parseAst - syntax error handling', () => {
    let tempDir: string;
    let brokenFile: string;

    beforeAll(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ahk-parse-ast-test-'));
      brokenFile = path.join(tempDir, 'broken.ahk');
      // Layout: line 5 (1-indexed) is the broken unterminated-string line.
      // Zero-indexed, that corresponds to line 4.
      const broken = [
        '#Requires AutoHotkey v2.0', // line 1
        '', // line 2
        'ok := 1', // line 3
        '', // line 4
        'oops := "unterminated', // line 5 (the error)
        '', // line 6
        'Good(x) {', // line 7
        '    return x', // line 8
        '}', // line 9
        '', // line 10
        'Good2(y) {', // line 11
        '    return y + 1', // line 12
        '}', // line 13
        '', // line 14
      ].join('\n');
      await fs.writeFile(brokenFile, broken, 'utf-8');
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('reports the error on line 5 but still extracts the surrounding script', async () => {
      const source = await fs.readFile(brokenFile, 'utf-8');
      const result = parseAst(source, brokenFile);

      // Diagnostic on zero-indexed line 4 (human line 5).
      expect(result.diagnostics.length).toBeGreaterThan(0);
      const errDiag = result.diagnostics.find(d => d.severity === 'error');
      expect(errDiag).toBeDefined();
      expect(errDiag!.line).toBe(4);
      expect(errDiag!.code).toBe('AHK_AST_UNTERMINATED_STRING');

      // Other extraction still runs: both functions and the #Requires survive.
      expect(result.requires).toBe('v2.0');
      const names = result.functions.map(f => f.name).sort();
      expect(names).toEqual(['Good', 'Good2']);
    });
  });

  describe('resolveIncludeSpec', () => {
    it('resolves a relative include against the including file', () => {
      const from = path.join(FIXTURES, 'with-includes-root.ahk');
      const resolved = resolveIncludeSpec('with-includes-a.ahk', from);
      expect(resolved).toBe(path.resolve(path.join(FIXTURES, 'with-includes-a.ahk')));
    });

    it('returns an absolute path unchanged', () => {
      const abs = path.resolve(path.join(FIXTURES, 'with-includes-a.ahk'));
      const resolved = resolveIncludeSpec(abs, path.join(FIXTURES, 'root.ahk'));
      expect(resolved).toBe(abs);
    });

    it('returns null for an angle-bracket lib that does not exist adjacent to script', () => {
      const from = path.join(FIXTURES, 'with-includes-root.ahk');
      const resolved = resolveIncludeSpec('<NotARealLib>', from);
      expect(resolved).toBeNull();
    });
  });
});
