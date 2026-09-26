# 🚀 Smart Campus AI — Team Testing & Bug Hunting Guide

Welcome to the **Smart Campus AI** testing team! This guide contains everything you need to test the application, verify multi-role workflows, and report bugs.

---

## ⚡ Method 1: Instant Access (No Installation Required!)

If you and the project host are on the **same Wi-Fi or mobile hotspot**, you can test directly from your laptop or mobile phone without installing Python or Node.js:

1. Ask the project host for their **Local IP** (shown in their terminal when running `run_demo.bat`).
2. Open your browser and navigate to:
   ```
   http://<HOST_IP>:5175
   ```
3. You can immediately access the full application, test responsive screens, and log in with any role!

---

## 💻 Method 2: Running Locally from Git (Clone & Run)

If you have cloned the repository to your own machine:

### Prerequisites
- **Node.js**: v18 or newer
- **Python**: 3.10 to 3.12
- **Git**

### Step 1: Frontend Setup
```bash
cd sci/frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5175`*

### Step 2: Backend Setup
```bash
cd sci/backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
*Backend runs on `http://localhost:8000` (Swagger docs at `/docs`)*

### 💡 One-Click Run (Windows)
Double-click `run_demo.bat` in the root folder. It starts both servers and automatically detects your LAN IP.

---

## 🔑 Demo Accounts & Credentials

You don't need to manually type credentials — the **Login Page (`/login`)** features **1-Click Quick Login Buttons** for every role!

If entering manually:
| Role | Email / Roll Number | Default Password | Default Landing Page |
| :--- | :--- | :--- | :--- |
| **Student** | `student1@campus.com` | `password123` | `/dashboard` |
| **Faculty** | `faculty1@campus.com` | `password123` | `/faculty` |
| **HOD** | `hod1@campus.com` | `password123` | `/hod` |
| **Warden** | `warden@campus.com` | `password123` | `/hod` |
| **Admin** | `admin@campus.com` | `password123` | `/admin` |
| **Security** | `security@campus.com` | `password123` | `/gate-security` |
| **Guardian** | `guardian@campus.com` | `password123` | `/guardian-gate-pass` |

---

## 🧪 Testing Checklist by Role & Feature

### 1. Student Portal (`student1@campus.com`)
- [ ] **Dashboard (`/dashboard`)**:
  - Check KPI metric cards (Attendance Rate, Campus Pulse).
  - Verify "Academic Velocity" chart bars and hover states.
  - Test Dark / Light theme toggle at the bottom of the sidebar.
- [ ] **Attendance (`/attendance`)**:
  - Verify attendance percentage donut chart.
  - Review subject-wise attendance logs and "Present" / "Absent" badges.
- [ ] **Timetable (`/timetable`)**:
  - Switch between Monday – Saturday tabs.
  - Switch between Daily, Weekly, and Monthly views.
- [ ] **Assignments (`/assignments`)**:
  - Filter by All, Pending, and Submitted.
  - Click "Submit" to test submission dialog.
- [ ] **Gate Pass Engine (`/gate-pass`)**:
  - Request a Day Outpass (< 4 Hours).
  - Check Explainable Decision Engine policy checklist (attendance threshold, timetable conflicts).
  - Verify instant QR HMAC generation upon approval.
- [ ] **Campus Pulse 3D (`/campus-pulse`)**:
  - Rotate, pan, and zoom the 3D campus digital twin.
  - Click building hotspots (e.g., Academic Complex, Learning Centre).
  - Switch between 3D Digital Twin and 2D Density Matrix modes.
- [ ] **AI Assistant (`/ai-assistant`)**:
  - Ask campus-related questions and test real-time responses.
- [ ] **Command Palette (`Ctrl+K` or `Cmd+K`)**:
  - Search routes and jump between pages using keyboard navigation.

### 2. Faculty Portal (`faculty1@campus.com`)
- [ ] View scheduled lectures and student attendance rates.
- [ ] Test attendance entry and marking.
- [ ] Test assignment creation and internal marks review.

### 3. HOD & Warden (`hod1@campus.com` / `warden@campus.com`)
- [ ] Review pending student gate pass and outpass requests.
- [ ] Test approval / rejection workflow.

### 4. Gate Security Guard (`security@campus.com`)
- [ ] Open `/gate-security`.
- [ ] Test QR code scanner and verification against student gate passes.

### 5. Admin Console (`admin@campus.com`)
- [ ] **Dashboard (`/admin`)**: Verify real-time system metrics, WebSocket status, and quick actions.
- [ ] **Core Hub**: Review registered users and departments.
- [ ] **Data Import**: Check CSV/data import workflows.
- [ ] **Timetable Generator**: Test schedule generation engine.

### 6. Mobile & Cross-Device Responsiveness
- [ ] Open the app on a mobile device or inspect at `375px` width.
- [ ] Verify hamburger menu opens the slide-over sidebar cleanly.
- [ ] Verify no horizontal content overflows or clipped cards.

---

## 🐛 Bug Report Template

When you discover an issue, please share a report using the format below:

```markdown
### 🐞 Bug Title: [Brief 1-line description]

- **Role / User**: (e.g., Student, Admin, Anonymous)
- **Page URL**: (e.g., /gate-pass or /timetable)
- **Device / Browser**: (e.g., Chrome Windows, Safari iOS, Firefox)
- **Theme**: Dark / Light

#### Steps to Reproduce:
1. Log in as ...
2. Navigate to ...
3. Click on ...

#### Expected Result:
[What should have happened]

#### Actual Result:
[What actually happened or went wrong]

#### Error Log / Screenshot:
[Attach screenshot or paste console errors (F12 > Console)]
```
