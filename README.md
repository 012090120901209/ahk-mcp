<div align="center">
  <h1>AutoHotkey v2 MCP Server</h1>
  <p>
    <strong>Model Context Protocol</strong>
  </p>
  <p>
    <a href="#features"><img src="https://img.shields.io/badge/Features-blue?style=for-the-badge" alt="Features"></a>
    <a href="#installation"><img src="https://img.shields.io/badge/Install-green?style=for-the-badge" alt="Installation"></a>
    <a href="#usage"><img src="https://img.shields.io/badge/Usage-purple?style=for-the-badge" alt="Usage"></a>
    <a href="#development"><img src="https://img.shields.io/badge/Develop-orange?style=for-the-badge" alt="Development"></a>
  </p>
</div>

---

> [!IMPORTANT]
> UPDATED 10/1/25: **GitHub Spec Kit integration complete!** Project now follows specification-driven development with constitutional framework, architectural decision records, and comprehensive planning templates. Enhanced reliability improvements and type safety across all tools.

## Overview

**AutoHotkey v2 MCP Server** provides comprehensive development tools for AutoHotkey v2 through the Model Context Protocol. Features intelligent code analysis, file management, script execution, and context-aware assistance for LLMs working with AutoHotkey code.

This project follows **Specification-Driven Development** using GitHub's Spec Kit framework. See `.specify/` directory for architectural decisions, specifications, and development templates.

## Recent Updates

**Version 2.0.0** - Production Ready:
- **🚀 Smart File Orchestrator** - Reduces tool calls from 7-10 to 3-4 with intelligent caching
- 25+ MCP tools with enhanced descriptions
- Tool usage analytics and performance tracking
- Smart context injection based on usage patterns
- Resource subscription system
- Active file context in tool listings
- MCP prompts and resources for coding standards
- Consolidated and improved documentation

## Table of Contents

- [Overview](#overview)
- [Recent Updates](#recent-updates)
- [Specification-Driven Development](#specification-driven-development)
- [Example](#example)
- [Features](#features)
  - [LSP-like Capabilities](#lsp-like-capabilities)
  - [AutoHotkey v2 Specific Features](#autohotkey-v2-specific-features)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Claude Desktop Configuration](#claude-desktop-configuration)
- [MCP Tools](#mcp-tools)
  - [Core Analysis Tools](#core-analysis-tools)
- [Built-in AutoHotkey Prompts](#built-in-autohotkey-prompts)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Example

An overly simplistic example:

1. User asks for a clipboard manager tool:
2. LLM creates a plan which includes steps like this:

```
The user wants me to create a clipboard manager script in AutoHotkey v2. Let me break down the requirements:
Core Functionality:
Monitor clipboard changes
Display collected entries in a GUI
Toggle collection with F6 hotkey
Save content back to clipboard when closing
```
3. The MCP grabs these words from keywords: Clipboard, GUI, Toggle, and Hotkey
4. The MCP sends back more detailed context. For clipboard this would be something like:

```
The users clipboard can be accessed by the A_Clipboard built-in variable. If the users request involves determining whether or not a clipboard value has changed, use the OnClipboardChanged function object. Clipboard all is used if the user needs to save the clipboard temporarily. When the operation is completed, the script restores the original clipboard contents.
```
5. The LLM then returns code with much better accuracy.

## Specification-Driven Development

This project follows **GitHub's Spec Kit** methodology for specification-driven development:

### 📋 Constitutional Framework

The project is governed by `.specify/memory/constitution.md` - 14 non-negotiable principles:
- Article I: Type Safety (TypeScript strict mode + Zod)
- Article II: MCP Protocol Compliance
- Article III: AutoHotkey v2 Purity
- Article IV: Test-First Development (RED-GREEN-Refactor)
- Article V-XIV: Performance, Security, Modularity, UX, and more

### 📐 Architectural Decisions

All major technical decisions documented in `.specify/specs/architecture-decisions.md`:
- ADR-001: Why TypeScript over JavaScript
- ADR-003: Why FlexSearch for documentation search
- ADR-006: Why PowerShell for window detection
- ADR-011: Why `AHK_*` tool naming convention
- ...and 11 more ADRs explaining the "why" behind the architecture

### 📚 Specifications & Plans

- **Master Spec**: `.specify/specs/ahk-mcp-master-spec.md` - What the system IS and WHY
- **Technical Plan**: `.specify/specs/ahk-mcp-technical-plan.md` - HOW it's implemented
- **Templates**: `.specify/templates/` - Spec, plan, and task templates for new features

### 🔄 Development Workflow

New features follow a structured process:

1. **Specify** (`/specify`) - Define WHAT and WHY (not technical)
2. **Plan** (`/plan`) - Technical architecture and decisions
3. **Tasks** (`/tasks`) - Implementation roadmap with test-first approach
4. **Implement** - Code following the spec and plan

See `.specify/templates/` for starting points.

## Features

### LSP-like Capabilities
- **Code Completion**: Intelligent suggestions for functions, variables, classes, methods, and keywords
- **Diagnostics**: Syntax error detection and AutoHotkey v2 coding standards validation
- **Script Analysis**: Comprehensive code analysis with contextual documentation
- **Go-to-Definition**: Navigate to symbol definitions *(planned)*
- **Find References**: Locate symbol usage throughout code *(planned)*

### AutoHotkey v2 Specific Features
- **Built-in Documentation**: Comprehensive AutoHotkey v2 function and class reference
- **Coding Standards**: Enforces Claude-defined AutoHotkey v2 best practices
- **Hotkey Support**: Smart completion for hotkey definitions
- **Class Analysis**: Object-oriented programming support with method and property completion
- **Contextual Help**: Real-time documentation and examples for built-in elements



## Installation

### Prerequisites

Before installing the AutoHotkey v2 MCP Server, ensure you have:

- **Node.js** 18.0.0 or later
- **npm** or **yarn** package manager

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/TrueCrimeAudit/ahk-mcp.git
   cd ahk-mcp
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

   **For development with auto-reload:**
   ```bash
   npm run dev
   ```

### Claude Desktop Configuration

Add the server to your Claude Desktop configuration file (`claude_desktop_config.json`):

**Windows Configuration:**
```json
{
  "mcpServers": {
    "ahk": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "C:\\Users\\YourUsername\\path\\to\\ahk-mcp\\dist\\index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "AHK_MCP_LOG_LEVEL": "warn"
      }
    }
  }
}
```

**Debug Configuration (for troubleshooting):**
```json
{
  "mcpServers": {
    "ahk-server": {
      "autoApprove": [
        "analyze_code",
        "find_variables",
        "get_function_info",
        "get_class_info"
      ],
      "disabled": false,
      "timeout": 60,
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "C:\\path\\to\\ahk-mcp\\dist\\index.js"
      ],
      "transportType": "stdio",
      "env": {
        "NODE_ENV": "production",
        "AHK_MCP_LOG_LEVEL": "debug"
      }
    }
  }
}

```

**Important Notes:**
- Replace `YourUsername` with your actual Windows username
- Replace `path\\to\\ahk-mcp` with the actual path to your installation
- Use absolute paths for both Node.js and the script
- Use double backslashes (`\\`) in Windows paths for proper JSON escaping
- Set `AHK_MCP_LOG_LEVEL` to `debug` for troubleshooting, `warn` for normal use

### MCP Jam Configuration

To add this server in [MCP Jam](https://mcpjam.com):

1. Click **Add MCP Server**
2. Fill in the fields:

| Field | Value |
|-------|-------|
| **Server Name** | `ahk-mcp` |
| **Connection Type** | `STDIO` |
| **Command** | `node C:\Users\YourUsername\path\to\ahk-mcp\dist\server.js` |

> **Important:** The command must point to `dist/server.js` (not `server.js` in root)

3. **Environment Variables** (optional):

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production mode |
| `AHK_MCP_LOG_LEVEL` | `warn` | Log level (`debug`, `info`, `warn`, `error`) |

4. Click **Add Server**

**Alternative using npx** (if published to npm):
```
npx ahk-mcp-server
```

## MCP Tools

### Tool Naming Convention

- All tools now use the `AHK_<Word>_<Word>` format (e.g. `AHK_File_View`, `AHK_File_Edit_Diff`).
- Previous lowercase names such as `ahk_file_view` are no longer registered by the server.
- Mixing the old names in tool chains previously triggered "Unknown tool" errors because `server.ts` only dispatched `ahk_*` handlers. The dispatcher, tool recommendations, and configuration settings now agree on the new `AHK_*` identifiers so chained calls proceed correctly.

### Core Analysis Tools

#### `AHK_Smart_Orchestrator` 🆕
Intelligently orchestrates file operations to minimize redundant tool calls. Automatically chains detect → analyze → read → edit workflow with smart caching.

**Key Benefits:**
- Reduces tool calls from 7-10 to 3-4 (60% reduction)
- Session-scoped caching with staleness detection
- Automatic line range calculation
- Cache hit rate: ~65% in production use

```typescript
{
  intent: string,                           // What you want to do (required)
  filePath?: string,                        // Direct file path (skips detection)
  targetEntity?: string,                    // Class, method, or function name
  operation: 'view' | 'edit' | 'analyze',  // Operation type (default: view)
  forceRefresh?: boolean                    // Force re-analysis (default: false)
}
```

**Examples:**
```typescript
// View a specific class
{ intent: "view the _Dark class", targetEntity: "_Dark", operation: "view" }

// Edit with direct path
{ intent: "modify checkbox styling", filePath: "C:\\path\\to\\file.ahk",
  targetEntity: "_Dark.ColorCheckbox", operation: "edit" }

// Analyze structure
{ intent: "understand file structure", filePath: "C:\\path\\to\\file.ahk",
  operation: "analyze" }
```

See [docs/SMART_ORCHESTRATOR.md](docs/SMART_ORCHESTRATOR.md) for details.

#### `AHK_Run`
Execute AutoHotkey scripts with window detection and timeout handling.

```typescript
{
  mode: 'run' | 'test',                    // Execution mode
  filePath?: string,                       // Path to .ahk file (or use content)
  content?: string,                        // Script content to execute
  wait?: boolean,                          // Wait for completion (default: true)
  detectWindow?: boolean,                  // Enable window detection (default: false)
  windowDetectTimeout?: number,            // Window detection timeout in ms
  ahkPath?: string                         // Custom AutoHotkey executable path
}
```

#### `AHK_Diagnostics`
Validates code syntax and enforces coding standards with detailed error reporting.

```typescript
{
  code: string,                    // AutoHotkey v2 code to analyze
  enableClaudeStandards?: boolean, // Apply coding standards (default: true)
  severity?: string               // Filter: 'error' | 'warning' | 'info' | 'all'
}
```

#### `AHK_Analyze`
Comprehensive script analysis with contextual documentation and usage insights.

```typescript
{
  code: string,                      // AutoHotkey v2 code to analyze
  includeDocumentation?: boolean,    // Include documentation for built-in elements (default: true)
  includeUsageExamples?: boolean,    // Include usage examples (default: false)
  analyzeComplexity?: boolean        // Analyze code complexity (default: false)
}
```

## Built-in AutoHotkey Prompts

The server includes 7 ready-to-use AutoHotkey v2 prompts accessible through Claude:

1. **File System Watcher** - Monitor directory changes with callbacks
2. **CPU Usage Monitor** - Display real-time CPU usage in tooltips
3. **Clipboard Editor** - GUI-based clipboard text manipulation
4. **Hotkey Toggle Function** - Dynamic hotkey management with feedback
5. **Link Manager** - URL validation and browser integration
6. **Snippet Manager** - Text snippet storage and insertion system

Access these prompts through Claude's interface by typing `/` and selecting from the available AutoHotkey prompts.

## Documentation

### Project Documentation

- **Quick Start**: `docs/QUICK_START.md` - Get up and running quickly
- **Claude Desktop Setup**: `docs/CLAUDE_DESKTOP_SETUP.md`
- **Claude Code Setup**: `docs/CLAUDE_CODE_SETUP.md`
- **Settings Guide**: `docs/SETTINGS_GUIDE.md` - Configuration options
- **Coding Agent Guide**: `docs/CODING_AGENT_GUIDE.md` - AI agent integration patterns
- **Release Notes**: `docs/RELEASE_NOTES.md` - Version history

### Specification Documents

- **Constitution**: `.specify/memory/constitution.md` - Project governance
- **Master Spec**: `.specify/specs/ahk-mcp-master-spec.md` - System specification
- **Technical Plan**: `.specify/specs/ahk-mcp-technical-plan.md` - Implementation details
- **ADR Log**: `.specify/specs/architecture-decisions.md` - Decision records

### AutoHotkey v2 Data

The server includes comprehensive AutoHotkey v2 documentation:

- **Functions**: 200+ built-in functions with parameters and examples
- **Classes**: GUI, File, Array, Map, and other core classes
- **Variables**: Built-in variables like A_WorkingDir, A_ScriptName
- **Methods**: Class methods with detailed parameter information
- **Directives**: #Include, #Requires, and other preprocessor directives

## Contributing

### Development Workflow

This project follows **specification-driven development**:

1. **Read the Constitution**: `.specify/memory/constitution.md` - Non-negotiable principles
2. **Review ADRs**: `.specify/specs/architecture-decisions.md` - Understand past decisions
3. **Create a Spec**: Use `.specify/templates/spec-template.md` to define WHAT and WHY
4. **Create a Plan**: Use `.specify/templates/plan-template.md` to define HOW
5. **Break Down Tasks**: Use `.specify/templates/tasks-template.md` for implementation
6. **Follow Test-First**: Write tests BEFORE implementation (Article IV)

### Key Principles

- **Type Safety**: TypeScript strict mode + Zod validation
- **MCP Compliance**: Standard response format with `isError` flag
- **AHK v2 Only**: No AutoHotkey v1 support
- **Test-First**: RED-GREEN-Refactor cycle
- **Tool Naming**: `AHK_Category_Action` convention

See `CONTRIBUTING.md` for detailed guidelines (coming soon).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>
    <strong>Built with ❤️ for the community</strong>
  </p>
  <p>
    <a href="https://www.autohotkey.com/docs/v2/">Official AHK Documents</a>
  </p>
</div>
