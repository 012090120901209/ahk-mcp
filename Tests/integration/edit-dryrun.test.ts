import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { AhkEditTool } from '../../src/tools/ahk-file-edit.js';
import fs from 'fs/promises';
import path from 'path';

describe('Dry-run workflow integration', () => {
  let editTool: AhkEditTool;
  let testFilePath: string;
  let originalContent: string;

  before(async () => {
    editTool = new AhkEditTool();
    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
    const sourceFile = path.join(fixturesDir, 'test-quality-improvements.ahk');
    testFilePath = path.join(fixturesDir, 'test-integration-dryrun.ahk');

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

  it('should preview then execute batch replacement workflow', async () => {
    // Step 1: Preview with dry-run
    const preview = await editTool.execute({
      action: 'replace',
      search: 'DarkMode',
      newContent: 'ThemeMode',
      all: true,
      dryRun: true,
      filePath: testFilePath
    });

    // Verify it's a preview
    assert.ok(preview.content[0].text.includes('DRY RUN'), 'Should show DRY RUN marker');

    // Extract expected change count
    const previewText = preview.content[0].text;
    const matchCount = previewText.match(/(\d+) occurrence/i);
    assert.ok(matchCount, 'Preview should show occurrence count');

    const expectedChanges = parseInt(matchCount[1]);
    assert.ok(expectedChanges > 0, 'Should find at least one occurrence');

    // Verify file NOT modified yet
    let fileContent = await fs.readFile(testFilePath, 'utf-8');
    assert.ok(fileContent.includes('DarkMode'), 'File should still have original text');
    assert.ok(!fileContent.includes('ThemeMode'), 'File should NOT have replacement text yet');

    // Step 2: Execute actual edit (same parameters, dryRun=false)
    const actual = await editTool.execute({
      action: 'replace',
      search: 'DarkMode',
      newContent: 'ThemeMode',
      all: true,
      dryRun: false,
      filePath: testFilePath
    });

    // Verify it's not a preview
    assert.ok(!actual.content[0].text.includes('DRY RUN'), 'Should NOT show DRY RUN marker');
    assert.ok(actual.content[0].text.includes('Edit Successful') || actual.content[0].text.includes('✅'), 'Should show success');

    // Step 3: Verify changes were actually made
    fileContent = await fs.readFile(testFilePath, 'utf-8');
    const actualChanges = (fileContent.match(/ThemeMode/g) || []).length;

    assert.strictEqual(
      actualChanges,
      expectedChanges,
      `Should have ${expectedChanges} replacements but found ${actualChanges}`
    );

    // Verify old text is gone
    assert.ok(!fileContent.includes('DarkMode'), 'Original text should be replaced');
  });

  it('should allow canceling after preview (file unchanged)', async () => {
    // Reset file
    await fs.writeFile(testFilePath, originalContent);

    // User previews
    const preview = await editTool.execute({
      action: 'replace',
      search: 'TestClass',
      newContent: 'DeletedClass',
      all: true,
      dryRun: true,
      filePath: testFilePath
    });

    assert.ok(preview.content[0].text.includes('DRY RUN'), 'Preview shown');

    // User decides NOT to proceed (doesn't call with dryRun=false)
    // Verify file unchanged
    const fileContent = await fs.readFile(testFilePath, 'utf-8');
    assert.ok(fileContent.includes('TestClass'), 'Original class name preserved');
    assert.ok(!fileContent.includes('DeletedClass'), 'Replacement not applied');
  });

  it('should handle regex patterns in dry-run', async () => {
    // Reset file
    await fs.writeFile(testFilePath, originalContent);

    const preview = await editTool.execute({
      action: 'replace',
      search: 'Test\\w+',  // Regex pattern
      newContent: 'MyClass',
      regex: true,
      all: true,
      dryRun: true,
      filePath: testFilePath
    });

    assert.ok(preview.content[0].text.includes('DRY RUN'), 'Should preview regex');
    assert.ok(preview.content[0].text.match(/\d+ occurrence/i), 'Should show match count');

    // File unchanged
    const fileContent = await fs.readFile(testFilePath, 'utf-8');
    assert.ok(fileContent.includes('TestClass'), 'Regex not applied in preview');
  });

  it('should work with insert action in dry-run', async () => {
    // Reset file
    await fs.writeFile(testFilePath, originalContent);

    const lines = originalContent.split('\n');
    const targetLine = 5;

    const preview = await editTool.execute({
      action: 'insert',
      line: targetLine,
      newContent: '; This is a test comment',
      dryRun: true,
      filePath: testFilePath
    });

    assert.ok(preview.content[0].text.includes('DRY RUN'), 'Should preview insert');
    assert.ok(preview.content[0].text.includes(`Line ${targetLine}`), 'Should show target line');

    // File unchanged
    const fileContent = await fs.readFile(testFilePath, 'utf-8');
    assert.ok(!fileContent.includes('This is a test comment'), 'Insert not applied');
    assert.strictEqual(fileContent.split('\n').length, lines.length, 'Line count unchanged');
  });
});
