# Smart Campus AI — Uncovered Actions & Implementation Gap Analysis

This document identifies UI actions, endpoints, or speculative workflows discovered during the testability audit that are either partially implemented, rely on external third-party keys, or have no active database mutations.

---

## 1. Action Inventory & Coverage Gap Table

| Action / Feature | Source Location | Discovered Implementation Reality | Handled by Test Suite? | Rationale & Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Live Biometric Face Recognition at Gate** | Speculative UI Concept | The system uses **Cryptographic Minimal-PII Signed QR Tokens & RFID Simulation** rather than live camera face scanning. | Yes (Tested via Token / QR) | The actual codebase implements digital pass QR scanning via `/gate-pass/exit` and `/gate-pass/return`. Face recognition is not implemented in Python/FastAPI. |
| **Direct Parent Payment Gateway for Fines** | Student Dashboard | Not implemented in backend models or routers. | No | No payment gateway SDK (Razorpay/Stripe) is installed or wired to MySQL. |
| **Gemini Live AI Summarization of 100MB PDFs** | `/ai/summarize-pdf` | Implemented with PyMuPDF text extraction; requires active `GEMINI_API_KEY` in `.env`. | Yes (with graceful offline fallback) | Test suite includes fallback handling when external Google AI quota or key is not provided. |
| **Bulk Student Excel Ingestion with Roll Allocation** | `/admin/data-import` | Backend accepts CSV and Excel formats via `openpyxl`; requires strict column schemas (`name, email, roll_number, department`). | Yes | Tested via admin import routes. |
| **Real-Time WebSocket Presence Broadcast** | `/ws/notifications` | Endpoint exists in `main.py` and connects via query parameter token. Reconnect loop runs on frontend. | Yes | Verified via WebSocket connection fixture. |
| **Classroom IoT Sensor Hardware Integration** | Campus Pulse 3D | Telemetry scores are calculated mathematically by `CampusPulseEngine` using real database counts (active sessions, room bookings, attendance). | Yes | Real DB calculation verified; physical IoT sensors are simulated via software metrics. |

---

## 2. UI Button-to-Backend State Mapping

| UI Action / Button | Component | Backend Endpoint Called | Database Record Mutated | Status |
| :--- | :--- | :--- | :--- | :--- |
| **"Authorize Exit"** | `GateSecurity.jsx` | `POST /gate-pass/exit` | `gate_passes.status = 'OUT'`, `actual_exit_time = NOW()` | Fully Functional |
| **"Authorize Return"** | `GateSecurity.jsx` | `POST /gate-pass/return` | `gate_passes.status = 'RETURNED'`, `actual_return_time = NOW()` | Fully Functional |
| **"Trigger Background Overdue Scanner"**| `GateSecurity.jsx` | `POST /gate-pass/check-overdue` | `gate_passes.status = 'OVERDUE'` for expired passes | Fully Functional |
| **"Verify Parent OTP"** | `GuardianGatePass.jsx` | `POST /gate-pass/verify-parent-otp` | `gate_passes.parent_verified = 1`, `status = 'PENDING_WARDEN_APPROVAL'` | Fully Functional |
| **"1-Click Warden Approve"** | `GatePassAdmin.jsx` | `POST /gate-pass/warden-action` | `gate_passes.warden_approved = 1`, `status = 'APPROVED'` | Fully Functional |
| **"Apply Leave"** | `StudentWorkflows.jsx` | `POST /workflows/leaves` | `student_leaves` (status: `Pending Faculty Review`) | Fully Functional |
| **"Forward to HOD"** | `StudentWorkflows.jsx` | `PUT /workflows/leaves/{id}/review` | `student_leaves` (status: `Pending HOD Approval`) | Fully Functional |
| **"HOD Final Approve"** | `HodDashboard.jsx` | `PUT /workflows/leaves/{id}/approve` | `student_leaves` (status: `Approved`) | Fully Functional |
| **"Mark Class Attendance"** | `Attendance.jsx` | `POST /attendance/bulk` | Bulk rows in `attendance` table | Fully Functional |
| **"Submit Assignment"** | `Assignments.jsx` | `POST /assignments/{id}/submit` | `submissions` record with timestamp | Fully Functional |
| **"Grade Submission"** | `Assignments.jsx` | `PUT /assignments/submissions/{id}/grade` | `submissions.marks_obtained` updated | Fully Functional |
