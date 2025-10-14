# Restart AHK-MCP Server
# Kills the hung MCP server process and Claude Desktop will auto-restart it

Write-Host "Finding AHK-MCP server process..." -ForegroundColor Cyan

# Find all node.exe processes running the MCP server
$mcpProcesses = Get-WmiObject Win32_Process -Filter "name = 'node.exe'" | Where-Object {
    $_.CommandLine -like "*ahk-mcp*" -or
    $_.CommandLine -like "*dist\index.js*" -or
    $_.CommandLine -like "*dist\server.js*"
}

if ($mcpProcesses) {
    foreach ($proc in $mcpProcesses) {
        Write-Host "Killing process $($proc.ProcessId): $($proc.CommandLine)" -ForegroundColor Yellow
        Stop-Process -Id $proc.ProcessId -Force
    }
    Write-Host "`nMCP server killed. Claude Desktop will auto-restart it." -ForegroundColor Green
    Write-Host "Wait 5 seconds, then try an AHK tool call." -ForegroundColor Green
} else {
    Write-Host "No MCP server process found. It may have already crashed." -ForegroundColor Red
    Write-Host "Try manually restarting Claude Desktop (File -> Quit, then relaunch)" -ForegroundColor Yellow
}
