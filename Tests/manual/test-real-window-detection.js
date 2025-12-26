import { AhkRunTool } from '../../dist/tools/ahk-run.js';

console.log('🚀 Testing Window Detection with Real AutoHotkey Script');
console.log('Script: C:\\path\\to\\your\\test-script.ahk\n');

const tool = new AhkRunTool();
const scriptPath = 'C:\\path\\to\\your\\test-script.ahk';

async function runTest() {
  try {
    console.log('📋 Test 1: Run WITHOUT window detection');
    console.log('Expected: Basic process info only\n');

    const result1 = await tool.execute({
      mode: 'run',
      filePath: scriptPath,
      wait: false,
      detectWindow: false,
    });

    console.log('Response 1:');
    result1.content.forEach(item => {
      if (item.text) console.log(item.text);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // Wait a moment between tests
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('🔍 Test 2: Run WITH window detection ENABLED');
    console.log('Expected: Process info + window detection results\n');

    const result2 = await tool.execute({
      mode: 'run',
      filePath: scriptPath,
      wait: false,
      detectWindow: true,
      windowDetectTimeout: 5000, // 5 second timeout
    });

    console.log('Response 2:');
    result2.content.forEach(item => {
      if (item.text) console.log(item.text);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    console.log('📊 Analysis:');

    // Parse the JSON responses to compare
    const response1Json = result1.content.find(
      item => item.text && item.text.startsWith('{')
    )?.text;
    const response2Json = result2.content.find(
      item => item.text && item.text.startsWith('{')
    )?.text;

    if (response1Json && response2Json) {
      const data1 = JSON.parse(response1Json);
      const data2 = JSON.parse(response2Json);

      console.log(`Test 1 PID: ${data1.pid || 'N/A'}`);
      console.log(`Test 2 PID: ${data2.pid || 'N/A'}`);
      console.log(`Window Detected: ${data2.windowDetected ? 'YES ✅' : 'NO ❌'}`);

      if (data2.windowInfo) {
        console.log(`Window Title: "${data2.windowInfo.title}"`);
        console.log(`Detection Time: ${data2.windowInfo.detectionTime}ms`);
      }

      console.log('\n🎯 Key Differences:');
      console.log(
        `• windowDetected: ${data1.windowDetected || 'undefined'} → ${data2.windowDetected}`
      );
      if (data2.windowInfo) {
        console.log(`• windowInfo: Not present → Present with title "${data2.windowInfo.title}"`);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);

    if (error.message.includes('AutoHotkey v2 not found')) {
      console.log('\n💡 Note: This test requires AutoHotkey v2 to be installed on Windows.');
      console.log('The window detection feature works by:');
      console.log('1. Launching the AHK script and capturing its Process ID');
      console.log('2. Using PowerShell to monitor the process for MainWindowTitle');
      console.log('3. Detecting when the GUI window appears');
      console.log('4. Returning window information in the response');
    }
  }
}

runTest();
