# AUDIT LOG SPECIFICATION
## Smart Campus AI Management System — Tamper-Resistant Audit Trail, Compliance Schema, & Forensic Traceability

**Document Version:** 1.0.0  
**Compliance Standards:** ISO/IEC 27001:2022 (A.12.4 Logging & Monitoring), SOC 2 Type II (Trust Services Criteria - CC7), HIPAA/FERPA Student Privacy Standards  
**Storage Architecture:** Append-Only Immutable Relational Ledger with Cryptographic Hash Chaining

---

## 1. Audit Logging Philosophy & Core Principles

In an enterprise campus operating system where student physical safety, disciplinary actions, and academic grades are on the line, the system must guarantee:
1. **Non-Repudiation:** An actor cannot dispute having performed an action (e.g. granting an emergency gate pass or changing an attendance record).
2. **Immutability:** Audit records are strictly append-only; `UPDATE` and `DELETE` queries are disabled at the database trigger level.
3. **Cryptographic Traceability:** Each audit entry contains a cryptographic hash of the current payload concatenated with the previous entry's hash, forming an internal tamper-evident hash chain.
4. **Context Richness:** Every record captures user ID, role, client IP address, user agent, action verb, resource entity, old state, new state, and delta.

---

## 2. Universal Audit Log Schema

```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    audit_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Actor Context
    actor_id INTEGER REFERENCES users(id),
    actor_email VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    client_ip VARCHAR(45) NOT NULL,
    user_agent TEXT,
    
    -- Target Resource
    resource_type VARCHAR(100) NOT NULL, -- 'GatePass', 'Attendance', 'User', 'Policy', 'StudentLeave'
    resource_id VARCHAR(100) NOT NULL,
    action_verb VARCHAR(100) NOT NULL,   -- 'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'SCAN_EXIT', 'SCAN_RETURN'
    
    -- State Transition Dictionaries (JSONB)
    previous_state JSONB,
    new_state JSONB,
    delta_summary TEXT,
    
    -- Cryptographic Hash Chaining
    previous_log_hash VARCHAR(64),       -- SHA-256 hash of (id - 1)
    record_hash VARCHAR(64) NOT NULL     -- SHA-256(timestamp + actor_id + resource_id + action_verb + new_state + previous_log_hash)
);

CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, actor_role);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
```

---

## 3. High-Risk Actions Requiring Mandatory Audit Logging

| Functional Domain | Event Action | Required Metadata Fields | Retention Period |
| :--- | :--- | :--- | :---: |
| **Gate Passes** | `PASS_CREATED` | Departure, Return, Purpose, Risk Score | 3 Years |
| **Gate Passes** | `PARENT_OTP_VERIFIED` | OTP Hash, Timestamp, Consent Boolean | 3 Years |
| **Gate Passes** | `HOD_APPROVED` | HOD ID, Department, Approval Notes | 3 Years |
| **Gate Passes** | `SECURITY_CHECKOUT` | Gate ID, Officer ID, RFID/QR Scan Hash | 5 Years |
| **Gate Passes** | `SECURITY_CHECKIN` | Entry Gate ID, Latency/Curfew Differential | 5 Years |
| **Gate Passes** | `OVERDUE_FLAGGED` | Excess minutes, Automated Alert Recipients | 5 Years |
| **Attendance** | `SESSION_RECORDED` | Course Code, Period, Absentee Student IDs | 7 Years (Academic) |
| **Attendance** | `GRADE_MODIFIED` | Instructor ID, Old Grade, New Grade, Reason | 7 Years (Academic) |
| **Attendance** | `OD_REGULARIZED` | Approved Leave ID, Restored Percentages | 7 Years (Academic) |
| **Administration** | `USER_ROLE_CHANGED` | Admin ID, Target User ID, Previous Role, New Role | 7 Years |
| **Administration** | `ACCOUNT_DEACTIVATED`| Reason, Session Revocation Timestamp | 7 Years |
| **Administration** | `EMERGENCY_LOCKDOWN` | Lockdown Initiator, Scope, Siren Dispatch Status | Indefinite |

---

## 4. Cryptographic Hash Chain Validation Algorithm

To audit and verify the integrity of the audit ledger against database tampering:

$$\text{Hash}_n = \text{SHA256}\Big(\text{UUID}_n \,\|\, \text{Timestamp}_n \,\|\, \text{Actor}_n \,\|\, \text{Action}_n \,\|\, \text{NewState}_n \,\|\, \text{Hash}_{n-1}\Big)$$

```python
import hashlib
import json

def verify_audit_ledger_integrity(db_session) -> bool:
    logs = db_session.query(AuditLog).order_by(AuditLog.id.asc()).all()
    prev_hash = "GENESIS_BLOCK_HASH"
    
    for log in logs:
        if log.previous_log_hash != prev_hash:
            raise SecurityException(f"Audit tamper detected at entry {log.id}! Previous hash mismatch.")
            
        payload = f"{log.audit_uuid}{log.timestamp.isoformat()}{log.actor_id}{log.resource_id}{log.action_verb}{json.dumps(log.new_state, sort_keys=True)}{prev_hash}"
        computed_hash = hashlib.sha256(payload.encode('utf-8')).hexdigest()
        
        if log.record_hash != computed_hash:
            raise SecurityException(f"Audit payload corruption detected at entry {log.id}!")
            
        prev_hash = computed_hash
        
    return True
```

---

## 5. Privacy & Data Protection Controls (FERPA / GDPR)
1. **PII Masking:** Parent phone numbers and student identity card numbers are masked (`XXXX-XXXX-1234`) in standard log exports.
2. **Role-Restricted Reading:** Only users with `ROLE_ADMIN` or authorized external compliance auditors can view the complete audit log explorer.
3. **No Direct UI Mutation:** Frontend consoles provide read-only data grid views with filter, search, and CSV export capabilities.
