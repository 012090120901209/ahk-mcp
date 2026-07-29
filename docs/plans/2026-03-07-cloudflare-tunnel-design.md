# Secure Remote MCP Tunnel via Cloudflare

## Date: 2026-03-07

## Overview

Expose the ahk-mcp server securely over the internet using Cloudflare Tunnel so
it can be accessed from Claude iOS and VS Code remotely.

## Architecture

```
Claude iOS / VS Code
        |
        | HTTPS
        v
Cloudflare Edge (mcp.truecrime.dev)
  - TLS termination
  - Email OTP auth (Cloudflare Access)
        |
        | Encrypted tunnel (outbound from PC)
        v
Windows PC (cloudflared service)
        |
        | localhost:3000
        v
ahk-mcp HTTP server (Streamable HTTP + SSE)
```

## Components

1. **MCP Server** - runs in HTTP mode on localhost:3000
2. **cloudflared** - tunnel agent, runs as Windows service
3. **Cloudflare DNS** - truecrime.dev nameservers on Cloudflare
4. **Cloudflare Access** - email OTP policy for authentication

## Security

- No open ports on home network
- HTTPS/TLS via Cloudflare
- Email OTP restricts access to authorized email
- Session auto-timeout (30 min idle)
- Optional: AHK_MCP_ALLOWED_ORIGINS for origin restriction

## Subdomain

- `mcp.truecrime.dev` for the MCP server endpoint

## Endpoints

- `https://mcp.truecrime.dev/mcp` - Streamable HTTP (primary)
- `https://mcp.truecrime.dev/sse` - SSE (legacy)

## Cost

- $0 (Cloudflare free plan, domain already owned)
