# AutoHotkey v2 MCP Server - Claude Code Installation

## Quick Setup

### 1. Locate Your Claude Code Config Directory

**Windows:**

```
%APPDATA%\Code\User\claude\
```

Usually: `C:\Users\[YourUsername]\AppData\Roaming\Code\User\claude\`

**macOS:**

```
~/Library/Application Support/Code/User/claude/
```

**Linux:**

```
~/.config/Code/User/claude/
```

### 2. Copy MCP Configuration

**For Windows users:** Copy the contents of `.mcp.windows.json` to your Claude
Code config:

```powershell
# PowerShell command
Copy-Item "C:\path\to\ahk-mcp\.mcp.windows.json" `
          "$env:APPDATA\Code\User\claude\mcp.json"
```

**For WSL/Linux users:** Copy the contents of `.mcp.json` to your Claude Code
config:

```bash
# Bash command
cp /path/to/ahk-mcp/.mcp.json \
   ~/.config/Code/User/claude/mcp.json
```

### 3. Verify Installation

1. Open Claude Code
2. Open the Command Palette (Ctrl+Shift+P)
3. Type "MCP" and look for MCP-related commands
4. The AutoHotkey v2 server should appear in available MCP servers

### 4. Test the MCP Server

In Claude Code, try these commands to verify the server is working:

```
"Show me AutoHotkey documentation for MsgBox"
"Analyze this AutoHotkey script: [paste code]"
"What AutoHotkey functions are available for file operations?"
```

## Manual Configuration

If you need to manually configure, add this to your `mcp.json`:

```json
{
  "mcpServers": {
    "autohotkey-v2": {
      "command": "node",
      "args": ["C:\\path\\to\\ahk-mcp\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production",
        "AHK_MCP_DATA_MODE": "full",
        "AHK_MCP_LIGHT": "0"
      }
    }
  }
}
```

**Important:** Adjust the path to match where you cloned the ahk-mcp repository.

## Available MCP Tools

Once installed, Claude will have access to these AutoHotkey tools:

### Core Development Tools

- `AHK_Run` - Execute AutoHotkey scripts with window detection
- `AHK_Analyze` - Advanced code analysis
- `AHK_Diagnostics` - Error detection and validation

### Documentation & Context

- `AHK_Doc_Search` - Search AutoHotkey documentation
- `AHK_Context_Injector` - Auto-inject relevant context
- `AHK_Sampling_Enhancer` - Enhance code samples
- `AHK_Summary` - Quick reference summaries

### Development Workflow

- `AHK_Prompts` - Access prompt templates
- `AHK_Debug_Agent` - Debug assistance
- `AHK_Config` - Configuration management
- `AHK_Active_File` - Active file tracking
- `AHK_File_Recent` - Recent files tracking
- `AHK_VSCode_Problems` - VS Code integration

## Troubleshooting

### Server Not Starting

1. Ensure Node.js is installed: `node --version` (requires v18+)
2. Build the project first: `npm run build` in the ahk-mcp directory
3. Check the path in mcp.json points to the correct location

### Permission Issues

- On Windows, ensure the ahk-mcp folder has read permissions
- On Linux/macOS, you may need to make the script executable:
  ```bash
  chmod +x /path/to/ahk-mcp/dist/index.js
  ```

### Logs and Debugging

Check Claude Code logs:

- Windows: `%APPDATA%\Code\logs\`
- macOS: `~/Library/Logs/Code/`
- Linux: `~/.config/Code/logs/`

## Environment Variables

You can customize the server behavior with these environment variables:

- `AHK_MCP_DATA_MODE`: "full" | "index" (default: "full")
- `AHK_MCP_LIGHT`: "0" | "1" (default: "0")
- `NODE_ENV`: "production" | "development" (default: "production")

## Support

For issues or questions:

- GitHub Issues: [Create an issue in the ahk-mcp repository]
- Documentation: See README.md for detailed tool documentation

---
