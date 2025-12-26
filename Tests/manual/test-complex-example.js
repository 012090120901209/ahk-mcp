import { AhkAnalyzeTool } from '../../dist/tools/ahk-analyze.js';

const analyzer = new AhkAnalyzeTool();

const complexCode = `// Complex AutoHotkey code with multiple v2 issues
settings = {
    app: {name: "MyApp", version: "1.0"},
    ui: {theme: "dark", size: "large"},
    debug: true
}

users = new Map()
users = {id1: "John", id2: "Jane"}

MsgBox Welcome to %settings.app.name%
Send Hello World
result = "Hello" . " " . "World"

F1::
    Click 100, 200
return`;

analyzer
  .execute({ code: complexCode, includeDocumentation: true })
  .then(result => {
    console.log('=== COMPLEX EXAMPLE RESULTS ===');
    console.log(result.content[0].text);
  })
  .catch(error => {
    console.error('Error:', error);
  });
