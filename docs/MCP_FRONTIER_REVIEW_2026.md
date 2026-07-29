# MCP Frontier Review (July 2026)

This review compares the server with the stable `2025-11-25` protocol, the
locked `2026-07-28` release candidate, accepted SEPs, MCP Apps, the official
TypeScript SDK examples, and production servers such as Cloudflare MCP and
Playwright MCP.

## Applied now

- Stable SDK compatibility remains on `@modelcontextprotocol/sdk` v1.29.0. The
  split v2 SDK packages are still beta and were not adopted.
- Tool catalogs are deterministic. Live active-file state is no longer appended
  to tool descriptions, which improves client and LLM prompt-cache stability.
- `tools/list`, `prompts/list`, `resources/list`, `resources/templates/list`,
  and `resources/read` return `ttlMs` and `cacheScope` hints from SEP-2549.
- Tool settings now control both discovery and execution. Catalog changes send
  `notifications/tools/list_changed`.
- Client roots are fetched lazily from an active `tools/call` request and cached
  until `notifications/roots/list_changed`. The server no longer sends an
  unsolicited roots request immediately after initialization.
- Streamable HTTP validates `Host` to reduce DNS-rebinding risk.
- `Mcp-Method` and `Mcp-Name` are validated when present. Set
  `AHK_MCP_REQUIRE_ROUTING_HEADERS=1` to require the 2026 routing headers.
- A draft SEP-1649 server card is available through
  `/.well-known/mcp/server-card.json` and `mcp://server-card.json`.
- MCP Apps is negotiated through `io.modelcontextprotocol/ui`. Compatible
  clients receive a sandbox-friendly analytics dashboard at
  `ui://ahk/analytics-dashboard`; other clients keep the normal text fallback.
- `AHK_Analytics` now has an output schema and structured output.

## Intentionally deferred

### Stateless 2026 core

The 2026 release candidate removes initialization sessions and `Mcp-Session-Id`,
adds `server/discover`, and moves client identity, capabilities, and protocol
version into every request. Implementing that wire model in the stable v1 SDK
would create a parallel protocol stack. The current server instead removes
avoidable connection-state coupling and is structured for a later SDK v2
migration.

### 2026 Tasks Extension

SEP-2663 is not wire-compatible with the stable 2025 tasks feature: it changes
task creation and result semantics and removes several legacy task methods. The
server keeps its verified 2025 task implementation and does not advertise the
new extension prematurely.

### Deprecated client features

Roots, Sampling, and Logging are deprecated in the 2026 candidate. Roots remain
as a stable-client compatibility input, but usage is request-scoped. New
workflows should prefer explicit tool arguments, ordinary resources/config,
direct model-provider APIs, stderr, and OpenTelemetry.

### Legacy SSE resumability

The stable Streamable HTTP implementation retains its bounded event store for
current clients. The 2026 core removes protocol sessions and SSE resumability;
this compatibility layer can be deleted during the v2 transport migration.

## Primary references

- [2026-07-28 release candidate](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/)
- [Draft specification changelog](https://modelcontextprotocol.io/specification/draft/changelog)
- [SEP-2243 HTTP routing headers](https://modelcontextprotocol.io/seps/2243-http-standardization)
- [SEP-2260 request-scoped server callbacks](https://modelcontextprotocol.io/seps/2260-Require-Server-requests-to-be-associated-with-Client-requests)
- [SEP-2549 list-result TTL](https://modelcontextprotocol.io/seps/2549-TTL-for-list-results)
- [SEP-2567 explicit state handles](https://modelcontextprotocol.io/seps/2567-sessionless-mcp)
- [SEP-2575 stateless MCP](https://modelcontextprotocol.io/seps/2575-stateless-mcp)
- [SEP-2663 Tasks Extension](https://modelcontextprotocol.io/seps/2663-tasks-extension)
- [MCP Apps extension](https://modelcontextprotocol.io/extensions/apps/overview)
- [MCP Apps specification](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
- [Official TypeScript SDK examples](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/examples/server/README.md)
- [Cloudflare MCP](https://github.com/cloudflare/mcp)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
