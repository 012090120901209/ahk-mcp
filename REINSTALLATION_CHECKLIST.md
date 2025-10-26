# AutoHotkey v2 MCP Server - Quick Reinstallation Checklist

## 🚀 Quick PowerShell Commands

### 1. Clean Installation
```powershell
# Navigate to your project directory
cd "C:\Users\[YourUsername]\path\to\ahk-mcp"

# Clean previous build
npm run clean

# Fresh install
npm install

# Build project
npm run build
```

### 2. Claude Desktop Configuration
```powershell
# Open config file
notepad "$env:APPDATA\Claude\claude_desktop_config.json"
```

Add this configuration (replace paths):
```json
{
  "mcpServers": {
    "ahk": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "C:\\Users\\[YourUsername]\\path\\to\\ahk-mcp\\dist\\index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "AHK_MCP_LOG_LEVEL": "warn"
      }
    }
  }
}
```

### 3. Claude Code Setup (Alternative)
```powershell
# Navigate to project directory
cd "C:\Users\[YourUsername]\path\to\ahk-mcp"

# Add to Claude Code
claude mcp add autohotkey-v2 --env NODE_ENV=production --env AHK_MCP_DATA_MODE=full -- node dist/index.js
```

## 📋 Step-by-Step Instructions

### Step 1: Prepare Environment
1. Close Claude Desktop completely
2. Close any running Node.js processes
3. Open PowerShell as Administrator

### Step 2: Clean Install
1. Navigate to your ahk-mcp directory
2. Run `npm run clean`
3. Run `npm install`
4. Run `npm run build`
5. Verify `dist/index.js` exists

### Step 3: Configure Claude Desktop
1. Open `%APPDATA%\Claude\claude_desktop_config.json`
2. Replace `[YourUsername]` with your actual Windows username
3. Replace `path\to\ahk-mcp` with your actual path
4. Use double backslashes (`\\`) for all paths
5. Save the file

### Step 4: Restart and Verify
1. Start Claude Desktop
2. Check that "ahk" server shows as "running" in settings
3. Test with: `What AutoHotkey tools are available?`

## 🔧 Alternative Options if Installation Fails

### Option A: Debug Mode
```json
{
  "env": {
    "NODE_ENV": "production",
    "AHK_MCP_LOG_LEVEL": "debug",
    "AHK_MCP_DATA_MODE": "full"
  }
}
```

### Option B: Manual Test
```powershell
cd "C:\Users\[YourUsername]\path\to\ahk-mcp"
$env:AHK_MCP_LOG_LEVEL = "debug"
node dist/index.js
```

### Option C: Check Dependencies
```powershell
# Verify Node.js version
node --version

# Verify npm version
npm --version

# Verify AutoHotkey installation
Get-Command "autohotkey" -ErrorAction SilentlyContinue
```

## ✅ Final Verification

### Test 1: Basic Connection
In Claude Desktop, ask:
```
Use AHK_Config to show current settings
```

### Test 2: File Operations
```
Use AHK_File_View to show contents of any .ahk file
```

### Test 3: Documentation Search
```
Use AHK_Doc_Search to find information about MsgBox
```

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Server not starting" | Check Node.js path: `C:\Program Files\nodejs\node.exe` |
| "No result received" | Add debug logging and restart Claude Desktop |
| "Path not found" | Use double backslashes and absolute paths |
| "Build failed" | Run `npm run clean` before `npm install` |
A
## 📝 Important Reminders

- Replace ALL placeholders: `[YourUsername]` and `path\to\ahk-mcp`
- Use double backslashes (`\\`) in JSON paths
- Restart Claude Desktop completely after config changes
- Check that `dist/index.js` exists before starting
- Use `AHK_MCP_LOG_LEVEL: "debug"` for troubleshooting

---

**Your AutoHotkey v2 MCP Server should now be running!**


npm install -g @anthropic-ai/claude-code@latest