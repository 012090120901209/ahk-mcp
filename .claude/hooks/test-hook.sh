#!/bin/bash
# Test script for the run-after-edit.py hook
# This script validates the hook logic without requiring AutoHotkey

set -e

HOOK_SCRIPT="$(dirname "$0")/run-after-edit.py"
TEST_DIR="$(dirname "$0")/../../Tests"

echo "Testing Claude Code Hook: run-after-edit.py"
echo "============================================"
echo ""

# Test 1: Valid PostToolUse event with successful edit
echo "Test 1: Valid PostToolUse event"
cat <<'EOF' | python3 "$HOOK_SCRIPT" 2>&1 || true
{
  "hook_event_name": "PostToolUse",
  "tool_name": "mcp__ahk_mcp__AHK_File_Edit",
  "tool_input": {
    "filePath": "/tmp/test.ahk"
  },
  "tool_response": {
    "content": [
      {
        "type": "text",
        "text": "✅ **Edit Successful**\n\n📄 **File:** /tmp/test.ahk"
      }
    ]
  }
}
EOF
echo ""
echo ""

# Test 2: Non-PostToolUse event (should be skipped)
echo "Test 2: Non-PostToolUse event (should skip)"
cat <<'EOF' | python3 "$HOOK_SCRIPT" 2>&1 || true
{
  "hook_event_name": "PreToolUse",
  "tool_name": "mcp__ahk_mcp__AHK_File_Edit"
}
EOF
echo ""
echo ""

# Test 3: PostToolUse with runAfter: false (should skip)
echo "Test 3: PostToolUse with runAfter: false (should skip)"
cat <<'EOF' | python3 "$HOOK_SCRIPT" 2>&1 || true
{
  "hook_event_name": "PostToolUse",
  "tool_name": "mcp__ahk_mcp__AHK_File_Edit",
  "tool_input": {
    "filePath": "/tmp/test.ahk",
    "runAfter": false
  },
  "tool_response": {
    "content": [
      {
        "type": "text",
        "text": "✅ **Edit Successful**\n\n📄 **File:** /tmp/test.ahk"
      }
    ]
  }
}
EOF
echo ""
echo ""

# Test 4: Non-edit tool (should skip)
echo "Test 4: Non-edit tool (should skip)"
cat <<'EOF' | python3 "$HOOK_SCRIPT" 2>&1 || true
{
  "hook_event_name": "PostToolUse",
  "tool_name": "mcp__ahk_mcp__AHK_Run",
  "tool_input": {},
  "tool_response": {
    "content": [{"type": "text", "text": "Script ran"}]
  }
}
EOF
echo ""
echo ""

# Test 5: Failed edit (should skip)
echo "Test 5: Failed edit (should skip)"
cat <<'EOF' | python3 "$HOOK_SCRIPT" 2>&1 || true
{
  "hook_event_name": "PostToolUse",
  "tool_name": "mcp__ahk_mcp__AHK_File_Edit",
  "tool_input": {
    "filePath": "/tmp/test.ahk"
  },
  "tool_response": {
    "content": [
      {
        "type": "text",
        "text": "❌ Error: File not found"
      }
    ]
  }
}
EOF
echo ""
echo ""

# Test 6: Non-.ahk file (should skip)
echo "Test 6: Non-.ahk file (should skip)"
cat <<'EOF' | python3 "$HOOK_SCRIPT" 2>&1 || true
{
  "hook_event_name": "PostToolUse",
  "tool_name": "mcp__ahk_mcp__AHK_File_Edit",
  "tool_input": {
    "filePath": "/tmp/test.txt"
  },
  "tool_response": {
    "content": [
      {
        "type": "text",
        "text": "✅ **Edit Successful**\n\n📄 **File:** /tmp/test.txt"
      }
    ]
  }
}
EOF
echo ""
echo ""

# Test 7: Disable via environment variable
echo "Test 7: Disabled via AHK_AUTO_RUN=false"
AHK_AUTO_RUN=false python3 "$HOOK_SCRIPT" 2>&1 <<'EOF' || true
{
  "hook_event_name": "PostToolUse",
  "tool_name": "mcp__ahk_mcp__AHK_File_Edit",
  "tool_input": {
    "filePath": "/tmp/test.ahk"
  },
  "tool_response": {
    "content": [
      {
        "type": "text",
        "text": "✅ **Edit Successful**\n\n📄 **File:** /tmp/test.ahk"
      }
    ]
  }
}
EOF
echo ""
echo ""

echo "============================================"
echo "Hook logic tests completed!"
echo ""
echo "Note: All tests expecting execution will fail with 'AutoHotkey not found'"
echo "on non-Windows systems. This is expected behavior."
echo ""
echo "To test actual script execution on Windows:"
echo "1. Install AutoHotkey v2"
echo "2. Run: python3 .claude/hooks/run-after-edit.py < /tmp/test-hook-input.json"
