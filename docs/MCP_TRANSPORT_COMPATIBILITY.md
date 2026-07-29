# MCP Transport Compatibility

This server supports the current MCP HTTP transport plus an opt-in compatibility
transport:

1. Preferred: `Streamable HTTP` at `/mcp`
2. Legacy compatibility: `SSE + POST` at `/sse` and `/message` (also
   `/messages`), enabled only with `AHK_MCP_LEGACY_SSE=1`

HTTP binds to `127.0.0.1` by default. Set `AHK_MCP_HTTP_HOST` to change the
binding. A non-loopback binding requires `AHK_MCP_AUTH_TOKEN` unless
`AHK_MCP_ALLOW_INSECURE_REMOTE=1` is explicitly set.

HTTP requests are rate-limited to 120 per minute by default. Override the window
and limit with `AHK_MCP_RATE_LIMIT_WINDOW_MS` and `AHK_MCP_RATE_LIMIT_MAX`.

HTTP `Host` validation defaults to loopback names. For a named reverse proxy or
remote host, set `AHK_MCP_ALLOWED_HOSTS` to a comma-separated allowlist.

Accepted 2026 routing headers are validated whenever supplied. Set
`AHK_MCP_REQUIRE_ROUTING_HEADERS=1` only when all connected HTTP clients emit
`Mcp-Method` and the applicable `Mcp-Name` header.

Draft discovery metadata is public at `/.well-known/mcp/server-card.json`.
Discovery and resource-list cache TTLs default to 30 seconds and can be changed
with `AHK_MCP_DISCOVERY_TTL_MS`.

Deferred tool results are retained for one hour by default, capped at 24 hours.
Use `AHK_MCP_DEFAULT_TASK_TTL_MS` and `AHK_MCP_MAX_TASK_TTL_MS` to tune result
retention. `AHK_MCP_TASK_TIMEOUT_MS` independently controls how long task work
may execute; a task TTL is not an execution timeout.

## Streamable HTTP Session Flow (`/mcp`)

1. Send `initialize` via `POST /mcp` **without** `mcp-session-id`
2. Read `mcp-session-id` from response headers
3. Reuse that `mcp-session-id` header on all subsequent `POST /mcp`, `GET /mcp`,
   and `DELETE /mcp`

If step 3 is skipped, the server returns a verbose JSON-RPC error response.

## Required/Recommended Headers

- `Content-Type: application/json` for `POST`
- `Accept: application/json, text/event-stream` recommended for broad client
  compatibility
- `mcp-session-id: <id>` required after initialization
- `MCP-Protocol-Version: 2025-11-25` required on requests after initialization
- A supplied `Origin` must match `AHK_MCP_ALLOWED_ORIGINS`; when no allowlist is
  configured, only loopback origins for the configured port are accepted
- `Authorization: Bearer <token>` required when `AHK_MCP_AUTH_TOKEN` is set

## Quick cURL Examples

Initialize:

```bash
curl -i http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"client","version":"1.0.0"}}}'
```

List tools (replace `<SESSION_ID>`):

```bash
curl -i http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: 2025-11-25" \
  -H "mcp-session-id: <SESSION_ID>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

## Verbose Error Shape

Transport errors include debugging context in `error.data`:

```json
{
  "jsonrpc": "2.0",
  "id": null,
  "error": {
    "code": -32000,
    "message": "Invalid or missing session for /mcp request",
    "data": {
      "timestamp": "2026-02-21T02:08:22.749Z",
      "phase": "streamable",
      "method": "POST",
      "path": "/mcp",
      "hint": "Send initialize via POST /mcp without mcp-session-id first"
    }
  }
}
```

## Legacy Compatibility Endpoints

Set `AHK_MCP_LEGACY_SSE=1` before starting HTTP mode, then use:

- `GET /sse` to open SSE stream
- `POST /message?sessionId=<id>` (or `POST /messages?sessionId=<id>`) to send
  requests

Use legacy endpoints only for older clients that do not support Streamable HTTP.
