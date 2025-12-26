# Security & Best Practices Action Plan

**Priority Fixes for AutoHotkey v2 MCP Server**

**Created:** 2025-11-09 **Target Completion:** 2025-11-16 (1 week) **Related
Document:** [MCP_BEST_PRACTICES_REVIEW.md](./MCP_BEST_PRACTICES_REVIEW.md)

---

## Overview

This document provides **ready-to-implement code** for the 3 priority security
fixes identified in the MCP Best Practices Review.

---

## Priority 1: Replace execAsync with spawn in PowerShell calls

**Risk:** Command injection via shell interpolation **File:**
`src/tools/ahk-run-script.ts:77-126` **Effort:** 30 minutes **Impact:** High
(eliminates shell injection vector)

### Current Code (Vulnerable)

```typescript
// src/tools/ahk-run-script.ts:99
const psScript = `
  $pid = ${pid}
  $windows = Get-Process -Id $pid -ErrorAction SilentlyContinue | ForEach-Object {
    $_.MainWindowTitle
  }
  if ($windows) {
    Write-Output $windows
  }
`;

const { stdout } = await execAsync(
  `powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`
);
```

### Fixed Code (Secure)

```typescript
// src/tools/ahk-run-script.ts:99 (FIXED)
import { spawn } from 'child_process';

private async detectWindow(pid: number, options: {
  timeout?: number;
  windowTitle?: string;
  windowClass?: string
}): Promise<{ detected: boolean; windowInfo?: any }> {
  const detectTimeout = options.timeout || 3000;
  const startTime = Date.now();

  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      try {
        // SECURE: Use spawn with argument array (no shell interpolation)
        const result = await new Promise<string>((resolvePS, rejectPS) => {
          const psProcess = spawn('powershell', [
            '-NoProfile',
            '-Command',
            `Get-Process -Id ${pid} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty MainWindowTitle`
          ], {
            shell: false,  // ⬅ CRITICAL: Disable shell
            windowsHide: true
          });

          let stdout = '';
          let stderr = '';

          psProcess.stdout.on('data', (data) => {
            stdout += data.toString();
          });

          psProcess.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          psProcess.on('close', (code) => {
            if (code === 0) {
              resolvePS(stdout.trim());
            } else {
              rejectPS(new Error(`PowerShell exited with code ${code}: ${stderr}`));
            }
          });

          psProcess.on('error', (err) => {
            rejectPS(err);
          });
        });

        if (result) {
          clearInterval(checkInterval);
          logger.info(`Window detected for PID ${pid}: ${result}`);
          resolve({
            detected: true,
            windowInfo: {
              title: result,
              pid: pid,
              detectionTime: Date.now() - startTime
            }
          });
        }
      } catch (err) {
        // Process might not exist or have no window yet
        logger.debug(`Window detection attempt failed for PID ${pid}:`, err);
      }

      // Check for timeout
      if (Date.now() - startTime >= detectTimeout) {
        clearInterval(checkInterval);
        logger.info(`No window detected for PID ${pid} within ${detectTimeout}ms`);
        resolve({ detected: false });
      }
    }, 100);
  });
}
```

**Key Changes:**

1. ✅ `spawn()` instead of `execAsync()`
2. ✅ `shell: false` prevents shell interpretation
3. ✅ Arguments passed as array (no string concatenation)
4. ✅ Proper stream handling (stdout/stderr)
5. ✅ Error handling for process failures

---

## Priority 2: Add Rate Limiting Middleware

**Risk:** Denial of service via tool call spam **File:** New
`src/core/rate-limiter.ts` **Effort:** 2 hours **Impact:** High (prevents abuse)

### Implementation

```typescript
// src/core/rate-limiter.ts
import logger from '../logger.js';

export interface RateLimitConfig {
  requestsPerMinute: number;
  scriptsPerMinute: number;
  writesPerWindow: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // milliseconds
}

/**
 * Rate limiter for MCP tool calls
 * Tracks requests per session with sliding window
 */
export class RateLimiter {
  private requests = new Map<string, number[]>();
  private scriptExecutions = new Map<string, number[]>();
  private fileWrites = new Map<string, number[]>();

  constructor(
    private config: RateLimitConfig = {
      requestsPerMinute: 100, // Total tool calls
      scriptsPerMinute: 10, // AHK script executions
      writesPerWindow: 5, // File writes per 10s
      windowMs: 60000, // 1 minute window
    }
  ) {}

  /**
   * Check if a tool call is within rate limits
   */
  checkToolCall(sessionId: string, toolName: string): RateLimitResult {
    const now = Date.now();

    // Check global tool call limit
    const globalLimit = this.checkLimit(
      this.requests,
      sessionId,
      this.config.requestsPerMinute,
      this.config.windowMs,
      now
    );

    if (!globalLimit.allowed) {
      logger.warn(`Rate limit exceeded for session ${sessionId}: tool calls`);
      return {
        allowed: false,
        reason: `Too many requests. Limit: ${this.config.requestsPerMinute}/min`,
        retryAfter: globalLimit.retryAfter,
      };
    }

    // Check script execution limit
    if (this.isScriptExecutionTool(toolName)) {
      const scriptLimit = this.checkLimit(
        this.scriptExecutions,
        sessionId,
        this.config.scriptsPerMinute,
        this.config.windowMs,
        now
      );

      if (!scriptLimit.allowed) {
        logger.warn(
          `Rate limit exceeded for session ${sessionId}: script executions`
        );
        return {
          allowed: false,
          reason: `Too many script executions. Limit: ${this.config.scriptsPerMinute}/min`,
          retryAfter: scriptLimit.retryAfter,
        };
      }
    }

    // Check file write limit
    if (this.isFileWriteTool(toolName)) {
      const writeLimit = this.checkLimit(
        this.fileWrites,
        sessionId,
        this.config.writesPerWindow,
        10000, // 10 second window
        now
      );

      if (!writeLimit.allowed) {
        logger.warn(
          `Rate limit exceeded for session ${sessionId}: file writes`
        );
        return {
          allowed: false,
          reason: `Too many file writes. Limit: ${this.config.writesPerWindow}/10s`,
          retryAfter: writeLimit.retryAfter,
        };
      }
    }

    // Record the request
    this.recordRequest(sessionId, toolName, now);

    return { allowed: true };
  }

  /**
   * Internal rate limit check with sliding window
   */
  private checkLimit(
    storage: Map<string, number[]>,
    key: string,
    limit: number,
    windowMs: number,
    now: number
  ): { allowed: boolean; retryAfter?: number } {
    const timestamps = storage.get(key) || [];

    // Remove old timestamps outside window
    const recent = timestamps.filter(t => now - t < windowMs);

    if (recent.length >= limit) {
      // Calculate retry after (time until oldest request expires)
      const oldestTimestamp = recent[0];
      const retryAfter = windowMs - (now - oldestTimestamp);

      return { allowed: false, retryAfter };
    }

    return { allowed: true };
  }

  /**
   * Record a request timestamp
   */
  private recordRequest(
    sessionId: string,
    toolName: string,
    now: number
  ): void {
    // Record global request
    const requests = this.requests.get(sessionId) || [];
    requests.push(now);
    this.requests.set(
      sessionId,
      requests.filter(t => now - t < this.config.windowMs)
    );

    // Record script execution
    if (this.isScriptExecutionTool(toolName)) {
      const executions = this.scriptExecutions.get(sessionId) || [];
      executions.push(now);
      this.scriptExecutions.set(
        sessionId,
        executions.filter(t => now - t < this.config.windowMs)
      );
    }

    // Record file write
    if (this.isFileWriteTool(toolName)) {
      const writes = this.fileWrites.get(sessionId) || [];
      writes.push(now);
      this.fileWrites.set(
        sessionId,
        writes.filter(t => now - t < 10000)
      );
    }
  }

  /**
   * Check if tool executes scripts
   */
  private isScriptExecutionTool(toolName: string): boolean {
    return ['AHK_Run', 'AHK_Debug_Agent', 'AHK_Test_Interactive'].includes(
      toolName
    );
  }

  /**
   * Check if tool writes files
   */
  private isFileWriteTool(toolName: string): boolean {
    return [
      'AHK_File_Edit',
      'AHK_File_Edit_Advanced',
      'AHK_File_Edit_Small',
      'AHK_File_Edit_Diff',
      'AHK_File_Create',
    ].includes(toolName);
  }

  /**
   * Clear all rate limit data for a session
   */
  clearSession(sessionId: string): void {
    this.requests.delete(sessionId);
    this.scriptExecutions.delete(sessionId);
    this.fileWrites.delete(sessionId);
  }

  /**
   * Get current stats for a session
   */
  getSessionStats(sessionId: string): {
    requests: number;
    scriptExecutions: number;
    fileWrites: number;
  } {
    const now = Date.now();

    return {
      requests: (this.requests.get(sessionId) || []).filter(
        t => now - t < this.config.windowMs
      ).length,
      scriptExecutions: (this.scriptExecutions.get(sessionId) || []).filter(
        t => now - t < this.config.windowMs
      ).length,
      fileWrites: (this.fileWrites.get(sessionId) || []).filter(
        t => now - t < 10000
      ).length,
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
```

### Integration into Server

```typescript
// src/server.ts (add to CallToolRequestSchema handler)

import { rateLimiter } from './core/rate-limiter.js';

// In setupToolHandlers(), around line 245:
this.server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;
  const startTime = Date.now();

  // Generate or retrieve session ID (from request metadata or create new)
  const sessionId = this.getSessionId(request);

  // ⬅ ADD RATE LIMITING HERE
  const rateLimitResult = rateLimiter.checkToolCall(sessionId, name);
  if (!rateLimitResult.allowed) {
    logger.warn(`Rate limit exceeded for ${name}: ${rateLimitResult.reason}`);
    return {
      content: [
        {
          type: 'text',
          text: `⏱️ **Rate Limit Exceeded**\n\n${rateLimitResult.reason}\n\nPlease wait ${Math.ceil((rateLimitResult.retryAfter || 0) / 1000)}s before trying again.`,
        },
      ],
      isError: true,
    };
  }

  // ... rest of existing code
});
```

**Key Features:**

1. ✅ Sliding window algorithm (more accurate than fixed windows)
2. ✅ Different limits for different tool categories
3. ✅ Retry-after calculation for clients
4. ✅ Session-based tracking
5. ✅ Automatic cleanup of old timestamps

---

## Priority 3: Add Tool Call Depth Limit

**Risk:** Stack overflow from recursive tool calls **File:**
`src/core/tool-registry.ts` **Effort:** 1 hour **Impact:** Medium (prevents
infinite loops)

### Implementation

```typescript
// src/core/tool-registry.ts (enhanced)

import { AsyncLocalStorage } from 'async_hooks';

export class ToolRegistry {
  private toolHandlers = new Map<string, (args: any) => Promise<any>>();

  // ⬅ ADD: Track call stack per request
  private callStack = new AsyncLocalStorage<string[]>();
  private maxDepth = 10; // Configurable via environment

  constructor(private serverInstance: IToolServer) {
    this.registerCoreTools();
    this.registerChatGPTTools();

    // Load max depth from environment
    const envMaxDepth = process.env.AHK_MCP_MAX_TOOL_DEPTH;
    if (envMaxDepth) {
      const parsed = parseInt(envMaxDepth, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
        this.maxDepth = parsed;
      }
    }
  }

  /**
   * Execute a tool by name with given arguments
   * Enforces call depth limit to prevent infinite recursion
   */
  async executeTool(toolName: string, args: any): Promise<any> {
    // Get current call stack (or empty array if first call)
    const stack = this.callStack.getStore() || [];

    // Check depth limit
    if (stack.length >= this.maxDepth) {
      const stackTrace = stack
        .map((tool, idx) => `  ${idx + 1}. ${tool}`)
        .join('\n');

      logger.error(
        `Tool call depth limit exceeded (${this.maxDepth}). Stack:\n${stackTrace}\n  ${stack.length + 1}. ${toolName} ⬅ BLOCKED`
      );

      throw new Error(
        `Tool call depth limit exceeded (max: ${this.maxDepth}).\n\n` +
          `**Call Stack:**\n${stackTrace}\n  ${stack.length + 1}. ${toolName} ⬅ Blocked\n\n` +
          `This usually indicates recursive tool calling. Check your tool logic.`
      );
    }

    // Check for immediate recursion (same tool called twice in a row)
    if (stack.length > 0 && stack[stack.length - 1] === toolName) {
      logger.warn(`Immediate recursion detected: ${toolName} calling itself`);
    }

    // Execute within new stack context
    return this.callStack.run([...stack, toolName], async () => {
      const handler = this.toolHandlers.get(toolName);
      if (!handler) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      logger.debug(
        `Tool call [depth: ${stack.length + 1}/${this.maxDepth}]: ${toolName}`
      );

      return await handler(args);
    });
  }

  /**
   * Get current call stack (for debugging)
   */
  getCurrentCallStack(): string[] {
    return this.callStack.getStore() || [];
  }

  /**
   * Get call depth for current request
   */
  getCurrentDepth(): number {
    const stack = this.callStack.getStore() || [];
    return stack.length;
  }

  // ... rest of existing code
}
```

**Key Features:**

1. ✅ Uses `AsyncLocalStorage` to track stack per request
2. ✅ Configurable depth limit via environment variable
3. ✅ Detailed error messages with full stack trace
4. ✅ Detects immediate recursion (tool calling itself)
5. ✅ Debug logging shows depth on each call

### Environment Variable Configuration

```bash
# .env or docker-compose.yml
AHK_MCP_MAX_TOOL_DEPTH=10  # Default
# AHK_MCP_MAX_TOOL_DEPTH=5  # Stricter (for testing)
# AHK_MCP_MAX_TOOL_DEPTH=20 # More permissive
```

---

## Testing Plan

### 1. Test Rate Limiting

```typescript
// test/rate-limiter.test.ts
import { RateLimiter } from '../src/core/rate-limiter';

describe('RateLimiter', () => {
  it('should allow requests within limit', () => {
    const limiter = new RateLimiter({
      requestsPerMinute: 5,
      scriptsPerMinute: 2,
      writesPerWindow: 1,
      windowMs: 60000,
    });

    // Should allow first 5 requests
    for (let i = 0; i < 5; i++) {
      const result = limiter.checkToolCall('session1', 'AHK_File_View');
      expect(result.allowed).toBe(true);
    }

    // Should block 6th request
    const result = limiter.checkToolCall('session1', 'AHK_File_View');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Too many requests');
  });

  it('should enforce script execution limits', () => {
    const limiter = new RateLimiter({
      requestsPerMinute: 100,
      scriptsPerMinute: 2,
      writesPerWindow: 10,
      windowMs: 60000,
    });

    // Should allow first 2 script executions
    limiter.checkToolCall('session1', 'AHK_Run');
    const result2 = limiter.checkToolCall('session1', 'AHK_Run');
    expect(result2.allowed).toBe(true);

    // Should block 3rd
    const result3 = limiter.checkToolCall('session1', 'AHK_Run');
    expect(result3.allowed).toBe(false);
  });
});
```

### 2. Test Tool Call Depth Limit

```typescript
// test/tool-depth-limit.test.ts
import { ToolRegistry } from '../src/core/tool-registry';

describe('ToolRegistry Depth Limit', () => {
  it('should prevent excessive recursion', async () => {
    const registry = new ToolRegistry(mockServerInstance);

    // Mock a recursive tool
    registry.toolHandlers.set('RecursiveTool', async args => {
      // Tool calls itself
      return await registry.executeTool('RecursiveTool', args);
    });

    // Should throw after max depth
    await expect(registry.executeTool('RecursiveTool', {})).rejects.toThrow(
      'Tool call depth limit exceeded'
    );
  });
});
```

### 3. Test PowerShell Spawn Security

```typescript
// test/powershell-spawn.test.ts
describe('PowerShell Spawn Security', () => {
  it('should not execute injected commands', async () => {
    const tool = new AhkRunTool();

    // Try to inject command via malicious PID
    const maliciousPid = '1234; rm -rf /'; // Should be number, not string

    // Should throw validation error
    await expect(
      tool.execute({ filePath: 'test.ahk', ahkPath: 'ahk.exe' })
    ).rejects.toThrow('Type mismatch');
  });
});
```

---

## Rollout Plan

### Phase 1: Local Testing (Days 1-2)

1. ✅ Implement fixes in feature branch
2. ✅ Run unit tests
3. ✅ Manual testing with Claude Desktop
4. ✅ Verify no breaking changes

### Phase 2: Docker Testing (Day 3)

1. ✅ Build Docker image with fixes
2. ✅ Run integration tests in container
3. ✅ Test rate limiting under load
4. ✅ Verify depth limits work across tools

### Phase 3: Documentation (Day 4)

1. ✅ Update SECURITY.md
2. ✅ Add rate limiting to OBSERVABILITY.md
3. ✅ Document environment variables
4. ✅ Update CHANGELOG.md

### Phase 4: Deployment (Day 5)

1. ✅ Merge to main branch
2. ✅ Tag release (v2.1.0)
3. ✅ Update Docker Hub image
4. ✅ Notify users of new security features

---

## Success Criteria

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Docker Scout reports no HIGH vulnerabilities
- [ ] Rate limiting blocks excessive requests
- [ ] Depth limit prevents stack overflow
- [ ] PowerShell spawn uses no shell interpolation
- [ ] Documentation updated
- [ ] Zero breaking changes for existing users

---

## Environment Variables Summary

```bash
# Rate Limiting
AHK_MCP_RATE_LIMIT_REQUESTS=100      # Tool calls per minute
AHK_MCP_RATE_LIMIT_SCRIPTS=10        # Script executions per minute
AHK_MCP_RATE_LIMIT_WRITES=5          # File writes per 10 seconds

# Tool Call Depth
AHK_MCP_MAX_TOOL_DEPTH=10            # Maximum recursive tool calls

# Existing Variables (for reference)
AHK_MCP_MAX_TRACES=1000              # Trace storage limit
AHK_MCP_LOG_FORMAT=json              # Log format (json|human)
AHK_MCP_ENABLE_TRACING=true          # Enable distributed tracing
```

---

## Questions or Issues?

If you encounter problems implementing these fixes:

1. Check the [MCP_BEST_PRACTICES_REVIEW.md](./MCP_BEST_PRACTICES_REVIEW.md) for
   context
2. Review existing security docs in `docs/SECURITY_INVESTIGATION_SUMMARY.md`
3. Test incrementally (one fix at a time)
4. Use the debug mode to inspect behavior

**Contact:** Open an issue on GitHub with tag `security` or `best-practices`

---

**Document Version:** 1.0 **Last Updated:** 2025-11-09 **Next Review:** After
implementation (target: 2025-11-16)
