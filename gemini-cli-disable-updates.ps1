# Gemini CLI Auto-Update Disabling Script
# Run this after installation to disable auto-update features

Write-Host "=== Gemini CLI Auto-Update Configuration ===" -ForegroundColor Yellow
Write-Host ""

# Method 1: Try to disable via config command
Write-Host "Method 1: Attempting to disable auto-update via config command..." -ForegroundColor Cyan
try {
    gemini config set auto-update false 2>$null
    Write-Host "Auto-update disabled via config command" -ForegroundColor Green
} catch {
    Write-Host "Config command not available or failed" -ForegroundColor Yellow
}
Write-Host ""

# Method 2: Create/edit config file
Write-Host "Method 2: Creating configuration file to disable auto-update..." -ForegroundColor Cyan

$configPaths = @(
    "$env:USERPROFILE\.gemini-cli\config.json",
    "$env:APPDATA\gemini-cli\config.json",
    "$env:LOCALAPPDATA\gemini-cli\config.json"
)

$configCreated = $false
foreach ($configPath in $configPaths) {
    try {
        $configDir = Split-Path $configPath -Parent
        if (-not (Test-Path $configDir)) {
            New-Item -ItemType Directory -Path $configDir -Force | Out-Null
        }
        
        $configContent = @{
            autoUpdate = $false
            checkForUpdates = $false
            updateNotification = $false
        } | ConvertTo-Json -Depth 10
        
        Set-Content -Path $configPath -Value $configContent -Force
        Write-Host "Config file created: $configPath" -ForegroundColor Green
        $configCreated = $true
        break
    } catch {
        Write-Host "Failed to create config at $configPath : $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

if (-not $configCreated) {
    Write-Host "Could not create config file in any standard location" -ForegroundColor Red
}
Write-Host ""

# Method 3: Set environment variable
Write-Host "Method 3: Setting environment variable to disable updates..." -ForegroundColor Cyan
try {
    [Environment]::SetEnvironmentVariable("GEMINI_DISABLE_UPDATE", "true", "User")
    Write-Host "Environment variable GEMINI_DISABLE_UPDATE set for user" -ForegroundColor Green
    
    [Environment]::SetEnvironmentVariable("GEMINI_NO_UPDATE_CHECK", "true", "User")
    Write-Host "Environment variable GEMINI_NO_UPDATE_CHECK set for user" -ForegroundColor Green
} catch {
    Write-Host "Failed to set environment variables: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Method 4: Create npmrc configuration
Write-Host "Method 4: Configuring npm to prevent auto-updates..." -ForegroundColor Cyan
try {
    $npmrcPath = "$env:USERPROFILE\.npmrc"
    $npmrcContent = Get-Content $npmrcPath -ErrorAction SilentlyContinue
    
    $updateSettings = @(
        "update-notifier=false",
        "fund=false",
        "audit=false"
    )
    
    $newNpmrcContent = @()
    if ($npmrcContent) {
        $newNpmrcContent = $npmrcContent | Where-Object { $_ -notlike "update-notifier*" -and $_ -notlike "fund*" -and $_ -notlike "audit*" }
    }
    
    $newNpmrcContent += $updateSettings
    $newNpmrcContent | Set-Content -Path $npmrcPath -Force
    Write-Host "npmrc configured to disable update notifications" -ForegroundColor Green
} catch {
    Write-Host "Failed to configure npmrc: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Verification
Write-Host "Verification: Checking if auto-update is disabled..." -ForegroundColor Cyan
Write-Host "Run 'gemini --help' to see if update messages appear" -ForegroundColor Yellow
Write-Host "If you still see update messages, try restarting your terminal/computer" -ForegroundColor Yellow
Write-Host ""

Write-Host "=== Auto-Update Configuration Complete ===" -ForegroundColor Yellow
Write-Host "Note: Some CLI tools may still check for updates regardless of these settings."
Write-Host "If the issue persists, the update check may be hardcoded into the application."