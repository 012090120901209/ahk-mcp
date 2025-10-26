# AutoHotkey MCP Server - Technical Debt Cleanup Guide

## 📋 Executive Summary

This guide provides a systematic approach to resolve **515+ lint errors** and clean up accumulated technical debt in your AutoHotkey v2 MCP Server. The debt primarily consists of unused code, type safety issues, and formatting inconsistencies from rapid development.

**Expected Results:**
- Reduce lint errors from 515+ to <50
- Eliminate unsafe `any` types in core files
- Improve code maintainability and performance
- Maintain 100% test pass rate

**Time Estimate:** 4-5 weeks with gradual rollout
**Risk Level:** Low to Medium (phased approach ensures safety)

---

## 🚀 Quick Start Commands

### Phase 1: Safe Cleanup (Week 1)
```bash
# Run lint to see current state
npm run lint

# After each change, verify
npm run lint && npm test
```

### Phase 2: Type Safety (Weeks 2-3)
```bash
# Check current any types
npm run lint | grep "Unexpected any" | wc -l

# After fixes, verify reduction
npm run lint | grep "Unexpected any" | wc -l
```

### Phase 3: Formatting (Week 4)
```bash
# Format entire codebase
npx prettier --write "src/**/*.{ts,js}"

# Verify formatting
npm run lint | grep -E "(mixed-spaces-and-tabs|no-useless-escape)"
```

---

## 📁 Phase 1: Safe Unused Code Removal (Low Risk)

### 1.1 Remove Unused Imports

#### `src/core/metrics.ts` - Remove `register` import
```typescript
// BEFORE
import { register, Counter, Histogram, Gauge, Registry } from 'prom-client';

// AFTER
import { Counter, Histogram, Gauge, Registry } from 'prom-client';
```

**Why:** The `register` is never used - the class uses `this.registry` instead.

**Verification:**
```bash
grep -n "register" src/core/metrics.ts  # Should only show import line
```

#### `src/core/orchestration-engine.ts` - Remove `path` import
```typescript
// BEFORE
import path from 'path';
import { getActiveFilePath } from '../core/active-file.js';

// AFTER
import { getActiveFilePath } from '../core/active-file.js';
```

**Why:** Node.js `path` module imported but never used in the file.

#### `src/tools/ahk-analyze-lsp.ts` - Remove `FixableIssue` import
```typescript
// BEFORE
import { FixableIssue } from '../lsp/diagnostics.js';

// AFTER
// Remove the import line entirely
```

**Why:** Type imported but never used in type annotations.

#### Library Tools - Remove MCP Helper Imports
**Files:** `ahk-library-import.ts`, `ahk-library-info.ts`, `ahk-library-list.ts`, `ahk-system-analytics.ts`, `ahk-test-interactive.ts`

```typescript
// BEFORE
import { McpToolResponse, createTextResponse, createErrorResponse } from '../types/mcp-types.js';

// AFTER
// Remove the import line entirely
```

**Why:** Functions return plain objects directly instead of using these helpers.

### 1.2 Remove Unused Variables

#### `src/core/dependency-resolver.ts` - Fix destructuring
```typescript
// BEFORE
for (const [node, _] of this.graph) {
  if (!visited.has(node)) {
    this.dfs(node, visited, recursionStack, path, cycles);
  }
}

// AFTER
for (const node of this.graph.keys()) {
  if (!visited.has(node)) {
    this.dfs(node, visited, recursionStack, path, cycles);
  }
}
```

**Why:** The `_` variable captures the dependency array but is never used.

#### `src/tools/ahk-analyze-complete.ts` - Remove unused destructuring
```typescript
// BEFORE
const { mode, code } = validatedArgs;
const result = await this.runUnifiedAnalysis(validatedArgs);

// AFTER
const { mode } = validatedArgs;
const result = await this.runUnifiedAnalysis(validatedArgs);
```

**Why:** `code` is destructured but never used directly (passed via `validatedArgs`).

#### `src/tools/ahk-file-view.ts` - Remove `displayInfo` parameters
```typescript
// BEFORE
private formatStructuredOutput(content: string, displayInfo: any): string {

// AFTER
private formatStructuredOutput(content: string): string {
```

**Why:** Parameter declared but never referenced in function bodies.

### 1.3 Remove Unused Parameters

#### `src/core/path-interceptor.ts` - Remove `context` parameter
```typescript
// BEFORE
private processPathValue(value: any, targetFormat: PathFormat, context: string): PathConversionResult

// AFTER
private processPathValue(value: any, targetFormat: PathFormat): PathConversionResult
```

**Why:** `context` parameter never used in function body.

#### `src/core/path-interceptor.ts` - Remove `index` parameters
```typescript
// BEFORE
data.forEach((item, index) => {
  // only uses item
});

// AFTER
data.forEach((item) => {
  // only uses item
});
```

**Why:** `index` parameter never used in callback bodies.

#### `src/core/dependency-resolver.ts` - Remove `targetLib` parameter
```typescript
// BEFORE
private findVersionConflicts(targetLib: string): VersionConflict[] {
  // Placeholder implementation
  return [];
}

// AFTER
private findVersionConflicts(): VersionConflict[] {
  // Placeholder implementation
  return [];
}
```

**Why:** Function is a placeholder stub that doesn't use the parameter.

---

## 🔧 Phase 2: Type Safety Improvements (Medium Risk)

### 2.1 Replace `any` Types with Proper Types

#### High Priority: Tool Argument Types
```typescript
// BEFORE
export const AhkAnalyzeCodeArgsSchema = z.object({
  code: z.string(),
  mode: z.enum(['diagnostics', 'lsp', 'complete']),
  options: z.any() // ❌ Unsafe
});

// AFTER
interface AnalysisOptions {
  includeDocumentation?: boolean;
  includeUsageExamples?: boolean;
  enableClaudeStandards?: boolean;
}

export const AhkAnalyzeCodeArgsSchema = z.object({
  code: z.string(),
  mode: z.enum(['diagnostics', 'lsp', 'complete']),
  options: z.object({
    includeDocumentation: z.boolean().default(true),
    includeUsageExamples: z.boolean().default(false),
    enableClaudeStandards: z.boolean().default(true)
  }).optional()
});
```

#### Response Types
```typescript
// BEFORE
function analyzeCode(args: any): Promise<any> {

// AFTER
interface AnalysisResult {
  diagnostics: Diagnostic[];
  suggestions: string[];
  performance: PerformanceMetrics;
}

function analyzeCode(args: AnalysisArgs): Promise<AnalysisResult> {
```

### 2.2 Replace Non-null Assertions with Proper Checks

#### LSP Diagnostics Example
```typescript
// BEFORE
const diagnostics = this.getDiagnostics(filePath)!;
return diagnostics.map(d => d.message);

// AFTER
const diagnostics = this.getDiagnostics(filePath);
if (!diagnostics) {
  return [];
}
return diagnostics.map(d => d.message);
```

#### File Operations Example
```typescript
// BEFORE
const content = fs.readFileSync(filePath, 'utf8')!;
return this.parseContent(content);

// AFTER
let content: string;
try {
  content = fs.readFileSync(filePath, 'utf8');
} catch (error) {
  throw new Error(`Failed to read file ${filePath}: ${error.message}`);
}
return this.parseContent(content);
```

---

## 🎨 Phase 3: Code Formatting & Quality (Low Risk)

### 3.1 Fix Mixed Spaces/Tabs
```bash
# Configure Prettier
echo '{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}' > .prettierrc

# Format all files
npx prettier --write "src/**/*.{ts,js}"
```

### 3.2 Fix Unnecessary Escapes
```typescript
// BEFORE
const regex = /path\/to\/file/;

// AFTER
const regex = /path\/to\/file/; // Already correct, or use:
const regex = new RegExp('path/to/file'); // No escaping needed
```

### 3.3 ESLint Configuration Improvements
```javascript
// .eslintrc.cjs - Add stricter rules
module.exports = {
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error', // Upgrade from warn
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

---

## 🧪 Phase 4: Testing & Verification (Critical)

### 4.1 Pre-Change Verification
```bash
# Baseline check
npm run lint > lint-baseline.txt
npm test

# Count current issues
npm run lint 2>&1 | grep -c "error\|warning"
```

### 4.2 Post-Change Verification
```bash
# After each file change
npm run lint src/specific/file.ts
npm test -- --testPathPattern="specific-test"

# Full verification
npm run lint
npm run test
npm run test:mcp
```

### 4.3 Performance Testing
```typescript
// Add performance benchmarks
const startTime = performance.now();
// ... your code ...
const duration = performance.now() - startTime;
console.log(`Operation took ${duration}ms`);
```

### 4.4 Rollback Strategy
```bash
# Git workflow
git checkout -b cleanup-technical-debt
git commit -m "Phase 1: Remove unused imports" -- src/core/metrics.ts
git commit -m "Phase 1: Remove unused variables" -- src/core/dependency-resolver.ts

# If issues arise
git revert HEAD~1  # Rollback last commit
```

---

## 📊 Success Metrics & Monitoring

### Lint Error Reduction
```bash
# Track progress
echo "Initial: 515+ errors"
npm run lint 2>&1 | grep -c "error\|warning"  # Current count
```

### Type Safety Improvements
```bash
# Count any types
npm run lint 2>&1 | grep -c "Unexpected any"
```

### Test Coverage
```bash
# Ensure no regressions
npm run test
npm run test:mcp
```

---

## 🚨 Risk Mitigation

### Low Risk Changes (90%)
- ✅ Unused import removal
- ✅ Unused variable removal
- ✅ Formatting fixes
- ✅ Simple parameter removal

### Medium Risk Changes (10%)
- ⚠️ Type refactoring (requires interface updates)
- ⚠️ API signature changes (affects callers)

### High Risk Changes (0%)
- ❌ None - all changes maintain backward compatibility

---

## 📅 Implementation Timeline

| Week | Phase | Tasks | Verification |
|------|-------|-------|--------------|
| 1 | Safe Cleanup | Remove unused code | Lint + Tests pass |
| 2-3 | Type Safety | Replace any types | Type checking passes |
| 4 | Formatting | Prettier + ESLint | Consistent formatting |
| 5 | Hardening | Full testing | Performance maintained |

---

## 🛠️ Tools & Commands Reference

### Development Commands
```bash
# Build and test
npm run build
npm run test
npm run lint

# Format code
npx prettier --write "src/**/*.{ts,js}"

# Type checking
npx tsc --noEmit

# Find specific issues
npm run lint | grep "unused"
npm run lint | grep "any"
```

### Git Workflow
```bash
# Feature branch
git checkout -b cleanup-technical-debt

# Atomic commits
git add src/core/metrics.ts
git commit -m "Remove unused register import from metrics.ts"

# Push for backup
git push origin cleanup-technical-debt
```

### Monitoring Progress
```bash
# Create progress tracker
echo "# Technical Debt Cleanup Progress" > PROGRESS.md
echo "- [x] Phase 1: Safe cleanup" >> PROGRESS.md
echo "- [ ] Phase 2: Type safety" >> PROGRESS.md

# Update weekly
date >> PROGRESS.md
npm run lint 2>&1 | grep -c "error" >> PROGRESS.md
```

---

## 🎯 Final Verification Checklist

- [ ] All unused imports removed
- [ ] All unused variables removed
- [ ] All unused parameters removed
- [ ] No `any` types in core files
- [ ] No non-null assertions without proper checks
- [ ] Consistent formatting (spaces, not tabs)
- [ ] All tests pass
- [ ] Performance maintained or improved
- [ ] ESLint errors < 50
- [ ] TypeScript compilation clean

---

## 📞 Support & Troubleshooting

### Common Issues

**Build fails after changes:**
```bash
npm run clean
npm install
npm run build
```

**Tests fail:**
```bash
# Run specific test
npm test -- --testNamePattern="specific test"

# Debug mode
NODE_ENV=test npm test
```

**Type errors:**
```bash
# Check specific file
npx tsc --noEmit src/problematic/file.ts

# Full type check
npm run build
```

### Getting Help
1. Check git history for similar changes
2. Run tests in isolation
3. Revert problematic changes
4. Ask for review before complex type changes

---

**🎉 Your codebase will be significantly cleaner and more maintainable after this cleanup!**
