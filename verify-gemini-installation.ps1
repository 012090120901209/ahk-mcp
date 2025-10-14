# Gemini CLI Installation Verification Script
# This script verifies that Gemini CLI is properly installed and configured

# Set error handling
$ErrorActionPreference = "Stop"

# Color codes for output
$Colors = @{
    Success = "Green"
    Failure = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

# Function to write colored output
function Write-Status {
    param(
        [string]$Message,
        [string]$Status = "Info",
        [switch]$NoNewline
    )
    
    $color = $Colors[$Status]
    if ($NoNewline) {
        Write-Host $Message -ForegroundColor $color -NoNewline
    } else {
        Write-Host $Message -ForegroundColor $color
    }
}

# Function to write a test result
function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Details = "",
        [string]$Suggestion = ""
    )
    
    $status = if ($Passed) { "PASS" } else { "FAIL" }
    $statusColor = if ($Passed) { $Colors.Success } else { $Colors.Failure }
    
    Write-Host "`n[$status] " -ForegroundColor $statusColor -NoNewline
    Write-Host "$TestName" -ForegroundColor White
    
    if ($Details) {
        Write-Host "    $Details" -ForegroundColor Gray
    }
    
    if (-not $Passed -and $Suggestion) {
        Write-Host "    Suggestion: $Suggestion" -ForegroundColor $Colors.Warning
    }
}

# Function to check if a command exists
function Test-CommandExists {
    param([string]$Command)
    
    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Function to get npm global packages
function Get-NpmGlobalPackages {
    try {
        $packages = npm list -g --depth=0 --json 2>$null | ConvertFrom-Json
        return $packages.dependencies
    } catch {
        return $null
    }
}

# Function to check if npm package is installed globally
function Test-NpmPackageInstalled {
    param([string]$PackageName)
    
    try {
        $result = npm list -g $PackageName --depth=0 2>$null
        return $result -match $PackageName
    } catch {
        return $false
    }
}

# Main verification script
function Start-Verification {
    Write-Status "========================================" "Header"
    Write-Status "Gemini CLI Installation Verification" "Header"
    Write-Status "========================================" "Header"
    Write-Host ""
    
    $allTestsPassed = $true
    
    # Test 1: Check for single, clean installation
    Write-Status "Test 1: Checking for single, clean installation..." "Info"
    
    $geminiCommands = @("gemini", "gemini-cli", "@google/generative-ai-cli")
    $foundCommands = @()
    
    foreach ($cmd in $geminiCommands) {
        if (Test-CommandExists $cmd) {
            $foundCommands += $cmd
        }
    }
    
    if ($foundCommands.Count -eq 1) {
        Write-TestResult "Single Gemini CLI Installation" $true "Found: $($foundCommands[0])"
    } elseif ($foundCommands.Count -gt 1) {
        Write-TestResult "Single Gemini CLI Installation" $false "Found multiple commands: $($foundCommands -join ', ')" "Uninstall conflicting versions and keep only one"
        $allTestsPassed = $false
    } else {
        Write-TestResult "Single Gemini CLI Installation" $false "No Gemini CLI command found" "Install Gemini CLI using: npm install -g @google/generative-ai-cli"
        $allTestsPassed = $false
    }
    
    # Test 2: Verify PATH configuration
    Write-Status "`nTest 2: Verifying PATH configuration..." "Info"
    
    $pathEntries = $env:PATH -split ';'
    $npmGlobalPath = npm config get prefix 2>$null
    
    if ($npmGlobalPath) {
        $npmBinPath = Join-Path $npmGlobalPath "node_modules\.bin"
        $pathContainsNpm = $pathEntries -contains $npmBinPath
        
        if ($pathContainsNpm) {
            Write-TestResult "PATH Configuration" $true "npm global bin directory found in PATH: $npmBinPath"
        } else {
            Write-TestResult "PATH Configuration" $false "npm global bin directory not in PATH: $npmBinPath" "Add $npmBinPath to your PATH environment variable"
            $allTestsPassed = $false
        }
    } else {
        Write-TestResult "PATH Configuration" $false "Could not determine npm global prefix" "Check npm configuration with: npm config list"
        $allTestsPassed = $false
    }
    
    # Test 3: Test basic functionality
    Write-Status "`nTest 3: Testing basic functionality..." "Info"
    
    if ($foundCommands.Count -gt 0) {
        $geminiCmd = $foundCommands[0]
        
        try {
            # Test version command
            $versionOutput = & $geminiCmd --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-TestResult "Version Command" $true "Command executed successfully"
            } else {
                Write-TestResult "Version Command" $false "Command failed with exit code $LASTEXITCODE" "Try reinstalling the CLI"
                $allTestsPassed = $false
            }
            
            # Test help command
            $helpOutput = & $geminiCmd --help 2>$null
            if ($LASTEXITCODE -eq 0 -and $helpOutput) {
                Write-TestResult "Help Command" $true "Help output received"
            } else {
                Write-TestResult "Help Command" $false "Help command failed or returned no output" "Check if the CLI is properly installed"
                $allTestsPassed = $false
            }
        } catch {
            Write-TestResult "Basic Functionality" $false "Error running commands: $($_.Exception.Message)" "Verify the installation and try again"
            $allTestsPassed = $false
        }
    }
    
    # Test 4: Confirm no conflicting versions remain
    Write-Status "`nTest 4: Checking for conflicting versions..." "Info"
    
    $npmPackages = Get-NpmGlobalPackages
    $conflictingPackages = @()
    
    if ($npmPackages) {
        $packageNames = $npmPackages.PSObject.Properties.Name
        $geminiRelatedPackages = $packageNames | Where-Object { $_ -match "gemini|generative-ai" }
        
        if ($geminiRelatedPackages.Count -eq 1) {
            Write-TestResult "No Conflicting Versions" $true "Found single Gemini package: $($geminiRelatedPackages[0])"
        } elseif ($geminiRelatedPackages.Count -gt 1) {
            Write-TestResult "No Conflicting Versions" $false "Found multiple Gemini packages: $($geminiRelatedPackages -join ', ')" "Uninstall conflicting packages with: npm uninstall -g <package-name>"
            $allTestsPassed = $false
        } else {
            Write-TestResult "No Conflicting Versions" $false "No Gemini packages found in npm global" "Install with: npm install -g @google/generative-ai-cli"
            $allTestsPassed = $false
        }
    } else {
        Write-TestResult "No Conflicting Versions" $false "Could not retrieve npm global packages" "Check npm configuration"
        $allTestsPassed = $false
    }
    
    # Test 5: Validate npm global package configuration
    Write-Status "`nTest 5: Validating npm global configuration..." "Info"
    
    try {
        $npmPrefix = npm config get prefix 2>$null
        $npmCache = npm config get cache 2>$null
        $npmGlobalModules = npm config get global 2>$null
        
        if ($npmPrefix -and (Test-Path $npmPrefix)) {
            Write-TestResult "npm Global Prefix" $true "Prefix: $npmPrefix"
        } else {
            Write-TestResult "npm Global Prefix" $false "Invalid or missing prefix: $npmPrefix" "Set npm prefix with: npm config set prefix <valid-path>"
            $allTestsPassed = $false
        }
        
        if ($npmCache -and (Test-Path $npmCache)) {
            Write-TestResult "npm Cache Directory" $true "Cache: $npmCache"
        } else {
            Write-TestResult "npm Cache Directory" $false "Invalid or missing cache: $npmCache" "Set npm cache with: npm config set cache <valid-path>"
            $allTestsPassed = $false
        }
        
        if ($npmGlobalModules -eq "true") {
            Write-TestResult "npm Global Mode" $true "Global mode enabled"
        } else {
            Write-TestResult "npm Global Mode" $false "Global mode not properly configured" "Ensure global mode is enabled"
            $allTestsPassed = $false
        }
    } catch {
        Write-TestResult "npm Configuration" $false "Error checking npm config: $($_.Exception.Message)" "Check npm installation"
        $allTestsPassed = $false
    }
    
    # Test 6: Additional system checks
    Write-Status "`nTest 6: Additional system checks..." "Info"
    
    # Check Node.js version
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            $versionNumber = $nodeVersion -replace '^v', ''
            $majorVersion = [int]($versionNumber.Split('.')[0])
            
            if ($majorVersion -ge 16) {
                Write-TestResult "Node.js Version" $true "Version: $nodeVersion (compatible)"
            } else {
                Write-TestResult "Node.js Version" $false "Version: $nodeVersion (incompatible, requires v16+)" "Upgrade Node.js to version 16 or higher"
                $allTestsPassed = $false
            }
        } else {
            Write-TestResult "Node.js Version" $false "Node.js not found" "Install Node.js from https://nodejs.org/"
            $allTestsPassed = $false
        }
    } catch {
        Write-TestResult "Node.js Version" $false "Error checking Node.js: $($_.Exception.Message)" "Verify Node.js installation"
        $allTestsPassed = $false
    }
    
    # Check npm version
    try {
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-TestResult "npm Version" $true "Version: $npmVersion"
        } else {
            Write-TestResult "npm Version" $false "npm not found" "Install or repair npm"
            $allTestsPassed = $false
        }
    } catch {
        Write-TestResult "npm Version" $false "Error checking npm: $($_.Exception.Message)" "Verify npm installation"
        $allTestsPassed = $false
    }
    
    # Summary
    Write-Status "`n========================================" "Header"
    Write-Status "VERIFICATION SUMMARY" "Header"
    Write-Status "========================================" "Header"
    
    if ($allTestsPassed) {
        Write-Status "`n✅ ALL TESTS PASSED!" "Success"
        Write-Status "Your Gemini CLI installation is working correctly." "Success"
    } else {
        Write-Status "`n❌ SOME TESTS FAILED" "Failure"
        Write-Status "Please address the issues listed above." "Failure"
        Write-Host ""
        Write-Status "Common fixes:" "Warning"
        Write-Status "1. Reinstall Gemini CLI: npm uninstall -g @google/generative-ai-cli && npm install -g @google/generative-ai-cli" "Info"
        Write-Status "2. Restart your terminal/command prompt" "Info"
        Write-Status "3. Verify PATH includes npm global directory" "Info"
        Write-Status "4. Clear npm cache: npm cache clean --force" "Info"
    }
    
    Write-Host ""
    Write-Status "For additional help, visit: https://github.com/google/generative-ai-cli" "Info"
}

# Run the verification
Start-Verification

# Keep window open if run from double-click
if ($Host.Name -eq "ConsoleHost") {
    Write-Host "`nPress any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}