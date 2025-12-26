# Code-Execution Bridge for AHK MCP

This document explains how the new filesystem-based wrapper set connects the
AutoHotkey MCP server to any agent that supports on-disk code execution (Claude
Code, Claude Desktop + Run Code, Playwright harnesses, etc.).

## Goals

1. Mirror Anthropic’s `CODE_EXECUTION.md` pattern so agents can discover tools
   progressively.
2. Keep tool definitions _out_ of the LLM context window; only the wrappers
   consume the schema.
3. Allow sensitive data to stay inside the execution sandbox by piping it
   directly between MCP calls.

## Components

| Location                                 | Purpose                                                                                   |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `code-execution/runtime/client.ts`       | Lazy MCP client that spawns `dist/index.js` over stdio via the official SDK.              |
| `code-execution/runtime/call-tool.ts`    | Simple helper that exposes `callAhkTool()` + `shutdownAhkClient()`.                       |
| `code-execution/servers/autohotkey/*.ts` | Auto-generated modules (one per MCP tool) containing metadata + a strongly-typed invoker. |
| `scripts/generate-code-exec-wrappers.ts` | Generator that rebuilds the filesystem tree from `src/core/tool-metadata.ts`.             |
| `src/core/tool-metadata.ts`              | Single source of truth for tool definitions, categories, and stable slugs.                |

## Regeneration Workflow

1. Update or add MCP tools inside `src/tools/`.
2. Run `npm run codeexec:generate` to refresh
   `code-execution/servers/autohotkey`.
3. Validate the TypeScript build with `npm run build`.
4. (Optional) Run `npm run lint` to keep runtime helpers clean.
5. Sync the regenerated files into Claude Desktop / Claude Code workspaces and
   copy the `data/` directory if you run the agent on another machine.

> **Reminder:** Always complete the build + lint loop so Claude picks up
> compiled changes, and verify configuration parity between the VS Code plugin,
> Claude Desktop, and any batch launchers.

## Runtime Environment

The runtime uses `StdioClientTransport`, so each code execution session spawns a
private MCP server process:

```ts
import { callAhkFileView } from '../code-execution/servers/autohotkey/file-view.js';

const result = await callAhkFileView({ filePath: 'C:\\Scripts\\demo.ahk' });
console.log(result.content[0]?.text);
```

Environment variables let you customize the launch command:

| Variable                                         | Effect                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `AHK_MCP_SERVER_COMMAND`                         | Set to `pwsh`, `node`, or a custom launcher.                          |
| `AHK_MCP_SERVER_ARGS`                            | JSON array (`["dist/index.js", "--flag"]`) or space-delimited string. |
| `AHK_MCP_FORWARD_ENV`                            | Comma-separated list of env vars forwarded to the child process.      |
| `AHK_MCP_CLIENT_NAME` / `AHK_MCP_CLIENT_VERSION` | Override metadata for analytics.                                      |

## Active-File Context Injection

`src/server.ts` now consumes `getStandardToolDefinitions()` and automatically
appends the active-file hint to every file-category tool description:

```
📎 Active File: C:\Scripts\Demo.ahk
```

This keeps Claude aware of which script future code-execution snippets should
modify.

## Testing Checklist

1. `npm run codeexec:generate`
2. `npm run build`
3. `npm run lint` (optional but recommended when editing runtime sources)
4. Copy updated `code-execution/` and `data/` into the environment where Claude
   (or ChatGPT) will run
5. Restart Claude Desktop / batch launcher to reload the MCP server

Document any issues in `logs/mcp-debug.log` and rerun the build before sharing
with the team.\*\*\*
