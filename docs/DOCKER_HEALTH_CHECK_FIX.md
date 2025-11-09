# Docker Health Check Fix

**Date:** October 20, 2025
**Status:** ✅ **COMPLETE** - All containers healthy
**Issue:** SSE container failing health checks
**Resolution:** Added `/health` endpoint to SSE server

---

## Problem Summary

### Initial Status
| Container | Status | Issue |
|-----------|--------|-------|
| `ahk-mcp` (stdio) | ✅ Healthy | None - working perfectly |
| `ahk-mcp-sse` (SSE) | ❌ Unhealthy | Health check failing for 5938 consecutive checks |

### Root Cause

The SSE server was configured with a health check in `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider",
         "http://localhost:3000/health"]
```

However, the SSE server implementation in `src/server.ts` only defined two routes:
- ✅ `GET /sse` - SSE endpoint (working)
- ✅ `POST /message` - Message handling (working)
- ❌ `GET /health` - **Missing!**

**Health Check Error:**
```
http://localhost:3000/health:
Remote file does not exist -- broken link!!!
ExitCode: 8
```

**Server Response:**
```html
Cannot GET /health
```

### Secondary Issue

Both containers showed log permission errors:
```
[debug-journal] failed to write log: EACCES: permission denied, open '/app/logs/mcp-debug.log'
```

This is a non-critical issue (server functions normally) but indicates the debug journal can't write to the volume-mounted logs directory.

---

## Solution Implemented

### 1. Added Health Endpoint

**File:** `src/server.ts` (line 1356)

```typescript
// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'AutoHotkey MCP Server',
    mode: 'SSE',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

**Health Response:**
```json
{
  "status": "ok",
  "server": "AutoHotkey MCP Server",
  "mode": "SSE",
  "uptime": 14.405949538,
  "memory": {
    "rss": 60071936,
    "heapTotal": 12820480,
    "heapUsed": 11279456,
    "external": 2263215,
    "arrayBuffers": 16619
  }
}
```

### 2. Removed Obsolete Version Field

**File:** `docker-compose.yml` (line 1)

```diff
- version: '3.8'
-
  services:
```

Docker Compose v2 doesn't require the `version` field and warns about it.

---

## Deployment Steps

### 1. Rebuild TypeScript
```bash
npm run build
```

### 2. Rebuild Docker Image
```bash
docker-compose build ahk-mcp
```

**Build Time:** ~6 seconds (with cache)

### 3. Recreate SSE Container
```bash
docker stop ahk-mcp-sse
docker rm ahk-mcp-sse
docker-compose up -d sse
```

**Important:** Must recreate (not just restart) to use the new image.

### 4. Verify Health Status
```bash
# Check container status
docker-compose ps

# Test health endpoint
curl http://localhost:3000/health

# Check health status
docker inspect ahk-mcp-sse --format '{{.State.Health.Status}}'
```

---

## Verification

### Container Status (After Fix)

```bash
$ docker-compose ps
NAME          STATUS
ahk-mcp       Up 52 seconds (healthy)
ahk-mcp-sse   Up 30 seconds (healthy)
```

### Health Endpoint Test

```bash
$ curl http://localhost:3000/health
{
  "status": "ok",
  "server": "AutoHotkey MCP Server",
  "mode": "SSE",
  "uptime": 14.405949538,
  "memory": { ... }
}
```

### SSE Endpoint Test

```bash
$ curl http://localhost:3000/sse
event: endpoint
data: /message?sessionId=c825af1d-ec05-44c1-a11f-524d502257cd
```

### Health Check History

```bash
$ docker inspect ahk-mcp-sse --format '{{json .State.Health}}'
{
  "Status": "healthy",
  "FailingStreak": 0,
  "Log": [
    {
      "Start": "2025-10-20T20:24:44.123Z",
      "End": "2025-10-20T20:24:44.234Z",
      "ExitCode": 0,
      "Output": ""
    }
  ]
}
```

---

## Files Modified

### Source Code
- `src/server.ts` - Added `/health` endpoint to SSE server (line 1356-1365)

### Configuration
- `docker-compose.yml` - Removed obsolete `version: '3.8'` field

### Docker Image
- `dist/server.js` - Compiled TypeScript with health endpoint
- Size changed: 55,845 → 56,259 bytes (+414 bytes)

---

## Benefits

### 1. Accurate Health Monitoring ✅
- Docker now correctly detects when SSE server is healthy
- Health checks pass consistently (FailingStreak: 0)
- Can use for orchestration decisions (Kubernetes, Docker Swarm, etc.)

### 2. Better Observability ✅
- Health endpoint provides server metrics:
  - Uptime
  - Memory usage
  - Server mode
  - Status
- Useful for monitoring and debugging

### 3. Proper Container Lifecycle ✅
- Containers marked unhealthy can be auto-restarted
- Health checks enable zero-downtime deployments
- Better integration with container orchestration platforms

---

## Outstanding Issues

### Log Permission Warnings ⚠️

**Status:** Non-critical, does not affect functionality

**Issue:**
```
[debug-journal] failed to write log: EACCES: permission denied,
  open '/app/logs/mcp-debug.log'
```

**Cause:**
- Debug journal tries to write to `/app/logs/mcp-debug.log`
- Volume-mounted directory may have incorrect permissions
- Container runs as non-root user `ahk-mcp:1001`

**Impact:**
- Debug journal can't write logs
- **Server functions normally** - uses console logging instead
- No data loss or functional impact

**Potential Fix:**
```dockerfile
# In Dockerfile, ensure logs directory has correct permissions
RUN mkdir -p /app/logs && \
    chown -R ahk-mcp:nodejs /app/logs && \
    chmod 755 /app/logs
```

Or in docker-compose.yml:
```yaml
volumes:
  ahk-mcp-logs:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./logs
```

**Decision:** Leave as-is for now (non-critical)

---

## Health Check Configuration

### Current Configuration (docker-compose.yml)

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider",
         "http://localhost:3000/health"]
  interval: 30s      # Check every 30 seconds
  timeout: 10s       # Fail if check takes >10s
  retries: 3         # 3 failures = unhealthy
  start_period: 40s  # Grace period after startup
```

### Health Check Behavior

| Scenario | Container State | Action |
|----------|----------------|--------|
| Startup | `starting` | Wait `start_period` (40s) before checking |
| 1st Success | `healthy` | Continue monitoring every 30s |
| 1st Failure | `healthy` | Increment FailingStreak, retry |
| 3rd Failure | `unhealthy` | Mark container unhealthy |
| Recovery | `healthy` | Reset FailingStreak to 0 |

---

## Testing Checklist

- [x] ✅ TypeScript compiles without errors
- [x] ✅ Docker image builds successfully
- [x] ✅ Health endpoint responds with 200 OK
- [x] ✅ Health endpoint returns valid JSON
- [x] ✅ SSE endpoint still works correctly
- [x] ✅ Both containers report "healthy" status
- [x] ✅ FailingStreak reset to 0
- [x] ✅ No new errors in logs
- [x] ✅ docker-compose warning resolved

---

## Lessons Learned

### 1. Health Checks Need Endpoints

When configuring Docker health checks, ensure the endpoint exists:
- ✅ Define the route in your application
- ✅ Test the endpoint before deploying
- ✅ Return appropriate status codes (200 = healthy)

### 2. Restart vs. Recreate

**Restart** uses the existing container (old image):
```bash
docker restart container-name  # Old image
```

**Recreate** uses the new image:
```bash
docker stop container-name
docker rm container-name
docker-compose up -d service-name  # New image
```

### 3. Health Endpoint Design

Good health endpoints should:
- Return quickly (<1s)
- Check critical dependencies (optional)
- Provide useful metrics (uptime, memory)
- Use standard status codes (200/503)

Example:
```typescript
app.get('/health', (req, res) => {
  // Quick check
  const healthy = true; // Could check DB, etc.

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

---

## Related Documentation

- [SECURITY.md](../SECURITY.md) - Security policies and false positive analysis
- [DOCKER_SETUP_SUMMARY.md](./DOCKER_SETUP_SUMMARY.md) - Docker optimization details
- [VALIDATION_MIGRATION_COMPLETE.md](./VALIDATION_MIGRATION_COMPLETE.md) - Input validation implementation
- [SECURITY_INVESTIGATION_SUMMARY.md](./SECURITY_INVESTIGATION_SUMMARY.md) - CVE false positive investigation

---

## Success Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Healthy Containers | 1/2 (50%) | 2/2 (100%) | +50% |
| FailingStreak | 5938 | 0 | -100% |
| Health Endpoint | Missing | Working | ✅ |
| Docker Warnings | 1 | 0 | -100% |

---

## Next Steps (Optional)

### Immediate
- [x] ✅ Add health endpoint
- [x] ✅ Rebuild and deploy
- [x] ✅ Verify both containers healthy
- [ ] Commit changes to repository
- [ ] Update CHANGELOG.md

### Future Enhancements
- [ ] Add detailed health checks (check doc loader, tool registry)
- [ ] Fix log permission issue (non-critical)
- [ ] Add health metrics to monitoring dashboard
- [ ] Implement health endpoint for stdio mode
- [ ] Add /metrics endpoint for Prometheus

---

*Last Updated: October 20, 2025*
*Status: ✅ All containers healthy*
*Health Check: ✅ Passing*
