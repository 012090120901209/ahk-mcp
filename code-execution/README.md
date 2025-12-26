# AutoHotkey MCP Code-Execution Workspace

This directory mirrors the filesystem pattern described in
`../docs/CODE_EXECUTION.md`. Claude (or any other agent with code execution) can
discover the MCP tools on disk, import the generated helpers, and wire them
together without loading every schema into context.

## Layout

- `runtime/` – thin MCP client used by the generated helpers.
- `servers/autohotkey/` – auto-generated TypeScript modules, one per MCP tool
  plus an index for bulk imports.

## Regenerating the Wrappers

Run the generator any time tool definitions change:

```bash
npm run codeexec:generate
npm run build
```

The build step ensures the shared TypeScript still compiles after regeneration.
Follow with `npm run lint` whenever you edit runtime sources.

## Environment Variables

The runtime respects these optional variables:

| Variable                 | Purpose                                                  | Default                                         |
| ------------------------ | -------------------------------------------------------- | ----------------------------------------------- |
| `AHK_MCP_SERVER_COMMAND` | Executable to start the server                           | `node`                                          |
| `AHK_MCP_SERVER_ARGS`    | JSON array or space-delimited args                       | `["dist/index.js"]`                             |
| `AHK_MCP_SERVER_CWD`     | (Not used – server inherits current cwd)                 | current working directory                       |
| `AHK_MCP_FORWARD_ENV`    | Comma-separated env vars to forward to the child process | `PATH,SystemRoot,SystemDrive,TEMP,TMP,NODE_ENV` |
| `AHK_MCP_CLIENT_NAME`    | Custom client name for analytics                         | `ahk-code-exec`                                 |
| `AHK_MCP_CLIENT_VERSION` | Custom client version string                             | `1.0.0`                                         |

## Example Usage

```ts
import { callAhkFileEdit } from './servers/autohotkey/file-edit.js';

await callAhkFileEdit({
  action: 'replace',
  search: 'MsgBox("old")',
  newContent: 'MsgBox("new")',
  filePath: 'C:\\Scripts\\demo.ahk',
});
```

Call `shutdownAhkClient()` from `runtime/call-tool` if you need to dispose the
child process early.

Always ensure configuration files stay in sync between Claude Desktop/VS Code
after regenerating wrappers, and copy any required data files (for example, the
`data/` directory) into the environment where the code will execute.
