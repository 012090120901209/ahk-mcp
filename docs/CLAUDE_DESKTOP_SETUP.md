# AutoHotkey v2 MCP Server - Claude Desktop Setup

## Quick Setup Guide

### 1. Prerequisites

- **Node.js** 18+ installed
- **AutoHotkey v2** installed (for script execution)
- **Claude Desktop** installed and running
- **MCP server built** (`npm run build` completed)

### 2. Locate Claude Desktop Config

Find your Claude Desktop configuration file:

**Windows:**

```
%APPDATA%\Claude\claude_desktop_config.json
```

Usually:
`C:\Users\[YourUsername]\AppData\Roaming\Claude\claude_desktop_config.json`

**macOS:**

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**

```
~/.config/Claude/claude_desktop_config.json
```

### 3. Add MCP Server Configuration

Edit your `claude_desktop_config.json` file and add the AutoHotkey MCP server:

**Windows Configuration:**

```json
{
  "mcpServers": {
    "ahk": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["C:\\Users\\YourUsername\\path\\to\\ahk-mcp\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production",
        "AHK_MCP_LOG_LEVEL": "warn"
      }
    }
  }
}
```

**Debug Configuration (for troubleshooting):**

```json
{
  "mcpServers": {
    "ahk": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["C:\\Users\\YourUsername\\path\\to\\ahk-mcp\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production",
        "AHK_MCP_LOG_LEVEL": "debug",
        "AHK_MCP_DATA_MODE": "full"
      }
    }
  }
}
```

### 4. Important Configuration Notes

- **Replace `YourUsername`** with your actual Windows username
- **Replace `path\\to\\ahk-mcp`** with the actual path to your installation
- **Use absolute paths** for both Node.js and the script
- **Use double backslashes** (`\\`) in Windows paths for proper JSON escaping
- **Server name is `ahk`** - this is what Claude Desktop will show

### 5. Restart Claude Desktop

After saving the configuration file:

1. Close Claude Desktop completely
2. Restart Claude Desktop
3. Check that the MCP server shows as "running" in the settings

### 6. Verify Installation

In Claude Desktop, try these commands:

**Check available tools:**

```
What AutoHotkey tools are available?
```

**Test a simple tool:**

```
Use AHK_Config to show current settings
```

**Test file viewing:**

```
Use AHK_File_View to show me the contents of C:\path\to\your\script.ahk
```

## Available Tools

Once configured, you'll have access to these AutoHotkey tools:

### 🔧 **File Management Tools**

- `AHK_File_View` - View AutoHotkey files with syntax highlighting
- `AHK_File_Edit` - Edit files with search/replace operations
- `AHK_File_Edit_Advanced` - Advanced file editing with diff patches
- `AHK_File_Edit_Small` - Quick small edits
- `AHK_File_Active` - Manage active file context
- `AHK_File_Recent` - Track recently used files

### 🏃 **Script Execution**

- `AHK_Run` - Execute AutoHotkey scripts with window detection
- `AHK_Debug_Agent` - Debug assistance and error analysis

### 📚 **Documentation & Analysis**

- `AHK_Doc_Search` - Search AutoHotkey v2 documentation
- `AHK_Analyze` - Comprehensive code analysis
- `AHK_Diagnostics` - Syntax validation and error detection
- `AHK_Summary` - Quick reference summaries

### ⚙️ **Development Tools**

- `AHK_Config` - View and manage configuration
- `AHK_Settings` - Tool settings and preferences
- `AHK_Alpha` - Alpha versioning system for iterative development
- `AHK_Prompts` - Access prompt templates

## Troubleshooting

### Server Not Starting

**Check server status in Claude Desktop:**

- Open Claude Desktop settings
- Look for "ahk" server in MCP servers list
- Status should show "running"

**Common fixes:**

1. **Wrong Node.js path:** Verify `C:\Program Files\nodejs\node.exe` exists
2. **Wrong script path:** Ensure the path to `dist/index.js` is correct
3. **Build required:** Run `npm run build` in the ahk-mcp directory
4. **Permissions:** Ensure the ahk-mcp folder has read permissions

### "No result received from client-side tool execution"

This usually means the server is running but tools are failing:

1. **Add debug logging:**

   ```json
   "env": {
     "NODE_ENV": "production",
     "AHK_MCP_LOG_LEVEL": "debug"
   }
   ```

2. **Check tool names are correct:**
   - Use `AHK_File_View` (not `ahk_file_view`)
   - Names are case-sensitive
   - Use underscores, not hyphens

3. **Test simple tools first:**
   - Try `AHK_Config` (no parameters needed)
   - Then try tools with parameters

### Path Issues

**Windows path format:**

- ✅ `C:\\Users\\username\\path\\to\\file`
- ❌ `/mnt/c/Users/username/path/to/file` (WSL path)
- ❌ `C:\Users\username\path\to\file` (single backslashes)

### Environment Variables

| Variable            | Values                                 | Purpose               |
| ------------------- | -------------------------------------- | --------------------- |
| `NODE_ENV`          | `production` \| `development`          | Runtime mode          |
| `AHK_MCP_LOG_LEVEL` | `error` \| `warn` \| `info` \| `debug` | Logging verbosity     |
| `AHK_MCP_DATA_MODE` | `full` \| `index`                      | Documentation loading |

## Manual Testing

To test the server directly:

```bash
# Navigate to the project directory
cd "C:\path\to\ahk-mcp"

# Run server manually to see output
set AHK_MCP_LOG_LEVEL=debug && node dist/index.js
```

The server should start silently and wait for connections (this is normal
behavior).

## Next Steps

1. **Test basic functionality** with simple tools like `AHK_Config`
2. **Try file operations** with `AHK_File_View` on existing `.ahk` files
3. **Use documentation tools** like `AHK_Doc_Search` for development help
4. **Explore advanced features** like alpha versioning and file editing

## Support

If you continue having issues:

- Check that Node.js version is 18+ with `node --version`
- Verify AutoHotkey v2 is installed from https://autohotkey.com
- Ensure the project builds successfully with `npm run build`
- Review Claude Desktop logs for MCP connection errors

Your AutoHotkey MCP server is now ready to enhance your AutoHotkey development
workflow in Claude Desktop!
