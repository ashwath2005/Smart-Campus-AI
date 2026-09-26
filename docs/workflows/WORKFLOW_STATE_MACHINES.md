# WORKFLOW STATE MACHINES SPECIFICATION
## Smart Campus AI Management System — Mathematical Finite State Machines, Guards, & Invariants

**Document Version:** 1.0.0  
**Date:** September 2026  
**Formalism:** Deterministic Finite Automata (DFA) with Guard Conditions & Transition Invariants

---

## 1. Gate Pass Finite State Machine (`GatePassFSM`)

### 1.1 State Space Definition
Let the state space $S_{\text{GP}}$ be defined as:
$$S_{\text{GP}} = \{\text{REQUESTED}, \text{PENDING\_PARENT\_OTP}, \text{PENDING\_HOD\_APPROVAL}, \text{APPROVED}, \text{OUT}, \text{RETURNED}, \text{OVERDUE}, \text{REJECTED}, \text{CANCELLED}, \text{EXPIRED}\}$$

- **Initial State:** $s_0 = \text{REQUESTED}$
- **Terminal States:** $S_{\text{term}} = \{\text{RETURNED}, \text{OVERDUE}, \text{REJECTED}, \text{CANCELLED}, \text{EXPIRED}\}$

```
                                    +-------------+
                                    |  REQUESTED  |
                                    +-------------+
                                     /           \
               [Requires Parent OTP] /             \ [Direct HOD]
                                    v               v
             +--------------------+            +-----------------------+
             | PENDING_PARENT_OTP |            | PENDING_HOD_APPROVAL  |
             +--------------------+            +-----------------------+
                |              |                           |
    [OTP Reject]|              |[OTP Verify]               |
                v              +------------+              |
          +----------+                      |              |
          | REJECTED |                      v              |
          +----------+            +-----------------------+
                                  | PENDING_HOD_APPROVAL  |
                                  +-----------------------+
                                    /                   \
                      [HOD Reject] /                     \ [HOD Approve]
                                  v                       v
                            +----------+            +------------+
                            | REJECTED |            |  APPROVED  |
                            +----------+            +------------+
                                                          |
                                                          | [Security Scan Exit]
                                                          v
                                                    +------------+
                                                    |    OUT     |
                                                    +------------+
                                                     /          \
                                [Scan Return on-time]/            \ [Scan Return past valid_until]
                                                    v              v
                                             +----------+   +---------+
                                             | RETURNED |   | OVERDUE |
                                             +----------+   +---------+
```

### 1.2 Transition Table & Guards

| Current State | Event / Trigger | Target State | Authorized Actor | Guard Conditions |
| :--- | :--- | :--- | :--- | :--- |
| $\emptyset$ | `create_pass` | `REQUESTED` | `STUDENT`, `ADMIN` | Student has no active/unreturned passes; Departure $\ge$ Now. |
| `REQUESTED` | `route_policy` | `PENDING_PARENT_OTP` | `SYSTEM` | Policy requires parent consent (Overnight, Weekday curfew). |
| `REQUESTED` | `route_policy` | `PENDING_HOD_APPROVAL` | `SYSTEM` | Policy does not require parent consent. |
| `PENDING_PARENT_OTP`| `verify_parent_otp`| `PENDING_HOD_APPROVAL`| `GUARDIAN` | OTP matches cryptographic hash; $\text{now} \le \text{otp\_expires\_at}$; Linked Ward. |
| `PENDING_PARENT_OTP`| `reject_parent_otp`| `REJECTED` | `GUARDIAN` | Linked Ward; Reason provided. |
| `PENDING_HOD_APPROVAL`| `hod_approve` | `APPROVED` | `HOD`, `ADMIN` | Current user department matches student department. |
| `PENDING_HOD_APPROVAL`| `hod_reject` | `REJECTED` | `HOD`, `ADMIN` | Department matches; Justification recorded. |
| `APPROVED` | `security_scan_exit`| `OUT` | `SECURITY`, `ADMIN` | $\text{valid\_from} - 30\text{m} \le \text{now} \le \text{valid\_until}$; Gate active. |
| `APPROVED` | `cancel_pass` | `CANCELLED` | `STUDENT` | $\text{now} < \text{valid\_from}$. |
| `APPROVED` | `system_expire` | `EXPIRED` | `SYSTEM` | $\text{now} > \text{valid\_until} \land \text{actual\_departure} \text{ IS NULL}$. |
| `OUT` | `security_scan_return`| `RETURNED` | `SECURITY`, `ADMIN` | $\text{now} \le \text{valid\_until} + \text{grace\_period}$. |
| `OUT` | `security_scan_return`| `OVERDUE` | `SECURITY`, `ADMIN` | $\text{now} > \text{valid\_until} + \text{grace\_period}$. |

### 1.3 State Invariants
1. **Uniqueness:** A student may have at most ONE pass in status $\in \{\text{REQUESTED}, \text{PENDING\_PARENT\_OTP}, \text{PENDING\_HOD\_APPROVAL}, \text{APPROVED}, \text{OUT}\}$.
2. **Physical Feasibility:** A pass cannot transition to `OUT` if `actual_departure` already has a timestamp.
3. **QR Token Validity:** QR codes are only cryptographically verifiable when status is `APPROVED` or `OUT`.

---

## 2. Student Leave / On-Duty State Machine (`LeaveODFSM`)

### 2.1 State Space Definition
$$S_{\text{Leave}} = \{\text{DRAFT}, \text{PENDING\_ADVISOR}, \text{PENDING\_HOD}, \text{APPROVED}, \text{REJECTED}, \text{CANCELLED}\}$$

```
+-------+               +-----------------+               +---------------+               +----------+
| DRAFT | ---apply--->  | PENDING_ADVISOR | ---endorse--> |  PENDING_HOD  | ---approve--> | APPROVED |
+-------+               +-----------------+               +---------------+               +----------+
                            |                                 |
                            +---reject----+                   +---reject----+
                                          |                                 |
                                          v                                 v
                                    +----------+                      +----------+
                                    | REJECTED |                      | REJECTED |
                                    +----------+                      +----------+
```

### 2.2 Transition Table & Guards

| Current State | Event | Target State | Actor | Guard Conditions |
| :--- | :--- | :--- | :--- | :--- |
| `DRAFT` | `submit_application` | `PENDING_ADVISOR` | `STUDENT` | Dates valid; End Date $\ge$ Start Date; Supporting files provided if medical. |
| `PENDING_ADVISOR` | `endorse` | `PENDING_HOD` | `FACULTY` | `current_user.id == student.advisor_id`. |
| `PENDING_ADVISOR` | `reject` | `REJECTED` | `FACULTY` | `current_user.id == student.advisor_id`; Remarks provided. |
| `PENDING_HOD` | `approve` | `APPROVED` | `HOD`, `ADMIN` | Department matches; Advisor has endorsed. |
| `PENDING_HOD` | `reject` | `REJECTED` | `HOD`, `ADMIN` | Department matches; Remarks provided. |

---

## 3. Grievance Ticket State Machine (`GrievanceFSM`)

### 3.1 State Space Definition
$$S_{\text{GRV}} = \{\text{OPEN}, \text{ASSIGNED}, \text{UNDER\_INVESTIGATION}, \text{RESOLVED}, \text{CLOSED}, \text{ESCALATED}\}$$

```
+------+             +----------+             +---------------------+             +----------+             +--------+
| OPEN | ---assign-> | ASSIGNED | ---action-> | UNDER_INVESTIGATION | ---resolve->| RESOLVED | ---verify-> | CLOSED |
+------+             +----------+             +---------------------+             +----------+             +--------+
    |                                                    |
    +--------------------escalate------------------------+
```

---

## 4. Security Incident State Machine (`IncidentFSM`)

### 4.1 State Space Definition
$$S_{\text{INC}} = \{\text{REPORTED}, \text{DISPATCHED}, \text{CONTAINED}, \text{RESOLVED}, \text{FALSE\_ALARM}\}$$

- **Guards:** Only `SECURITY` and `ADMIN` can mark `CONTAINED` or `RESOLVED`.
- **System Invariant:** Reporting an incident with `severity == "CRITICAL"` instantly switches the 3D Digital Twin map marker to flashing emergency status.
