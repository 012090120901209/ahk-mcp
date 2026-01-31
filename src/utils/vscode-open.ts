import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import logger from '../logger.js';
import { getVscodeWorkspace } from '../core/config.js';

export interface VSCodeOpenOptions {
  line?: number;
  column?: number;
  reuseWindow?: boolean;
  wait?: boolean;
  /** Workspace folder to target - opens file in the VS Code window with this folder */
  workspaceFolder?: string;
}

export interface VSCodeLaunchResult {
  command: string;
  args: string[];
  isWsl: boolean;
}

/**
 * Detect if running in WSL environment
 */
function isWsl(): boolean {
  // Check for WSL-specific indicators
  if (process.platform !== 'linux') return false;

  try {
    const release = execSync('uname -r', { encoding: 'utf8' }).toLowerCase();
    return release.includes('microsoft') || release.includes('wsl');
  } catch {
    // Fallback: check if /mnt/c exists (common WSL mount)
    try {
      require('fs').accessSync('/mnt/c');
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Convert WSL path to Windows path
 * /mnt/c/Users/... -> C:\Users\...
 */
function wslToWindowsPath(wslPath: string): string {
  if (!wslPath.startsWith('/mnt/')) return wslPath;

  const match = wslPath.match(/^\/mnt\/([a-z])\/(.*)$/i);
  if (match) {
    const drive = match[1].toUpperCase();
    const rest = match[2].replace(/\//g, '\\');
    return `${drive}:\\${rest}`;
  }
  return wslPath;
}

/**
 * Convert Windows path to WSL path (for validation)
 * C:\Users\... -> /mnt/c/Users/...
 */
function windowsToWslPath(winPath: string): string {
  const match = winPath.match(/^([a-zA-Z]):\\(.*)$/);
  if (match) {
    const drive = match[1].toLowerCase();
    const rest = match[2].replace(/\\/g, '/');
    return `/mnt/${drive}/${rest}`;
  }
  return winPath;
}

export async function openFileInVSCode(
  filePath: string,
  options: VSCodeOpenOptions = {}
): Promise<VSCodeLaunchResult> {
  const inWsl = isWsl();
  const resolvedPath = path.resolve(filePath);

  // Validate file exists
  await fs.access(resolvedPath);

  // Get workspace folder (from options or config)
  const workspaceFolder = options.workspaceFolder || getVscodeWorkspace();

  let command: string;
  let args: string[];
  let useShell: boolean;

  if (inWsl) {
    // In WSL: use cmd.exe to run VS Code with Windows paths
    command = 'cmd.exe';
    args = ['/c', 'code'];
    useShell = false;

    // Convert paths to Windows format
    const winFilePath = wslToWindowsPath(resolvedPath);
    const winWorkspace = workspaceFolder; // Already Windows format

    // Add workspace folder first to target that window
    if (winWorkspace) {
      args.push(winWorkspace);
    }

    if (options.reuseWindow !== false) {
      args.push('--reuse-window');
    }

    if (typeof options.line === 'number') {
      const line = options.line;
      const column = typeof options.column === 'number' ? options.column : 1;
      args.push('--goto', `${winFilePath}:${line}:${column}`);
    } else {
      args.push(winFilePath);
    }
  } else {
    // Native Windows or other: use code directly
    command = 'code';
    args = [];
    useShell = true;

    // Add workspace folder first to target that window
    if (workspaceFolder) {
      args.push(workspaceFolder);
    }

    if (options.reuseWindow !== false) {
      args.push('--reuse-window');
    }

    if (typeof options.line === 'number') {
      const line = options.line;
      const column = typeof options.column === 'number' ? options.column : 1;
      args.push('--goto', `${resolvedPath}:${line}:${column}`);
    } else {
      args.push(resolvedPath);
    }
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: 'ignore',
      shell: useShell,
    });

    child.on('error', error => {
      reject(error);
    });

    if (options.wait) {
      child.on('close', code => {
        if (code && code !== 0) {
          reject(new Error(`VS Code exited with code ${code}`));
        } else {
          resolve();
        }
      });
    } else {
      child.unref();
      // Give it a moment to start
      setTimeout(resolve, 100);
    }
  });

  const logArgs = args.join(' ');
  logger.info(`VS Code launch: ${command} ${logArgs}`);

  return { command, args, isWsl: inWsl };
}
