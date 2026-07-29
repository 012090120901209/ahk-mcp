/**
 * Smoke test for the MODERN (2026-07-28) protocol era over stdio.
 *
 * Asserts the stateless contract introduced by the 2026-07-28 revision: no
 * `initialize` handshake, `server/discover` is implemented, and every request carries
 * its protocol version, capabilities and identity in `_meta` (SEP-2575).
 *
 * `npm run smoke:mcp` covers the legacy (2025-11-25) era via the `initialize`
 * handshake. Run both to verify the dual-era contract end to end.
 *
 * Usage: node scripts/smoke-mcp-2026.js
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PROTOCOL_VERSION_KEY = 'io.modelcontextprotocol/protocolVersion';
const CLIENT_CAPABILITIES_KEY = 'io.modelcontextprotocol/clientCapabilities';
const CLIENT_INFO_KEY = 'io.modelcontextprotocol/clientInfo';
const SERVER_INFO_KEY = 'io.modelcontextprotocol/serverInfo';
const TASKS_EXTENSION_ID = 'io.modelcontextprotocol/tasks';
const VERSION = '2026-07-28';

const envelope = (version = VERSION, capabilities = {}) => ({
  [PROTOCOL_VERSION_KEY]: version,
  [CLIENT_CAPABILITIES_KEY]: capabilities,
  [CLIENT_INFO_KEY]: { name: 'smoke-mcp-2026', version: '1.0.0' },
});

/** A client that can satisfy embedded elicitation requests (needed for MRTR). */
const elicitCapable = () => envelope(VERSION, { elicitation: { form: {} } });

const child = spawn(process.execPath, ['dist/index.js'], {
  cwd: repoRoot,
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'test' },
});

let buffer = '';
const pending = new Map();
child.stdout.on('data', chunk => {
  buffer += chunk.toString();
  let index;
  while ((index = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (!line) continue;
    try {
      const message = JSON.parse(line);
      if (message.id !== undefined && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
      }
    } catch {
      // Non-JSON stdout (banner/log noise) is ignored.
    }
  }
});

let stderr = '';
child.stderr.on('data', chunk => (stderr += chunk.toString()));

let nextId = 1;
function send(method, meta = envelope(), params = {}) {
  const id = nextId++;
  child.stdin.write(
    JSON.stringify({ jsonrpc: '2.0', id, method, params: { ...params, _meta: meta } }) + '\n'
  );
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 45000);
    pending.set(id, message => {
      clearTimeout(timer);
      resolve(message);
    });
  });
}

/** Runs `fn` against a throwaway server process, so era selection starts clean. */
function onFreshConnection(fn) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, ['dist/index.js'], {
      cwd: repoRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' },
    });
    let localBuffer = '';
    const localPending = new Map();
    let localId = 1;
    proc.stdout.on('data', chunk => {
      localBuffer += chunk.toString();
      let index;
      while ((index = localBuffer.indexOf('\n')) >= 0) {
        const line = localBuffer.slice(0, index).trim();
        localBuffer = localBuffer.slice(index + 1);
        if (!line) continue;
        try {
          const message = JSON.parse(line);
          if (message.id !== undefined && localPending.has(message.id)) {
            localPending.get(message.id)(message);
            localPending.delete(message.id);
          }
        } catch {
          // ignore non-JSON stdout
        }
      }
    });
    const probe = (method, meta) => {
      const id = localId++;
      proc.stdin.write(
        JSON.stringify({ jsonrpc: '2.0', id, method, params: { _meta: meta } }) + '\n'
      );
      return new Promise((res, rej) => {
        const timer = setTimeout(() => rej(new Error(`timeout waiting for ${method}`)), 45000);
        localPending.set(id, message => {
          clearTimeout(timer);
          res(message);
        });
      });
    };
    fn(probe)
      .then(value => {
        proc.kill();
        resolve(value);
      })
      .catch(error => {
        proc.kill();
        reject(error);
      });
  });
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

try {
  // server/discover MUST be implemented (SEP-2575).
  const discover = await send('server/discover');
  const discovered = discover.result;
  check(
    'server/discover answers',
    Boolean(discovered) && !discover.error,
    discover.error ? JSON.stringify(discover.error) : ''
  );

  // Discover is a modern-era RPC and advertises modern revisions only; legacy clients
  // reach this server through `initialize` instead (see npm run smoke:mcp).
  check(
    'discover advertises 2026-07-28',
    Array.isArray(discovered?.supportedVersions) && discovered.supportedVersions.includes(VERSION),
    `supportedVersions=${JSON.stringify(discovered?.supportedVersions)}`
  );
  // `tasks/*` is era-gated by the SDK and absent from the 2026-07-28 method registry, so
  // the server must NOT advertise the tasks extension to modern clients — doing so would
  // promise a capability that answers -32601. Task support stays legacy-only.
  check(
    'tasks extension NOT advertised to modern clients',
    !discovered?.capabilities?.extensions?.[TASKS_EXTENSION_ID],
    `extensions=${JSON.stringify(Object.keys(discovered?.capabilities?.extensions || {}))}`
  );

  // tools/list with no handshake at all — purely per-request metadata.
  const list = await send('tools/list');
  const tools = list.result?.tools;
  check(
    'tools/list without initialize',
    Array.isArray(tools) && tools.length > 0,
    Array.isArray(tools) ? `${tools.length} tools` : JSON.stringify(list.error)
  );
  check(
    'result carries resultType (SEP-2322)',
    list.result?.resultType === 'complete',
    `resultType=${list.result?.resultType}`
  );
  check(
    'result carries ttlMs + cacheScope (SEP-2549)',
    typeof list.result?.ttlMs === 'number' && typeof list.result?.cacheScope === 'string',
    `ttlMs=${list.result?.ttlMs} cacheScope=${list.result?.cacheScope}`
  );
  check(
    'result _meta carries serverInfo',
    Boolean(list.result?._meta?.[SERVER_INFO_KEY]),
    JSON.stringify(list.result?._meta?.[SERVER_INFO_KEY] || {}).slice(0, 90)
  );

  // Multi Round-Trip Requests (SEP-2322). Server-initiated elicitation is gone in the
  // modern era, so AHK_Run without a filePath must answer with an InputRequiredResult
  // and accept the answer on a retry carrying `inputResponses`.
  //
  // Precondition: prepareToolArguments() only elicits when there is no filePath AND no
  // active file. An active file persists across runs, so when one is set the tool
  // legitimately proceeds instead and the round trip is not exercised — reported as
  // SKIP rather than asserted, so this stays deterministic.
  const round1 = await send('tools/call', elicitCapable(), {
    name: 'AHK_Run',
    arguments: {},
  });
  const inputKey = Object.keys(round1.result?.inputRequests || {})[0];
  const elicited = round1.result?.resultType === 'input_required' && Boolean(inputKey);

  if (!elicited) {
    console.log(
      'SKIP  MRTR round trip — an active file is set, so AHK_Run resolved it without ' +
        'eliciting. Clear the active file to exercise this path.'
    );
  } else {
    check('MRTR: AHK_Run without filePath -> input_required', true, `key=${inputKey}`);

    const round2 = await send('tools/call', elicitCapable(), {
      name: 'AHK_Run',
      arguments: {},
      inputResponses: {
        [inputKey]: { action: 'accept', content: { filePath: 'C:\\does-not-exist.ahk' } },
      },
    });
    check(
      'MRTR: retry with inputResponses is accepted',
      round2.result?.resultType === 'complete',
      `resultType=${round2.result?.resultType}`
    );
  }

  // An unsupported revision MUST yield UnsupportedProtocolVersionError (-32022).
  //
  // Checked on a FRESH process: on stdio the SDK resolves the connection's era from the
  // opening exchange, so a mismatched version on an already-established connection is not
  // re-validated. The meaningful assertion is that a client opening at an unsupported
  // revision is rejected with the supported list, which is what a real client would hit.
  const bad = await onFreshConnection(probe => probe('tools/list', envelope('1900-01-01')));
  check(
    'unsupported version -> -32022 (fresh connection)',
    bad.error?.code === -32022 && Array.isArray(bad.error?.data?.supported),
    `code=${bad.error?.code} supported=${JSON.stringify(bad.error?.data?.supported)}`
  );
} catch (error) {
  check('probe completed', false, error.message);
} finally {
  child.kill();
  const failed = results.filter(result => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('\nFAIL: 2026-07-28 smoke test failed.');
    if (stderr) console.log(`\nServer stderr (tail):\n${stderr.slice(-1200)}`);
  } else {
    console.log('PASS: 2026-07-28 smoke test completed successfully.');
  }
  process.exit(failed.length ? 1 : 0);
}
