# AutoHotkey MCP Server - Quick Reference Guide

## One-Sentence Summary

**This is a specialized AI coding assistant that helps Claude write, understand,
run, and test AutoHotkey v2 scripts with expert-level accuracy.**

---

## The 5 Things It Does (In Order of Importance)

### 1. 🧠 Makes Claude Smart About AutoHotkey

- Gives Claude complete AutoHotkey v2 documentation
- Teaches Claude the right way to write AutoHotkey code
- Prevents Claude from suggesting outdated v1 syntax
- **Result**: Claude writes better AutoHotkey code

### 2. 🏃 Executes & Tests Your Code

- Actually runs AutoHotkey scripts
- Shows you the output
- Detects if windows were created
- **Result**: You know the code works before using it

### 3. 📁 Manages Your Script Files

- Reads and displays your .ahk files
- Creates new scripts with proper formatting
- Safely edits existing scripts
- **Result**: All your scripts in one place, managed safely

### 4. 🔍 Analyzes & Debugs Code

- Finds syntax errors and mistakes
- Checks if code follows best practices
- Breaks down what your code does
- **Result**: You understand your code better

### 5. 📚 Provides Learning Resources

- Shows how to use AutoHotkey features
- Gives code examples
- Explains best practices
- **Result**: You learn AutoHotkey faster

---

## Common Use Cases

### Use Case 1: "Write me an AutoHotkey script"

1. You: "Create a script that does X"
2. Claude: "Let me gather information..."
   - Searches AutoHotkey docs
   - Gets best practices
   - Looks at your coding style
3. Claude: "Here's your script"
   - Actually tests it
   - Shows you it works
   - Explains what it does

### Use Case 2: "I have this script, what does it do?"

1. You: Share your script
2. Claude: Uses AHK_Analyze
   - Breaks down the code
   - Lists all functions used
   - Identifies potential issues
   - Explains what it does

### Use Case 3: "This script isn't working"

1. You: Share your broken script
2. Claude: Uses AHK_Diagnostics
   - Finds the errors
   - Explains what's wrong
   - Suggests fixes
   - Tests the fix

### Use Case 4: "How do I do X in AutoHotkey?"

1. You: "How do I detect mouse clicks?"
2. Claude: Uses AHK_Doc_Search
   - Finds the right function
   - Shows code examples
   - Explains parameters
   - Gives you working code

### Use Case 5: "I need this improved"

1. You: Share your script
2. Claude: Uses AHK_Analyze
   - Finds inefficiencies
   - Suggests improvements
   - Refactors code
   - Tests new version

---

## What You See vs. What's Happening

### What You See (Simple):

```
You: "Write a script that shows all open windows"
Claude: "Here you go!" [shows working code]
```

### What Actually Happened (Behind Scenes):

```
You: "Write a script that shows all open windows"
  ↓
Claude activates AHK_Doc_Search
  • Searches for window detection functions
  • Finds WinGetList, WinGetTitle, WinActivate
  ↓
Claude activates AHK_Docs_Samples
  • Gets example code for each function
  ↓
Claude activates AHK_Context_Injector
  • Gets your coding standards
  • Gets your active file context
  ↓
Claude writes the code based on all this knowledge
  ↓
Claude activates AHK_File_Create
  • Creates the script file
  ↓
Claude activates AHK_Run
  • Executes the script
  • Captures output
  • Verifies it works
  ↓
Claude shows you: "Here's your working script with test results"
```

---

## 10 Things This Makes Easier

| Problem                              | Solution                 | Result                     |
| ------------------------------------ | ------------------------ | -------------------------- |
| Claude suggests AutoHotkey v1 syntax | Server only teaches v2   | Always correct syntax      |
| Don't know AutoHotkey functions      | Built-in complete docs   | No Googling needed         |
| Can't verify if code works           | Server executes scripts  | Know it works before using |
| Worried about breaking files         | Automatic backups        | Safe to experiment         |
| Need to understand existing code     | Automatic analysis       | Instant explanation        |
| Unsure about best practices          | Coding standards checked | Code always clean          |
| Manual file management               | Automatic file tracking  | Everything organized       |
| Script fails silently                | Built-in error detection | Problems found instantly   |
| Don't know what functions do         | Code examples included   | Learn as you go            |
| Track what Claude is doing           | Full logging & analytics | Full transparency          |

---

## Tool Groups At A Glance

```
NEED TO...              TOOL NAME              WHAT IT DOES
───────────────────────────────────────────────────────────────────
Analyze code            AHK_Analyze            Breakdown code structure
Find errors             AHK_Diagnostics        Find bugs & issues
Learn a feature         AHK_Doc_Search         Find + explain features
See examples            AHK_Docs_Samples       Show working code
Read a file             AHK_File_View          Display file contents
Create a file           AHK_File_Create        Make new script
Edit a file             AHK_File_Edit          Modify script safely
Run a script            AHK_Run                Execute & test
Debug a script          AHK_Run_Debug          Step-through execution
Test with UI            AHK_Test_Interactive   Run & verify with GUI
Check settings          AHK_Config             View current setup
See what's used         AHK_System_Analytics   Track tool usage
```

---

## Key Features Explained Simply

### Feature: Active File Context

**What**: The server remembers which file you're working on **Why**: Claude can
make suggestions specific to YOUR code **Example**: You ask "improve this" and
it knows which file without you saying

### Feature: Dry-Run Mode

**What**: Preview changes before they happen **Why**: You can see what Claude
wants to do and approve it first **Example**: Claude says "I'll add this code.
Here's what it looks like..." then waits for approval

### Feature: Built-in Backups

**What**: Automatic backup before any file change **Why**: If something goes
wrong, you can easily revert **Example**: File modified, backup created, can
rollback instantly

### Feature: Window Detection

**What**: Can verify if your GUI scripts actually create windows **Why**: You
know if your script works without manually running it **Example**: Claude runs
script, detects window, confirms "Your GUI loaded correctly"

### Feature: Analytics Tracking

**What**: Server tracks which tools are used most and how long they take
**Why**: Understand your workflow and optimize **Example**: "You use analysis
tools 60% of the time, file tools 30%"

---

## Performance Expectations

### Fast (Instant - feels like zero delay)

- Reading files
- Searching documentation
- Checking syntax
- Showing settings

### Normal (1-2 seconds)

- Analyzing code
- Formatting code
- Creating files
- Simple script execution

### Reasonable (2-10 seconds)

- Complex analysis
- Large script execution
- Running with debugging
- Checking multiple files

### Slow (10+ seconds)

- Very large file analysis
- Long-running scripts
- Multiple simultaneous operations

---

## Comparison: Before vs. After Using This MCP

### Before (Without MCP Server):

```
You: "Write an AutoHotkey v2 script that..."
Claude: "Sure, let me write that"
  → Claude writes code without AutoHotkey knowledge
  → Code might use v1 syntax or wrong functions
  → You run it and get errors
  → You debug it yourself
  → You learn slowly
  → You fix issues manually
```

### After (With MCP Server):

```
You: "Write an AutoHotkey v2 script that..."
Claude: "Sure, let me gather AutoHotkey knowledge"
  → Claude searches built-in documentation
  → Claude gets code examples
  → Claude writes correct v2 code
  → Claude tests it automatically
  → Code works on first try
  → You learn from working examples
  → Issues caught automatically
```

---

## Real Example: Clipboard Manager

### What You Ask:

```
"Create a clipboard manager that:
- Monitors clipboard changes
- Saves history to a file
- Shows popup when something new is clipped
- Has a hotkey to show history"
```

### What The Server Does:

1. **AHK_Doc_Search**: Finds OnClipboardChanged function
2. **AHK_Docs_Samples**: Gets clipboard handling examples
3. **AHK_Docs_Samples**: Gets file I/O examples
4. **AHK_Context_Injector**: Gets GUI and hotkey patterns
5. Claude writes complete working code
6. **AHK_File_Create**: Saves the script
7. **AHK_Run**: Executes and tests it
8. Shows you: "Your clipboard manager is ready! It works correctly."

### What You Get:

✅ Working code ✅ Tested and verified ✅ Follows best practices ✅ Proper error
handling ✅ Documentation ✅ Ready to use

### Time Saved:

- Without server: 30+ minutes of researching, writing, debugging
- With server: 5 minutes from request to working code

---

## The 3 Layers of Intelligence

### Layer 1: Knowledge

- Complete AutoHotkey v2 documentation
- Code examples for everything
- Best practices database
- Coding standards

### Layer 2: Automation

- Automatic documentation lookup
- Automatic code analysis
- Automatic testing
- Automatic error detection

### Layer 3: Safety

- Automatic backups
- Dry-run previews
- Error handling
- Validation at every step

---

## Installation Summary

```
Step 1: Install the server (5 minutes)
  npm install && npm run build

Step 2: Configure Claude (2 minutes)
  Add to claude_desktop_config.json

Step 3: Restart Claude (1 minute)
  Close and reopen Claude Desktop

Step 4: Start using it (Immediately!)
  Just ask Claude about AutoHotkey
```

Total time: 8 minutes Result: Expert AutoHotkey assistant

---

## Troubleshooting At A Glance

| Problem                      | Solution                         |
| ---------------------------- | -------------------------------- |
| Claude says "tool not found" | Restart Claude Desktop           |
| Script won't execute         | Check if AutoHotkey is installed |
| File changes not appearing   | Refresh or re-open file          |
| Getting wrong type errors    | Check TypeScript configuration   |
| Server not responding        | Check Node.js is running         |
| Analytics not working        | Enable analytics in settings     |

---

## Getting Help

### Quick Questions

Ask Claude directly: "What AutoHotkey tools does this MCP have?"

### Troubleshooting

Check the logs: `npm run debug`

### Documentation

Read: `TECHNICAL_DEBT_CLEANUP_GUIDE.md` and `../README.md`

### Examples

Try: `PLAINLANGUAGE_SUMMARY.md` and `ARCHITECTURE_DIAGRAMS.md`

---

## Remember

**This MCP Server = Your Personal AutoHotkey v2 Expert**

It makes Claude understand AutoHotkey so well that writing scripts becomes:

- ✅ Faster (no researching)
- ✅ Easier (no syntax errors)
- ✅ Safer (automatic testing)
- ✅ Better (best practices enforced)

**The goal**: Turn Claude from a general programmer into an AutoHotkey v2
specialist who writes code as good as a professional AutoHotkey developer.

---

## Next Steps

1. **Install it** → `npm install && npm run build`
2. **Configure it** → Add to Claude Desktop config
3. **Try it** → Ask Claude to write an AutoHotkey script
4. **Marvel at the results** → Working code, first try!

That's it. You now have an expert AutoHotkey v2 coding assistant.
