# Tasks: AutoHotkey Library Management System

**Input**: Design documents from `/specs/002-create-a-library/`
**Prerequisites**: plan.md ✅, research.md ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: TypeScript 5.3.3, @modelcontextprotocol/sdk, zod
   → Structure: Single TypeScript project (MCP server)
2. Load optional design documents ✅
   → research.md: 7 architecture decisions loaded
   → No contracts/ directory (MCP tools use inline Zod schemas)
   → No data-model.md needed (TypeScript interfaces in code)
3. Generate tasks by category ✅
   → Setup: TypeScript types, project structure
   → Core: Scanner, extractor, resolver, catalog
   → MCP Tools: List, Info, Import
   → Tests: Unit tests for each module
   → Polish: Documentation, examples
4. Apply task rules ✅
   → Different files = mark [P] for parallel
   → Tests before implementation where applicable
5. Number tasks sequentially (T001-T018) ✅
6. Generate dependency graph ✅
7. Validate task completeness ✅
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All paths relative to repository root

---

## Phase 3.1: Setup & Foundation

### T001: Create TypeScript type definitions
**File**: `src/types/library-types.ts`
**Description**: Create TypeScript interfaces for:
- `LibraryMetadata` (name, version, dependencies, classes, functions, documentation, globalVars)
- `ClassInfo`, `FunctionInfo`, `MethodInfo`, `PropertyInfo`
- `DependencyInfo` (source, target, versionConstraint, type)
- `SemanticVersion` (major, minor, patch)
- `DocumentationInfo` (description, examples, jsdocTags)
- `SearchQuery`, `ImportRequest`, `LibraryInfoRequest`

**Acceptance Criteria**:
- All interfaces exported
- JSDoc comments for each interface
- Zod schemas for runtime validation created in parallel file `library-schemas.ts`

---

### T002: Implement library scanner
**File**: `src/core/library-scanner.ts`
**Description**: Create `LibraryScanner` class with:
- `scanDirectory(scriptsDir: string): Promise<string[]>` - returns list of .ahk file paths
- Uses `fs.readdir()` with `.ahk` filter
- Returns absolute paths
- Handles errors gracefully (directory not found, permission denied)

**Dependencies**: T001 (uses types)

**Acceptance Criteria**:
- Scans scripts/ folder recursively
- Filters .ahk files only
- Returns sorted absolute paths
- Logs scan time and file count

---

### T003 [P]: Implement metadata extractor
**File**: `src/core/metadata-extractor.ts`
**Description**: Create `MetadataExtractor` class with:
- `extract(filePath: string): Promise<LibraryMetadata>` - main extraction method
- `extractVersion(content: string): string | undefined` - parse `static Version :=` pattern
- `extractDependencies(content: string): string[]` - parse `#Include` directives
- `extractDocumentation(content: string): DocumentationInfo` - parse JSDoc + block comments
- `extractGlobals(content: string): string[]` - parse global variable declarations
- Integration with existing `AHK_Analyze` tool for class/function extraction

**Dependencies**: T001 (uses types)

**Acceptance Criteria**:
- Reads file content asynchronously
- Calls AHK_Analyze for code structure
- Extracts version using regex `/static\s+Version\s*[:=]>?\s*["']([^"']+)["']/i`
- Extracts #Include directives
- Handles files with no version/docs gracefully
- Returns complete LibraryMetadata object

---

### T004 [P]: Implement dependency resolver
**File**: `src/core/dependency-resolver.ts`
**Description**: Create `DependencyResolver` class with:
- `buildGraph(libraries: LibraryMetadata[]): void` - build adjacency list
- `detectCycles(): string[][]` - DFS-based cycle detection
- `getImportOrder(targetLib: string): string[]` - topological sort
- `resolvePath(includePath: string, fromLibrary: string): string` - resolve relative #Include paths

**Dependencies**: T001 (uses types)

**Acceptance Criteria**:
- Builds directed graph from dependencies
- Detects circular dependencies and returns cycle paths
- Returns correct import order (dependencies before dependents)
- Handles missing dependencies gracefully
- Resolves relative paths correctly

---

### T005 [P]: Implement version manager
**File**: `src/core/version-manager.ts`
**Description**: Create `VersionManager` class with:
- `parseVersion(versionString: string): SemanticVersion | null` - parse MAJOR.MINOR.PATCH
- `checkCompatibility(required: string, available: string): CompatibilityResult` - check MAJOR version match
- `formatVersion(version: SemanticVersion): string` - format as string

**Dependencies**: T001 (uses types)

**Acceptance Criteria**:
- Parses semantic version strings correctly
- Returns null for invalid versions
- Checks MAJOR version compatibility
- Returns warnings for unversioned libraries
- Returns errors for breaking changes

---

## Phase 3.2: Core Implementation

### T006: Implement library catalog
**File**: `src/core/library-catalog.ts`
**Description**: Create `LibraryCatalog` class with:
- `initialize(scriptsDir: string): Promise<void>` - lazy initialization
- `get(name: string): LibraryMetadata | undefined` - lookup by name
- `search(query: string): LibraryMetadata[]` - search by name or description
- `filter(category?: string): LibraryMetadata[]` - filter by category
- `refresh(): Promise<void>` - re-scan and rebuild catalog
- Private `Map<string, LibraryMetadata>` storage

**Dependencies**: T002 (uses scanner), T003 (uses extractor), T004 (uses resolver)

**Acceptance Criteria**:
- Lazily initializes on first call
- Stores libraries in Map by name
- Search is case-insensitive
- Filter returns all if no category provided
- Refresh clears and rebuilds catalog
- Initialization completes in <2 seconds for 20 libraries

---

## Phase 3.3: MCP Tools

### T007: Implement AHK_Library_List tool
**File**: `src/tools/ahk-library-list.ts`
**Description**: Create MCP tool for listing/searching libraries:
- Zod schema: `{ query?: string, category?: string }`
- Calls `catalog.search()` or `catalog.filter()`
- Returns array of library names with brief descriptions
- Formats output as markdown list

**Dependencies**: T006 (uses catalog)

**Acceptance Criteria**:
- Tool registered in server.ts
- Accepts optional query and category parameters
- Returns formatted library list
- Handles empty results gracefully
- Search completes in <100ms

**Example Output**:
```
📚 Available Libraries (5 found)

- **UIA** - UI Automation framework wrapper
- **UIA_Browser** - Browser automation extension (depends on UIA)
- **Classes** - Utility classes collection (Cmd, Beep, etc.)
- **ClipboardHistory** - Clipboard management utilities
- **ToolTipEx** - Enhanced tooltip functionality
```

---

### T008: Implement AHK_Library_Info tool
**File**: `src/tools/ahk-library-info.ts`
**Description**: Create MCP tool for detailed library information:
- Zod schema: `{ libraryName: string }`
- Calls `catalog.get(libraryName)`
- Returns full metadata including:
  - Classes and methods
  - Functions
  - Dependencies (with version constraints)
  - Documentation/examples
  - Version info
- Formats output as structured markdown

**Dependencies**: T006 (uses catalog), T004 (uses resolver for dependency info)

**Acceptance Criteria**:
- Tool registered in server.ts
- Accepts library name parameter
- Returns detailed structured information
- Shows dependency tree
- Includes usage examples if available
- Suggests similar names if library not found (fuzzy matching)

**Example Output**:
```
📄 **UIA_Browser** (v1.1.1)

Browser automation extension for AutoHotkey v2

**Dependencies:**
- UIA.ahk (required)

**Classes:**
- ChromeControl
- EdgeControl
- BrowserElement

**Functions:**
- AttachToBrowser()
- NavigateTo(url)

**Examples:**
\`\`\`autohotkey
#Include UIA.ahk
#Include UIA_Browser.ahk

browser := ChromeControl()
browser.NavigateTo("https://example.com")
\`\`\`
```

---

### T009: Implement AHK_Library_Import tool
**File**: `src/tools/ahk-library-import.ts`
**Description**: Create MCP tool for generating #Include statements:
- Zod schema: `{ libraryName: string, userScriptPath?: string }`
- Calls `resolver.getImportOrder(libraryName)` for dependency chain
- Generates ordered #Include statements
- Resolves relative paths from user's script location
- Validates all files exist
- Returns boilerplate initialization code if applicable

**Dependencies**: T004 (uses resolver), T006 (uses catalog)

**Acceptance Criteria**:
- Tool registered in server.ts
- Accepts library name and optional user script path
- Returns ordered #Include statements
- Includes all transitive dependencies
- Shows version conflicts if any
- Provides initialization boilerplate

**Example Output**:
```
📦 **Import Instructions for UIA_Browser**

Add these #Include directives to your script:

\`\`\`autohotkey
; Dependencies (in order)
#Include scripts/UIA.ahk
#Include scripts/UIA_Browser.ahk

; Initialize
browser := ChromeControl()
\`\`\`

**Note**: UIA_Browser v1.1.1 requires UIA.ahk (compatible)
```

---

## Phase 3.4: Testing

### T010 [P]: Unit tests for library scanner
**File**: `tests/unit/library-scanner.test.ts`
**Description**: Test LibraryScanner functionality:
- Test: Scans valid directory and returns .ahk files
- Test: Filters non-.ahk files correctly
- Test: Handles empty directory
- Test: Throws error for non-existent directory
- Test: Returns absolute paths
- Mock filesystem with test fixtures

**Dependencies**: T002 (tests scanner)

---

### T011 [P]: Unit tests for metadata extractor
**File**: `tests/unit/metadata-extractor.test.ts`
**Description**: Test MetadataExtractor functionality:
- Test: Extracts version from `static Version :=` pattern
- Test: Extracts #Include dependencies
- Test: Parses JSDoc documentation
- Test: Falls back to plain comments when no JSDoc
- Test: Handles files with no version/docs
- Test: Integrates with AHK_Analyze
- Mock file content and AHK_Analyze responses

**Dependencies**: T003 (tests extractor)

---

### T012 [P]: Unit tests for dependency resolver
**File**: `tests/unit/dependency-resolver.test.ts`
**Description**: Test DependencyResolver functionality:
- Test: Builds dependency graph correctly
- Test: Detects circular dependencies (A→B→C→A)
- Test: Returns correct topological order
- Test: Handles missing dependencies
- Test: Resolves transitive dependencies (A→B→C)
- Test: Resolves relative #Include paths

**Dependencies**: T004 (tests resolver)

---

### T013 [P]: Unit tests for version manager
**File**: `tests/unit/version-manager.test.ts`
**Description**: Test VersionManager functionality:
- Test: Parses valid semantic version
- Test: Returns null for invalid version
- Test: Detects MAJOR version compatibility
- Test: Warns about breaking changes
- Test: Handles unversioned libraries gracefully

**Dependencies**: T005 (tests version manager)

---

### T014 [P]: Unit tests for library catalog
**File**: `tests/unit/library-catalog.test.ts`
**Description**: Test LibraryCatalog functionality:
- Test: Initializes and scans directory
- Test: Lookup by name returns correct library
- Test: Search finds libraries by name substring
- Test: Search finds libraries by description
- Test: Filter by category works correctly
- Test: Refresh rebuilds catalog
- Test: Performance: initialization <2s for 20 libraries
- Mock scanner and extractor

**Dependencies**: T006 (tests catalog)

---

### T015: Integration test for end-to-end workflow
**File**: `tests/integration/library-workflow.test.ts`
**Description**: Test complete library management workflow:
- Setup: Create test scripts/ folder with sample libraries
- Test: List all libraries
- Test: Get info for specific library
- Test: Generate import for library with dependencies
- Test: Verify dependency order is correct
- Test: Handle missing library gracefully
- Teardown: Clean up test files

**Dependencies**: T006, T007, T008, T009 (tests full system)

**Acceptance Criteria**:
- Tests realistic user workflows
- Uses actual test .ahk files
- Verifies all MCP tools work together
- Cleans up test artifacts

---

### T016 [P]: Performance benchmarks
**File**: `tests/performance/catalog-performance.test.ts`
**Description**: Benchmark library catalog performance:
- Benchmark: Catalog initialization time (<2s for 20 files)
- Benchmark: Search performance (<100ms)
- Benchmark: Dependency resolution (<500ms for complex graph)
- Benchmark: Metadata extraction (<1s per file)
- Generate performance report

**Dependencies**: T006 (benchmarks catalog)

---

## Phase 3.5: Documentation & Polish

### T017 [P]: Update CLAUDE.md with library management context
**File**: `CLAUDE.md` (repository root)
**Description**: Add library management system documentation to agent context:
- Add "Library Management" section
- Document 3 MCP tools (List, Info, Import)
- Provide usage examples
- Add common patterns (how to discover → document → import)
- Keep under 150 lines total (update existing, don't bloat)

**Dependencies**: T007, T008, T009 (documents tools)

**Acceptance Criteria**:
- Section added to existing CLAUDE.md
- Examples show typical workflows
- Links to research.md for details
- Agent can discover and use tools from context

---

### T018 [P]: Create library manifest format documentation
**File**: `docs/LIBRARY_MANIFEST.md`
**Description**: Document optional JSON manifest format for libraries:
- Schema definition for `.ahk.json` manifests
- Fields: name, version, dependencies, description, author, examples
- Example manifests for UIA, UIA_Browser, Classes
- Migration guide (how to add manifests to existing libraries)

**Dependencies**: None (documentation only)

**Acceptance Criteria**:
- Clear JSON schema with examples
- Explains fallback to source-based extraction
- Encourages but doesn't require manifests

---

## Dependencies

```
Setup Phase:
  T001 (types) → blocks T002, T003, T004, T005

Core Phase:
  T002 (scanner) → blocks T006
  T003 (extractor) → blocks T006
  T004 (resolver) → blocks T006, T008, T009
  T005 (version) → blocks T008
  T006 (catalog) → blocks T007, T008, T009

Tool Phase:
  T007, T008, T009 can run in parallel after T006

Test Phase:
  T010-T014 can run in parallel (different files)
  T015 requires T006-T009 complete
  T016 can run after T006

Documentation:
  T017, T018 can run in parallel after tools complete
```

## Parallel Execution Examples

### Example 1: Core modules (after T001)
```bash
# Launch T003-T005 together (different files, share only T001):
Task: "Implement metadata extractor in src/core/metadata-extractor.ts"
Task: "Implement dependency resolver in src/core/dependency-resolver.ts"
Task: "Implement version manager in src/core/version-manager.ts"
```

### Example 2: Unit tests (after respective modules)
```bash
# Launch T010-T014 together:
Task: "Unit tests for scanner in tests/unit/library-scanner.test.ts"
Task: "Unit tests for extractor in tests/unit/metadata-extractor.test.ts"
Task: "Unit tests for resolver in tests/unit/dependency-resolver.test.ts"
Task: "Unit tests for version manager in tests/unit/version-manager.test.ts"
Task: "Unit tests for catalog in tests/unit/library-catalog.test.ts"
```

### Example 3: MCP tools (after T006)
```bash
# Launch T007-T009 together:
Task: "Implement AHK_Library_List tool in src/tools/ahk-library-list.ts"
Task: "Implement AHK_Library_Info tool in src/tools/ahk-library-info.ts"
Task: "Implement AHK_Library_Import tool in src/tools/ahk-library-import.ts"
```

---

## Validation Checklist

- [x] All core modules have corresponding unit tests (T010-T014)
- [x] All MCP tools implemented (T007-T009)
- [x] Integration test covers end-to-end workflow (T015)
- [x] Performance benchmarks defined (T016)
- [x] Parallel tasks truly independent (marked [P])
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Tests come before or alongside implementation
- [x] Documentation tasks included (T017-T018)

---

## Task Summary

**Total Tasks**: 18
- **Setup**: 1 (T001)
- **Core Modules**: 5 (T002-T006)
- **MCP Tools**: 3 (T007-T009)
- **Unit Tests**: 5 (T010-T014)
- **Integration Test**: 1 (T015)
- **Performance**: 1 (T016)
- **Documentation**: 2 (T017-T018)

**Parallelizable**: 12 tasks marked [P]
**Estimated Completion**: 15-20 hours for solo developer

---

**Status**: Tasks ready for execution ✅
**Next Step**: Begin with T001 (type definitions)
