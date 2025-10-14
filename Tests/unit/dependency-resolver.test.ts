/**
 * Unit tests for DependencyResolver
 * T012: Unit tests for dependency resolver
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyResolver } from '../../src/core/dependency-resolver.js';
import type { LibraryMetadata } from '../../src/types/library-types.js';

describe('DependencyResolver', () => {
  let resolver: DependencyResolver;

  beforeEach(() => {
    resolver = new DependencyResolver();
  });

  function createMockLibrary(name: string, dependencies: string[] = []): LibraryMetadata {
    return {
      name,
      filePath: `/scripts/${name}.ahk`,
      dependencies,
      classes: [],
      functions: [],
      version: undefined,
      description: `Mock ${name} library`,
      category: 'test',
      globalVars: []
    };
  }

  describe('buildGraph', () => {
    it('should build dependency graph correctly', () => {
      const libs = [
        createMockLibrary('A', ['B']),
        createMockLibrary('B', []),
        createMockLibrary('C', ['A'])
      ];

      resolver.buildGraph(libs);

      // Graph should be built without errors
      expect(() => resolver.getImportOrder('C')).not.toThrow();
    });

    it('should handle libraries with no dependencies', () => {
      const libs = [
        createMockLibrary('Standalone', [])
      ];

      resolver.buildGraph(libs);

      const order = resolver.getImportOrder('Standalone');
      expect(order).toEqual(['Standalone']);
    });
  });

  describe('detectCycles', () => {
    it('should detect circular dependencies (A→B→C→A)', () => {
      const libs = [
        createMockLibrary('A', ['B']),
        createMockLibrary('B', ['C']),
        createMockLibrary('C', ['A'])
      ];

      resolver.buildGraph(libs);
      const cycles = resolver.detectCycles();

      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0]).toContain('A');
      expect(cycles[0]).toContain('B');
      expect(cycles[0]).toContain('C');
    });

    it('should detect self-dependency (A→A)', () => {
      const libs = [
        createMockLibrary('A', ['A'])
      ];

      resolver.buildGraph(libs);
      const cycles = resolver.detectCycles();

      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0]).toContain('A');
    });

    it('should not detect cycles in valid DAG', () => {
      const libs = [
        createMockLibrary('A', ['B']),
        createMockLibrary('B', ['C']),
        createMockLibrary('C', [])
      ];

      resolver.buildGraph(libs);
      const cycles = resolver.detectCycles();

      expect(cycles).toHaveLength(0);
    });
  });

  describe('getImportOrder', () => {
    it('should return correct topological order', () => {
      const libs = [
        createMockLibrary('A', ['B', 'C']),
        createMockLibrary('B', ['C']),
        createMockLibrary('C', [])
      ];

      resolver.buildGraph(libs);
      const order = resolver.getImportOrder('A');

      // C should come before B, and B before A
      const cIndex = order.indexOf('C');
      const bIndex = order.indexOf('B');
      const aIndex = order.indexOf('A');

      expect(cIndex).toBeLessThan(bIndex);
      expect(bIndex).toBeLessThan(aIndex);
    });

    it('should handle transitive dependencies (A→B→C)', () => {
      const libs = [
        createMockLibrary('A', ['B']),
        createMockLibrary('B', ['C']),
        createMockLibrary('C', [])
      ];

      resolver.buildGraph(libs);
      const order = resolver.getImportOrder('A');

      expect(order).toEqual(['C', 'B', 'A']);
    });

    it('should handle multiple dependency paths', () => {
      const libs = [
        createMockLibrary('A', ['B', 'C']),
        createMockLibrary('B', ['D']),
        createMockLibrary('C', ['D']),
        createMockLibrary('D', [])
      ];

      resolver.buildGraph(libs);
      const order = resolver.getImportOrder('A');

      // D must come before both B and C
      const dIndex = order.indexOf('D');
      const bIndex = order.indexOf('B');
      const cIndex = order.indexOf('C');
      const aIndex = order.indexOf('A');

      expect(dIndex).toBeLessThan(bIndex);
      expect(dIndex).toBeLessThan(cIndex);
      expect(Math.max(bIndex, cIndex)).toBeLessThan(aIndex);
    });

    it('should handle missing dependencies gracefully', () => {
      const libs = [
        createMockLibrary('A', ['NonExistent'])
      ];

      resolver.buildGraph(libs);

      // Should not throw, but may warn or skip missing dependency
      const order = resolver.getImportOrder('A');
      expect(order).toContain('A');
    });

    it('should return empty array for non-existent library', () => {
      const libs = [
        createMockLibrary('A', [])
      ];

      resolver.buildGraph(libs);
      const order = resolver.getImportOrder('NonExistent');

      expect(order).toHaveLength(0);
    });
  });

  describe('resolvePath', () => {
    it('should resolve relative #Include paths', () => {
      const result = resolver.resolvePath('../UIA.ahk', 'UIA_Browser');

      expect(result).toContain('UIA.ahk');
    });

    it('should handle absolute paths', () => {
      const absolutePath = '/scripts/UIA.ahk';
      const result = resolver.resolvePath(absolutePath, 'UIA_Browser');

      expect(result).toBe(absolutePath);
    });

    it('should handle same-directory includes', () => {
      const result = resolver.resolvePath('Helper.ahk', 'Main');

      expect(result).toContain('Helper.ahk');
    });
  });
});
