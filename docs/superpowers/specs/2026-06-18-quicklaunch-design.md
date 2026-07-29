# QuickLaunch — Flow Launcher-style clone (AHK v2)

**Date:** 2026-06-18 **Goal:** Demonstrate the ahk-mcp server end-to-end by
building a working Flow Launcher-style launcher in AutoHotkey v2, using the MCP
tools to author, lint, and run it.

## Decisions (locked)

- **Scope:** Full launcher — fuzzy app search + built-in Calc, Web, and Run
  providers.
- **Summon hotkey:** `Alt+Space` (`!Space`).
- **Single file:** `QuickLaunch.ahk` with five classes.

## Architecture — single file, five classes

| Class       | Responsibility                                                                                                                             | Depends on            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `AppIndex`  | Enumerate `.lnk` shortcuts from `A_StartMenu`, `A_StartMenuCommon`, `A_Programs`, `A_ProgramsCommon`; cache `{name, path}` once at startup | filesystem            |
| `Fuzzy`     | Case-insensitive subsequence scorer; bonuses for prefix / word-start / consecutive runs                                                    | —                     |
| `Calc`      | Recursive-descent expression evaluator: `+ - * / // % **`, parens, unary minus. No AHK eval                                                | —                     |
| `Providers` | Turn a query into ranked results across App / Calc / Web / Run                                                                             | AppIndex, Fuzzy, Calc |
| `Launcher`  | Borderless Gui (Edit + ListView), hotkey, keyboard nav, execution                                                                          | Providers             |

## UI

- Borderless, always-on-top, centered Gui. Hidden until summoned.
- Dark theme: bg `#141414`, surface `#1a1a1a`, border `#303030`, text `#ffffff`,
  selected-row accent `#5B9FEF`.
- Top: single-line Edit (the query box). Below: ListView with `Name | Type`
  columns, up to 6 rows.
- Window height tracks result count.

## Behavior

- `Alt+Space` toggles show/hide. `Esc` hides. Losing focus hides.
- Typing re-ranks live. `Up`/`Down` move selection (wraps). `Enter` executes the
  selected row.
- Result routing:
  - **Calc** — query starts with `=` or parses as a pure math expression → top
    row `= <value>`; Enter copies the value to clipboard.
  - **App** — fuzzy matches over the Start Menu index.
  - **Web** — always-present fallback: `Search web for "<q>"` → opens default
    browser at `https://www.google.com/search?q=<q>`.
  - **Run** — if the query looks like a command/path/exe → `Run <q>`.

## How the MCP server is exercised

`AHK_Doc_Search` (verify v2 `Gui`/`ListView`/`Hotkey` syntax) →
`AHK_Library_Search` (reusable helpers) → `AHK_File_Create` (write the script) →
`AHK_Lint` + `AHK_Diagnostics` (validate) → `AHK_Run` (launch on Windows).

## Testing

- Lint (thorough) and Diagnostics return clean.
- `Calc` spot-checked against known expressions.
- `AHK_Run` confirms the script starts and `Alt+Space` summons the bar.

## Out of scope (YAGNI)

Plugins, settings UI, app icons, usage-frequency ranking. Deferred unless
requested.
