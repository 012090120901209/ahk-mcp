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
> UPDATED 9/23/25: Enhanced script execution with window detection and state validation. The `AHK_Run` tool now detects when AutoHotkey scripts launched by monitoring for new windows. Added debug logging for MCP tool calls and improve file path process. Fixed tool naming consistency across the entire codebase.
> This readme was not created using AI, so it's worth reading lol

## Overview

**AutoHotkey v2 MCP Server** is designed to improve LLMs ability to produce AutoHotkey v2 code. The main features are quality of life features such as prompts to recenter the LLM on AHK v2 coding rules as well as providing meta-prompts that create a strong structure for the LLM to follow. Some of the features such as context management are experimental and need a lot of work. However, it does currently pass in context for the thinking process based on what the user is asking for.

## Recent Updates

**Version 2.1.1** includes expanded file management capabilities:
- Script run and monitor tool
- Advanced file editing tools with diff-based patches
- Alpha versioning system for iterative development
- Enhanced active file detection and management
- Improved ESLint configuration and code quality fixes

## Table of Contents

- [Overview](#overview)
- [Recent Updates](#recent-updates)
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
- [Documentation Data](#documentation-data)
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
    "ahk": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "C:\\Users\\YourUsername\\path\\to\\ahk-mcp\\dist\\index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "AHK_MCP_LOG_LEVEL": "debug",
        "AHK_MCP_DATA_MODE": "full"
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

## MCP Tools

### Tool Naming Convention

- All tools now use the `AHK_<Word>_<Word>` format (e.g. `AHK_File_View`, `AHK_File_Edit_Diff`).
- Previous lowercase names such as `ahk_file_view` are no longer registered by the server.
- Mixing the old names in tool chains previously triggered "Unknown tool" errors because `server.ts` only dispatched `ahk_*` handlers. The dispatcher, tool recommendations, and configuration settings now agree on the new `AHK_*` identifiers so chained calls proceed correctly.

### Core Analysis Tools

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

## Documentation Data

The server includes comprehensive AutoHotkey v2 documentation:

- **Functions**: 200+ built-in functions with parameters and examples
- **Classes**: GUI, File, Array, Map, and other core classes
- **Variables**: Built-in variables like A_WorkingDir, A_ScriptName
- **Methods**: Class methods with detailed parameter information
- **Directives**: #Include, #Requires, and other preprocessor directives

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
