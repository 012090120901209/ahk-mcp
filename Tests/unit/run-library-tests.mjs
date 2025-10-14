/**
 * Simple test runner for library modules
 * Runs basic validation tests without requiring vitest
 */

import { LibraryScanner } from '../../dist/core/library-scanner.js';
import { VersionManager } from '../../dist/core/version-manager.js';
import { DependencyResolver } from '../../dist/core/dependency-resolver.js';
import { MetadataExtractor } from '../../dist/core/metadata-extractor.js';
import { LibraryCatalog } from '../../dist/core/library-catalog.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import assert from 'assert';

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  return fn()
    .then(() => {
      console.log(`✅ ${name}`);
      testsPassed++;
    })
    .catch(error => {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      testsFailed++;
    });
}

async function runTests() {
  console.log('🧪 Running Library Module Tests\n');

  // Test 1: LibraryScanner
  console.log('📦 LibraryScanner Tests:');

  await test('LibraryScanner - scans directory', async () => {
    const scanner = new LibraryScanner();
    const testDir = path.join(os.tmpdir(), `test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(path.join(testDir, 'test.ahk'), '; test');

    const results = await scanner.scanDirectory(testDir);
    assert(results.length === 1, 'Should find 1 file');
    assert(results[0].endsWith('.ahk'), 'Should be .ahk file');

    await fs.rm(testDir, { recursive: true });
  });

  await test('LibraryScanner - filters non-ahk files', async () => {
    const scanner = new LibraryScanner();
    const testDir = path.join(os.tmpdir(), `test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(path.join(testDir, 'test.ahk'), '; ahk');
    await fs.writeFile(path.join(testDir, 'test.txt'), 'text');

    const results = await scanner.scanDirectory(testDir);
    assert(results.length === 1, 'Should only find .ahk files');

    await fs.rm(testDir, { recursive: true });
  });

  // Test 2: VersionManager
  console.log('\n📦 VersionManager Tests:');

  await test('VersionManager - parses semantic version', async () => {
    const vm = new VersionManager();
    const version = vm.parseVersion('1.2.3');
    assert(version.major === 1, 'Major version should be 1');
    assert(version.minor === 2, 'Minor version should be 2');
    assert(version.patch === 3, 'Patch version should be 3');
  });

  await test('VersionManager - detects compatibility', async () => {
    const vm = new VersionManager();
    const result = vm.checkCompatibility('1.0.0', '1.5.0');
    assert(result.compatible === true, 'Same major version should be compatible');
  });

  await test('VersionManager - detects breaking changes', async () => {
    const vm = new VersionManager();
    const result = vm.checkCompatibility('1.0.0', '2.0.0');
    assert(result.compatible === false, 'Different major version should be incompatible');
    assert(result.error && result.error.includes('Breaking'), 'Should have breaking change error');
  });

  // Test 3: DependencyResolver
  console.log('\n📦 DependencyResolver Tests:');

  await test('DependencyResolver - builds graph', async () => {
    const resolver = new DependencyResolver();
    const libs = [
      { name: 'A', dependencies: ['B'], filePath: '/A.ahk', classes: [], functions: [], globalVars: [] },
      { name: 'B', dependencies: [], filePath: '/B.ahk', classes: [], functions: [], globalVars: [] }
    ];
    resolver.buildGraph(libs);
    const order = resolver.getImportOrder('A');
    assert(order.indexOf('B') < order.indexOf('A'), 'B should come before A');
  });

  await test('DependencyResolver - detects cycles', async () => {
    const resolver = new DependencyResolver();
    const libs = [
      { name: 'A', dependencies: ['B'], filePath: '/A.ahk', classes: [], functions: [], globalVars: [] },
      { name: 'B', dependencies: ['A'], filePath: '/B.ahk', classes: [], functions: [], globalVars: [] }
    ];
    resolver.buildGraph(libs);
    const cycles = resolver.detectCycles();
    assert(cycles.length > 0, 'Should detect circular dependency');
  });

  // Test 4: MetadataExtractor
  console.log('\n📦 MetadataExtractor Tests:');

  await test('MetadataExtractor - extracts version', async () => {
    const extractor = new MetadataExtractor();
    const testDir = path.join(os.tmpdir(), `test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    const testFile = path.join(testDir, 'test.ahk');
    await fs.writeFile(testFile, 'class Test {\n  static Version := "1.2.3"\n}');

    const metadata = await extractor.extract(testFile);
    assert(metadata.version === '1.2.3', `Should extract version, got: ${metadata.version}`);

    await fs.rm(testDir, { recursive: true });
  });

  await test('MetadataExtractor - extracts dependencies', async () => {
    const extractor = new MetadataExtractor();
    const testDir = path.join(os.tmpdir(), `test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    const testFile = path.join(testDir, 'test.ahk');
    await fs.writeFile(testFile, '#Include UIA.ahk\n#Include Helper.ahk\n');

    const metadata = await extractor.extract(testFile);
    assert(metadata.dependencies.length >= 2, 'Should extract dependencies');

    await fs.rm(testDir, { recursive: true });
  });

  // Test 5: LibraryCatalog
  console.log('\n📦 LibraryCatalog Tests:');

  await test('LibraryCatalog - initializes', async () => {
    const catalog = new LibraryCatalog();
    const testDir = path.join(os.tmpdir(), `test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(path.join(testDir, 'test.ahk'), '; test library');

    await catalog.initialize(testDir);
    assert(catalog.isInitialized() === true, 'Catalog should be initialized');

    await fs.rm(testDir, { recursive: true });
  });

  await test('LibraryCatalog - searches libraries', async () => {
    const catalog = new LibraryCatalog();
    const testDir = path.join(os.tmpdir(), `test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(path.join(testDir, 'UIA.ahk'), '; UI Automation');

    await catalog.initialize(testDir);
    const results = catalog.search('UIA');
    assert(results.length > 0, 'Should find UIA library');

    await fs.rm(testDir, { recursive: true });
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📊 Total: ${testsPassed + testsFailed}`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
