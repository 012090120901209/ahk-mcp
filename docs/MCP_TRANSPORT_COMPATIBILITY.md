# MCP Transport Compatibility

This server supports two HTTP transport modes:

1. Preferred: `Streamable HTTP` at `/mcp`
2. Legacy compatibility: `SSE + POST` at `/sse` and `/message` (also
   `/messages`)

## Streamable HTTP Session Flow (`/mcp`)

1. Send `initialize` via `POST /mcp` **without** `mcp-session-id`
2. Read `mcp-session-id` from response headers
3. Reuse that `mcp-session-id` header on all subsequent `POST /mcp`, `GET /mcp`,
   and `DELETE /mcp`

If step 3 is skipped, the server returns a verbose JSON-RPC error response.

## Stateless Mode (`AHK_MCP_STATELESS=true`)

Set `AHK_MCP_STATELESS=true` (or `1`/`yes`) to run `/mcp` in the MCP spec's
stateless Streamable HTTP mode:

- No `mcp-session-id` header is issued or required — each `POST /mcp` is
  self-contained
- A fresh server/transport pair handles every request, so any instance behind a
  load balancer can serve any request
- `GET /mcp` and `DELETE /mcp` return `405` (no server-to-client streams, no
  resumability)
- The legacy `/sse` endpoints remain session-based; avoid them in stateless
  deployments

Note that tool-level state (the active file, task records, running processes) is
still per-process; run one instance per client or avoid stateful tools when
scaling out.

## Security Environment Variables

- `AHK_MCP_AUTH_TOKEN` — when set, every HTTP request must send
  `Authorization: Bearer <token>`; requests without it get `401`. Unset
  (default) means **no authentication** — only bind to localhost in that case,
  since the tool surface includes file writes and process execution.
- `AHK_MCP_ALLOWED_HOSTS` — comma-separated `Host` header allowlist (e.g.
  `localhost:3000,127.0.0.1:3000`). Enables the SDK's DNS-rebinding protection
  on the Streamable HTTP transport. Unset disables the check.
- `AHK_MCP_ALLOWED_ORIGINS` — comma-separated `Origin` allowlist (existing
  behavior).

## Required/Recommended Headers

- `Content-Type: application/json` for `POST`
- `Accept: application/json, text/event-stream` recommended for broad client
  compatibility
- `mcp-session-id: <id>` required after initialization
- `Origin` must match `AHK_MCP_ALLOWED_ORIGINS` when configured

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

- `GET /sse` to open SSE stream
- `POST /message?sessionId=<id>` (or `POST /messages?sessionId=<id>`) to send
  requests

Use legacy endpoints only for older clients that do not support Streamable HTTP.
