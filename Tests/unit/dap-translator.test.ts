/**
 * Unit tests for src/dap/translator.ts — pure-function DBGp <-> DAP mapping.
 * No DBGp client is instantiated here; fixtures mimic the shape returned by
 * the existing parseStack / parseProperties helpers.
 */

import {
  fileUriToPath,
  pathToFileUri,
  dbgpFramesToDap,
  dbgpVariablesToDap,
  buildScopesForFrame,
  encodeScopeRef,
  decodeScopeRef,
  CHILD_REF_BASE,
  mapBreakReason,
} from '../../src/dap/translator';
import type { StackFrame, Variable } from '../../src/core/dbgp-client';

describe('DAP translator - file URIs', () => {
  it('converts Windows file URIs to backslash paths', () => {
    expect(fileUriToPath('file:///C:/Users/foo/bar.ahk')).toBe('C:\\Users\\foo\\bar.ahk');
  });

  it('converts POSIX file URIs to forward-slash paths', () => {
    expect(fileUriToPath('file:///home/db/script.ahk')).toBe('/home/db/script.ahk');
  });

  it('round-trips Windows paths via pathToFileUri + fileUriToPath', () => {
    const original = 'C:\\Users\\foo\\bar.ahk';
    expect(fileUriToPath(pathToFileUri(original))).toBe(original);
  });

  it('returns empty string for empty input', () => {
    expect(fileUriToPath('')).toBe('');
  });
});

describe('DAP translator - stack frames', () => {
  const frames: StackFrame[] = [
    {
      level: 0,
      type: 'file',
      filename: 'file:///C:/proj/main.ahk',
      lineno: 42,
      where: 'MyFunc',
    },
    {
      level: 1,
      type: 'file',
      filename: 'file:///C:/proj/lib.ahk',
      lineno: 7,
      where: 'Helper',
    },
  ];

  it('allocates unique frame ids via the provided allocator', () => {
    const levels: number[] = [];
    let counter = 100;
    const dap = dbgpFramesToDap(frames, level => {
      levels.push(level);
      return counter++;
    });
    expect(dap).toHaveLength(2);
    expect(dap[0].id).toBe(100);
    expect(dap[1].id).toBe(101);
    expect(levels).toEqual([0, 1]);
  });

  it('populates source.path with platform-formatted path', () => {
    const dap = dbgpFramesToDap(frames, () => 1);
    expect(dap[0].source?.path).toBe('C:\\proj\\main.ahk');
    expect(dap[0].source?.name).toBe('main.ahk');
  });

  it('uses "where" as frame name, falling back to numeric index', () => {
    const anon: StackFrame[] = [{ level: 3, type: 'file', filename: 'file:///x.ahk', lineno: 1 }];
    const dap = dbgpFramesToDap(anon, () => 1);
    expect(dap[0].name).toBe('frame 3');
  });
});

describe('DAP translator - scopes + variable refs', () => {
  it('encodes and decodes scope refs losslessly for small frame ids', () => {
    for (const fid of [1, 7, 42, 99_999]) {
      const localRef = encodeScopeRef(fid, 0);
      const globalRef = encodeScopeRef(fid, 1);
      expect(decodeScopeRef(localRef)).toEqual({ frameId: fid, scopeId: 0 });
      expect(decodeScopeRef(globalRef)).toEqual({ frameId: fid, scopeId: 1 });
    }
  });

  it('returns null when decoding a child ref (>= CHILD_REF_BASE)', () => {
    expect(decodeScopeRef(CHILD_REF_BASE)).toBeNull();
    expect(decodeScopeRef(CHILD_REF_BASE + 17)).toBeNull();
  });

  it('buildScopesForFrame returns Local then Global', () => {
    const scopes = buildScopesForFrame(5);
    expect(scopes.map(s => s.name)).toEqual(['Local', 'Global']);
    expect(scopes[0].variablesReference).toBe(encodeScopeRef(5, 0));
    expect(scopes[1].variablesReference).toBe(encodeScopeRef(5, 1));
    expect(scopes[0].expensive).toBe(false);
    expect(scopes[1].expensive).toBe(true);
  });
});

describe('DAP translator - variables', () => {
  it('assigns variablesReference=0 for scalars', () => {
    const vars: Variable[] = [{ name: 'x', fullname: 'x', type: 'integer', value: '42' }];
    const allocations: number[] = [];
    const dap = dbgpVariablesToDap(vars, 1, () => {
      allocations.push(1);
      return 500_000;
    });
    expect(dap[0].variablesReference).toBe(0);
    expect(allocations).toHaveLength(0);
    expect(dap[0].evaluateName).toBe('x');
  });

  it('allocates a child ref for properties with children="1"', () => {
    // parseProperties flattens attributes onto the Variable object; we
    // simulate that here with a cast.
    const vars: Variable[] = [
      // Cast-through-unknown because parseProperties flattens arbitrary DBGp
      // attributes (children, numchildren) onto the object at runtime.
      {
        children: '1',
        numchildren: '3',
        name: 'arr',
        fullname: 'arr',
        type: 'object',
        value: '',
      } as unknown as Variable,
    ];
    let allocated = 0;
    const dap = dbgpVariablesToDap(vars, 7, desc => {
      allocated++;
      expect(desc.kind).toBe('child');
      if (desc.kind === 'child') {
        expect(desc.fullname).toBe('arr');
        expect(desc.frameId).toBe(7);
      }
      return 1_000_007;
    });
    expect(allocated).toBe(1);
    expect(dap[0].variablesReference).toBe(1_000_007);
  });
});

describe('DAP translator - stop reason mapping', () => {
  it('maps step command to "step"', () => {
    expect(mapBreakReason('break', undefined, 'step')).toBe('step');
  });

  it('maps pause command to "pause"', () => {
    expect(mapBreakReason('break', undefined, 'pause')).toBe('pause');
  });

  it('maps launch command to "entry"', () => {
    expect(mapBreakReason('break', undefined, 'launch')).toBe('entry');
  });

  it('maps exception reason to "exception" regardless of command', () => {
    expect(mapBreakReason('break', 'exception', 'run')).toBe('exception');
    expect(mapBreakReason('break', 'error', 'step')).toBe('exception');
  });

  it('defaults to "breakpoint" for run after no exception', () => {
    expect(mapBreakReason('break', 'ok', 'run')).toBe('breakpoint');
  });
});
