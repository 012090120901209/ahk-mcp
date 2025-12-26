/**
 * Test script for library management tools
 * Tests AHK_Library_List, AHK_Library_Info, and AHK_Library_Import
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

console.log('🧪 Testing Library Management Tools\n');

async function sendMcpRequest(method, params) {
  return new Promise((resolve, reject) => {
    const serverPath = join(projectRoot, 'dist', 'server.js');
    const server = spawn('node', [serverPath], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    let output = '';
    let responseReceived = false;

    server.stdout.on('data', data => {
      output += data.toString();

      // Look for JSON-RPC response
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{')) {
          try {
            const response = JSON.parse(line);
            if (response.id === 1) {
              responseReceived = true;
              server.kill();
              resolve(response);
            }
          } catch (e) {
            // Not valid JSON, continue
          }
        }
      }
    });

    server.on('close', code => {
      if (!responseReceived) {
        reject(new Error(`Server closed with code ${code}`));
      }
    });

    setTimeout(() => {
      if (!responseReceived) {
        server.kill();
        reject(new Error('Request timeout'));
      }
    }, 10000);

    // Send initialization
    const initRequest =
      JSON.stringify({
        jsonrpc: '2.0',
        id: 0,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      }) + '\n';

    server.stdin.write(initRequest);

    // Wait a bit then send actual request
    setTimeout(() => {
      const request =
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params,
        }) + '\n';
      server.stdin.write(request);
    }, 1000);
  });
}

async function testLibraryList() {
  console.log('📚 Test 1: AHK_Library_List');
  try {
    const response = await sendMcpRequest('tools/call', {
      name: 'AHK_Library_List',
      arguments: {},
    });

    if (response.result && response.result.content) {
      console.log('✅ Success: AHK_Library_List returned results');
      const content = response.result.content[0]?.text;
      if (content && content.includes('UIA')) {
        console.log('✅ Found UIA library in results');
      } else {
        console.log('⚠️  Warning: UIA library not found in results');
      }
      console.log(`📄 Response preview: ${content?.substring(0, 200)}...\n`);
    } else {
      console.log('❌ Failed: No content in response');
      console.log(JSON.stringify(response, null, 2));
    }
  } catch (error) {
    console.log('❌ Error:', error.message, '\n');
  }
}

async function testLibraryInfo() {
  console.log('📖 Test 2: AHK_Library_Info (UIA)');
  try {
    const response = await sendMcpRequest('tools/call', {
      name: 'AHK_Library_Info',
      arguments: { libraryName: 'UIA' },
    });

    if (response.result && response.result.content) {
      console.log('✅ Success: AHK_Library_Info returned results');
      const content = response.result.content[0]?.text;
      if (content && content.includes('UIA')) {
        console.log('✅ Found UIA information');
      }
      console.log(`📄 Response preview: ${content?.substring(0, 200)}...\n`);
    } else {
      console.log('❌ Failed: No content in response');
      console.log(JSON.stringify(response, null, 2));
    }
  } catch (error) {
    console.log('❌ Error:', error.message, '\n');
  }
}

async function testLibraryImport() {
  console.log('📦 Test 3: AHK_Library_Import (UIA_Browser)');
  try {
    const response = await sendMcpRequest('tools/call', {
      name: 'AHK_Library_Import',
      arguments: { libraryName: 'UIA_Browser' },
    });

    if (response.result && response.result.content) {
      console.log('✅ Success: AHK_Library_Import returned results');
      const content = response.result.content[0]?.text;
      if (content && content.includes('#Include')) {
        console.log('✅ Found #Include statements');
      }
      if (content && content.includes('UIA.ahk')) {
        console.log('✅ Found UIA.ahk dependency');
      }
      console.log(`📄 Response preview: ${content?.substring(0, 300)}...\n`);
    } else {
      console.log('❌ Failed: No content in response');
      console.log(JSON.stringify(response, null, 2));
    }
  } catch (error) {
    console.log('❌ Error:', error.message, '\n');
  }
}

async function runTests() {
  await testLibraryList();
  await testLibraryInfo();
  await testLibraryImport();
  console.log('✨ All tests completed');
}

runTests().catch(console.error);
