# Playwright Multi-Role E2E Browser Testing Suite

This suite verifies that the Smart Campus AI frontend (`http://localhost:5174`) renders and behaves correctly across all 6 authenticated roles in both **Light Mode** and **Pitch Black OLED Dark Mode**.

---

## 1. Verified Role Navigation Matrix

| Role | Login Screen Entry | Quick Login Action | Destination Route | Key Interactive Components Tested | Verified Viewport |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Student** | `/login` | `student1@campus.com` | `/dashboard` | Academic stats, Today's lectures, Gate Pass button, Safe-bunk meter | Desktop (1920x1080) & Mobile |
| **Faculty** | `/login` | `faculty1@campus.com` | `/faculty` | Teaching schedule, Roster fetch, Attendance marking, Assignment reviewer | Desktop (1920x1080) |
| **HOD** | `/login` | `hod1@campus.com` | `/hod` | Department analytics, Forwarded leave approvals, Faculty presence drawer | Desktop (1920x1080) |
| **Admin** | `/login` | `admin@campus.com` | `/admin` | Institutional telemetry, Core Hub, Master pass audit, Timetable scheduler | Desktop (1920x1080) |
| **Security**| `/login` | `security@campus.com` | `/gate-security` | RFID scanner, Authorize Exit / Return buttons, Overdue incident trigger | Desktop (1920x1080) |
| **Guardian**| `/login` | `guardian@campus.com` | `/guardian-gate-pass`| Ward pending leave inspection, 6-digit SMS OTP input, Parent consent | Desktop & Mobile |

---

## 2. Playwright Verification Commands (via Playwright MCP)

Each role is tested against live Chromium sessions:
1. **Navigate to Login**:
   `browser_navigate(url="http://localhost:5174/login")`
2. **Execute Quick Login**:
   `browser_click(target="button:has-text('Student')")`
3. **Verify Route & Elements**:
   Verify URL equals `/dashboard` and header renders user badge.
4. **Theme Toggling**:
   `browser_click(target="button:has-text('Dark')")`
   Verify pitch-black background `#000000` and high-contrast card borders `#262626`.
5. **Capture Visual Proof**:
   `browser_take_screenshot(full_page=false)`
