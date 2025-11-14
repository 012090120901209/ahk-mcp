# Implementation Plan: Smart File Operation Orchestrator

**Branch**: `001-smart-file-orchestrator` | **Date**: 2025-10-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-smart-file-orchestrator/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ LOADED: spec.md exists and is well-defined
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ Project Type: Single TypeScript MCP server
   → ✅ Structure Decision: Option 1 (single project)
3. Fill the Constitution Check section
   → ⚠️  Constitution template not yet customized for this project
   → ✅ Proceeding with standard MCP tool patterns
4. Evaluate Constitution Check section
   → ✅ No violations (following existing tool patterns)
   → ✅ Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → ✅ No NEEDS CLARIFICATION in spec
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
7. Re-evaluate Constitution Check section
   → ✅ Design follows MCP patterns
   → ✅ Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach
9. ✅ STOP - Ready for /tasks command
```

## Summary

**Primary Requirement**: Create a smart orchestration tool that automatically chains file operations (detect → analyze → read → edit) to reduce redundant MCP tool calls from 7-10 down to 3-4.

**Technical Approach**: Build a new MCP tool `AHK_Smart_Orchestrator` that:
1. Accepts high-level user intent (e.g., "edit class X in file Y")
2. Maintains session context with cached analysis results
3. Intelligently routes to existing tools (AHK_File_Detect, AHK_Analyze, AHK_File_View, AHK_File_Edit_Advanced)
4. Returns structured guidance for the next steps

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 18+)
**Primary Dependencies**:
- @modelcontextprotocol/sdk ^0.5.0
- zod (for schema validation)
- Existing AHK MCP tools (detect, analyze, view, edit)

**Storage**: In-memory session context cache (Map-based)
**Testing**: Node.js test runner, integration tests with MCP protocol
**Target Platform**: Cross-platform (Windows, Linux, macOS via WSL)
**Project Type**: Single TypeScript project (MCP server)
**Performance Goals**:
- < 2 seconds for analyze + read operations
- 60% reduction in tool calls (from 7-10 to ≤4)
- 80% reduction for cached operations (≤2 calls)

**Constraints**:
- Must work with existing MCP protocol and tools
- Cannot break existing tool APIs
- Must maintain backward compatibility
- Cache must be session-scoped (not persistent)

**Scale/Scope**:
- Support files up to 10,000 lines
- Cache up to 10 analyzed files per session
- Handle 100+ orchestration requests per session

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: Project constitution is not yet customized. Following standard MCP server patterns:

✅ **Tool Encapsulation**: Each tool is self-contained with clear purpose
✅ **Type Safety**: Zod schemas for all input validation
✅ **Error Handling**: Comprehensive error messages and fallbacks
✅ **Observability**: Structured logging for debugging
✅ **Stateless Tools**: No persistent state across MCP sessions (only in-memory cache)
✅ **Backward Compatibility**: No breaking changes to existing tools

## Project Structure

### Documentation (this feature)
```
specs/001-smart-file-orchestrator/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── core/
│   ├── active-file.ts            # Existing: Active file tracking
│   ├── tool-settings.ts          # Existing: Tool configuration
│   ├── smart-context.ts          # NEW: Session context cache
│   └── orchestration-engine.ts   # NEW: Orchestration logic
├── tools/
│   ├── ahk-file-detect.ts        # Existing: File detection
│   ├── ahk-analyze-code.ts       # Existing: Code analysis
│   ├── ahk-file-view.ts          # Existing: File viewing
│   ├── ahk-file-edit-advanced.ts # Existing: File editing
│   └── ahk-smart-orchestrator.ts # NEW: Smart orchestration tool
└── server.ts                      # MODIFY: Register new tool

tests/
├── integration/
│   ├── orchestrator-workflow.test.ts  # NEW: End-to-end orchestration
│   └── cache-behavior.test.ts         # NEW: Cache staleness tests
└── unit/
    ├── smart-context.test.ts          # NEW: Context cache tests
    └── orchestration-engine.test.ts   # NEW: Engine logic tests
```

**Structure Decision**: Single project structure (Option 1) - This is a TypeScript MCP server with a standard `src/` and `tests/` layout following the existing ahk-mcp project structure.

## Phase 0: Outline & Research

### Research Tasks

No NEEDS CLARIFICATION markers in the spec, but let's research best practices for the technical approach:

1. **MCP Tool Orchestration Patterns**
   - Decision: Use the "coordinator pattern" where one tool delegates to others
   - Rationale: MCP tools are stateless; coordinator maintains context
   - Alternatives considered:
     * Client-side orchestration (rejected: increases Claude's workload)
     * Server-side state machine (rejected: violates MCP stateless principle for tools)

2. **Session Context Management**
   - Decision: In-memory Map with file path as key, analysis results as value
   - Rationale: Fast lookups, automatic cleanup on process restart
   - Alternatives considered:
     * Persistent cache (rejected: staleness issues, file system overhead)
     * LRU cache with size limits (considered for future: current scope manageable)

3. **Cache Invalidation Strategy**
   - Decision: Timestamp-based staleness detection (compare file mtime)
   - Rationale: Detects external file modifications between tool calls
   - Alternatives considered:
     * Content hashing (rejected: expensive for large files)
     * No invalidation (rejected: user confusion from stale data)

4. **Existing Tool Integration**
   - Decision: Import tool classes directly and call execute() methods
   - Rationale: Reuses existing logic, maintains single source of truth
   - Alternatives considered:
     * Duplicate logic (rejected: maintenance nightmare)
     * Sub-process tool calls (rejected: performance overhead)

5. **Error Recovery Patterns**
   - Decision: Graceful degradation with manual override options
   - Rationale: If auto-detection fails, fall back to manual paths/ranges
   - Alternatives considered:
     * Fail-fast (rejected: poor UX)
     * Silent fallback (rejected: user confusion)

**Output**: research.md created below

---

## Phase 1: Design & Contracts

### Data Model (`data-model.md`)

**Entity 1: OrchestrationContext**
- Purpose: Maintains session state for a file being worked on
- Fields:
  * `filePath: string` - Absolute path to the AHK file
  * `analysisResult: FileAnalysisResult | null` - Cached analysis
  * `analysisTimestamp: number` - When analysis was performed
  * `fileModifiedTime: number` - File's last modification time at analysis
  * `operationHistory: OperationRecord[]` - Recent operations on this file
- Relationships: One context per file path
- Validation: filePath must be absolute and end with `.ahk`
- State transitions: null → analyzed → stale (on file modification)

**Entity 2: FileAnalysisResult**
- Purpose: Structured representation of AHK file structure
- Fields:
  * `filePath: string` - File that was analyzed
  * `classes: ClassInfo[]` - All classes found
  * `functions: FunctionInfo[]` - Standalone functions
  * `hotkeys: HotkeyInfo[]` - Hotkey definitions
  * `globalLines: LineRange` - Global scope line numbers
- Relationships: Owned by OrchestrationContext
- Validation: Line numbers must be positive, ranges must be valid
- State: Immutable once created

**Entity 3: OrchestrationRequest**
- Purpose: User's high-level intent for file operation
- Fields:
  * `intent: string` - User's natural language description
  * `targetFile?: string` - Optional direct file path
  * `targetEntity?: string` - Class/method/function name
  * `operation: 'view' | 'edit' | 'analyze'` - Operation type
- Relationships: Input to orchestration engine
- Validation: Must have either intent or targetEntity
- Processing: Parsed by orchestration engine

**Entity 4: OrchestrationResult**
- Purpose: Output of orchestration with guidance for next steps
- Fields:
  * `toolCallsMade: number` - How many tools were invoked
  * `cacheHit: boolean` - Whether cached data was used
  * `nextSteps: string[]` - Recommended actions for user
  * `context: string` - Relevant code/data for user
  * `errors?: string[]` - Any issues encountered
- Relationships: Output from orchestration engine
- Validation: Must have at least one nextStep if successful

### API Contracts (`contracts/`)

**Contract: AHK_Smart_Orchestrator Tool**

```json
{
  "tool": "AHK_Smart_Orchestrator",
  "description": "Intelligently orchestrates file detection, analysis, and viewing operations to minimize redundant tool calls",
  "inputSchema": {
    "type": "object",
    "properties": {
      "intent": {
        "type": "string",
        "description": "High-level description of what you want to do (e.g., 'edit the _Dark class checkbox methods')"
      },
      "filePath": {
        "type": "string",
        "description": "Optional: Direct path to AHK file (skips detection if provided)"
      },
      "targetEntity": {
        "type": "string",
        "description": "Optional: Specific class, method, or function name to focus on"
      },
      "operation": {
        "type": "string",
        "enum": ["view", "edit", "analyze"],
        "default": "view",
        "description": "Type of operation to perform"
      },
      "forceRefresh": {
        "type": "boolean",
        "default": false,
        "description": "Force re-analysis even if cached data exists"
      }
    },
    "required": ["intent"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "content": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "type": {
              "const": "text"
            },
            "text": {
              "type": "string",
              "description": "Formatted output with code snippets, guidance, and context"
            }
          }
        }
      },
      "isError": {
        "type": "boolean",
        "description": "Whether the operation encountered errors"
      }
    }
  }
}
```

**Contract: Smart Context Cache API (internal)**

```typescript
interface SmartContextCache {
  get(filePath: string): OrchestrationContext | null;
  set(filePath: string, context: OrchestrationContext): void;
  isStale(filePath: string): boolean;
  invalidate(filePath: string): void;
  clear(): void;
  stats(): { size: number; hitRate: number };
}
```

### Test Scenarios (from user stories)

**Scenario 1: First-time file operation**
```typescript
// Given: User wants to edit a specific class
// When: AHK_Smart_Orchestrator is called with intent
// Then:
//   - File detected (1 call)
//   - Analysis performed (1 call)
//   - Relevant section read (1 call)
//   - Ready for edit (0 calls, just guidance)
//   - Total: 3 tool calls
```

**Scenario 2: Subsequent operation on same file**
```typescript
// Given: File was recently analyzed (context cached)
// When: Second orchestration request for same file
// Then:
//   - Detection skipped (cache hit)
//   - Analysis skipped (cache hit)
//   - Read operation (1 call)
//   - Ready for edit (0 calls, just guidance)
//   - Total: 1 tool call
```

**Scenario 3: File modified externally**
```typescript
// Given: File was analyzed, then modified by external editor
// When: Orchestrator checks cache
// Then:
//   - Detect staleness (mtime changed)
//   - Re-run analysis (1 call)
//   - Proceed with fresh data
//   - Total: 2 tool calls (detect skipped if path known)
```

**Scenario 4: User provides direct path**
```typescript
// Given: User provides absolute file path
// When: Orchestrator is called
// Then:
//   - Detection skipped (path provided)
//   - Analysis performed or cache checked (1 call if miss)
//   - Read operation (1 call)
//   - Total: 2 tool calls
```

### Quickstart Test (`quickstart.md`)

See separate file generated below.

### Agent Context Update

Will be executed after all Phase 1 artifacts are complete.

---

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. **Load** `.specify/templates/tasks-template.md` as base
2. **Generate implementation tasks** from Phase 1 design:
   - Create `smart-context.ts` (session cache implementation)
   - Create `orchestration-engine.ts` (core logic)
   - Create `ahk-smart-orchestrator.ts` (MCP tool wrapper)
   - Update `server.ts` (register new tool)
3. **Generate test tasks** for each contract:
   - Unit tests for `SmartContextCache` API
   - Unit tests for orchestration engine logic
   - Integration tests for end-to-end workflows
   - Cache staleness detection tests
4. **Generate documentation tasks**:
   - Update main README with new tool
   - Create examples in docs/
   - Update CLAUDE.md with usage patterns

**Ordering Strategy**:
1. [P] Create data structures (`smart-context.ts`)
2. [P] Write unit tests for context cache
3. Implement orchestration engine core logic
4. [P] Write unit tests for engine
5. Create MCP tool wrapper
6. [P] Write integration tests
7. Register tool in server
8. Run all tests
9. Update documentation
10. Manual validation with Claude Code

**Estimated Output**: 15-20 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

---

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following TDD principles)
**Phase 5**: Validation (run tests, test with Claude Code, performance validation)

---

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

No constitutional violations identified. Design follows existing MCP tool patterns and maintains backward compatibility.

---

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (none existed)
- [x] Complexity deviations documented (none exist)

---
*Plan generated by GitHub Spec Kit workflow - Ready for /tasks command*
