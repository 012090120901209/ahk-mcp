import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const serverPath = path.join(repoRoot, 'dist', 'index.js');

const port = Number(process.env.AHK_HTTP_SMOKE_PORT || 3101);
const baseUrl = `http://127.0.0.1:${port}`;
const requestTimeoutMs = 20000;
const serverStartTimeoutMs = 30000;
const sseTimeoutMs = 10000;
const requiredTools = [
  'AHK_Config',
  'AHK_File_Active',
  'AHK_File_List',
  'AHK_File_View',
  'AHK_Diagnostics',
  'AHK_Run',
];
const expectedResourceTemplates = [
  'ahk://templates/file-system-watcher',
  'ahk://templates/clipboard-manager',
  'ahk://templates/cpu-monitor',
  'ahk://templates/hotkey-toggle',
];

function truncate(text, max = 180) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function assertCondition(condition, message, details) {
  if (!condition) {
    const detailText = details ? `\nDetails: ${details}` : '';
    throw new Error(`${message}${detailText}`);
  }
}

function jsonRpcRequest(id, method, params = {}) {
  return {
    jsonrpc: '2.0',
    id,
    method,
    params,
  };
}

function jsonRpcNotification(method, params = {}) {
  return {
    jsonrpc: '2.0',
    method,
    params,
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = requestTimeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return { text: '', json: undefined };
  }

  try {
    return {
      text,
      json: JSON.parse(text),
    };
  } catch {
    return { text, json: undefined };
  }
}

async function postJson(url, payload, headers = {}) {
  const routingHeaders = payload?.method
    ? {
        'Mcp-Method': payload.method,
        ...((payload.method === 'tools/call' || payload.method === 'prompts/get') &&
        typeof payload.params?.name === 'string'
          ? { 'Mcp-Name': payload.params.name }
          : {}),
        ...(payload.method === 'resources/read' && typeof payload.params?.uri === 'string'
          ? { 'Mcp-Name': payload.params.uri }
          : {}),
      }
    : {};
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': '2025-11-25',
        ...routingHeaders,
        ...headers,
      },
      body: JSON.stringify(payload),
    },
    requestTimeoutMs
  );

  const body = await readJsonResponse(response);
  return { response, ...body };
}

function assertTemplateList(json, contextLabel) {
  const resourceTemplates = json?.result?.resourceTemplates;
  assertCondition(
    Array.isArray(resourceTemplates),
    `${contextLabel} resources/templates/list missing resourceTemplates[]`,
    truncate(JSON.stringify(json), 1200)
  );

  const uriTemplates = resourceTemplates.map(template => template.uriTemplate);
  for (const uriTemplate of expectedResourceTemplates) {
    assertCondition(
      uriTemplates.includes(uriTemplate),
      `${contextLabel} resources/templates/list missing expected template: ${uriTemplate}`,
      truncate(JSON.stringify(uriTemplates), 1200)
    );
  }
}

async function waitForServer() {
  const start = Date.now();

  while (Date.now() - start < serverStartTimeoutMs) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/mcp`, { method: 'GET' }, 1500);
      // 405 is the correct readiness signal under protocol revision 2026-07-28:
      // the HTTP GET endpoint was removed (SEP-2575), so a listening server answers
      // `GET /mcp` with `405 Method not allowed.` rather than opening an SSE stream.
      if (response.ok || response.status === 400 || response.status === 405) {
        return;
      }
    } catch {
      // Server not ready yet.
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error(`Server at ${baseUrl} did not become ready within ${serverStartTimeoutMs}ms`);
}

function parseSseEvents(buffer) {
  const events = [];
  let remaining = buffer;

  while (true) {
    const separatorIndex = remaining.indexOf('\n\n');
    if (separatorIndex === -1) {
      break;
    }

    const rawEvent = remaining.slice(0, separatorIndex).replace(/\r/g, '');
    remaining = remaining.slice(separatorIndex + 2);

    if (!rawEvent.trim()) {
      continue;
    }

    const dataLines = [];
    let eventName = 'message';
    for (const line of rawEvent.split('\n')) {
      if (line.startsWith('event:')) {
        eventName = line.slice('event:'.length).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice('data:'.length).trimStart());
      }
    }

    events.push({
      event: eventName,
      data: dataLines.join('\n'),
      raw: rawEvent,
    });
  }

  return { events, remaining };
}

async function waitForSseEvent(reader, state, predicate, timeoutMs = sseTimeoutMs) {
  const decoder = state.decoder;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    while (state.events.length > 0) {
      const event = state.events.shift();
      if (predicate(event)) {
        return event;
      }
    }

    const readPromise = reader.read();
    let timerId;
    const timeoutPromise = new Promise((_, reject) => {
      const remainingMs = Math.max(deadline - Date.now(), 1);
      timerId = setTimeout(() => reject(new Error('Timed out waiting for SSE event')), remainingMs);
    });

    let result;
    try {
      result = await Promise.race([readPromise, timeoutPromise]);
    } finally {
      clearTimeout(timerId);
    }

    if (result.done) {
      break;
    }

    state.buffer += decoder.decode(result.value, { stream: true });
    const parsed = parseSseEvents(state.buffer);
    state.buffer = parsed.remaining;
    state.events.push(...parsed.events);
  }

  throw new Error('Timed out waiting for expected SSE event');
}

async function waitForJsonRpcEvent(reader, state, requestId, timeoutMs = sseTimeoutMs) {
  const event = await waitForSseEvent(
    reader,
    state,
    candidate => {
      if (!candidate.data || !candidate.data.trim().startsWith('{')) {
        return false;
      }

      try {
        const parsed = JSON.parse(candidate.data);
        return parsed.id === requestId;
      } catch {
        return false;
      }
    },
    timeoutMs
  );

  return JSON.parse(event.data);
}

async function runStreamableSmoke(stepResults) {
  const serverCardResponse = await fetchWithTimeout(`${baseUrl}/.well-known/mcp/server-card.json`);
  const serverCard = await readJsonResponse(serverCardResponse);
  assertCondition(serverCardResponse.ok, 'Server card endpoint failed', serverCard.text);
  assertCondition(
    serverCardResponse.headers.get('access-control-allow-origin') === '*',
    'Server card endpoint missing public CORS header'
  );
  assertCondition(
    serverCard.json?.transport?.endpoint === '/mcp',
    'Server card missing Streamable HTTP endpoint',
    truncate(serverCard.text, 1200)
  );
  stepResults.push({
    step: '0a',
    label: 'Server card discovery',
    status: 'SUCCESS',
    preview: truncate(serverCard.json?.serverInfo?.name),
  });

  const routingMismatch = await postJson(
    `${baseUrl}/mcp`,
    jsonRpcRequest(0, 'initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'routing-mismatch', version: '1.0.0' },
    }),
    { 'Mcp-Method': 'tools/list' }
  );
  assertCondition(
    routingMismatch.response.status === 400 && routingMismatch.json?.error?.code === -32001,
    'Routing header mismatch should return HTTP 400 / HeaderMismatch',
    truncate(routingMismatch.text, 1200)
  );

  const rejectedOrigin = await postJson(
    `${baseUrl}/mcp`,
    jsonRpcRequest(0, 'initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'untrusted-origin', version: '1.0.0' },
    }),
    { Origin: 'https://untrusted.example' }
  );
  assertCondition(
    rejectedOrigin.response.status === 403,
    'Streamable HTTP should reject an untrusted Origin with HTTP 403',
    truncate(rejectedOrigin.text, 1200)
  );

  const initializePayload = jsonRpcRequest(1, 'initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: { name: 'smoke-http', version: '1.0.0' },
  });

  const init = await postJson(`${baseUrl}/mcp`, initializePayload);
  assertCondition(init.response.ok, 'Streamable initialize failed', truncate(init.text, 1200));

  const sessionId = init.response.headers.get('mcp-session-id');
  assertCondition(sessionId, 'Streamable initialize missing mcp-session-id header');
  assertCondition(init.json?.result?.serverInfo, 'Streamable initialize missing serverInfo');
  assertCondition(
    init.json?.result?.capabilities?.extensions?.['io.modelcontextprotocol/ui'],
    'Streamable initialize missing MCP Apps extension capability'
  );

  stepResults.push({
    step: '1a',
    label: 'Streamable initialize',
    status: 'SUCCESS',
    preview: truncate(`session=${sessionId}`),
  });

  const initialized = await postJson(
    `${baseUrl}/mcp`,
    jsonRpcNotification('notifications/initialized', {}),
    { 'mcp-session-id': sessionId }
  );
  assertCondition(
    initialized.response.ok,
    'Streamable notifications/initialized failed',
    truncate(initialized.text, 1200)
  );

  const tools = await postJson(`${baseUrl}/mcp`, jsonRpcRequest(2, 'tools/list', {}), {
    'mcp-session-id': sessionId,
  });
  assertCondition(tools.response.ok, 'Streamable tools/list failed', truncate(tools.text, 1200));
  assertCondition(
    tools.json?.result?.ttlMs > 0 && tools.json?.result?.cacheScope === 'private',
    'Streamable tools/list missing cache hints',
    truncate(tools.text, 1200)
  );

  const toolNames = (tools.json?.result?.tools || []).map(tool => tool.name);
  for (const name of requiredTools) {
    assertCondition(
      toolNames.includes(name),
      `Streamable tools/list missing required tool: ${name}`,
      truncate(JSON.stringify(toolNames), 1200)
    );
  }

  const runTool = tools.json.result.tools.find(tool => tool.name === 'AHK_Run');
  const viewTool = tools.json.result.tools.find(tool => tool.name === 'AHK_File_View');
  const analyticsTool = tools.json.result.tools.find(tool => tool.name === 'AHK_Analytics');
  assertCondition(runTool?.title, 'AHK_Run missing display title');
  assertCondition(
    runTool?.annotations?.readOnlyHint === false,
    'AHK_Run annotations are inaccurate'
  );
  assertCondition(
    runTool?.execution?.taskSupport === 'optional',
    'AHK_Run should advertise optional task support'
  );
  assertCondition(
    viewTool?.execution?.taskSupport === 'forbidden',
    'AHK_File_View should forbid task-augmented execution'
  );
  assertCondition(
    analyticsTool?._meta?.ui === undefined,
    'AHK_Analytics should not advertise UI metadata without client negotiation'
  );

  stepResults.push({
    step: '1b',
    label: 'Streamable tools/list',
    status: 'SUCCESS',
    preview: truncate(toolNames.slice(0, 8).join(', ')),
  });

  const templates = await postJson(
    `${baseUrl}/mcp`,
    jsonRpcRequest(21, 'resources/templates/list', {}),
    { 'mcp-session-id': sessionId }
  );
  assertCondition(
    templates.response.ok,
    'Streamable resources/templates/list failed',
    truncate(templates.text, 1200)
  );
  assertTemplateList(templates.json, 'Streamable');

  stepResults.push({
    step: '1c',
    label: 'Streamable resources/templates/list',
    status: 'SUCCESS',
    preview: truncate(
      templates.json.result.resourceTemplates.map(template => template.uriTemplate).join(', ')
    ),
  });

  const missingSession = await postJson(`${baseUrl}/mcp`, jsonRpcRequest(3, 'tools/list', {}));
  assertCondition(
    missingSession.response.status === 400,
    'Streamable missing-session request should return HTTP 400',
    truncate(missingSession.text, 1200)
  );
  assertCondition(
    missingSession.json?.error?.data?.hint ===
      'Send initialize via POST /mcp without mcp-session-id first',
    'Streamable missing-session error missing expected hint',
    truncate(missingSession.text, 1200)
  );

  stepResults.push({
    step: '1d',
    label: 'Streamable missing session',
    status: 'EXPECTED_FAILURE_OK',
    preview: truncate(missingSession.json?.error?.message || missingSession.text),
  });
}

async function runLegacySseSmoke(stepResults) {
  const sseController = new AbortController();
  const sseResponse = await fetch(`${baseUrl}/sse`, {
    headers: { Accept: 'text/event-stream' },
    signal: sseController.signal,
  });

  assertCondition(sseResponse.ok, 'Legacy SSE connection failed');
  assertCondition(
    (sseResponse.headers.get('content-type') || '').includes('text/event-stream'),
    'Legacy SSE endpoint did not return an event stream'
  );
  assertCondition(sseResponse.body, 'Legacy SSE response missing body');

  const reader = sseResponse.body.getReader();
  const state = {
    buffer: '',
    decoder: new TextDecoder(),
    events: [],
  };

  try {
    const endpointEvent = await waitForSseEvent(reader, state, event =>
      /\/message\?sessionId=/.test(event.data)
    );

    const endpointMatch = endpointEvent.data.match(/\/message\?sessionId=([a-zA-Z0-9-]+)/);
    assertCondition(endpointMatch, 'Legacy SSE handshake missing sessionId', endpointEvent.raw);

    const sessionId = endpointMatch[1];
    const messageUrl = `${baseUrl}/message?sessionId=${sessionId}`;

    stepResults.push({
      step: '2a',
      label: 'Legacy SSE connect',
      status: 'SUCCESS',
      preview: truncate(endpointEvent.data),
    });

    const initPost = await postJson(
      messageUrl,
      jsonRpcRequest(11, 'initialize', {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'smoke-http-sse', version: '1.0.0' },
      })
    );
    assertCondition(
      initPost.response.ok,
      'Legacy SSE initialize POST failed',
      truncate(initPost.text, 1200)
    );

    const initEvent = await waitForJsonRpcEvent(reader, state, 11);
    assertCondition(initEvent.result?.serverInfo, 'Legacy SSE initialize missing serverInfo');

    const initializedPost = await postJson(
      messageUrl,
      jsonRpcNotification('notifications/initialized', {})
    );
    assertCondition(
      initializedPost.response.ok,
      'Legacy SSE notifications/initialized failed',
      truncate(initializedPost.text, 1200)
    );

    const toolsPost = await postJson(messageUrl, jsonRpcRequest(12, 'tools/list', {}));
    assertCondition(
      toolsPost.response.ok,
      'Legacy SSE tools/list POST failed',
      truncate(toolsPost.text, 1200)
    );

    const toolsEvent = await waitForJsonRpcEvent(reader, state, 12);
    const toolNames = (toolsEvent.result?.tools || []).map(tool => tool.name);
    for (const name of requiredTools) {
      assertCondition(
        toolNames.includes(name),
        `Legacy SSE tools/list missing required tool: ${name}`,
        truncate(JSON.stringify(toolNames), 1200)
      );
    }

    stepResults.push({
      step: '2b',
      label: 'Legacy SSE tools/list',
      status: 'SUCCESS',
      preview: truncate(toolNames.slice(0, 8).join(', ')),
    });

    const templatesPost = await postJson(
      messageUrl,
      jsonRpcRequest(13, 'resources/templates/list', {})
    );
    assertCondition(
      templatesPost.response.ok,
      'Legacy SSE resources/templates/list POST failed',
      truncate(templatesPost.text, 1200)
    );

    const templatesEvent = await waitForJsonRpcEvent(reader, state, 13);
    assertTemplateList({ result: templatesEvent.result }, 'Legacy SSE');

    stepResults.push({
      step: '2c',
      label: 'Legacy SSE resources/templates/list',
      status: 'SUCCESS',
      preview: truncate(
        templatesEvent.result.resourceTemplates.map(template => template.uriTemplate).join(', ')
      ),
    });
  } finally {
    sseController.abort();
    reader.releaseLock();
  }
}

async function main() {
  if (!existsSync(serverPath)) {
    throw new Error(`Built server not found at ${serverPath}. Run "npm run build" first.`);
  }

  const child = spawn(process.execPath, [serverPath, '--sse'], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'test',
      PORT: String(port),
      AHK_MCP_LOG_LEVEL: process.env.AHK_MCP_LOG_LEVEL || 'warn',
      AHK_MCP_LEGACY_SSE: '1',
    },
  });

  const stderrLines = [];
  const stdoutLines = [];
  child.stdout.on('data', chunk => stdoutLines.push(chunk.toString()));
  child.stderr.on('data', chunk => stderrLines.push(chunk.toString()));

  const stepResults = [];

  try {
    await waitForServer();
    await runStreamableSmoke(stepResults);
    await runLegacySseSmoke(stepResults);

    console.log('\nHTTP MCP Smoke Test Summary');
    for (const result of stepResults) {
      console.log(`${result.step}. ${result.label}: ${result.status}`);
      console.log(`   ${result.preview}`);
    }
    console.log('\nPASS: HTTP transport smoke test completed successfully.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('\nFAIL: HTTP transport smoke test failed.');
    console.error(message);

    if (stderrLines.length > 0) {
      console.error('\nServer stderr (last 25 lines):');
      stderrLines
        .join('')
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(-25)
        .forEach(line => console.error(line));
    }

    if (stdoutLines.length > 0) {
      console.error('\nServer stdout (last 25 lines):');
      stdoutLines
        .join('')
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(-25)
        .forEach(line => console.error(line));
    }

    process.exitCode = 1;
  } finally {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`FATAL: ${message}`);
  process.exit(1);
});
