# Monitor Server Debug Logs
# Run this script to see login attempts and sync events in real-time.

$logPath = "e:\B2B 44\triponic-b2b\server\debug.log"

Write-Host "Monitoring log file: $logPath" -ForegroundColor Cyan
Write-Host "Waiting for new events... (Press Ctrl+C to stop)" -ForegroundColor Gray

Get-Content $logPath -Wait -Tail 20 | ForEach-Object {
    if ($_ -match "\[Login Success\]") {
        Write-Host $_ -ForegroundColor Green
    } elseif ($_ -match "\[Login Sync\]" -or $_ -match "Self-Healing") {
        Write-Host $_ -ForegroundColor Yellow
    } elseif ($_ -match "Error" -or $_ -match "Failed") {
        Write-Host $_ -ForegroundColor Red
    } else {
        Write-Host $_
    }
}
