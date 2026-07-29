# MCP 2025-11-25 Best-Practices Review

For the comparison against the locked 2026 release candidate, accepted frontier
SEPs, MCP Apps, and advanced production servers, see
[MCP Frontier Review (July 2026)](MCP_FRONTIER_REVIEW_2026.md).

**Reviewed:** 2026-07-16 **Scope:** `src/server.ts`, tool metadata and handlers,
tasks, resources, prompts, stdio, Streamable HTTP, legacy SSE compatibility,
dependency/toolchain health, and smoke-test coverage.

## Executive summary

The server has a broad and useful AutoHotkey development surface: file discovery
and editing, diagnostics and linting, local and cloud validation, documentation
retrieval, script execution, window detection, debugging, library management,
resources, prompts, progress, roots, and HTTP/stdio transports.

Before this review, the implementation had already adopted many modern MCP
features, but several advertised contracts did not match the 2025-11-25 wire
schema. The largest interoperability risk was experimental task support. HTTP
mode also allowed unsafe defaults for origin validation and network binding.

The implemented changes prioritize truthful capability negotiation, valid wire
shapes, explicit tool behavior metadata, cancellation propagation, secure local
HTTP defaults, and reproducible builds.

## Functionality map

| Area            | Current behavior                                                                                      | MCP role                           |
| --------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Tools           | AutoHotkey analysis, editing, execution, debugging, docs, libraries, configuration, and orchestration | Model-controlled actions           |
| Resources       | AutoHotkey reference/context, templates, active state, clipboard/system data                          | Application-controlled context     |
| Prompts         | AutoHotkey prompt catalog and module guidance                                                         | User-selectable workflows          |
| Completions     | Prompt and resource argument suggestions                                                              | Client UI assistance               |
| Roots           | Reads client-provided workspace roots and refreshes on changes                                        | Filesystem scope discovery         |
| Progress        | Emits progress for long-running calls when a progress token is supplied                               | Request lifecycle feedback         |
| Tasks           | Optional deferred execution for selected expensive tools                                              | Call-now, fetch-later execution    |
| stdio           | Default local subprocess transport                                                                    | Preferred local MCP transport      |
| Streamable HTTP | Stateful `/mcp` endpoint with sessions and event replay                                               | Current remote/network transport   |
| Legacy SSE      | Optional `/sse` plus `/message` compatibility endpoints                                               | Deprecated compatibility transport |

## Findings and changes

### 1. Task contract correctness — fixed

Previous behavior:

- Advertised task support globally while tools omitted `execution.taskSupport`.
- Used `canceled`, which is not an MCP task status. The wire value is
  `cancelled`.
- Returned `{ task }` from `tasks/get` and `tasks/cancel`; the specification
  requires the task fields at the result root.
- Used custom request schemas instead of the SDK's normative task schemas.
- Accepted a non-standard `status` filter in `tasks/list` and did not implement
  cursor pagination.
- Cancellation changed task state but did not signal the running work.

Current behavior:

- Uses the SDK schemas for `tasks/list`, `tasks/get`, `tasks/result`, and
  `tasks/cancel`.
- Uses the valid statuses and required `ttl: number | null` shape.
- Applies a one-hour default result-retention TTL and caps requested TTLs at 24
  hours by default. `AHK_MCP_DEFAULT_TASK_TTL_MS` and `AHK_MCP_MAX_TASK_TTL_MS`
  can tune those independent retention limits.
- Returns the normative root-level task shape.
- Implements opaque cursor pagination.
- Blocks `tasks/result` until the task reaches a terminal state.
- Advertises `execution.taskSupport: optional` only for selected expensive tools
  and `forbidden` for the rest.
- Rejects task augmentation for forbidden tools.
- Uses an `AbortController` for task cancellation and propagates the signal
  through request context to AutoHotkey process spawning.
- Isolates the in-memory task store per MCP session so one HTTP client cannot
  enumerate another session's tasks.

Tasks remain experimental in MCP. This implementation intentionally keeps them
in memory; they are not durable across process restarts.

### 2. Tool metadata and model safety — fixed

Every advertised tool now has:

- `title` for client display.
- Behavior annotations: `readOnlyHint`, `destructiveHint`, `idempotentHint`, and
  `openWorldHint`.
- Explicit task support negotiation.

The annotations are hints, not authorization. Clients must still treat them as
untrusted server metadata and should require user confirmation for edits,
execution, or other consequential actions.

Several tools already use `outputSchema` plus `structuredContent`, including
file listing/viewing, documentation search, active-file state, file detection,
configuration, and tool discovery. Remaining text-only tools should migrate
incrementally when they have stable result shapes. A tool with `outputSchema`
must always return conforming `structuredContent` on success and should retain a
serialized text block for older clients.

### 3. Capability negotiation — fixed

The server now enables strict SDK capability checks and supplies server-level
instructions describing safe workflow order. It advertises only protocol
features for which request handlers exist.

List-change capabilities remain unset because the exposed tool, prompt, and
resource catalogs are effectively static during a session. If runtime catalog
mutation is added later, the relevant `listChanged` capability and notification
must be added together.

### 4. Streamable HTTP security — fixed

HTTP mode now:

- Binds to `127.0.0.1` by default.
- Validates every supplied `Origin`; untrusted origins receive HTTP 403.
- Supports an optional bearer token through `AHK_MCP_AUTH_TOKEN`.
- Refuses non-loopback binding without a token unless the operator explicitly
  sets `AHK_MCP_ALLOW_INSECURE_REMOTE=1`.
- Keeps legacy HTTP+SSE disabled unless `AHK_MCP_LEGACY_SSE=1` is set.
- Uses the current Streamable HTTP endpoint as the primary transport.

This bearer-token option is a local deployment guard, not a full implementation
of MCP OAuth authorization. Internet-facing deployment should use MCP-compliant
OAuth, TLS, audience-bound tokens, and a trusted reverse proxy or gateway.

### 5. Cancellation and timeouts — partially fixed

Normal tool calls now consume the SDK request `AbortSignal`. Task cancellation
uses its own signal. The signal is carried in `AsyncLocalStorage`, and `AHK_Run`
passes it to spawned native and PowerShell processes.

The generic timeout wrapper can stop waiting and report a timeout, but tools
that do not observe the request signal may continue internal work. Future
process-, network-, and polling-based tools should read the current abort signal
and stop promptly. Timeouts and cancellation are related but distinct: an HTTP
disconnect is not cancellation.

### 6. Resources and prompts — compliant with follow-up opportunities

Resources support listing, reading, subscriptions, update notifications, and
templates. Prompts support listing, retrieval, and completion. The catalogs are
small enough to return without a pagination cursor.

The entries under `ahk://templates/...` are currently both readable resources
and zero-variable resource templates. That is interoperable but redundant. A
future cleanup should either make them true parameterized URI templates or
advertise them only as static resources.

Clipboard and system resources can expose sensitive local context. They should
remain opt-in at the client/application layer and must not be treated as safe
for remote multi-user hosting.

### 7. Build and dependency health — fixed

The npm scripts previously invoked a stale global TypeScript 4.9 binary even
though the project had a newer local compiler. This caused modern Zod/MCP type
declarations to fail before project code was checked.

The build now invokes the project-local TypeScript compiler directly. The MCP
SDK, Zod, Express, TypeScript, and TypeScript ESLint dependencies were updated,
and transitive production advisories were remediated. Verification includes a
zero-vulnerability npm audit at the time of this review.

## Remaining priorities

1. Add stable `outputSchema` and `structuredContent` to the remaining tools with
   machine-readable results.
2. Make all process, network, and polling tools observe the request abort
   signal.
3. Replace the in-memory task implementation with the SDK task store API if
   tasks need durable or multi-process operation.
4. Add MCP OAuth for any deployment that is exposed beyond a trusted local or
   private environment.
5. Decide whether static template resources should remain duplicated in
   `resources/templates/list`.
6. Stop tracking generated `dist/` and `node_modules/` artifacts in Git; build
   them in CI and release packaging instead.

## Verification results

- Passed: TypeScript typecheck and production build.
- Passed: focused ESLint over every MCP-modernization source file, including
  files excluded by the repository's maintained-source ignore list.
- Passed: task shape, cancellation, blocking-result, and pagination unit tests.
- Passed: stdio MCP smoke test, including tool metadata and the task lifecycle.
- Passed: Streamable HTTP smoke test, including Origin rejection, session
  handling, tool metadata, and opt-in legacy SSE compatibility.
- Passed: production dependency audit with zero known vulnerabilities.
- Existing repository debt: the broad maintained-source lint command reports 13
  errors outside the modernization files. The broad Jest run also mixes
  Jest/Vitest and Node test-runner files and contains stale test contracts; it
  does not currently provide a clean repository-wide gate.

## Authoritative references

- MCP specification 2025-11-25: tools, tasks, lifecycle, transports, resources,
  prompts, roots, progress, cancellation, logging, and authorization.
- Official Model Context Protocol TypeScript SDK v1 server documentation and
  examples.
