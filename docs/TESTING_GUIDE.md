# Testing Guide - AutoHotkey MCP Server

Complete testing strategy, execution patterns, and coverage analysis for the AutoHotkey v2 MCP server.

---

## Quick Reference

### Essential Commands

```bash
# Run all tests (unit + contract)
npm test

# Watch mode for development
npm run test:unit:watch

# Integration tests
npm run test:integration

# Full coverage analysis
npm run test:coverage

# View coverage in browser
npm run test:coverage:report

# Run all test tiers
npm run test:all
```

---

## Test Architecture

### Three-Tier Testing Strategy

```
┌─────────────────────────────────────────────────────┐
│         Integration Tests (Slow, Realistic)         │
│  - Full server lifecycle                            │
│  - End-to-end workflows                             │
│  - Real file I/O                                    │
│  ~ 30-60 seconds                                    │
└─────────────────────────────────────────────────────┘
                          ▲
                          │
┌─────────────────────────────────────────────────────┐
│         Contract Tests (Fast, Boundaries)            │
│  - API compatibility guarantees                     │
│  - Parameter naming contracts                       │
│  - Output format contracts                          │
│  ~ 2-5 seconds                                      │
└─────────────────────────────────────────────────────┘
                          ▲
                          │
┌─────────────────────────────────────────────────────┐
│         Unit Tests (Fast, Isolated)                  │
│  - Individual functions                             │
│  - Utility behavior                                 │
│  - Helper functions                                 │
│  ~ 1-5 seconds                                      │
└─────────────────────────────────────────────────────┘
```

### Test File Locations

| Type | Directory | Config | Coverage |
|------|-----------|--------|----------|
| Unit | `Tests/unit/` | `jest.config.js` | ✅ Measured |
| Contract | `Tests/contract/` | `jest.config.js` | ✅ Measured |
| Integration | `Tests/integration/` | `jest.config.integration.js` | ⏭️ Separate |

---

## Running Tests

### Local Development

**Unit Tests (Default)**
```bash
npm test
# Runs: Tests/unit/*.test.ts + Tests/contract/*.test.ts
# Duration: 5-15 seconds
# Coverage: Enforced (80% threshold)
```

**Watch Mode** (Auto-rerun on file changes)
```bash
npm run test:unit:watch
# Useful for TDD workflow
# Press 'a' to run all, 'f' to run failed, 'q' to quit
```

**Integration Tests** (Spawns actual server)
```bash
npm run test:integration
# Runs: Tests/integration/*.test.ts
# Duration: 30-60 seconds
# Note: Windows-specific for AutoHotkey tests
```

**All Tests** (Sequential execution)
```bash
npm run test:all
# Runs: unit + contract + integration
# Duration: 1-2 minutes
# Good for pre-commit verification
```

---

## Coverage Analysis

### Viewing Coverage

**Generate Coverage Report**
```bash
npm run test:coverage
# Generates: coverage/index.html and other formats
```

**Open in Browser**
```bash
npm run test:coverage:report
# Opens coverage/index.html in default browser
```

**Coverage Metrics**
```
Metrics Provided:
✓ Lines: % of statement lines executed
✓ Functions: % of functions called
✓ Statements: % of individual statements executed
✓ Branches: % of conditional branches taken
```

### Coverage Thresholds

**Global Thresholds** (all files)
- Lines: 80%
- Functions: 80%
- Statements: 80%
- Branches: 75%

**Core Module Thresholds** (src/core/*)
- Lines: 85%
- Functions: 85%
- Statements: 85%
- Branches: 85%

**Tool Module Thresholds** (src/tools/*)
- Lines: 75%
- Functions: 75%
- Statements: 75%
- Branches: 70%

### Understanding Coverage Reports

**Lines** - Which source code lines were executed
```typescript
function add(a, b) {
  return a + b;    // ✅ Covered if function called
}
```

**Functions** - Which functions were called
```typescript
export function add(a, b) { ... }    // ✅ Covered if called
export function subtract(a, b) { }   // ❌ Not covered if not called
```

**Branches** - Which code paths were executed
```typescript
if (condition) {          // ✅ Covered if branch taken
  doSomething();          // ✅ Covered if branch taken
} else {                  // ❌ Not covered if branch never taken
  doOtherThing();
}
```

**Statements** - Individual statements executed
```typescript
const x = 5;              // ✅ Covered
const y = add(x, 3);     // ✅ Covered if add() is called
console.log(y);          // ❌ Not covered if line never runs
```

---

## Test Organization

### Unit Tests (`Tests/unit/`)

Tests for individual functions and utilities in isolation.

**Examples:**
- `orchestration-context.test.ts` - Cache management
- `parameter-aliases.test.ts` - Parameter handling
- `debug-formatter.test.ts` - Output formatting
- `library-scanner.test.ts` - File system operations

**Characteristics:**
- ✅ Fast (< 1 second each)
- ✅ Isolated (no external dependencies)
- ✅ Deterministic (same result every time)
- ✅ Focus on single responsibility

**Example Test:**
```typescript
describe('library-scanner', () => {
  it('should find .ahk files in directory', () => {
    const files = scanDirectory('./test-fixtures');
    expect(files).toContain('test.ahk');
  });
});
```

### Contract Tests (`Tests/contract/`)

Tests that verify API compatibility and backward compatibility.

**Examples:**
- `parameter-aliases.test.ts` - Verify deprecated → new parameters
- `dry-run-output.test.ts` - Verify output format hasn't changed
- `debug-output.test.ts` - Verify debug format compatibility

**Characteristics:**
- ✅ Test behavior, not implementation
- ✅ Catch breaking changes early
- ✅ Document expected contracts
- ✅ Cross-version compatibility

**Example Test:**
```typescript
describe('parameter-aliases contract', () => {
  it('should accept deprecated "content" parameter', () => {
    const result = tool.execute({ content: 'text' });
    expect(result.success).toBe(true);
  });

  it('should prefer "newContent" over "content"', () => {
    const result = tool.execute({
      content: 'old',
      newContent: 'new'
    });
    expect(result.text).toBe('new');
  });
});
```

### Integration Tests (`Tests/integration/`)

Tests that verify end-to-end workflows with actual server.

**Examples:**
- `edit-dryrun.test.ts` - Dry-run workflow
- `orchestrator-debug.test.ts` - Debug mode operation
- `backward-compat.test.ts` - Full backward compatibility

**Characteristics:**
- ⏱️ Slower (30-120 seconds each)
- 🖥️ Uses real server instance
- 📁 Real file I/O
- 🔄 Complex workflows

**Example Test:**
```typescript
describe('edit dry-run workflow', () => {
  let serverUrl: string;

  beforeAll(async () => {
    const server = await startTestServer();
    serverUrl = server.url;
  });

  afterAll(async () => {
    await stopTestServer();
  });

  it('should preview changes without modifying files', async () => {
    const response = await makeMCPRequest(serverUrl, {
      method: 'tools/call',
      params: {
        name: 'AHK_File_Edit',
        arguments: {
          action: 'replace',
          search: 'old',
          newContent: 'new',
          dryRun: true
        }
      }
    });

    expect(response.content[0].text).toContain('DRY RUN');
  });
});
```

---

## Writing Tests

### Test File Naming
```
✅ Correct:
- utility.test.ts
- logger.test.ts
- validation-middleware.test.ts

❌ Incorrect:
- test-utility.ts
- logger-test.ts
- test.ts
```

### Test Naming Convention
```typescript
describe('ComponentName', () => {
  // ✅ Clear what's being tested
  describe('methodName', () => {
    it('should return expected value', () => { ... });
    it('should throw error for invalid input', () => { ... });
    it('should handle edge case', () => { ... });
  });
});
```

### Test Structure (AAA Pattern)

```typescript
it('should do something', () => {
  // Arrange - Setup test data and conditions
  const input = { value: 42 };
  const expected = 84;

  // Act - Call the function being tested
  const result = double(input);

  // Assert - Verify the result
  expect(result).toBe(expected);
});
```

### Async Test Patterns

**Promise-based**
```typescript
it('should load file async', async () => {
  const content = await loadFile('test.txt');
  expect(content).toBeDefined();
});
```

**Callback-based**
```typescript
it('should process callback', (done) => {
  processData((error, result) => {
    expect(error).toBeNull();
    done();
  });
});
```

### Error Testing

**Testing Errors**
```typescript
it('should throw for invalid input', () => {
  expect(() => {
    parse(null);
  }).toThrow('Input required');
});

it('should reject promise on error', async () => {
  await expect(loadFile('missing.txt'))
    .rejects.toThrow('File not found');
});
```

### Mock Testing

**Using Test Utilities**
```typescript
it('should format tool response', () => {
  const response = createMockToolResponse('Success');
  expect(response.isError).toBe(false);
  expect(response.content[0].text).toBe('Success');
});
```

---

## Best Practices

### ✅ Do

**Write Descriptive Test Names**
```typescript
✅ it('should return 42 when given input 21 and multiplier 2')
❌ it('works')
```

**Test Both Happy Path and Error Cases**
```typescript
describe('validate', () => {
  it('should accept valid input', () => { ... });
  it('should reject null input', () => { ... });
  it('should reject empty string', () => { ... });
});
```

**Use Fixtures for Test Data**
```typescript
const testFile = createMockAHKFile(`
  MsgBox("Test")
`, 'test.ahk');
```

**Clean Up Resources**
```typescript
afterEach(async () => {
  await cleanupTempDir(tempDir);
});
```

**Test Behavior, Not Implementation**
```typescript
✅ expect(cache.get(key)).toBe(value);
❌ expect(cache.internalMap.has(key)).toBe(true);
```

### ❌ Don't

**Hardcode Paths**
```typescript
❌ fs.readFileSync('/Users/john/project/test.ahk')
✅ fs.readFileSync(path.join(tempDir, 'test.ahk'))
```

**Create Test Dependencies**
```typescript
❌ test1 creates file that test2 reads
✅ Each test creates its own fixtures
```

**Skip Error Cases**
```typescript
❌ Only test happy path
✅ Test errors, null, undefined, empty, etc.
```

**Mix Unit and Integration**
```typescript
❌ Unit test that spawns server
✅ Unit tests isolated, integration tests with server
```

---

## Coverage Improvement Workflow

### 1. Generate Coverage Report
```bash
npm run test:coverage
```

### 2. Identify Uncovered Code
```
Open coverage/index.html
Look for red (uncovered) sections
Note the line numbers and file
```

### 3. Add Tests
```typescript
it('should handle missing value', () => {
  const result = process(undefined);
  expect(result).toBe(null);
});
```

### 4. Verify Coverage Improved
```bash
npm run test:coverage
# Should see improvement in coverage/index.html
```

### 5. Focus on High-Impact Areas
```
Priority 1: Branch coverage (if/else, switch)
Priority 2: Error paths (try/catch)
Priority 3: Edge cases (null, empty, max/min)
Priority 4: Happy path (basic functionality)
```

---

## Troubleshooting

### Tests Timeout
```bash
# Increase timeout for slow tests
jest.setTimeout(60000); // 60 seconds

# Check for unresolved promises
await Promise.resolve();

# Verify server startup
await waitForServer(url, 30000);
```

### Coverage Not Improving
```bash
# Run coverage again (might be caching)
npm run test:coverage

# Check if file is excluded
grep "coveragePathIgnorePatterns" jest.config.js

# Add specific file
npm run test:coverage -- --collectCoverageFrom="src/specific-file.ts"
```

### Integration Tests Fail
```bash
# Check server logs
npm run debug:start

# Run with verbose output
npm run test:integration -- --verbose

# Check port is available
netstat -ano | grep 3000  # Windows
lsof -i :3000            # macOS/Linux
```

### Memory Issues
```bash
# Run tests sequentially
npm test -- --maxWorkers=1

# Split test file
npm test -- Tests/unit/part1.test.ts

# Clear jest cache
npm test -- --clearCache
```

---

## CI/CD Testing

### GitHub Actions Workflow

**Test Stages:**
1. Lint (ESLint, TypeScript)
2. Security (npm audit)
3. Build (TypeScript compilation)
4. Unit Tests (Ubuntu, Windows, macOS + Node 18, 20, 21)
5. Integration Tests (Windows only, for AHK)
6. Coverage Upload (Codecov)
7. Performance (Main branch only)

**View Results:**
- GitHub Actions tab → test run → test results
- Codecov.io → coverage trends

---

## Performance Considerations

### Test Execution Time
| Tier | Duration | Best For |
|------|----------|----------|
| Unit | 5-15s | Local development |
| Unit + Coverage | 10-20s | Pre-commit |
| Integration | 30-60s | Pre-push |
| All | 1-2m | CI/CD pipelines |

### Optimization Tips
```bash
# Run only changed tests
npm run test:unit:watch

# Run specific test file
npm test -- Tests/unit/logger.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="validation"

# Parallel execution (default)
npm test -- --maxWorkers=4

# Sequential (for debugging)
npm test -- --maxWorkers=1
```

---

## Examples & Templates

### Full Test Example
```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTempDir, cleanupTempDir } from '@tests/setup';
import { parseAHKFile } from '@/parser';

describe('AHK File Parser', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('parseAHKFile', () => {
    it('should parse valid AHK code', () => {
      const code = 'MsgBox("Hello")';
      const ast = parseAHKFile(code);
      expect(ast.statements).toHaveLength(1);
    });

    it('should throw for invalid syntax', () => {
      const code = 'MsgBox("unclosed';
      expect(() => parseAHKFile(code))
        .toThrow('Unexpected EOF');
    });

    it('should handle complex nested structures', () => {
      const code = `
        class MyClass {
          method() {
            if (condition) {
              loop 10 {
                MsgBox("test")
              }
            }
          }
        }
      `;
      const ast = parseAHKFile(code);
      expect(ast.classes).toHaveLength(1);
    });
  });
});
```

### Integration Test Example
```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  startTestServer,
  stopTestServer,
  makeMCPRequest,
  waitForServer
} from '@tests/setup';

describe('AHK_File_Edit Tool', () => {
  let serverUrl: string;

  beforeAll(async () => {
    const server = await startTestServer(3001);
    serverUrl = server.url;
    await waitForServer(serverUrl);
  });

  afterAll(async () => {
    await stopTestServer();
  });

  it('should edit file successfully', async () => {
    const response = await makeMCPRequest(serverUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'AHK_File_Edit',
        arguments: {
          action: 'replace',
          search: 'old_text',
          newContent: 'new_text',
          filePath: '/path/to/file.ahk'
        }
      }
    });

    expect(response.result?.isError).toBe(false);
  });
});
```

---

## Resources

### Official Documentation
- Jest: https://jestjs.io/
- TypeScript Jest: https://kulshekhar.github.io/ts-jest/
- Testing Library: https://testing-library.com/

### Project Files
- Unit Tests: `Tests/unit/`
- Integration Tests: `Tests/integration/`
- Test Setup: `Tests/setup/`
- Jest Configs: `jest.config*.js`
- Test Scripts: `package.json` (test-related)

### Key Files
- `Tests/README.md` - Test structure details
- `jest.config.js` - Unit/contract test configuration
- `jest.config.integration.js` - Integration test configuration
- `jest.config.coverage.js` - Coverage analysis configuration

---

## Summary

**Testing Philosophy:**
- Fast feedback loops (unit tests)
- Comprehensive coverage (80%+ target)
- Real-world verification (integration tests)
- Backward compatibility (contract tests)

**Key Commands:**
```bash
npm test              # Run unit + contract tests
npm run test:unit:watch   # Development watch mode
npm run test:integration  # End-to-end tests
npm run test:coverage     # Full coverage analysis
```

**Success Metrics:**
✅ 80%+ code coverage
✅ All tests pass locally before commit
✅ All tests pass in CI/CD
✅ No performance regressions
✅ Backward compatibility maintained

---

**Last Updated:** October 16, 2025
**Status:** Production Ready ✅
