import { spawn } from 'node:child_process';

function nextId() {
  return Math.random().toString(36).slice(2);
}

async function main() {
  console.log('\n=== Testing AHK MCP Server - New Features ===\n');

  const child = spawn('node', ['dist/index.js'], { stdio: ['pipe', 'pipe', 'inherit'] });

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

  // Test 1: Initialize
  console.log('✓ Test 1: Server initialization');
  const initId = nextId();
  send({
    jsonrpc: '2.0',
    id: initId,
    method: 'initialize',
    params: { clientInfo: { name: 'feature-test', version: '1.0.0' } },
  });
  const initResp = await onceMessage();
  console.log('  Server name:', initResp.result?.serverInfo?.name);
  console.log('  Server version:', initResp.result?.serverInfo?.version);

  // Test 2: List tools
  console.log('\n✓ Test 2: Tool registration');
  const listId = nextId();
  send({ jsonrpc: '2.0', id: listId, method: 'tools/list', params: {} });
  const listResp = await onceMessage();
  const tools = listResp.result?.tools?.map(t => t.name) || [];
  console.log(`  Total tools: ${tools.length}`);

  // Check for new tools
  const newTools = ['AHK_Analytics', 'AHK_Memory_Context', 'AHK_Test_Interactive'];
  newTools.forEach(tool => {
    const exists = tools.includes(tool);
    console.log(`  ${exists ? '✓' : '✗'} ${tool}: ${exists ? 'registered' : 'MISSING'}`);
  });

  // Test 3: Analytics tool
  console.log('\n✓ Test 3: AHK_Analytics tool');
  const analyticsId = nextId();
  send({
    jsonrpc: '2.0',
    id: analyticsId,
    method: 'tools/call',
    params: {
      name: 'AHK_Analytics',
      arguments: { action: 'summary' },
    },
  });
  const analyticsResp = await onceMessage();
  if (analyticsResp.result?.content?.[0]?.text) {
    console.log('  Analytics response received');
    const text = analyticsResp.result.content[0].text;
    console.log(`  Response length: ${text.length} chars`);
  }

  // Test 4: Memory Context tool
  console.log('\n✓ Test 4: AHK_Memory_Context tool');
  const memoryId = nextId();
  send({
    jsonrpc: '2.0',
    id: memoryId,
    method: 'tools/call',
    params: {
      name: 'AHK_Memory_Context',
      arguments: { action: 'get_tips' },
    },
  });
  const memoryResp = await onceMessage();
  if (memoryResp.result?.content?.[0]?.text) {
    console.log('  Memory context response received');
    const text = memoryResp.result.content[0].text;
    console.log(`  Response length: ${text.length} chars`);
  }

  // Test 5: Settings tool
  console.log('\n✓ Test 5: AHK_Settings tool');
  const settingsId = nextId();
  send({
    jsonrpc: '2.0',
    id: settingsId,
    method: 'tools/call',
    params: {
      name: 'AHK_Settings',
      arguments: { action: 'get' },
    },
  });
  const settingsResp = await onceMessage();
  if (settingsResp.result?.content?.[0]?.text) {
    console.log('  Settings response received');
    const text = settingsResp.result.content[0].text;
    console.log(`  Response length: ${text.length} chars`);
  }

  // Test 6: List resources
  console.log('\n✓ Test 6: MCP resources');
  const resourcesId = nextId();
  send({ jsonrpc: '2.0', id: resourcesId, method: 'resources/list', params: {} });
  const resourcesResp = await onceMessage();
  const resources = resourcesResp.result?.resources || [];
  console.log(`  Total resources: ${resources.length}`);
  resources.slice(0, 5).forEach(r => {
    console.log(`    - ${r.uri}`);
  });

  // Test 7: List prompts
  console.log('\n✓ Test 7: MCP prompts');
  const promptsId = nextId();
  send({ jsonrpc: '2.0', id: promptsId, method: 'prompts/list', params: {} });
  const promptsResp = await onceMessage();
  const prompts = promptsResp.result?.prompts || [];
  console.log(`  Total prompts: ${prompts.length}`);
  prompts.slice(0, 5).forEach(p => {
    console.log(`    - ${p.name}`);
  });

  // Shutdown
  console.log('\n✓ Test 8: Graceful shutdown');
  const shutId = nextId();
  send({ jsonrpc: '2.0', id: shutId, method: 'shutdown', params: {} });
  child.stdin.end();

  console.log('\n=== All tests completed ===\n');
}

main().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
