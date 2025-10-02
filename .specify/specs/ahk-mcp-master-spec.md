# AutoHotkey v2 MCP Server - Master Specification

**Version:** 2.0.0
**Status:** Production Ready
**Last Updated:** October 1, 2025
**Repository:** https://github.com/TrueCrimeAudit/ahk-mcp

---

## Executive Summary

The AutoHotkey v2 MCP Server is a **TypeScript-based Model Context Protocol server** that enables AI coding agents (Claude, ChatGPT, Gemini) to provide expert AutoHotkey v2 development assistance with intelligent context injection, code analysis, and script execution capabilities.

**Core Value Proposition:**
- AI agents get instant access to 200+ AutoHotkey v2 functions with intelligent context
- Developers get expert AHK assistance without leaving their coding environment
- Script execution includes unique window detection for GUI verification
- v1-to-v2 migration guidance prevents common pitfalls

---

## Vision & Mission

### Vision
**Enable every AI coding agent to be an AutoHotkey v2 expert.**

### Mission
Provide a production-ready MCP server that:
1. Delivers comprehensive AutoHotkey v2 documentation to AI agents
2. Enables intelligent code analysis and diagnostics
3. Supports safe script execution with verification
4. Maintains context across multi-turn conversations
5. Guides developers away from v1 patterns toward v2 best practices

---

## Problems Solved

### Problem 1: AI Agents Lack AutoHotkey Domain Knowledge

**Current State:**
- Claude/ChatGPT/Gemini trained on general code, not AHK-specific patterns
- No access to AutoHotkey v2 documentation during inference
- Generate outdated v1 syntax or incorrect v2 code
- Cannot explain AHK-specific concepts (COM objects, hotkeys, GUI event loops)

**Solution:**
- FlexSearch-powered documentation search (<500ms response)
- 200+ AutoHotkey built-in functions indexed with descriptions
- Intelligent context injection based on keywords in user queries
- Module routing system for specialized topics (GUI, Arrays, Classes, etc.)

**Success Criteria:**
- ✅ AI agents can find documentation in <500ms
- ✅ Search results ranked by relevance score
- ✅ Context automatically injected based on query keywords
- ✅ No manual documentation lookup required

---

### Problem 2: No Standardized AI-to-AHK Integration

**Current State:**
- Developers copy-paste code between AI chat and editor
- No way to execute generated scripts from AI interface
- No verification that generated code actually works
- Context lost between coding sessions

**Solution:**
- MCP protocol integration with Claude Desktop/Code, ChatGPT, Gemini
- Direct script execution via `AHK_Run_Script` tool
- Window detection for GUI script verification
- Active file tracking across tool invocations

**Success Criteria:**
- ✅ Works with 3+ AI platforms (Claude, ChatGPT, Gemini)
- ✅ Scripts execute directly from AI interface
- ✅ GUI windows detected within configurable timeout
- ✅ Active file persists across sessions

---

### Problem 3: Script Execution Verification Missing

**Current State:**
- AI generates GUI scripts with no way to verify window creation
- Developers manually check if scripts work
- No timing data for performance analysis
- Silent failures for GUI scripts

**Solution:**
- **Unique window detection feature** using PowerShell polling
- Cross-platform support (Windows/macOS/Linux)
- Configurable timeout (default 30s)
- Returns window title and detection timing

**Success Criteria:**
- ✅ GUI windows detected within 30s (configurable)
- ✅ Returns window title for verification
- ✅ Provides timing data for performance analysis
- ✅ Works cross-platform

---

### Problem 4: Context Switching Between Coding and Documentation

**Current State:**
- Developers switch between editor, docs website, and AI chat
- No integrated documentation search
- Cognitive overhead remembering function signatures
- Time wasted searching for examples

**Solution:**
- In-editor documentation via MCP tools
- Sample code injection for common patterns
- Diagnostic analysis with explanations
- Recent file tracking for quick access

**Success Criteria:**
- ✅ Documentation accessible from AI interface
- ✅ Code samples provided with context
- ✅ Diagnostics include fix suggestions
- ✅ Recent files tracked (last 50)

---

### Problem 5: v1-to-v2 Migration Challenges

**Current State:**
- AI agents suggest v1 syntax (assignment with `=` instead of `:=`)
- Developers confused by v1 vs v2 differences
- No guidance on v2 best practices
- Migration requires manual research

**Solution:**
- V2-only code generation (constitutional requirement)
- Migration guidance in module instructions
- Common pitfall detection in diagnostics
- Elite coding standards documented

**Success Criteria:**
- ✅ Zero v1 syntax in generated code
- ✅ Migration patterns documented
- ✅ Diagnostics catch v1 patterns
- ✅ Examples demonstrate v2 best practices

---

## User Personas & Journeys

### Persona 1: AI-Assisted AHK Developer

**Profile:**
- Uses Claude Code or ChatGPT for coding assistance
- Moderate AutoHotkey experience
- Wants to write v2 code correctly
- Values speed and accuracy

**User Journey:**
1. Opens Claude Code with ahk-mcp server running
2. Asks: "Create a GUI with a button that opens a file dialog"
3. ahk-mcp injects GUI module context automatically
4. Claude generates v2-compliant GUI code
5. Developer runs script via `AHK_Run_Script` tool
6. ahk-mcp detects GUI window and confirms success
7. Developer requests edit: "Change button text to 'Browse...'"
8. ahk-mcp uses active file context (no path needed)
9. Edit applied, script re-runs, window detected again

**Pain Points Solved:**
- No manual documentation lookup
- Immediate script verification
- Context preserved across edits
- v2 syntax guaranteed

---

### Persona 2: AutoHotkey Beginner

**Profile:**
- New to AutoHotkey
- Relies heavily on AI for learning
- Intimidated by AHK documentation
- Needs step-by-step guidance

**User Journey:**
1. Asks: "How do I create a hotkey that types my email?"
2. ahk-mcp searches documentation for "hotkey" + "send"
3. Returns relevant functions: `Hotkey()`, `Send()`, `SendText()`
4. Claude explains with v2 example code
5. Beginner copies code to file
6. Runs via `AHK_Run_Debug` with detailed logging
7. Sees step-by-step execution in debug output
8. Modifies code with AI help
9. ahk-mcp validates syntax before execution

**Pain Points Solved:**
- No overwhelming documentation
- Concrete working examples
- Safe debugging environment
- Incremental learning

---

### Persona 3: AHK Scripter Migrating from v1

**Profile:**
- Expert in AutoHotkey v1
- Frustrated by v2 syntax changes
- Has large codebase to migrate
- Needs quick reference

**User Journey:**
1. Pastes v1 code into chat: "Convert this to v2"
2. ahk-mcp analyzes code via `AHK_Analyze_Code`
3. Identifies v1 patterns: `=` assignment, `ComObjCreate()`, `Gui, Add`
4. Claude provides v2 conversion with explanations
5. Developer asks: "Why `:=` instead of `=`?"
6. ahk-mcp injects v2 expression documentation
7. Claude explains expression-only mode in v2
8. Converted code validated with `AHK_Diagnostics`

**Pain Points Solved:**
- Automated v1 pattern detection
- Clear v1→v2 migration path
- Contextual v2 explanations
- Syntax validation

---

## Functional Requirements

### Core Requirements (MUST HAVE)

#### FR-001: Documentation Search
**Requirement:** System MUST provide full-text search across 200+ AutoHotkey v2 functions.

**Acceptance Criteria:**
- Search completes in <500ms for 90% of queries
- Results ranked by relevance score
- Fuzzy matching for typos (e.g., "MesageBox" → "MsgBox")
- Returns function signatures, descriptions, parameters

**Test Scenario:**
```
GIVEN: User query "show popup window"
WHEN: AHK_Doc_Search tool executed
THEN: Returns MsgBox, ToolTip, TrayTip ranked by relevance
AND: Response time <500ms
AND: Includes function signatures
```

---

#### FR-002: Intelligent Context Injection
**Requirement:** System MUST automatically inject relevant documentation based on keywords.

**Acceptance Criteria:**
- Keyword detection from user messages
- Module routing to specialized content (GUI, Arrays, Classes, etc.)
- No manual module selection required
- Context visible in tool response

**Test Scenario:**
```
GIVEN: User message contains "listview", "gui", "columns"
WHEN: AHK_Docs_Context tool executed
THEN: Injects Module_GUI.md automatically
AND: Includes ListView-specific guidance
AND: Shows which keywords triggered routing
```

---

#### FR-003: Script Execution
**Requirement:** System MUST execute AutoHotkey v2 scripts and return results.

**Acceptance Criteria:**
- Supports .ahk files (validated extension)
- Captures stdout/stderr output
- Tracks process ID for management
- Returns exit code

**Test Scenario:**
```
GIVEN: Valid .ahk file with OutputDebug() calls
WHEN: AHK_Run_Script tool executed
THEN: Script runs to completion
AND: OutputDebug text captured
AND: Exit code returned (0 = success)
AND: Process ID tracked
```

---

#### FR-004: Window Detection
**Requirement:** System MUST detect GUI windows created by scripts.

**Acceptance Criteria:**
- Polling every 100ms with configurable timeout (default 30s)
- Cross-platform (Windows/macOS/Linux via PowerShell)
- Returns window title when detected
- Provides timing data (detection latency)

**Test Scenario:**
```
GIVEN: Script creates Gui window with title "Test"
WHEN: AHK_Run_Script executed with windowDetection: true
THEN: Window detected within 30 seconds
AND: Returns window title "Test"
AND: Provides detection time (e.g., "1.2s")
```

---

#### FR-005: Active File Tracking
**Requirement:** System MUST maintain active file context across tool invocations.

**Acceptance Criteria:**
- Singleton pattern for shared state
- Persists to configuration file
- Auto-detection from file paths in text
- Restores on server restart

**Test Scenario:**
```
GIVEN: User sets active file via AHK_File_Active
WHEN: Next tool called without filePath parameter
THEN: Uses active file automatically
AND: File path displayed in response
AND: Persists across server restarts
```

---

#### FR-006: Code Analysis
**Requirement:** System MUST analyze AHK code for syntax errors and issues.

**Acceptance Criteria:**
- Detects v1 syntax patterns (e.g., `=` assignment)
- Identifies undefined functions
- Checks balanced braces/parentheses
- Provides line numbers for issues

**Test Scenario:**
```
GIVEN: AHK code with unbalanced braces
WHEN: AHK_Diagnostics tool executed
THEN: Reports "Missing closing brace"
AND: Includes line number
AND: Suggests fix if applicable
```

---

### Advanced Requirements (SHOULD HAVE)

#### FR-007: Code Completion
**Requirement:** System SHOULD provide context-aware code completions.

**Acceptance Criteria:**
- Function name suggestions
- Parameter hints
- Snippet insertion
- Context-aware (e.g., inside class → suggest methods)

---

#### FR-008: File Editing
**Requirement:** System SHOULD support targeted file edits.

**Acceptance Criteria:**
- Find/replace with regex support
- Unified diff patches
- Advanced orchestrated changes
- Automatic backups before edits

---

#### FR-009: Analytics & Learning
**Requirement:** System SHOULD track usage patterns to improve context.

**Acceptance Criteria:**
- Tool usage frequency
- Search query patterns
- Error rates by tool
- Performance metrics

---

#### FR-010: VSCode Integration
**Requirement:** System SHOULD read VSCode problems for diagnostics.

**Acceptance Criteria:**
- Parses .vscode/problems.json (if exists)
- Integrates with AHK LSP diagnostics
- Provides unified error view

---

## Non-Functional Requirements

### Performance

| Metric | Target | Justification |
|--------|--------|---------------|
| Documentation search | <500ms | AI agent responsiveness |
| Script execution start | <2s | User experience |
| Window detection polling | Every 100ms | Reliable GUI detection |
| Memory usage (server) | <100MB idle | Long-running process |
| Analytics storage | Max 1000 entries | Prevent memory leaks |

---

### Security

| Requirement | Implementation |
|-------------|----------------|
| Path validation | `path.resolve()` for all file paths |
| Extension check | Case-insensitive `.ahk` validation |
| Process isolation | Separate child processes, PID tracking |
| Sandbox | Scripts run in user context (no elevation) |

---

### Reliability

| Requirement | Implementation |
|-------------|----------------|
| Graceful shutdown | SIGTERM → wait 5s → SIGKILL |
| Resource cleanup | File watchers closed, processes killed |
| Error recovery | All errors caught, logged, returned to client |
| Data persistence | Active file, config, analytics saved to disk |

---

### Compatibility

| Platform | Support Level |
|----------|---------------|
| Windows 10/11 | ✅ Full support |
| macOS 11+ | ✅ Full support (via PowerShell Core) |
| Linux (WSL2) | ✅ Full support |
| Claude Desktop | ✅ Primary target |
| Claude Code | ✅ Primary target |
| ChatGPT | ✅ Supported via MCP |
| Gemini CLI | ✅ Supported via MCP |

---

## Key Entities & Data Models

### Entity: AHK Function

```typescript
interface AhkFunction {
  name: string;              // e.g., "MsgBox"
  category: string;          // e.g., "GUI"
  description: string;       // Brief explanation
  syntax: string;            // Function signature
  parameters: Parameter[];   // Parameter details
  returns: string;          // Return type
  examples: CodeExample[];  // Usage examples
  relatedFunctions: string[]; // Similar functions
}
```

---

### Entity: Script Process

```typescript
interface ScriptProcess {
  pid: number;              // Process ID
  scriptPath: string;       // Absolute path to .ahk file
  startTime: Date;          // Execution start
  childProcess: ChildProcess; // Node child process
  windowDetected?: string;  // Window title (if detected)
  exitCode?: number;        // Exit code when completed
}
```

---

### Entity: Active File

```typescript
interface ActiveFile {
  filePath: string;         // Absolute path
  lastModified: Date;       // Last change timestamp
  lastDetected?: string;    // Original text path was detected from
  exists: boolean;          // File existence status
}
```

---

### Entity: Tool Metric

```typescript
interface ToolMetric {
  toolName: string;         // e.g., "AHK_Run_Script"
  timestamp: Date;          // Execution time
  duration: number;         // Execution duration (ms)
  success: boolean;         // Success/failure
  errorType?: string;       // Error category (if failed)
}
```

---

### Entity: Module Route

```typescript
interface ModuleRoute {
  moduleName: string;       // e.g., "Module_GUI.md"
  keywords: string[];       // Trigger keywords
  priority: number;         // 1-5 (higher = more specific)
  description: string;      // When to use this module
}
```

---

## Technical Constraints

### Technology Stack (FIXED)

- **Language:** TypeScript 5.3.3 (ES2020 target)
- **Runtime:** Node.js 18+ (ES modules)
- **Protocol:** MCP via stdio (primary) and SSE (secondary)
- **Validation:** Zod 3.22.4
- **Search:** FlexSearch 0.7.43
- **Process Mgmt:** Node child_process
- **File System:** fs/promises (async)

---

### Architecture Constraints

- **Modularity:** Each tool is a standalone module with defined schema
- **No circular dependencies** between tools
- **Singleton pattern** for shared state (active file, config, analytics)
- **Test-first development** (constitutional requirement)

---

### Resource Constraints

- **Max file size:** 10MB per file operation (configurable)
- **Max analytics entries:** 1000 (rolling window)
- **Process timeout:** 30s default (configurable per tool)
- **Search results:** Top 20 results (ranked by relevance)

---

### Integration Constraints

- **MCP Protocol:** Must adhere to stdio/SSE message format
- **AutoHotkey v2:** Only supports v2 (no v1 compatibility)
- **Cross-platform:** Must work on Windows, macOS, Linux
- **No external dependencies** for core functionality (FlexSearch embedded)

---

## Success Metrics

### User Adoption
- ⭐ 100+ GitHub stars (achieved: 7.1K)
- 📦 10+ production deployments
- 👥 5+ active contributors

### Quality Metrics
- ✅ 80%+ test coverage
- 🐛 <5 open critical bugs
- 📊 95%+ tool success rate
- ⚡ <500ms documentation search (P90)

### Feature Completeness
- ✅ 25+ MCP tools implemented
- ✅ 200+ AutoHotkey functions indexed
- ✅ 10 instruction modules created
- ✅ 3 AI platforms supported

---

## Out of Scope (Non-Goals)

### Explicitly NOT Included

1. **Full LSP Implementation**
   - Why: Complexity, existing AHK LSP exists
   - Alternative: LSP-like features via analysis tools

2. **AutoHotkey v1 Support**
   - Why: v2 is current, v1 adds maintenance burden
   - Alternative: Migration guidance via modules

3. **GUI-based Configuration**
   - Why: MCP is CLI-first protocol
   - Alternative: JSON configuration files

4. **Cloud Sync**
   - Why: Local-first design, privacy concerns
   - Alternative: Git for version control

5. **Script Debugging (IDE-level)**
   - Why: Better handled by VSCode extensions
   - Alternative: Debug output capture via tools

6. **Code Formatting**
   - Why: Subjective, low priority
   - Alternative: Manual formatting or external tools

7. **Package Management**
   - Why: AHK has no standard package system
   - Alternative: Manual #Include statements

8. **Web-based IDE**
   - Why: Out of scope for MCP server
   - Alternative: Use Claude Code or VSCode

---

## Future Enhancements (Backlog)

### Phase 3 (v3.0.0) - Planned Features

1. **Advanced Code Refactoring**
   - Automated v1-to-v2 migration
   - Extract function/class refactoring
   - Rename symbol across project

2. **Project-wide Analysis**
   - Dependency graph visualization
   - Unused function detection
   - Circular dependency checker

3. **Enhanced Testing**
   - Unit test generation from spec
   - Integration test framework
   - Coverage reporting

4. **Multi-file Operations**
   - Search/replace across project
   - Bulk renaming
   - Workspace-wide refactoring

5. **AI Training Feedback Loop**
   - Capture successful tool usage patterns
   - Export training data for fine-tuning
   - User preference learning

---

## Acceptance Scenarios

### Scenario 1: First-Time User - GUI Creation

```gherkin
GIVEN: User has ahk-mcp configured in Claude Desktop
AND: User has never used AutoHotkey before
WHEN: User asks "Create a simple GUI with a button"
THEN: ahk-mcp injects GUI module context
AND: Claude generates v2-compliant GUI code
AND: Code includes proper event handling
AND: User can run script via AHK_Run_Script
AND: Window detection confirms GUI appeared
AND: Response time <3 seconds total
```

---

### Scenario 2: Experienced Developer - Code Analysis

```gherkin
GIVEN: Developer has existing .ahk file with 500 lines
AND: File uses some v1 patterns
WHEN: Developer requests code analysis via AHK_Analyze_Code
THEN: All v1 syntax violations detected
AND: Diagnostics include line numbers
AND: Fix suggestions provided
AND: Response includes severity levels (error/warning/info)
AND: Analysis completes in <2 seconds
```

---

### Scenario 3: Migration Use Case - v1 to v2 Conversion

```gherkin
GIVEN: User provides v1 code snippet with `Gui, Add, Button`
WHEN: User asks to convert to v2
THEN: ahk-mcp identifies v1 command syntax
AND: Claude provides v2 equivalent: `myGui.AddButton(...)`
AND: Explanation of object-based GUI in v2
AND: Links to relevant documentation
AND: Example shows complete working code
```

---

### Scenario 4: Multi-Turn Editing Session

```gherkin
GIVEN: User created GUI script in previous turn
AND: Active file set to script.ahk
WHEN: User says "Add a second button below the first"
THEN: ahk-mcp uses active file (no path needed)
AND: Edit tool locates first button position
AND: Inserts second button with proper spacing
AND: Preserves existing event handlers
AND: Script runs successfully after edit
```

---

### Scenario 5: Documentation Lookup

```gherkin
GIVEN: User asks "What parameters does FileRead accept?"
WHEN: AHK_Doc_Search executed with query "FileRead"
THEN: Returns FileRead function signature
AND: Lists all parameters with descriptions
AND: Includes return value information
AND: Provides usage example
AND: Response time <500ms
```

---

## Quality Assurance

### Testing Strategy

1. **Unit Tests** (80%+ coverage)
   - Pure functions (search, parsing, validation)
   - Schema validation
   - Data transformations

2. **Integration Tests**
   - Tool execution with real AHK processes
   - File system operations
   - Window detection

3. **E2E Tests**
   - Full MCP message flow (client → server → AHK)
   - Multi-turn conversations
   - Error recovery

4. **Performance Tests**
   - Documentation search benchmarks
   - Memory leak detection (long-running server)
   - Concurrent tool execution

---

### Review Checklist

Before marking this spec complete, verify:

- [ ] All problem statements clearly defined
- [ ] User personas represent real use cases
- [ ] Functional requirements are testable
- [ ] Success criteria are measurable
- [ ] Non-functional requirements have targets
- [ ] Out-of-scope items explicitly listed
- [ ] No ambiguous requirements remain
- [ ] Acceptance scenarios cover happy paths and edge cases
- [ ] Technical constraints documented
- [ ] Future enhancements separated from v2.0.0 scope

---

## Glossary

| Term | Definition |
|------|------------|
| **MCP** | Model Context Protocol - Standard for AI assistant tool integration |
| **AHK** | AutoHotkey - Windows automation scripting language |
| **v1 / v2** | AutoHotkey versions 1 and 2 (incompatible syntax) |
| **Active File** | Currently focused .ahk file for tool operations |
| **Module Routing** | Keyword-based injection of specialized documentation |
| **Window Detection** | Polling to verify GUI window creation |
| **FlexSearch** | Fast full-text search library |
| **Zod** | TypeScript schema validation library |
| **PID** | Process ID for tracking child processes |
| **Stdio** | Standard input/output (MCP transport) |
| **SSE** | Server-Sent Events (HTTP streaming MCP transport) |

---

## Document Metadata

**For AI Agent Processing:**

When generating implementations from this spec:

1. **Prioritize constitutional compliance** - Check .specify/memory/constitution.md
2. **Focus on testability** - Every requirement must be verifiable
3. **Preserve modularity** - One tool per file, no circular deps
4. **Validate with Zod** - All inputs require schema validation
5. **Error handling** - Always include `isError: true` in error responses

**Key Constraints for Code Generation:**
- TypeScript strict mode (no `any` types without justification)
- AutoHotkey v2 syntax only (no v1 patterns)
- MCP-compliant responses (content array format)
- Cross-platform compatibility (Windows/macOS/Linux)

---

*This specification is the authoritative source of truth for what ahk-mcp IS and WHY it exists. For technical implementation details, see plan.md.*
