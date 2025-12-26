# AutoHotkey MCP Tool Analysis & Consolidation Plan

## Current Tool Inventory (24 tools)

### 📝 **File Management Tools** (7 tools)

- `ahk-file` - Read/write AHK files
- `ahk-file-editor` - Advanced file editing
- `ahk-edit` - Basic code editing
- `ahk-diff-edit` - Diff-based editing
- `ahk-small-edit` - Small targeted edits
- `ahk-active-file` - Track active file context
- `ahk-auto-file` - Auto-detect file paths

### 🔍 **Analysis & Diagnostics** (5 tools)

- `ahk-analyze` - Code analysis & documentation
- `ahk-diagnostics` - Error detection
- `ahk-lsp` - LSP-style analysis + auto-fix
- `ahk-summary` - Project summaries
- `ahk-vscode-problems` - VS Code integration

### 🔧 **Development Workflow** (4 tools)

- `ahk-run` - Execute AHK scripts
- `ahk-debug-agent` - Debugging support
- `ahk-recent` - Recent files tracking
- `ahk-config` - Configuration management

### 📚 **Documentation & Context** (4 tools)

- `ahk-doc-search` - Search AHK documentation
- `ahk-prompts` - Prompt catalog management
- `ahk-context-injector` - Context injection
- `ahk-sampling-enhancer` - Sample enhancement

### ⚙️ **System Integration** (4 tools)

- `ahk-settings` - MCP settings management
- `ahk-process-request` - Process handling
- `ahk-alpha` - Alpha/experimental features
- `module-prompt-manager` - Module management

## 🎯 **Consolidation Strategy**

### **Problem Analysis**

1. **Too many entry points** - Users don't know which tool to use
2. **Overlapping functionality** - Multiple editing tools, multiple analysis
   tools
3. **Workflow fragmentation** - Related operations split across tools
4. **Cognitive overhead** - 24 tools to remember vs. 5-6 logical groups

### **Proposed Consolidation**

## 🔄 **New Unified Tools (6 total)**

### 1. **`ahk-workspace`** - File & Project Management

**Combines**: `ahk-file`, `ahk-file-editor`, `ahk-active-file`, `ahk-auto-file`,
`ahk-recent`

```typescript
modes: ['read', 'write', 'edit', 'manage', 'recent'];
// Auto-detects files, manages active context, handles all file operations
```

### 2. **`ahk-code`** - Code Editing & Modification

**Combines**: `ahk-edit`, `ahk-diff-edit`, `ahk-small-edit`

```typescript
modes: ['edit', 'diff', 'small', 'format', 'refactor'];
// Unified editing with different granularities and approaches
```

### 3. **`ahk-analyze`** - Code Analysis & Quality (Enhanced)

**Combines**: `ahk-analyze`, `ahk-diagnostics`, `ahk-lsp`, `ahk-vscode-problems`

```typescript
modes: ['quick', 'deep', 'fix', 'integrate'];
// Complete analysis pipeline: check → diagnose → fix → integrate
```

### 4. **`ahk-dev`** - Development Workflow

**Combines**: `ahk-run`, `ahk-debug-agent`, `ahk-summary`

```typescript
modes: ['run', 'debug', 'test', 'summary', 'profile'];
// End-to-end development workflow management
```

### 5. **`ahk-knowledge`** - Documentation & Context

**Combines**: `ahk-doc-search`, `ahk-prompts`, `ahk-context-injector`

```typescript
modes: ['search', 'prompts', 'inject', 'reference'];
// Unified knowledge and context management
```

### 6. **`ahk-system`** - Configuration & System Integration

**Combines**: `ahk-settings`, `ahk-config`, `ahk-process-request`, `ahk-alpha`,
`module-prompt-manager`

```typescript
modes: ['config', 'settings', 'process', 'modules', 'experimental'];
// System-level operations and configuration
```

## 🚀 **Benefits of Consolidation**

### **For Users**

- **6 tools instead of 24** - Much easier to remember and choose
- **Logical grouping** - Related operations in one place
- **Progressive complexity** - Start simple, add advanced options
- **Clear workflows** - Natural progression from analysis → editing → running

### **For Development**

- **Reduced maintenance** - Fewer tool classes to maintain
- **Shared logic** - Common patterns consolidated
- **Better testing** - Test complete workflows, not fragments
- **Cleaner codebase** - Less duplication and overlap

### **Implementation Strategy**

#### **Phase 1: Create Unified Tools**

Create new consolidated tools with mode-based operation while keeping existing
tools

#### **Phase 2: Migration Period**

Both old and new tools available, with deprecation warnings on old tools

#### **Phase 3: Cleanup**

Remove old tools, update documentation

## 🎯 **Example: Unified Analysis Workflow**

Instead of:

```bash
ahk-diagnostics → ahk-lsp → ahk-analyze → ahk-vscode-problems
```

Now:

```typescript
ahk -
  analyze({
    mode: 'complete',
    autoFix: true,
    includeVSCode: true,
    returnAnalysis: true,
  });
```

This creates a **natural workflow** where one tool handles the entire analysis
pipeline!
