# NOTIFICATION MATRIX SPECIFICATION
## Smart Campus AI Management System — Event Catalog, Delivery Channels, & Payload Schemas

**Document Version:** 1.0.0  
**Date:** September 2026  
**Infrastructure:** WebSockets (`/ws/notifications`), In-App Notification Center, Simulated SMS/Email Gateway

---

## 1. Event Registry & Notification Channels

| Event Identifier | Trigger Action | Recipient Role(s) | Delivery Channel(s) | Priority | Audio Alert |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `GATE_PASS_OTP_DISPATCH` | Student requests pass needing parent consent | `GUARDIAN` | In-App, SMS, Push | **HIGH** | Yes |
| `GATE_PASS_ESCALATED_HOD`| Parent enters valid OTP | `HOD` | In-App, WebHook | **MEDIUM** | No |
| `GATE_PASS_DECIDED` | HOD approves or rejects pass | `STUDENT`, `GUARDIAN` | In-App, WebSocket | **HIGH** | Yes |
| `STUDENT_GATE_EXIT` | Security officer scans exit at checkpoint | `GUARDIAN`, `STUDENT` | In-App, SMS, WebSocket | **CRITICAL** | Yes |
| `STUDENT_GATE_RETURN` | Security officer scans return at gate | `GUARDIAN`, `STUDENT` | In-App, SMS, WebSocket | **HIGH** | No |
| `GATE_PASS_OVERDUE` | System detects pass unreturned past curfew | `GUARDIAN`, `HOD`, `SECURITY` | In-App, SMS, WebSocket | **CRITICAL** | Yes |
| `ATTENDANCE_RECORDED` | Faculty submits session attendance | `STUDENT` | In-App, WebSocket | **LOW** | No |
| `ATTENDANCE_RISK_ALERT` | Student cumulative attendance drops < 75% | `STUDENT`, `GUARDIAN`, `HOD` | In-App, SMS, WebSocket | **CRITICAL** | Yes |
| `LEAVE_STATUS_UPDATE` | Faculty endorses or HOD decides leave/OD | `STUDENT`, `FACULTY` | In-App, WebSocket | **MEDIUM** | No |
| `COURSEWORK_GRADED` | Faculty grades student assignment | `STUDENT` | In-App, WebSocket | **LOW** | No |
| `SECURITY_INCIDENT_ALERT`| Security officer reports perimeter incident | `ADMIN`, `SECURITY` | In-App, WebSocket HUD | **CRITICAL** | Yes |
| `EMERGENCY_LOCKDOWN` | Administrator invokes campus emergency | `ALL_ROLES` | Universal Broadcast, Audio Siren | **MAXIMUM** | Yes |

---

## 2. Standard Event Payload Schema

All notifications delivered over WebSockets and persisted to the database conform to this JSON schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SmartCampusNotificationEvent",
  "type": "object",
  "required": ["event_id", "type", "priority", "recipient_id", "title", "message", "timestamp", "metadata"],
  "properties": {
    "event_id": { "type": "string", "format": "uuid" },
    "type": { "type": "string" },
    "priority": { "type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL", "MAXIMUM"] },
    "recipient_id": { "type": "integer" },
    "recipient_role": { "type": "string" },
    "title": { "type": "string" },
    "message": { "type": "string" },
    "read": { "type": "boolean", "default": false },
    "timestamp": { "type": "string", "format": "date-time" },
    "action_url": { "type": "string" },
    "metadata": {
      "type": "object",
      "properties": {
        "pass_id": { "type": "integer" },
        "student_id": { "type": "integer" },
        "student_name": { "type": "string" },
        "roll_number": { "type": "string" },
        "course_code": { "type": "string" },
        "attendance_pct": { "type": "number" },
        "gate_name": { "type": "string" },
        "otp": { "type": "string" }
      }
    }
  }
}
```

---

## 3. Detailed Notification Flow Scenarios

### 3.1 Scenario: Gate Pass Exit Alert
- **Recipient:** Guardian (`gdn_001`)
- **Title:** `Campus Exit Confirmed: Rahul Sharma`
- **Body:** `Your ward Rahul Sharma (CS001) has departed campus via Main Gate at 16:05 hrs. Valid until 20:00 hrs.`
- **Action URL:** `/guardian-gate-pass`
- **Priority:** `CRITICAL`
- **WebSocket Frame:**
  ```json
  {
    "type": "NOTIFICATION",
    "event": "STUDENT_GATE_EXIT",
    "payload": {
      "title": "Campus Exit Confirmed: Rahul Sharma",
      "message": "Departed Main Gate at 16:05. Curfew: 20:00.",
      "ward_status": "OUT_OF_CAMPUS",
      "timestamp": "2026-09-10T16:05:00Z"
    }
  }
  ```

### 3.2 Scenario: Attendance Risk Alert
- **Recipient:** Guardian (`gdn_001`)
- **Title:** `Academic Warning: Low Attendance in CS301`
- **Body:** `Rahul Sharma's attendance in CS301 - Operating Systems has dropped to 74.8% (below mandatory 75% threshold). Please review.`
- **Action URL:** `/guardian-gate-pass`
- **Priority:** `CRITICAL`

### 3.3 Scenario: HOD Pass Escalation
- **Recipient:** HOD (`hod_cse_01`)
- **Title:** `Gate Pass Approval Required: Rahul Sharma (CS001)`
- **Body:** `Parent consent verified by OTP. Outing window: 16:00 - 20:00. AI Risk Score: Low (14%).`
- **Action URL:** `/hod`
- **Priority:** `MEDIUM`

---

## 4. Fallback & Offline Handling
If a user is not currently connected to `/ws/notifications`:
1. The notification is stored in the `Notification` table with `is_read = FALSE`.
2. Upon next authentication or socket connection, the client issues a `GET /api/v1/notifications/unread` request to hydrate the notification center and badge counts.
3. Critical and Maximum events trigger simulated SMS dispatch to guardian mobile numbers.
