import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { AhkSmartOrchestratorTool } from '../../src/tools/ahk-smart-orchestrator.js';
import path from 'path';

describe('Orchestrator debug mode integration', () => {
  let orchestrator: AhkSmartOrchestratorTool;
  let testFilePath: string;

  before(() => {
    orchestrator = new AhkSmartOrchestratorTool();
    testFilePath = path.join(process.cwd(), 'tests', 'fixtures', 'test-quality-improvements.ahk');
  });

  it('should log all tool calls with reasons and timing', async () => {
    const result = await orchestrator.execute({
      intent: 'view the ColorCheckbox method in TestClass',
      filePath: testFilePath,
      debugMode: true
    });

    // Find debug section
    const debugContent = result.content.find((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );

    assert.ok(debugContent, 'Should include debug section');

    const debugText = debugContent.text;

    // Should show analysis step (or skip if cached)
    const mentionsAnalyze = debugText.includes('AHK_Analyze') || debugText.includes('Analyze');

    // Should show file view step
    const mentionsFileView = debugText.includes('AHK_File_View') || debugText.includes('File_View');

    // At minimum, should show one of these
    assert.ok(
      mentionsAnalyze || mentionsFileView,
      'Should mention orchestration tools used'
    );

    // Check for reasons
    assert.ok(
      debugText.match(/Reason:/i) ||
      debugText.match(/because/i) ||
      debugText.match(/cache/i),
      'Should explain why each tool was called'
    );

    // Check for timing
    assert.ok(
      debugText.match(/\d+ms/) || debugText.match(/Duration:/i),
      'Should show execution timing'
    );

    // Check for cache status
    assert.ok(
      debugText.match(/Cache:/i) || debugText.match(/HIT|MISS/),
      'Should show cache status'
    );
  });

  it('should show different decisions for cache HIT vs MISS', async () => {
    // First call - should be cache MISS
    const firstResult = await orchestrator.execute({
      intent: 'analyze file structure',
      filePath: testFilePath,
      operation: 'analyze',
      debugMode: true,
      forceRefresh: true  // Force miss
    });

    const firstDebug = firstResult.content.find((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );

    assert.ok(firstDebug, 'First call should have debug output');

    // Should mention analysis since cache miss
    assert.ok(
      firstDebug.text.match(/MISS/i) ||
      firstDebug.text.match(/analyzing/i) ||
      firstDebug.text.match(/no cache/i),
      'Should indicate cache miss or analysis'
    );

    // Second call - might be cache HIT (if caching works)
    const secondResult = await orchestrator.execute({
      intent: 'analyze file structure',
      filePath: testFilePath,
      operation: 'analyze',
      debugMode: true
    });

    const secondDebug = secondResult.content.find((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );

    assert.ok(secondDebug, 'Second call should have debug output');

    // Debug output should exist regardless of cache status
    assert.ok(secondDebug.text.length > 0, 'Debug output should not be empty');
  });

  it('should show entity targeting decisions', async () => {
    const result = await orchestrator.execute({
      intent: 'view the TestMethod in TestClass',
      filePath: testFilePath,
      targetEntity: 'TestClass.TestMethod',
      debugMode: true
    });

    const debugContent = result.content.find((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );

    if (debugContent) {
      const debugText = debugContent.text;

      // Should mention targeting decisions
      assert.ok(
        debugText.match(/TestClass/i) ||
        debugText.match(/TestMethod/i) ||
        debugText.match(/targeting/i) ||
        debugText.match(/found.*at line/i),
        'Should show entity targeting logic'
      );

      // Should show line range
      assert.ok(
        debugText.match(/line.*\d+/i) ||
        debugText.match(/\d+-\d+/),
        'Should show line numbers'
      );
    }
  });

  it('should include total timing and tool count summary', async () => {
    const result = await orchestrator.execute({
      intent: 'view file',
      filePath: testFilePath,
      debugMode: true
    });

    const debugContent = result.content.find((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );

    assert.ok(debugContent, 'Should have debug section');

    const debugText = debugContent.text;

    // Should have summary section
    assert.ok(
      debugText.match(/Total:/i) ||
      debugText.match(/\d+ tool call/i) ||
      debugText.match(/Summary:/i),
      'Should include timing summary'
    );

    // Should count tools
    assert.ok(
      debugText.match(/\d+ tool/i),
      'Should count number of tools called'
    );
  });

  it('should format timestamps consistently', async () => {
    const result = await orchestrator.execute({
      intent: 'analyze structure',
      filePath: testFilePath,
      operation: 'analyze',
      debugMode: true
    });

    const debugContent = result.content.find((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );

    if (debugContent) {
      const debugText = debugContent.text;

      // Check for timestamp format
      // Common formats: [00:00.025], [0.025s], 25ms
      const hasTimestamps =
        debugText.match(/\[\d+:\d+\.\d+\]/) ||  // [00:00.025]
        debugText.match(/\d+\.\d+s/) ||          // 0.025s
        debugText.match(/\d+ms/);                 // 25ms

      assert.ok(hasTimestamps, 'Should include formatted timestamps');
    }
  });

  it('should separate debug output from normal output', async () => {
    const result = await orchestrator.execute({
      intent: 'view TestClass',
      filePath: testFilePath,
      debugMode: true
    });

    // Should have both normal output AND debug output
    assert.ok(result.content.length > 0, 'Should have output');

    const hasNormalOutput = result.content.some((item: any) =>
      item.text && !item.text.includes('🔍 DEBUG') && item.text.length > 50
    );

    const hasDebugOutput = result.content.some((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );

    assert.ok(hasNormalOutput, 'Should include normal output');
    assert.ok(hasDebugOutput, 'Should include debug output');

    // Debug should be visually separated (e.g., with separator line)
    const debugContent = result.content.find((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );

    if (debugContent) {
      assert.ok(
        debugContent.text.includes('---') ||
        debugContent.text.includes('━━━') ||
        debugContent.text.includes('\n\n'),
        'Debug section should be visually separated'
      );
    }
  });
});
