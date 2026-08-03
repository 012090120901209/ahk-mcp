# UIA Inspection Tools

Six read-only MCP tools that feed live UI Automation ground truth to the model,
so it writes correct `UIA.ahk` selectors instead of guessing them.

## The workflow

```
uia_windows  ->  uia_tree  ->  uia_find / uia_element  ->  paste snippet  ->  uia_highlight
   which          what's         the exact control        into your .ahk      confirm it is
   window         in it          + verified selector      script             the right one
```

1. **`uia_windows`** — list top-level windows. Start here; hwnds change when
   apps restart.
2. **`uia_tree`** — walk the window. One compact line per control, each ending
   in a durable `@path`. Default depth 4 and interactive-only.
3. **`uia_find`** — when you know roughly what the control is called. Ranked
   matches, each with a verified snippet.
4. **`uia_element`** — full dump of one control: properties, rect, and which
   patterns it supports with their live state.
5. **`uia_highlight`** — draw a border around the resolved element to confirm
   you grabbed the right thing before committing the selector to code.
6. **`uia_under_cursor`** — when the user can point at it faster than you can
   find it.

## Protocol conformance (2026-07-28)

All six declare an `outputSchema` and answer with `structuredContent` alongside
the rendered text, so a client gets typed data instead of re-parsing prose. The
inspector already speaks JSON, so its response is passed through verbatim rather
than reconstructed.

Inspector timings ride along in `_meta.uia`:

```json
{
  "content": [{ "type": "text", "text": "…rendered for humans…" }],
  "structuredContent": { "windows": [ { "hwnd": 3149208, "processName": "Code.exe", … } ] },
  "_meta": { "uia": { "elapsedMs": 12, "nodeCount": 5, "truncated": false } }
}
```

Annotations are derived, not hand-written: none of the six appear in
`MUTATING_TOOLS`, `DESTRUCTIVE_TOOLS` or `OPEN_WORLD_TOOLS`, so
`applySpecMetadata` yields `readOnlyHint: true`, `idempotentHint: true`,
`openWorldHint: false`, `destructiveHint: false` for all of them.

## Everything here is read-only

The inspector reads properties and pattern _availability_. It never obtains or
invokes a control pattern, so no tool in this family can press a button, toggle
a switch, select an item, or delete anything in the target application.
`uia_highlight` draws a click-through overlay that cannot take focus or swallow
a click.

All six are annotated `readOnlyHint: true`, `idempotentHint: true`,
`openWorldHint: false`.

## Paths

RuntimeIds die with the process, so paths are **property chains** that
re-resolve after the target app restarts:

```
Pane$RootView/Pane/Document/Button"Save"
```

Each segment is `ControlType` plus at most one discriminator and an optional
index:

| Syntax                | Meaning                            |
| --------------------- | ---------------------------------- |
| `Button`              | the only Button among its siblings |
| `Button#SaveBtn`      | selected by AutomationId           |
| `Button$NativeButton` | selected by ClassName              |
| `Button"Save"`        | selected by Name                   |
| `Button"Save":2`      | the second such match              |

A discriminator is only added when the bare control type is ambiguous, which
keeps paths short and makes them survive a ClassName rename. `/ : " # $ %` are
percent-encoded inside a value.

Deliberately **not** used as discriminators, because they do not survive a
restart:

- Chromium ordinal ids (`view_1`, `view_4`) and bare integer AutomationIds
- GUID AutomationIds
- HTML `ClassName`, which is the element's entire CSS class list

## Snippets

Every element response carries a paste-ready snippet. Strategy order is
AutomationId, then Name + ControlType, then a path walk. **Each candidate is
executed against the live tree and compared back to the element it claims to
select before it is emitted** — a snippet that resolves to nothing, or to a
different element, is never returned.

```ahk
hwnd := WinExist("Sound Recorder ahk_exe VoiceRecorder.exe")
el := UIA.ElementFromHandle(hwnd).FindElement({T: 50000, N: "Close"})
```

## Token discipline

- Property whitelist: Name, AutomationId, ControlType, ClassName, enabled,
  offscreen. Bounding rects only from `uia_element`, `uia_under_cursor`, and
  `uia_highlight`.
- Hard 40 KB response cap. The walk truncates at node boundaries and the encoder
  drops whole lines, so output is always valid JSON — never a fragment cut
  mid-token.
- `meta.truncated` tells you output was cut; `continuations` gives `fromPath`
  values to resume with.

### Electron and WebView2

Content sits well below the native shell in these apps, so **raise `depth` to
10–14** or the walk never reaches anything useful. A Chromium/WebView2 document
gets at most half the remaining node budget before the rest is stubbed with a
`fromPath` continuation, so one document cannot starve the rest of the window.

## Empty trees are usually not a bug

A minimised, cloaked, or suspended packaged app reports a valid root element
with **zero children**. The tools detect this and say so rather than reporting
an empty window:

| Code               | Meaning                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| `WINDOW_SUSPENDED` | minimised, or cloaked on another virtual desktop — restore it and retry          |
| `ACCESS_DENIED`    | elevated process; run elevated or use the `AutoHotkey64_UIA.exe` UI Access build |
| `EMPTY_TREE`       | the window genuinely publishes no automation tree                                |

`uia_windows` flags these up front with `isVisible: false` and a `state` of
`minimized` or `cloaked`.

## Selector validation hook

`scripts/validate-uia-selectors.mjs` is a PostToolUse hook that scans written or
edited `.ahk` files for `FindElement` / `FindElements` / `WaitElement` /
`ElementExist` calls and resolves each one against the live window.

Mode comes from `uiaSelectorValidation` in the ahk-mcp settings file, or the
`UIA_SELECTOR_VALIDATION` env var:

| Mode   | Behaviour                                                  |
| ------ | ---------------------------------------------------------- |
| `off`  | disabled                                                   |
| `warn` | **default** — reports unresolved selectors, never blocks   |
| `fail` | blocks (exit 2) when a selector genuinely does not resolve |

A selector that could not be checked because the target app is closed is
reported as `unchecked` and **never blocks, even in `fail` mode** — "did not
resolve" and "could not be checked" are different facts.

Wire it up in `.claude/settings.json`:

```json
{
  "matcher": "mcp__ahk__AHK_File_(Edit|Create).*",
  "hooks": [
    {
      "type": "command",
      "command": "node \"$CLAUDE_PROJECT_DIR/scripts/validate-uia-selectors.mjs\"",
      "timeout": 60
    }
  ]
}
```

## Architecture

**Mode A (shipping)** — one AutoHotkey process per call. The MCP server writes a
JSON request to stdin and reads a single JSON response from stdout, with a hard
timeout.

```
{"op":"uia_tree","hwnd":123456,"depth":4,"filter":"interactive","maxNodes":200}
->
{"ok":true,"data":{...},"meta":{"elapsedMs":37,"nodeCount":112,"truncated":false}}
```

Errors carry an actionable hint:

```json
{
  "ok": false,
  "error": {
    "code": "WINDOW_SUSPENDED",
    "message": "Window 460472 has an empty UI Automation tree because it is minimised.",
    "hint": "Restore the window and retry. Packaged apps unload their automation tree while minimised."
  }
}
```

**Mode B (scaffolded, off by default)** — a resident daemon on the named pipe
`\\.\pipe\ahk-mcp-uia` with auto-start, idle shutdown, and per-window cached
walks. Same request schema, so the tools never change. See
`inspector/uia_daemon.ahk`.

### Interpreter

The inspector requires the **v2.1-alpha.30+Console fork** and is always launched
with `/ErrorStdOut`. That switch is not cosmetic: without it a load-time error
opens a MsgBox on the Windows desktop and the spawn blocks until timeout with
empty stdout, which reads as "no output" rather than "syntax error". The path
comes from `AHK_PATH` / `AHK_PATH_WIN`, which `.mcp.json` already sets.

## Testing

```bash
npm run test:uia:e2e   # the six tools through the real MCP server over stdio
npm run test:uia       # golden request/response tests, inspector only, no MCP layer
npm run test:uia:lib   # UIA.ahk paths the inspector itself never calls
npm run test:unit      # selector-extraction unit tests
```

`test:uia:e2e` is the one that answers "does it work" — it speaks JSON-RPC to
`dist/index.js` exactly as a client does and chains the whole workflow,
including annotation checks and a deliberately broken path.

`test:uia` spawns the inspector directly, discovers a live window through
`uia_windows`, and covers the protocol envelope, every error code, path
round-tripping, snippet verification, and the byte cap.

`test:uia:lib` drives the forked library's patched branches that no MCP tool
reaches — cached search, `WalkTree`, `FindItemByProperty`, and the timeout and
cache-miss paths. It asserts specifically that `No value was returned` never
escapes, while allowing the TreeWalker's deliberate `UnsetError` for an
out-of-bounds walk.

### A note on path reconstruction

`uia_element` (when selected by name) and `uia_under_cursor` both need to
rebuild a path for an element they did not reach by walking. They do it by
climbing **up** to the window root, not by searching down from it. Searching
down means comparing every node in the tree — on a Chromium window that is tens
of thousands of COM round-trips and will outlast the caller's timeout. Ancestry
is O(depth × siblings) and returns in roughly 400 ms on the same window.

## The vendored library

`scripts/UIA.ahk` tracks an alpha.30 fork, not upstream:

- **Fork:** https://github.com/TrueCrimeDev/UIA-v2/tree/alpha30-compat
- **Upstream:** https://github.com/Descolada/UIA-v2 — no alpha.30 support
  (latest commit 2026-04-23)

alpha.30 changed two v2.0 behaviours, both silent at load time and fatal at
runtime:

1. Falling off the end of a function used to yield `""`; it now yields
   blank-unset, so `if found := Search()` throws `No value was returned.`
   instead of taking the false branch.
2. `DeleteProp` on a missing property does the same in value context, breaking
   `obj.DeleteProp("scope") || scope`. Bare-statement `DeleteProp` is
   unaffected.

Between them these break **every object-condition search** (all of which pass
through `__ExtractConditionNamedParameters`) and **every path helper** (all of
which pass through `GetNumericPath`). The fork adds 16 `(… ?? "")` guards and 7
explicit returns; all are no-ops on v2.0.

`scripts/UIA_Browser.ahk` is patched too — its browser retry loops
(`GetCurrentMainPaneElement`, `GetCurrentDocumentElement`) fell through on the
"browser wasn't ready" path they exist to handle. The file previously at that
path was a **mislabelled duplicate of UIA.ahk** containing no browser classes at
all; it now holds the real thing and requires `UIA.ahk` to be included first.

`Documents/Autohotkey/Lib/UIA.ahk` and `Lib/UIA_Browser.ahk` carry the same
fixes so pasted snippets behave the same in your own scripts as they do here.

Re-audit after any upstream merge, and re-apply with the patcher:

```bash
python3 Tests/uia/audit-alpha30.py scripts/UIA.ahk
python3 Tests/uia/patch-alpha30.py scripts/UIA.ahk scripts/UIA_Browser.ahk
```

`patch-alpha30.py` is content-addressed and idempotent, so it works on plain
files and on bundled distributions that embed a copy of the library.

It flags any function mixing value-returns with a reachable fall-through, plus
any `DeleteProp` in value context. Four hits are expected and benign — they are
limitations of a line-based audit, not bugs:

| Reported                                | Why it is fine                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| `GetCachedChildren`                     | the trailing text is a nested function _definition_; the body ends `return children`   |
| `TVPatterns_DoubleClick`, `TVUIA_Click` | GUI event handlers whose return value is never consumed                                |
| `WindowFromPoint` (UIA_Browser)         | one multi-line `return DllCall(...)`; the audit sees the continuation line as the tail |
