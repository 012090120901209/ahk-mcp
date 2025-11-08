# Observability Guide

Complete guide to monitoring, tracing, and debugging the AHK MCP Server.

## Table of Contents

1. [Overview](#overview)
2. [Distributed Tracing](#distributed-tracing)
3. [Structured Logging](#structured-logging)
4. [HTTP Observability API](#http-observability-api)
5. [MCP Trace Viewer Tool](#mcp-trace-viewer-tool)
6. [Tool Analytics](#tool-analytics)
7. [OpenTelemetry Integration](#opentelemetry-integration)
8. [Environment Variables](#environment-variables)
9. [Use Cases & Examples](#use-cases--examples)

---

## Overview

The AHK MCP Server includes a comprehensive observability stack:

- **Distributed Tracing**: Track requests across tool calls with correlation IDs
- **Structured Logging**: JSON or human-readable logs with trace context
- **HTTP API**: REST endpoints for traces, metrics, and health checks
- **MCP Tool**: Query traces directly in Claude conversations
- **Analytics**: Tool usage metrics and performance tracking
- **OpenTelemetry**: Optional export to Jaeger, Zipkin, Grafana Tempo

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP Tool Execution                       │
│                                                              │
│  User Request → Tool Call → [Tracer.trace()] → Tool Logic  │
│                                 │                            │
│                                 ├─ Create Span              │
│                                 ├─ Log with TraceID          │
│                                 ├─ Record Analytics          │
│                                 └─ Export to OpenTelemetry   │
└─────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
            ┌───────▼────────┐         ┌───────▼────────┐
            │  Trace Storage │         │  HTTP Server   │
            │  (In-Memory)   │         │  :9090/traces  │
            └────────────────┘         └────────────────┘
                    │
            ┌───────▼────────┐
            │ AHK_Trace_     │
            │ Viewer Tool    │
            └────────────────┘
```

---

## Distributed Tracing

### What is Distributed Tracing?

Distributed tracing tracks a request through its entire lifecycle, creating parent-child relationships between operations. Each operation is a "span" with timing, status, and metadata.

### How It Works

**1. Automatic Tracing**

Every tool call is automatically wrapped in a trace:

```typescript
// Happens automatically when you call a tool
AHK_File_Edit → Creates Root Span
  └─ File Read Operation → Creates Child Span
  └─ Edit Operation → Creates Child Span
  └─ File Write Operation → Creates Child Span
```

**2. Trace Context Propagation**

Trace context (traceId, spanId) is automatically propagated:

- Through async operations via AsyncLocalStorage
- Added to all log entries
- Available in tool analytics
- Passed to child spans

**3. Viewing Traces**

Three ways to view traces:

1. **Logs**: See traceIds in stderr/log files
2. **MCP Tool**: Query via `AHK_Trace_Viewer`
3. **HTTP API**: `GET /traces/:id`

### Example Trace

```
📊 Trace: a1b2c3d4e5f6 (Duration: 245ms)
└─ AHK_Smart_Orchestrator [245ms] ✓
   ├─ AHK_File_View [45ms] ✓
   │  └─ file read operation [12ms] ✓
   ├─ AHK_Diagnostics [120ms] ✓
   │  └─ syntax analysis [118ms] ✓
   └─ AHK_File_Edit [65ms] ✓
      └─ file write operation [8ms] ✓

Slowest Operations:
1. AHK_Diagnostics - 120ms
2. AHK_File_Edit - 65ms
3. AHK_File_View - 45ms
```

---

## Structured Logging

### Log Formats

**Human-Readable (Default)**

```
[2025-10-26T10:15:32.123Z] INFO: [traceId: a1b2c3d4] [spanId: span001] Tool called: AHK_File_Edit
```

**JSON Format**

```json
{
  "timestamp": "2025-10-26T10:15:32.123Z",
  "level": "INFO",
  "message": "Tool called: AHK_File_Edit",
  "traceId": "a1b2c3d4",
  "spanId": "span001",
  "parentSpanId": null
}
```

### Enable JSON Logging

```bash
export AHK_MCP_LOG_FORMAT=json
npm run dev
```

### Viewing Logs

```bash
# Follow live logs with trace filtering
tail -f logs/mcp-debug.log | grep "traceId: a1b2c3d4"

# View stderr in real-time
npm run dev 2>&1 | grep "traceId:"

# Search specific trace
grep "a1b2c3d4" logs/mcp-debug.log

# JSON logs with jq
tail -f logs/mcp-debug.log | grep "^{" | jq 'select(.traceId == "a1b2c3d4")'
```

### Log Levels

```bash
# Set log level (error, warn, info, debug)
export AHK_MCP_LOG_LEVEL=debug
export LOG_LEVEL=debug  # Alternative
```

---

## HTTP Observability API

### Starting the Server

```bash
# Enable observability server
export AHK_MCP_OBSERVABILITY_ENABLED=true
export AHK_MCP_OBSERVABILITY_PORT=9090  # Default
export AHK_MCP_OBSERVABILITY_HOST=localhost  # Default

npm run dev
# Server starts: http://localhost:9090
```

### Endpoints

#### `GET /` - API Documentation

Returns available endpoints and examples.

```bash
curl http://localhost:9090/
```

#### `GET /health` - Health Check

```bash
curl http://localhost:9090/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-26T10:15:32.123Z",
  "uptime": 3600.5,
  "version": "1.0.0"
}
```

#### `GET /ready` - Readiness Check

```bash
curl http://localhost:9090/ready
```

Response:
```json
{
  "ready": true,
  "timestamp": "2025-10-26T10:15:32.123Z",
  "checks": {
    "tracing": "enabled",
    "activeSpans": 0,
    "totalTraces": 42
  }
}
```

#### `GET /traces` - List Traces

Query parameters:
- `limit`: Max traces to return (default: 20, max: 100)
- `tool`: Filter by tool name
- `format`: Response format (`summary` or `full`)

```bash
# Recent traces (summary)
curl http://localhost:9090/traces?limit=10

# Full trace data
curl http://localhost:9090/traces?format=full

# Filter by tool
curl http://localhost:9090/traces?tool=AHK_Smart_Orchestrator

# Combine with jq
curl -s http://localhost:9090/traces | jq '.traces[] | select(.errorCount > 0)'
```

Response (summary format):
```json
{
  "count": 10,
  "limit": 10,
  "traces": [
    {
      "traceId": "a1b2c3d4e5f6",
      "name": "AHK_File_Edit",
      "startTime": 1729935332123,
      "duration": 245,
      "spanCount": 4,
      "errorCount": 0,
      "status": "OK"
    }
  ]
}
```

#### `GET /traces/:id` - Get Specific Trace

```bash
curl http://localhost:9090/traces/a1b2c3d4e5f6 | jq
```

Response:
```json
{
  "trace": {
    "spanId": "root001",
    "traceId": "a1b2c3d4e5f6",
    "name": "AHK_File_Edit",
    "startTime": 1729935332123,
    "endTime": 1729935332368,
    "duration": 245,
    "attributes": {
      "tool": "AHK_File_Edit",
      "argCount": 2
    },
    "status": { "code": "OK" },
    "children": [...]
  },
  "summary": {
    "totalDuration": 245,
    "spanCount": 4,
    "errorCount": 0,
    "slowestSpans": [...]
  }
}
```

#### `GET /metrics` - Tool Analytics

```bash
curl http://localhost:9090/metrics | jq
```

Response:
```json
{
  "timestamp": "2025-10-26T10:15:32.123Z",
  "analytics": {
    "totalCalls": 156,
    "uniqueTools": 12,
    "overallSuccessRate": 98.5,
    "averageDuration": 125.3,
    "topTools": [...],
    "problematicTools": [...]
  }
}
```

#### `GET /stats` - System Statistics

```bash
curl http://localhost:9090/stats | jq
```

Response:
```json
{
  "timestamp": "2025-10-26T10:15:32.123Z",
  "uptime": 3600.5,
  "tracing": {
    "enabled": true,
    "totalTraces": 42,
    "maxTraces": 1000,
    "activeSpans": 0,
    "oldestTraceAge": 1800000
  },
  "memory": {
    "heapUsed": 52428800,
    "heapTotal": 104857600,
    "external": 1048576,
    "rss": 125829120
  },
  "process": {
    "pid": 12345,
    "platform": "linux",
    "nodeVersion": "v20.10.0"
  }
}
```

---

## MCP Trace Viewer Tool

Query traces directly in Claude conversations using the `AHK_Trace_Viewer` tool.

### Actions

#### `list` - View Recent Traces

```typescript
{
  "action": "list",
  "limit": 10
}
```

Shows recent traces with summary information.

#### `get` - Get Specific Trace

```typescript
{
  "action": "get",
  "traceId": "a1b2c3d4e5f6",
  "format": "tree"  // or "json" or "summary"
}
```

Returns full trace details with timing breakdown.

#### `search` - Find Traces by Tool

```typescript
{
  "action": "search",
  "toolName": "AHK_Smart_Orchestrator",
  "limit": 20
}
```

Finds all traces involving the specified tool.

#### `stats` - Tracing Statistics

```typescript
{
  "action": "stats"
}
```

Shows tracing system status and configuration.

#### `clear` - Clear All Traces

```typescript
{
  "action": "clear"
}
```

Removes all stored traces (useful for testing).

### Example Usage in Claude

```
User: "Show me recent traces"

Claude: I'll use AHK_Trace_Viewer to show recent traces.
[Calls tool with action: "list", limit: 10]

User: "What happened in trace abc123?"

Claude: Let me get the full details for that trace.
[Calls tool with action: "get", traceId: "abc123", format: "tree"]
```

---

## Tool Analytics

### What's Tracked

For each tool call:
- Tool name
- Timestamp
- Success/failure
- Duration
- Error type and message
- **Trace ID and Span ID** (new!)

### Using AHK_Analytics Tool

```typescript
// View summary
{
  "action": "summary"
}

// Get tool-specific stats
{
  "action": "tool_stats",
  "toolName": "AHK_File_Edit"
}

// View recent calls
{
  "action": "recent",
  "limit": 50
}

// Export data
{
  "action": "export"
}

// Clear analytics
{
  "action": "clear"
}
```

### Correlation with Traces

Analytics now include trace context:

```json
{
  "toolName": "AHK_File_Edit",
  "timestamp": 1729935332123,
  "success": true,
  "duration": 245,
  "traceId": "a1b2c3d4e5f6",
  "spanId": "span001"
}
```

This allows you to:
1. Find the trace for a failed tool call
2. Correlate analytics with distributed traces
3. Debug performance issues with full context

---

## OpenTelemetry Integration

### What is OpenTelemetry?

OpenTelemetry (OTel) is an industry-standard observability framework. It allows exporting traces to tools like:

- **Jaeger** - Distributed tracing UI
- **Zipkin** - Alternative tracing backend
- **Grafana Tempo** - Scalable tracing backend
- **DataDog, New Relic, etc.** - Commercial APM platforms

### Enable OpenTelemetry

```bash
# Enable OTel export
export AHK_MCP_OTEL_ENABLED=true

# Configure endpoint (OTLP/HTTP)
export AHK_MCP_OTEL_ENDPOINT=http://localhost:4318/v1/traces

# Set service name
export AHK_MCP_OTEL_SERVICE_NAME=ahk-mcp-server

# Choose exporter type
export AHK_MCP_OTEL_EXPORTER=otlp  # or 'console' for debugging
```

### Running Jaeger

```bash
# Start Jaeger all-in-one (Docker)
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest

# View Jaeger UI
open http://localhost:16686

# Start MCP server with OTel
export AHK_MCP_OTEL_ENABLED=true
npm run dev
```

### Jaeger UI Features

1. **Search Traces**: Find traces by service, operation, duration
2. **Trace Timeline**: Visual timeline of all spans
3. **Dependency Graph**: See relationships between operations
4. **Performance Analysis**: Identify bottlenecks

### Console Exporter (Debug)

For debugging without external services:

```bash
export AHK_MCP_OTEL_ENABLED=true
export AHK_MCP_OTEL_EXPORTER=console
npm run dev
```

Traces will be logged to console instead of exported.

---

## Environment Variables

### Tracing

```bash
# Enable/disable tracing (default: true)
AHK_MCP_TRACING_ENABLED=true

# Maximum traces to store (default: 1000)
AHK_MCP_MAX_TRACES=1000
```

### Logging

```bash
# Log format: text or json (default: text)
AHK_MCP_LOG_FORMAT=json

# Log level: error, warn, info, debug (default: info)
AHK_MCP_LOG_LEVEL=debug
LOG_LEVEL=debug  # Alternative
```

### HTTP Observability Server

```bash
# Enable HTTP observability API (default: false)
AHK_MCP_OBSERVABILITY_ENABLED=true

# HTTP server port (default: 9090)
AHK_MCP_OBSERVABILITY_PORT=9090

# HTTP server host (default: localhost)
AHK_MCP_OBSERVABILITY_HOST=localhost
```

### OpenTelemetry

```bash
# Enable OpenTelemetry export (default: false)
AHK_MCP_OTEL_ENABLED=true

# OTLP endpoint URL
AHK_MCP_OTEL_ENDPOINT=http://localhost:4318/v1/traces

# Service name in traces
AHK_MCP_OTEL_SERVICE_NAME=ahk-mcp-server

# Exporter type: otlp, console (default: otlp)
AHK_MCP_OTEL_EXPORTER=otlp
```

### Complete Configuration Example

```bash
# .env file or export these

# Tracing
AHK_MCP_TRACING_ENABLED=true
AHK_MCP_MAX_TRACES=2000

# Logging
AHK_MCP_LOG_FORMAT=json
AHK_MCP_LOG_LEVEL=info

# HTTP API
AHK_MCP_OBSERVABILITY_ENABLED=true
AHK_MCP_OBSERVABILITY_PORT=9090

# OpenTelemetry (optional)
AHK_MCP_OTEL_ENABLED=true
AHK_MCP_OTEL_ENDPOINT=http://localhost:4318/v1/traces
```

---

## Use Cases & Examples

### 1. Debug a Failed Tool Call

**Problem**: A tool call failed, need to understand why.

**Solution**:

```bash
# Step 1: Check recent traces for errors
curl -s http://localhost:9090/traces | jq '.traces[] | select(.errorCount > 0)'

# Step 2: Get full trace
curl -s http://localhost:9090/traces/abc123 | jq

# Step 3: View logs for that trace
grep "abc123" logs/mcp-debug.log

# Or in Claude:
# "Show me traces with errors"
# "What happened in trace abc123?"
```

### 2. Analyze Performance Bottleneck

**Problem**: Tool calls are slow, need to find bottleneck.

**Solution**:

```bash
# Find slowest traces
curl -s http://localhost:9090/traces?limit=50 | \
  jq '.traces | sort_by(.duration) | reverse | .[0:5]'

# Get detailed timing
curl -s http://localhost:9090/traces/slow-trace-id | \
  jq '.summary.slowestSpans'

# Or in Claude:
# "Show me the slowest operations from recent traces"
```

### 3. Monitor Tool Usage

**Problem**: Want to know which tools are used most and their success rates.

**Solution**:

```bash
# Get tool analytics
curl -s http://localhost:9090/metrics | jq '.analytics'

# Or in Claude:
# "Show me tool usage analytics"
# "Which tools have high failure rates?"
```

### 4. Track Complex Orchestration Flow

**Problem**: Smart Orchestrator calls multiple tools, need to see the flow.

**Solution**:

```typescript
// In Claude: Use AHK_Trace_Viewer
{
  "action": "search",
  "toolName": "AHK_Smart_Orchestrator",
  "limit": 10
}

// Then get specific trace
{
  "action": "get",
  "traceId": "orchestrator-trace-id",
  "format": "tree"
}
```

Result shows complete hierarchy:
```
AHK_Smart_Orchestrator [500ms]
  ├─ AHK_File_View [50ms]
  ├─ AHK_Diagnostics [200ms]
  ├─ AHK_File_Edit [150ms]
  └─ AHK_File_Create [80ms]
```

### 5. Production Monitoring with Grafana

**Setup**:

1. Run Grafana Tempo for trace storage
2. Run Grafana for visualization
3. Configure MCP server to export traces

```bash
# docker-compose.yml
version: '3'
services:
  tempo:
    image: grafana/tempo:latest
    ports:
      - "4318:4318"  # OTLP HTTP

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"

# Start services
docker-compose up -d

# Configure MCP
export AHK_MCP_OTEL_ENABLED=true
export AHK_MCP_OTEL_ENDPOINT=http://localhost:4318/v1/traces
npm run dev
```

View traces in Grafana at http://localhost:3000

### 6. CI/CD Integration

Check server health in deployment pipeline:

```bash
#!/bin/bash
# health-check.sh

# Wait for server to start
sleep 5

# Check health
if curl -s http://localhost:9090/health | jq -e '.status == "healthy"'; then
  echo "✓ Server healthy"
else
  echo "✗ Server unhealthy"
  exit 1
fi

# Check readiness
if curl -s http://localhost:9090/ready | jq -e '.ready == true'; then
  echo "✓ Server ready"
else
  echo "✗ Server not ready"
  exit 1
fi
```

---

## Troubleshooting

### Tracing Not Working

```bash
# Check if tracing is enabled
curl -s http://localhost:9090/stats | jq '.tracing'

# Enable tracing
export AHK_MCP_TRACING_ENABLED=true

# Check for active spans (should be 0 when idle)
curl -s http://localhost:9090/stats | jq '.tracing.activeSpans'
```

### No Traces in Storage

```bash
# Check trace count
curl -s http://localhost:9090/stats | jq '.tracing.totalTraces'

# Traces might have expired (max 1000 by default)
export AHK_MCP_MAX_TRACES=5000
```

### HTTP Server Not Starting

```bash
# Check if enabled
echo $AHK_MCP_OBSERVABILITY_ENABLED

# Check port availability
lsof -i :9090

# Use different port
export AHK_MCP_OBSERVABILITY_PORT=9091
```

### OpenTelemetry Export Failing

```bash
# Test endpoint
curl -X POST http://localhost:4318/v1/traces \
  -H "Content-Type: application/json" \
  -d '{}'

# Check logs for export errors
grep "OpenTelemetry" logs/mcp-debug.log

# Use console exporter for debugging
export AHK_MCP_OTEL_EXPORTER=console
```

---

## Best Practices

### 1. Enable Tracing in Development

Always run with tracing enabled during development:

```bash
# .env.development
AHK_MCP_TRACING_ENABLED=true
AHK_MCP_LOG_FORMAT=text
AHK_MCP_LOG_LEVEL=debug
AHK_MCP_OBSERVABILITY_ENABLED=true
```

### 2. Use JSON Logs in Production

Easier to parse and aggregate:

```bash
# .env.production
AHK_MCP_LOG_FORMAT=json
AHK_MCP_LOG_LEVEL=info
```

### 3. Limit Trace Storage

Don't store unlimited traces in production:

```bash
# Keep last 2000 traces (covers ~30 minutes of activity)
AHK_MCP_MAX_TRACES=2000
```

### 4. Monitor Health Endpoints

Set up automated health checks:

```bash
# Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /health
    port: 9090
  initialDelaySeconds: 10
  periodSeconds: 30

# Kubernetes readiness probe
readinessProbe:
  httpGet:
    path: /ready
    port: 9090
  initialDelaySeconds: 5
  periodSeconds: 10
```

### 5. Use Trace Viewer in Claude

Leverage the MCP tool for quick debugging:

```
Instead of: "The last tool call failed, check the logs"
Use: "Show me traces with errors and get the details for the latest one"
```

### 6. Export to External Systems

For production, export traces to dedicated systems:

```bash
# Development: Use HTTP API + local viewing
AHK_MCP_OBSERVABILITY_ENABLED=true

# Production: Export to Grafana/Jaeger
AHK_MCP_OTEL_ENABLED=true
AHK_MCP_OTEL_ENDPOINT=https://tempo.example.com/v1/traces
```

---

## Summary

The AHK MCP Server observability stack provides:

✅ **Automatic tracing** of all tool calls
✅ **Trace context** in logs and analytics
✅ **HTTP API** for external integrations
✅ **MCP tool** for in-conversation debugging
✅ **OpenTelemetry** export for enterprise monitoring
✅ **Zero configuration** required (works out of the box)
✅ **Production-ready** with health checks and metrics

Start with the defaults, then enable additional features as needed:

1. **Development**: Use logs + MCP Trace Viewer tool
2. **Testing**: Enable HTTP API for programmatic access
3. **Production**: Export to Jaeger/Grafana with alerting

Questions? See the main documentation or check the source code in `src/core/tracing.ts`.
