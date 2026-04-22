# Tool Consolidation and Description Overhaul

**Status:** Design approved, awaiting implementation plan **Date:** 2026-04-22
**Scope:** `src/tools/`, `src/core/tool-registry.ts`, `docs/`

## Problem

The MCP advertises 35 tools. Several clusters have near-duplicate shapes that
confuse LLM clients and waste schema tokens:

- **Analyze family (four overlapping tools):** `AHK_Analyze`,
  `AHK_Analyze_Unified`, `AHK_Diagnostics`, `AHK_LSP` all accept `code` or
  `filePath` and return analysis results. `AHK_Analyze_Unified` already has a
  `mode` parameter, but the other three still exist independently. Models have
  no principled basis to pick.
- **File edit family:** `AHK_File_Edit_Advanced` claims to be the "primary" file
  editor while `AHK_File_Edit` also does. `_Advanced` takes a prose
  `changes: string` instead of structured operations — an anti-pattern that
  encourages the model to describe edits in English rather than emit structured
  ops.
- **Description quality:** Many tool descriptions are literally the tool name in
  title case (e.g. `"Ahk analyze"`, `"Ahk diagnostics"`,
  `"Ahk context injector"`). These teach the model nothing about when to pick
  the tool.

**Observed impact:** The user reports (1) models picking the wrong tool from the
analyze family, (2) token bloat from the redundant tool surface.

## Goals

1. Collapse the analyze family to one tool with a clear mode set.
2. Delete the `AHK_File_Edit_Advanced` anti-pattern.
3. Reclassify `AHK_Summary` (it is a reference dump, not analysis).
4. Apply a consistent description template to every remaining tool.
5. Keep existing MCP configs working through a one-release alias window.

## Non-Goals

- No changes to the docs-family tools (`AHK_Context_Injector`,
  `AHK_Sampling_Enhancer`, `AHK_Prompts`, `AHK_Doc_Search`) in this pass. They
  need their own review; flagged for a follow-up spec.
- No changes to the compiler, DBGp, or LSP subsystem internals.
- No changes to the smart orchestrator. Whether it's still needed after
  consolidation is a separate question.
- No new tools added.

## Design

### Consolidation Map

| Action     | Tools                                                                               | Result                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Merge**  | `AHK_Analyze`, `AHK_Analyze_Unified`, `AHK_Diagnostics`, `AHK_LSP`                  | Single `AHK_Analyze` with `mode` parameter                                                                                     |
| **Delete** | `AHK_File_Edit_Advanced`                                                            | Gone. `changes: string` prose-edit pattern is removed entirely. Callers use `AHK_File_Edit` with structured ops.               |
| **Rename** | `AHK_Summary` -> `AHK_Reference`                                                    | Signals that this is a docs dump, not analysis. Moved from `src/tools/ahk-analyze-summary.ts` to `src/tools/ahk-reference.ts`. |
| **Keep**   | `AHK_File_Edit`, `AHK_File_Edit_Small`, `AHK_File_Edit_Diff`, `AHK_VSCode_Problems` | Distinct purposes, no overlap                                                                                                  |

**Expected tool count:** 35 -> 31 after this pass.

### `AHK_Analyze` Mode Parameter

Three modes, each mapped to a distinct user intent:

| mode                    | Intent                    | Behavior                                                                                  |
| ----------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| `diagnostics` (default) | "What's broken?"          | Fast pass: syntax + basic lint. No Claude standards, no complexity analysis.              |
| `full`                  | "Review this thoroughly." | Deep pass: syntax + lint + Claude standards + complexity.                                 |
| `fix`                   | "Fix it."                 | Runs `full` analysis, applies fixes per `fixLevel`, returns patched code. Write-adjacent. |

**Discarded modes** (from the existing `AHK_Analyze_Unified` set):

- `quick` and `deep` — collapsed into `diagnostics` and `full`.
- `complete` — synonym for `full`.
- `vscode` — moved out. `AHK_VSCode_Problems` already exists with the right
  input shape.

**Arg schema:**

```ts
export const AhkAnalyzeArgsSchema = z.object({
  // Input precedence: code > filePath > active file. At least one source must resolve.
  code: z.string().min(1).optional(),
  filePath: z.string().optional(),

  mode: z.enum(['diagnostics', 'full', 'fix']).default('diagnostics'),

  severity: z.enum(['error', 'warning', 'info', 'all']).default('all'),
  maxIssues: z.number().int().positive().optional(),
  summaryOnly: z.boolean().default(false),

  // mode='fix' only
  fixLevel: z.enum(['safe', 'aggressive', 'style-only']).default('safe'),
  returnFixedCode: z.boolean().default(true),

  enableClaudeStandards: z.boolean().default(true),
  includeDocumentation: z.boolean().default(true),
  analyzeComplexity: z.boolean().default(false),
  bypassCache: z.boolean().default(false),
});
```

**Input precedence:** `code` wins over `filePath`; `filePath` wins over the
active file. If both `code` and `filePath` are provided, `code` is used and a
warning is logged. If neither is provided and no active file is set, return a
validation error.

### Description Template

Every tool's description follows this exact shape:

```
<1-2 sentences: what it does and what it returns.>

Use when:
  - <concrete trigger>
  - <concrete trigger>

Don't use when:
  - <nearest alternative tool> -> use <that tool>
  - <another edge case>

Example: <one realistic call as JSON>
```

**Rationale:**

- "Use when" gives the model a decision test, not prose to interpret.
- "Don't use when" is the single most useful field for eliminating neighbor-tool
  confusion.
- One example keeps schema token cost low while grounding the model on the
  argument shape.

**Worked example — `AHK_Analyze`:**

```
Statically analyze AutoHotkey v2 code for syntax errors, style issues, and semantic problems. Returns diagnostics with line, column, and severity.

Use when:
  - You need to check a script for errors before running it.
  - The user pastes AHK code and asks what's wrong with it.
  - A script fails at runtime and you want static findings first.

Don't use when:
  - You need to actually execute the script -> use AHK_Run.
  - You need runtime behavior validation -> use AHK_Cloud_Validate.
  - The input is a VS Code Problems JSON dump -> use AHK_VSCode_Problems.

Example: { "filePath": "C:/scripts/app.ahk", "mode": "full" }
```

**Scope of rewrite:** all 31 remaining tools. Non-negotiable fields: purpose
sentence, "Use when", "Don't use when". Example is required but can be trivial
for input-less tools.

### Aliases and Migration

Old tool names are registered as hidden forwarders in
`src/core/tool-registry.ts`. They do not appear in `tools/list` responses (so
LLMs don't see them and can't pick them), but they resolve and execute for any
caller that hardcodes the old name.

| Old name                 | Forwards to     | Argument translation                                                                                                                                              |
| ------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AHK_Diagnostics`        | `AHK_Analyze`   | `mode = "diagnostics"`, pass `severity`, `enableClaudeStandards`, `bypassCache` through                                                                           |
| `AHK_LSP` (mode=analyze) | `AHK_Analyze`   | `mode = "diagnostics"`                                                                                                                                            |
| `AHK_LSP` (mode=fix)     | `AHK_Analyze`   | `mode = "fix"`, pass `fixLevel`, `returnFixedCode` through                                                                                                        |
| `AHK_Analyze_Unified`    | `AHK_Analyze`   | Map old modes: `quick -> diagnostics`, `deep -> full`, `complete -> full`, `fix -> fix`. Reject `vscode` with an error directing caller to `AHK_VSCode_Problems`. |
| `AHK_Summary`            | `AHK_Reference` | No arg changes (empty schema).                                                                                                                                    |
| `AHK_File_Edit_Advanced` | Error           | Return a structured error directing callers to `AHK_File_Edit`. No translation attempted — prose-edit semantics don't map to structured ops.                      |

**Each alias call logs a one-line deprecation warning** including the old name
and the replacement.

**Deprecation window:** 30 days from merge, then aliases are deleted.

### Error Handling

No new error paths. All changes preserve existing validation behavior via
`safeParse`. Input-exclusivity enforcement (code XOR filePath) uses the existing
pattern from `ahk-analyze-complete.ts`.

### Testing

- **Unit tests per mode:** compare new `AHK_Analyze` output against the legacy
  tool for each mode: `diagnostics` vs. old `AHK_Diagnostics`, `full` vs. old
  `AHK_Analyze` (default settings), `fix` vs. old `AHK_LSP` with `mode=fix`.
  Output shape must match field-for-field; diagnostic content may differ only if
  the underlying analyzer behavior changes (it should not in this spec). Use
  fixtures from existing analyze tests.
- **Alias forwarding tests:** one test per alias confirming the old name returns
  identical output to calling the new tool directly with translated args.
- **Alias rejection test:** calling `AHK_File_Edit_Advanced` returns the
  structured migration error.
- **Integration suite:** run the existing Jest integration suite. Any test that
  calls a renamed tool will surface the migration gap.
- **Manual smoke:** feed a known-broken script to each mode in Claude Desktop;
  confirm descriptions lead the model to pick the right mode.

### Docs Update

60+ docs files reference the old tool names. A find-and-replace pass updates:

- `AHK_Diagnostics` -> `AHK_Analyze` (mode=diagnostics)
- `AHK_LSP` -> `AHK_Analyze` (mode appropriate)
- `AHK_Analyze_Unified` -> `AHK_Analyze`
- `AHK_Summary` -> `AHK_Reference`
- Remove all mentions of `AHK_File_Edit_Advanced`

Human review of the find-and-replace diff is required — some mentions may be in
changelogs or historical notes that should stay untouched.

## Out of Scope for This Spec

These surfaced during brainstorming but are deferred:

1. **Docs family consolidation** — `AHK_Context_Injector`,
   `AHK_Sampling_Enhancer`, `AHK_Prompts`, `AHK_Doc_Search` likely overlap.
   Needs its own design pass.
2. **Orchestrator fate** — `AHK_Smart_Orchestrator` may not be needed after this
   consolidation reduces confusion. Revisit after merge.
3. **Docs directory cleanup** — `docs/` has 60+ files with apparent overlap and
   stale content. Separate cleanup task.
4. **Compiler scope** — whether the custom compiler should exist at all given
   `ahk2exe` is a separate question.

## Open Questions

- **`AHK_File_Edit_Advanced` hard-error vs silent-forward:** the spec chose
  hard-error because the prose-edit semantics don't map cleanly. If a real
  caller base exists, revisit.
- **`AHK_Summary` rename:** the new name `AHK_Reference` is a placeholder.
  `AHK_Builtins` or `AHK_Cheatsheet` may fit better. Finalized in
  implementation.
