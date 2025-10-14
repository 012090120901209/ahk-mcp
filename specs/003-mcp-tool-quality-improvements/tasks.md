# Tasks: MCP Tool Quality Improvements

**Input**: Design documents from `/specs/003-mcp-tool-quality-improvements/`
**Prerequisites**: plan.md ✅, quickstart.md ✅, contracts/ ✅ (3 files)

## Execution Flow (main)
```
1. Loaded plan.md ✅
   → Tech stack: TypeScript 5.x, Node.js 18+, Zod validation
   → Structure: Single project (src/, tests/)
2. Loaded design documents ✅
   → contracts/: 3 schema files
   → quickstart.md: 4 test scenarios
   → No data-model.md (not needed for tool improvements)
3. Generated tasks by category ✅
   → Setup: 3 tasks
   → Tests: 7 contract/integration tests [P]
   → Core: 3 utility implementations [P]
   → Implementation: 8 tool updates
   → Polish: 5 tasks (docs, validation)
4. Applied task rules ✅
   → Different files = [P] (parallel)
   → Same file = sequential
   → Tests before implementation (TDD)
5. Numbered tasks T001-T026
6. Created dependency graph
7. Generated parallel execution examples
8. Validated completeness ✅
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All paths are relative to repository root

---

## Phase 3.1: Setup & Infrastructure

### T001: Create new utility directories
**Path**: `src/utils/`, `src/core/`
**Action**: Create directories if they don't exist
```bash
mkdir -p src/utils
# Verify src/core exists (should already exist)
```

### T002: Install or verify TypeScript testing dependencies
**Path**: `package.json`
**Action**: Ensure Jest or Node test runner is configured
```bash
# If using Jest:
npm install --save-dev jest @types/jest ts-jest

# If using Node native:
# Already included in Node 18+
```

### T003 [P]: Set up test fixtures for quality improvements
**Path**: `tests/fixtures/test-quality-improvements.ahk`
**Action**: Create test AHK file for quickstart scenarios
```ahk
#Requires AutoHotkey v2.0
; Test file for MCP Tool Quality Improvements

class TestClass {
    __New() {
        this.oldText := "original value"
        this.DarkMode := true
    }

    TestMethod() {
        return "testValue"
    }
}
```

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### T004 [P]: Contract test for parameter aliases (content → newContent)
**Path**: `tests/contract/parameter-aliases.test.ts`
**Purpose**: Verify backward compatibility for deprecated `content` parameter
```typescript
describe('AHK_File_Edit parameter aliasing', () => {
  it('should accept deprecated "content" parameter', async () => {
    const result = await editTool.execute({
      action: 'replace',
      search: 'old',
      content: 'new'  // Old name
    });
    expect(result.isError).toBe(false);
  });

  it('should prefer "newContent" over "content" when both provided', async () => {
    const result = await editTool.execute({
      action: 'replace',
      search: 'old',
      content: 'WRONG',
      newContent: 'CORRECT'
    });
    expect(result.content[0].text).toContain('CORRECT');
  });

  it('should show deprecation warning for "content"', async () => {
    const result = await editTool.execute({
      action: 'replace',
      search: 'old',
      content: 'new'
    });
    expect(result.content[0].text).toMatch(/deprecated/i);
  });
});
```

### T005 [P]: Contract test for dry-run output format
**Path**: `tests/contract/dry-run-output.test.ts`
**Purpose**: Validate dry-run preview format matches schema
```typescript
describe('Dry-run preview format', () => {
  it('should show summary without modifying file', async () => {
    const result = await editTool.execute({
      action: 'replace',
      search: 'foo',
      newContent: 'bar',
      all: true,
      dryRun: true
    });

    expect(result.content[0].text).toMatch(/DRY RUN/);
    expect(result.content[0].text).toMatch(/Would replace \d+ occurrences/);
    expect(result.content[0].text).toMatch(/No changes made/);

    // Verify file was NOT modified
    const fileContent = await fs.readFile(testFile, 'utf-8');
    expect(fileContent).toContain('foo'); // Original text still there
  });

  it('should show first 3 sample diffs', async () => {
    // Test file has 10 occurrences
    const result = await editTool.execute({
      action: 'replace',
      search: 'test',
      newContent: 'TEST',
      all: true,
      dryRun: true
    });

    const samples = result.content[0].text.match(/Line \d+:/g);
    expect(samples.length).toBeLessThanOrEqual(3);
  });
});
```

### T006 [P]: Contract test for debug mode output structure
**Path**: `tests/contract/debug-output.test.ts`
**Purpose**: Verify debug output includes orchestration decisions
```typescript
describe('Debug mode output', () => {
  it('should include debug section when debugMode=true', async () => {
    const result = await orchestrator.execute({
      intent: 'view class',
      filePath: 'test.ahk',
      debugMode: true
    });

    const debugSection = result.content.find(c =>
      c.text.includes('🔍 DEBUG:')
    );
    expect(debugSection).toBeDefined();
    expect(debugSection.text).toMatch(/Tool: AHK_\w+/);
    expect(debugSection.text).toMatch(/Reason:/);
    expect(debugSection.text).toMatch(/Duration: \d+ms/);
  });

  it('should NOT include debug output when debugMode=false', async () => {
    const result = await orchestrator.execute({
      intent: 'view class',
      debugMode: false
    });

    expect(result.content.every(c =>
      !c.text.includes('🔍 DEBUG:')
    )).toBe(true);
  });

  it('should truncate debug output at 5000 chars', async () => {
    // Test with operation that generates verbose debug
    const result = await orchestrator.execute({
      intent: 'complex operation with many tool calls',
      debugMode: true
    });

    const debugSection = result.content.find(c =>
      c.text.includes('🔍 DEBUG:')
    );

    if (debugSection.text.length > 5000) {
      expect(debugSection.text).toContain('truncated');
    }
  });
});
```

### T007 [P]: Integration test for edit dry-run workflow
**Path**: `tests/integration/edit-dryrun.test.ts`
**Purpose**: End-to-end dry-run → actual edit workflow
```typescript
describe('Dry-run workflow integration', () => {
  it('should preview then execute batch replacement', async () => {
    // Step 1: Preview with dry-run
    const preview = await editTool.execute({
      action: 'replace',
      search: 'oldValue',
      newContent: 'newValue',
      all: true,
      dryRun: true,
      filePath: 'test.ahk'
    });

    expect(preview.content[0].text).toMatch(/DRY RUN/);
    const matchCount = preview.content[0].text.match(/(\d+) occurrences/);
    const expectedChanges = parseInt(matchCount[1]);

    // Step 2: Execute actual edit
    const actual = await editTool.execute({
      action: 'replace',
      search: 'oldValue',
      newContent: 'newValue',
      all: true,
      dryRun: false,
      filePath: 'test.ahk'
    });

    expect(actual.content[0].text).not.toMatch(/DRY RUN/);
    expect(actual.content[0].text).toContain('Edit Successful');

    // Step 3: Verify changes
    const fileContent = await fs.readFile('test.ahk', 'utf-8');
    const actualChanges = (fileContent.match(/newValue/g) || []).length;
    expect(actualChanges).toBe(expectedChanges);
  });
});
```

### T008 [P]: Integration test for orchestrator debug mode
**Path**: `tests/integration/orchestrator-debug.test.ts`
**Purpose**: Verify debug mode shows all orchestration decisions
```typescript
describe('Orchestrator debug mode integration', () => {
  it('should log all tool calls with reasons', async () => {
    const result = await orchestrator.execute({
      intent: 'edit the ColorCheckbox method',
      debugMode: true
    });

    const debugText = result.content.find(c =>
      c.text.includes('🔍 DEBUG:')
    ).text;

    // Should show file detection (or skip if path provided)
    // Should show analysis
    expect(debugText).toMatch(/Tool: AHK_Analyze/);
    expect(debugText).toMatch(/Reason: Cache (HIT|MISS)/);

    // Should show file view
    expect(debugText).toMatch(/Tool: AHK_File_View/);
    expect(debugText).toMatch(/Lines: \d+-\d+/);

    // Should show timing
    expect(debugText).toMatch(/Duration: \d+ms/);
    expect(debugText).toMatch(/Total: \d+ tool calls/);
  });
});
```

### T009 [P]: Integration test for backward compatibility
**Path**: `tests/integration/backward-compat.test.ts`
**Purpose**: Ensure existing tool consumers aren't broken
```typescript
describe('Backward compatibility', () => {
  it('should accept all old parameter formats', async () => {
    // Old format with 'content'
    const oldFormat = await editTool.execute({
      action: 'replace',
      search: 'a',
      content: 'b'
    });
    expect(oldFormat.isError).toBe(false);
  });

  it('should work without new optional parameters', async () => {
    // Call without debugMode, dryRun (should use defaults)
    const result = await orchestrator.execute({
      intent: 'view class'
    });
    expect(result.isError).toBe(false);
  });

  it('should maintain JSON output structure', async () => {
    const result = await editTool.execute({
      action: 'replace',
      search: 'x',
      newContent: 'y',
      dryRun: true
    });

    // Verify MCP protocol structure
    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type');
    expect(result.content[0]).toHaveProperty('text');
  });
});
```

### T010: Verify all contract tests fail
**Purpose**: Confirm we're in RED phase before implementation
**Action**: Run all contract tests and verify they fail
```bash
npm test -- tests/contract/
# Expected: All tests should FAIL (not yet implemented)
```

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### T011 [P]: Implement parameter alias utility
**Path**: `src/core/parameter-aliases.ts`
**Purpose**: Handle content → newContent aliasing for all edit tools
```typescript
export function resolveContentParameter(args: any): string | undefined {
  // Priority: newContent > content
  if (args.newContent !== undefined) {
    return args.newContent;
  }

  if (args.content !== undefined) {
    // Log deprecation warning
    logger.warn('Parameter "content" is deprecated. Use "newContent" instead.');
    return args.content;
  }

  return undefined;
}

export function addDeprecationWarning(result: any, usedDeprecated: string[]): any {
  if (usedDeprecated.length === 0) return result;

  const warning = `⚠️ Deprecated parameter(s): ${usedDeprecated.join(', ')}. ` +
    `Please update to new parameter names.`;

  // Prepend warning to first text content
  if (result.content?.[0]?.text) {
    result.content[0].text = warning + '\n\n' + result.content[0].text;
  }

  return result;
}
```

### T012 [P]: Implement debug formatter utility
**Path**: `src/utils/debug-formatter.ts`
**Purpose**: Format orchestration debug output with markers and truncation
```typescript
interface DebugEntry {
  timestamp: number;
  tool: string;
  reason: string;
  duration: number;
  cacheStatus?: 'HIT' | 'MISS' | 'N/A';
  metadata?: Record<string, any>;
}

export class DebugFormatter {
  private maxLength = 5000;
  private startTime: number;
  private entries: DebugEntry[] = [];

  constructor(startTime: number = Date.now()) {
    this.startTime = startTime;
  }

  addEntry(entry: Omit<DebugEntry, 'timestamp'>): void {
    this.entries.push({
      timestamp: Date.now(),
      ...entry
    });
  }

  format(): string {
    if (this.entries.length === 0) return '';

    let output = '\n---\n\n🔍 **DEBUG: Orchestration Log**\n\n';

    for (const entry of this.entries) {
      const elapsed = entry.timestamp - this.startTime;
      const timeStr = this.formatTime(elapsed);

      output += `  [${timeStr}] 🔧 Tool: ${entry.tool}\n`;
      output += `              Reason: ${entry.reason}\n`;

      if (entry.cacheStatus) {
        output += `              Cache: ${entry.cacheStatus}\n`;
      }

      if (entry.metadata) {
        for (const [key, value] of Object.entries(entry.metadata)) {
          output += `              ${key}: ${value}\n`;
        }
      }

      output += `              Duration: ${entry.duration}ms\n\n`;
    }

    // Add summary
    const totalDuration = Date.now() - this.startTime;
    output += `  ⏱️ Total: ${this.entries.length} tool calls in ${totalDuration}ms\n`;

    // Truncate if needed
    if (output.length > this.maxLength) {
      const truncated = output.slice(0, this.maxLength);
      const remaining = output.length - this.maxLength;
      output = truncated + `\n\n... (debug output truncated, ${remaining} chars hidden)`;
    }

    return output;
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const millis = ms % 1000;
    return `${seconds.toString().padStart(2, '0')}:${millis.toString().padStart(3, '0')}`;
  }
}
```

### T013 [P]: Implement dry-run preview utility
**Path**: `src/utils/dry-run-preview.ts`
**Purpose**: Generate preview of file changes without modifying files
```typescript
interface DryRunSample {
  lineNumber: number;
  before: string;
  after: string;
}

interface DryRunPreview {
  summary: {
    filesAffected: number;
    totalChanges: number;
    operationType: string;
  };
  samples: DryRunSample[];
  warnings: string[];
}

export class DryRunPreviewGenerator {
  private maxSamples = 3;

  generatePreview(
    content: string,
    search: string,
    replacement: string,
    options: { regex?: boolean; all?: boolean }
  ): DryRunPreview {
    const lines = content.split('\n');
    const changes: DryRunSample[] = [];

    let changesFound = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let matched = false;

      if (options.regex) {
        matched = new RegExp(search).test(line);
      } else {
        matched = line.includes(search);
      }

      if (matched) {
        changesFound++;

        if (changes.length < this.maxSamples) {
          const before = line;
          const after = options.regex
            ? line.replace(new RegExp(search), replacement)
            : line.replace(search, replacement);

          changes.push({
            lineNumber: i + 1,
            before,
            after
          });
        }

        if (!options.all) break; // Only first match
      }
    }

    return {
      summary: {
        filesAffected: 1,
        totalChanges: changesFound,
        operationType: 'replace'
      },
      samples: changes,
      warnings: []
    };
  }

  formatPreview(preview: DryRunPreview, filePath: string): string {
    let output = '🔬 **DRY RUN - No changes made**\n\n';
    output += `📄 **File:** ${filePath}\n`;
    output += `⚙️ **Operation:** Replace ${preview.summary.totalChanges > 1 ? 'all occurrences' : 'first occurrence'}\n\n`;

    if (preview.samples.length > 0) {
      const showingText = preview.summary.totalChanges > preview.samples.length
        ? ` (showing first ${preview.samples.length} of ${preview.summary.totalChanges})`
        : '';

      output += `**Would change**${showingText}:\n`;

      for (let i = 0; i < preview.samples.length; i++) {
        const sample = preview.samples[i];
        output += `${i + 1}. Line ${sample.lineNumber}:  ${sample.before}  →  ${sample.after}\n`;
      }
    }

    output += `\n**Summary:**\n`;
    output += `- ${preview.summary.filesAffected} file affected\n`;
    output += `- ${preview.summary.totalChanges} occurrence(s) would be replaced\n`;

    output += `\n⚠️ **DRY RUN**: File was NOT modified`;

    return output;
  }
}
```

---

## Phase 3.4: Tool Updates (Apply new features to existing tools)

### T014: Update AHK_File_Edit with newContent and dryRun
**Path**: `src/tools/ahk-file-edit.ts`
**Action**:
1. Add `newContent` to Zod schema
2. Add `dryRun` to Zod schema
3. Use `resolveContentParameter()` for backward compat
4. Implement dry-run preview logic
5. Add deprecation warning for old parameter

**Key changes**:
```typescript
// Update schema
export const AhkEditArgsSchema = z.object({
  // ... existing fields
  newContent: z.string().optional().describe('Text to insert/replace'),
  content: z.string().optional().describe('DEPRECATED: Use newContent'),
  dryRun: z.boolean().optional().default(false),
});

// In execute():
const actualContent = resolveContentParameter(validatedArgs);
if (validatedArgs.dryRun) {
  const preview = previewGenerator.generatePreview(/*...*/);
  return { content: [{ type: 'text', text: preview.format() }] };
}
```

### T015: Update AHK_File_Edit_Advanced with newContent and dryRun
**Path**: `src/tools/ahk-file-edit-advanced.ts`
**Action**: Same changes as T014 (parameter aliasing + dry-run)

### T016: Update AHK_File_Edit_Small with newContent and dryRun
**Path**: `src/tools/ahk-file-edit-small.ts`
**Action**: Same changes as T014 (parameter aliasing + dry-run)

### T017: Update AHK_File_Edit_Diff with dryRun
**Path**: `src/tools/ahk-file-edit-diff.ts`
**Action**: Add dry-run preview for diff operations

### T018: Update AHK_Smart_Orchestrator with debugMode
**Path**: `src/tools/ahk-smart-orchestrator.ts`
**Action**:
1. Add `debugMode` to Zod schema
2. Pass debug flag to orchestration engine
3. Append debug output if enabled

**Key changes**:
```typescript
export const AhkSmartOrchestratorArgsSchema = z.object({
  // ... existing fields
  debugMode: z.boolean().optional().default(false),
});

// In execute():
const result = await this.engine.orchestrate(request, {
  debugMode: validatedArgs.debugMode
});

if (validatedArgs.debugMode && result.debugLog) {
  result.context += debugFormatter.format(result.debugLog);
}
```

### T019: Update orchestration-engine with debug logging
**Path**: `src/core/orchestration-engine.ts`
**Action**:
1. Add `DebugFormatter` instance when debug enabled
2. Log each tool call with reason and timing
3. Return debug output in result

**Key changes**:
```typescript
async orchestrate(request: OrchestrationRequest, options?: { debugMode?: boolean }): Promise<OrchestrationResult> {
  const debugFormatter = options?.debugMode ? new DebugFormatter() : null;

  // Before each tool call:
  const startTime = Date.now();
  const result = await tool.execute(/*...*/);
  const duration = Date.now() - startTime;

  if (debugFormatter) {
    debugFormatter.addEntry({
      tool: 'AHK_Analyze',
      reason: 'Cache MISS for file (first access)',
      duration,
      cacheStatus: 'MISS'
    });
  }

  // ... rest of orchestration

  return {
    // ... existing fields
    debugLog: debugFormatter?.format()
  };
}
```

### T020: Update tool descriptions with examples
**Path**: `src/tools/ahk-file-edit.ts` (and 4 other edit tools)
**Action**: Enhance `description` field in tool definition with:
- Common usage example
- Advanced example
- "What to avoid" section
- "See also" references

**Use `contracts/tool-description-standard.json` as reference**

### T021: Update orchestrator description with examples
**Path**: `src/tools/ahk-smart-orchestrator.ts`
**Action**: Enhance description with debug mode examples
**Use `contracts/orchestrator-schema.json` examples section**

---

## Phase 3.5: Polish & Documentation

### T022 [P]: Add unit tests for parameter-aliases utility
**Path**: `tests/unit/parameter-aliases.test.ts`
**Purpose**: Test edge cases for parameter resolution
```typescript
describe('resolveContentParameter', () => {
  it('should return newContent when both provided', () => {
    const result = resolveContentParameter({
      content: 'old',
      newContent: 'new'
    });
    expect(result).toBe('new');
  });

  it('should return undefined when neither provided', () => {
    const result = resolveContentParameter({});
    expect(result).toBeUndefined();
  });
});
```

### T023 [P]: Add unit tests for debug-formatter utility
**Path**: `tests/unit/debug-formatter.test.ts`
**Purpose**: Test formatting and truncation

### T024 [P]: Add unit tests for dry-run-preview utility
**Path**: `tests/unit/dry-run-preview.test.ts`
**Purpose**: Test preview generation logic

### T025: Run quickstart validation scenarios
**Path**: `specs/003-mcp-tool-quality-improvements/quickstart.md`
**Action**: Execute all 4 scenarios manually and verify outputs
1. Scenario 1: Parameter naming (3 tests)
2. Scenario 2: Debug mode (2 tests)
3. Scenario 3: Dry-run (3 tests)
4. Scenario 4: Enhanced descriptions (1 test)
5. End-to-end integration test

**Document results in quickstart.md (check off validation boxes)**

### T026: Update CLAUDE.md agent context
**Path**: `CLAUDE.md` (repository root)
**Action**: Run update script and add new context
```bash
.specify/scripts/bash/update-agent-context.sh claude
```

**Manually add**:
- Parameter naming: Use `newContent` for replacement text (backward compat with `content`)
- Debug mode: Set `debugMode: true` for orchestration visibility
- Dry-run: Set `dryRun: true` to preview destructive operations
- Tool descriptions now include usage examples

---

## Dependencies

### Sequential Dependencies
- **T001-T003** (Setup) → All other tasks
- **T010** (Verify RED) → **T011-T021** (Implementation)
- **T011-T013** (Utilities) → **T014-T021** (Tool updates use utilities)
- **T014-T021** (Implementation) → **T022-T026** (Polish)

### Parallel Opportunities
```
Phase 3.2 Tests (after T003):
  T004 + T005 + T006 [contract tests, different files]
  T007 + T008 + T009 [integration tests, different files]

Phase 3.3 Core (after T010):
  T011 + T012 + T013 [utilities, different files]

Phase 3.4 Tools (after T011-T013):
  T014 + T015 + T016 [edit tool variants]
  T017 alone (depends on T014-T016 patterns)
  T018 + T019 together (orchestrator + engine)
  T020 + T021 [descriptions, different files]

Phase 3.5 Polish (after T014-T021):
  T022 + T023 + T024 [unit tests, different files]
```

---

## Parallel Execution Examples

### Example 1: Contract Tests (T004-T006)
```bash
# Launch all contract tests in parallel:
npm test -- tests/contract/parameter-aliases.test.ts &
npm test -- tests/contract/dry-run-output.test.ts &
npm test -- tests/contract/debug-output.test.ts &
wait
```

### Example 2: Utility Implementations (T011-T013)
```typescript
// Task agent can work on these simultaneously:
Task: "Implement parameter alias utility in src/core/parameter-aliases.ts"
Task: "Implement debug formatter utility in src/utils/debug-formatter.ts"
Task: "Implement dry-run preview utility in src/utils/dry-run-preview.ts"
```

### Example 3: Edit Tool Updates (T014-T016)
```typescript
// Different edit tool files, can parallelize:
Task: "Update AHK_File_Edit with newContent and dryRun in src/tools/ahk-file-edit.ts"
Task: "Update AHK_File_Edit_Advanced with newContent and dryRun in src/tools/ahk-file-edit-advanced.ts"
Task: "Update AHK_File_Edit_Small with newContent and dryRun in src/tools/ahk-file-edit-small.ts"
```

---

## Progress Tracking

### Phase 3.1: Setup
- [ ] T001: Create utility directories
- [ ] T002: Verify test dependencies
- [ ] T003 [P]: Create test fixtures

### Phase 3.2: Tests First (RED Phase)
- [ ] T004 [P]: Contract test - parameter aliases
- [ ] T005 [P]: Contract test - dry-run output
- [ ] T006 [P]: Contract test - debug output
- [ ] T007 [P]: Integration test - dry-run workflow
- [ ] T008 [P]: Integration test - orchestrator debug
- [ ] T009 [P]: Integration test - backward compatibility
- [ ] T010: ✋ **GATE: Verify all tests FAIL**

### Phase 3.3: Core Implementation (GREEN Phase)
- [ ] T011 [P]: Parameter aliases utility
- [ ] T012 [P]: Debug formatter utility
- [ ] T013 [P]: Dry-run preview utility
- [ ] T014: Update AHK_File_Edit
- [ ] T015: Update AHK_File_Edit_Advanced
- [ ] T016: Update AHK_File_Edit_Small
- [ ] T017: Update AHK_File_Edit_Diff
- [ ] T018: Update AHK_Smart_Orchestrator
- [ ] T019: Update orchestration-engine
- [ ] T020: Enhance edit tool descriptions
- [ ] T021: Enhance orchestrator description

### Phase 3.5: Polish (REFACTOR Phase)
- [ ] T022 [P]: Unit tests - parameter-aliases
- [ ] T023 [P]: Unit tests - debug-formatter
- [ ] T024 [P]: Unit tests - dry-run-preview
- [ ] T025: Run quickstart validation
- [ ] T026: Update CLAUDE.md

---

## Validation Checklist

### Completeness
- [x] All contracts have corresponding tests (3 contracts → T004-T006)
- [x] All utilities have implementation tasks (3 utils → T011-T013)
- [x] All tests come before implementation (T004-T010 before T011-T021)
- [x] Parallel tasks are truly independent (marked [P])
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task

### TDD Compliance
- [x] Contract tests written first (T004-T009)
- [x] Explicit gate to verify RED phase (T010)
- [x] Implementation only after tests fail (T011-T021 after T010)
- [x] Unit tests for refactoring (T022-T024)

### Task Quality
- [x] Each task is specific and actionable
- [x] File paths are absolute/clear
- [x] Code examples provided where helpful
- [x] Dependencies clearly documented

---

## Notes

### Important Reminders
- **T010 is critical**: DO NOT proceed to implementation until tests are failing
- **Backward compatibility**: All changes must work with existing consumers
- **Performance**: Debug mode must add <10ms overhead
- **Documentation**: Update tool descriptions with examples (T020-T021)

### Common Pitfalls to Avoid
- ❌ Don't skip the RED phase (T010)
- ❌ Don't break backward compatibility (always test with old parameters)
- ❌ Don't forget to update all edit tool variants (4 files)
- ❌ Don't skip quickstart validation (T025)

### Success Criteria
All tasks complete when:
- All tests pass (GREEN phase)
- Quickstart scenarios validate successfully
- Tool descriptions include examples
- CLAUDE.md updated with new context
- No existing consumers broken

---

**Total Tasks**: 26
**Estimated Time**: 10-15 hours
**Parallel Opportunities**: 11 tasks can run in parallel
**Critical Path**: Setup → Tests (RED) → Core Utils → Tool Updates → Polish

**Ready for execution!** 🚀
