# Claude Extension Quick Start

## What is a Claude Extension?

Claude Extensions allow your MCP server to work on:

- ✅ Claude Desktop (Windows/Mac/Linux)
- ✅ Claude Mobile App (iOS/Android)
- ✅ Claude Web Browser

Unlike the stdio config in `claude_desktop_config.json`, extensions are
**portable** and work **across all devices**.

---

## Quick Install (3 Steps)

### 1. Create an Icon (5 minutes)

Create a **512x512 PNG** icon for your extension.

**Easy Option:** Use AI

```
Prompt: "Create a professional icon for an AutoHotkey development tool.
Red/white colors, keyboard automation theme, modern flat design, 512x512 pixels"
```

**Tools:**

- [Canva](https://www.canva.com/) - Free online design tool
- [Leonardo.ai](https://leonardo.ai/) - AI image generator
- [DALL-E](https://labs.openai.com/) - AI image generator

**Save as:** `icon.png` in this directory

**Temporary Placeholder:** Any PNG works for testing

### 2. Run Installer

```powershell
# From repo root
.\extension\install-extension.ps1
```

The installer will:

- Build your project
- Copy files to Claude Extensions directory
- Install dependencies
- Create metadata

### 3. Restart Claude

1. **Quit Claude Desktop** (File → Quit)
2. **Reopen Claude Desktop**
3. **Check:** Settings → Extensions → "AutoHotkey v2 MCP"

---

## Verify Installation

### Desktop

In Claude Desktop chat:

```
Use AHK_Config to show the server configuration
```

Should see all 33 tools listed.

### Mobile (iOS/Android)

1. Open Claude app
2. Settings → Extensions
3. Find "AutoHotkey v2 MCP"
4. Toggle to enable

---

## Development Workflow

After making code changes:

```powershell
# Quick update
.\extension\install-extension.ps1

# Then restart Claude Desktop
```

---

## Files Included

- ✅ `manifest.json` (or `manifest.json.disabled`) - Extension configuration
- ⏳ `icon.png` - Need to create (512x512 PNG)
- ✅ `extension/install-extension.ps1` - Automated installer
- ✅ `../docs/CLAUDE_EXTENSION_SETUP.md` - Full documentation

---

## Troubleshooting

**Extension doesn't show up:**

```powershell
# Check installation
ls "$env:APPDATA\Claude\Claude Extensions\ahk-mcp\manifest.json"

# Check Claude logs
ls "$env:APPDATA\Claude\logs" | sort LastWriteTime -Descending | select -First 5
```

**Tools don't work:**

```powershell
# Reinstall dependencies
cd "$env:APPDATA\Claude\Claude Extensions\ahk-mcp"
npm ci --only=production
```

**Need help:**

- Read: `../docs/CLAUDE_EXTENSION_SETUP.md` (complete guide)
- Check: Claude Extension logs in `%APPDATA%\Claude\logs`

---

## Key Differences

| Feature  | Desktop Config               | Extension                   |
| -------- | ---------------------------- | --------------------------- |
| Desktop  | ✅                           | ✅                          |
| Mobile   | ❌                           | ✅                          |
| Web      | ❌                           | ✅                          |
| Updates  | Manual                       | Automatic                   |
| Location | `claude_desktop_config.json` | `Claude Extensions\` folder |

**You can use both!**

- Desktop config for development
- Extension for production/mobile

---

## What's Next?

1. **Create icon.png** (5 min)
2. **Run `.\extension\install-extension.ps1`** (1 min)
3. **Restart Claude** (30 sec)
4. **Test on mobile** (optional)

---

For complete documentation, see: `../docs/CLAUDE_EXTENSION_SETUP.md`
