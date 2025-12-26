import { spawn } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function nextId() {
  return Math.random().toString(36).slice(2);
}

const TEST_FILE = join(process.cwd(), 'Tests', 'manual', 'temp-test.ahk');

async function main() {
  console.log('\n=== Testing AHK MCP Server - File Tools ===\n');

  // Create test file
  const testContent = `; Test Script
#Requires AutoHotkey v2.0

MsgBox("Hello World")
`;
  writeFileSync(TEST_FILE, testContent);
  console.log(`Created test file: ${TEST_FILE}`);

  const child = spawn('node', [join(process.cwd(), 'dist', 'index.js')], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  function send(msg) {
    child.stdin.write(JSON.stringify(msg) + '\n');
  }

  function onceMessage() {
    return new Promise(resolve => {
      const onData = buf => {
        const text = buf.toString();
        const lines = text.split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
          try {
            return resolve(JSON.parse(line));
          } catch {}
        }
        child.stdout.off('data', onData);
      };
      child.stdout.once('data', onData);
    });
  }

  try {
    // Initialize
    console.log('\n✓ Initializing server');
    const initId = nextId();
    send({
      jsonrpc: '2.0',
      id: initId,
      method: 'initialize',
      params: { clientInfo: { name: 'file-test', version: '1.0.0' } },
    });
    await onceMessage();

    // Test 1: File detection
    console.log('\n✓ Test 1: AHK_File_Detect');
    const detectId = nextId();
    send({
      jsonrpc: '2.0',
      id: detectId,
      method: 'tools/call',
      params: {
        name: 'AHK_File_Detect',
        arguments: { text: `Please check ${TEST_FILE} for errors` },
      },
    });
    const detectResp = await onceMessage();
    const detected = detectResp.result?.content?.[0]?.text || '';
    console.log(`  Detected path: ${detected.includes(TEST_FILE) ? 'YES' : 'NO'}`);

    // Test 2: Set active file
    console.log('\n✓ Test 2: AHK_File_Active (set)');
    const setId = nextId();
    send({
      jsonrpc: '2.0',
      id: setId,
      method: 'tools/call',
      params: {
        name: 'AHK_File_Active',
        arguments: { action: 'set', filePath: TEST_FILE },
      },
    });
    const setResp = await onceMessage();
    console.log(
      `  Set active file: ${setResp.result?.content?.[0]?.text?.includes('Active file set') ? 'SUCCESS' : 'FAILED'}`
    );

    // Test 3: Get active file
    console.log('\n✓ Test 3: AHK_File_Active (get)');
    const getId = nextId();
    send({
      jsonrpc: '2.0',
      id: getId,
      method: 'tools/call',
      params: {
        name: 'AHK_File_Active',
        arguments: { action: 'get' },
      },
    });
    const getResp = await onceMessage();
    const activeFile = getResp.result?.content?.[0]?.text || '';
    console.log(`  Active file matches: ${activeFile.includes(TEST_FILE) ? 'YES' : 'NO'}`);

    // Test 4: View file
    console.log('\n✓ Test 4: AHK_File_View');
    const viewId = nextId();
    send({
      jsonrpc: '2.0',
      id: viewId,
      method: 'tools/call',
      params: {
        name: 'AHK_File_View',
        arguments: { filePath: TEST_FILE },
      },
    });
    const viewResp = await onceMessage();
    const viewContent = viewResp.result?.content?.[0]?.text || '';
    console.log(`  File read: ${viewContent.includes('Hello World') ? 'SUCCESS' : 'FAILED'}`);
    console.log(`  Content length: ${viewContent.length} chars`);

    // Test 5: Diagnostics on file
    console.log('\n✓ Test 5: AHK_Diagnostics');
    const diagId = nextId();
    send({
      jsonrpc: '2.0',
      id: diagId,
      method: 'tools/call',
      params: {
        name: 'AHK_Diagnostics',
        arguments: { filePath: TEST_FILE },
      },
    });
    const diagResp = await onceMessage();
    const diagText = diagResp.result?.content?.[0]?.text || '';
    console.log(`  Analysis completed: ${diagText.length > 0 ? 'YES' : 'NO'}`);

    // Test 6: Recent files
    console.log('\n✓ Test 6: AHK_File_Recent');
    const recentId = nextId();
    send({
      jsonrpc: '2.0',
      id: recentId,
      method: 'tools/call',
      params: {
        name: 'AHK_File_Recent',
        arguments: { scriptDir: join(process.cwd(), 'Tests', 'manual') },
      },
    });
    const recentResp = await onceMessage();
    const recentText = recentResp.result?.content?.[0]?.text || '';
    console.log(`  Recent files found: ${recentText.includes('.ahk') ? 'YES' : 'NO'}`);

    // Shutdown
    console.log('\n✓ Graceful shutdown');
    const shutId = nextId();
    send({ jsonrpc: '2.0', id: shutId, method: 'shutdown', params: {} });
    child.stdin.end();

    console.log('\n=== All file tool tests completed ===\n');
  } finally {
    // Cleanup
    if (existsSync(TEST_FILE)) {
      unlinkSync(TEST_FILE);
      console.log('Cleaned up test file');
    }
  }
}

main().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
