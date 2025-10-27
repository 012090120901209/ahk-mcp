# AutoHotkey MCP Server - System Architecture Diagram

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOU (Developer)                          │
│         Ask Claude: "Write an AutoHotkey script to..."          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ (What you see)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Claude AI Assistant                             │
│            (Processes your request in plain language)            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ (Uses MCP Tools behind the scenes)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│     AutoHotkey v2 MCP Server (What This Project Is)             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. CODE ANALYSIS                                         │  │
│  │    • Analyze scripts                                     │  │
│  │    • Find errors (diagnostics)                           │  │
│  │    • Check coding standards                              │  │
│  │    • Summarize complexity                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 2. DOCUMENTATION & LEARNING                             │  │
│  │    • Search AutoHotkey docs                              │  │
│  │    • Get code samples                                    │  │
│  │    • Learn best practices                                │  │
│  │    • Inject context automatically                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 3. FILE MANAGEMENT                                       │  │
│  │    • Read .ahk files                                     │  │
│  │    • Create new scripts                                  │  │
│  │    • Edit files safely                                   │  │
│  │    • Track active file                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 4. SCRIPT EXECUTION                                      │  │
│  │    • Run scripts and get results                         │  │
│  │    • Debug with breakpoints                              │  │
│  │    • Test with interactive feedback                      │  │
│  │    • Detect windows created                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 5. SYSTEM & CONFIG                                       │  │
│  │    • View settings                                       │  │
│  │    • Enable/disable features                             │  │
│  │    • Track analytics                                     │  │
│  │    • Browse libraries                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Built on:                                                       │
│  ✓ TypeScript (type-safe)        ✓ Node.js                     │
│  ✓ MCP Protocol (standard)       ✓ Zod validation              │
│  ✓ Complete AHK v2 docs          ✓ 35+ specialized tools       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ (Returns code and results)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Claude Shows You the Results                        │
│         (Working AutoHotkey code, ready to use)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tool Categories

```
AUTOHOTKEY MCP SERVER
│
├─ 📊 ANALYSIS (7 tools)
│  ├─ AHK_Analyze ........................ Break down code structure
│  ├─ AHK_Diagnostics ................... Find errors & issues
│  ├─ AHK_LSP ........................... Language server features
│  ├─ AHK_Summary ....................... Quick overview
│  ├─ AHK_VSCode_Problems ............... Format for VS Code
│  ├─ AHK_Analyze_Complete .............. Comprehensive analysis
│  └─ AHK_Analyze_Diagnostics ........... Detailed error checking
│
├─ 📚 DOCUMENTATION (6 tools)
│  ├─ AHK_Doc_Search .................... Find function docs
│  ├─ AHK_Docs_Samples .................. Show code examples
│  ├─ AHK_Docs_Prompts .................. Pre-made prompts
│  ├─ AHK_Docs_Context .................. Inject context
│  ├─ AHK_Memory_Context ................ Remember patterns
│  └─ AHK_Context_Injector .............. Smart context selection
│
├─ 📁 FILE MANAGEMENT (7 tools)
│  ├─ AHK_File_View ..................... Read file contents
│  ├─ AHK_File_Edit ..................... Modify files
│  ├─ AHK_File_Create ................... Create new scripts
│  ├─ AHK_File_Edit_Advanced ............ Smart editing
│  ├─ AHK_File_Edit_Diff ................ Apply patches
│  ├─ AHK_File_Recent ................... List recent files
│  └─ AHK_Active_File ................... Track current file
│
├─ ⚙️ SCRIPT EXECUTION (4 tools)
│  ├─ AHK_Run ........................... Execute & test
│  ├─ AHK_Run_Debug ..................... Debug mode
│  ├─ AHK_Run_Process ................... Process management
│  └─ AHK_Test_Interactive .............. Interactive testing
│
└─ 🔧 SYSTEM & CONFIG (5+ tools)
   ├─ AHK_Config ........................ Show settings
   ├─ AHK_System_Settings ............... Configure behavior
   ├─ AHK_System_Analytics .............. Track usage
   ├─ AHK_System_Alpha .................. Experimental features
   ├─ AHK_Library_List .................. Browse libraries
   └─ AHK_Smart_Orchestrator ............ Auto-select tools
```

---

## Example: How a Real Request Works

### Request: "Create a script that monitors clipboard changes"

```
Step 1: YOU
   │
   ├─→ "Create an AutoHotkey v2 script that monitors 
   │   clipboard changes and shows a popup when it changes"
   │
   └─→ (to Claude)

Step 2: CLAUDE GATHERS CONTEXT
   │
   ├─→ Uses AHK_Doc_Search
   │   └─ Finds "OnClipboardChanged" function
   │
   ├─→ Uses AHK_Docs_Samples
   │   └─ Gets example code for clipboard monitoring
   │
   ├─→ Uses AHK_Context_Injector
   │   └─ Gets best practices for GUIs and event handlers
   │
   └─→ (Now Claude understands what to write)

Step 3: CLAUDE WRITES CODE
   │
   ├─→ Creates clipboard monitoring script
   │   • Uses OnClipboardChanged function
   │   • Follows AutoHotkey v2 syntax
   │   • Includes error handling
   │   • Uses your coding style
   │
   └─→ (Code is written based on server knowledge)

Step 4: CLAUDE SAVES & TESTS
   │
   ├─→ Uses AHK_File_Create
   │   └─ Saves script as monitor.ahk
   │
   ├─→ Uses AHK_Run
   │   └─ Executes the script
   │   └─ Verifies it runs without errors
   │   └─ Captures any output
   │
   └─→ (Code is tested before you get it)

Step 5: YOU GET RESULTS
   │
   ├─→ Claude shows you working code
   ├─→ Explains what it does
   ├─→ Shows test results
   └─→ You can run it immediately
```

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Your Computer                             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Claude Desktop / Claude Code (Your AI Interface)      │ │
│  └─────────────────┬──────────────────────────────────────┘ │
│                    │                                        │
│          (MCP Protocol over stdio)                          │
│                    │                                        │
│  ┌─────────────────▼──────────────────────────────────────┐ │
│  │ AutoHotkey v2 MCP Server (Node.js process)            │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ Input: Tool Request from Claude                 │ │ │
│  │  │ {                                                │ │ │
│  │  │   "name": "AHK_Run",                            │ │ │
│  │  │   "args": { "filePath": "script.ahk" }          │ │ │
│  │  │ }                                                │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                      │                               │ │
│  │                      ▼                               │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ Processing: Run Script                           │ │ │
│  │  │ • Validate inputs (Zod)                          │ │ │
│  │  │ • Find AutoHotkey executable                     │ │ │
│  │  │ • Execute script                                 │ │ │
│  │  │ • Capture output/errors                          │ │ │
│  │  │ • Detect windows                                 │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                      │                               │ │
│  │                      ▼                               │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ Output: Result back to Claude                    │ │ │
│  │  │ {                                                │ │ │
│  │  │   "success": true,                              │ │ │
│  │  │   "output": "Script executed successfully",     │ │ │
│  │  │   "windowDetected": true,                       │ │ │
│  │  │   "duration": 1250                              │ │ │
│  │  │ }                                                │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  Other processes on your computer:                          │
│  • AutoHotkey.exe (if running scripts)                      │
│  • File system (reading/writing .ahk files)                 │
│  • Git (version control integration)                        │
│  • PowerShell (for window detection)                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## What Information Flows Between Components

```
You ←→ Claude:
  "Write me an AutoHotkey script..."
  ↓
  "Here's a working script with explanation..."

Claude ←→ MCP Server:
  • Tool requests (AHK_Analyze, AHK_Run, etc.)
  • Tool results (code analysis, execution output)
  • Context updates (active files, settings)

MCP Server ←→ File System:
  • Read AutoHotkey files
  • Write/modify scripts
  • Check file existence
  • Git integration

MCP Server ←→ AutoHotkey:
  • Execute .ahk scripts
  • Capture standard output
  • Detect window creation
  • Monitor process execution

MCP Server ←→ Documentation:
  • Built-in AHK v2 reference
  • Code examples database
  • Coding standards checks
```

---

## Why This Architecture Works

```
┌─────────────────────────────────────────────────────┐
│ PROBLEM: Claude doesn't know AutoHotkey well        │
│                                                     │
│ • Missing v2-specific syntax knowledge             │
│ • Can't access your files                          │
│ • Can't verify code works                          │
│ • Makes mistakes in suggestions                    │
└─────────────────────────────────────────────────────┘
                        │
                        │ SOLUTION
                        ▼
┌─────────────────────────────────────────────────────┐
│ MCP Server provides: Specialized Knowledge         │
│                                                     │
│ ✓ Complete AutoHotkey v2 reference                 │
│ ✓ Safe file access with backups                    │
│ ✓ Script execution & testing                       │
│ ✓ Error detection & validation                     │
│ ✓ Coding standards enforcement                     │
│ ✓ Context awareness & memory                       │
└─────────────────────────────────────────────────────┘
                        │
                        │ RESULT
                        ▼
┌─────────────────────────────────────────────────────┐
│ OUTCOME: Claude becomes an Expert                  │
│                                                     │
│ • Writes correct AutoHotkey v2 code               │
│ • Tests before showing you                        │
│ • Understands your coding style                   │
│ • Makes fewer mistakes                            │
│ • Can debug and fix issues                        │
│ • Provides accurate suggestions                   │
└─────────────────────────────────────────────────────┘
```

---

## Security & Safety Features

```
Multiple Layers of Protection:

User Input
    ↓
├─→ Zod Validation (Schema checking)
    ↓
├─→ Type Safety (TypeScript)
    ↓
├─→ Dry-Run Mode (Preview before execution)
    ↓
├─→ Automatic Backups (Before file modifications)
    ↓
├─→ Error Handling (Graceful failure)
    ↓
├─→ Process Management (Timeout handling, cleanup)
    ↓
├─→ File Permissions (Safe access patterns)
    ↓
└─→ Logging & Audit (Track all actions)
```

---

## Performance Characteristics

```
Fast Operations (< 100ms):
• File reading
• Document searching
• Syntax analysis
• Configuration checks

Medium Operations (100ms - 1s):
• Code analysis
• Formatting
• Git integration
• Small script execution

Slower Operations (1-10s):
• Large script analysis
• Window detection (polling)
• Complex script execution
• Debug sessions

Depends on:
• File size
• Script complexity
• System load
• Script runtime
```

This visual guide helps explain how all the pieces work together!
