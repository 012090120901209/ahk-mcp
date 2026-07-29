import type { Server } from '@modelcontextprotocol/server';

export const MCP_APPS_EXTENSION_ID = 'io.modelcontextprotocol/ui';
export const MCP_APPS_PROTOCOL_VERSION = '2026-01-26';
export const ANALYTICS_APP_URI = 'ui://ahk/analytics-dashboard';
export const MCP_APP_MIME_TYPE = 'text/html;profile=mcp-app';

interface McpAppsCapability {
  mimeTypes?: unknown;
}

export function clientSupportsMcpApps(server: Server): boolean {
  const extension = server.getClientCapabilities()?.extensions?.[MCP_APPS_EXTENSION_ID] as
    | McpAppsCapability
    | undefined;
  return Array.isArray(extension?.mimeTypes) && extension.mimeTypes.includes(MCP_APP_MIME_TYPE);
}

export function createAnalyticsAppHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>AutoHotkey MCP Analytics</title>
  <style>
    :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
    body { margin: 0; padding: 16px; background: Canvas; color: CanvasText; }
    header { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    h1 { font-size: 1.1rem; margin: 0 0 12px; }
    #status { opacity: .7; font-size: .8rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(130px,1fr)); gap: 10px; }
    .card { border: 1px solid color-mix(in srgb, CanvasText 20%, transparent); border-radius: 10px; padding: 12px; }
    .label { opacity: .65; font-size: .75rem; }
    .value { font-size: 1.35rem; font-weight: 650; margin-top: 4px; overflow-wrap: anywhere; }
    section { margin-top: 14px; }
    ol, ul { margin: 7px 0 0; padding-left: 22px; }
    .empty { opacity: .65; }
  </style>
</head>
<body>
  <header><h1>AutoHotkey MCP Analytics</h1><span id="status">Waiting for tool result</span></header>
  <main id="content"><p class="empty">Run AHK_Analytics with action "summary" to populate this view.</p></main>
  <script>
    const status = document.getElementById('status');
    const content = document.getElementById('content');
    const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
    const render = data => {
      if (!data || data.kind !== 'summary') {
        status.textContent = data?.kind ? 'Showing ' + data.kind : 'No structured summary';
        content.innerHTML = '<p class="empty">This view is optimized for the summary action. The text result remains available in the host.</p>';
        return;
      }
      const cards = [
        ['Total calls', data.totalCalls],
        ['Unique tools', data.uniqueTools],
        ['Success rate', Number(data.overallSuccessRate || 0).toFixed(1) + '%'],
        ['Average duration', Number(data.averageDuration || 0).toFixed(1) + ' ms']
      ];
      const top = Array.isArray(data.topTools) ? data.topTools : [];
      const problems = Array.isArray(data.problematicTools) ? data.problematicTools : [];
      content.innerHTML =
        '<div class="grid">' + cards.map(([label, value]) =>
          '<div class="card"><div class="label">' + escapeHtml(label) + '</div><div class="value">' + escapeHtml(value) + '</div></div>'
        ).join('') + '</div>' +
        '<section><strong>Most used</strong>' +
          (top.length ? '<ol>' + top.map(item => '<li>' + escapeHtml(item.toolName) + ': ' + escapeHtml(item.calls) + '</li>').join('') + '</ol>' : '<p class="empty">No calls recorded.</p>') +
        '</section><section><strong>High failure rate</strong>' +
          (problems.length ? '<ul>' + problems.map(item => '<li>' + escapeHtml(item.toolName) + ': ' + Number(item.failureRate || 0).toFixed(1) + '%</li>').join('') + '</ul>' : '<p class="empty">No problematic tools detected.</p>') +
        '</section>';
      status.textContent = 'Updated';
    };
    window.addEventListener('message', event => {
      if (event.source !== parent) return;
      const message = event.data;
      if (!message || message.jsonrpc !== '2.0') return;
      if (message.method === 'ui/notifications/tool-result') {
        render(message.params?.structuredContent);
      }
      if (message.id === 'ahk-ui-init' && message.result) {
        parent.postMessage({ jsonrpc: '2.0', method: 'ui/notifications/initialized', params: {} }, '*');
        status.textContent = 'Connected';
      }
    });
    parent.postMessage({
      jsonrpc: '2.0',
      id: 'ahk-ui-init',
      method: 'ui/initialize',
      params: {
        protocolVersion: '${MCP_APPS_PROTOCOL_VERSION}',
        appInfo: { name: 'ahk-analytics-dashboard', version: '1.0.0' },
        capabilities: {}
      }
    }, '*');
  </script>
</body>
</html>`;
}
