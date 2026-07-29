/**
 * Pure translation helpers between DBGp and DAP shapes.
 *
 * Everything in this file is side-effect free so it can be unit-tested without
 * spinning up a DBGp mock. DBGp XML is produced by the existing
 * `parseStack` / `parseProperties` helpers in `dbgp-client.ts`, but we also
 * accept raw XML strings here so tests can pin exact byte-for-byte behaviour.
 */

import type { StackFrame, Variable } from '../core/dbgp-client.js';
import type { DapStackFrame, DapVariable, DapSource, DapScope, VariableRef } from './types.js';

// ----------------------------------------------------------------------------
// File path helpers
// ----------------------------------------------------------------------------

/**
 * Convert a DBGp `fileuri` (e.g. `file:///C:/foo/bar.ahk`) to a platform path.
 * DBGp URIs always use forward slashes; on Windows we strip the leading
 * `file:///` while on POSIX we keep the single leading slash.
 */
export function fileUriToPath(uri: string): string {
  if (!uri) return '';
  const trimmed = uri.replace(/^file:\/\//, '');
  // Windows paths look like "/C:/foo" after stripping. Drop the leading slash.
  if (/^\/[A-Za-z]:\//.test(trimmed)) {
    return trimmed.slice(1).replace(/\//g, '\\');
  }
  return trimmed;
}

/**
 * Convert an absolute path to a DBGp file URI. The existing client already
 * does this inline for `breakpoint_set`; we expose it here for tests.
 */
export function pathToFileUri(absPath: string): string {
  const normalized = absPath.replace(/\\/g, '/');
  if (/^[A-Za-z]:\//.test(normalized)) {
    return `file:///${normalized}`;
  }
  // POSIX absolute path starts with `/`
  if (normalized.startsWith('/')) {
    return `file://${normalized}`;
  }
  return `file:///${normalized}`;
}

// ----------------------------------------------------------------------------
// Stack frame translation
// ----------------------------------------------------------------------------

/**
 * Build DAP StackFrame entries from DBGp stack frames.
 *
 * Frame IDs are session-scoped and must be unique. We accept a
 * `frameIdAllocator` so the session can keep a monotonic counter and remember
 * the mapping (frameId -> DBGp stack level) for subsequent `scopes` /
 * `variables` requests.
 */
export function dbgpFramesToDap(
  frames: StackFrame[],
  frameIdAllocator: (dbgpLevel: number) => number
): DapStackFrame[] {
  return frames.map(frame => {
    const path = fileUriToPath(frame.filename);
    const source: DapSource = {
      name: path ? path.split(/[\\/]/).pop() : undefined,
      path: path || undefined,
    };
    return {
      id: frameIdAllocator(frame.level),
      name: frame.where || `frame ${frame.level}`,
      source,
      line: frame.lineno,
      column: 1,
    };
  });
}

// ----------------------------------------------------------------------------
// Scope / variable translation
// ----------------------------------------------------------------------------

/**
 * Build the two standard DAP scopes (Local, Global) for a given frame.
 * The `variablesReference` pair is encoded as `frameId*10 + scopeId` so the
 * session can decode without a second lookup table (and collisions with child
 * handles are avoided by allocating those from a separate >= 1_000_000 range).
 */
export function buildScopesForFrame(frameId: number): DapScope[] {
  return [
    {
      name: 'Local',
      variablesReference: encodeScopeRef(frameId, 0),
      expensive: false,
      presentationHint: 'locals',
    },
    {
      name: 'Global',
      variablesReference: encodeScopeRef(frameId, 1),
      expensive: true,
    },
  ];
}

export function encodeScopeRef(frameId: number, scopeId: 0 | 1): number {
  return frameId * 10 + scopeId;
}

/** Try to decode a scope variablesReference. Returns null if it's not one. */
export function decodeScopeRef(ref: number): { frameId: number; scopeId: 0 | 1 } | null {
  if (ref <= 0 || ref >= CHILD_REF_BASE) return null;
  const scopeId = ref % 10;
  if (scopeId !== 0 && scopeId !== 1) return null;
  return { frameId: Math.floor(ref / 10), scopeId: scopeId as 0 | 1 };
}

/** Child variable references start here so they can't collide with scopes. */
export const CHILD_REF_BASE = 1_000_000;

/**
 * Convert DBGp properties to DAP variables. Container types (object/array in
 * AHK terms: any with children) get a non-zero `variablesReference` allocated
 * via the supplied function so the client can drill down.
 */
export function dbgpVariablesToDap(
  variables: Variable[],
  frameId: number,
  allocChildRef: (ref: VariableRef) => number
): DapVariable[] {
  return variables.map(v => {
    // Heuristic: DBGp exposes `children="1"` on container properties. Our
    // existing parseProperties flattens all attributes into the Variable
    // object, but the typed interface only names name/fullname/type/value.
    // We cast to a record to inspect the extra attributes safely.
    const raw = v as unknown as Record<string, unknown>;
    const hasChildren =
      raw.children === '1' ||
      raw.children === 1 ||
      (typeof raw.numchildren === 'string' && parseInt(raw.numchildren, 10) > 0);

    const fullname = v.fullname || v.name;
    const variablesReference = hasChildren
      ? allocChildRef({ kind: 'child', fullname, frameId })
      : 0;

    return {
      name: v.name,
      value: v.value ?? '',
      type: v.type,
      variablesReference,
      evaluateName: fullname,
    };
  });
}

// ----------------------------------------------------------------------------
// Stopped-event reason mapping
// ----------------------------------------------------------------------------

/**
 * Map a DBGp response `status`/`reason` pair to a DAP stopped-event reason.
 * DBGp statuses: starting, stopping, stopped, running, break.
 * DBGp reasons on break: ok | error | aborted | exception.
 */
export function mapBreakReason(
  status: string | undefined,
  reason: string | undefined,
  lastCommand: 'run' | 'step' | 'pause' | 'launch' | undefined
): 'step' | 'breakpoint' | 'exception' | 'pause' | 'entry' {
  if (reason === 'exception' || reason === 'error') return 'exception';
  if (lastCommand === 'step') return 'step';
  if (lastCommand === 'pause') return 'pause';
  if (lastCommand === 'launch') return 'entry';
  if (status === 'break') return 'breakpoint';
  return 'breakpoint';
}
