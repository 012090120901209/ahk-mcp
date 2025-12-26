# MCP Server Test Script
# Tests that the server starts and responds to MCP protocol

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$serverPath = Join-Path $repoRoot "dist\server.js"

Write-Host "Testing AHK MCP Server..." -ForegroundColor Cyan
Write-Host "Server: $serverPath" -ForegroundColor Gray

if (-not (Test-Path $serverPath)) {
    Write-Host "ERROR: Server not found at $serverPath" -ForegroundColor Red
    Write-Host "Run 'npm run build' first" -ForegroundColor Yellow
    exit 1
}

# MCP Initialize request
$initRequest = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

Write-Host "`nStarting server process..." -ForegroundColor Yellow

try {
    # Start server process
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "node"
    $psi.Arguments = "`"$serverPath`""
    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true
    $psi.WorkingDirectory = $repoRoot

    $process = [System.Diagnostics.Process]::Start($psi)

    # Give it a moment to start
    Start-Sleep -Milliseconds 500

    # Check if process is still running
    if ($process.HasExited) {
        Write-Host "`n ERROR: Server crashed on startup!" -ForegroundColor Red
        Write-Host "`nExit Code: $($process.ExitCode)" -ForegroundColor Yellow

        # Read stderr
        $stderr = $process.StandardError.ReadToEnd()
        if ($stderr) {
            Write-Host "`nError Output:" -ForegroundColor Red
            Write-Host $stderr -ForegroundColor Gray
        }

        # Read stdout (might have error info)
        $stdout = $process.StandardOutput.ReadToEnd()
        if ($stdout) {
            Write-Host "`nStandard Output:" -ForegroundColor Yellow
            Write-Host $stdout -ForegroundColor Gray
        }

        exit 1
    }

    Write-Host "Server running (PID: $($process.Id))" -ForegroundColor Green
    Write-Host "Sending initialize request..." -ForegroundColor Yellow

    # Send init request
    $process.StandardInput.WriteLine($initRequest)
    $process.StandardInput.Flush()

    # Wait for response (with timeout)
    $output = ""
    $timeout = [DateTime]::Now.AddSeconds(5)

    while ([DateTime]::Now -lt $timeout -and -not $process.HasExited) {
        if ($process.StandardOutput.Peek() -ge 0) {
            $output = $process.StandardOutput.ReadLine()
            break
        }
        Start-Sleep -Milliseconds 100
    }

    # Capture any stderr
    $stderr = ""
    while ($process.StandardError.Peek() -ge 0) {
        $stderr += $process.StandardError.ReadLine() + "`n"
    }

    # Kill server if still running
    if (-not $process.HasExited) {
        $process.Kill()
    }

    if ($stderr) {
        Write-Host "`nServer Logs (stderr):" -ForegroundColor Gray
        Write-Host $stderr -ForegroundColor DarkGray
    }

    if ($output) {
        # Check if valid JSON response
        try {
            $json = $output | ConvertFrom-Json
            if ($json.result) {
                Write-Host "`n SUCCESS: Server responded correctly!" -ForegroundColor Green
                Write-Host "`nServer Info:" -ForegroundColor Cyan
                Write-Host "  Name: $($json.result.serverInfo.name)" -ForegroundColor White
                Write-Host "  Version: $($json.result.serverInfo.version)" -ForegroundColor White
            } elseif ($json.error) {
                Write-Host "`n ERROR: Server returned error" -ForegroundColor Red
                Write-Host "  Code: $($json.error.code)" -ForegroundColor Yellow
                Write-Host "  Message: $($json.error.message)" -ForegroundColor Yellow
            } else {
                Write-Host "`n WARNING: Unexpected response format" -ForegroundColor Yellow
                Write-Host $output
            }
        } catch {
            Write-Host "`n ERROR: Invalid JSON response" -ForegroundColor Red
            Write-Host "Response: $output" -ForegroundColor Gray
        }
    } else {
        Write-Host "`n ERROR: No response from server" -ForegroundColor Red
    }

} catch {
    Write-Host "`n ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n--- MCP Jam Config ---" -ForegroundColor Cyan
Write-Host "Server Name: ahk-mcp"
Write-Host "Connection:  STDIO"
Write-Host "Command:     node $serverPath"
Write-Host ""
