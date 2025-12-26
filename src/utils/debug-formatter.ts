/**
 * Debug log entry representing a single tool call or orchestration step
 */
export interface DebugEntry {
  timestamp: number;
  tool: string;
  reason: string;
  duration: number;
  cacheStatus?: 'HIT' | 'MISS' | 'N/A';
  metadata?: Record<string, any>;
}

/**
 * Formats orchestration debug output with visual markers and truncation
 */
export class DebugFormatter {
  private maxLength: number;
  private startTime: number;
  private entries: DebugEntry[];

  /**
   * @param startTime Starting timestamp for relative timing (default: now)
   * @param maxLength Maximum output length before truncation (default: 5000)
   */
  constructor(startTime: number = Date.now(), maxLength: number = 5000) {
    this.startTime = startTime;
    this.maxLength = maxLength;
    this.entries = [];
  }

  /**
   * Add a debug entry for a tool call
   */
  addEntry(entry: Omit<DebugEntry, 'timestamp'>): void {
    this.entries.push({
      timestamp: Date.now(),
      ...entry,
    });
  }

  /**
   * Format all debug entries as a readable string
   */
  format(): string {
    if (this.entries.length === 0) {
      return '';
    }

    let output = '\n---\n\n🔍 **DEBUG: Orchestration Log**\n\n';

    // Add each entry with formatted timing
    for (const entry of this.entries) {
      const elapsed = entry.timestamp - this.startTime;
      const timeStr = this.formatTime(elapsed);

      output += `  [${timeStr}] 🔧 Tool: ${entry.tool}\n`;
      output += `              Reason: ${entry.reason}\n`;

      // Add cache status if provided
      if (entry.cacheStatus) {
        const cacheEmoji = entry.cacheStatus === 'HIT' ? '⚡' : '';
        output += `              Cache: ${entry.cacheStatus} ${cacheEmoji}\n`;
      }

      // Add metadata fields
      if (entry.metadata) {
        for (const [key, value] of Object.entries(entry.metadata)) {
          const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
          output += `              ${formattedKey}: ${value}\n`;
        }
      }

      output += `              Duration: ${entry.duration}ms\n\n`;
    }

    // Add summary
    const totalDuration = Date.now() - this.startTime;
    output += `  ⏱️ **Total**: ${this.entries.length} tool call(s) in ${totalDuration}ms\n`;

    // Check for cache efficiency
    const cacheHits = this.entries.filter(e => e.cacheStatus === 'HIT').length;
    if (cacheHits > 0) {
      output += `  💾 **Cache**: ${cacheHits} hit(s)\n`;
    }

    // Truncate if needed
    if (output.length > this.maxLength) {
      const truncated = output.slice(0, this.maxLength);
      const remaining = output.length - this.maxLength;
      output =
        truncated +
        `\n\n... (debug output truncated, ${remaining} chars hidden)\n\n` +
        `ℹ️ Set debugMode to 'verbose' for full output`;
    }

    return output;
  }

  /**
   * Format milliseconds as MM:SS.mmm
   */
  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const millis = ms % 1000;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  }

  /**
   * Get number of entries logged
   */
  getEntryCount(): number {
    return this.entries.length;
  }

  /**
   * Get total elapsed time since start
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Clear all entries (for reuse)
   */
  clear(): void {
    this.entries = [];
    this.startTime = Date.now();
  }
}

/**
 * Helper function to create a debug formatter with common settings
 */
export function createDebugFormatter(maxLength?: number): DebugFormatter {
  return new DebugFormatter(Date.now(), maxLength);
}
