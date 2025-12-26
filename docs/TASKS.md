# MCP Tasks

## Overview

MCP Tasks let the server run long operations in the background while the client
polls for status or results. This server supports Tasks for `tools/call`
requests and exposes the task lifecycle endpoints.

## Supported Endpoints

- `tools/call` with a `task` parameter (creates a task)
- `tasks/list` (list task metadata)
- `tasks/get` (get task status)
- `tasks/result` (fetch the final tool response)
- `tasks/cancel` (best-effort cancellation)

## Create a Task

Send a tool call with a `task` object. The optional `ttl` is in milliseconds.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "AHK_Workflow_Analyze_Fix_Run",
    "arguments": {
      "filePath": "C:\\path\\to\\script.ahk",
      "autoFix": true
    },
    "task": {
      "ttl": 600000
    }
  }
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "task": {
      "taskId": "d2b2f35d-5a9a-46ef-9e2f-9cf9b57775f5",
      "status": "working",
      "statusMessage": "Task started",
      "createdAt": "2025-11-25T10:30:00Z",
      "lastUpdatedAt": "2025-11-25T10:30:00Z",
      "ttl": 600000,
      "pollInterval": 2000
    }
  }
}
```

## Poll Task Status

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tasks/get",
  "params": {
    "taskId": "d2b2f35d-5a9a-46ef-9e2f-9cf9b57775f5"
  }
}
```

## Fetch Task Result

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tasks/result",
  "params": {
    "taskId": "d2b2f35d-5a9a-46ef-9e2f-9cf9b57775f5"
  }
}
```

The response includes the tool result and the related task metadata:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [{ "type": "text", "text": "Task completed" }],
    "_meta": {
      "io.modelcontextprotocol/related-task": {
        "taskId": "d2b2f35d-5a9a-46ef-9e2f-9cf9b57775f5"
      }
    }
  }
}
```

## Cancel a Task

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tasks/cancel",
  "params": {
    "taskId": "d2b2f35d-5a9a-46ef-9e2f-9cf9b57775f5"
  }
}
```

Cancellation is best-effort. The server marks the task as canceled, but
long-running tool executions may still complete in the background.

## Environment Variables

- `AHK_MCP_TASK_POLL_INTERVAL_MS` - Poll interval returned by the server
  (default: 2000).
- `AHK_MCP_TASK_TIMEOUT_MS` - Default task execution timeout in milliseconds
  (default: 0, disabled).
- `AHK_MCP_TOOL_TIMEOUT_MS` - Non-task tool timeout in milliseconds (default:
  45000).
