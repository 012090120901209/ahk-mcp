import { describe, expect, it } from '@jest/globals';
import {
  extractSelectors,
  extractTargetProcess,
  formatReport,
  exitCodeFor,
  type ValidationReport,
} from '../../src/core/uia-selector-validator.js';

describe('extractTargetProcess', () => {
  it('pulls the executable out of an ahk_exe window spec', () => {
    const source = 'hwnd := WinExist("Sound Recorder ahk_exe VoiceRecorder.exe")';
    expect(extractTargetProcess(source)).toBe('VoiceRecorder.exe');
  });

  it('returns undefined when the script never names a process', () => {
    expect(extractTargetProcess('el := UIA.ElementFromHandle(hwnd)')).toBeUndefined();
  });
});

describe('extractSelectors', () => {
  it('finds each supported lookup method with its line number', () => {
    const source = [
      '#Requires AutoHotkey v2.1-alpha.30',
      'a := root.FindElement({A: "SaveButton"})',
      'b := root.WaitElement({N: "Cancel"})',
      'c := root.ElementExist({T: 50000, N: "Close"})',
      'd := root.FindElements({A: "Row"})',
    ].join('\n');

    const found = extractSelectors(source);
    expect(found.map(s => s.method)).toEqual([
      'FindElement',
      'WaitElement',
      'ElementExist',
      'FindElements',
    ]);
    expect(found.map(s => s.line)).toEqual([2, 3, 4, 5]);
  });

  it('captures automationId, name and control type', () => {
    const [selector] = extractSelectors(
      'x := root.FindElement({T: "Button", N: "Save", A: "SaveBtn"})'
    );
    expect(selector.automationId).toBe('SaveBtn');
    expect(selector.name).toBe('Save');
    expect(selector.controlType).toBe('Button');
  });

  it('reads a numeric control type', () => {
    const [selector] = extractSelectors('x := root.FindElement({T: 50000, N: "Save"})');
    expect(selector.controlType).toBe('50000');
  });

  it('unescapes AHK backtick escapes inside names', () => {
    const [selector] = extractSelectors('x := root.FindElement({N: "He said `"hi`""})');
    expect(selector.name).toBe('He said "hi"');
  });

  it('skips conditions with nothing addressable to resolve', () => {
    expect(extractSelectors('x := root.FindElement({T: 50000, i: 2})')).toHaveLength(0);
  });

  it('ignores unrelated method calls', () => {
    expect(extractSelectors('x := root.GetChildren()\ny := Foo({A: "bar"})')).toHaveLength(0);
  });
});

describe('exitCodeFor', () => {
  const base: ValidationReport = {
    filePath: 'x.ahk',
    mode: 'warn',
    findings: [],
    unresolvedCount: 0,
    uncheckedCount: 0,
  };

  it('never blocks in warn mode', () => {
    expect(exitCodeFor({ ...base, mode: 'warn', unresolvedCount: 3 })).toBe(0);
  });

  it('blocks in fail mode only when a selector genuinely did not resolve', () => {
    expect(exitCodeFor({ ...base, mode: 'fail', unresolvedCount: 1 })).toBe(2);
    expect(exitCodeFor({ ...base, mode: 'fail', unresolvedCount: 0 })).toBe(0);
  });

  it('does not block when the target app was simply closed', () => {
    expect(exitCodeFor({ ...base, mode: 'fail', uncheckedCount: 5 })).toBe(0);
  });

  it('is inert when disabled', () => {
    expect(exitCodeFor({ ...base, mode: 'off', unresolvedCount: 9 })).toBe(0);
  });
});

describe('formatReport', () => {
  it('returns empty text when there is nothing to say', () => {
    expect(
      formatReport({
        filePath: 'x.ahk',
        mode: 'warn',
        findings: [],
        unresolvedCount: 0,
        uncheckedCount: 0,
      })
    ).toBe('');
  });

  it('marks each finding with its status', () => {
    const text = formatReport({
      filePath: 'x.ahk',
      mode: 'warn',
      targetProcess: 'Notepad.exe',
      unresolvedCount: 1,
      uncheckedCount: 0,
      findings: [
        {
          line: 2,
          method: 'FindElement',
          raw: '{A: "ok"}',
          status: 'resolved',
          detail: 'Resolved.',
        },
        {
          line: 3,
          method: 'FindElement',
          raw: '{A: "no"}',
          status: 'unresolved',
          detail: 'Did not resolve.',
        },
      ],
    });
    expect(text).toContain('ok   line 2');
    expect(text).toContain('FAIL line 3');
    expect(text).toContain('Notepad.exe');
  });
});
