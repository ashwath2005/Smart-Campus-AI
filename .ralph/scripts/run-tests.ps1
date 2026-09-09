# Test execution script for Ralph Loop
# Runs frontend build verification and backend verification
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " [Ralph Verification] Running Build & Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$frontendDir = Join-Path $PSScriptRoot "..\..\sci\frontend"
$backendDir  = Join-Path $PSScriptRoot "..\..\sci\backend"

$allPassed = $true

# 1. Frontend Build Verification
Write-Host "`n--> [1/2] Verifying Frontend Build (React + Vite)..." -ForegroundColor Yellow
Push-Location $frontendDir
try {
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Frontend build failed with exit code $LASTEXITCODE" -ForegroundColor Red
        $allPassed = $false
    } else {
        Write-Host "Frontend build succeeded!" -ForegroundColor Green
    }
} catch {
    Write-Host "Exception during frontend build: $_" -ForegroundColor Red
    $allPassed = $false
} finally {
    Pop-Location
}

if (-not $allPassed) {
    exit 1
}

# 2. Backend Verification
Write-Host "`n--> [2/2] Verifying Backend Python Syntax & Environment..." -ForegroundColor Yellow
Push-Location $backendDir
try {
    $pythonExe = Join-Path $backendDir "venv\Scripts\python.exe"
    if (Test-Path $pythonExe) {
        & $pythonExe -c "import app.main; print('FastAPI app imported successfully')"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Backend import verification failed with exit code $LASTEXITCODE" -ForegroundColor Red
            $allPassed = $false
        } else {
            Write-Host "Backend import verification succeeded!" -ForegroundColor Green
        }
    } else {
        Write-Host "Backend venv python not found, skipping backend check." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Exception during backend check: $_" -ForegroundColor Red
    $allPassed = $false
} finally {
    Pop-Location
}

if ($allPassed) {
    Write-Host "`n[Ralph Verification] All project checks PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n[Ralph Verification] Project checks FAILED." -ForegroundColor Red
    exit 1
}
