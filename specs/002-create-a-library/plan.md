# Implementation Plan: AutoHotkey Library Management System

**Branch**: `002-create-a-library` | **Date**: 2025-10-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-create-a-library/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

The AutoHotkey Library Management System creates a centralized catalog for discovering, documenting, and importing reusable AHK v2 script libraries from the scripts/ folder. The system scans library files (UIA.ahk, UIA_Browser.ahk, Classes.ahk, etc.), extracts metadata (classes, functions, dependencies), builds a dependency graph, and exposes this through MCP tools. Developers can discover libraries, view documentation, check version compatibility, and generate correct #Include statements automatically, reducing manual library management overhead.

## Technical Context

**Language/Version**: TypeScript 5.3.3 with ES2020 target, NodeNext modules (MCP server); AutoHotkey v2 (library files)
**Primary Dependencies**:
- `@modelcontextprotocol/sdk` ^0.5.0 (MCP protocol)
- `zod` ^3.22.4 (schema validation)
- Node.js `fs.promises` (file system scanning)
- Existing AHK_Analyze tool (code structure extraction)

**Storage**:
- In-memory catalog cache (Map-based, session-scoped)
- Optional JSON manifest files (library metadata)
- File system (scripts/ folder contains libraries)

**Testing**: Node.js native test runner or similar for TypeScript; AHK test scripts for library validation

**Target Platform**: Node.js server (Windows/Linux/macOS via WSL)

**Project Type**: Single TypeScript project (MCP server with library scanning capability)

**Performance Goals**:
- Catalog scan time: <2 seconds for all libraries in scripts/ folder
- Library search/filter: <100ms
- Dependency resolution: <500ms for complex graphs
- Metadata extraction: <1 second per library file

**Constraints**:
- Must work with existing scripts/ folder structure
- No external library downloads (local files only)
- Must integrate with existing AHK_Analyze tool
- Version info optional (handle unversioned libraries)
- Must support both manifest-based and source-based metadata extraction

**Scale/Scope**:
- Initial set: 5 libraries (UIA, UIA_Browser, Classes, ClipboardHistory, ToolTipEx)
- Expected maximum: 20-30 libraries in scripts/ folder
- Library file sizes: 100-10,000 lines typical
- Dependency depth: 1-3 levels typical

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution Status**: No project-specific constitution defined (template only)

**Default Architectural Principles Applied**:
- ✅ **Modularity**: Library catalog as standalone component
- ✅ **Reusability**: MCP tools expose library discovery to all clients
- ✅ **Simplicity**: File-system scanning with in-memory cache
- ✅ **Backward Compatibility**: No changes to existing scripts/ folder structure
- ✅ **Testability**: Clear separation between scanning, analysis, and catalog management

**No Constitutional Violations Detected**

The library management system adds new MCP tools without modifying existing infrastructure. It follows standard software engineering practices for metadata extraction and dependency management.

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
scripts/                     # Library files (existing)
├── UIA.ahk                 # UI Automation library
├── UIA_Browser.ahk         # Browser automation (depends on UIA)
├── Classes.ahk             # Utility classes (Cmd, Beep, etc.)
├── ClipboardHistory.ahk    # Clipboard management
└── ToolTipEx.ahk           # Enhanced tooltips

src/
├── core/
│   ├── library-catalog.ts       # Central catalog manager (NEW)
│   ├── library-scanner.ts       # File system scanning (NEW)
│   ├── dependency-resolver.ts   # Dependency graph builder (NEW)
│   └── version-manager.ts       # Semantic versioning logic (NEW)
├── tools/
│   ├── ahk-library-list.ts      # MCP tool: List libraries (NEW)
│   ├── ahk-library-info.ts      # MCP tool: Library details (NEW)
│   ├── ahk-library-import.ts    # MCP tool: Generate imports (NEW)
│   └── ahk-analyze-code.ts      # Existing analysis tool (reuse)
├── types/
│   └── library-types.ts         # TypeScript interfaces (NEW)
└── server.ts                    # Tool registration (modify)

tests/
├── unit/
│   ├── library-catalog.test.ts
│   ├── dependency-resolver.test.ts
│   └── version-manager.test.ts
└── integration/
    └── library-workflow.test.ts
```

**Structure Decision**: Single TypeScript project (Option 1)

This MCP server adds library management capabilities by:
- Creating new catalog/scanner/resolver modules in `src/core/`
- Adding new MCP tools in `src/tools/`
- Reusing existing AHK_Analyze tool for metadata extraction
- Storing library files in existing `scripts/` folder (no changes)

All new code follows existing project structure and patterns.

## Phase 0: Outline & Research

✅ **COMPLETED** - See [research.md](./research.md)

### Key Research Findings

1. **Library Scanning**: Node.js async fs.readdir for .ahk files
   - Fast, simple, cross-platform
   - No external dependencies

2. **Metadata Extraction**: Reuse AHK_Analyze + custom parsers
   - Classes/functions from existing tool
   - Dependencies from #Include directives
   - Version from `static Version :=` pattern
   - Documentation from JSDoc comments

3. **Dependency Resolution**: DAG with DFS cycle detection
   - Build graph from #Include directives
   - Topological sort for import order
   - Clear error messages for cycles

4. **Version Management**: Semantic versioning (optional)
   - Parse MAJOR.MINOR.PATCH from UIA_Browser pattern
   - Handle unversioned libraries gracefully
   - Check MAJOR version compatibility

5. **Catalog Management**: In-memory Map with lazy init
   - O(1) lookup by library name
   - Session-scoped (cleared on restart)
   - Search by name or description

6. **MCP Tools**: 3 focused tools
   - AHK_Library_List (search/filter)
   - AHK_Library_Info (detailed docs)
   - AHK_Library_Import (generate #Includes)

7. **Documentation**: JSDoc + plain comment fallback
   - Extract @class, @description, @example tags
   - Fall back to block comments if no JSDoc
   - Generate basic docs from code structure

**Output**: ✅ research.md with 7 architecture decisions documented

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 1: Design & Contracts

✅ **COMPLETED** (Summary - full artifacts require `/tasks` command for implementation)

Phase 1 design decisions documented in research.md. Key data models defined:
- LibraryMetadata (name, version, dependencies, classes, functions, docs)
- DependencyGraph (adjacency list, cycle detection)
- LibraryCatalog (Map-based storage, search/filter)
- MCP tool contracts (List, Info, Import with Zod schemas)

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

### Task Generation Strategy

The `/tasks` command will create tasks.md based on:

1. **Core Modules** (from research.md architecture decisions)
   - Library scanner (fs.readdir wrapper)
   - Metadata extractor (AHK_Analyze integration + custom parsers)
   - Dependency resolver (DAG builder with DFS)
   - Version manager (semver parser + compatibility checker)
   - Library catalog (Map-based store with search)

2. **MCP Tools** (from spec FR-026 to FR-028)
   - AHK_Library_List tool (search/filter libraries)
   - AHK_Library_Info tool (detailed documentation)
   - AHK_Library_Import tool (generate #Include statements)

3. **Test Coverage** (from quickstart scenarios)
   - Unit tests for each core module
   - Integration tests for end-to-end workflows
   - Performance tests (catalog scan <2s, search <100ms)

### Ordering Strategy

**Phase A: Foundation** (Core modules first)
1. Create TypeScript interfaces (library-types.ts)
2. Implement library scanner
3. Implement metadata extractor
4. Implement dependency resolver
5. Implement library catalog

**Phase B: MCP Tools** (Depends on Phase A)
6. Implement AHK_Library_List
7. Implement AHK_Library_Info
8. Implement AHK_Library_Import

**Phase C: Testing** (Can run in parallel with B)
9. Unit tests for scanner, extractor, resolver
10. Integration tests for full workflows
11. Performance benchmarks

**Phase D: Documentation**
12. Update CLAUDE.md with library management context
13. Create usage examples
14. Document library manifest format

### Estimated Task Count

- **Core**: 6-8 tasks (types, scanner, extractor, resolver, version, catalog)
- **MCP Tools**: 3 tasks (one per tool)
- **Tests**: 4-6 tasks (unit, integration, performance)
- **Docs**: 2-3 tasks (agent context, examples, guides)

**Total**: 15-20 tasks in dependency order

### Task Execution Notes

- Scanner and types can be built in parallel `[P]`
- MCP tools depend on catalog being complete
- Tests can be written after each module `[P]`
- Use existing AHK_Analyze as-is (no modifications needed)

**IMPORTANT**: This phase is executed by the `/tasks` command, NOT by `/plan`

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [ ] Phase 3: Tasks generated (/tasks command) - **READY TO EXECUTE**
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅ (none found)
- [x] Complexity deviations documented: N/A (no deviations) ✅

**Artifacts Generated**:
- [x] research.md (7 architecture decisions)
- [x] Technical Context filled
- [x] Project Structure defined
- [x] Phase 2 task planning approach documented

---

**Status**: Planning Complete ✅

**Next Command**: Run `/tasks` to generate implementation tasks

*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
