#!/usr/bin/env node
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// SSE endpoint for ChatGPT MCP integration
app.get('/sse', (req, res) => {
  console.log('SSE connection requested');

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send MCP initialization
  const initMessage = {
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {}
  };

  res.write(`data: ${JSON.stringify(initMessage)}\n\n`);

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write('data: {"jsonrpc":"2.0","method":"ping"}\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    console.log('SSE connection closed');
  });
});


// Handle POST to root for MCP messages
app.post('/', (req, res) => {
  console.log('MCP root POST received:', req.body);
  handleMCPMessage(req, res);
});

// Handle MCP messages via POST
app.post('/message', (req, res) => {
  console.log('MCP message received:', req.body);
  handleMCPMessage(req, res);
});

function handleMCPMessage(req, res) {
  const message = req.body;

  if (message.method === 'initialize') {
    res.json({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: message.params.protocolVersion || '2025-03-26',
        capabilities: {
          tools: {},
          prompts: {},
          resources: {}
        },
        serverInfo: {
          name: 'AutoHotkey v2 MCP Server',
          version: '2.1.0'
        }
      }
    });
  } else if (message.method === 'tools/list') {
    res.json({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: [
          {
            name: 'search',
            description: 'Search AutoHotkey v2 documentation and code examples',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for AutoHotkey documentation'
                }
              },
              required: ['query']
            }
          },
          {
            name: 'fetch',
            description: 'Fetch detailed AutoHotkey documentation for a specific item',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Unique identifier for the AutoHotkey documentation item'
                }
              },
              required: ['id']
            }
          },
          {
            name: 'AHK_Analyze',
            description: 'Analyze AutoHotkey v2 code for syntax, patterns, and best practices',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'AutoHotkey v2 code to analyze'
                }
              },
              required: ['code']
            }
          }
        ]
      }
    });
  } else if (message.method === 'tools/call' && message.params.name === 'search') {
    const query = message.params.arguments.query;

    // Mock AutoHotkey documentation search results
    const mockResults = [
      {
        id: 'msgbox',
        title: 'MsgBox - AutoHotkey v2 Documentation',
        url: 'https://www.autohotkey.com/docs/v2/lib/MsgBox.htm'
      },
      {
        id: 'hotkeys',
        title: 'Hotkeys - AutoHotkey v2 Documentation',
        url: 'https://www.autohotkey.com/docs/v2/Hotkeys.htm'
      },
      {
        id: 'gui',
        title: 'Gui Object - AutoHotkey v2 Documentation',
        url: 'https://www.autohotkey.com/docs/v2/lib/Gui.htm'
      }
    ].filter(result =>
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.id.toLowerCase().includes(query.toLowerCase())
    );

    res.json({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ results: mockResults })
          }
        ]
      }
    });

  } else if (message.method === 'tools/call' && message.params.name === 'fetch') {
    const id = message.params.arguments.id;

    // Mock AutoHotkey documentation content
    const mockDocs = {
      'msgbox': {
        id: 'msgbox',
        title: 'MsgBox - AutoHotkey v2 Documentation',
        text: 'Displays a modal message box with title, text, and buttons.\n\nSyntax: MsgBox([Text, Title, Options])\n\nParameters:\n- Text: The message to display\n- Title: The title of the message box\n- Options: Button and icon options\n\nExample:\nMsgBox("Hello World", "My App")\nMsgBox("Error occurred!", "Error", 48)',
        url: 'https://www.autohotkey.com/docs/v2/lib/MsgBox.htm',
        metadata: { source: 'autohotkey_docs', version: 'v2' }
      },
      'hotkeys': {
        id: 'hotkeys',
        title: 'Hotkeys - AutoHotkey v2 Documentation',
        text: 'Hotkeys are key combinations that trigger actions in AutoHotkey.\n\nSyntax: Key::Action\n\nExamples:\nF1::MsgBox("F1 pressed")\nCtrl+j::Send("Hello")\n^j::Send("Hello")  ; Same as above\n\nModifiers:\n^ = Ctrl\n! = Alt\n+ = Shift\n# = Win key',
        url: 'https://www.autohotkey.com/docs/v2/Hotkeys.htm',
        metadata: { source: 'autohotkey_docs', version: 'v2' }
      },
      'gui': {
        id: 'gui',
        title: 'Gui Object - AutoHotkey v2 Documentation',
        text: 'Creates and manages graphical user interfaces in AutoHotkey v2.\n\nSyntax: MyGui := Gui([Options, Title])\n\nMethods:\n- Add(): Add controls\n- Show(): Display the GUI\n- Close(): Close the GUI\n\nExample:\nMyGui := Gui("+Resize", "My App")\nMyGui.Add("Text",, "Hello World")\nMyGui.Add("Button", "w100", "OK")\nMyGui.Show()',
        url: 'https://www.autohotkey.com/docs/v2/lib/Gui.htm',
        metadata: { source: 'autohotkey_docs', version: 'v2' }
      }
    };

    const doc = mockDocs[id] || {
      id: id,
      title: 'AutoHotkey Documentation Item',
      text: 'Documentation not found for this item.',
      url: `https://www.autohotkey.com/docs/v2/search.htm?q=${id}`,
      metadata: { source: 'autohotkey_docs', version: 'v2' }
    };

    res.json({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify(doc)
          }
        ]
      }
    });

  } else if (message.method === 'tools/call' && message.params.name === 'AHK_Analyze') {
    const code = message.params.arguments.code;
    const analysis = {
      lineCount: code.split('\n').length,
      hasHotkeys: /::/.test(code),
      hasGUI: /Gui\(/.test(code),
      hasLoops: /(Loop|For|While)/i.test(code),
      usesV2Syntax: /#Requires\s+AutoHotkey\s+v2/i.test(code)
    };

    res.json({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        content: [
          {
            type: 'text',
            text: `AutoHotkey Code Analysis:\n\nLines: ${analysis.lineCount}\nHotkeys: ${analysis.hasHotkeys ? 'Yes' : 'No'}\nGUI: ${analysis.hasGUI ? 'Yes' : 'No'}\nLoops: ${analysis.hasLoops ? 'Yes' : 'No'}\nv2 Syntax: ${analysis.usesV2Syntax ? 'Yes' : 'No'}\n\nSuggestions:\n${analysis.usesV2Syntax ? '✓ Uses AutoHotkey v2 syntax' : '⚠ Consider adding #Requires AutoHotkey v2.0'}\n${analysis.hasLoops && !analysis.hasGUI ? '💡 Consider organizing complex logic into functions' : ''}`
          }
        ]
      }
    });
  } else {
    res.json({
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: -32601,
        message: `Method not found: ${message.method}`
      }
    });
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'AutoHotkey MCP Server',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint with monitoring dashboard
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>AutoHotkey MCP Server Dashboard</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; background: #28a745; font-weight: bold; }
        .endpoints { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .endpoint { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #007acc; }
        .logs { background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 6px; font-family: 'Consolas', monospace; height: 400px; overflow-y: auto; }
        .refresh { background: #007acc; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-bottom: 20px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat { background: #e9ecef; padding: 15px; border-radius: 6px; text-align: center; flex: 1; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AutoHotkey v2 MCP Server</h1>
            <p>ChatGPT Integration Dashboard</p>
            <span class="status">ONLINE</span>
        </div>

        <div class="stats">
            <div class="stat">
                <h3>Server Version</h3>
                <p>2.1.0</p>
            </div>
            <div class="stat">
                <h3>Protocol</h3>
                <p>MCP 2025-03-26</p>
            </div>
            <div class="stat">
                <h3>Transport</h3>
                <p>SSE + HTTP</p>
            </div>
        </div>

        <div class="endpoints">
            <div class="endpoint">
                <h3>SSE Endpoint</h3>
                <p><code>/sse</code></p>
                <p>ChatGPT connects here for real-time communication</p>
            </div>
            <div class="endpoint">
                <h3>Message Endpoint</h3>
                <p><code>/message</code> & <code>/</code></p>
                <p>Receives MCP protocol messages</p>
            </div>
            <div class="endpoint">
                <h3>Tools Available</h3>
                <p><code>search</code>, <code>fetch</code>, <code>AHK_Analyze</code></p>
                <p>Search docs, fetch details, analyze code</p>
            </div>
            <div class="endpoint">
                <h3>Health Check</h3>
                <p><code>/health</code></p>
                <p>Server status monitoring</p>
            </div>
        </div>

        <h3>Real-time Activity Monitor</h3>
        <button class="refresh" onclick="location.reload()">Refresh Logs</button>
        <div class="logs" id="logs">
            <div style="color: #569cd6;">[INFO] Server running on port 3000</div>
            <div style="color: #4ec9b0;">[SSE] Endpoint ready for ChatGPT connections</div>
            <div style="color: #dcdcaa;">[MCP] AutoHotkey analysis tool loaded</div>
            <div style="color: #9cdcfe;">[READY] Waiting for ChatGPT requests...</div>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
            <h4>💡 How to Monitor:</h4>
            <ul>
                <li><strong>Real-time logs:</strong> Watch your terminal/console where the server is running</li>
                <li><strong>This dashboard:</strong> Refresh this page to see current status</li>
                <li><strong>Network tab:</strong> Open browser DevTools (F12) on this page to see HTTP requests</li>
                <li><strong>ChatGPT activity:</strong> Ask ChatGPT to analyze AutoHotkey code to see live communication</li>
            </ul>
        </div>
    </div>

    <script>
        // Auto-refresh every 10 seconds
        setTimeout(() => location.reload(), 10000);
    </script>
</body>
</html>
  `);
});

app.listen(port, () => {
  console.log(`AutoHotkey MCP Server with SSE running on port ${port}`);
  console.log(`Local URL: http://localhost:${port}`);
  console.log(`SSE Endpoint: http://localhost:${port}/sse`);
  console.log(`Ready for ChatGPT MCP integration!`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});