# GitHub Spec Kit Integration - ahk-mcp

This directory contains the **Specification-Driven Development** framework for the AutoHotkey v2 MCP Server, following GitHub's Spec Kit methodology.

## Directory Structure

```
.specify/
├── memory/
│   └── constitution.md          # Project governance - 14 non-negotiable principles
├── specs/
│   ├── ahk-mcp-master-spec.md   # Master specification (WHAT and WHY)
│   ├── ahk-mcp-technical-plan.md # Technical implementation plan (HOW)
│   └── architecture-decisions.md # ADR log (15 documented decisions)
├── templates/
│   ├── spec-template.md         # Template for new feature specs
│   ├── plan-template.md         # Template for implementation plans
│   └── tasks-template.md        # Template for task breakdowns
├── archive/                     # Completed specs (moved here post-release)
└── README.md                    # This file
```

## Quick Start

### For New Contributors

1. **Read the Constitution**: `memory/constitution.md`
   - Understand the 14 non-negotiable principles
   - Check Article IV (Test-First Development) - most important!

2. **Review Existing Specs**: `specs/ahk-mcp-master-spec.md`
   - Understand what the system does and why
   - See the vision and problem statements

3. **Study Architecture Decisions**: `specs/architecture-decisions.md`
   - Learn from past technical choices
   - Understand the "why" behind the codebase

### For New Features

Follow the **Spec Kit Workflow**:

#### 1. Specify (WHAT and WHY)

Create a new specification using the template:

```bash
# Copy template
cp .specify/templates/spec-template.md .specify/specs/my-feature-spec.md

# Fill out:
# - Executive Summary
# - Problem Statement
# - User Personas & Journeys
# - Functional Requirements
# - Success Metrics
```

**Focus on:**
- WHAT users need
- WHY this solves their problem
- Avoid HOW (no technical details yet)

#### 2. Plan (HOW)

Create an implementation plan:

```bash
# Copy template
cp .specify/templates/plan-template.md .specify/specs/my-feature-plan.md

# Fill out:
# - Constitutional Compliance Check
# - Architecture Overview
# - Technology Decisions (with rationale)
# - Component Design
# - Integration Points
```

**Key Questions:**
- Does this violate the constitution? (if yes, document exception)
- What are the trade-offs?
- Why this approach over alternatives?

#### 3. Tasks (Breakdown)

Create a task breakdown:

```bash
# Copy template
cp .specify/templates/tasks-template.md .specify/specs/my-feature-tasks.md

# Fill out:
# - Phase-by-phase implementation plan
# - Test-first approach (RED-GREEN-Refactor)
# - Dependencies and risk tracking
```

**Important:**
- Tasks MUST follow test-first order (Constitution Article IV)
- Contract tests → Integration tests → E2E tests → Unit tests → Implementation

#### 4. Implement

Follow the tasks, updating status as you go:

```bash
# See available spec kit commands
npm run spec:new      # Reminder to use spec template
npm run spec:plan     # Reminder to use plan template
npm run spec:tasks    # Reminder to use tasks template
npm run spec:review   # Reminder to check constitution
```

## Constitutional Framework

The **constitution** defines 14 immutable principles that govern all development:

### Core Articles (Summary)

1. **Type Safety** - TypeScript strict mode + Zod validation
2. **MCP Compliance** - Standard protocol, error flags
3. **AHK v2 Purity** - No v1 syntax, `.ahk` extension required
4. **Test-First** - Tests before implementation (RED-GREEN-Refactor)
5. **Context Intelligence** - FlexSearch + module routing
6. **Process Isolation** - PID tracking + graceful cleanup
7. **Security** - Path validation + case-insensitive checks
8. **Performance** - Lazy loading + rolling windows
9. **Modularity** - Standalone tools, no circular deps
10. **UX** - Clear errors + AI-optimized descriptions
11. **Naming** - `AHK_Category_Action` pattern
12. **Compatibility** - Semantic versioning + migration guides
13. **Error Handling** - `isError: true` + cleanup
14. **Active File** - Singleton pattern + persistence

**Enforcement:**
- Code reviews verify compliance
- Pull requests that violate articles are rejected
- Exceptions require documented justification

## Architecture Decision Records (ADR)

All major technical decisions are documented with rationale:

### Key ADRs

- **ADR-001**: Why TypeScript over JavaScript
- **ADR-002**: Why Zod for schema validation
- **ADR-003**: Why FlexSearch for documentation search (10x faster)
- **ADR-004**: Why three edit tools instead of one
- **ADR-005**: Why singleton pattern for active file
- **ADR-006**: Why PowerShell polling for window detection
- **ADR-007**: Why module routing for context injection
- **ADR-008**: Why MCP protocol with stdio/SSE
- **ADR-009**: Why PID tracking for process management
- **ADR-010**: Why rolling window analytics (prevent memory leaks)
- **ADR-011**: Why `AHK_*` tool naming convention
- **ADR-012**: Why `isError: true` flag in responses
- **ADR-013**: Why shared file resolution helper
- **ADR-014**: Why lazy documentation loading
- **ADR-015**: Why case-insensitive extension validation

Each ADR includes:
- Context (the problem)
- Decision (the solution)
- Rationale (why this way)
- Consequences (trade-offs)
- Alternatives (what was rejected and why)

## Master Specification

**File**: `specs/ahk-mcp-master-spec.md`

Comprehensive specification documenting:
- Vision & Mission
- Problems Solved (5 major pain points)
- User Personas & Journeys
- Functional Requirements (FR-001 through FR-010)
- Non-Functional Requirements (performance, security, reliability)
- Key Entities & Data Models
- Success Metrics
- Out of Scope (explicit non-goals)
- Acceptance Scenarios

**Purpose**: This is the "source of truth" for WHAT the system does and WHY.

## Technical Plan

**File**: `specs/ahk-mcp-technical-plan.md`

Detailed implementation plan covering:
- Architecture Overview (with diagrams)
- Technology Decisions (9 major choices with rationale)
- Component Design (5 layers)
- Data Flow (4 critical flows documented)
- Implementation Phases (Phase 0-4 complete)
- Testing Strategy (unit/integration/E2E/performance)
- Performance Optimization (4 optimizations documented)
- Security Model (threat model + mitigations)
- Deployment Strategy

**Purpose**: This documents HOW the system is implemented and WHY each technical choice was made.

## Workflow Examples

### Example 1: Adding a New MCP Tool

```markdown
## 1. Specification Phase

**File**: `.specify/specs/advanced-refactoring-spec.md`

### Executive Summary
Enable AI agents to perform complex code refactoring operations on AutoHotkey v2 scripts with safety guarantees.

### Problem Statement
Current edit tools are limited to simple find/replace. Users need:
- Extract function from selection
- Rename symbol across project
- Convert procedural to OOP

[... complete the spec template ...]

## 2. Planning Phase

**File**: `.specify/specs/advanced-refactoring-plan.md`

### Constitutional Compliance
- ✅ Article I: Uses TypeScript + Zod
- ✅ Article III: AHK v2 only
- ⚠️ Article IX: Requires new shared AST parser (document as exception)

### Technology Decisions

#### Decision 1: Use TypeScript Compiler API Pattern
**Chosen**: Recursive descent parser with visitor pattern
**Rationale**:
1. Well-understood pattern
2. Easy to extend
3. Testable

[... complete the plan template ...]

## 3. Task Breakdown Phase

**File**: `.specify/specs/advanced-refactoring-tasks.md`

### Phase 1: Contract Tests (Week 1)
- [ ] Task 1.1: Define Zod schema
- [ ] Task 1.2: Write contract tests (FAIL)
- [ ] Task 1.3: Implement minimal tool (PASS)

### Phase 2: AST Parser (Week 2)
- [ ] Task 2.1: Write parser tests (FAIL)
- [ ] Task 2.2: Implement parser (PASS)

[... complete the tasks template ...]

## 4. Implementation

Follow tasks in order, marking complete as you go.
Update ADR log if new architectural decisions made.
```

### Example 2: Fixing a Bug

Even bug fixes should reference the spec:

1. **Does this violate the constitution?**
   - If yes, fix the violation
   - If no, document why the bug occurred

2. **Should this update the spec?**
   - If behavior changes, update `ahk-mcp-master-spec.md`
   - If implementation changes, update `ahk-mcp-technical-plan.md`

3. **Add a new ADR if architectural lesson learned**

## Template Usage Guide

### Spec Template (`spec-template.md`)

**Use for:**
- New features
- Major functionality changes
- User-facing capabilities

**Key Sections:**
- Problem Statement (why this matters)
- User Journeys (real use cases)
- Functional Requirements (testable criteria)
- Acceptance Scenarios (gherkin-style tests)

**Anti-patterns:**
- ❌ Don't include implementation details
- ❌ Don't mention specific technologies
- ❌ Don't write code in specs

### Plan Template (`plan-template.md`)

**Use for:**
- Technical implementation details
- Architecture decisions
- Technology choices

**Key Sections:**
- Constitutional Compliance Check (first!)
- Technology Decisions (with alternatives)
- Component Design (architecture)
- Testing Strategy (how to verify)

**Anti-patterns:**
- ❌ Don't skip constitutional review
- ❌ Don't forget to document trade-offs
- ❌ Don't omit alternatives considered

### Tasks Template (`tasks-template.md`)

**Use for:**
- Implementation roadmap
- Test-first workflow
- Progress tracking

**Key Sections:**
- Test-First Workflow (RED-GREEN-Refactor)
- Phase Breakdown (sequential dependencies)
- Review Checklist (quality gates)

**Anti-patterns:**
- ❌ Don't write implementation before tests
- ❌ Don't skip constitutional compliance
- ❌ Don't batch multiple phases

## Best Practices

### 1. Constitutional First

**Always start with**: `.specify/memory/constitution.md`

Check every decision against the 14 articles:
```bash
# Before coding
npm run spec:review
```

### 2. Spec Before Code

**Never write code without a spec** (even for small features)

Small feature = small spec (1 page is fine)
Large feature = comprehensive spec (use full template)

### 3. Test Before Implementation

**Article IV is non-negotiable**

Order: Contract → Integration → E2E → Unit → Implementation

### 4. Document Decisions

**Every "why" question should have an ADR**

- Why this library?
- Why this pattern?
- Why this approach?

If you ask "why" and can't find an ADR, create one.

### 5. Update Specs

**Specs are living documents**

- Implementation diverged from spec? Update the spec
- Found a better approach? Update the plan + add ADR
- Requirements changed? Update the spec + version it

## Version Control

### Spec Versioning

Specs follow semantic versioning:

- **0.x.y**: Draft (in development)
- **1.0.0**: Accepted and implemented
- **1.x.0**: Minor updates (backward compatible)
- **2.0.0**: Major changes (breaking)

### Archiving

Completed specs (fully implemented + released):

```bash
# After release
mv .specify/specs/my-feature-*.md .specify/archive/v2.0.0/
```

Archive structure:
```
.specify/archive/
├── v1.0.0/
│   └── [old specs]
├── v2.0.0/
│   └── [completed v2 specs]
└── README.md (archive index)
```

## Integration with Git

### Branch Strategy

```bash
# Create spec branch
git checkout -b spec/feature-name

# Commit spec, plan, tasks
git add .specify/specs/feature-name-*
git commit -m "spec: Add feature-name specification"

# Create implementation branch
git checkout -b feature/feature-name

# Reference spec in PR
# PR description: "Implements spec: .specify/specs/feature-name-spec.md"
```

### PR Template

```markdown
## Specification
- Spec: `.specify/specs/[name]-spec.md`
- Plan: `.specify/specs/[name]-plan.md`
- Tasks: `.specify/specs/[name]-tasks.md`

## Constitutional Compliance
- [ ] All 14 articles reviewed
- [ ] No violations or documented exceptions
- [ ] New ADR added if architectural decision made

## Testing
- [ ] Contract tests written before implementation
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Unit tests passing

## Documentation
- [ ] Spec updated if behavior changed
- [ ] Plan updated if implementation changed
- [ ] README updated if user-facing change
```

## Tools & Utilities

### NPM Scripts

```bash
npm run spec:new      # Reminder to use spec template
npm run spec:plan     # Reminder to use plan template
npm run spec:tasks    # Reminder to use tasks template
npm run spec:review   # Reminder to check constitution
```

### Future Automation (Planned)

- Constitutional compliance checker (CI/CD)
- Spec-to-test generator
- ADR changelog generator
- Spec version tracker

## FAQ

### Q: Do I need a spec for a 5-line bug fix?

**A**: No, but document why the bug occurred. If it's a constitutional violation, update the constitution or add guardrails.

### Q: Can I violate the constitution?

**A**: Only with documented justification and maintainer approval. Exceptions are rare and must be necessary.

### Q: What if the spec is wrong?

**A**: Update it! Specs are living documents. Add a note explaining why it changed.

### Q: How detailed should ADRs be?

**A**: Enough to answer "why this over alternatives?" - usually 1-2 pages.

### Q: When do I archive specs?

**A**: After the feature is fully implemented, tested, and released.

---

## Related Documentation

- **Project README**: `/README.md` - Project overview
- **Contributing Guide**: `/CONTRIBUTING.md` (coming soon)
- **Code Specification**: `/docs/CODE_SPECIFICATION.md` - Coding patterns
- **Release Notes**: `/docs/RELEASE_NOTES.md` - Version history

---

**Last Updated**: October 1, 2025
**Spec Kit Version**: 1.0.0 (GitHub Spec Kit methodology)
**Project Version**: 2.0.0 (Production Ready)
