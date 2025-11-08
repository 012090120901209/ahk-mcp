import logger from '../logger.js';
import { tracer } from './tracing.js';

export interface ToolCallMetrics {
  toolName: string;
  timestamp: number;
  success: boolean;
  duration: number;
  errorType?: string;
  errorMessage?: string;
  traceId?: string;
  spanId?: string;
}

export interface ToolStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageDuration: number;
  lastUsed: number;
  commonErrors: Map<string, number>;
}

class ToolAnalytics {
  private metrics: ToolCallMetrics[] = [];
  private maxMetrics = 1000;
  private stats: Map<string, ToolStats> = new Map();

  /**
   * Record a tool call
   */
  recordCall(
    toolName: string,
    success: boolean,
    duration: number,
    error?: Error
  ): void {
    // Capture current trace context
    const context = tracer.getCurrentContext();

    const metric: ToolCallMetrics = {
      toolName,
      timestamp: Date.now(),
      success,
      duration,
      errorType: error?.name,
      errorMessage: error?.message,
      traceId: context?.traceId,
      spanId: context?.spanId,
    };

    this.metrics.push(metric);

    // Trim old metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Update stats
    this.updateStats(metric);

    logger.debug(`Tool analytics recorded: ${toolName} (${success ? 'success' : 'failure'}) in ${duration}ms`);
  }

  /**
   * Update aggregated stats
   */
  private updateStats(metric: ToolCallMetrics): void {
    let stats = this.stats.get(metric.toolName);

    if (!stats) {
      stats = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageDuration: 0,
        lastUsed: 0,
        commonErrors: new Map()
      };
      this.stats.set(metric.toolName, stats);
    }

    stats.totalCalls++;
    if (metric.success) {
      stats.successfulCalls++;
    } else {
      stats.failedCalls++;
      if (metric.errorType) {
        const errorCount = stats.commonErrors.get(metric.errorType) || 0;
        stats.commonErrors.set(metric.errorType, errorCount + 1);
      }
    }

    stats.averageDuration = (stats.averageDuration * (stats.totalCalls - 1) + metric.duration) / stats.totalCalls;
    stats.lastUsed = metric.timestamp;
  }

  /**
   * Get stats for a specific tool
   */
  getToolStats(toolName: string): ToolStats | undefined {
    return this.stats.get(toolName);
  }

  /**
   * Get all tool stats
   */
  getAllStats(): Map<string, ToolStats> {
    return new Map(this.stats);
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 50): ToolCallMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get success rate for a tool
   */
  getSuccessRate(toolName: string): number {
    const stats = this.stats.get(toolName);
    if (!stats || stats.totalCalls === 0) return 0;
    return (stats.successfulCalls / stats.totalCalls) * 100;
  }

  /**
   * Get most used tools
   */
  getMostUsedTools(limit: number = 10): Array<{ toolName: string; calls: number }> {
    return Array.from(this.stats.entries())
      .map(([toolName, stats]) => ({ toolName, calls: stats.totalCalls }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, limit);
  }

  /**
   * Get tools with high failure rates
   */
  getProblematicTools(minCalls: number = 5, minFailureRate: number = 30): Array<{ toolName: string; failureRate: number }> {
    return Array.from(this.stats.entries())
      .filter(([_, stats]) => stats.totalCalls >= minCalls)
      .map(([toolName, stats]) => ({
        toolName,
        failureRate: (stats.failedCalls / stats.totalCalls) * 100
      }))
      .filter(item => item.failureRate >= minFailureRate)
      .sort((a, b) => b.failureRate - a.failureRate);
  }

  /**
   * Get analytics summary
   */
  getSummary(): {
    totalCalls: number;
    uniqueTools: number;
    overallSuccessRate: number;
    averageDuration: number;
    topTools: Array<{ toolName: string; calls: number }>;
    problematicTools: Array<{ toolName: string; failureRate: number }>;
  } {
    const allStats = Array.from(this.stats.values());
    const totalCalls = allStats.reduce((sum, s) => sum + s.totalCalls, 0);
    const totalSuccessful = allStats.reduce((sum, s) => sum + s.successfulCalls, 0);
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);

    return {
      totalCalls,
      uniqueTools: this.stats.size,
      overallSuccessRate: totalCalls > 0 ? (totalSuccessful / totalCalls) * 100 : 0,
      averageDuration: this.metrics.length > 0 ? totalDuration / this.metrics.length : 0,
      topTools: this.getMostUsedTools(5),
      problematicTools: this.getProblematicTools(5, 30)
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      stats: Array.from(this.stats.entries()).map(([toolName, stats]) => ({
        toolName,
        ...stats,
        commonErrors: Array.from(stats.commonErrors.entries())
      })),
      summary: this.getSummary()
    }, null, 2);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.stats.clear();
    logger.info('Tool analytics cleared');
  }
}

export const toolAnalytics = new ToolAnalytics();