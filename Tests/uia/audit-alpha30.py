#!/usr/bin/env python3
"""Audit an AHK v2.0-era library for v2.1-alpha.30 breaking changes.

The dangerous class is implicit return. In v2.0 a function that fell off the end
yielded "". In alpha.30 it yields blank-unset, so `if x := f()` throws
"No value was returned." That is a runtime landmine, not a syntax error, so it
cannot be caught by /validate.
"""
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else 'scripts/UIA.ahk'
raw = open(path, encoding='utf-8-sig', errors='surrogateescape').read()
lines = raw.split('\n')


def strip_code(line):
    """Remove strings and line comments so brace counting is reliable."""
    out = []
    i = 0
    in_str = None
    while i < len(line):
        ch = line[i]
        if in_str:
            if ch == '`':
                i += 2
                continue
            if ch == in_str:
                in_str = None
            i += 1
            continue
        if ch in '"\'':
            in_str = ch
            i += 1
            continue
        if ch == ';' and (i == 0 or line[i - 1] in ' \t'):
            break
        out.append(ch)
        i += 1
    return ''.join(out)


# Mask block comments.
code = []
in_block = False
for ln in lines:
    s = ln.strip()
    if in_block:
        code.append('')
        if s.startswith('*/') or s.endswith('*/'):
            in_block = False
        continue
    if s.startswith('/*'):
        in_block = True
        code.append('')
        continue
    code.append(strip_code(ln))

FUNC_DEF = re.compile(r'^(\s*)([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*\{\s*$')
GETSET = re.compile(r'^(\s*)(get|set)\s*\{\s*$')

funcs = []
for idx, ln in enumerate(code):
    m = FUNC_DEF.match(ln)
    kind = None
    if m:
        name, indent = m.group(2), len(m.group(1))
        if name.lower() in ('if', 'while', 'for', 'loop', 'switch', 'catch', 'else', 'try'):
            continue
        kind = 'func'
    else:
        m = GETSET.match(ln)
        if m:
            name, indent = m.group(2), len(m.group(1))
            kind = 'accessor'
    if not kind:
        continue

    depth = 0
    end = None
    for j in range(idx, len(code)):
        depth += code[j].count('{') - code[j].count('}')
        if depth == 0 and j > idx:
            end = j
            break
    if end is None:
        continue
    funcs.append((name, kind, idx, end))

risky = []
for name, kind, start, end in funcs:
    body = code[start + 1:end]
    # Ignore nested function bodies when judging the tail statement.
    has_value_return = any(re.search(r'\breturn\s+\S', b) for b in body)
    if not has_value_return:
        continue

    # Walk backwards for the last executable statement at the function's own level.
    tail = None
    tail_raw = None
    for b in reversed(body):
        s = b.strip()
        if not s or s in ('}', '{'):
            continue
        tail = s
        tail_raw = b
        break
    if tail is None:
        continue

    # A tail return nested deeper than the body's own level is conditional, so the
    # function still falls through when the condition is false.
    base_indent = None
    for b in body:
        if b.strip():
            base_indent = len(b) - len(b.lstrip())
            break
    tail_indent = len(tail_raw) - len(tail_raw.lstrip())
    unconditional = base_indent is not None and tail_indent <= base_indent

    terminal = unconditional and (
        tail.startswith('return')
        or tail.startswith('throw')
        or tail.startswith('Throw')
        or tail.startswith('ExitApp')
    )
    if terminal:
        continue
    why = 'falls through' if not tail.startswith(('return', 'throw', 'Throw')) else 'conditional tail return'
    risky.append((name, kind, start + 1, end + 1, why, tail[:60]))

print(f'{path}: {len(funcs)} function/accessor bodies scanned\n')
print(f'MIXED RETURN (value-return + can fall through) — {len(risky)} found:')
for name, kind, s, e, why, tail in risky:
    print(f'  line {s:>5}-{e:<5} {name:34} {why:24} {tail}')

print('\nSYNTAX-LEVEL alpha.30 breaks:')
checks = [
    (r'\?\.\(', 'maybe-call a?.() removed'),
    (r'\?\.\[', 'maybe-index a?.[] removed'),
    (r'\b(?:i8|i16|i32|i64|u8|u16|u32|u64|f32|f64|uptr|iptr)\s*:', 'property type string removed'),
    (r'![A-Za-z_][A-Za-z0-9_.]*\s*\?\?', 'unparenthesised !a ?? b'),
    (r'DeleteProp\([^)]*\)\s*\|\|', 'DeleteProp(missing) throws'),
]
for pattern, label in checks:
    hits = [i + 1 for i, ln in enumerate(code) if re.search(pattern, ln)]
    print(f'  {label:38} {len(hits):>3} {hits[:8] if hits else ""}')

