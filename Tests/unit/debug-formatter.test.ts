import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DebugFormatter, createDebugFormatter } from '../../src/utils/debug-formatter.js';

describe('Debug Formatter Utility', () => {
  describe('DebugFormatter', () => {
    it('should create formatter with default settings', () => {
      const formatter = new DebugFormatter();
      assert.strictEqual(formatter.getEntryCount(), 0);
    });

    it('should add entries correctly', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'AHK_File_Detect',
        reason: 'Test reason',
        duration: 100
      });

      assert.strictEqual(formatter.getEntryCount(), 1);
    });

    it('should add multiple entries', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'AHK_File_Detect',
        reason: 'First call',
        duration: 50
      });

      formatter.addEntry({
        tool: 'AHK_Analyze',
        reason: 'Second call',
        duration: 100
      });

      assert.strictEqual(formatter.getEntryCount(), 2);
    });

    it('should format output with entries', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'AHK_File_Detect',
        reason: 'Testing',
        duration: 45
      });

      const output = formatter.format();

      assert.ok(output.includes('🔍 **DEBUG: Orchestration Log**'));
      assert.ok(output.includes('AHK_File_Detect'));
      assert.ok(output.includes('Testing'));
      assert.ok(output.includes('45ms'));
    });

    it('should include cache status when provided', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'AHK_Analyze',
        reason: 'Cache test',
        duration: 10,
        cacheStatus: 'HIT'
      });

      const output = formatter.format();

      assert.ok(output.includes('Cache: HIT'));
      assert.ok(output.includes('⚡')); // Cache hit emoji
    });

    it('should show cache MISS without emoji', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'AHK_Analyze',
        reason: 'Cache miss',
        duration: 100,
        cacheStatus: 'MISS'
      });

      const output = formatter.format();

      assert.ok(output.includes('Cache: MISS'));
      assert.ok(!output.includes('⚡'));
    });

    it('should include metadata fields', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'AHK_File_View',
        reason: 'Reading file',
        duration: 25,
        metadata: {
          lines: '10-50',
          mode: 'structured'
        }
      });

      const output = formatter.format();

      assert.ok(output.includes('Lines: 10-50'));
      assert.ok(output.includes('Mode: structured'));
    });

    it('should show total summary', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'Tool1',
        reason: 'First',
        duration: 50
      });

      formatter.addEntry({
        tool: 'Tool2',
        reason: 'Second',
        duration: 75
      });

      const output = formatter.format();

      assert.ok(output.includes('⏱️ **Total**'));
      assert.ok(output.includes('2 tool call(s)'));
    });

    it('should show cache efficiency summary', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'Tool1',
        reason: 'First',
        duration: 50,
        cacheStatus: 'HIT'
      });

      formatter.addEntry({
        tool: 'Tool2',
        reason: 'Second',
        duration: 100,
        cacheStatus: 'HIT'
      });

      const output = formatter.format();

      assert.ok(output.includes('💾 **Cache**'));
      assert.ok(output.includes('2 hit(s)'));
    });

    it('should truncate output when exceeding maxLength', () => {
      const formatter = new DebugFormatter(Date.now(), 200); // Very small max length

      for (let i = 0; i < 10; i++) {
        formatter.addEntry({
          tool: `Tool${i}`,
          reason: `Reason ${i} with very long text to force truncation`,
          duration: 100
        });
      }

      const output = formatter.format();

      assert.ok(output.includes('debug output truncated'));
      assert.ok(output.length <= 300); // Some buffer for truncation message
    });

    it('should format time correctly', () => {
      const startTime = Date.now() - 65432; // 1 min 5 sec 432 ms ago
      const formatter = new DebugFormatter(startTime);

      // Add entry immediately
      formatter.addEntry({
        tool: 'Test',
        reason: 'Timing test',
        duration: 100
      });

      const output = formatter.format();

      // Should show MM:SS.mmm format
      assert.ok(output.match(/\[\d{2}:\d{2}\.\d{3}\]/));
    });

    it('should return empty string when no entries', () => {
      const formatter = new DebugFormatter();
      const output = formatter.format();

      assert.strictEqual(output, '');
    });

    it('should track elapsed time', () => {
      const formatter = new DebugFormatter();

      const elapsed = formatter.getElapsedTime();
      assert.ok(elapsed >= 0);
      assert.ok(elapsed < 100); // Should be very small
    });

    it('should clear entries and reset start time', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'Test',
        reason: 'Before clear',
        duration: 50
      });

      assert.strictEqual(formatter.getEntryCount(), 1);

      formatter.clear();

      assert.strictEqual(formatter.getEntryCount(), 0);
      assert.strictEqual(formatter.format(), '');
    });

    it('should handle entries with no cache status', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'AHK_Run',
        reason: 'No cache needed',
        duration: 200
      });

      const output = formatter.format();

      assert.ok(!output.includes('Cache:'));
      assert.ok(output.includes('Duration: 200ms'));
    });

    it('should capitalize metadata keys', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'Test',
        reason: 'Metadata test',
        duration: 10,
        metadata: {
          fileSize: '1024KB',
          encoding: 'utf-8'
        }
      });

      const output = formatter.format();

      assert.ok(output.includes('FileSize: 1024KB'));
      assert.ok(output.includes('Encoding: utf-8'));
    });
  });

  describe('createDebugFormatter', () => {
    it('should create formatter with default maxLength', () => {
      const formatter = createDebugFormatter();

      formatter.addEntry({
        tool: 'Test',
        reason: 'Factory test',
        duration: 10
      });

      assert.strictEqual(formatter.getEntryCount(), 1);
    });

    it('should create formatter with custom maxLength', () => {
      const formatter = createDebugFormatter(1000);

      // Add many entries
      for (let i = 0; i < 20; i++) {
        formatter.addEntry({
          tool: `Tool${i}`,
          reason: `Long reason text to test truncation at custom length ${i}`,
          duration: i * 10
        });
      }

      const output = formatter.format();

      // Should truncate at custom length
      assert.ok(output.length <= 1100); // Some buffer
    });
  });

  describe('Edge cases', () => {
    it('should handle very large durations', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'SlowTool',
        reason: 'Very slow operation',
        duration: 999999
      });

      const output = formatter.format();

      assert.ok(output.includes('999999ms'));
    });

    it('should handle zero duration', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'InstantTool',
        reason: 'Instant operation',
        duration: 0
      });

      const output = formatter.format();

      assert.ok(output.includes('0ms'));
    });

    it('should handle empty reason', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'Test',
        reason: '',
        duration: 10
      });

      const output = formatter.format();

      assert.ok(output.includes('Reason: '));
    });

    it('should handle very long tool names', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'A'.repeat(100),
        reason: 'Long name test',
        duration: 10
      });

      const output = formatter.format();

      assert.ok(output.includes('A'.repeat(100)));
    });

    it('should handle special characters in metadata', () => {
      const formatter = new DebugFormatter();

      formatter.addEntry({
        tool: 'Test',
        reason: 'Special chars',
        duration: 10,
        metadata: {
          'special-key': 'value with $pecial ch@rs!'
        }
      });

      const output = formatter.format();

      assert.ok(output.includes('value with $pecial ch@rs!'));
    });
  });
});
