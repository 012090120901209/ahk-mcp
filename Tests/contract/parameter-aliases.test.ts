import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { AhkEditTool } from '../../src/tools/ahk-file-edit.js';
import fs from 'fs/promises';
import path from 'path';

describe('AHK_File_Edit parameter aliasing (Contract Test)', () => {
  let editTool: AhkEditTool;
  let testFilePath: string;

  before(async () => {
    editTool = new AhkEditTool();
    testFilePath = path.join(process.cwd(), 'tests', 'fixtures', 'test-quality-improvements.ahk');

    // Ensure test file exists
    try {
      await fs.access(testFilePath);
    } catch {
      throw new Error(`Test fixture not found: ${testFilePath}`);
    }

    // Create a working copy for tests
    const originalContent = await fs.readFile(testFilePath, 'utf-8');
    testFilePath = path.join(process.cwd(), 'tests', 'fixtures', 'test-param-aliases.ahk');
    await fs.writeFile(testFilePath, originalContent);
  });

  it('should accept deprecated "content" parameter', async () => {
    const result = await editTool.execute({
      action: 'replace',
      search: 'oldText',
      content: 'newText',  // Old parameter name
      filePath: testFilePath
    });

    assert.strictEqual(result.isError, undefined, 'Should not return error');
    assert.ok(result.content[0].text.includes('Edit Successful'), 'Should show success message');
  });

  it('should accept new "newContent" parameter', async () => {
    // Reset file
    const originalContent = await fs.readFile(
      path.join(process.cwd(), 'tests', 'fixtures', 'test-quality-improvements.ahk'),
      'utf-8'
    );
    await fs.writeFile(testFilePath, originalContent);

    const result = await editTool.execute({
      action: 'replace',
      search: 'oldText',
      newContent: 'replacementText',  // New parameter name
      filePath: testFilePath
    });

    assert.strictEqual(result.isError, undefined, 'Should not return error');
    assert.ok(result.content[0].text.includes('Edit Successful'), 'Should show success message');
  });

  it('should prefer "newContent" over "content" when both provided', async () => {
    // Reset file
    const originalContent = await fs.readFile(
      path.join(process.cwd(), 'tests', 'fixtures', 'test-quality-improvements.ahk'),
      'utf-8'
    );
    await fs.writeFile(testFilePath, originalContent);

    const result = await editTool.execute({
      action: 'replace',
      search: 'oldText',
      content: 'WRONG',
      newContent: 'CORRECT',
      filePath: testFilePath
    });

    const fileContent = await fs.readFile(testFilePath, 'utf-8');
    assert.ok(fileContent.includes('CORRECT'), 'File should contain newContent value');
    assert.ok(!fileContent.includes('WRONG') || fileContent.match(/oldText/), 'File should NOT contain content value');
  });

  it('should show deprecation warning when using "content"', async () => {
    // Reset file
    const originalContent = await fs.readFile(
      path.join(process.cwd(), 'tests', 'fixtures', 'test-quality-improvements.ahk'),
      'utf-8'
    );
    await fs.writeFile(testFilePath, originalContent);

    const result = await editTool.execute({
      action: 'replace',
      search: 'testValue',
      content: 'newValue',  // Old parameter
      filePath: testFilePath
    });

    const outputText = result.content[0].text;
    assert.ok(
      outputText.match(/deprecated/i) || outputText.match(/use.*newContent/i),
      'Should show deprecation warning'
    );
  });
});
