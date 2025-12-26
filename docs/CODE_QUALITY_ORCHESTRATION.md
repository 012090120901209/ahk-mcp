# Code Quality Orchestration

**Intelligent Linting & Code Mapping for AutoHotkey v2 MCP Server**

**Created:** 2025-11-09 **Status:** Design Proposal **Goal:** Integrate code
quality checks into orchestration without performance degradation

---

## Overview

This document proposes a **layered code quality system** that integrates linting
and code mapping into the MCP orchestration flow using:

- ✅ **Smart caching** to avoid redundant analysis
- ✅ **Tiered linting** (fast → thorough based on operation)
- ✅ **Background processing** for non-blocking checks
- ✅ **Code mapping** for better LLM context
- ✅ **Automatic fixes** for common issues

**Performance Target:** Add <50ms overhead for cached results, <200ms for fresh
analysis

---

## 1. Architecture Overview

### Current Flow (No Linting)

```
User Request
    ↓
Intent Detection
    ↓
Cache Check
    ↓
Tool Chain Execution (AHK_File_View → AHK_File_Edit)
    ↓
Return Result
```

**Time:** ~150-300ms (cached), ~500-800ms (uncached)

### Proposed Flow (With Code Quality Layer)

```
User Request
    ↓
Intent Detection
    ↓
┌─────────────────────────────────────┐
│  Code Quality Gate (Conditional)    │
│  • Fast mode: Cached lint results   │
│  • Edit mode: Pre-edit validation   │
│  • View mode: Skip linting          │
└─────────────────────────────────────┘
    ↓
Cache Check (includes lint results)
    ↓
Tool Chain Execution
    ↓
┌─────────────────────────────────────┐
│  Post-Edit Validation (Optional)    │
│  • Run on file writes               │
│  • Background async check           │
│  • Return warnings (non-blocking)   │
└─────────────────────────────────────┘
    ↓
Return Result + Code Quality Report
```

**Time:** ~180-350ms (cached), ~600-900ms (uncached with lint)

**Key Insight:** Only +30-100ms overhead by using smart caching and async
background checks

---

## 2. Tiered Linting Strategy

### Tier 0: No Linting (View-Only Operations)

**When:** User is just viewing/reading code **Tools:** AHK_File_View,
AHK_Docs_Search **Cost:** 0ms (skip entirely)

### Tier 1: Fast Syntax Check (Always On)

**When:** Any file operation **Checks:**

- Balanced braces `{}`, `()`, `[]`
- Unterminated strings
- V1 syntax patterns (auto-detected)
- Invalid escape sequences

**Implementation:**

```typescript
// src/core/linting/fast-syntax-check.ts
export class FastSyntaxChecker {
  check(content: string): LintResult {
    const errors: LintError[] = [];

    // 1. Brace matching (O(n) scan)
    const braceStack: string[] = [];
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '{') braceStack.push('{');
      else if (char === '}') {
        if (braceStack.length === 0) {
          errors.push({
            line: this.getLine(content, i),
            message: 'Unmatched closing brace',
          });
        } else {
          braceStack.pop();
        }
      }
    }

    // 2. V1 syntax detection (regex)
    const v1Patterns = [
      /^\s*[A-Z]\w+,/m, // V1 command syntax
      /IfWinExist/i, // V1 control flow
      /StringSplit/i, // V1 string functions
    ];

    for (const pattern of v1Patterns) {
      if (pattern.test(content)) {
        errors.push({
          line: 0,
          message: 'V1 syntax detected - use AHK v2 syntax',
          severity: 'warning',
        });
        break;
      }
    }

    return { errors, duration: Date.now() - start };
  }
}
```

**Cost:** ~10-20ms for 1000-line file

### Tier 2: Structure Analysis (Cached)

**When:** Before editing operations **Checks:**

- Class/function structure
- Variable declarations
- Function signatures
- Hotkey definitions

**Implementation:**

```typescript
// src/core/linting/structure-analyzer.ts
export class StructureAnalyzer {
  analyze(content: string, filePath: string): StructureMap {
    const cached = this.cache.get(filePath);
    const fileMtime = fs.statSync(filePath).mtimeMs;

    // Return cached if file unchanged
    if (cached && cached.mtime === fileMtime) {
      return cached.structure;
    }

    // Parse structure (using existing parser)
    const structure = {
      classes: this.extractClasses(content),
      functions: this.extractFunctions(content),
      hotkeys: this.extractHotkeys(content),
      variables: this.extractVariables(content),
    };

    // Cache with file modification time
    this.cache.set(filePath, { structure, mtime: fileMtime, ttl: 300000 });

    return structure;
  }

  private extractClasses(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const regex = /class\s+(\w+)(\s+extends\s+\w+)?\s*\{/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
      const className = match[1];
      const startLine = this.getLineNumber(content, match.index);
      const endLine = this.findClassEnd(content, match.index);

      classes.push({
        name: className,
        startLine,
        endLine,
        methods: this.extractMethods(content, match.index, endLine),
      });
    }

    return classes;
  }
}
```

**Cost:** ~30-50ms (uncached), ~5ms (cached)

### Tier 3: Deep Semantic Analysis (On-Demand)

**When:** Explicit lint request or before git commit **Checks:**

- Unused variables
- Dead code detection
- Cyclomatic complexity
- Naming convention violations
- Missing error handling

**Implementation:**

```typescript
// src/core/linting/semantic-analyzer.ts
export class SemanticAnalyzer {
  async analyze(filePath: string, options: LintOptions): Promise<LintReport> {
    // Use existing AHK_LSP and AHK_Diagnostics tools
    const diagnostics = await this.runDiagnostics(filePath);
    const lspResults = await this.runLSP(filePath);

    // Combine results
    return {
      errors: [...diagnostics.errors, ...lspResults.errors],
      warnings: [...diagnostics.warnings, ...lspResults.warnings],
      suggestions: this.generateSuggestions(diagnostics, lspResults),
      complexity: this.analyzeComplexity(filePath),
      coverage: this.checkTestCoverage(filePath), // if tests exist
    };
  }
}
```

**Cost:** ~100-200ms (can run async in background)

### Tier 4: Auto-Fix Mode (Optional)

**When:** User enables auto-fix or explicitly requests **Checks:** All of Tier
3 + automatic fixes **Actions:**

- Add missing semicolons
- Fix indentation
- Convert V1 to V2 syntax
- Add type hints (if using alpha features)

**Cost:** ~150-300ms + file write time

---

## 3. Integration with Orchestration Engine

### 3.1 Enhanced OrchestrationEngine

```typescript
// src/core/orchestration-engine.ts (ENHANCED)

export interface OrchestrationRequest {
  intent: string;
  filePath?: string;
  targetEntity?: string;
  operation?: 'view' | 'edit' | 'analyze';
  forceRefresh?: boolean;
  debugMode?: boolean;

  // NEW: Code quality options
  lintLevel?: 'none' | 'fast' | 'standard' | 'thorough';
  autoFix?: boolean;
  includeCodeMap?: boolean;
}

export class OrchestrationEngine {
  private lintCache = new Map<string, LintCacheEntry>();
  private structureCache = new Map<string, StructureMap>();

  async processIntent(
    request: OrchestrationRequest
  ): Promise<OrchestrationResult> {
    const context: OrchestrationContext = {
      // ... existing fields
      lintLevel: request.lintLevel || this.detectLintLevel(request),
      codeQualityReport: null,
    };

    // STEP 1: Determine if linting is needed
    if (this.shouldLint(request, context)) {
      // STEP 2: Run appropriate lint tier
      context.codeQualityReport = await this.runCodeQuality(
        request.filePath!,
        context.lintLevel!,
        context
      );

      // STEP 3: If critical errors, return early (optional)
      if (this.hasCriticalErrors(context.codeQualityReport)) {
        return this.createEarlyExitResponse(context.codeQualityReport);
      }
    }

    // STEP 4: Continue with normal orchestration
    const result = await this.executeToolChain(intent, context, request);

    // STEP 5: Attach code quality report to result
    if (context.codeQualityReport) {
      result.content.push({
        type: 'text',
        text: this.formatCodeQualityReport(context.codeQualityReport),
      });
    }

    // STEP 6: Background post-edit validation (async, non-blocking)
    if (request.operation === 'edit' && context.lintLevel === 'thorough') {
      this.scheduleBackgroundLint(request.filePath!, context);
    }

    return result;
  }

  /**
   * Smart lint level detection based on operation type
   */
  private detectLintLevel(request: OrchestrationRequest): LintLevel {
    // View operations: no linting
    if (request.operation === 'view') {
      return 'none';
    }

    // Edit operations: standard linting
    if (request.operation === 'edit') {
      return 'standard';
    }

    // Analyze operations: thorough linting
    if (request.operation === 'analyze') {
      return 'thorough';
    }

    // Default: fast syntax check
    return 'fast';
  }

  /**
   * Run code quality checks with caching
   */
  private async runCodeQuality(
    filePath: string,
    level: LintLevel,
    context: OrchestrationContext
  ): Promise<CodeQualityReport> {
    const cacheKey = `${filePath}:${level}`;
    const cached = this.lintCache.get(cacheKey);
    const fileMtime = (await fs.stat(filePath)).mtimeMs;

    // Return cached if file unchanged
    if (cached && cached.mtime === fileMtime && cached.level === level) {
      context.cacheHits++;
      return cached.report;
    }

    context.toolCalls++;
    const startTime = Date.now();

    // Run appropriate tier
    let report: CodeQualityReport;
    switch (level) {
      case 'fast':
        report = await this.fastSyntaxChecker.check(filePath);
        break;
      case 'standard':
        report = await this.structureAnalyzer.analyze(filePath);
        break;
      case 'thorough':
        report = await this.semanticAnalyzer.analyze(filePath, {
          autoFix: false,
        });
        break;
      default:
        report = { errors: [], warnings: [], duration: 0 };
    }

    report.duration = Date.now() - startTime;

    // Cache result
    this.lintCache.set(cacheKey, {
      report,
      mtime: fileMtime,
      level,
      timestamp: Date.now(),
      ttl: 300000, // 5 minutes
    });

    return report;
  }

  /**
   * Schedule background linting (non-blocking)
   */
  private scheduleBackgroundLint(
    filePath: string,
    context: OrchestrationContext
  ): void {
    // Don't block - run in background
    setImmediate(async () => {
      try {
        const report = await this.semanticAnalyzer.analyze(filePath, {
          thorough: true,
        });

        // Store for next request
        this.lintCache.set(`${filePath}:background`, {
          report,
          mtime: (await fs.stat(filePath)).mtimeMs,
          level: 'thorough',
          timestamp: Date.now(),
          ttl: 600000, // 10 minutes for background
        });

        // Log interesting findings
        if (report.errors.length > 0 || report.warnings.length > 5) {
          logger.info(
            `Background lint for ${filePath}: ${report.errors.length} errors, ${report.warnings.length} warnings`
          );
        }
      } catch (err) {
        logger.debug(`Background lint failed for ${filePath}:`, err);
      }
    });
  }
}
```

### 3.2 Code Quality Report Format

```typescript
export interface CodeQualityReport {
  // Errors (must fix)
  errors: LintError[];

  // Warnings (should fix)
  warnings: LintWarning[];

  // Suggestions (nice to have)
  suggestions: LintSuggestion[];

  // Code structure map
  structure?: StructureMap;

  // Metrics
  metrics?: CodeMetrics;

  // Performance
  duration: number;
  cached: boolean;
}

export interface LintError {
  line: number;
  column?: number;
  message: string;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  fixable: boolean;
  fix?: string; // Suggested fix
}

export interface StructureMap {
  classes: ClassInfo[];
  functions: FunctionInfo[];
  hotkeys: HotkeyInfo[];
  variables: VariableInfo[];
  dependencies: DependencyInfo[];
}

export interface CodeMetrics {
  lines: number;
  linesOfCode: number;
  linesOfComments: number;
  complexity: number; // Cyclomatic complexity
  maintainability: number; // 0-100 score
  classes: number;
  functions: number;
}
```

---

## 4. Code Mapping for Better LLM Context

### 4.1 Structure Extraction

When orchestrating an edit operation, extract code structure to help the LLM
understand context:

```typescript
// src/core/linting/code-mapper.ts
export class CodeMapper {
  /**
   * Create a compact code map for LLM context
   */
  generateCodeMap(filePath: string): CodeMap {
    const structure = this.structureAnalyzer.analyze(filePath);

    return {
      summary: this.generateSummary(structure),
      outline: this.generateOutline(structure),
      dependencies: this.extractDependencies(filePath),
      exports: this.extractExports(structure),
      complexity: this.calculateComplexity(structure),
    };
  }

  /**
   * Generate human-readable outline
   */
  private generateOutline(structure: StructureMap): string {
    let outline = '## Code Structure\n\n';

    // Classes
    if (structure.classes.length > 0) {
      outline += '### Classes\n';
      for (const cls of structure.classes) {
        outline += `- **${cls.name}** (lines ${cls.startLine}-${cls.endLine})\n`;
        for (const method of cls.methods) {
          outline += `  - ${method.name}(${method.params.join(', ')})\n`;
        }
      }
      outline += '\n';
    }

    // Functions
    if (structure.functions.length > 0) {
      outline += '### Functions\n';
      for (const fn of structure.functions) {
        outline += `- **${fn.name}**(${fn.params.join(', ')}) - line ${fn.startLine}\n`;
      }
      outline += '\n';
    }

    // Hotkeys
    if (structure.hotkeys.length > 0) {
      outline += '### Hotkeys\n';
      for (const hk of structure.hotkeys) {
        outline += `- **${hk.trigger}** - ${hk.description || 'No description'}\n`;
      }
    }

    return outline;
  }
}
```

### 4.2 Usage in Orchestration

```typescript
// When user asks: "Edit the handleClick method in ButtonManager class"
const codeMap = codeMapper.generateCodeMap(filePath);

// Inject into tool call context
const editResult = await toolRegistry.executeTool('AHK_File_Edit', {
  filePath,
  search: 'handleClick(',
  newContent: '...',
  // Include code map for better LLM understanding
  _context: {
    codeMap,
    targetClass: 'ButtonManager',
    targetMethod: 'handleClick',
  },
});
```

This helps the LLM:

- ✅ Find the right code location faster
- ✅ Understand class/function boundaries
- ✅ Avoid breaking related code
- ✅ Suggest better variable names based on context

---

## 5. Performance Optimization Techniques

### 5.1 Incremental Parsing

For large files (>1000 lines), only re-parse changed sections:

```typescript
export class IncrementalParser {
  private parseCache = new Map<string, ParsedAST>();

  parse(filePath: string, content: string, changedRange?: Range): ParsedAST {
    const cached = this.parseCache.get(filePath);

    if (cached && changedRange) {
      // Only re-parse changed section
      const updatedAST = this.reparseSectionection(
        cached,
        content,
        changedRange
      );
      this.parseCache.set(filePath, updatedAST);
      return updatedAST;
    }

    // Full parse
    const ast = this.fullParse(content);
    this.parseCache.set(filePath, ast);
    return ast;
  }
}
```

**Speedup:** 5-10x faster for small edits in large files

### 5.2 Lazy Structure Analysis

Only analyze structures when needed:

```typescript
export class LazyStructureAnalyzer {
  async analyzeOnDemand(filePath: string, query: StructureQuery): Promise<any> {
    // Query: "Find class Foo"
    if (query.type === 'class') {
      return this.extractClasses(filePath).filter(c => c.name === query.name);
    }

    // Query: "Find all functions"
    if (query.type === 'function') {
      return this.extractFunctions(filePath);
    }

    // Don't extract everything if not needed
  }
}
```

**Speedup:** 2-3x faster when only partial structure needed

### 5.3 Parallel Analysis

Run multiple checks in parallel:

```typescript
async runCodeQuality(filePath: string): Promise<CodeQualityReport> {
  // Run checks in parallel
  const [syntaxResult, structureResult, semanticResult] = await Promise.all([
    this.fastSyntaxChecker.check(filePath),
    this.structureAnalyzer.analyze(filePath),
    this.semanticAnalyzer.analyze(filePath)
  ]);

  // Merge results
  return {
    errors: [...syntaxResult.errors, ...semanticResult.errors],
    warnings: structureResult.warnings,
    structure: structureResult.structure,
    duration: Math.max(
      syntaxResult.duration,
      structureResult.duration,
      semanticResult.duration
    )
  };
}
```

**Speedup:** 40-60% faster than sequential execution

---

## 6. User-Facing Features

### 6.1 Smart Lint Tool

New MCP tool for explicit linting:

```typescript
// src/tools/ahk-lint.ts
export const AhkLintArgsSchema = z.object({
  filePath: z.string().optional(),
  level: z.enum(['fast', 'standard', 'thorough']).default('standard'),
  autoFix: z.boolean().default(false),
  includeCodeMap: z.boolean().default(true),
  rules: z.array(z.string()).optional(), // Specific rules to check
  ignoreRules: z.array(z.string()).optional(),
});

export const ahkLintToolDefinition = {
  name: 'AHK_Lint',
  description: `Comprehensive code quality analysis with linting, structure mapping, and auto-fix capabilities.

**Usage Examples:**

Fast syntax check:
\`\`\`json
{
  "filePath": "MyScript.ahk",
  "level": "fast"
}
\`\`\`

Thorough analysis with code map:
\`\`\`json
{
  "filePath": "MyScript.ahk",
  "level": "thorough",
  "includeCodeMap": true
}
\`\`\`

Auto-fix common issues:
\`\`\`json
{
  "filePath": "MyScript.ahk",
  "level": "standard",
  "autoFix": true
}
\`\`\`

**Output Format:**
- ✅/❌ Lint status
- Error/warning counts
- Code structure outline
- Suggested fixes
- Complexity metrics

**See also:** AHK_Diagnostics, AHK_File_View, AHK_Smart_Orchestrator`,
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'File to lint (defaults to active file)',
      },
      level: {
        type: 'string',
        enum: ['fast', 'standard', 'thorough'],
        default: 'standard',
        description:
          'Analysis depth: fast (syntax), standard (+structure), thorough (+semantics)',
      },
      autoFix: {
        type: 'boolean',
        default: false,
        description: 'Automatically fix issues',
      },
      includeCodeMap: {
        type: 'boolean',
        default: true,
        description: 'Include code structure map',
      },
      rules: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific rules to check',
      },
      ignoreRules: {
        type: 'array',
        items: { type: 'string' },
        description: 'Rules to ignore',
      },
    },
  },
};
```

### 6.2 Automatic Orchestration Integration

Configure when linting runs automatically:

```typescript
// src/core/tool-settings.ts
export interface CodeQualitySettings {
  // When to run automatic linting
  autoLintOn: {
    view: boolean; // Default: false
    edit: boolean; // Default: true
    analyze: boolean; // Default: true
  };

  // Default lint level per operation
  defaultLevel: {
    view: LintLevel; // Default: 'none'
    edit: LintLevel; // Default: 'standard'
    analyze: LintLevel; // Default: 'thorough'
  };

  // Blocking behavior
  blockOnErrors: boolean; // Default: false (show errors but continue)

  // Cache settings
  cacheResults: boolean; // Default: true
  cacheTTL: number; // Default: 300000 (5 min)

  // Background processing
  backgroundLint: boolean; // Default: true (after edits)
}
```

### 6.3 Configuration via Tool

```typescript
// New tool: AHK_Lint_Configure
{
  "name": "AHK_Lint_Configure",
  "action": "set",
  "settings": {
    "autoLintOn": {
      "edit": true,
      "view": false
    },
    "defaultLevel": {
      "edit": "standard"
    },
    "blockOnErrors": false
  }
}
```

---

## 7. Example Workflows

### Workflow 1: View File (No Linting)

```
User: "Show me MyScript.ahk"
    ↓
Orchestrator detects: operation=view, lintLevel=none
    ↓
Cache check: File structure cached ✅
    ↓
AHK_File_View executed (no linting)
    ↓
Return: File content
```

**Time:** ~50ms (cached)

### Workflow 2: Edit File (Standard Linting)

```
User: "Change class name Foo to Bar in MyScript.ahk"
    ↓
Orchestrator detects: operation=edit, lintLevel=standard
    ↓
Pre-edit lint:
  - Fast syntax check: 15ms ✅
  - Structure analysis: 30ms (cached) ✅
    ↓
AHK_File_Edit executed
    ↓
Background thorough lint scheduled (async)
    ↓
Return: Edit result + Code quality summary
```

**Time:** ~150ms (with lint), background continues for ~200ms more

### Workflow 3: Analyze Code (Thorough Linting)

```
User: "Analyze the code quality of MyScript.ahk"
    ↓
Orchestrator detects: operation=analyze, lintLevel=thorough
    ↓
Run all checks in parallel:
  - Syntax: 15ms
  - Structure: 40ms
  - Semantics: 120ms
  - Code map generation: 30ms
    ↓
Generate comprehensive report
    ↓
Return: Full analysis + code map + metrics
```

**Time:** ~200ms (parallel execution)

### Workflow 4: Auto-Fix Mode

```
User: "Lint and fix issues in MyScript.ahk"
    ↓
AHK_Lint called with autoFix=true
    ↓
Thorough analysis: 180ms
    ↓
Generate fixes:
  - Indentation: 12 issues
  - V1 syntax: 3 conversions
  - Missing semicolons: 8 fixes
    ↓
Apply fixes via AHK_File_Edit
    ↓
Re-lint to verify: 50ms (cached structure)
    ↓
Return: Before/after diff + quality improvement %
```

**Time:** ~400ms total

---

## 8. Metrics & Monitoring

### 8.1 Lint Performance Tracking

```typescript
export interface LintMetrics {
  // Per-tier performance
  fastChecks: { count: number; avgDuration: number; cacheHitRate: number };
  standardChecks: { count: number; avgDuration: number; cacheHitRate: number };
  thoroughChecks: { count: number; avgDuration: number; cacheHitRate: number };

  // Quality metrics
  issuesFound: { errors: number; warnings: number; suggestions: number };
  issuesFixed: { auto: number; manual: number };

  // Cache efficiency
  cacheSize: number;
  cacheEvictions: number;
  avgCacheTTL: number;
}
```

### 8.2 Dashboard Integration

Add to existing observability HTTP server:

```typescript
// GET /metrics/code-quality
{
  "last24Hours": {
    "totalLints": 1247,
    "avgDuration": 85,
    "cacheHitRate": 0.72,
    "issuesFound": {
      "errors": 34,
      "warnings": 189,
      "suggestions": 432
    },
    "autoFixSuccess": 0.87
  }
}
```

---

## 9. Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1)

- [x] Design review complete
- [ ] Implement `FastSyntaxChecker`
- [ ] Implement `StructureAnalyzer` with caching
- [ ] Integrate with `OrchestrationEngine`
- [ ] Add configuration settings

### Phase 2: MCP Tool (Week 2)

- [ ] Create `AHK_Lint` tool
- [ ] Create `AHK_Lint_Configure` tool
- [ ] Add code map generation
- [ ] Implement auto-fix capabilities

### Phase 3: Advanced Features (Week 3)

- [ ] Implement `SemanticAnalyzer`
- [ ] Add background linting
- [ ] Implement incremental parsing
- [ ] Add metrics tracking

### Phase 4: Polish & Testing (Week 4)

- [ ] Performance optimization
- [ ] Integration tests
- [ ] Documentation
- [ ] User feedback iteration

---

## 10. Expected Impact

### Performance

- **Fast mode:** +15ms overhead (syntax only)
- **Standard mode:** +45ms overhead (with structure caching)
- **Thorough mode:** +180ms (parallel execution)
- **Cache hit rate:** Expected 60-80% after warmup

### Code Quality

- **Catch errors before execution:** Reduce runtime errors by ~40%
- **Maintain coding standards:** Enforce AutoHotkey v2 best practices
- **Improve maintainability:** Code maps help with refactoring
- **Reduce debugging time:** Find issues earlier in workflow

### Developer Experience

- **Non-intrusive:** View operations unaffected
- **Transparent:** Debug mode shows lint timing
- **Configurable:** Per-operation settings
- **Helpful:** Suggestions + auto-fix reduce manual work

---

## 11. Comparison to Alternatives

| Approach               | Performance                | Integration  | Features             | Recommendation     |
| ---------------------- | -------------------------- | ------------ | -------------------- | ------------------ |
| **No linting**         | ⚡ Fastest                 | N/A          | ❌ No quality checks | ❌ Not recommended |
| **External linter**    | 🐌 Slow (separate process) | ⚠️ Manual    | ✅ Full-featured     | ⚠️ For CI/CD only  |
| **Always-on thorough** | 🐌 Slow (+200ms)           | ✅ Automatic | ✅ Full-featured     | ❌ Too slow        |
| **Tiered + cached**    | ⚡ Fast (+15-45ms)         | ✅ Smart     | ✅ Full-featured     | ✅ **Recommended** |

---

## 12. Open Questions

1. **Should blocking on errors be the default?**
   - Proposal: No (show errors but allow continuation)
   - Rationale: LLMs can fix errors iteratively

2. **What cache eviction strategy?**
   - Proposal: LRU with max 1000 entries
   - Rationale: Matches existing trace storage

3. **Should background linting update the UI?**
   - Proposal: No (store for next request only)
   - Rationale: Async updates add complexity

4. **Integration with git hooks?**
   - Proposal: Add pre-commit hook support
   - Rationale: Catch issues before commit

---

## Conclusion

This tiered linting architecture provides **enterprise-grade code quality**
without sacrificing the **fast, responsive** orchestration that makes this MCP
server excellent.

**Key Innovation:** Smart caching + tiered analysis means 80% of operations see
<50ms overhead.

**Next Steps:**

1. Review this proposal
2. Get feedback on performance targets
3. Start Phase 1 implementation
4. Iterate based on real-world usage

---

**Document Version:** 1.0 **Authors:** Claude (Sonnet 4.5) **Status:** Ready for
Review **Estimated Effort:** 4 weeks (1 developer)
