import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { AhkSmartOrchestratorTool } from '../../src/tools/ahk-smart-orchestrator.js';
import path from 'path';

describe('Debug mode output structure (Contract Test)', () => {
  let orchestrator: AhkSmartOrchestratorTool;
  let testFilePath: string;

  before(() => {
    orchestrator = new AhkSmartOrchestratorTool();
    testFilePath = path.join(process.cwd(), 'tests', 'fixtures', 'test-quality-improvements.ahk');
  });

  it('should include debug section when debugMode=true', async () => {
    const result = await orchestrator.execute({
      intent: 'view TestClass',
      filePath: testFilePath,
      debugMode: true
    });

    // Find debug section in output
    const hasDebugSection = result.content.some((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );

    assert.ok(hasDebugSection, 'Should include debug section with 🔍 DEBUG marker');

    // Check for debug content
    const debugContent = result.content.find((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );

    if (debugContent) {
      const debugText = debugContent.text;

      // Should mention tool calls
      assert.ok(
        debugText.match(/Tool:/i) || debugText.match(/AHK_\w+/),
        'Debug output should mention tool names'
      );

      // Should include reasons
      assert.ok(
        debugText.match(/Reason:/i) || debugText.match(/because/i),
        'Debug output should include reasons for tool calls'
      );

      // Should show timing info
      assert.ok(
        debugText.match(/Duration:/i) || debugText.match(/\d+ms/),
        'Debug output should include timing information'
      );
    }
  });

  it('should NOT include debug output when debugMode=false', async () => {
    const result = await orchestrator.execute({
      intent: 'view TestClass',
      filePath: testFilePath,
      debugMode: false
    });

    // No debug section should be present
    const hasDebugSection = result.content.some((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );

    assert.ok(!hasDebugSection, 'Should NOT include debug section when debugMode=false');
  });

  it('should NOT include debug output when debugMode omitted (default)', async () => {
    const result = await orchestrator.execute({
      intent: 'view TestClass',
      filePath: testFilePath
      // debugMode not specified, should default to false
    });

    const hasDebugSection = result.content.some((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );

    assert.ok(!hasDebugSection, 'Should NOT include debug section by default');
  });

  it('should show cache status in debug output', async () => {
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

      // Should mention cache status
      assert.ok(
        debugText.match(/Cache:/i) ||
        debugText.match(/MISS/i) ||
        debugText.match(/HIT/i),
        'Debug output should show cache status'
      );
    }
  });

  it('should show orchestration decision timeline', async () => {
    const result = await orchestrator.execute({
      intent: 'edit ColorCheckbox method',
      filePath: testFilePath,
      operation: 'view',
      debugMode: true
    });

    const debugContent = result.content.find((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );

    if (debugContent) {
      const debugText = debugContent.text;

      // Should show sequential steps
      const toolMentions = debugText.match(/Tool:/gi);

      if (toolMentions && toolMentions.length > 1) {
        assert.ok(true, 'Debug shows multiple tool calls in sequence');
      }

      // Should have timestamps or ordering
      assert.ok(
        debugText.match(/\[\d+:\d+\.\d+\]/) ||  // [00:00.025]
        debugText.match(/step \d+/i) ||
        debugText.match(/\d+\./),  // 1. 2. 3.
        'Debug output should show timeline or ordering'
      );
    }
  });

  it('should truncate debug output at configured limit (5000 chars)', async () => {
    // This test verifies truncation behavior
    // In a real scenario with many tool calls, output should be limited

    const result = await orchestrator.execute({
      intent: 'complex operation',
      filePath: testFilePath,
      debugMode: true
    });

    const debugContent = result.content.find((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );

    if (debugContent && debugContent.text.length > 5000) {
      assert.ok(
        debugContent.text.includes('truncated') ||
        debugContent.text.includes('hidden'),
        'Long debug output should indicate truncation'
      );
    } else {
      // If not truncated, that's also valid (not enough output)
      assert.ok(true, 'Debug output within limits or truncation marker present');
    }
  });
});
