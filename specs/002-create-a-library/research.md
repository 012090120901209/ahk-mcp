# Research: AutoHotkey Library Management System

**Feature**: AutoHotkey Library Management System
**Date**: 2025-10-02
**Status**: Complete

## Overview

This document consolidates research findings for implementing a library management system that discovers, documents, and assists with importing AutoHotkey v2 libraries from the scripts/ folder.

## Current Library Landscape

### Existing Libraries Identified

1. **UIA.ahk** (~10,000+ lines)
   - UI Automation framework wrapper
   - No dependencies
   - Global variables: `IUIAutomationMaxVersion`, `IUIAutomationActivateScreenReader`
   - Main class: `UIA` with nested classes (Cleanup, Enumeration)
   - Author: Descolada (with credits to thqby, neptercn, jethrow)
   - No explicit version in file

2. **UIA_Browser.ahk**
   - Browser automation extension
   - Depends on: UIA.ahk (inferred from name pattern)
   - Extends UIA framework

3. **Classes.ahk** (~1200 lines)
   - Utility classes collection
   - Dependencies: `ClipboardHistory.ahk`, `ToolTipEx.ahk` (via #Include directives)
   - Classes: Cmd, Runner, Beep, KeyThrottle, BambuMonitor, WinState, ClipboardMonitor, TextSend, Text, RestartHolder
   - Extensive documentation comments (JSDoc-style)

4. **ClipboardHistory.ahk**
   - Clipboard management utilities
   - Dependency of Classes.ahk

5. **ToolTipEx.ahk**
   - Enhanced tooltip functionality
   - Dependency of Classes.ahk

### Metadata Extraction Patterns

**Version Information**:
- UIA.ahk: No version field found in first 100 lines
- UIA_Browser.ahk: Has `static Version => "1.1.1"` property (semantic versioning)
- Classes.ahk: No version found
- **Decision**: Version info is optional; extract if `static Version :=` or `static Version =>` pattern found

**Dependencies (#Include directives)**:
- Pattern: `#Include <file>` or `#Include file.ahk`
- Classes.ahk example:
  ```ahk
  #Include ClipboardHistory.ahk
  #Include ToolTipEx.ahk
  ```
- **Decision**: Parse file for `#Include` directives to build dependency graph

**Documentation Comments**:
- Classes.ahk uses JSDoc-style:
  ```ahk
  /**
   * @class Beep
   * @description Handles various sound effects
   * @static
   */
  ```
- UIA.ahk uses block comments with no structured format
- **Decision**: Support both structured (JSDoc) and unstructured documentation

**Class Detection**:
- Pattern: `class ClassName {` or `class ClassName extends BaseClass {`
- UIA.ahk: Main UIA class with nested classes
- Classes.ahk: Multiple top-level classes
- **Decision**: Extract all class names and nesting structure

---

## 1. Library Scanning Strategy

### Decision
Use Node.js `fs.readdir()` with recursive option to scan scripts/ folder for .ahk files.

### Rationale
- **Fast**: Node.js async I/O is efficient
- **Simple**: Single call returns all files
- **Cross-platform**: Works on Windows, Linux, macOS
- **No external dependencies**: Built-in fs module

### Implementation Approach
```typescript
import { promises as fs } from 'fs';
import path from 'path';

async function scanLibraries(scriptsDir: string): Promise<string[]> {
  const files = await fs.readdir(scriptsDir, { withFileTypes: true });
  return files
    .filter(f => f.isFile() && f.name.endsWith('.ahk'))
    .map(f => path.join(scriptsDir, f.name));
}
```

### Alternatives Considered
1. **Watch-based scanning** (rejected)
   - Pro: Real-time updates when files added
   - Con: Adds complexity, not needed for static library folder

2. **Glob patterns** (rejected)
   - Pro: More flexible file matching
   - Con: Requires external dependency, overkill for simple .ahk filter

---

## 2. Metadata Extraction Strategy

### Decision
Use existing AHK_Analyze tool for code structure, supplement with custom parsers for library-specific metadata.

### Rationale
- **Reuse existing investment**: AHK_Analyze already extracts classes, functions, methods
- **Consistent**: Same analysis used for code quality checks
- **Comprehensive**: Handles complex AHK v2 syntax
- **Augment with custom parsers**: For #Include, version, documentation

### Metadata Sources

**From AHK_Analyze** (existing tool):
- Class names and line ranges
- Function names and signatures
- Method names within classes
- Property definitions

**From Custom Parsers** (new):
- `#Include` directives ’ dependencies
- `static Version :=` ’ semantic version
- JSDoc comments ’ structured documentation
- Block comments ’ unstructured documentation
- Global variable declarations

### Implementation Approach
```typescript
interface LibraryMetadata {
  name: string;
  filePath: string;
  version?: string;
  dependencies: string[];
  classes: ClassInfo[];
  functions: FunctionInfo[];
  documentation: DocumentationInfo;
  globalVars: string[];
}

async function extractMetadata(filePath: string): Promise<LibraryMetadata> {
  // 1. Use AHK_Analyze for code structure
  const analysis = await ahkAnalyzeTool.execute({ code: filePath });

  // 2. Parse file for library-specific metadata
  const content = await fs.readFile(filePath, 'utf-8');
  const version = extractVersion(content);
  const dependencies = extractIncludes(content);
  const docs = extractDocumentation(content);
  const globals = extractGlobals(content);

  return {
    name: path.basename(filePath, '.ahk'),
    filePath,
    version,
    dependencies,
    classes: analysis.classes,
    functions: analysis.functions,
    documentation: docs,
    globalVars: globals
  };
}
```

### Alternatives Considered
1. **Full AST parsing** (rejected)
   - Pro: Most accurate
   - Con: Complex, slow, requires AHK v2 parser implementation

2. **Regex-only extraction** (rejected)
   - Pro: Fast, simple
   - Con: Fragile for complex code, misses nested structures

---

## 3. Dependency Resolution Strategy

### Decision
Build directed acyclic graph (DAG) using #Include directives, detect cycles with depth-first search.

### Rationale
- **Explicit dependencies**: #Include directives are clear
- **Standard algorithm**: DFS for cycle detection is well-known
- **Efficient**: O(V+E) complexity for typical library graphs
- **Clear error messages**: Can report exact cycle path

### Implementation Approach
```typescript
class DependencyResolver {
  private graph: Map<string, string[]> = new Map();

  buildGraph(libraries: LibraryMetadata[]): void {
    for (const lib of libraries) {
      this.graph.set(lib.name, lib.dependencies);
    }
  }

  detectCycles(): string[][] {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const cycles: string[][] = [];

    for (const [node, _] of this.graph) {
      this.dfs(node, visited, recStack, [], cycles);
    }

    return cycles;
  }

  getImportOrder(targetLib: string): string[] {
    // Topological sort from target
    // Returns dependencies in correct #Include order
  }
}
```

### Dependency Matching

**#Include Patterns**:
```ahk
#Include UIA.ahk              ’ Resolve to scripts/UIA.ahk
#Include <UIA>                ’ Resolve to scripts/UIA.ahk (with .ahk added)
#Include ..\lib\Helper.ahk    ’ Relative path (resolve from library location)
```

**Resolution Strategy**:
1. If path is absolute ’ use as-is
2. If path starts with `<` ’ strip brackets, add .ahk, search in scripts/
3. If path is relative ’ resolve from library's directory
4. If file not found ’ mark as missing dependency, warn user

### Alternatives Considered
1. **Manifest-based dependencies** (future enhancement)
   - Pro: Explicit, with version constraints
   - Con: Requires creating manifests for all libraries
   - Decision: Support optional manifests, but #Include is primary

2. **Import analysis** (rejected)
   - Pro: Detects actual usage
   - Con: Too complex, false positives from conditional includes

---

## 4. Version Management Strategy

### Decision
Support semantic versioning (MAJOR.MINOR.PATCH) when available, gracefully handle unversioned libraries.

### Rationale
- **UIA_Browser precedent**: Already uses semantic versioning
- **Standard**: SemVer is widely understood
- **Optional**: Many libraries don't have versions (UIA.ahk, Classes.ahk)
- **Simple comparison**: Easy to check compatibility

### Version Extraction

**Patterns to match**:
```ahk
static Version := "1.1.1"
static Version => "2.0.0"
; Library Version: 1.2.3
```

**Regex**: `/(?:static\s+Version\s*[:=]>?\s*["']([^"']+)["']|Version:\s*([\d.]+))/i`

### Compatibility Checking

**Rules**:
- Same MAJOR version ’ compatible
- Different MAJOR ’ breaking change, warn user
- Unversioned ’ assume compatible, warn about lack of versioning

### Implementation Approach
```typescript
class VersionManager {
  parseVersion(versionString: string): SemanticVersion | null {
    const match = versionString.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return null;
    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3])
    };
  }

  checkCompatibility(
    required: string,
    available: string
  ): CompatibilityResult {
    const req = this.parseVersion(required);
    const avail = this.parseVersion(available);

    if (!req || !avail) {
      return { compatible: true, warning: 'Unversioned dependency' };
    }

    if (req.major !== avail.major) {
      return {
        compatible: false,
        error: `Breaking change: required ${required}, available ${available}`
      };
    }

    return { compatible: true };
  }
}
```

### Alternatives Considered
1. **Range-based constraints** (future enhancement)
   - Pro: More flexible (`>=1.0.0 <2.0.0`)
   - Con: Requires constraint parser
   - Decision: Start simple, add if needed

2. **Lock files** (rejected)
   - Pro: Exact versions
   - Con: Overkill for local-only libraries

---

## 5. Catalog Management Strategy

### Decision
In-memory Map-based catalog with lazy initialization on first MCP tool call.

### Rationale
- **Fast lookup**: O(1) by library name
- **Session-scoped**: Cleared on server restart (appropriate for local libraries)
- **Lazy loading**: Don't scan until needed
- **Simple**: No database, no persistence

### Implementation Approach
```typescript
class LibraryCatalog {
  private libraries: Map<string, LibraryMetadata> = new Map();
  private initialized: boolean = false;

  async initialize(scriptsDir: string): Promise<void> {
    if (this.initialized) return;

    const files = await scanLibraries(scriptsDir);
    for (const file of files) {
      const metadata = await extractMetadata(file);
      this.libraries.set(metadata.name, metadata);
    }

    this.initialized = true;
  }

  search(query: string): LibraryMetadata[] {
    return Array.from(this.libraries.values())
      .filter(lib =>
        lib.name.toLowerCase().includes(query.toLowerCase()) ||
        lib.documentation.description?.toLowerCase().includes(query.toLowerCase())
      );
  }

  get(name: string): LibraryMetadata | undefined {
    return this.libraries.get(name);
  }
}
```

### Cache Invalidation

**Trigger**: Manual refresh command or file system watch (future)
**Strategy**: Clear entire catalog, re-scan scripts/ folder

### Alternatives Considered
1. **Persistent SQLite** (rejected)
   - Pro: Survives restarts
   - Con: Overkill, adds dependency, staleness issues

2. **JSON file cache** (rejected)
   - Pro: Simple persistence
   - Con: Staleness detection complex, not needed

---

## 6. MCP Tool Design Strategy

### Decision
Create 3 focused MCP tools: List, Info, Import.

### Rationale
- **Single Responsibility**: Each tool does one thing well
- **Composable**: Can be chained by LLM
- **Clear Purpose**: Easy for Claude to know which to use

### Tool Specifications

**AHK_Library_List**:
- **Purpose**: Search and filter libraries
- **Input**: Optional search query, optional category filter
- **Output**: Array of library names with brief descriptions
- **Use Case**: "What libraries are available for UI automation?"

**AHK_Library_Info**:
- **Purpose**: Get detailed info for specific library
- **Input**: Library name
- **Output**: Classes, functions, dependencies, documentation, examples
- **Use Case**: "Show me how to use the UIA library"

**AHK_Library_Import**:
- **Purpose**: Generate #Include statements
- **Input**: Target library name, optional user script path
- **Output**: Ordered #Include statements with dependencies, boilerplate code
- **Use Case**: "Help me import UIA_Browser into my script"

### Error Handling

**Common Errors**:
- Library not found ’ Suggest similar names (fuzzy match)
- Circular dependency ’ Show cycle path
- Missing dependency ’ List what's missing, suggest alternatives
- Version conflict ’ Explain conflict, suggest compatible versions

### Alternatives Considered
1. **Single unified tool** (rejected)
   - Pro: Simpler registration
   - Con: Complex parameter schema, unclear purpose

2. **Import/Export tools** (future)
   - Pro: Package management
   - Con: Out of scope (local libraries only)

---

## 7. Documentation Extraction Strategy

### Decision
Support both JSDoc-style and plain block comments, prioritize structured when available.

### Rationale
- **Pragmatic**: Works with existing libraries as-is
- **Upgrade path**: Encourages JSDoc adoption
- **Comprehensive**: Doesn't lose info from plain comments

### JSDoc Parsing

**Tags to extract**:
```ahk
/**
 * @class ClassName
 * @description What this class does
 * @static
 * @property {Type} propName - Description
 * @method methodName
 * @param {Type} paramName - Description
 * @returns {Type} Description
 * @example
 *   code example here
 */
```

**Regex patterns**:
- `@class\s+(\w+)` ’ class name
- `@description\s+(.+)` ’ description
- `@param\s+\{([^}]+)\}\s+(\w+)\s+-\s+(.+)` ’ parameter

### Fallback Strategy

If no JSDoc found:
1. Use first block comment in file as library description
2. Use inline comments above class/function as their descriptions
3. Generate basic documentation from code structure

### Examples Extraction

**Pattern**: Look for `@example` tags or code blocks in comments
**Storage**: Store as array of strings for each class/function

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Scanning** | Async fs.readdir for .ahk files | Fast, simple, cross-platform |
| **Metadata** | AHK_Analyze + custom parsers | Reuse existing tool, augment with library-specific |
| **Dependencies** | #Include parsing + DAG with cycle detection | Explicit, standard algorithm |
| **Versioning** | Semantic versioning (optional) | Standard, handles unversioned gracefully |
| **Catalog** | In-memory Map (lazy init) | Fast, simple, session-scoped |
| **MCP Tools** | 3 tools (List, Info, Import) | Single responsibility, composable |
| **Documentation** | JSDoc + fallback to plain comments | Pragmatic, works with existing code |

---

## Implementation Priorities

### Phase 1: Core Infrastructure
1. Library scanner (fs.readdir)
2. Metadata extractor (AHK_Analyze integration)
3. Dependency resolver (DAG builder)
4. Library catalog (Map-based store)

### Phase 2: MCP Tools
5. AHK_Library_List (search/filter)
6. AHK_Library_Info (details/docs)
7. AHK_Library_Import (generate includes)

### Phase 3: Enhanced Features
8. Version manager (semver parsing)
9. Documentation parser (JSDoc extraction)
10. Example code formatting

---

**Research Complete**: 2025-10-02
**Next Phase**: Design & Contracts (data-model.md, contracts/)
