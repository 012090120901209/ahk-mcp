# Gemini CLI Verification Script
# Run this after cleanup to verify only one installation exists

Write-Host "=== Gemini CLI Verification ===" -ForegroundColor Yellow
Write-Host ""

# Check current version
Write-Host "1. Current Gemini CLI version:" -ForegroundColor Cyan
try {
    $geminiVersion = gemini --version 2>$null
    Write-Host "Version: $geminiVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Cannot get version - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Check command location
Write-Host "2. Gemini CLI command location:" -ForegroundColor Cyan
$geminiCommand = Get-Command gemini -ErrorAction SilentlyContinue
if ($geminiCommand) {
    Write-Host "Location: $($geminiCommand.Source)" -ForegroundColor Green
} else {
    Write-Host "Gemini CLI not found in PATH" -ForegroundColor Red
}
Write-Host ""

# Check global npm installations
Write-Host "3. Global npm installations:" -ForegroundColor Cyan
$npmGlobal = npm list -g --depth=0 2>$null | findstr gemini
if ($npmGlobal) {
    Write-Host "Found: $npmGlobal" -ForegroundColor Green
} else {
    Write-Host "No global Gemini CLI installation found" -ForegroundColor Yellow
}
Write-Host ""

# Check for multiple installations
Write-Host "4. Checking for multiple installations:" -ForegroundColor Cyan
$allGeminiCommands = Get-Command gemini -All -ErrorAction SilentlyContinue
if ($allGeminiCommands) {
    if ($allGeminiCommands.Count -gt 1) {
        Write-Host "WARNING: Multiple Gemini CLI installations found:" -ForegroundColor Red
        $allGeminiCommands | ForEach-Object { Write-Host "  $($_.Source)" }
    } else {
        Write-Host "Single installation confirmed: $($allGeminiCommands.Source)" -ForegroundColor Green
    }
} else {
    Write-Host "No Gemini CLI installations found" -ForegroundColor Red
}
Write-Host ""

# Test for update message
Write-Host "5. Testing for update message (run a command):" -ForegroundColor Cyan
try {
    $output = gemini --help 2>&1
    if ($output -like "*update available*" -or $output -like "*new version*") {
        Write-Host "WARNING: Update message still detected" -ForegroundColor Red
        Write-Host "Output: $output"
    } else {
        Write-Host "No update messages detected" -ForegroundColor Green
    }
} catch {
    Write-Host "Error running test command: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Verification Complete ===" -ForegroundColor Yellow