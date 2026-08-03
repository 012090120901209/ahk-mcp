#!/usr/bin/env python3
"""Apply the v2.1-alpha.30 compatibility fixes to a UIA-v2 file.

Idempotent and content-addressed rather than line-addressed, so it works on
UIA.ahk, UIA_Browser.ahk, and the bundled UIA_Browser distribution that embeds a
whole copy of UIA.ahk.

Two classes of fix, both no-ops on v2.0:

  1. DeleteProp in value context. alpha.30 yields blank-unset for a missing
     property, so `obj.DeleteProp("x") || fallback` throws. Bare-statement
     DeleteProp is unaffected and is left alone.

  2. Functions that fall off the end. v2.0 returned ""; alpha.30 returns
     blank-unset, so `if x := f()` throws instead of taking the false branch.

Usage:  python3 patch-alpha30.py <file> [<file> ...]
"""
import re
import sys

DP = re.compile(r'[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*\.DeleteProp\("[^"]*"\)')

# (label, anchor, replacement). Anchors use \n; they are translated to the file's
# own newline before matching. Missing anchors are skipped, not fatal - not every
# file contains every function.
RETURN_FIXES = [
    ('GetNumericPath.FindTarget',
     '                if found := FindTarget(child, path)\n'
     '                    return found\n'
     '                path.Pop()\n            }\n        }\n    }',
     '                if found := FindTarget(child, path)\n'
     '                    return found\n'
     '                path.Pop()\n            }\n            return 0\n        }\n    }'),
    ('FindElement.PreOrderRecursiveFind',
     '                el := nextElementFunc(el)\n            }\n        }\n'
     '        PostOrderRecursiveFind(el, scope, i:=1, depth:=0) {',
     '                el := nextElementFunc(el)\n            }\n            return 0\n        }\n'
     '        PostOrderRecursiveFind(el, scope, i:=1, depth:=0) {'),
    ('GetWinId',
     '"UInt", 2, "Ptr") ; hwnd from point by SKAN\n    }',
     '"UInt", 2, "Ptr") ; hwnd from point by SKAN\n        return 0\n    }'),
    ('GetControlId',
     '        try return TW.NormalizeElementBuildCache(cacheRequest, this).CachedNativeWindowHandle\n    }',
     '        try return TW.NormalizeElementBuildCache(cacheRequest, this).CachedNativeWindowHandle\n'
     '        return 0\n    }'),
    ('Click',
     '        CoordMode("Mouse", saveCoordMode)\n        if IsSet(SleepTime)\n'
     '            Sleep(SleepTime)\n    }',
     '        CoordMode("Mouse", saveCoordMode)\n        if IsSet(SleepTime)\n'
     '            Sleep(SleepTime)\n        return 0\n    }'),
    ('WaitElementFromPath',
     '            try return this[paths*]\n            Sleep tick\n        }\n    }',
     '            try return this[paths*]\n            Sleep tick\n        }\n        return 0\n    }'),
    # A second PreOrderRecursiveFind lives in FindCachedElement, distinct from the one in
    # FindElement. Its result feeds `(found := PreOrderRecursiveFind(child, depth))`.
    ('FindCachedElement.PreOrderRecursiveFind',
     '                else if (c >= 0) && scope&4 && (found := PreOrderRecursiveFind(child, depth))\n'
     '                    return found\n            }\n        }',
     '                else if (c >= 0) && scope&4 && (found := PreOrderRecursiveFind(child, depth))\n'
     '                    return found\n            }\n            return 0\n        }'),
    ('WalkCachedTree.GetIndex',
     '            for i, child in parent.CachedChildren {\n'
     '                if child.RuntimeId = elId\n                    return i\n            }\n        }',
     '            for i, child in parent.CachedChildren {\n'
     '                if child.RuntimeId = elId\n                    return i\n            }\n'
     '            return 0\n        }'),
    # RecurseTree is doubly affected: the bare `return` yields unset AND the function falls
    # through, while the caller does `if RecurseTree(child)`. 0 reproduces the v2.0 "" both
    # places, so search behaviour is unchanged.
    ('WalkCachedTree.RecurseTree (forward branch)',
     '                    if RecurseTree(child)\n                        return\n                }\n            } else {',
     '                    if RecurseTree(child)\n                        return 0\n                }\n            } else {'),
    ('WalkCachedTree.RecurseTree (reverse branch)',
     '                    if RecurseTree(child)\n                        return\n                }\n            }\n        }',
     '                    if RecurseTree(child)\n                        return 0\n                }\n            }\n'
     '            return 0\n        }'),
    ('FindItemByProperty',
     '        if (pFound)\n            return UIA.IUIAutomationElement(pFound)\n    }',
     '        if (pFound)\n            return UIA.IUIAutomationElement(pFound)\n        return 0\n    }'),
    ('Viewer.TryUpdateElementVariables',
     '        try return CapturedElement := UIA.CachedSmallestElementInElementContainingPoint('
     'mX, mY, this.Stored.CapturedWindow)\n    }',
     '        try return CapturedElement := UIA.CachedSmallestElementInElementContainingPoint('
     'mX, mY, this.Stored.CapturedWindow)\n        return 0\n    }'),
]

# The browser retry loops share one shape: Loop 2 { try { ... return X } catch { activate } }.
# They are tab-indented and appear once per browser subclass, so they are matched
# structurally rather than by a unique literal.
BROWSER_RETRY = re.compile(
    r'(\n\t\t\t\} catch(?: \w+)? \{\n'
    r'\t\t\t\tWinActivate [^\n]*\n'
    r'\t\t\t\tWinWaitActive [^\n]*\n'
    r'\t\t\t\}\n\t\t\}\n'
    r'(?:\t*;[^\n]*\n)*)'        # the "this part is not reached" comment, when present
    r'(\t\})'
)


def patch(path):
    raw = open(path, encoding='utf-8-sig', errors='surrogateescape').read()
    nl = '\r\n' if '\r\n' in raw else '\n'
    text = raw.replace('\r\n', '\n')
    applied = []

    guards = 0
    lines = text.split('\n')
    for i, ln in enumerate(lines):
        if 'DeleteProp(' in ln and '||' in ln and '??' not in ln:
            new = DP.sub(lambda m: f'({m.group(0)} ?? "")', ln)
            if new != ln:
                guards += len(DP.findall(ln))
                lines[i] = new
    text = '\n'.join(lines)
    if guards:
        applied.append(f'{guards} DeleteProp value-context guards')

    for label, old, new in RETURN_FIXES:
        if new in text:
            continue
        n = text.count(old)
        if n == 0:
            continue
        if n > 1:
            raise SystemExit(f'{path}: anchor for {label} matched {n} times')
        text = text.replace(old, new)
        applied.append(label)

    browser, count = BROWSER_RETRY.subn(r'\1\t\treturn 0\n\2', text)
    if count:
        text = browser
        applied.append(f'{count} browser retry-loop returns')

    if not applied:
        print(f'{path}: already current')
        return
    open(path, 'w', encoding='utf-8-sig', errors='surrogateescape',
         newline='').write(text.replace('\n', nl))
    print(f'{path}:')
    for a in applied:
        print(f'  + {a}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    for target in sys.argv[1:]:
        patch(target)
