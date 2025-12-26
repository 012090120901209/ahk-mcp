import { AhkAnalyzeUnifiedTool } from '../../src/tools/ahk-analyze-complete.ts';

async function verifyUnifiedTool() {
  console.log('Starting verification of AhkAnalyzeUnifiedTool...');

  const tool = new AhkAnalyzeUnifiedTool();

  // Test case with legacy syntax (should trigger diagnostics and fixes)
  const testCode = `
#Requires AutoHotkey v1
myVar = "hello"
if (myVar = "hello")
{
  MsgBox, Hello World
}
  `.trim();

  console.log('\n--- Test Case: Legacy Syntax ---');
  console.log('Input Code:\n', testCode);

  try {
    // Test 'fix' mode
    console.log('\nRunning analysis in "fix" mode...');
    const result = await tool.execute({
      code: testCode,
      mode: 'fix',
      fixLevel: 'safe',
      autoFix: true,
    });

    if ('content' in result && result.content[0]) {
      console.log('\nResult Output:\n', result.content[0].text);

      const outputText = result.content[0].text;

      // Assertions
      if (outputText.includes('Applied') && outputText.includes('fixes')) {
        console.log('✅ Fixes were applied.');
      } else {
        console.error('❌ Expected fixes to be applied.');
      }

      if (outputText.includes('Fixed Code')) {
        console.log('✅ Fixed code section present.');
      } else {
        console.error('❌ Expected fixed code section.');
      }

      if (outputText.includes('Code Quality Assessment')) {
        console.log('✅ Summary section present.');
      } else {
        console.error('❌ Expected summary section.');
      }
    } else {
      console.error('❌ Tool execution returned unexpected format:', result);
    }
  } catch (error) {
    console.error('❌ Verification failed with error:', error);
  }
}

verifyUnifiedTool().catch(console.error);
