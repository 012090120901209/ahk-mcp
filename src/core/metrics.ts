import { register, Counter, Histogram, Gauge, Registry } from 'prom-client';

/**
 * Metrics collection module for AutoHotkey MCP Server
 * Provides Prometheus-compatible metrics for monitoring and analytics
 */

class MetricsCollector {
  private registry!: Registry;
  private enabled!: boolean;

  // Request metrics
  private requestTotal?: Counter<string>;
  private requestDuration?: Histogram<string>;
  private activeRequests?: Gauge<string>;

  // Tool-specific metrics
  private toolExecutionTotal?: Counter<string>;
  private toolExecutionDuration?: Histogram<string>;
  private toolErrors?: Counter<string>;

  // AutoHotkey metrics
  private ahkScriptExecutions?: Counter<string>;
  private ahkScriptDuration?: Histogram<string>;
  private ahkWindowDetections?: Counter<string>;
  private ahkWindowDetectionDuration?: Histogram<string>;

  // File operation metrics
  private fileOperations?: Counter<string>;
  private fileOperationDuration?: Histogram<string>;
  private fileOperationErrors?: Counter<string>;

  // System metrics
  private memoryUsage?: Gauge<string>;
  private cpuUsage?: Gauge<string>;
  private activeConnections?: Gauge<string>;

  // Cache metrics
  private cacheHits?: Counter<string>;
  private cacheMisses?: Counter<string>;
  private cacheSize?: Gauge<string>;

  constructor(enabled = true) {
    this.enabled = enabled;
    this.registry = new Registry();

    if (this.enabled) {
      this.initializeMetrics();
    }
  }

  private initializeMetrics(): void {
    // Request metrics
    this.requestTotal = new Counter({
      name: 'ahk_mcp_requests_total',
      help: 'Total number of MCP requests',
      labelNames: ['method', 'status'],
      registers: [this.registry],
    });

    this.requestDuration = new Histogram({
      name: 'ahk_mcp_request_duration_seconds',
      help: 'Duration of MCP requests in seconds',
      labelNames: ['method', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    this.activeRequests = new Gauge({
      name: 'ahk_mcp_active_requests',
      help: 'Number of active MCP requests',
      registers: [this.registry],
    });

    // Tool-specific metrics
    this.toolExecutionTotal = new Counter({
      name: 'ahk_mcp_tool_executions_total',
      help: 'Total number of tool executions',
      labelNames: ['tool_name', 'status'],
      registers: [this.registry],
    });

    this.toolExecutionDuration = new Histogram({
      name: 'ahk_mcp_tool_execution_duration_seconds',
      help: 'Duration of tool executions in seconds',
      labelNames: ['tool_name'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.registry],
    });

    this.toolErrors = new Counter({
      name: 'ahk_mcp_tool_errors_total',
      help: 'Total number of tool execution errors',
      labelNames: ['tool_name', 'error_type'],
      registers: [this.registry],
    });

    // AutoHotkey metrics
    this.ahkScriptExecutions = new Counter({
      name: 'ahk_mcp_ahk_script_executions_total',
      help: 'Total number of AutoHotkey script executions',
      labelNames: ['script_type', 'status'],
      registers: [this.registry],
    });

    this.ahkScriptDuration = new Histogram({
      name: 'ahk_mcp_ahk_script_duration_seconds',
      help: 'Duration of AutoHotkey script executions in seconds',
      labelNames: ['script_type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.registry],
    });

    this.ahkWindowDetections = new Counter({
      name: 'ahk_mcp_ahk_window_detections_total',
      help: 'Total number of AutoHotkey window detections',
      labelNames: ['detection_status'],
      registers: [this.registry],
    });

    this.ahkWindowDetectionDuration = new Histogram({
      name: 'ahk_mcp_ahk_window_detection_duration_seconds',
      help: 'Duration of AutoHotkey window detections in seconds',
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    // File operation metrics
    this.fileOperations = new Counter({
      name: 'ahk_mcp_file_operations_total',
      help: 'Total number of file operations',
      labelNames: ['operation', 'status'],
      registers: [this.registry],
    });

    this.fileOperationDuration = new Histogram({
      name: 'ahk_mcp_file_operation_duration_seconds',
      help: 'Duration of file operations in seconds',
      labelNames: ['operation'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry],
    });

    this.fileOperationErrors = new Counter({
      name: 'ahk_mcp_file_operation_errors_total',
      help: 'Total number of file operation errors',
      labelNames: ['operation', 'error_type'],
      registers: [this.registry],
    });

    // System metrics
    this.memoryUsage = new Gauge({
      name: 'ahk_mcp_memory_usage_bytes',
      help: 'Memory usage in bytes',
      registers: [this.registry],
    });

    this.cpuUsage = new Gauge({
      name: 'ahk_mcp_cpu_usage_percent',
      help: 'CPU usage percentage',
      registers: [this.registry],
    });

    this.activeConnections = new Gauge({
      name: 'ahk_mcp_active_connections',
      help: 'Number of active connections',
      registers: [this.registry],
    });

    // Cache metrics
    this.cacheHits = new Counter({
      name: 'ahk_mcp_cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.cacheMisses = new Counter({
      name: 'ahk_mcp_cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.cacheSize = new Gauge({
      name: 'ahk_mcp_cache_size',
      help: 'Cache size in items',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });
  }

  // Request metrics methods
  incrementRequestTotal(method: string, status: string): void {
    if (this.enabled && this.requestTotal) {
      this.requestTotal.inc({ method, status });
    }
  }

  recordRequestDuration(method: string, status: string, duration: number): void {
    if (this.enabled && this.requestDuration) {
      this.requestDuration.observe({ method, status }, duration);
    }
  }

  incrementActiveRequests(): void {
    if (this.enabled && this.activeRequests) {
      this.activeRequests.inc();
    }
  }

  decrementActiveRequests(): void {
    if (this.enabled && this.activeRequests) {
      this.activeRequests.dec();
    }
  }

  // Tool metrics methods
  incrementToolExecution(toolName: string, status: string): void {
    if (this.enabled && this.toolExecutionTotal) {
      this.toolExecutionTotal.inc({ tool_name: toolName, status });
    }
  }

  recordToolExecutionDuration(toolName: string, duration: number): void {
    if (this.enabled && this.toolExecutionDuration) {
      this.toolExecutionDuration.observe({ tool_name: toolName }, duration);
    }
  }

  incrementToolErrors(toolName: string, errorType: string): void {
    if (this.enabled && this.toolErrors) {
      this.toolErrors.inc({ tool_name: toolName, error_type: errorType });
    }
  }

  // AutoHotkey metrics methods
  incrementAHKScriptExecutions(scriptType: string, status: string): void {
    if (this.enabled && this.ahkScriptExecutions) {
      this.ahkScriptExecutions.inc({ script_type: scriptType, status });
    }
  }

  recordAHKScriptDuration(scriptType: string, duration: number): void {
    if (this.enabled && this.ahkScriptDuration) {
      this.ahkScriptDuration.observe({ script_type: scriptType }, duration);
    }
  }

  incrementAHKWindowDetections(status: string): void {
    if (this.enabled && this.ahkWindowDetections) {
      this.ahkWindowDetections.inc({ detection_status: status });
    }
  }

  recordAHKWindowDetectionDuration(duration: number): void {
    if (this.enabled && this.ahkWindowDetectionDuration) {
      this.ahkWindowDetectionDuration.observe(duration);
    }
  }

  // File operation metrics methods
  incrementFileOperations(operation: string, status: string): void {
    if (this.enabled && this.fileOperations) {
      this.fileOperations.inc({ operation, status });
    }
  }

  recordFileOperationDuration(operation: string, duration: number): void {
    if (this.enabled && this.fileOperationDuration) {
      this.fileOperationDuration.observe({ operation }, duration);
    }
  }

  incrementFileOperationErrors(operation: string, errorType: string): void {
    if (this.enabled && this.fileOperationErrors) {
      this.fileOperationErrors.inc({ operation, error_type: errorType });
    }
  }

  // System metrics methods
  setMemoryUsage(bytes: number): void {
    if (this.enabled && this.memoryUsage) {
      this.memoryUsage.set(bytes);
    }
  }

  setCPUUsage(percent: number): void {
    if (this.enabled && this.cpuUsage) {
      this.cpuUsage.set(percent);
    }
  }

  setActiveConnections(count: number): void {
    if (this.enabled && this.activeConnections) {
      this.activeConnections.set(count);
    }
  }

  // Cache metrics methods
  incrementCacheHits(cacheType: string): void {
    if (this.enabled && this.cacheHits) {
      this.cacheHits.inc({ cache_type: cacheType });
    }
  }

  incrementCacheMisses(cacheType: string): void {
    if (this.enabled && this.cacheMisses) {
      this.cacheMisses.inc({ cache_type: cacheType });
    }
  }

  setCacheSize(cacheType: string, size: number): void {
    if (this.enabled && this.cacheSize) {
      this.cacheSize.set({ cache_type: cacheType }, size);
    }
  }

  // Utility methods
  getRegistry(): Registry {
    return this.registry;
  }

  getMetrics(): Promise<string> {
    if (!this.enabled) {
      return Promise.resolve('# Metrics disabled');
    }
    return this.registry.metrics();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Create a middleware for Express
  createMiddleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();

      this.incrementActiveRequests();

      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const method = req.method || 'unknown';
        const status = res.statusCode.toString();

        this.recordRequestDuration(method, status, duration);
        this.incrementRequestTotal(method, status);
        this.decrementActiveRequests();
      });

      next();
    };
  }
}

// Singleton instance
let metricsInstance: MetricsCollector | null = null;

export function getMetricsCollector(enabled?: boolean): MetricsCollector {
  if (!metricsInstance) {
    metricsInstance = new MetricsCollector(enabled);
  }
  return metricsInstance;
}

export function resetMetricsCollector(): void {
  metricsInstance = null;
}

export { MetricsCollector };
