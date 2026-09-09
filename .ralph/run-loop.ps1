param (
    [int]$MaxIterations = 10,
    [switch]$DryRun,
    [string]$Command = ""
)

$ErrorActionPreference = "Stop"
$ralphDir = $PSScriptRoot
$configPath = Join-Path $ralphDir "config.json"
$emergencyStopPath = Join-Path $ralphDir "EMERGENCY_STOP"
$statePath = Join-Path $ralphDir "state.json"
$logsDir = Join-Path $ralphDir "logs"

if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

# Safety clamp: Max iterations cannot exceed 10
if ($MaxIterations -gt 10 -or $MaxIterations -lt 1) {
    $MaxIterations = 10
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "            RALPH AUTONOMOUS DEVELOPMENT LOOP               " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Target Workspace : d:\FInal Year"
Write-Host "Iteration Limit  : $MaxIterations (Hard capped at 10)"
Write-Host "Emergency Stop   : $emergencyStopPath"
Write-Host "State File       : $statePath"
Write-Host "Dry Run Mode     : $DryRun"
Write-Host "============================================================`n"

# Remove stale emergency stop if user wants fresh run, or notify if active
if (Test-Path $emergencyStopPath) {
    Write-Host "[ALERT] Emergency stop file exists ($emergencyStopPath)." -ForegroundColor Red
    Write-Host "To proceed, remove the emergency stop file: Remove-Item .ralph\EMERGENCY_STOP" -ForegroundColor Yellow
    exit 2
}

$state = @{
    status = "RUNNING"
    started_at = (Get-Date).ToString("o")
    max_iterations = $MaxIterations
    current_iteration = 0
    history = @()
}

$currentIter = 1
$passed = $false

while ($currentIter -le $MaxIterations) {
    Write-Host "------------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host ">>> ITERATION $currentIter OF $MaxIterations" -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------" -ForegroundColor DarkCyan

    # 1. Emergency Stop Check
    if (Test-Path $emergencyStopPath) {
        Write-Host "`n[EMERGENCY STOP TRIGGERED] Aborting Ralph loop immediately!" -ForegroundColor Red
        $state.status = "EMERGENCY_STOPPED"
        $state.ended_at = (Get-Date).ToString("o")
        $state | ConvertTo-Json -Depth 5 | Set-Content -Path $statePath -Encoding utf8
        exit 2
    }

    $iterStartTime = (Get-Date).ToString("o")
    $logFile = Join-Path $logsDir "iteration-$currentIter.log"

    if ($DryRun) {
        Write-Host "[DRY RUN] Simulating test execution and validation step..." -ForegroundColor Green
        Start-Sleep -Milliseconds 500
        $exitCode = 0
        "DRY RUN: Iteration $currentIter passed simulated tests." | Out-File -FilePath $logFile -Encoding utf8
    } else {
        Write-Host "Running verification suite..." -ForegroundColor Gray
        $testScript = Join-Path $ralphDir "scripts\run-tests.ps1"
        
        $process = Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$testScript`"" -NoNewWindow -PassThru -Wait -RedirectStandardOutput $logFile -RedirectStandardError (Join-Path $logsDir "iteration-$currentIter.err.log")
        $exitCode = $process.ExitCode
        
        if (Test-Path $logFile) {
            Get-Content $logFile -Tail 15 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        }
    }

    $iterRecord = @{
        iteration = $currentIter
        timestamp = $iterStartTime
        exit_code = $exitCode
        log = $logFile
        passed = ($exitCode -eq 0)
    }
    $state.history += $iterRecord
    $state.current_iteration = $currentIter

    if ($exitCode -eq 0) {
        Write-Host "`n[SUCCESS] Tests PASSED on iteration $currentIter!" -ForegroundColor Green
        $passed = $true
        $state.status = "COMPLETED_SUCCESS"
        $state.ended_at = (Get-Date).ToString("o")
        $state | ConvertTo-Json -Depth 5 | Set-Content -Path $statePath -Encoding utf8
        break
    } else {
        Write-Host "`n[FAIL] Iteration $currentIter failed with exit code $exitCode." -ForegroundColor Red
        Write-Host "Log recorded at: $logFile" -ForegroundColor DarkGray
        if ($currentIter -lt $MaxIterations) {
            Write-Host "Proceeding to next iteration for fixes...`n" -ForegroundColor Yellow
        }
    }

    $currentIter++
}

if (-not $passed -and $state.status -ne "EMERGENCY_STOPPED") {
    Write-Host "`n============================================================" -ForegroundColor Red
    Write-Host "[HALTED] Ralph Loop reached maximum iterations ($MaxIterations) without passing." -ForegroundColor Red
    Write-Host "Stopping safely to prevent infinite loops." -ForegroundColor Yellow
    Write-Host "Review logs in: $logsDir" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Red
    $state.status = "MAX_ITERATIONS_REACHED"
    $state.ended_at = (Get-Date).ToString("o")
    $state | ConvertTo-Json -Depth 5 | Set-Content -Path $statePath -Encoding utf8
    exit 1
}

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "            RALPH LOOP EXECUTION COMPLETE                   " -ForegroundColor Green
Write-Host "============================================================`n"
exit 0
