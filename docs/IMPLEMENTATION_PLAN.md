# AutoHotkey v2 MCP Server - Implementation Plan

This document contains the original planning documentation from the `.kiro`
specifications.

## 📋 Original Requirements

From `.kiro/specs/autohotkey-mcp-server/requirements.md`:

### Requirement 1: Language-Server–Style Core Services ✅

**User Story:** As an AutoHotkey developer, I want intelligent completion,
diagnostics, and script analysis so that I can write AHK v2 code faster and with
fewer errors.

#### Acceptance Criteria ✅

1. ✅ `ahk_complete` returns ranked completion candidates for valid cursor
   positions
2. ✅ `AHK_Diagnostics` returns diagnostic objects with line, character,
   message, severity
3. ✅ `AHK_Analyze` with `includeDocumentation=true` embeds inline documentation
4. ✅ Unknown methods flagged with severity `error`
5. ✅ Empty string completion returns empty array
6. ✅ Invalid JSON requests return HTTP 400 with JSON error

### Requirement 2: AutoHotkey-Specific Knowledge Injection (MCP) ✅

**User Story:** As an LLM integrator, I want the server to pass context snippets
(MCP) that re-center the model on AHK v2 semantics so that generated code is
syntactically correct.

#### Acceptance Criteria ✅

1. ✅ Keyword extraction injects context snippets for AHK entities
2. ✅ No relevant keywords triggers "general AHK v2 best-practices" snippet
3. ✅ Context snippets prepended with `###::context::###` header
4. ✅ Ambiguous keywords (e.g., "Map") inject multiple explanations
5. ✅ Excessive context truncated for manageability

### Requirement 3: Built-in Prompt Catalog ✅

**User Story:** As a user, I want to quickly insert reliable AHK v2 script
starters so that I can scaffold new utilities.

#### Acceptance Criteria ✅

1. ✅ Prompt list retrieval returns available prompt names
2. ✅ Prompt selection returns full template content
3. ✅ Prompts versioned with `major.minor.patch` in YAML front-matter
4. ✅ Missing prompt IDs return 404-style JSON error
5. ✅ Template structure validation on load

### Requirement 4: Server Lifecycle & Deployment ✅

**User Story:** As an ops engineer, I want predictable server commands so that I
can build, start, and hot-reload during development.

#### Acceptance Criteria ✅

1. ✅ `npm run build` compiles TypeScript to `dist/` with no errors
2. ✅ Server boots and listens on configurable port
3. ✅ `npm run dev` provides auto-reload on source changes
4. ✅ Port conflicts exit with code 1 and human-readable message
5. ✅ Node version <18 aborts with clear instructions

## 🏗️ Original Implementation Plan

From `.kiro/specs/autohotkey-mcp-server/tasks.md`:

### ✅ Completed Tasks (9/11)

- [x] **1. Set up project structure and core interfaces** ✅
  - ✅ Directory structure for models, services, repositories, API components
  - ✅ TypeScript interfaces for RPC requests/responses, AST nodes, service
    contracts
  - ✅ ESLint, Prettier, and TypeScript configuration files
  - ✅ Package.json with required dependencies and build scripts
  - _Requirements: 4.1, 4.5_

- [x] **2. Implement JSON-RPC 2.0 communication layer** ✅
  - ✅ RPC request/response type definitions and validation schemas
  - ✅ JSON-RPC parser with error handling for malformed requests
  - ✅ Method router dispatching requests to appropriate service handlers
  - ✅ Connection lifecycle management for stdio protocol
  - ✅ Unit tests for RPC layer with valid/invalid request scenarios
  - _Requirements: 1.7, 4.4_

- [x] **3. Build incremental AutoHotkey v2 parser** ✅
  - ✅ AHK v2 grammar rules and tokenization logic
  - ✅ AST node structures and symbol table extraction
  - ✅ Incremental parsing with change-set API for efficient re-parsing
  - ✅ Cache for AST objects
  - ✅ Comprehensive parser tests
  - _Requirements: 1.1, 1.2, 1.6_

- [x] **4. Create completion service with ranking algorithm** ✅
  - ✅ Context analysis for cursor position and surrounding code
  - ✅ Completion candidate generation for built-in functions, classes,
    variables
  - ✅ Simple ranking algorithm prioritizing relevant suggestions
  - ✅ Scope-based variable and method completion
  - ✅ Unit tests validating completion accuracy
  - _Requirements: 1.1, 1.5_

- [x] **5. Implement diagnostic service with rule engine** ✅
  - ✅ Syntax error detection by walking AST and identifying malformed
    constructs
  - ✅ Semantic validation for undefined variables and incorrect method calls
  - ✅ Configurable rule engine with Claude coding standards toggle
  - ✅ Severity mapping (error, warning, info) and diagnostic range calculation
  - ✅ Diagnostic response formatting with line, character, message, severity
    fields
  - ✅ Unit tests covering all diagnostic rules and edge cases
  - _Requirements: 1.2, 1.4_

- [x] **6. Build MCP engine for context injection** ✅
  - ✅ Keyword extraction using simple regex patterns for AHK built-ins
  - ✅ Documentation store loader that reads from existing data files
  - ✅ Context snippet retrieval for relevant entities
  - ✅ Basic truncation policy to keep responses manageable
  - ✅ Context header injection with `###::context::###` markers
  - ✅ Integration tests simulating LLM prompt enhancement scenarios
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] **7. Create prompt catalog service** ✅
  - ✅ YAML front-matter parser for template version metadata
  - ✅ Prompt template loader from existing prompt resources
  - ✅ Prompt list retrieval functionality
  - ✅ Basic template validation for structure and format
  - ✅ Error handling for missing prompt IDs with 404-style responses
  - ✅ Unit tests for prompt catalog functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] **8. Implement server lifecycle and process management** ✅
  - ✅ Server startup script with configurable port
  - ✅ Graceful shutdown handling and basic error recovery
  - ✅ Development mode with auto-reload
  - ✅ Build script that compiles TypeScript to dist/ directory
  - ✅ Simple console logging for debugging
  - ✅ Port conflict detection with human-readable error messages
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] **9. Add basic monitoring and async patterns** ✅
  - ✅ Async processing patterns to prevent blocking operations
  - ✅ Simple error logging and basic health checks
  - ✅ Basic integration tests for core functionality
  - _Requirements: 1.6, 1.5_

### 🔄 Remaining Tasks (2/11)

- [ ] **10. Build comprehensive test suite** (60% Complete)
  - ✅ End-to-end tests simulating client-server RPC communication
  - ✅ Integration tests for all service combinations
  - [ ] Performance regression tests with automated benchmarking
  - [ ] Error scenario tests for all defined error conditions
  - [ ] CI pipeline with automated test execution and validation
  - _Requirements: 1.5, 1.6, 1.7, 2.4, 2.5, 3.4, 3.5, 4.4, 4.5_

- [ ] **11. Create documentation and deployment artifacts** (80% Complete)
  - ✅ API documentation for all RPC methods and parameters
  - ✅ Deployment guide with environment setup instructions
  - [ ] Docker configuration for reproducible deployments
  - ✅ Example client integration code and usage scenarios
  - ✅ Troubleshooting guide for common setup and runtime issues
  - _Requirements: 4.1, 4.2, 4.3_

## 🎯 Auto-Activation Strategy

From `.kiro/steering/autohotkey-mcp-auto-activation.md`:

### Automatic Tool Usage Pattern

When AutoHotkey-related keywords are detected, automatically activate tools:

**Trigger Keywords:**

- autohotkey, ahk, script, automation, macro
- hotkey, gui, clipboard, send, msgbox, tooltip
- window, file, mouse, keyboard, toggle
- A_Clipboard, A_WinDir, A_Now, A_ScreenWidth
- Any .ahk file references or AutoHotkey syntax

**Required Activation Sequence:**

1. **Context Injection First** - `AHK_Context_Injector` with user's prompt
2. **Code Analysis** - `AHK_Analyze` for provided code
3. **Completion Suggestions** - `ahk_complete` for code completion
4. **Error Checking** - `AHK_Diagnostics` for syntax validation
5. **Template Retrieval** - `AHK_Prompts` for relevant templates

## 🏗️ Architecture Overview

From `.kiro/specs/autohotkey-mcp-server/design.md`:

### Component Responsibilities

| Component         | Responsibility                                                 |
| ----------------- | -------------------------------------------------------------- |
| **RPC Layer**     | Parse JSON-RPC, route to handlers, manage connection lifecycle |
| **Parser**        | Incremental AHK v2 grammar, produce AST, expose symbol table   |
| **CompletionSvc** | Compute context, rank suggestions, enforce max-5 rule          |
| **DiagnosticSvc** | Walk AST, apply rule set, map issues to ranges                 |
| **McpEngine**     | Extract keywords, retrieve snippets, apply truncation policy   |
| **PromptCatalog** | Serve versioned templates with YAML metadata                   |
| **DocStore**      | Cache documentation, functions, classes, variables             |

### Performance Targets

- **Completion Service**: P95 latency ≤150ms
- **AST Cache**: LRU with 20-file limit
- **Memory Usage**: 512MB heap limit
- **Connection Timeout**: 30s
- **Context Truncation**: 4KB limit per snippet

### Error Handling Strategy

| Error Type             | Response                          | Recovery                           |
| ---------------------- | --------------------------------- | ---------------------------------- |
| Invalid JSON request   | HTTP 400, error code `BadRequest` | Client resends after correction    |
| Parser failure         | Diagnostic with severity `error`  | Highlight offending span in editor |
| Service timeout (≥5 s) | JSON-RPC error `Timeout`          | Client may retry once; log warning |
| Missing documentation  | Empty result with warning         | Continue with available data       |
| Cache overflow         | LRU eviction, log info            | Transparent to client              |

---

_This document preserves the original planning specifications from the .kiro
folder._ _For current project status, see PROJECT_STATUS.md_ _For coding
assistance, see CLAUDE.md_
