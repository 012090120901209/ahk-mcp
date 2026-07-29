/**
 * Smoke test for the Streamable HTTP transport, both protocol eras.
 *
 * Rewritten for protocol revision 2026-07-28. The previous version asserted
 * `Mcp-Session-Id`, SSE resumability and the `/sse` + `/message` endpoints — all
 * removed by SEP-2567/2575/2596 — so it failed for correct reasons. What is testable
 * now is the dual-era contract `createMcpHandler(factory, { legacy: 'stateless' })`
 * provides:
 *
 *   - `GET /mcp` -> 405, because the GET endpoint was removed
 *   - modern POST with a `_meta` envelope and no handshake
 *   - legacy POST `initialize`, still answered from the same endpoint
 *   - unsupported revision -> UnsupportedProtocolVersionError (-32022)
 *
 * Usage: node scripts/smoke-http-mcp.js
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.AHK_HTTP_SMOKE_PORT || 3101);
const baseUrl = `http://127.0.0.1:${port}`;
const startTimeoutMs = Number(process.env.AHK_HTTP_SMOKE_START_TIMEOUT_MS || 90000);

const PROTOCOL_VERSION_KEY = 'io.modelcontextprotocol/protocolVersion';
const CLIENT_CAPABILITIES_KEY = 'io.modelcontextprotocol/clientCapabilities';
const CLIENT_INFO_KEY = 'io.modelcontextprotocol/clientInfo';
const VERSION = '2026-07-28';
const LEGACY_VERSION = '2025-11-25';

const envelope = (version = VERSION) => ({
  [PROTOCOL_VERSION_KEY]: version,
  [CLIENT_CAPABILITIES_KEY]: {},
  [CLIENT_INFO_KEY]: { name: 'smoke-http-mcp', version: '1.0.0' },
});

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

/** Reads a response body that may be JSON or a single SSE `data:` frame. */
async function readBody(response) {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed.startsWith('event:') && !trimmed.startsWith('data:')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  for (const line of trimmed.split('\n')) {
    if (line.startsWith('data:')) {
      try {
        return JSON.parse(line.slice(5).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

function post(body, headers = {}) {
  return fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const child = spawn(process.execPath, [path.join(repoRoot, 'dist', 'index.js'), '--sse'], {
  cwd: repoRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PORT: String(port), AHK_MCP_HTTP_HOST: '127.0.0.1' },
});

let stderr = '';
child.stderr.on('data', chunk => (stderr += chunk.toString()));

async function waitForServer() {
  const start = Date.now();
  while (Date.now() - start < startTimeoutMs) {
    try {
      // 405 is the readiness signal: the GET endpoint was removed in 2026-07-28, so a
      // listening server rejects `GET /mcp` with `Method not allowed.`
      const response = await fetch(`${baseUrl}/mcp`, { method: 'GET' });
      if (response.status === 405 || response.ok || response.status === 400) return;
    } catch {
      // not up yet
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Server at ${baseUrl} did not become ready within ${startTimeoutMs}ms`);
}

try {
  await waitForServer();

  const getResponse = await fetch(`${baseUrl}/mcp`, { method: 'GET' });
  check(
    'GET /mcp -> 405 (endpoint removed in 2026-07-28)',
    getResponse.status === 405,
    `status=${getResponse.status}`
  );

  // Modern era: no handshake, everything in the per-request envelope.
  const modern = await readBody(
    await post(
      { jsonrpc: '2.0', id: 1, method: 'tools/list', params: { _meta: envelope() } },
      { 'MCP-Protocol-Version': VERSION, 'Mcp-Method': 'tools/list' }
    )
  );
  const tools = modern?.result?.tools;
  check(
    'modern tools/list without initialize',
    Array.isArray(tools) && tools.length > 0,
    Array.isArray(tools) ? `${tools.length} tools` : JSON.stringify(modern?.error)
  );
  check(
    'modern result carries resultType + cache hints',
    modern?.result?.resultType === 'complete' &&
      typeof modern?.result?.ttlMs === 'number' &&
      typeof modern?.result?.cacheScope === 'string',
    `resultType=${modern?.result?.resultType} ttlMs=${modern?.result?.ttlMs} cacheScope=${modern?.result?.cacheScope}`
  );
  check(
    'modern tools/list is deterministically ordered',
    Array.isArray(tools) &&
      tools.every((tool, i) => i === 0 || tools[i - 1].name.localeCompare(tool.name) <= 0),
    Array.isArray(tools) ? `first=${tools[0]?.name} last=${tools[tools.length - 1]?.name}` : ''
  );

  // Legacy era: the same endpoint still answers the initialize handshake.
  const legacy = await readBody(
    await post({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: LEGACY_VERSION,
        capabilities: {},
        clientInfo: { name: 'smoke-http-mcp', version: '1.0.0' },
      },
    })
  );
  check(
    'legacy initialize still served (dual-era)',
    legacy?.result?.protocolVersion === LEGACY_VERSION,
    `protocolVersion=${legacy?.result?.protocolVersion}`
  );
  check(
    'legacy initialize advertises tools capability',
    Boolean(legacy?.result?.capabilities?.tools),
    `capabilities=${JSON.stringify(Object.keys(legacy?.result?.capabilities || {}))}`
  );

  // Unsupported revision must be rejected with the supported list.
  const bad = await readBody(
    await post(
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: { _meta: envelope('1900-01-01') },
      },
      { 'MCP-Protocol-Version': '1900-01-01', 'Mcp-Method': 'tools/list' }
    )
  );
  check(
    'unsupported version -> -32022',
    bad?.error?.code === -32022,
    `code=${bad?.error?.code} supported=${JSON.stringify(bad?.error?.data?.supported)}`
  );

  // The server card is served outside the MCP endpoint.
  const cardResponse = await fetch(`${baseUrl}/.well-known/mcp/server-card.json`);
  const card = cardResponse.ok ? await cardResponse.json() : null;
  check(
    'server card advertises 2026-07-28 and lists 2025-11-25',
    card?.protocolVersion === VERSION && (card?.protocolVersions || []).includes(LEGACY_VERSION),
    `protocolVersion=${card?.protocolVersion} protocolVersions=${JSON.stringify(card?.protocolVersions)}`
  );
} catch (error) {
  check('smoke run completed', false, error.message);
} finally {
  child.kill();
  const failed = results.filter(result => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('\nFAIL: HTTP transport smoke test failed.');
    if (stderr) console.log(`\nServer stderr (tail):\n${stderr.slice(-1200)}`);
  } else {
    console.log('PASS: HTTP transport smoke test completed successfully.');
  }
  process.exit(failed.length ? 1 : 0);
}
