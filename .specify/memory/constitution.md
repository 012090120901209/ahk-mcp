# AutoHotkey v2 MCP Server - Constitution

## Preamble

This constitution establishes the architectural principles and development standards for the AutoHotkey v2 MCP Server. All code changes and feature additions must comply with these articles.

**Last Updated:** October 1, 2025
**Status:** Active
**Version:** 1.0.0

---

## Article I: Type Safety and Validation

All production code **SHALL** be written in TypeScript with strict mode enabled.

Tool parameters **MUST** be validated with Zod schemas before execution.

Runtime type errors **SHALL** be caught and returned as MCP error responses with `isError: true` flag.

**Rationale:** Type safety prevents entire classes of bugs and provides better IDE support for contributors. Zod provides runtime validation that TypeScript cannot guarantee.

**Example:**
```typescript
export const ToolArgsSchema = z.object({
  filePath: z.string(),
  action: z.enum(['read', 'write'])
});

export type ToolArgs = z.infer<typeof ToolArgsSchema>;
```

---

## Article II: MCP Protocol Compliance

The server **SHALL** implement the Model Context Protocol specification.

All tools **MUST** return content in standardized MCP format: `{ content: [...], isError?: boolean }`.

Stdio transport **MUST** be the primary interface; SSE (Server-Sent Events) is secondary.

**Rationale:** MCP is the standard protocol for AI assistant integration. Stdio works with Claude Desktop/Code; SSE enables web clients.

**Required Response Format:**
```typescript
return {
  content: [
    { type: 'text', text: 'Success message' },
    { type: 'text', text: JSON.stringify(data, null, 2) }
  ],
  isError: false // or true for errors
};
```

---

## Article III: AutoHotkey v2 Purity

Scripts **MUST** use `.ahk` extension (never `.ahv`).

All code generation **SHALL** use AutoHotkey v2 syntax exclusively.

No AutoHotkey v1 patterns **SHALL** be suggested or generated.

File path validation **MUST** check `.toLowerCase().endsWith('.ahk')` (case-insensitive).

**Rationale:** AutoHotkey v2 is the current version. v1 compatibility adds complexity and confuses users. The `.ahv` extension is a legacy artifact.

**Validation Pattern:**
```typescript
if (!filePath.toLowerCase().endsWith('.ahk')) {
  throw new Error(`File must have .ahk extension: ${filePath}`);
}
```

---

## Article IV: Test-First Development

New features **MUST** have tests written before implementation.

Integration tests **SHALL** use real AutoHotkey v2 processes where applicable.

Test coverage **SHOULD** exceed 80% for core functionality.

**Rationale:** Tests document expected behavior and prevent regressions. Integration tests catch issues that unit tests miss (process management, window detection, etc.).

**Testing Hierarchy:**
1. Unit tests for pure functions
2. Integration tests for tool execution
3. E2E tests for full MCP workflows

---

## Article V: Context Intelligence

Documentation search **MUST** use FlexSearch for performance.

Context injection **SHALL** be keyword-driven with module routing.

Module routing rules **MUST** be transparent and documented in `Module_Instructions.md`.

Search results **SHALL** include relevance scores and be sorted by score.

**Rationale:** Fast, intelligent context is the core value proposition. FlexSearch provides 10x faster search than linear scanning. Module routing ensures AI agents get the right context without asking.

**Module Routing Example:**
- Keywords: "gui", "button", "window" → Load `Module_GUI.md`
- Keywords: "array", "loop", "map" → Load `Module_Arrays.md`

---

## Article VI: Process Isolation and Management

External processes **MUST** be tracked with PID management using `Map<number, ProcessInfo>`.

Cleanup handlers **SHALL** ensure graceful shutdown with SIGTERM followed by SIGKILL after timeout.

Process timeouts **SHALL** be configurable with sane defaults (30s for scripts, 5min for tests).

**Rationale:** Zombie processes and resource leaks harm user experience. Proper cleanup prevents system resource exhaustion.

**Process Lifecycle:**
```typescript
// Track process
runningProcesses.set(pid, { startTime, scriptPath, childProcess });

// Cleanup on exit
process.on('SIGTERM', async () => {
  await killRunningProcesses(); // Try SIGTERM first, then SIGKILL
  process.exit(0);
});
```

---

## Article VII: Security and Path Safety

File paths **MUST** be validated and normalized with `path.resolve()`.

Extension validation **SHALL** be case-insensitive.

Path traversal attacks **SHALL** be prevented through validation.

Files **MUST** exist before operations unless `allowCreate` option is explicitly enabled.

**Rationale:** File system access is a security-critical operation. Path traversal (e.g., `../../etc/passwd`) must be prevented.

**Shared Validation Function:**
```typescript
export function resolveAndValidateFilePath(
  providedPath?: string,
  options: { requireAhk?: boolean; mustExist?: boolean; allowCreate?: boolean } = {}
): string {
  const targetPath = providedPath || getActiveFilePath();
  if (!targetPath) throw new Error('No file specified');

  const resolved = path.resolve(targetPath);
  if (options.requireAhk && !resolved.toLowerCase().endsWith('.ahk')) {
    throw new Error('File must have .ahk extension');
  }
  if (options.mustExist && !fs.existsSync(resolved)) {
    throw new Error('File not found');
  }

  return resolved;
}
```

---

## Article VIII: Performance and Scalability

Documentation loading **SHALL** use lazy loading patterns.

Analytics **MUST** maintain rolling window (max 1000 metrics) to prevent memory leaks.

Search results **SHOULD** return within 500ms for typical queries.

File watchers **MUST** be cleaned up when no longer needed.

**Rationale:** Performance directly impacts AI agent responsiveness. Memory leaks in long-running servers are unacceptable.

**Performance Patterns:**
- Lazy load documentation: Only load when first search occurs
- Rolling windows: Keep last N items, discard older
- Debouncing: Wait 100ms before processing file changes

---

## Article IX: Modularity and Separation

Each tool **SHALL** be a standalone module with defined schema.

Tools **MUST NOT** have circular dependencies.

Core functionality **SHALL** be separated from tool implementations:
- `src/core/` - Shared utilities (config, active-file, settings)
- `src/tools/` - Individual tool implementations
- `src/compiler/` - AHK v2 language services
- `src/lsp/` - LSP-like capabilities

**Rationale:** Modularity enables independent development and testing. Clear separation prevents spaghetti code.

**Tool Structure:**
```typescript
// 1. Schema definition
export const ToolArgsSchema = z.object({ ... });
export type ToolArgs = z.infer<typeof ToolArgsSchema>;

// 2. Tool definition (for MCP registration)
export const toolDefinition = { name, description, inputSchema };

// 3. Tool implementation
export class Tool {
  async execute(args: ToolArgs): Promise<MCPResponse> { ... }
}
```

---

## Article X: User Experience and AI Integration

Error messages **SHALL** be informative and actionable with clear next steps.

Tool descriptions **MUST** be optimized for AI agent selection (focus on capabilities, not implementation).

Active file context **SHALL** be displayed in file operation tools.

Progress indicators **SHOULD** be used for long-running operations.

**Rationale:** AI agents select tools based on descriptions; clarity matters. Users need to understand what's happening, especially for file edits.

**Good vs Bad Tool Descriptions:**

❌ Bad:
```
"Edits AHK files using advanced algorithms"
```

✅ Good:
```
"Edit AutoHotkey v2 files with find/replace, regex support, and multi-line search.
Validates changes and creates backups. Use for targeted edits to specific sections."
```

---

## Article XI: Naming Conventions

All MCP tools **SHALL** use `AHK_<Category>_<Action>` naming pattern with underscores.

**Categories:**
- `AHK_File_*` - File operations (View, Edit, Active, Detect, Recent)
- `AHK_Analyze_*` - Code analysis (Code, Diagnostics, Complete, Summary, LSP, VSCode)
- `AHK_Doc_*` or `AHK_Docs_*` - Documentation (Search, Context, Samples, Prompts)
- `AHK_Run_*` - Script execution (Script, Process, Debug)
- `AHK_System_*` - Server management (Config, Settings, Analytics, Alpha)
- `AHK_Memory_Context` - Memory and context management
- `AHK_Test_*` - Testing tools (Interactive)

**Rationale:** Consistent naming improves tool discovery and selection by AI agents. The `AHK_` prefix prevents naming collisions with other MCP servers.

---

## Article XII: Backward Compatibility

Breaking changes **REQUIRE** major version bump (semantic versioning).

Deprecated features **MUST** be marked for at least one minor version before removal.

Migration guides **SHALL** be provided for breaking changes in `RELEASE_NOTES.md`.

Configuration changes **SHOULD** include automatic migration when possible.

**Rationale:** Stability matters for production deployments. Users need time to adapt to changes.

**Deprecation Process:**
1. Mark feature as deprecated in code comments and logs
2. Add warning to tool response
3. Document in release notes
4. Wait one minor version
5. Remove in next major version

---

## Article XIII: Error Handling and Resilience

All tool errors **MUST** include `isError: true` in response for proper MCP client handling.

Resource cleanup **MUST** occur in try/finally blocks or process handlers.

Regex patterns **SHALL** be validated before constructing RegExp objects.

File operations **SHOULD** create backups before destructive changes.

**Rationale:** Errors happen. Graceful degradation and proper cleanup prevent cascading failures.

**Error Response Pattern:**
```typescript
try {
  // Tool logic
} catch (error) {
  logger.error('Tool error:', error);
  return {
    content: [{
      type: 'text',
      text: `❌ Error: ${error.message}\n\nTip: Check file path and permissions.`
    }],
    isError: true
  };
}
```

---

## Article XIV: Active File System

An active file path **SHALL** be maintained across tool invocations using singleton pattern.

Tools **MAY** use the active file when no explicit path is provided.

Active file detection **SHALL** respect `allowFileDetection` setting.

Active file changes **MUST** be persisted to configuration for session recovery.

**Rationale:** Active file tracking provides context across multiple tool calls. Users don't need to repeat file paths.

**Shared Active File Manager:**
```typescript
// Get active file or use provided path
const targetPath = providedPath || getActiveFilePath();

// Auto-detect from text (if enabled)
detectFileInText(userMessage);
```

---

## Amendment Process

Constitutional amendments require:

1. **Proposal** with clear rationale in GitHub issue
2. **Review** by maintainers with feedback period (7 days minimum)
3. **Approval** by unanimous consent or 2/3 majority vote
4. **Documentation** update to this file with version bump
5. **Git tag** marking the constitutional change

**Version History:**
- v1.0.0 (2025-10-01): Initial constitution established

---

## Enforcement

**During Development:**
- Code reviews SHALL verify constitutional compliance
- CI/CD MAY include automated checks for common violations
- Pull requests that violate articles SHALL be rejected with explanation

**Exceptions:**
- Emergency security fixes MAY bypass some articles with post-hoc justification
- Experimental features in `src/tools/ahk-system-alpha.ts` have relaxed requirements
- Backward compatibility (Article XII) takes precedence over other articles when in conflict

---

## Summary of Non-Negotiable Principles

1. ✅ **Type Safety:** TypeScript strict mode + Zod validation
2. ✅ **MCP Compliance:** Standard protocol, error flags
3. ✅ **AHK v2 Only:** No v1 syntax, `.ahk` extension required
4. ✅ **Test-First:** Tests before implementation
5. ✅ **Context Intelligence:** FlexSearch + module routing
6. ✅ **Process Management:** PID tracking + graceful cleanup
7. ✅ **Security:** Path validation + case-insensitive checks
8. ✅ **Performance:** Lazy loading + rolling windows
9. ✅ **Modularity:** Standalone tools, no circular deps
10. ✅ **UX:** Clear errors + AI-optimized descriptions
11. ✅ **Naming:** `AHK_Category_Action` pattern
12. ✅ **Compatibility:** Semantic versioning + migration guides
13. ✅ **Error Handling:** `isError: true` + cleanup
14. ✅ **Active File:** Singleton pattern + persistence

---

*This constitution serves as the single source of truth for ahk-mcp development standards.*
