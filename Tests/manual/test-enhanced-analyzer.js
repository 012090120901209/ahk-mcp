// Quick test to see if enhanced analyzer is working
import { AhkAnalyzeTool } from '../../dist/tools/ahk-analyze.js';

const analyzer = new AhkAnalyzeTool();

const testCode = `config = {name: "test", value: 123}
myArray = new Array()
// bad comment
MsgBox Hello World`;

console.log('Testing enhanced AutoHotkey analyzer...');

analyzer
  .execute({ code: testCode, includeDocumentation: true })
  .then(result => {
    console.log('Result:', result.content[0].text);
  })
  .catch(error => {
    console.error('Error:', error);
  });
