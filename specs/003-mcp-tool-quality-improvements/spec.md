# Feature Specification: MCP Tool Quality Improvements

**Feature Branch**: `003-mcp-tool-quality-improvements`
**Created**: 2025-10-03
**Status**: Draft
**Input**: User description: "Improve MCP tool usability with better parameter naming, debug visibility, dry-run safety, and enhanced documentation"

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature involves improving existing MCP tools
2. Extract key concepts from description
   → Actors: MCP tool users (developers using Claude/AI assistants)
   → Actions: Call tools with parameters, debug issues, preview changes, understand tool usage
   → Data: Tool parameters, orchestration logs, operation previews
   → Constraints: Backward compatibility, no breaking changes to existing integrations
3. Unclear aspects marked with [NEEDS CLARIFICATION]
4. User scenarios filled based on current tool pain points
5. Functional requirements derived from 4 improvement areas
6. Key entities identified (tool parameters, debug output)
7. Review checklist completed
8. SUCCESS: Spec ready for planning
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
A developer using an AI assistant to edit AutoHotkey files needs to:
1. Understand what each tool parameter does without trial-and-error
2. See why certain orchestration decisions were made when debugging
3. Preview destructive operations before committing changes
4. Learn tool capabilities through examples in descriptions

**Current Pain Points**:
- Parameter `content` is confusing (sounds generic, unclear when to use vs other params)
- When orchestration makes unexpected tool calls, no visibility into why
- Editing operations are immediate with no preview, risky for production files
- Tool descriptions lack concrete usage examples

### Acceptance Scenarios

#### Scenario 1: Clear Parameter Naming
1. **Given** a developer wants to replace text in a file
2. **When** they review the tool schema
3. **Then** parameter name clearly indicates it contains the new/replacement text (not ambiguous "content")

#### Scenario 2: Debug Mode Visibility
1. **Given** `AHK_Smart_Orchestrator` makes 4 tool calls unexpectedly
2. **When** developer enables debug mode
3. **Then** output shows: "Cache MISS → analyzing file", "Found 3 classes → targeting first", "Edit mode → setting active file"

#### Scenario 3: Dry-Run Safety
1. **Given** developer wants to replace all occurrences of a pattern
2. **When** they add `dryRun: true` to the edit command
3. **Then** system shows: "Would replace 47 occurrences in 12 files: [file list]" without making changes

#### Scenario 4: Example-Rich Documentation
1. **Given** developer is new to the MCP server
2. **When** they read tool descriptions
3. **Then** they see 2-3 concrete examples showing common usage patterns

### Edge Cases
- What happens when debug output is extremely verbose (>10K chars)?
  - Truncate with "...show more" indicator
- How does dry-run handle cascading operations (edit → analyze → run)?
  - Shows full operation chain with "Would execute: X → Y → Z"
- What if backward compatibility breaks for existing tool consumers?
  - Old parameter names must still work (aliased to new names)

## Requirements

### Functional Requirements

#### FR-001: Descriptive Parameter Naming
- **FR-001.1**: Tool parameter `content` MUST be renamed to `newContent` to clarify it contains replacement/new text
- **FR-001.2**: System MUST support old parameter name `content` as alias for backward compatibility
- **FR-001.3**: Tool schemas MUST show both parameter names with deprecation notice for old name
- **FR-001.4**: Parameter descriptions MUST include usage example (e.g., "newContent: The text to insert. Example: 'class MyClass {'")

#### FR-002: Debug Mode
- **FR-002.1**: All orchestrator tools MUST accept optional `debugMode: boolean` parameter (default: false)
- **FR-002.2**: When debug enabled, output MUST include orchestration decision log showing:
  - Each tool call made
  - Why that tool was called
  - Cache hit/miss reasons
  - Entity targeting decisions
- **FR-002.3**: Debug output MUST be clearly separated from normal output with markers (e.g., "🔍 DEBUG:")
- **FR-002.4**: Debug information MUST be truncated when it exceeds 5,000 characters (configurable limit)

#### FR-003: Dry-Run Mode
- **FR-003.1**: All destructive tools (edit, delete, replace) MUST accept optional `dryRun: boolean` parameter (default: false)
- **FR-003.2**: When dry-run enabled, system MUST:
  - Preview changes without modifying files
  - Show affected files/lines count
  - Display before/after diff for first 3 changes
- **FR-003.3**: Dry-run output MUST clearly state "DRY RUN - No changes made"
- **FR-003.4**: Dry-run MUST work with `all: true` flag to preview batch operations

#### FR-004: Enhanced Tool Descriptions
- **FR-004.1**: Every tool description MUST include 2-3 concrete usage examples
- **FR-004.2**: Examples MUST cover:
  - Common use case (80% usage)
  - Edge case or advanced feature
  - Error scenario or what to avoid
- **FR-004.3**: Examples MUST use realistic file paths and code snippets
- **FR-004.4**: Tool descriptions MUST include "See also: [related tools]" section

### Non-Functional Requirements
- **NFR-001**: Changes MUST NOT break existing tool consumers
- **NFR-002**: Debug output MUST NOT impact performance by >10ms per operation
- **NFR-003**: Dry-run preview generation MUST complete in <100ms for files up to 10K lines
- **NFR-004**: Parameter name changes MUST maintain JSON schema compatibility

### Key Entities

**ToolParameter**:
- Name (primary + optional aliases)
- Description (with inline example)
- Type and validation rules
- Deprecation status

**DebugLog**:
- Timestamp
- Tool called
- Decision rationale
- Cache status
- Duration

**DryRunPreview**:
- Affected files list
- Change count per file
- Sample diffs (first N changes)
- Operation summary

**ToolDocumentation**:
- Description (what it does)
- Usage examples (2-3 scenarios)
- Related tools references
- Common pitfalls

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded (4 specific improvements)
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (2 NEEDS CLARIFICATION items)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed (pending clarifications)

---

## Decision Log

1. **Debug output truncation**: Maximum debug log length set to 5,000 characters (configurable via tool settings).

2. **Dry-run diff samples**: Dry-run previews display the first 3 before/after examples by default.

---
