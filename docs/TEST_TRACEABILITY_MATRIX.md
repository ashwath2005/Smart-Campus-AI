# Smart Campus AI — Test Traceability Matrix

This document establishes bidirectional traceability between system requirements, architecture features, business workflows, master test cases, automated test scripts, and verification results.

---

| Requirement ID | Business Requirement Description | Module / Feature | Workflow ID | Test Case ID | Automated Test Suite | Test Type | Automation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-AUTH-01** | Multi-role credential authentication with JWT | Authentication | WF-AUTH-01 | `TC-AUTH-001` | `tests/api/test_master_api_suite.py` | API / Unit | **Automated** |
| **REQ-AUTH-02** | Role-Based Access Control (RBAC) boundaries | Authorization | WF-AUTH-02 | `TC-AUTH-002` | `tests/security/test_security_suite.py` | Security / RBAC | **Automated** |
| **REQ-AUTH-03** | Cryptographic token validation & tamper rejection | Security | WF-AUTH-03 | `TC-AUTH-003` | `tests/security/test_security_suite.py` | Security / Token | **Automated** |
| **REQ-GP-01** | Low-risk autonomous day outpass with AI auto-approval | Gate Pass | WF-GP-01 | `TC-GP-001` | `tests/workflows/test_master_workflows.py` | Business E2E | **Automated** |
| **REQ-GP-02** | Weekend hostel leave with Parent SMS OTP verification | Gate Pass | WF-GP-02 | `TC-GP-002` | `tests/workflows/test_master_workflows.py` | Multi-Role E2E | **Automated** |
| **REQ-GP-03** | Physical security exit & entry checkpoint turnstile scans | Gate Pass | WF-GP-01/02 | `TC-GP-003` | `tests/workflows/test_master_workflows.py` | Operational E2E | **Automated** |
| **REQ-GP-04** | Automated background overdue curfew detector | Gate Pass | WF-GP-03 | `TC-GP-004` | `tests/workflows/test_master_workflows.py` | Service Engine | **Automated** |
| **REQ-LV-01** | 2-Tier Student Leave application (Advisor -> HOD) | Workflows | WF-LV-01 | `TC-LV-001` | `tests/workflows/test_master_workflows.py` | Multi-Role E2E | **Automated** |
| **REQ-LV-02** | Student Leave rejection pathway with mandatory remarks | Workflows | WF-LV-01 | `TC-LV-002` | `tests/workflows/test_master_workflows.py` | State Machine | **Automated** |
| **REQ-OD-01** | On-Duty (OD) Event leave authorization | Workflows | WF-OD-01 | `TC-LV-003` | `tests/workflows/test_master_workflows.py` | Multi-Role E2E | **Automated** |
| **REQ-ATT-01** | Faculty bulk and single period attendance entry | Attendance | WF-ATT-01/02 | `TC-ATT-001` | `tests/workflows/test_master_workflows.py` | Data Mutation | **Automated** |
| **REQ-ATT-02** | Student attendance % recalculation & safe-bunk tracker | Attendance | WF-ATT-01 | `TC-ATT-002` | `tests/workflows/test_master_workflows.py` | Business Logic | **Automated** |
| **REQ-ASN-01** | Faculty assignment publishing to specific department/year | Assignments | WF-ASN-01 | `TC-ASN-001` | `tests/workflows/test_master_workflows.py` | Workflow | **Automated** |
| **REQ-ASN-02** | Student homework submission and faculty grading | Assignments | WF-ASN-01 | `TC-ASN-002` | `tests/workflows/test_master_workflows.py` | Workflow E2E | **Automated** |
| **REQ-PL-01** | Placement drive posting and student application tracking | Placements | WF-PL-01 | `TC-PL-001` | `tests/workflows/test_master_workflows.py` | Workflow E2E | **Automated** |
| **REQ-PL-02** | Placement applicant status progression (Shortlist/Reject) | Placements | WF-PL-01 | `TC-PL-002` | `tests/workflows/test_master_workflows.py` | State Machine | **Automated** |
| **REQ-EV-01** | Campus event creation, self-registration, and check-in | Events | WF-EV-01 | `TC-EV-001` | `tests/api/test_master_api_suite.py` | API / DB | **Automated** |
| **REQ-SM-01** | Study material upload with AI topic & unit categorizer | Study Materials | WF-SM-01 | `TC-SM-001` | `tests/api/test_master_api_suite.py` | AI / Ingestion | **Automated** |
| **REQ-FR-01** | Peer discussion forum post, replies, upvotes, and pins | Forum | WF-FR-01 | `TC-FR-001` | `tests/api/test_master_api_suite.py` | Social / RBAC | **Automated** |
| **REQ-CP-01** | Real-time Campus Pulse score computation & telemetry | Campus Pulse | WF-CP-01 | `TC-CP-001` | `tests/api/test_master_api_suite.py` | Telemetry | **Automated** |
| **REQ-AI-01** | 3-week pre-exam SGPA early-warning & 14-day study plan | Academic Risk | WF-AI-01 | `TC-AI-001` | `tests/api/test_master_api_suite.py` | AI / Predictive | **Automated** |
| **REQ-SEC-01** | IDOR protection on private user objects & gate passes | Security | WF-SEC-01 | `TC-SEC-001` | `tests/security/test_security_suite.py` | Security Audit | **Automated** |

---

## Traceability Summary
- **Total Functional Requirements Mapped**: 22
- **Test Cases Linked**: 22 Master Cases
- **Automated Test Coverage**: 100% of mapped functional requirements have automated execution scripts.
- **Zero Orphan Requirements**: Every requirement connects to an active router, database entity, and test case.
