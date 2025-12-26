import { AhkRunTool } from '../../dist/tools/ahk-run.js';

console.log('Testing AutoHotkey Window Detection\n');

const tool = new AhkRunTool();

// Create a simple test AHK script that shows a GUI
const testScript = `
; Test script that creates a window
myGui := Gui("+Resize", "Test Window from AHK")
myGui.Add("Text", , "This is a test window!")
myGui.Add("Button", "w100", "OK").OnEvent("Click", (*) => ExitApp())
myGui.Show()
`;

// Write the test script
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(__dirname, 'test-window.ahk');

await fs.writeFile(scriptPath, testScript);

console.log('Test 1: Run script WITHOUT window detection');
const result1 = await tool.execute({
  mode: 'run',
  filePath: scriptPath,
  wait: false,
  detectWindow: false,
});
console.log('Result:', result1.content.map(c => c.text).join('\n'));

console.log('\n---\n');

console.log('Test 2: Run script WITH window detection');
const result2 = await tool.execute({
  mode: 'run',
  filePath: scriptPath,
  wait: false,
  detectWindow: true,
  windowDetectTimeout: 5000,
});
console.log('Result:', result2.content.map(c => c.text).join('\n'));

// Cleanup
setTimeout(async () => {
  await fs.unlink(scriptPath);
  console.log('\nTest script cleaned up');
  process.exit(0);
}, 10000);
