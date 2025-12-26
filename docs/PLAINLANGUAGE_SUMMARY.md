# AutoHotkey v2 MCP Server - Plain Language Summary

## What Is This?

The **AutoHotkey v2 MCP Server** is a specialized AI assistant tool that helps
you write, analyze, and manage AutoHotkey v2 scripts. It connects to Claude (an
AI assistant) through a standard protocol called MCP (Model Context Protocol),
giving Claude powerful capabilities specifically designed for AutoHotkey
development.

Think of it as a **smart coding companion** that understands AutoHotkey deeply
and can help you:

- Write better code with intelligent suggestions
- Find and fix errors in your scripts
- Understand what your code does
- Run and test your scripts
- Manage files and libraries
- Learn AutoHotkey best practices

---

## How Does It Work?

When you ask Claude about AutoHotkey or ask it to help you write a script,
here's what happens:

1. **You ask Claude**: "Create a clipboard manager in AutoHotkey v2"

2. **Claude uses this MCP server** to get context about:
   - What AutoHotkey functions and classes are available
   - What best practices and coding standards apply
   - How to properly structure AutoHotkey code
   - Real examples of similar AutoHotkey code

3. **Claude writes the code** with much better accuracy because it has access
   to:
   - Complete AutoHotkey v2 documentation
   - Your coding standards and patterns
   - Your active files and project context
   - Real-time analysis of code quality

4. **You run and test** the code Claude wrote using the built-in execution tools

---

## What Can It Actually Do?

The server provides **35+ specialized tools** organized into 5 categories:

### 1. **Code Analysis Tools** - Understand Your Code

These tools examine AutoHotkey code and explain what's happening:

- **AHK_Analyze**: Breaks down your script and lists all functions, variables,
  and classes it uses
- **AHK_Diagnostics**: Finds errors, syntax problems, and coding standard
  violations
- **AHK_LSP**: Provides language server protocol features (like an IDE)
- **AHK_VSCode_Problems**: Formats errors in VS Code compatible format
- **AHK_Summary**: Creates a quick overview of what your code does

**Example**: You paste a 200-line script, and it tells you "This script uses 15
functions, 23 variables, 2 classes, and has 3 potential bugs."

### 2. **Documentation & Learning Tools** - Learn AutoHotkey

These tools help you understand AutoHotkey's built-in capabilities:

- **AHK_Doc_Search**: Find documentation for any AutoHotkey function or class
- **AHK_Context_Injector**: Automatically inject relevant documentation into
  Claude's context based on what you're working on
- **AHK_Docs_Samples**: Show code examples of how to use specific features
- **AHK_Docs_Prompts**: Provide ready-made prompts for common AutoHotkey tasks
- **AHK_Memory_Context**: Remember your coding patterns and preferences

**Example**: You ask "How do I detect mouse clicks?" and it instantly shows you
the `OnClick` method with working code examples.

### 3. **File Management Tools** - Handle Your Files

These tools help you work with AutoHotkey script files:

- **AHK_File_View**: Read and display the contents of any .ahk file
- **AHK_File_Edit**: Modify script files (add, remove, or replace code sections)
- **AHK_File_Create**: Create new .ahk script files
- **AHK_File_Detect**: Automatically find and detect .ahk files in your project
- **AHK_File_Recent**: List recently modified scripts
- **AHK_Active_File**: Track which file you're currently working on

**Example**: "Show me my main.ahk file" - it reads and displays it formatted and
syntax-highlighted.

### 4. **Script Execution Tools** - Run & Test Your Code

These tools actually execute AutoHotkey scripts and show you the results:

- **AHK_Run**: Execute AutoHotkey scripts and capture output
- **AHK_Run_Debug**: Run scripts with debugger support for step-by-step
  execution
- **AHK_Test_Interactive**: Run scripts with GUI feedback (PASS/FAIL buttons)
- **AHK_Test_Analytics**: Track performance metrics and usage patterns

**Example**: You ask Claude to write a script, Claude creates it, and this tool
runs it to verify it works before giving it to you.

### 5. **System & Configuration Tools** - Configure Everything

These tools help you manage the server itself:

- **AHK_Config**: Show current settings and configuration
- **AHK_System_Settings**: Enable/disable tools, configure behavior
- **AHK_System_Analytics**: Track which tools are used most and performance
  metrics
- **AHK_System_Alpha**: Test experimental features
- **AHK_Library_List**: Browse available code libraries

**Example**: "What tools are available?" or "Enable debug logging."

---

## Real-World Example: Building a Script with Claude + This Server

### Scenario: You want to create a "Window Finder" utility

**Step 1: You ask Claude**

```
Create an AutoHotkey v2 script that:
- Displays all open windows in a GUI
- Shows window titles and IDs
- Lets me click to bring a window to front
- Has a search box to filter windows
```

**Step 2: Claude uses the tools to gather context**

- **AHK_Doc_Search**: Looks up GUI creation, window detection, window control
  functions
- **AHK_Docs_Samples**: Gets code examples for creating GUIs and detecting
  windows
- **AHK_Context_Injector**: Gets your coding style and standards

**Step 3: Claude writes the script** With all this context, Claude writes much
better code than it could otherwise.

**Step 4: Claude uses AHK_File_Create** Creates the script file in your project
directory.

**Step 5: Claude uses AHK_Run** Actually executes the script to test it.

**Step 6: You get working code** A tested, working AutoHotkey v2 script that
follows best practices.

---

## Key Features Explained

### 1. **Intelligent Context Awareness**

The server remembers which file you're working on and can use that context when
analyzing or suggesting code. It's like having a coding partner who actually
remembers what you're doing.

### 2. **Active File Tracking**

It knows which script is your "active file" - the one you're focused on. This
means Claude can make suggestions specific to that file without you having to
specify it.

### 3. **Built-in AutoHotkey Documentation**

Complete AutoHotkey v2 reference built in. When Claude needs to know about a
function, it doesn't search the internet - it has the docs right there.

### 4. **Coding Standards Enforcement**

The server knows your coding standards and can check if your code follows them.
It can also teach Claude to write code matching your style.

### 5. **Performance Analytics**

The server tracks which tools you use most, how long things take, and what
patterns you follow. This helps optimize the server over time.

### 6. **Safe Code Editing**

When modifying files, the server makes changes safely:

- Backs up files before editing
- Can use "dry-run" mode to preview changes
- Supports atomic commits to git
- Can rollback if something goes wrong

### 7. **Window Detection**

For GUI scripts, the server can actually detect if your running script created
windows and verify they work correctly.

---

## Technical Foundation

The server is built on solid engineering principles:

- **TypeScript**: Written in TypeScript for type safety and reliability
- **MCP Protocol**: Uses the Model Context Protocol standard, so it works with
  Claude and other AI systems
- **AutoHotkey v2 Only**: Focuses exclusively on v2 syntax (the modern version)
- **Comprehensive Validation**: All inputs validated with Zod schemas
- **Full Test Coverage**: Includes unit tests, integration tests, and end-to-end
  tests
- **Specification-Driven**: Follows a detailed specification and architectural
  documentation

---

## Who Is This For?

This MCP server is perfect if you:

✅ Use Claude or other AI assistants for coding ✅ Write AutoHotkey v2 scripts
regularly ✅ Want AI to understand your AutoHotkey code better ✅ Need to run
and test scripts programmatically ✅ Want to build automation tools more quickly
✅ Are learning AutoHotkey and want context-aware help

---

## Installation in Plain Terms

1. **Install on your computer**: Download the code and run `npm install`
2. **Build it**: Run `npm run build`
3. **Tell Claude about it**: Add configuration to Claude Desktop pointing to the
   server
4. **Start using it**: Ask Claude AutoHotkey questions and it will use all the
   tools

---

## Common Questions

### Q: Does this replace AutoHotkey itself?

**A:** No! This is a helper tool for Claude. It doesn't run AutoHotkey scripts
by itself - it just helps Claude understand AutoHotkey better and can execute
scripts to test them.

### Q: Do I need to know how to use these tools directly?

**A:** No! You just talk to Claude normally. Claude automatically uses the right
tools behind the scenes. You don't have to remember tool names or syntax.

### Q: What if Claude makes a mistake?

**A:** The tools include "dry-run" and preview modes so you can see what Claude
wants to do before it actually does it. You can always reject changes or ask
Claude to fix things.

### Q: Can I use this without Claude?

**A:** Technically yes, but it's designed for Claude. You could use it with
other AI systems that support MCP protocol.

### Q: Does this work offline?

**A:** Yes! It runs on your computer. The AutoHotkey documentation is built in,
so no internet required. You do need Claude (which requires internet), but the
actual script analysis and execution happens locally.

### Q: How much does this cost?

**A:** The MCP server is free and open source. You only pay for Claude
subscription if you use Claude.

---

## What Makes This Different?

Compared to asking Claude about AutoHotkey without this tool:

| Without MCP Server                          | With MCP Server                                |
| ------------------------------------------- | ---------------------------------------------- |
| Claude has generic programming knowledge    | Claude has AutoHotkey v2 specific knowledge    |
| Claude can't actually run your code         | Claude can run and test your scripts           |
| Claude can't access your files safely       | Claude can read/modify your files with backups |
| Claude might suggest AutoHotkey v1 patterns | Claude only suggests v2 patterns               |
| No way to verify code works                 | Can verify scripts run correctly               |
| Generic coding suggestions                  | Suggestions follow your coding standards       |

---

## The Bottom Line

This MCP server is your **specialized AutoHotkey v2 coding assistant**. When you
pair it with Claude, you get:

1. **Better Code** - Claude understands AutoHotkey deeply
2. **Faster Development** - No waiting to look things up
3. **Safety** - Code is tested before you get it
4. **Learning** - Access to complete AutoHotkey documentation
5. **Automation** - Can automatically run and test code

It's like having an expert AutoHotkey developer sitting next to you, helping you
write scripts faster and better than you could alone.

---

## Getting Started

The fastest way to see this in action:

1. Install the server (5 minutes)
2. Configure Claude Desktop (2 minutes)
3. Ask Claude: "Create a simple AutoHotkey v2 script that shows 'Hello World' in
   a popup"
4. Watch Claude write the script, Claude creates the file, Claude runs it to
   test
5. You get working code you can use immediately

That's the power of an AI coding assistant with specialized AutoHotkey v2
knowledge.
