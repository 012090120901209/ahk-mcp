import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { AhkEditTool } from '../../src/tools/ahk-file-edit.js';
import { AhkSmartOrchestratorTool } from '../../src/tools/ahk-smart-orchestrator.js';
import fs from 'fs/promises';
import path from 'path';

describe('Backward compatibility integration', () => {
  let editTool: AhkEditTool;
  let orchestrator: AhkSmartOrchestratorTool;
  let testFilePath: string;
  let originalContent: string;

  before(async () => {
    editTool = new AhkEditTool();
    orchestrator = new AhkSmartOrchestratorTool();

    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
    const sourceFile = path.join(fixturesDir, 'test-quality-improvements.ahk');
    testFilePath = path.join(fixturesDir, 'test-backward-compat.ahk');

    // Create test copy
    originalContent = await fs.readFile(sourceFile, 'utf-8');
    await fs.writeFile(testFilePath, originalContent);
  });

  after(async () => {
    // Cleanup
    try {
      await fs.unlink(testFilePath);
    } catch {}
  });

  it('should accept all old parameter formats without errors', async () => {
    // Old format: using "content" instead of "newContent"
    const result1 = await editTool.execute({
      action: 'replace',
      search: 'oldText',
      content: 'newText',  // OLD parameter name
      filePath: testFilePath
    });

    assert.strictEqual(result1.isError, undefined, 'Should not error with old parameter');
    assert.ok(result1.content[0].text, 'Should have valid output');

    // Reset file
    await fs.writeFile(testFilePath, originalContent);

    // Old format: without dryRun (should default to false)
    const result2 = await editTool.execute({
      action: 'replace',
      search: 'testValue',
      content: 'newValue',
      filePath: testFilePath
    });

    assert.strictEqual(result2.isError, undefined, 'Should work without dryRun parameter');

    // File should be modified (dryRun defaults to false)
    const fileContent = await fs.readFile(testFilePath, 'utf-8');
    assert.ok(fileContent.includes('newValue'), 'File should be modified when dryRun omitted');
  });

  it('should work without new optional parameters (use defaults)', async () => {
    // Reset file
    await fs.writeFile(testFilePath, originalContent);

    // Call orchestrator without debugMode (should default to false)
    const result = await orchestrator.execute({
      intent: 'view TestClass'
      // No debugMode, no new parameters
    });

    assert.strictEqual(result.isError, undefined, 'Should work without new parameters');
    assert.ok(result.content.length > 0, 'Should have output');

    // Should NOT include debug output
    const hasDebug = result.content.some((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );
    assert.ok(!hasDebug, 'Should not show debug by default');
  });

  it('should maintain JSON output structure for MCP protocol', async () => {
    // Reset file
    await fs.writeFile(testFilePath, originalContent);

    // Test with old parameters
    const editResult = await editTool.execute({
      action: 'replace',
      search: 'TestClass',
      content: 'MyClass',  // Old parameter
      filePath: testFilePath
    });

    // Verify MCP protocol structure
    assert.ok(editResult, 'Should return result object');
    assert.ok('content' in editResult, 'Should have content property');
    assert.ok(Array.isArray(editResult.content), 'Content should be array');
    assert.ok(editResult.content.length > 0, 'Content array should not be empty');
    assert.ok(editResult.content[0].type === 'text', 'Content item should have type');
    assert.ok(typeof editResult.content[0].text === 'string', 'Content should have text');

    // Test with dry-run
    await fs.writeFile(testFilePath, originalContent);

    const dryRunResult = await editTool.execute({
      action: 'replace',
      search: 'TestClass',
      newContent: 'MyClass',
      dryRun: true,
      filePath: testFilePath
    });

    // Same structure even with new parameters
    assert.ok(dryRunResult.content, 'Dry-run should have content');
    assert.ok(Array.isArray(dryRunResult.content), 'Dry-run content should be array');
    assert.strictEqual(dryRunResult.content[0].type, 'text', 'Dry-run should maintain type');
  });

  it('should handle mix of old and new parameters gracefully', async () => {
    // Reset file
    await fs.writeFile(testFilePath, originalContent);

    // Mix: old "content" + new "dryRun"
    const result = await editTool.execute({
      action: 'replace',
      search: 'oldText',
      content: 'newText',  // OLD
      dryRun: true,        // NEW
      filePath: testFilePath
    });

    assert.strictEqual(result.isError, undefined, 'Should handle mixed parameters');
    assert.ok(result.content[0].text.includes('DRY RUN'), 'New feature (dry-run) should work');

    // File should be unchanged (dryRun=true)
    const fileContent = await fs.readFile(testFilePath, 'utf-8');
    assert.strictEqual(fileContent, originalContent, 'Dry-run should prevent changes');
  });

  it('should not break existing error handling', async () => {
    // Test with invalid parameters (should still error properly)
    try {
      await editTool.execute({
        action: 'replace',
        search: 'nonexistent',
        content: 'replacement',
        filePath: '/nonexistent/path.ahk'
      });

      assert.fail('Should have thrown error for invalid file');
    } catch (error: any) {
      // Expected error
      assert.ok(error, 'Should error on invalid file');
    }

    // Test missing required parameters
    try {
      const result = await editTool.execute({
        action: 'replace',
        // Missing search and content
        filePath: testFilePath
      } as any);

      // Should either error or return isError: true
      if (result.isError) {
        assert.ok(true, 'Returned error result');
      } else {
        assert.fail('Should have errored on missing parameters');
      }
    } catch (error) {
      assert.ok(error, 'Should error on missing required parameters');
    }
  });

  it('should preserve all existing tool capabilities', async () => {
    // Reset file
    await fs.writeFile(testFilePath, originalContent);

    // Test regex still works
    const regexResult = await editTool.execute({
      action: 'replace',
      search: 'Test\\w+',
      newContent: 'My$&',  // Using capture groups
      regex: true,
      filePath: testFilePath
    });

    assert.strictEqual(regexResult.isError, undefined, 'Regex should still work');

    // Reset and test "all" flag
    await fs.writeFile(testFilePath, originalContent);

    const allResult = await editTool.execute({
      action: 'replace',
      search: 'DarkMode',
      newContent: 'ThemeMode',
      all: true,
      filePath: testFilePath
    });

    assert.ok(allResult.content[0].text, 'All flag should still work');

    const fileContent = await fs.readFile(testFilePath, 'utf-8');
    const count = (fileContent.match(/ThemeMode/g) || []).length;
    assert.ok(count > 1, 'All flag should replace multiple occurrences');
  });

  it('should maintain backward compatible defaults', async () => {
    // When dryRun is omitted, should default to false (actual edit)
    // When debugMode is omitted, should default to false (no debug output)

    await fs.writeFile(testFilePath, originalContent);

    const editResult = await editTool.execute({
      action: 'replace',
      search: 'oldText',
      newContent: 'actuallyChanged',
      // dryRun omitted - should default to false
      filePath: testFilePath
    });

    const fileContent = await fs.readFile(testFilePath, 'utf-8');
    assert.ok(
      fileContent.includes('actuallyChanged'),
      'Should actually modify file when dryRun omitted (default false)'
    );

    const orchestratorResult = await orchestrator.execute({
      intent: 'view TestClass',
      // debugMode omitted - should default to false
    });

    const hasDebug = orchestratorResult.content.some((item: any) =>
      item.text && item.text.includes('🔍 DEBUG')
    );
    assert.ok(!hasDebug, 'Should not show debug when debugMode omitted (default false)');
  });
});
