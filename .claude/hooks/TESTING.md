# Hook Testing Guide

## Automated Tests

### Logic Tests (Cross-Platform)

```bash
bash .claude/hooks/test-hook.sh
```

Tests hook decision logic without requiring AutoHotkey:
- ✅ Valid PostToolUse events
- ✅ Skip conditions (runAfter: false, wrong event, failed edits)
- ✅ Environment variable overrides
- ✅ File type filtering

### Windows Integration Tests

On Windows with AutoHotkey v2 installed:

```powershell
# Test 1: Direct hook execution
cat Tests/test-hook-input.json | python .claude/hooks/run-after-edit.py

# Test 2: End-to-end with Claude Code
claude
# Then in Claude:
# "Edit Tests/test-hook-sample.ahk and change 'test' to 'verification'"
```

## Manual Testing Scenarios

### Scenario 1: Basic Auto-Run

```
1. Start Claude Code: claude
2. Edit file: "Change line 5 in Tests/test-hook-sample.ahk"
3. Verify: Script executes automatically
4. Check: Message box appears (or exit code shown)
```

### Scenario 2: Skip with runAfter: false

```
1. Request: "Edit but don't run: add comment to line 1"
2. Claude uses: runAfter: false
3. Verify: No auto-run occurs
```

### Scenario 3: Environment Override

```bash
export AHK_AUTO_RUN=false
claude
# Edit any file
# Verify: No auto-run
```

### Scenario 4: Verbose Logging

```bash
export AHK_HOOK_VERBOSE=true
claude --debug
# Edit any file
# Press Ctrl+R to see transcript
# Verify: Detailed hook execution logs
```

## Expected Outputs

### Success
```
✅ Auto-run: Script executed successfully in 0.32s
```

### Skip (Normal)
```
(No output - hook exits silently)
```

### Error
```
⚠️ Auto-run failed: Script failed with exit code 1: <error details>
```

### Not Found
```
Error: AutoHotkey v2 not found. Please install from https://autohotkey.com
```

## Validation Checklist

- [ ] Hook registered in `/hooks` output
- [ ] Python 3 available: `python3 --version`
- [ ] Script executable: `ls -la .claude/hooks/run-after-edit.py`
- [ ] AutoHotkey installed (Windows): `where AutoHotkey64.exe`
- [ ] Settings file valid JSON
- [ ] Line endings correct (LF not CRLF)

## Debugging Steps

1. Enable verbose: `export AHK_HOOK_VERBOSE=true`
2. Run with debug: `claude --debug`
3. Check transcript: Press Ctrl+R
4. Review logs: Look for [VERBOSE] messages
5. Test manually: `python3 .claude/hooks/run-after-edit.py < test-input.json`

## CI/CD Testing

```yaml
# GitHub Actions example
- name: Test Hook Logic
  run: bash .claude/hooks/test-hook.sh

- name: Lint Python
  run: |
    pip install pylint
    pylint .claude/hooks/run-after-edit.py
```

## Performance Benchmarks

| Operation | Expected Time |
|-----------|---------------|
| Hook invocation | <50ms |
| Path detection | <100ms |
| Script execution | 0.1-5s (depends on script) |
| Total overhead | <200ms + script time |

## Known Limitations

1. WSL/Linux: Cannot execute Windows AutoHotkey binaries
2. Timeout: Long-running scripts killed after configured timeout
3. GUI Scripts: May not show windows in certain environments
4. Paths: Windows paths must be accessible from Python environment
