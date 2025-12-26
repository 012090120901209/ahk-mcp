#!/usr/bin/env pwsh
#
# Claude Extension Installer
# Installs AHK MCP Server as a Claude Extension
#

param(
    [switch]$SkipBuild,
    [switch]$Force
)

# Configuration
$extensionAssetsDir = $PSScriptRoot
$projectDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$extensionDir = "$env:APPDATA\Claude\Claude Extensions\ahk-mcp"

Write-Host "`n🚀 AHK MCP Claude Extension Installer`n" -ForegroundColor Cyan

# Check for icon.png
$iconPath = Join-Path $extensionAssetsDir 'icon.png'
if (-not (Test-Path $iconPath)) {
    Write-Host "⚠️  Warning: icon.png not found!" -ForegroundColor Yellow
    Write-Host "   Please create a proper 512x512 PNG icon at:" -ForegroundColor Yellow
    Write-Host "   $iconPath" -ForegroundColor Yellow
    Write-Host "   Tip: Run .\\extension\\create-icon.ps1 to generate a placeholder.`n" -ForegroundColor Yellow
}

# Build
if (-not $SkipBuild) {
    Write-Host "📦 Building project..." -ForegroundColor Cyan
    cd $projectDir
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  Skipping build (--SkipBuild)" -ForegroundColor Yellow
}

# Check if extension already exists
if (Test-Path $extensionDir) {
    if ($Force) {
        Write-Host "🗑️  Removing existing extension..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $extensionDir
    } else {
        Write-Host "⚠️  Extension already installed at:" -ForegroundColor Yellow
        Write-Host "   $extensionDir" -ForegroundColor Yellow
        $response = Read-Host "   Overwrite? (y/N)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-Host "❌ Installation cancelled." -ForegroundColor Red
            exit 0
        }
        Remove-Item -Recurse -Force $extensionDir
    }
}

# Create extension directory
Write-Host "📁 Creating extension directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $extensionDir | Out-Null

# Copy essential files
Write-Host "📋 Copying files..." -ForegroundColor Cyan

$manifestPath = Join-Path $extensionAssetsDir 'manifest.json'
$manifestDisabledPath = Join-Path $extensionAssetsDir 'manifest.json.disabled'
if (Test-Path $manifestPath) {
    Copy-Item $manifestPath "$extensionDir\manifest.json" -Force
    Write-Host "   ✓ manifest.json" -ForegroundColor Green
} elseif (Test-Path $manifestDisabledPath) {
    Copy-Item $manifestDisabledPath "$extensionDir\manifest.json" -Force
    Write-Host "   ⚠️  manifest.json (from manifest.json.disabled)" -ForegroundColor Yellow
} else {
    Write-Host "   ✗ manifest.json (REQUIRED - Missing!)" -ForegroundColor Red
    exit 1
}

if (Test-Path $iconPath) {
    Copy-Item $iconPath "$extensionDir\" -Force
    Write-Host "   ✓ icon.png" -ForegroundColor Green
} else {
    Write-Host "   ⊘ icon.png (optional - skipped)" -ForegroundColor DarkGray
}

$filesToCopy = @(
    @{ Path = "package.json"; Required = $true },
    @{ Path = "LICENSE"; Required = $false },
    @{ Path = "README.md"; Required = $false }
)

foreach ($file in $filesToCopy) {
    $sourcePath = Join-Path $projectDir $file.Path
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath "$extensionDir\" -Force
        Write-Host "   ✓ $($file.Path)" -ForegroundColor Green
    } elseif ($file.Required) {
        Write-Host "   ✗ $($file.Path) (REQUIRED - Missing!)" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "   ⊘ $($file.Path) (optional - skipped)" -ForegroundColor DarkGray
    }
}

# Copy directories
$dirsToCopy = @("dist", "data", "docs")
foreach ($dir in $dirsToCopy) {
    $sourcePath = Join-Path $projectDir $dir
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath "$extensionDir\$dir" -Recurse -Force
        Write-Host "   ✓ $dir/" -ForegroundColor Green
    }
}

# Install production dependencies
Write-Host "`n📦 Installing production dependencies..." -ForegroundColor Cyan
cd $extensionDir
npm ci --only=production --silent --no-audit
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}

# Create metadata
Write-Host "📝 Creating extension metadata..." -ForegroundColor Cyan
$manifestPath = Join-Path $extensionDir "manifest.json"
$manifest = Get-Content $manifestPath | ConvertFrom-Json
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

$metadata = @{
    extensionId = "ahk-mcp"
    version = $manifest.version
    downloadedAt = $timestamp
    manifest = $manifest
    isInternalDxt = $false
}

$metadata | ConvertTo-Json -Depth 10 | Set-Content "$extensionDir\_update_metadata.json"

# Summary
Write-Host "`n✅ Extension installed successfully!`n" -ForegroundColor Green

Write-Host "📍 Installation Location:" -ForegroundColor Cyan
Write-Host "   $extensionDir`n" -ForegroundColor White

Write-Host "📊 Extension Info:" -ForegroundColor Cyan
Write-Host "   Name:    $($manifest.display_name)" -ForegroundColor White
Write-Host "   Version: $($manifest.version)" -ForegroundColor White
Write-Host "   Tools:   $($manifest.tools.Count)" -ForegroundColor White

Write-Host "`n🔄 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Quit Claude Desktop completely (File → Quit, not just close)" -ForegroundColor White
Write-Host "   2. Reopen Claude Desktop" -ForegroundColor White
Write-Host "   3. Go to Settings → Extensions" -ForegroundColor White
Write-Host "   4. Verify 'AutoHotkey v2 MCP' appears" -ForegroundColor White
Write-Host "   5. Toggle to enable if needed" -ForegroundColor White
Write-Host "   6. Test in Claude chat: 'Use AHK_Config to show configuration'`n" -ForegroundColor White

Write-Host "📱 Mobile Access:" -ForegroundColor Cyan
Write-Host "   Once enabled on desktop, the extension will sync to:" -ForegroundColor White
Write-Host "   • Claude iOS App (Settings → Extensions)" -ForegroundColor White
Write-Host "   • Claude Android App (Settings → Extensions)" -ForegroundColor White
Write-Host "   • Claude Web (when available)`n" -ForegroundColor White

Write-Host "🔧 Development:" -ForegroundColor Cyan
Write-Host "   To update after changes:" -ForegroundColor White
Write-Host "   1. Run: .\extension\install-extension.ps1" -ForegroundColor White
Write-Host "   2. Restart Claude Desktop`n" -ForegroundColor White

# Offer to open extension directory
$openDir = Read-Host "📂 Open extension directory? (y/N)"
if ($openDir -eq 'y' -or $openDir -eq 'Y') {
    explorer $extensionDir
}

Write-Host "`n✨ All done!`n" -ForegroundColor Green
