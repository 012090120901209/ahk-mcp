/**
 * Validates UIA selectors written into .ahk files against the live UI.
 *
 * A selector that compiles is not a selector that works. This resolves each one the same
 * way the script will at runtime, so a typo in an AutomationId surfaces at edit time
 * rather than as a silent no-op three steps into an automation run.
 *
 * Reporting is deliberately three-state. "Did not resolve" and "could not be checked
 * because the app is closed" are different facts, and only the first is a defect.
 */

import fs from 'fs';
import type { UiaResponse } from './uia-inspector.js';

/**
 * Loaded on demand so the pure extraction and reporting helpers stay importable without
 * dragging in the process spawner - which lets them be unit-tested directly.
 */
async function runInspector(request: Record<string, unknown>): Promise<UiaResponse> {
  const module = await import('./uia-inspector.js');
  return module.runInspector(request);
}

export type ValidationMode = 'off' | 'warn' | 'fail';

export interface ExtractedSelector {
  /** 1-indexed line in the source file. */
  line: number;
  /** The call that produced it, e.g. FindElement. */
  method: string;
  raw: string;
  automationId?: string;
  name?: string;
  controlType?: string;
}

export interface SelectorFinding extends ExtractedSelector {
  status: 'resolved' | 'unresolved' | 'unchecked';
  detail: string;
}

export interface ValidationReport {
  filePath: string;
  mode: ValidationMode;
  targetProcess?: string;
  findings: SelectorFinding[];
  unresolvedCount: number;
  uncheckedCount: number;
}

const FIND_CALL = /\.(FindElement|FindElements|WaitElement|ElementExist)\s*\(\s*\{([^}]*)\}/g;

/** Pull `ahk_exe foo.exe` out of the script so we know which window to resolve against. */
export function extractTargetProcess(source: string): string | undefined {
  const match = /ahk_exe\s+([A-Za-z0-9_.\- ]+?)\s*(?:"|`|$)/m.exec(source);
  return match ? match[1].trim() : undefined;
}

function readField(body: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const re = new RegExp(`(?:^|[,{\\s])${key}\\s*:\\s*"((?:[^"\`]|\`.)*)"`, 'i');
    const m = re.exec(body);
    if (m) {
      return m[1].replace(/`"/g, '"').replace(/``/g, '`');
    }
  }
  return undefined;
}

function readType(body: string): string | undefined {
  const quoted = readField(body, ['T', 'Type', 'ControlType']);
  if (quoted) return quoted;
  const numeric = /(?:^|[,{\s])(?:T|Type|ControlType)\s*:\s*(\d+)/i.exec(body);
  return numeric ? numeric[1] : undefined;
}

export function extractSelectors(source: string): ExtractedSelector[] {
  const selectors: ExtractedSelector[] = [];
  const lineStarts: number[] = [0];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') lineStarts.push(i + 1);
  }
  const lineOf = (index: number): number => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (lineStarts[mid] <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };

  FIND_CALL.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FIND_CALL.exec(source)) !== null) {
    const body = match[2];
    const automationId = readField(body, ['A', 'AutomationId']);
    const name = readField(body, ['N', 'Name']);
    if (!automationId && !name) {
      // Nothing addressable to check - e.g. a pure type-and-index condition.
      continue;
    }
    selectors.push({
      line: lineOf(match.index),
      method: match[1],
      raw: `{${body.trim()}}`,
      automationId,
      name,
      controlType: readType(body),
    });
  }
  return selectors;
}

async function findWindowFor(processName: string): Promise<number | undefined> {
  const response = await runInspector({ op: 'uia_windows', filter: processName });
  if (!response.ok || !response.data) return undefined;
  const windows = (response.data.windows as Array<Record<string, unknown>>) ?? [];
  const usable = windows.find(w => w.isVisible === true) ?? windows[0];
  return usable ? Number(usable.hwnd) : undefined;
}

export async function validateFile(
  filePath: string,
  mode: ValidationMode
): Promise<ValidationReport> {
  const report: ValidationReport = {
    filePath,
    mode,
    findings: [],
    unresolvedCount: 0,
    uncheckedCount: 0,
  };
  if (mode === 'off') return report;

  const source = fs.readFileSync(filePath, 'utf8');
  const selectors = extractSelectors(source);
  if (selectors.length === 0) return report;

  const targetProcess = extractTargetProcess(source);
  report.targetProcess = targetProcess;

  const hwnd = targetProcess ? await findWindowFor(targetProcess) : undefined;

  for (const selector of selectors) {
    if (!targetProcess) {
      report.findings.push({
        ...selector,
        status: 'unchecked',
        detail: 'No `ahk_exe` in the script, so there is no window to resolve against.',
      });
      report.uncheckedCount++;
      continue;
    }
    if (!hwnd) {
      report.findings.push({
        ...selector,
        status: 'unchecked',
        detail: `${targetProcess} is not running, so the selector could not be checked.`,
      });
      report.uncheckedCount++;
      continue;
    }

    const response = await runInspector({
      op: 'uia_element',
      hwnd,
      ...(selector.automationId ? { automationId: selector.automationId } : {}),
      ...(selector.name ? { name: selector.name } : {}),
      ...(selector.controlType && !/^\d+$/.test(selector.controlType)
        ? { controlType: selector.controlType }
        : {}),
    });

    if (response.ok) {
      report.findings.push({
        ...selector,
        status: 'resolved',
        detail: 'Resolved against the live window.',
      });
    } else {
      report.findings.push({
        ...selector,
        status: 'unresolved',
        detail: response.error?.message ?? 'Did not resolve.',
      });
      report.unresolvedCount++;
    }
  }

  return report;
}

export function formatReport(report: ValidationReport): string {
  if (report.findings.length === 0) {
    return '';
  }
  const lines = [`UIA selector validation — ${report.filePath}`];
  if (report.targetProcess) {
    lines.push(`target: ${report.targetProcess}`);
  }
  for (const f of report.findings) {
    const icon = f.status === 'resolved' ? 'ok  ' : f.status === 'unresolved' ? 'FAIL' : 'skip';
    lines.push(`  ${icon} line ${f.line} ${f.method}${f.raw} — ${f.detail}`);
  }
  lines.push(
    `${report.findings.length} selector(s): ${report.findings.length - report.unresolvedCount - report.uncheckedCount} resolved, ${report.unresolvedCount} unresolved, ${report.uncheckedCount} unchecked.`
  );
  return lines.join('\n');
}

/** Exit code contract for the PostToolUse hook: 2 blocks, 0 does not. */
export function exitCodeFor(report: ValidationReport): number {
  if (report.mode === 'fail' && report.unresolvedCount > 0) return 2;
  return 0;
}
