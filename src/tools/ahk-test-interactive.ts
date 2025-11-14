import { z } from 'zod';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import logger from '../logger.js';
import { McpToolResponse, createTextResponse, createErrorResponse } from '../types/mcp-types.js';

export const TestInteractiveArgsSchema = z.object({
  scriptContent: z.string().describe('AHK v2 script code to test'),
  testDescription: z.string().describe('Description of what to test'),
  timeout: z.number().default(300000).describe('Max wait time in ms (5 minutes default)'),
  ahkPath: z.string().optional().describe('Path to AutoHotkey v2 executable (auto-detected if not provided)')
});

export type TestInteractiveToolArgs = z.infer<typeof TestInteractiveArgsSchema>;

export const ahkTestInteractiveToolDefinition = {
  name: 'AHK_Test_Interactive',
  description: 'Run AHK script with interactive GUI feedback interface. Opens a GUI with PASS/FAIL buttons, captures script output, and waits for manual test verification. Returns pass/fail status and any output captured.',
  inputSchema: {
    type: 'object',
    properties: {
      scriptContent: {
        type: 'string',
        description: 'AutoHotkey v2 script code to test'
      },
      testDescription: {
        type: 'string',
        description: 'Description of what this test validates'
      },
      timeout: {
        type: 'number',
        description: 'Maximum wait time in milliseconds (default: 300000 = 5 minutes)',
        default: 300000
      },
      ahkPath: {
        type: 'string',
        description: 'Path to AutoHotkey v2 executable (auto-detected if not provided)'
      }
    },
    required: ['scriptContent', 'testDescription']
  }
};

export class AhkTestInteractiveTool {
  private static readonly AHK_COMMON_PATHS = [
    'C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey64.exe',
    'C:\\Program Files (x86)\\AutoHotkey\\v2\\AutoHotkey64.exe',
    'C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey.exe',
    'C:\\Program Files (x86)\\AutoHotkey\\v2\\AutoHotkey.exe'
  ];

  private static async findAutoHotkeyPath(): Promise<string | undefined> {
    // Check common installation paths
    for (const ahkPath of AhkTestInteractiveTool.AHK_COMMON_PATHS) {
      try {
        await fs.access(ahkPath);
        logger.info(`Found AutoHotkey at: ${ahkPath}`);
        return ahkPath;
      } catch {
        // Continue checking other paths
      }
    }

    // Try to find via PATH
    if (os.platform() === 'win32') {
      try {
        const { execSync } = await import('child_process');
        const stdout = execSync('where AutoHotkey64.exe', { encoding: 'utf-8' });
        const foundPath = stdout.trim().split('\n')[0];
        if (foundPath) {
          logger.info(`Found AutoHotkey in PATH: ${foundPath}`);
          return foundPath;
        }
      } catch {
        // Fall through
      }
    }

    return undefined;
  }

  async execute(args: z.infer<typeof TestInteractiveArgsSchema>): Promise<McpToolResponse> {
    try {
      const { scriptContent, testDescription, timeout, ahkPath } = TestInteractiveArgsSchema.parse(args);

      // Auto-detect AutoHotkey path if not provided
      let resolvedAhkPath = ahkPath;
      if (!resolvedAhkPath) {
        resolvedAhkPath = await AhkTestInteractiveTool.findAutoHotkeyPath();
        if (!resolvedAhkPath) {
          throw new Error('AutoHotkey v2 not found. Please install AutoHotkey v2 or provide ahkPath parameter.');
        }
      }

      // Validate AutoHotkey executable
      try {
        await fs.access(resolvedAhkPath);
      } catch {
        throw new Error(`AutoHotkey executable not found at: ${resolvedAhkPath}`);
      }

      // Escape special characters for AHK string
      const escapeAhkString = (str: string): string => {
        return str
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '""')
          .replace(/`/g, '``')
          .replace(/\r?\n/g, '`n')
          .replace(/\t/g, '`t');
      };

      // Create wrapper script with GUI
      const wrapperScript = `#Requires AutoHotkey v2.0

; ============================================
; TEST SCRIPT WRAPPER WITH INTERACTIVE GUI
; ============================================

; Initialize output capture
global OutputCapture := ""
global TestPassed := -1  ; -1 = pending, 0 = failed, 1 = passed

; Redirect OutputDebug to capture buffer
OutputDebug := (text) => {
    global OutputCapture
    OutputCapture .= text . "\`n"
}

; ============================================
; YOUR TEST SCRIPT BEGINS HERE
; ============================================
try {
    ${scriptContent}
} catch Error as err {
    OutputDebug("❌ ERROR: " . err.Message)
    OutputDebug("   Line: " . err.Line)
    OutputDebug("   File: " . err.File)
}

; ============================================
; INTERACTIVE TEST GUI
; ============================================

; Create GUI
TestGui := Gui("+AlwaysOnTop +ToolWindow", "MCP Interactive Test")
TestGui.SetFont("s10")

; Test description
TestGui.AddText("w500 Section", "Test Description:")
TestGui.AddEdit("w500 r3 ReadOnly Background0xF0F0F0", "${escapeAhkString(testDescription)}")

; Output section
TestGui.AddText("w500 xs Section", "Script Output:")
global OutputEdit := TestGui.AddEdit("w500 r10 ReadOnly VScroll Background0xFFFFFF", OutputCapture)

; Status
TestGui.AddText("w500 xs Section", "Manual Verification Required:")
TestGui.AddText("w500 xs", "Did the test execute correctly?")

; Buttons
PassBtn := TestGui.AddButton("w240 h40 xs", "✅ PASS")
PassBtn.OnEvent("Click", (*) => {
    global TestPassed := 1
    ExitApp(0)
})

FailBtn := TestGui.AddButton("w240 h40 x+20", "❌ FAIL")
FailBtn.OnEvent("Click", (*) => {
    global TestPassed := 0
    ExitApp(1)
})

; Refresh button
RefreshBtn := TestGui.AddButton("w500 xs", "🔄 Refresh Output")
RefreshBtn.OnEvent("Click", (*) => {
    global OutputEdit
    global OutputCapture
    OutputEdit.Value := OutputCapture
})

; Set up periodic refresh (every 500ms)
RefreshTimer := () => {
    global OutputEdit
    global OutputCapture
    if (WinExist("ahk_id " TestGui.Hwnd)) {
        OutputEdit.Value := OutputCapture
    }
}
SetTimer(RefreshTimer, 500)

TestGui.OnEvent("Close", (*) => ExitApp(1))
TestGui.Show()
`;

      // Create temp file
      const tempFile = path.join(os.tmpdir(), `mcp-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.ahk`);
      await fs.writeFile(tempFile, wrapperScript, 'utf-8');
      logger.info(`Created test script: ${tempFile}`);

      try {
        // Run the script and wait for result
        const result = await new Promise<{ passed: boolean, exitCode: number, output: string }>((resolve, reject) => {
          const child = spawn(resolvedAhkPath, [tempFile], {
            stdio: ['ignore', 'pipe', 'pipe']
          });

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });

          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          // Timeout handler
          const timeoutId = setTimeout(() => {
            child.kill('SIGTERM');
            setTimeout(() => child.kill('SIGKILL'), 2000);
            reject(new Error(`Test timed out after ${timeout}ms`));
          }, timeout);

          child.on('error', (err) => {
            clearTimeout(timeoutId);
            reject(new Error(`Failed to start test script: ${err.message}`));
          });

          child.on('exit', (code) => {
            clearTimeout(timeoutId);
            const output = (stdout + stderr).trim();
            resolve({
              passed: code === 0,
              exitCode: code ?? -1,
              output
            });
          });
        });

        // Clean up temp file
        try {
          await fs.unlink(tempFile);
          logger.info(`Cleaned up temp file: ${tempFile}`);
        } catch (cleanupErr) {
          logger.warn(`Failed to clean up temp file: ${cleanupErr}`);
        }

        // Format result
        const statusIcon = result.passed ? '✅' : '❌';
        const statusText = result.passed ? 'PASSED' : 'FAILED';

        return {
          content: [
            {
              type: 'text' as const,
              text: `${statusIcon} Test Result: ${statusText}`
            },
            {
              type: 'text' as const,
              text: `📋 Test: ${testDescription}`
            },
            {
              type: 'text' as const,
              text: `🔢 Exit Code: ${result.exitCode}`
            },
            ...(result.output ? [{
              type: 'text' as const,
              text: `📤 Output:\n${result.output}`
            }] : [])
          ]
        };

      } catch (error) {
        // Clean up temp file on error
        try {
          await fs.unlink(tempFile);
        } catch {
          // Ignore cleanup errors
        }
        throw error;
      }

    } catch (error) {
      logger.error('Error in AHK_Test_Interactive tool:', error);

      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;

        if (error.message.includes('AutoHotkey') && error.message.includes('not found')) {
          errorMessage += '\n\nTip: Install AutoHotkey v2 from https://autohotkey.com or specify the ahkPath parameter.';
        } else if (error.message.includes('timed out')) {
          errorMessage += '\n\nTip: The test GUI was not responded to within the timeout period. Increase the timeout parameter if needed.';
        }
      }

      return {
        content: [{ type: 'text', text: `❌ Error: ${errorMessage}` }]
      };
    }
  }
}