<#!
.SYNOPSIS
    Launches the AutoHotkey MCP server for use with MCPJam/Inspector.

.DESCRIPTION
    Builds the TypeScript project (if needed) and starts the compiled
    `dist\index.js` entry under Node.js with the environment variables
    commonly used for MCP inspection.

.NOTES
    Save this script in the project root. Run from PowerShell:
        .\launch-ahk-mcp.ps1
#>

param(
    [string]$NodePath = 'C:\Program Files\nodejs\node.exe',
    [string]$WorkingDirectory,
    [switch]$SkipBuild
)

if (-not $WorkingDirectory) {
    $scriptPath = if ($PSCommandPath) { $PSCommandPath } else { $MyInvocation.MyCommand.Path }
    if (-not $scriptPath) {
        Write-Error 'Unable to determine script path for working directory resolution.'
        exit 1
    }
    $WorkingDirectory = [System.IO.Path]::GetDirectoryName($scriptPath)
}

Write-Host 'AutoHotkey MCP Inspector Launcher' -ForegroundColor Cyan
Write-Host "Working directory: $WorkingDirectory"

if (-not (Test-Path $NodePath)) {
    Write-Error "Node executable not found: $NodePath"
    exit 1
}

Set-Location $WorkingDirectory

if (-not $SkipBuild) {
    Write-Host 'Ensuring dependencies are installed...' -ForegroundColor Yellow
    npm install | Write-Output

    Write-Host 'Running build (npm run build)...' -ForegroundColor Yellow
    $build = npm run build
    Write-Output $build

    if ($LASTEXITCODE -ne 0) {
        Write-Error 'Build failed; aborting launch.'
        exit $LASTEXITCODE
    }
} else {
    Write-Host 'Skipping build per parameter.' -ForegroundColor Yellow
}

$entryPoint = Join-Path $WorkingDirectory 'dist\index.js'

if (-not (Test-Path $entryPoint)) {
    Write-Error "Entry point missing: $entryPoint. Run npm run build first."
    exit 1
}

Write-Host 'Starting MCP server...' -ForegroundColor Green

$env:NODE_ENV = 'production'
$env:AHK_MCP_LOG_LEVEL = 'debug'
$env:AHK_MCP_CONFIG_DIR = Join-Path $env:APPDATA 'ahk-mcp'

& $NodePath $entryPoint

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Server exited with code $LASTEXITCODE"
}

