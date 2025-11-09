# AHK MCP Extension Installer
param([switch]$SkipBuild, [switch]$Force)

$projectDir = $PSScriptRoot
$extensionDir = "$env:APPDATA\Claude\Claude Extensions\ahk-mcp"

Write-Host "`nAHK MCP Claude Extension Installer`n" -ForegroundColor Cyan

# Build
if (-not $SkipBuild) {
    Write-Host "Building project..." -ForegroundColor Cyan
    cd $projectDir
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }
} else {
    Write-Host "Skipping build" -ForegroundColor Yellow
}

# Check existing
if (Test-Path $extensionDir) {
    if ($Force) {
        Write-Host "Removing existing extension..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $extensionDir
    } else {
        $response = Read-Host "Extension exists. Overwrite? (y/N)"
        if ($response -ne 'y' -and $response -ne 'Y') { Write-Host "Cancelled" -ForegroundColor Red; exit 0 }
        Remove-Item -Recurse -Force $extensionDir
    }
}

# Create directory
Write-Host "Creating extension directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $extensionDir | Out-Null

# Copy files
Write-Host "Copying files..." -ForegroundColor Cyan
Copy-Item "$projectDir\manifest.json" "$extensionDir\" -Force
Copy-Item "$projectDir\package.json" "$extensionDir\" -Force
Copy-Item "$projectDir\dist" "$extensionDir\dist" -Recurse -Force
Copy-Item "$projectDir\data" "$extensionDir\data" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$projectDir\docs" "$extensionDir\docs" -Recurse -Force -ErrorAction SilentlyContinue

if (Test-Path "$projectDir\icon.png") {
    Copy-Item "$projectDir\icon.png" "$extensionDir\" -Force
    Write-Host "  + icon.png" -ForegroundColor Green
} else {
    Write-Host "  ! icon.png missing (create a 512x512 PNG)" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Cyan
cd $extensionDir
npm ci --only=production --silent --no-audit
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed!" -ForegroundColor Red; exit 1 }

# Create metadata
Write-Host "Creating metadata..." -ForegroundColor Cyan
$manifest = Get-Content "$extensionDir\manifest.json" | ConvertFrom-Json
$metadata = @{
    extensionId = "ahk-mcp"
    version = $manifest.version
    downloadedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    manifest = $manifest
    isInternalDxt = $false
}
$metadata | ConvertTo-Json -Depth 10 | Set-Content "$extensionDir\_update_metadata.json"

# Success
Write-Host "`nExtension installed successfully!`n" -ForegroundColor Green
Write-Host "Location: $extensionDir" -ForegroundColor White
Write-Host "Tools: $($manifest.tools.Count)`n" -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Quit Claude Desktop (File -> Quit)"
Write-Host "2. Reopen Claude Desktop"
Write-Host "3. Go to Settings -> Extensions"
Write-Host "4. Find 'AutoHotkey v2 MCP'`n"
