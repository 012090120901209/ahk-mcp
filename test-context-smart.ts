import { AhkContextInjectorTool } from './src/tools/ahk-docs-context.js';
import { AhkCompiler } from './src/compiler/ahk-compiler.js';
import { loadAhkData } from './src/core/loader.js';

async function testSmartContext() {
  console.log('🧪 Testing Smart Context Injection...');

  // Initialize Data Loader
  console.log('Loading AHK Data...');
  await loadAhkData();

  // Verify Compiler
  console.log('Verifying AhkCompiler...');
  const parseResult = AhkCompiler.parse('MyMap := Map("key", "value")');
  console.log('Compiler Check:', parseResult.success);
  
  const tool = new AhkContextInjectorTool();
  
  // Test Case 1: Code with function call not in keywords
  const code1 = 'MyMap := Map("key", "value")';
  console.log(`\n📝 Analyzing: "${code1}"`);
  
  const result1 = await tool.execute({
    userPrompt: code1,
    contextType: 'auto'
  });
  
  const content1 = result1.content[0].text;
  if (content1.includes('**Map**')) {
    console.log('✅ SUCCESS: Detected "Map" from code usage');
  } else {
    console.log('❌ FAILURE: Did not detect "Map"');
    console.log('ACTUAL OUTPUT:', content1.substring(0, 200) + '...');
  }

  // Test Case 2: Code with method call
  const code2 = 'myGui.Add("Button")';
  console.log(`\n📝 Analyzing: "${code2}"`);
  
  const result2 = await tool.execute({
    userPrompt: code2,
    contextType: 'auto'
  });
  
  const content2 = result2.content[0].text;
  if (content2.includes('**Add**')) { // Should find Gui.Add or similar
    console.log('✅ SUCCESS: Detected "Add" method');
  } else {
    console.log('❌ FAILURE: Did not detect "Add"');
    console.log('ACTUAL OUTPUT:', content2.substring(0, 200) + '...');
  }

  // Test Case 3: Built-in variable
  const code3 = 'current := A_TickCount';
  console.log(`\n📝 Analyzing: "${code3}"`);
  
  const result3 = await tool.execute({
    userPrompt: code3,
    contextType: 'auto'
  });
  
  const content3 = result3.content[0].text;
  if (content3.includes('**A_TickCount**')) {
    console.log('✅ SUCCESS: Detected "A_TickCount"');
  } else {
    console.log('❌ FAILURE: Did not detect "A_TickCount"');
    console.log('ACTUAL OUTPUT:', content3.substring(0, 200) + '...');
  }
}

testSmartContext().catch(console.error);
