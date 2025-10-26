# AutoHotkey MCP Server - Test Structure Guide

Complete guide to the test organization, execution, and coverage.

---

## Overview

The test suite is organized into three tiers:

| Tier | Purpose | Location | Runs | Coverage |
|------|---------|----------|------|----------|
| **Unit Tests** | Individual function behavior | `Tests/unit/` | Fast | Measured |
| **Contract Tests** | API compatibility guarantees | `Tests/contract/` | Fast | Measured |
| **Integration Tests** | End-to-end workflows | `Tests/integration/` | Slow | Separate |

---

## Test Structure

```
Tests/
├── README.md                           # This file
├── setup/
│   ├── jest.setup.ts                  # Global test utilities for unit/contract tests
│   └── jest.integration.setup.ts      # Global utilities for integration tests
├── fixtures/
│   └── test-quality-improvements.ahk  # Sample AutoHotkey code for testing
├── unit/
│   ├── orchestration-context.test.ts      # SmartContextCache tests
│   ├── parameter-aliases.test.ts          # Deprecated parameter handling
│   ├── debug-formatter.test.ts            # Debug output formatting (88+ tests)
│   ├── dry-run-preview.test.ts            # Dry-run mode functionality
│   ├── library-scanner.test.ts            # AutoHotkey library scanning
│   ├── version-manager.test.ts            # Version management
│   ├── dependency-resolver.test.ts        # Dependency resolution
│   ├── metadata-extractor.test.ts         # Metadata extraction
│   ├── library-catalog.test.ts            # Library catalog
│   └── config-paths.test.ts               # Configuration paths
├── contract/
│   ├── parameter-aliases.test.ts      # Parameter naming contracts
│   ├── dry-run-output.test.ts         # Dry-run output contracts
│   └── debug-output.test.ts           # Debug output contracts
└── integration/
    ├── edit-dryrun.test.ts            # Edit dry-run workflows
    ├── orchestrator-debug.test.ts      # Orchestrator debug mode
    └── backward-compat.test.ts        # Backward compatibility
```

**Total:** 16 test files, 266+ test cases, 3,179+ lines of test code

---

## Quick Start

### Run Unit Tests (Default)
```bash
npm test
# or explicitly:
npm run test:unit
```

### Run Unit Tests with Watch Mode
```bash
npm run test:unit:watch
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run All Tests (Unit + Integration)
```bash
npm run test:all
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Open Coverage Report in Browser
```bash
npm run test:coverage:report
```

---

## Test Execution Details

### Unit & Contract Tests (`npm run test:unit`)
- **Configuration:** `jest.config.js`
- **Setup File:** `Tests/setup/jest.setup.ts`
- **Timeout:** 30 seconds per test
- **Coverage:** Enabled with threshold enforcement (80%)
- **Global Helpers:** `createMockToolResponse()`, `createMockAHKFile()`, `waitFor()`
- **Typical Duration:** 5-15 seconds

**Test Patterns Used:**
```typescript
// Jest style (recommended)
describe('Feature', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});

// Node test module style (legacy)
test('should do something', () => {
  assert.strictEqual(result, expected);
});
```

---

### Integration Tests (`npm run test:integration`)
- **Configuration:** `jest.config.integration.js`
- **Setup File:** `Tests/setup/jest.integration.setup.ts`
- **Timeout:** 120 seconds per test (2 minutes)
- **Server Spawning:** Tests spawn actual MCP server instances
- **Global Helpers:** `startTestServer()`, `stopTestServer()`, `makeMCPRequest()`
- **Typical Duration:** 30-60 seconds
- **Features:**
  - Automatic server lifecycle management
  - Detects open handles (for memory leaks)
  - Forces exit after completion
  - Stops on first failure

**Environment Variables:**
```
NODE_ENV=test
AHK_MCP_LOG_LEVEL=error
AHK_MCP_DATA_MODE=light
```

---

### Coverage Analysis (`npm run test:coverage`)
- **Configuration:** `jest.config.coverage.js`
- **Reports Generated:** text, lcov, html, json-summary, json
- **Output Directory:** `coverage/`
- **Thresholds:**
  - Global: 80% lines, functions, statements; 75% branches
  - Core modules (`src/core/`): 85% all metrics
  - Tools (`src/tools/`): 75% lines, functions, statements; 70% branches
- **Exclusions:**
  - Type definition files (`*.d.ts`)
  - Interface files (`*.interface.ts`)
  - Entry point (`src/index.ts`)
  - Mock files (`__mocks__/`)
  - Type modules (`src/types/`)

---

## Global Test Utilities

### Unit/Contract Test Helpers (`Tests/setup/jest.setup.ts`)

```typescript
// Create mock MCP tool response
createMockToolResponse(content: string, isError?: boolean): ToolResponse

// Create mock AutoHotkey file
createMockAHKFile(content: string, path?: string): MockFile

// Delay helper (useful for async tests)
waitFor(ms: number): Promise<void>

// Create temporary directory
createTempDir(): string

// Clean up temporary directory
cleanupTempDir(path: string): void
```

**Example Usage:**
```typescript
const response = createMockToolResponse('✅ Success', false);
await waitFor(100);
const tempDir = createTempDir();
// ... test ...
cleanupTempDir(tempDir);
```

### Integration Test Helpers (`Tests/setup/jest.integration.setup.ts`)

```typescript
// Start test MCP server
startTestServer(port?: number): Promise<{ url: string; process: ChildProcess }>

// Stop test server
stopTestServer(): Promise<void>

// Create test AutoHotkey file
createTestAHKFile(content: string, filename: string): Promise<string>

// Clean up test files
cleanupTestFiles(): Promise<void>

// Wait for server to be ready
waitForServer(url: string, timeout?: number): Promise<void>

// Send MCP protocol request
makeMCPRequest(url: string, request: MCPRequest): Promise<MCPResponse>
```

**Example Usage:**
```typescript
const server = await startTestServer();
await waitForServer(server.url);
const response = await makeMCPRequest(server.url, {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list'
});
await stopTestServer();
```

---

## Writing New Tests

### Unit Test Template
```typescript
import { describe, it, expect } from '@jest/globals';
import { functionToTest } from '@/path/to/module';

describe('Module Name', () => {
  describe('functionToTest', () => {
    it('should return expected value for valid input', () => {
      const result = functionToTest({ input: 'value' });
      expect(result).toEqual({ output: 'expected' });
    });

    it('should throw error for invalid input', () => {
      expect(() => functionToTest({ input: null }))
        .toThrow('Expected non-null input');
    });
  });
});
```

### Integration Test Template
```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Tool Workflow', () => {
  let serverUrl: string;

  beforeAll(async () => {
    const server = await startTestServer();
    serverUrl = server.url;
    await waitForServer(serverUrl);
  });

  afterAll(async () => {
    await stopTestServer();
    await cleanupTestFiles();
  });

  it('should execute tool end-to-end', async () => {
    const response = await makeMCPRequest(serverUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'AHK_File_View',
        arguments: { filePath: '/path/to/file.ahk' }
      }
    });

    expect(response.result).toBeDefined();
  });
});
```

### Coverage-Focused Test Pattern
```typescript
describe('Critical Function', () => {
  // Test happy path
  it('should handle valid input', () => { ... });

  // Test error paths
  it('should handle null input', () => { ... });
  it('should handle undefined input', () => { ... });
  it('should handle empty array', () => { ... });

  // Test edge cases
  it('should handle maximum value', () => { ... });
  it('should handle minimum value', () => { ... });

  // Test branches
  if (conditionA) {
    it('should follow branch A', () => { ... });
  }
  if (conditionB) {
    it('should follow branch B', () => { ... });
  }
});
```

---

## Coverage Goals

### Target Thresholds
- **Lines:** 80% (measure statements executed)
- **Functions:** 80% (measure functions called)
- **Statements:** 80% (measure individual statements executed)
- **Branches:** 75% (measure conditional branches)

### How to Check Coverage
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
npm run test:coverage:report

# Check specific file coverage
npm run test:coverage -- --collectCoverageFrom="src/core/specific-file.ts"
```

### Reading Coverage Reports
- **Green (>80%):** Good coverage
- **Yellow (60-80%):** Acceptable but should improve
- **Red (<60%):** Needs more tests

### Improving Coverage
1. Identify uncovered lines in coverage/index.html
2. Add tests for those code paths
3. Focus on branches first (if/else, switch, ternary)
4. Then add tests for error cases
5. Finally add edge case tests

---

## Best Practices

### ✅ Do
- Name tests describing what they test: ✅ `should return 42 for valid input`
- Use `describe` blocks to organize related tests
- Write isolated tests (no dependencies between tests)
- Use fixtures for common test data
- Test both happy and error paths
- Keep tests focused on one thing
- Use setup/teardown for resource management

### ❌ Don't
- Skip error path testing
- Create test interdependencies
- Use hardcoded file paths (use `createTempDir`)
- Leave test servers running between tests
- Mix unit and integration tests
- Test implementation details (test behavior instead)
- Ignore coverage reports

### Test Organization Patterns
```typescript
describe('Feature', () => {
  describe('Happy path', () => { /* tests */ });
  describe('Error cases', () => { /* tests */ });
  describe('Edge cases', () => { /* tests */ });
});
```

---

## Troubleshooting

### Tests Timeout
- Increase timeout: `jest.setTimeout(60000);`
- Check for unresolved promises
- Verify server startup in integration tests

### Coverage Not Improving
- Check `collectCoverageFrom` in jest config
- Look at coverage report for uncovered branches
- Add tests for error paths

### Integration Tests Fail
- Check server startup logs
- Verify port availability
- Check firewall settings
- Look for resource leaks: `detectOpenHandles: true`

### Memory Issues
- Split large test files
- Use `--maxWorkers=1` for sequential execution
- Clean up file handles in afterAll

---

## CI/CD Integration

### GitHub Actions Workflow
The CI pipeline runs:

```yaml
1. Lint & Type Check
2. Security Audit
3. Build
4. Unit Tests (all platforms)
5. Integration Tests (Windows only - AHK specific)
6. Performance Benchmarks (main branch only)
7. Coverage Upload (Codecov)
8. Documentation Build
9. Release & Publish (tags only)
```

**Matrix Testing:**
- OS: Ubuntu, Windows, macOS
- Node: 18, 20, 21

---

## Test Maintenance

### Adding New Tests
1. Create file in appropriate directory (unit, contract, or integration)
2. Use naming convention: `feature-name.test.ts`
3. Follow existing test patterns
4. Run coverage: `npm run test:coverage`
5. Update README if adding new test categories

### Deprecating Tests
1. Mark with `@deprecated` in comments
2. Update related tests to new patterns
3. Remove in next major version
4. Document migration path

### Test Review Checklist
- [ ] Test name clearly describes behavior
- [ ] Test is isolated (no dependencies)
- [ ] Error cases are tested
- [ ] Coverage targets are met
- [ ] Setup/teardown is complete
- [ ] No hardcoded paths
- [ ] Fixtures used appropriately

---

## Resources

### Jest Documentation
- Official Docs: https://jestjs.io/docs/getting-started
- Common Matchers: https://jestjs.io/docs/using-matchers
- Async Testing: https://jestjs.io/docs/asynchronous

### Test Utilities
- Global Helpers: See `Tests/setup/jest.setup.ts`
- Integration Helpers: See `Tests/setup/jest.integration.setup.ts`
- Fixtures: See `Tests/fixtures/`

### Files to Reference
- Jest Config: `jest.config.js`
- Integration Config: `jest.config.integration.js`
- Coverage Config: `jest.config.coverage.js`
- Package.json Scripts: `package.json` (test scripts)

---

## Summary

| Task | Command | Duration |
|------|---------|----------|
| Run unit tests | `npm test` | 5-15 sec |
| Watch mode | `npm run test:unit:watch` | Continuous |
| Integration tests | `npm run test:integration` | 30-60 sec |
| Coverage report | `npm run test:coverage` | 10-20 sec |
| All tests | `npm run test:all` | 1-2 min |

---

**Last Updated:** October 16, 2025
**Version:** 2.0.0
**Status:** Production Ready ✅
