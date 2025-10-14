# Gemini CLI Complete Cleanup and Reinstallation Script
# This script will completely remove all traces of Gemini CLI and reinstall the latest version

Write-Host "=== Gemini CLI Complete Cleanup and Reinstallation ===" -ForegroundColor Yellow
Write-Host "This will completely remove all traces of Gemini CLI and reinstall the latest version."
Write-Host ""

# Ask for confirmation
$confirmation = Read-Host "Do you want to proceed with complete cleanup? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Cleanup cancelled." -ForegroundColor Red
    exit
}

Write-Host "Starting complete cleanup process..." -ForegroundColor Green
Write-Host ""

# Step 1: Kill any running Gemini CLI processes
Write-Host "Step 1: Stopping any running Gemini CLI processes..." -ForegroundColor Cyan
Get-Process -Name "gemini" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*gemini*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Done." -ForegroundColor Green
Write-Host ""

# Step 2: Remove all global npm installations
Write-Host "Step 2: Removing all global npm installations..." -ForegroundColor Cyan
npm uninstall -g @google/generative-ai-cli 2>$null
npm uninstall -g gemini-cli 2>$null
npm uninstall -g gemini 2>$null
Write-Host "Done." -ForegroundColor Green
Write-Host ""

# Step 3: Clear npm cache completely
Write-Host "Step 3: Clearing npm cache..." -ForegroundColor Cyan
npm cache clean --force
Write-Host "Done." -ForegroundColor Green
Write-Host ""

# Step 4: Remove npm global modules cache
Write-Host "Step 4: Clearing npm global modules cache..." -ForegroundColor Cyan
$npmGlobalPath = npm root -g
if (Test-Path $npmGlobalPath) {
    Remove-Item "$npmGlobalPath\@google" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "$npmGlobalPath\gemini*" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "Done." -ForegroundColor Green
Write-Host ""

# Step 5: Remove user data directories
Write-Host "Step 5: Removing user data directories..." -ForegroundColor Cyan
$userDataPaths = @(
    "$env:APPDATA\gemini-cli",
    "$env:LOCALAPPDATA\gemini-cli",
    "$env:USERPROFILE\.gemini-cli",
    "$env:USERPROFILE\.config\gemini-cli",
    "$env:APPDATA\npm\node_modules\@google\generative-ai-cli",
    "$env:LOCALAPPDATA\npm-cache"
)

foreach ($path in $userDataPaths) {
    if (Test-Path $path) {
        Write-Host "Removing: $path"
        Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "Done." -ForegroundColor Green
Write-Host ""

# Step 6: Clean PATH environment variable
Write-Host "Step 6: Cleaning PATH environment variable..." -ForegroundColor Cyan
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$pathEntries = $currentPath -split ';'
$newPathEntries = @()

foreach ($entry in $pathEntries) {
    if ($entry -notlike "*gemini*" -and $entry -notlike "*@google*") {
        $newPathEntries += $entry
    }
}

$newPath = $newPathEntries -join ';'
[Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
Write-Host "Done." -ForegroundColor Green
Write-Host ""

# Step 7: Remove Windows registry entries
Write-Host "Step 7: Removing Windows registry entries..." -ForegroundColor Cyan
try {
    $registryPaths = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )
    
    foreach ($regPath in $registryPaths) {
        $apps = Get-ItemProperty $regPath -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like "*gemini*" }
        if ($apps) {
            $apps | ForEach-Object {
                Write-Host "Removing registry entry: $($_.DisplayName)"
                Remove-Item $_.PSPath -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
    }
} catch {
    $regErrorMsg = $_.Exception.Message
    Write-Host "Error cleaning registry: $regErrorMsg" -ForegroundColor Yellow
}
Write-Host "Done." -ForegroundColor Green
Write-Host ""

# Step 8: Verify cleanup
Write-Host "Step 8: Verifying cleanup..." -ForegroundColor Cyan
$geminiCommand = Get-Command gemini -ErrorAction SilentlyContinue
if ($geminiCommand) {
    Write-Host "WARNING: Gemini CLI command still found at: $($geminiCommand.Source)" -ForegroundColor Yellow
} else {
    Write-Host "Gemini CLI command successfully removed from PATH." -ForegroundColor Green
}

$npmGlobal = npm list -g --depth=0 2>$null | findstr gemini
if ($npmGlobal) {
    Write-Host "WARNING: Gemini CLI still found in global npm: $npmGlobal" -ForegroundColor Yellow
} else {
    Write-Host "Gemini CLI successfully removed from global npm." -ForegroundColor Green
}
Write-Host ""

# Step 9: Force install latest version
Write-Host "Step 9: Installing latest Gemini CLI version..." -ForegroundColor Cyan
Write-Host "Installing with force flag and latest version..." -ForegroundColor Green

# Try different package names
$packageNames = @("@google/generative-ai-cli", "gemini-cli", "gemini")
$installed = $false

foreach ($packageName in $packageNames) {
    Write-Host "Trying to install $packageName..." -ForegroundColor Yellow
    try {
        npm install -g $packageName --force --latest
        $installed = $true
        Write-Host "Successfully installed $packageName" -ForegroundColor Green
        break
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host "Failed to install $packageName: $errorMsg" -ForegroundColor Red
    }
}

if (-not $installed) {
    Write-Host "Failed to install any Gemini CLI package. Please check npm registry." -ForegroundColor Red
    exit
}

Write-Host "Done." -ForegroundColor Green
Write-Host ""

# Step 10: Verify installation
Write-Host "Step 10: Verifying new installation..." -ForegroundColor Cyan
try {
    $geminiVersion = gemini --version 2>$null
    Write-Host "Gemini CLI version: $geminiVersion" -ForegroundColor Green
    
    $geminiPath = Get-Command gemini -ErrorAction SilentlyContinue
    if ($geminiPath) {
        Write-Host "Gemini CLI location: $($geminiPath.Source)" -ForegroundColor Green
    }
    
    $npmList = npm list -g --depth=0 2>$null | findstr gemini
    Write-Host "Global npm installation: $npmList" -ForegroundColor Green
    
} catch {
    $verifyErrorMsg = $_.Exception.Message
    Write-Host "Error verifying installation: $verifyErrorMsg" -ForegroundColor Red
}
Write-Host ""

# Step 11: Configure to disable auto-update (optional)
Write-Host "Step 11: Auto-update configuration..." -ForegroundColor Cyan
Write-Host "If you want to disable auto-update to prevent this issue in the future:" -ForegroundColor Yellow
Write-Host "Run: gemini config set auto-update false" -ForegroundColor White
Write-Host "Or add to your config file: {'autoUpdate': false}" -ForegroundColor White
Write-Host ""

Write-Host "=== Complete cleanup and reinstallation finished ===" -ForegroundColor Yellow
Write-Host "If you still see update messages, restart your terminal/command prompt."
Write-Host "If the issue persists, you may need to restart your computer."