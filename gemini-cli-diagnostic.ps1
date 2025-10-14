# Gemini CLI Diagnostic Script
# Run this script to identify all Gemini CLI installations and caches

Write-Host "=== Gemini CLI Diagnostic Report ===" -ForegroundColor Yellow
Write-Host ""

# 1. Check all global npm installations
Write-Host "1. Checking all global npm installations..." -ForegroundColor Cyan
npm list -g --depth=0 | findstr gemini
Write-Host ""

# 2. Check npm global paths
Write-Host "2. npm global paths:" -ForegroundColor Cyan
npm config get prefix
npm root -g
Write-Host ""

# 3. Check PATH for Gemini CLI references
Write-Host "3. PATH environment variable for Gemini CLI:" -ForegroundColor Cyan
$env:PATH -split ';' | Where-Object { $_ -like "*gemini*" -or $_ -like "*node*" }
Write-Host ""

# 4. Check current Gemini CLI version and location
Write-Host "4. Current Gemini CLI version and location:" -ForegroundColor Cyan
try {
    $geminiVersion = gemini --version 2>$null
    Write-Host "Version: $geminiVersion"
    
    $geminiPath = Get-Command gemini -ErrorAction SilentlyContinue
    if ($geminiPath) {
        Write-Host "Location: $($geminiPath.Source)"
    } else {
        Write-Host "Gemini CLI not found in PATH"
    }
} catch {
    Write-Host "Error getting Gemini CLI info: $($_.Exception.Message)"
}
Write-Host ""

# 5. Check npm cache
Write-Host "5. npm cache information:" -ForegroundColor Cyan
npm config get cache
Write-Host "Cache size:"
npm cache verify
Write-Host ""

# 6. Check for user data directories
Write-Host "6. Checking for user data directories:" -ForegroundColor Cyan
$userDataPaths = @(
    "$env:APPDATA\gemini-cli",
    "$env:LOCALAPPDATA\gemini-cli",
    "$env:USERPROFILE\.gemini-cli",
    "$env:USERPROFILE\.config\gemini-cli"
)

foreach ($path in $userDataPaths) {
    if (Test-Path $path) {
        Write-Host "Found: $path"
        Get-ChildItem $path -Recurse | Measure-Object | ForEach-Object { 
            Write-Host "  Files: $($_.Count)" 
        }
    }
}
Write-Host ""

# 7. Check Windows registry for Gemini CLI entries
Write-Host "7. Checking Windows registry entries:" -ForegroundColor Cyan
try {
    $registryPaths = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )
    
    foreach $regPath in $registryPaths {
        $apps = Get-ItemProperty $regPath -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like "*gemini*" }
        if ($apps) {
            $apps | ForEach-Object {
                Write-Host "Found registry entry: $($_.DisplayName)"
                Write-Host "  InstallLocation: $($_.InstallLocation)"
                Write-Host "  DisplayVersion: $($_.DisplayVersion)"
            }
        }
    }
} catch {
    Write-Host "Error checking registry: $($_.Exception.Message)"
}
Write-Host ""

Write-Host "=== Diagnostic Complete ===" -ForegroundColor Yellow