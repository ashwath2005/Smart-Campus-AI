# Ralph Autonomous Development Loop — Smart Campus

A controlled, finite-iteration AI development feedback loop designed to prevent runaway execution while ensuring test-driven convergence.

## Core Principles
1. **Finite Iteration Cap**: Default and maximum limit is **10 iterations**. Runaway loops are strictly forbidden.
2. **Emergency Stop**: Creating `.ralph/EMERGENCY_STOP` will immediately halt the loop on the next check.
3. **Deterministic Termination**: The loop terminates immediately upon passing all validation checks (exit code 0).
4. **Logged Audit Trail**: Every run produces structured logs in `.ralph/logs/` and updates `.ralph/state.json`.

## Usage Commands

### Normal Run
```powershell
powershell -ExecutionPolicy Bypass -File .ralph\run-loop.ps1
```

### Dry Run (Simulated verification without changes)
```powershell
powershell -ExecutionPolicy Bypass -File .ralph\run-loop.ps1 -DryRun
```

### Emergency Stop
To abort a running loop instantly:
```powershell
New-Item -ItemType File -Path .ralph\EMERGENCY_STOP
```

To clear emergency stop for future runs:
```powershell
Remove-Item -Force .ralph\EMERGENCY_STOP
```
