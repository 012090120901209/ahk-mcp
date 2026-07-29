# ahk-parse-ast — JSON Schema

`ahk-parse-ast` returns a stable, versioned JSON tree describing the top-level
symbols of an AutoHotkey v2 script. The shape is intended to be consumed by
LSPs, linters, refactoring tools, and agents. The schema is versioned via
`schemaVersion`; breaking changes bump the version.

Current schema version: **`"1.0"`**

## Tool

| Field  | Value                                                                |
| ------ | -------------------------------------------------------------------- |
| Name   | `ahk-parse-ast`                                                      |
| Input  | `{ path: string, follow_includes?: boolean }`                        |
| Output | `content[0].text` is a pretty-printed `ParseAstResult` JSON document |

`path` may be absolute or project-relative. If `follow_includes` is `true`, each
resolvable `#Include` is loaded, deduped by absolute path, and its AST is merged
into the root's result (see "Merge semantics" below).

All line numbers are **zero-indexed** to match VS Code / LSP conventions.

## Types

```ts
interface ParseAstResult {
  schemaVersion: '1.0'; // bump on breaking schema changes
  path: string; // absolute, echoed from input
  requires: string | null; // e.g. "v2.1-alpha.27"; null if no #Requires
  includes: IncludeRef[];
  hotkeys: Hotkey[];
  labels: Label[];
  globals: Global[]; // top-level :=, global, and static globals
  functions: FunctionDef[];
  classes: ClassDef[];
  diagnostics: Diagnostic[]; // parse errors encountered; non-fatal
}

interface IncludeRef {
  spec: string; // as written in source (quotes stripped)
  resolved: string | null; // absolute path if resolvable, else null
  line: number;
}

interface FunctionDef {
  name: string;
  params: Param[];
  returnType?: string; // from `Name(...) : Type { ... }` annotation
  range: Range; // start/end line, zero-indexed
  isStatic: boolean; // true for static methods inside a class
  docComment?: string; // leading `/** ... */` block, stripped
}

interface Param {
  name: string;
  type?: string; // from `name : Type` annotation
  default?: string; // source text of default expression
  byref: boolean; // leading `&` marker
  variadic: boolean; // trailing `*` marker
  optional: boolean; // has default, `?` suffix, or is variadic
}

interface ClassDef {
  name: string;
  extends?: string;
  range: Range;
  properties: PropertyDef[];
  methods: FunctionDef[]; // includes static methods
  nested: ClassDef[];
  docComment?: string;
}

interface PropertyDef {
  name: string;
  isStatic: boolean;
  type?: string; // from `Name : Type := default`
  defaultValue?: string; // source text when initialized
  hasGet: boolean; // dynamic property defines a getter
  hasSet: boolean; // dynamic property defines a setter
  line: number;
}

interface Hotkey {
  keyCombo: string; // e.g. "^!c", "F1", "LButton & RButton"
  line: number;
  context?: string; // #HotIf expression in effect at this line
}

interface Label {
  name: string;
  line: number;
}

interface Global {
  name: string;
  type?: string;
  line: number;
  isStatic: boolean; // true for top-level `static Name := ...`
}

interface Range {
  startLine: number; // zero-indexed
  endLine: number; // zero-indexed, inclusive
}

interface Diagnostic {
  severity: 'error' | 'warning';
  message: string;
  line: number;
  column?: number;
  code?: string; // e.g. "AHK_AST_UNTERMINATED_STRING"
}
```

## Merge semantics (when `follow_includes: true`)

- The root script's result is returned.
- Each resolvable `#Include` is read and parsed once; the results are merged
  into the root as follows:
  - `includes` from descendants are appended (order preserved).
  - `diagnostics` from descendants are merged into the root's array.
  - Cycles are broken by deduping on the resolved absolute path.
  - If the root does not declare `#Requires` but a descendant does, the
    descendant's value is promoted onto the root.
- Symbols from descendants (`functions`, `classes`, `hotkeys`, `labels`,
  `globals`) remain local to each file's AST and are **not** flattened into the
  root. Callers that need a cross-file symbol table should re-invoke the parser
  for each `IncludeRef.resolved` they care about.

## Extraction reliability

| Field                                                   | Reliability                                                                                                                  |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `schemaVersion`, `path`                                 | Exact                                                                                                                        |
| `requires`                                              | Exact (strips optional `AutoHotkey` prefix)                                                                                  |
| `includes.spec`, `includes.line`                        | Exact                                                                                                                        |
| `includes.resolved`                                     | Best-effort: handles relative paths and `<LibName>` against adjacent `Lib/` dirs. Does not search the AHK install's std lib. |
| `functions.name`, `functions.range`, `functions.params` | Reliable for typical v2 code                                                                                                 |
| `functions.returnType`, `params.type`                   | Reliable when explicit `: Type` annotations are used                                                                         |
| `functions.docComment`, `classes.docComment`            | Best-effort: picks up `/** ... */` blocks immediately above the symbol                                                       |
| `classes.name`, `extends`, `range`                      | Reliable                                                                                                                     |
| `classes.methods`, `classes.properties`                 | Reliable for standard v2 grammar; dynamic properties detected via `Name { get ... set ... }` pattern                         |
| `hotkeys.keyCombo`, `hotkeys.line`                      | Reliable for single-combo hotkeys                                                                                            |
| `hotkeys.context`                                       | Tracks the most recent `#HotIf` directive lexically                                                                          |
| `labels`                                                | Reliable; control keywords (e.g. `return`) are filtered out                                                                  |
| `globals`                                               | Captures top-level `:=`, `global Name := ...`, and `static Name := ...`                                                      |
| `diagnostics`                                           | Best-effort: currently detects unterminated string literals                                                                  |

Fields marked **best-effort** may miss edge cases but never produce incorrect
structured output — they simply omit the detail. Parser errors never throw; they
surface as entries in `diagnostics` so callers always get a usable tree.

## Worked example

Source script (20 lines):

```autohotkey
#Requires AutoHotkey v2.1-alpha.27
#Include helpers.ahk

global Count := 0

/** Increment counter */
Bump() {
    Count += 1
}

class Counter {
    static Instances := 0
    Value := 0
    Inc(n := 1) {
        this.Value += n
    }
}

^!c::Bump()
MyLabel:
```

Tool output (abbreviated):

```json
{
  "schemaVersion": "1.0",
  "path": "/sample.ahk",
  "requires": "v2.1-alpha.27",
  "includes": [
    { "spec": "helpers.ahk", "resolved": "/helpers.ahk", "line": 1 }
  ],
  "hotkeys": [{ "keyCombo": "^!c", "line": 18 }],
  "labels": [{ "name": "MyLabel", "line": 19 }],
  "globals": [{ "name": "Count", "line": 3, "isStatic": false }],
  "functions": [
    {
      "name": "Bump",
      "params": [],
      "range": { "startLine": 6, "endLine": 8 },
      "isStatic": false,
      "docComment": "Increment counter"
    }
  ],
  "classes": [
    {
      "name": "Counter",
      "range": { "startLine": 10, "endLine": 16 },
      "properties": [
        {
          "name": "Instances",
          "isStatic": true,
          "defaultValue": "0",
          "hasGet": false,
          "hasSet": false,
          "line": 11
        },
        {
          "name": "Value",
          "isStatic": false,
          "defaultValue": "0",
          "hasGet": false,
          "hasSet": false,
          "line": 12
        }
      ],
      "methods": [
        {
          "name": "Inc",
          "params": [
            {
              "name": "n",
              "default": "1",
              "byref": false,
              "variadic": false,
              "optional": true
            }
          ],
          "range": { "startLine": 13, "endLine": 15 },
          "isStatic": false
        }
      ],
      "nested": []
    }
  ],
  "diagnostics": []
}
```

## Stability guarantees

- Field names and nesting at `schemaVersion: "1.0"` are stable. Additive changes
  (new optional fields, new diagnostic codes) will NOT bump the schema version.
- Any breaking change (removed field, renamed field, changed type of an existing
  field) bumps `schemaVersion` and is documented in this file.
