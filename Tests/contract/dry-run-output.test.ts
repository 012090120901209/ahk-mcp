import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { AhkEditTool } from '../../src/tools/ahk-file-edit.js';
import fs from 'fs/promises';
import path from 'path';

describe('Dry-run preview format (Contract Test)', () => {
  let editTool: AhkEditTool;
  let testFilePath: string;
  let originalContent: string;

  before(async () => {
    editTool = new AhkEditTool();
    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
    const sourceFile = path.join(fixturesDir, 'test-quality-improvements.ahk');
    testFilePath = path.join(fixturesDir, 'test-dryrun.ahk');

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

  it('should show "DRY RUN" marker without modifying file', async () => {
    const result = await editTool.execute({
      action: 'replace',
      search: 'DarkMode',
      newContent: 'LightMode',
      all: true,
      dryRun: true,
      filePath: testFilePath
    });

    const outputText = result.content[0].text;

    // Check for dry-run markers
    assert.ok(outputText.includes('DRY RUN'), 'Should show DRY RUN marker');
    assert.ok(outputText.match(/no changes made/i), 'Should state no changes were made');

    // Verify file was NOT modified
    const fileContent = await fs.readFile(testFilePath, 'utf-8');
    assert.strictEqual(fileContent, originalContent, 'File should remain unchanged');
    assert.ok(fileContent.includes('DarkMode'), 'Original text should still be present');
  });

  it('should show occurrence count in summary', async () => {
    const result = await editTool.execute({
      action: 'replace',
      search: 'DarkMode',
      newContent: 'LightMode',
      all: true,
      dryRun: true,
      filePath: testFilePath
    });

    const outputText = result.content[0].text;

    // Should mention how many replacements would happen
    assert.ok(
      outputText.match(/would replace \d+ occurrence/i) ||
      outputText.match(/\d+ occurrence.*would be replaced/i),
      'Should show occurrence count'
    );
  });

  it('should show first 3 sample diffs when multiple changes', async () => {
    const result = await editTool.execute({
      action: 'replace',
      search: 'DarkMode',
      newContent: 'ThemeMode',
      all: true,
      dryRun: true,
      filePath: testFilePath
    });

    const outputText = result.content[0].text;

    // Count line number mentions (e.g., "Line 15:", "Line 23:")
    const lineMatches = outputText.match(/Line \d+:/g);

    if (lineMatches) {
      assert.ok(
        lineMatches.length <= 3,
        `Should show at most 3 samples, but found ${lineMatches.length}`
      );
    }
  });

  it('should show before/after preview for each sample', async () => {
    const result = await editTool.execute({
      action: 'replace',
      search: 'testValue',
      newContent: 'newValue',
      dryRun: true,
      filePath: testFilePath
    });

    const outputText = result.content[0].text;

    // Should show before → after format
    assert.ok(
      outputText.includes('→') || outputText.includes('->') || outputText.includes('after'),
      'Should show before/after indication'
    );
  });

  it('should work with single replacement (not just batch)', async () => {
    const result = await editTool.execute({
      action: 'replace',
      search: 'TestClass',
      newContent: 'MyClass',
      all: false,  // Single replacement
      dryRun: true,
      filePath: testFilePath
    });

    const outputText = result.content[0].text;

    assert.ok(outputText.includes('DRY RUN'), 'Should show DRY RUN marker');
    assert.ok(outputText.match(/1 occurrence/i) || outputText.match(/first occurrence/i), 'Should indicate single occurrence');

    // Verify file unchanged
    const fileContent = await fs.readFile(testFilePath, 'utf-8');
    assert.ok(fileContent.includes('TestClass'), 'Original text should remain');
  });

  it('should include file affected count in summary', async () => {
    const result = await editTool.execute({
      action: 'replace',
      search: 'DarkMode',
      newContent: 'NewMode',
      all: true,
      dryRun: true,
      filePath: testFilePath
    });

    const outputText = result.content[0].text;

    assert.ok(
      outputText.match(/1 file affected/i) ||
      outputText.match(/file.*affected/i),
      'Should show affected file count'
    );
  });
});
