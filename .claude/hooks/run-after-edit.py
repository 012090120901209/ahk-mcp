#!/usr/bin/env python3
"""
Claude Code PostToolUse Hook: Auto-Run AHK Scripts After Edit

This hook automatically executes AutoHotkey v2 scripts after successful file editing
operations. It integrates with the ahk-mcp server's editing tools and respects the
autoRunAfterEdit setting.

Requirements:
- Python 3.6+
- AutoHotkey v2 installed on Windows

Hook Input (stdin JSON):
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/path/to/working/dir",
  "hook_event_name": "PostToolUse",
  "tool_name": "mcp__ahk_mcp__AHK_File_Edit",
  "tool_input": {
    "action": "replace",
    "filePath": "/path/to/script.ahk",
    ...
  },
  "tool_response": {
    "content": [
      {
        "type": "text",
        "text": "✅ **Edit Successful**\\n\\n📄 **File:** C:\\path\\to\\script.ahk\\n..."
      }
    ]
  }
}

Exit Codes:
  0 - Success (script ran or was skipped appropriately)
  1 - Non-blocking error (script failed but don't block Claude)
  2 - Blocking error (should not occur in PostToolUse)

Environment Variables:
  CLAUDE_PROJECT_DIR - Project root directory (set by Claude Code)
  AHK_AUTO_RUN - Override auto-run behavior (true/false)
  AHK_RUN_TIMEOUT - Script execution timeout in seconds (default: 30)
"""

import json
import sys
import os
import subprocess
import re
import time
from pathlib import Path
from typing import Optional, Dict, Any


class HookConfig:
    """Configuration for the hook behavior"""

    def __init__(self):
        # Check environment for overrides
        self.auto_run_enabled = os.getenv('AHK_AUTO_RUN', 'true').lower() == 'true'
        self.timeout = int(os.getenv('AHK_RUN_TIMEOUT', '30'))
        self.verbose = os.getenv('AHK_HOOK_VERBOSE', 'false').lower() == 'true'

        # Common AutoHotkey v2 installation paths
        self.ahk_paths = [
            r'C:\Program Files\AutoHotkey\v2\AutoHotkey64.exe',
            r'C:\Program Files (x86)\AutoHotkey\v2\AutoHotkey64.exe',
            r'C:\Program Files\AutoHotkey\v2\AutoHotkey.exe',
            r'C:\Program Files (x86)\AutoHotkey\v2\AutoHotkey.exe',
        ]


def log_verbose(config: HookConfig, message: str):
    """Log verbose messages if enabled"""
    if config.verbose:
        print(f"[VERBOSE] {message}", file=sys.stderr)


def find_autohotkey(config: HookConfig) -> Optional[str]:
    """Find AutoHotkey v2 executable path"""
    # Check common paths
    for path in config.ahk_paths:
        if os.path.exists(path):
            return path

    # Try to find via PATH (Windows)
    if sys.platform == 'win32':
        try:
            result = subprocess.run(
                ['where', 'AutoHotkey64.exe'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip().split('\n')[0]
        except Exception:
            pass

    return None


def extract_file_path_from_response(tool_response: Dict[str, Any]) -> Optional[str]:
    """
    Extract the file path from the tool response.
    Handles different response formats from various edit tools.
    """
    # Method 1: Direct filePath in response
    if isinstance(tool_response, dict) and 'filePath' in tool_response:
        return tool_response['filePath']

    # Method 2: Extract from content text (most common for ahk-mcp tools)
    if isinstance(tool_response, dict) and 'content' in tool_response:
        content = tool_response['content']
        if isinstance(content, list) and len(content) > 0:
            # Look for file path in text content
            for item in content:
                if item.get('type') == 'text':
                    text = item.get('text', '')
                    # Pattern 1: "📄 **File:** C:\path\to\file.ahk"
                    match = re.search(r'\*\*File:\*\*\s+(.+\.ahk)', text)
                    if match:
                        return match.group(1).strip()

                    # Pattern 2: "File: C:\path\to\file.ahk"
                    match = re.search(r'File:\s+(.+\.ahk)', text)
                    if match:
                        return match.group(1).strip()

    return None


def should_run_script(
    config: HookConfig,
    tool_name: str,
    tool_input: Dict[str, Any],
    tool_response: Dict[str, Any]
) -> tuple[bool, str]:
    """
    Determine if the script should be run.

    Returns:
        (should_run, reason) tuple
    """
    # Check if auto-run is enabled via environment
    if not config.auto_run_enabled:
        return False, "Auto-run disabled via AHK_AUTO_RUN environment variable"

    # Check if this is an edit tool
    edit_tool_patterns = [
        'AHK_File_Edit',
        'AHK_File_Edit_Advanced',
        'AHK_File_Edit_Small',
        'AHK_File_Edit_Diff'
    ]

    is_edit_tool = any(pattern in tool_name for pattern in edit_tool_patterns)
    if not is_edit_tool:
        return False, f"Tool {tool_name} is not an edit tool"

    # Check if the tool has runAfter explicitly set to false
    run_after = tool_input.get('runAfter')
    if run_after is False:
        return False, "runAfter parameter explicitly set to false"

    # Check if edit was successful (look for success indicators in response)
    if isinstance(tool_response, dict) and 'content' in tool_response:
        content = tool_response['content']
        if isinstance(content, list) and len(content) > 0:
            for item in content:
                if item.get('type') == 'text':
                    text = item.get('text', '')
                    # Look for success indicators
                    if '✅' in text or 'Edit Successful' in text or '**Edit Successful**' in text:
                        # Also check it's not an error message
                        if '❌' not in text and 'Error:' not in text:
                            return True, "Edit completed successfully"

    return False, "Could not verify edit success from response"


def run_autohotkey_script(
    config: HookConfig,
    ahk_path: str,
    script_path: str
) -> tuple[bool, str]:
    """
    Execute the AutoHotkey script.

    Returns:
        (success, message) tuple
    """
    try:
        # Validate script exists
        if not os.path.exists(script_path):
            return False, f"Script file not found: {script_path}"

        # Build command
        cmd = [ahk_path, '/ErrorStdOut=utf-8', script_path]

        log_verbose(config, f"Executing: {' '.join(cmd)}")

        # Run the script with timeout
        start_time = time.time()
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=config.timeout,
            cwd=os.path.dirname(script_path)
        )

        elapsed = time.time() - start_time

        # Check result
        if result.returncode == 0:
            return True, f"Script executed successfully in {elapsed:.2f}s"
        else:
            stderr = result.stderr.strip() if result.stderr else "No error output"
            return False, f"Script failed with exit code {result.returncode}: {stderr}"

    except subprocess.TimeoutExpired:
        return False, f"Script execution timed out after {config.timeout}s"
    except Exception as e:
        return False, f"Failed to execute script: {str(e)}"


def main():
    """Main hook execution logic"""
    config = HookConfig()

    try:
        # Read hook input from stdin
        try:
            hook_input = json.load(sys.stdin)
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
            return 1

        # Extract hook data
        hook_event = hook_input.get('hook_event_name', '')
        tool_name = hook_input.get('tool_name', '')
        tool_input = hook_input.get('tool_input', {})
        tool_response = hook_input.get('tool_response', {})

        log_verbose(config, f"Hook event: {hook_event}")
        log_verbose(config, f"Tool name: {tool_name}")

        # Verify this is a PostToolUse event
        if hook_event != 'PostToolUse':
            log_verbose(config, f"Ignoring non-PostToolUse event: {hook_event}")
            return 0

        # Check if we should run the script
        should_run, reason = should_run_script(config, tool_name, tool_input, tool_response)
        log_verbose(config, f"Should run: {should_run}, Reason: {reason}")

        if not should_run:
            # Exit successfully - this is not an error, just a skip
            return 0

        # Extract file path from response
        script_path = extract_file_path_from_response(tool_response)
        if not script_path:
            # Also try from input
            script_path = tool_input.get('filePath')

        if not script_path:
            print("Warning: Could not extract script path from tool response", file=sys.stderr)
            return 1

        log_verbose(config, f"Script path: {script_path}")

        # Validate it's an .ahk file
        if not script_path.lower().endswith('.ahk'):
            log_verbose(config, f"Skipping non-.ahk file: {script_path}")
            return 0

        # Find AutoHotkey executable
        ahk_path = find_autohotkey(config)
        if not ahk_path:
            print("Error: AutoHotkey v2 not found. Please install from https://autohotkey.com", file=sys.stderr)
            return 1

        log_verbose(config, f"AutoHotkey path: {ahk_path}")

        # Run the script
        success, message = run_autohotkey_script(config, ahk_path, script_path)

        if success:
            print(f"✅ Auto-run: {message}", file=sys.stdout)
            return 0
        else:
            print(f"⚠️ Auto-run failed: {message}", file=sys.stderr)
            return 1

    except Exception as e:
        print(f"Error in hook execution: {str(e)}", file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
