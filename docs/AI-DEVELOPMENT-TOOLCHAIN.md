# AI Development Toolchain Specification
# Project: Smart Campus AI Management System
# Workspace: `d:\FInal Year`

## 1. Executive Summary & Tool Status Matrix

This document provides the operational specification and architectural integration guide for the AI development toolchain configured locally for the Smart Campus AI Management System.

| Tool | Status | Scope | Role in Workflow | Configuration Path |
| :--- | :--- | :--- | :--- | :--- |
| **GSD (Get Shit Done)** | **INSTALLED** (v1.13.0) | Project-Local (`.agents/`) | Milestone planning, task breakdown, phase gates, context compression | `.agents/skills/`, `.agents/mcp_config.json` |
| **Roo Code** | **NOT COMPATIBLE WITH CURRENT ANTIGRAVITY VERSION** (Evaluated) | Project Config Provided (`.roo/`, `.roomodes`) | External VS Code agent mode definitions; replaced in Antigravity by native agents & collaborative subagents | `.roomodes`, `.roo/rules.md`, `.clinerules` |
| **Ralph Loop** | **INSTALLED** | Project-Local (`.ralph/`) | Test-driven convergence loop capped at max 10 iterations with emergency stop | `.ralph/config.json`, `.ralph/run-loop.ps1` |
| **CodeRabbit** | **INSTALLED** | Project-Local (`.agents/plugins/`, `.coderabbit.yaml`) | Automated code review, security audits, PR checks, and agent autofix | `.coderabbit.yaml`, `.agents/plugins/coderabbit/`, `.agents/skills/code-review/` |

---

## 2. Multi-Agent Orchestration & Division of Responsibilities

To prevent conflicting edits, infinite loops, and race conditions, the tools are organized into strict sequential stages:

```
[ Developer Prompt ]
         │
         ▼
[ Stage 1: GSD (Get Shit Done) ]
  • Analyzes objectives & codebase
  • Breaks prompt into discrete, manageable subtasks
  • Establishes phase gates & validation criteria
         │
         ▼
[ Stage 2: Antigravity Native Agent / Roo Code Modes ]
  • Interactive code generation & refactoring
  • Modular edits respecting Stitch / Untitled UI designs
  • Subagent delegation (`self`, `research`)
         │
         ▼
[ Stage 3: Ralph Autonomous Loop (Max 10 Iterations) ]
  • Executes frontend build (`npm run build`)
  • Executes backend health & pytest checks
  • Loops if failing (hard capped at 10 iterations)
  • Immediate emergency abort if `.ralph/EMERGENCY_STOP` exists
         │
         ▼
[ Stage 4: CodeRabbit Review & Gatekeeper ]
  • Analyzes Git diffs against `.coderabbit.yaml`
  • Validates security (no leaked secrets, role access checks)
  • Automated feedback & autofix recommendations
         │
         ▼
[ Human Approval & Git Commit ]
```

---

## 3. Tool Details & Local Configuration

### 3.1 GSD (Get Shit Done) v1.13.0
- **Installation Method**: Local execution of `@opengsd/gsd-core@latest` with `--antigravity --local` flags.
- **Location**: `.agents/`
- **Installed Assets**:
  - 72 standardized skills in `.agents/skills/`
  - Manifest and state files: `.agents/gsd-file-manifest.json`, `.agents/gsd-install-state.json`
  - MCP Companion Server configured in `.agents/mcp_config.json`:
    ```json
    "gsd": {
      "command": "npx",
      "args": ["-y", "-p", "@opengsd/gsd-core", "gsd-mcp-server"]
    }
    ```
- **Safety Policy**: Preserved all 250 existing user files without overwrite.

### 3.2 Roo Code Compatibility & Evaluation
- **Evaluation Finding**: In standalone Google Antigravity IDE (Antigravity 2.0 / native agent architecture), third-party VS Code marketplace extensions (`RooVeterinaryInc.roo-cline`) cannot run inside the Antigravity Desktop runtime, and C: drive storage is constrained.
- **Antigravity Alternative**: Native Antigravity pair-programming agent, inline editing tools (`replace_file_content`, `write_to_file`), and parallel subagents (`invoke_subagent`).
- **Workspace Compatibility**: Configured project-level custom modes and rules so that when the project is opened in VS Code with Roo Code, it operates with full project context:
  - Custom modes in `.roomodes`: `campus-architect`, `campus-code`, `campus-qa`.
  - Workspace instructions in `.roo/rules.md` and `.clinerules`.

### 3.3 Ralph Autonomous Convergence Loop
- **Location**: `.ralph/`
- **Architecture**:
  - `config.json`: Project settings, hard iteration cap (`10`), timeout per iteration (`180s`).
  - `run-loop.ps1`: Production PowerShell loop runner supporting normal execution, `-DryRun`, and custom commands.
  - `scripts/run-tests.ps1`: Test execution script verifying React frontend build and Python backend syntax/imports.
  - `EMERGENCY_STOP`: Sentinel file mechanism. If this file is created, any active Ralph loop halts immediately.
  - `state.json` & `logs/`: Structured JSON state tracking and per-iteration logs.
- **Verification**: Verified via dry run and full live verification test (passed cleanly on iteration 1).

### 3.4 CodeRabbit Review & Security Audit
- **Location**: `.coderabbit.yaml`, `.agents/plugins/coderabbit/`, `.agents/skills/code-review/`
- **Integration**:
  - Official CodeRabbit skills cloned from `coderabbitai/skills` repository into `.agents/skills/code-review` and `.agents/skills/autofix`.
  - Official CodeRabbit plugin registered in `.agents/plugins/coderabbit/plugin.json`.
  - Project configuration file `.coderabbit.yaml` customized for Smart Campus:
    - Profile: `assertive`
    - Backend checks: FastAPI routes, SQLAlchemy transaction handling, role-based access control, zero leaked secrets.
    - Frontend checks: React 18 TypeScript type safety, Lucide icon alignment, Tailwind responsiveness, Untitled UI / Stitch consistency.
- **Security**: No API keys or tokens are stored in repository files. CodeRabbit runs securely using local session auth or automated PR triggers.

---

## 4. Project Rules & Policies (`.agents/rules/project-ai-development.md`)

All agents operating in this workspace must adhere to the 25 strict development rules:
1. **Finite Iteration Cap**: Maximum 10 iterations for any loop.
2. **Zero Runaway Loops**: Deterministic exit gates required.
3. **No Conflicting Edits**: Distinct file scoping across concurrent subagents.
4. **Branch Strategy**: Experimental work must occur on feature branches.
5. **State File Locations**: Confined to `.ralph/` and `.agents/`.
6. **Emergency Stop**: `.ralph/EMERGENCY_STOP` halts execution instantly.
7. **Tool Boundary Enforcement**: Tools stay within their defined functional scopes.
8. **File Modification Locks**: Pre-flight verification and surgical modifications.
9. **Context Sharing**: Standardized repo artifacts (`.coderabbit.yaml`, `.ralph/state.json`).
10. **Human Escalation**: Mandatory escalation for DB drops, auth changes, or 3+ repeated failures.
11. **Audit Trail**: Timestamped logs in `.ralph/logs/`.
12. **Pre-Commit Testing**: Mandatory frontend build and backend verification.
13. **Security Checks**: CodeRabbit analysis and zero secrets verification.
14. **Local Dependency Management**: Project-local `npm` and backend `venv` only.
15. **Code Style**: React TypeScript + FastAPI PEP 8 conventions.
16. **Safe Rollback**: Git checkout/restore for rapid remediation.
17. **Workspace Isolation**: Operations strictly confined to `d:\FInal Year`.
18. **Zero Secrets**: All credentials loaded from `.env` (gitignored).
19. **Conventional Commits**: `feat:`, `fix:`, `chore:`, `test:`.
20. **Code Review Checklist**: Correctness, security, design, performance, accessibility.
21. **Performance Budgets**: Frontend build < 30s, API latency < 200ms.
22. **Structured Error Handling**: HTTPException in backend, safe error states in frontend.
23. **Documentation Sync**: Synchronize `docs/` upon architectural changes.
24. **Workspace Hygiene**: Clean temporary and scratch files before task completion.
25. **Verification Before Completion**: Live application inspection and end-to-end testing.

---

## 5. Verified Command Reference

| Action | Command | Working Directory |
| :--- | :--- | :--- |
| **Run Frontend Dev Server** | `npm run dev` | `sci/frontend` |
| **Build Frontend** | `npm run build` | `sci/frontend` |
| **Preview Frontend Build** | `npm run preview` | `sci/frontend` |
| **Run Backend Dev Server** | `.\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000` | `sci/backend` |
| **Run Backend Tests** | `.\venv\Scripts\python.exe -m pytest -q` | `sci/backend` |
| **Run Ralph Loop** | `powershell -ExecutionPolicy Bypass -File .ralph\run-loop.ps1` | Workspace root (`d:\FInal Year`) |
| **Run Ralph Dry Run** | `powershell -ExecutionPolicy Bypass -File .ralph\run-loop.ps1 -DryRun` | Workspace root (`d:\FInal Year`) |
| **Trigger Emergency Stop** | `New-Item -ItemType File -Path .ralph\EMERGENCY_STOP` | Workspace root (`d:\FInal Year`) |
| **Clear Emergency Stop** | `Remove-Item -Force .ralph\EMERGENCY_STOP` | Workspace root (`d:\FInal Year`) |
| **Run CodeRabbit Review** | `coderabbit review --agent` | Workspace root (`d:\FInal Year`) |
| **Check Backend Live Status** | `curl -s http://127.0.0.1:8000/docs` | Any |
| **Check Frontend Live Status**| `curl -s http://localhost:5174` | Any |

---

## 6. Emergency Stop & Troubleshooting Procedures

### Scenario A: Ralph Loop Running Uncontrollably
**Action**: Create the emergency stop file in PowerShell:
```powershell
New-Item -ItemType File -Path .ralph\EMERGENCY_STOP -Force
```
The loop will detect this file and terminate before the next iteration with exit code 2.

### Scenario B: Frontend Build Fails
**Action**:
1. Check the latest log: `Get-Content .ralph\logs\iteration-1.log -Tail 30`
2. Inspect the failed file reported by Vite.
3. Fix the syntax or import error.
4. Run `powershell -ExecutionPolicy Bypass -File .ralph\run-loop.ps1` to verify.

### Scenario C: Backend Port Collision or DB Connection Failure
**Action**:
1. Ensure MySQL service is running locally on port 3306.
2. If MySQL is unavailable, FastAPI automatically falls back to SQLite (`smart_campus.db`).
3. Verify backend status: `Invoke-WebRequest -Uri "http://127.0.0.1:8000/docs"`
