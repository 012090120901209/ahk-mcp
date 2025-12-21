
import { AhkWorkflowAnalyzeFixRunTool } from '../src/tools/ahk-workflow-analyze-fix-run.js';
import { AhkAnalyzeTool } from '../src/tools/ahk-analyze-code.js';
import { AhkEditTool } from '../src/tools/ahk-file-edit.js';
import { AhkRunTool } from '../src/tools/ahk-run-script.js';
import { AhkLspTool } from '../src/tools/ahk-analyze-lsp.js';
import fs from 'fs/promises';
import path from 'path';

async function verify() {
  const testFile = path.resolve('temp_test_script.ahk');
  
  // Create a test file with legacy syntax
  const legacyCode = `
#Requires AutoHotkey v2
myVar = 123
MsgBox "Hello"
`;
  await fs.writeFile(testFile, legacyCode, 'utf-8');
  console.log('Created test file:', testFile);

  // Instantiate tools
  const analyzeTool = new AhkAnalyzeTool();
  const editTool = new AhkEditTool();
  const runTool = new AhkRunTool();
  const lspTool = new AhkLspTool();

  // Instantiate workflow tool
  const workflowTool = new AhkWorkflowAnalyzeFixRunTool(
    analyzeTool,
    editTool,
    runTool,
    lspTool
  );

  console.log('Running workflow tool...');
  const result = await workflowTool.execute({
    filePath: testFile,
    autoFix: true,
    runAfterFix: false,
    dryRun: false,
    summaryOnly: false
  });

  console.log('Workflow result:', JSON.stringify(result, null, 2));

  // Verify file content
  const newContent = await fs.readFile(testFile, 'utf-8');
  console.log('New content:\n', newContent);

  if (newContent.includes('myVar := 123')) {
    console.log('✅ Verification PASSED: Legacy assignment fixed.');
  } else {
    console.error('❌ Verification FAILED: Legacy assignment NOT fixed.');
  }

  // Cleanup
  await fs.unlink(testFile);
}

verify().catch(console.error);
