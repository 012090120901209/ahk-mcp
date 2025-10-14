# Quick Start: Auto-Run Hook for AHK Scripts

This quick start guide will help you activate the auto-run functionality for AutoHotkey scripts after editing.

## Prerequisites

- ✅ Claude Code CLI installed and configured
- ✅ AutoHotkey v2 installed on Windows
- ✅ Python 3.6+ available

## Setup (5 minutes)

### 1. Verify Hook Files

Check that these files exist in your project:

```bash
.claude/
├── settings.json           # Hook configuration
└── hooks/
    ├── run-after-edit.py  # Hook script
    ├── README.md          # Full documentation
    └── test-hook.sh       # Test script
```

### 2. Verify Hook Configuration

Your `.claude/settings.json` should contain:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "mcp__ahk_mcp__AHK_File_Edit.*",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/run-after-edit.py\"",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

### 3. Verify Hook is Registered

Start Claude Code and check hooks:

```bash
cd /path/to/ahk-mcp
claude
```

In Claude Code, type:
```
/hooks
```

You should see:
```
PostToolUse
  • mcp__ahk_mcp__AHK_File_Edit.* → python3 "$CLAUDE_PROJECT_DIR/.claude/hooks/run-after-edit.py"
```

### 4. Test the Hook

Create a simple test:

```
User: Create a test AHK script that shows a message box with "Hello, World!"
      and save it as Tests/hello.ahk

Claude: <creates file>

User: Change "Hello, World!" to "Hook is working!"

Claude: <uses AHK_File_Edit tool>
  ✅ **Edit Successful**
  📄 **File:** C:\...\Tests\hello.ahk

  [Hook executes automatically]
  ✅ Auto-run: Script executed successfully in 0.32s
  [Message box appears showing "Hook is working!"]
```

## Usage

### Default Behavior (Auto-Run Enabled)

Simply edit any .ahk file and the script runs automatically:

```
User: Fix the typo in script.ahk - change "MgsBox" to "MsgBox"

Claude: <edits file>
[Script automatically runs]
```

### Disable for Specific Edit

Add `runAfter: false` in your request:

```
User: Add a comment to line 1 but don't run it yet

Claude: <will use runAfter: false>
[Script does not run]
```

### Disable for Entire Session

Before starting Claude:

```bash
export AHK_AUTO_RUN=false
claude
```

## Troubleshooting

### Hook Not Running

**Check hook is registered:**
```
/hooks
```

**Check Python is available:**
```bash
python3 --version
```

**Enable verbose logging:**
```bash
export AHK_HOOK_VERBOSE=true
claude --debug
```

### AutoHotkey Not Found

**On Windows PowerShell:**
```powershell
where.exe AutoHotkey64.exe
```

**If not found, install from:**
https://autohotkey.com

### Script Runs But Nothing Happens

Check the script:
- For GUI scripts: Window should appear
- For console scripts: Check exit code in output
- Use `detectWindow` parameter in AHK_Run tool for GUI verification

## Configuration Options

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `AHK_AUTO_RUN` | `true` | Enable/disable auto-run |
| `AHK_RUN_TIMEOUT` | `30` | Timeout in seconds |
| `AHK_HOOK_VERBOSE` | `false` | Detailed logging |

### Per-Project Override

Create `.claude/settings.local.json` with custom settings:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "mcp__ahk_mcp__AHK_File_Edit.*",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/run-after-edit.py\"",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

## Common Workflows

### 1. Quick Edit and Test

```
User: Change line 10 to use SendInput instead of Send

Claude: <edits file>
[Script runs automatically]
[You see the results immediately]
```

### 2. Multiple Edits Before Running

```
User: Make these changes but don't run yet:
      1. Add error handling
      2. Fix the window title
      3. Update the hotkey

Claude: <makes edits with runAfter: false>
[Scripts don't run during edits]

User: Now run the final version

Claude: <uses AHK_Run tool>
[Script runs once with all changes]
```

### 3. Debug Mode

```bash
export AHK_HOOK_VERBOSE=true
export AHK_RUN_TIMEOUT=60
claude --debug
```

```
User: Edit my script

Claude: <edits file>
[Verbose output in transcript (Ctrl+R):]
  [VERBOSE] Hook event: PostToolUse
  [VERBOSE] Tool name: mcp__ahk_mcp__AHK_File_Edit
  [VERBOSE] Should run: true, Reason: Edit completed successfully
  [VERBOSE] Script path: C:\Scripts\test.ahk
  [VERBOSE] Executing: C:\Program Files\AutoHotkey\v2\AutoHotkey64.exe...
  ✅ Auto-run: Script executed successfully in 0.45s
```

## Next Steps

- Read full documentation: `.claude/hooks/README.md`
- Test with your actual scripts
- Customize hook behavior in `run-after-edit.py`
- Configure per-project settings
- Report any issues

## Support

- Documentation: `.claude/hooks/README.md`
- Test suite: `.claude/hooks/test-hook.sh`
- Project docs: `docs/`

---

**Ready to go!** Just start editing AHK files with Claude Code and the hook will automatically run your scripts after each edit.
