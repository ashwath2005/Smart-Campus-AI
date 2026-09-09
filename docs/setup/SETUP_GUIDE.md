# Smart Campus AI — Setup, Installation & Deployment Guide

## 1. Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher (with npm)
- **Database**: MySQL 8.0+ or MariaDB 10.5+ (SQLite supported as zero-config fallback)

---

## 2. Quick Start (Windows Automated Script)

To launch both backend and frontend servers simultaneously:
```cmd
run_demo.bat
```

This launches:
- **Backend**: `http://127.0.0.1:8000` (FastAPI Swagger at `/docs`)
- **Frontend**: `http://localhost:5174` (React + Vite Client)

---

## 3. Manual Backend Installation

1. Navigate to the backend directory:
   ```powershell
   cd "d:\FInal Year\sci\backend"
   ```

2. Activate virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```

3. Install requirements:
   ```powershell
   pip install -r requirements.txt
   ```

4. Configure environment variables in `.env` (or copy from `.env.example`):
   ```ini
   USE_MYSQL=true
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_DATABASE=smartcampus
   JWT_SECRET=your_secure_secret_key
   ```

5. Seed initial institutional datasets (optional):
   ```powershell
   python seed_data.py
   ```

6. Start FastAPI development server:
   ```powershell
   $env:PYTHONUTF8="1"
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

---

## 4. Manual Frontend Installation

1. Navigate to the frontend directory:
   ```powershell
   cd "d:\FInal Year\sci\frontend"
   ```

2. Install npm dependencies:
   ```powershell
   npm install
   ```

3. Build production bundle:
   ```powershell
   npm run build
   ```

4. Launch Vite development server:
   ```powershell
   npm run dev
   ```

---

## 5. Running Automated Validation Tests

Execute the master 72-test validation suite:
```powershell
cd "d:\FInal Year\sci\backend"
.\venv\Scripts\python.exe -u test_master_suite.py
```
Expected output: **100% SUCCESS RATE (72/72 tests passing)**.
