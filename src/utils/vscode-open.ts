import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import logger from '../logger.js';

export interface VSCodeOpenOptions {
  line?: number;
  column?: number;
  reuseWindow?: boolean;
  wait?: boolean;
}

export interface VSCodeLaunchResult {
  command: string;
  args: string[];
}

function isShellCommand(command: string): boolean {
  const ext = path.extname(command).toLowerCase();
  if (ext === '.cmd' || ext === '.bat') return true;
  return command.toLowerCase() === 'code';
}

function normalizeCommand(candidate: string): string {
  const trimmed = candidate.trim();
  if (!trimmed) return '';

  const looksLikePath =
    trimmed.includes(path.sep) || /^[a-zA-Z]:[\\/]/.test(trimmed) || trimmed.startsWith('\\\\');
  return looksLikePath ? path.resolve(trimmed) : trimmed;
}

async function resolveVSCodeCommand(): Promise<string> {
  const candidates: string[] = [];
  const override = process.env.AHK_MCP_VSCODE_CMD;
  if (override) candidates.push(normalizeCommand(override));

  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    candidates.push(path.join(localAppData, 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd'));
    candidates.push(path.join(localAppData, 'Programs', 'Microsoft VS Code', 'Code.exe'));
  }

  const programFiles = process.env['ProgramFiles'];
  if (programFiles) {
    candidates.push(path.join(programFiles, 'Microsoft VS Code', 'bin', 'code.cmd'));
    candidates.push(path.join(programFiles, 'Microsoft VS Code', 'Code.exe'));
  }

  const programFilesX86 = process.env['ProgramFiles(x86)'];
  if (programFilesX86) {
    candidates.push(path.join(programFilesX86, 'Microsoft VS Code', 'bin', 'code.cmd'));
    candidates.push(path.join(programFilesX86, 'Microsoft VS Code', 'Code.exe'));
  }

  candidates.push('code');

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate.toLowerCase() === 'code') {
      return candidate;
    }
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return 'code';
}

export async function openFileInVSCode(
  filePath: string,
  options: VSCodeOpenOptions = {}
): Promise<VSCodeLaunchResult> {
  const resolvedPath = path.resolve(filePath);
  await fs.access(resolvedPath);

  const command = await resolveVSCodeCommand();
  const args: string[] = [];

  if (options.reuseWindow !== false) {
    args.push('--reuse-window');
  }

  if (typeof options.line === 'number') {
    const line = options.line;
    const column = typeof options.column === 'number' ? options.column : 1;
    args.push('--goto');
    args.push(`${resolvedPath}:${line}:${column}`);
  } else {
    args.push(resolvedPath);
  }

  const useShell = isShellCommand(command);

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
      resolve();
    }
  });

  logger.info(`VS Code launch: ${command} ${args.join(' ')}`);

  return { command, args };
}
