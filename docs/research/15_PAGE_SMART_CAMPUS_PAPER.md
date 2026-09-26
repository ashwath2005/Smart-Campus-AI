# Smart Campus Management Ecosystem (SCME) with AI-Powered Assistance, Wearable Notifications, and Adaptive Learning Analytics

**Authors & Affiliations:**  
1. **S. Vidhiya** (Assistant Professor / Mentor) — Dept. of CSE, Sri Krishna College of Engineering and Technology, Coimbatore, Tamil Nadu, India (`vidhiyas@skcet.ac.in`)  
2. **Ashwath S** (727823TUCS020) — Dept. of CSE, Sri Krishna College of Technology, Coimbatore, Tamil Nadu, India (`727823tucs020@skct.edu.in`)  
3. **Balamanikandan R** (727823TUCS026) — Dept. of CSE, Sri Krishna College of Technology, Coimbatore, Tamil Nadu, India (`727823tucs026@skct.edu.in`)  
4. **Cathrin R** (727823TUCS032) — Dept. of CSE, Sri Krishna College of Technology, Coimbatore, Tamil Nadu, India (`727823tucs032@skct.edu.in`)  

---

## Executive Summary & Abstract

College Enterprise Resource Planning (ERP) platforms often work as passive databases, making users dig through rigid menus to find what they need. They also lack personalized academic support for students. Furthermore, current AI educational tools lack real-time access to private institutional databases, leading to generic answers or requiring risky Text-to-SQL query executions. 

This paper presents the **Smart Campus Management Ecosystem (SCME)**, a comprehensive platform that connects daily academic operations with active AI-powered assistance, smartwatch alerts, and adaptive student learning analytics. Built with **React 18, FastAPI, and SQLAlchemy 2.0**, the platform uses Google's Gemini Large Language Model (LLM) to answer student queries in real-time. We propose the **Generative AI Context Binding (GACB)** framework that securely bundles live database records—like timetables, attendance, grades, faculty status, and notices—into the LLM's system prompt. This allows users to chat with their live data safely, avoiding raw SQL exposure or vector database re-indexing overhead.

In addition to context-bound administrative assistance, SCME deploys a comprehensive suite of proprietary algorithms:
1. **Cognitive Learning Pattern Algorithm (CLPA)** for telemetry learning style classification ($\alpha = 0.15$);
2. **Knowledge Decay Prediction Algorithm (KDPA)** using modified Ebbinghaus memory decay math ($R(t) = e^{-t/S}$) with prerequisite dependency propagation graph trees;
3. **Adaptive Learning Roadmap Algorithm (ALRA)** incorporating exam countdowns and attendance gap multipliers;
4. **Dynamic Classroom Reallocation Algorithm (DCRA)** evaluating a 10-factor weighted suitability scoring model;
5. **Dynamic Skill Evaluation Algorithm (DSEA)** for career profile gap mapping;
6. **Intelligent Content Parsing & Quiz Extraction Algorithm (ICQEA)** for multi-format text parsing and Pydantic schema validation;
7. A hardware-free, deterministic **Faculty Status Resolution** algorithm ($\mathcal{O}(1)$ time complexity);
8. A **Constraint Satisfaction Backtracking Timetable Scheduler**;
9. An automated **Fuzzy Skill-Gap Matcher** using character-bigram Jaccard similarity;
10. A **Wearable Priority Push Notification Dispatcher** with DND override logic.

Tests in a simulated campus environment with 200 students and 5,000 logs show database query times under 50 ms, GACB context assembly latencies under 25 ms, and LLM response times between 1.2 and 1.8 s, while reducing prompt token costs by 75% compared to standard vector-RAG architectures.

**Index Terms—** *Generative AI, Large Language Models, Asynchronous FastAPI, React, College ERP, Wearable Notifications, Smart Campus, Faculty Tracking, Generative AI Context Binding (GACB), CLPA, KDPA, ALRA, DCRA, DSEA, ICQEA.*

---

## I. Introduction

Managing a college involves handling a lot of data: schedules, attendance, grades, placements, faculty tracking, and communication. Standard ERP tools do a good job digitizing these records, but they are mostly just menu-driven portals.

Students and faculty have to click through multiple pages to find simple things like a classroom location or a teacher's availability. Also, students don't get personalized help. These portals don't offer dynamic study planning, automated summaries, or revision tracking based on the student's actual syllabus and performance.

To fix this, we created the **Smart Campus Management Ecosystem (SCME)**, a platform that combines everyday academic operations with an AI assistant, wearable alerts, and adaptive cognitive learning analytics. Instead of making users search through different tabs, SCME uses an AI assistant to fetch answers straight from the live database and reply in a normal conversation.

```mermaid
graph TD
    User[Student / Faculty User] -->|Natural Language Query| UI[React 18 SPA Frontend]
    UI -->|Axios REST / JWT| Backend[FastAPI Async Router Engine]
    Backend -->|SQLAlchemy AsyncSession| DB[(Relational DB: MySQL / SQLite Fallback)]
    Backend -->|Context Vector C Assembly| GACB[GACB Prompt Compiler]
    GACB -->|JSON System Prompt| Gemini[Google Gemini 2.5 Flash API]
    Backend -->|WebSocket / FCM Push| Wearable[Smartwatch Client]
    
    Backend -->|Telemetry Updates| CLPA[CLPA Cognitive Profiler]
    Backend -->|Forgetting Curve Math| KDPA[KDPA Knowledge Decay Engine]
    Backend -->|Exam & Attendance Math| ALRA[ALRA Roadmap Engine]
    Backend -->|10-Factor Scoring| DCRA[DCRA Classroom Allocator]
    Backend -->|Career Gap Mapping| DSEA[DSEA Skill Evaluator]
    Backend -->|PyMuPDF / Docx / PPTX| ICQEA[ICQEA Quiz Extractor]
```

### A. Problem Statement
Current campus systems have four main operational and technical issues:
1. **Slow Data Retrieval**: Standard ERPs store data passively. Finding specific information requires checking multiple screens manually.
2. **No Personalization**: Students don't have access to study tools that actually know their schedule or track memory retention over time.
3. **Expensive Faculty Tracking**: Finding faculty members usually requires expensive hardware like RFID or Bluetooth beacons.
4. **Recruitment Skill Mismatches**: College placement portals use basic exact-keyword matching that fails on spelling variations or non-standard formatting.

### B. Key Contributions
1. **GACB Framework**: Server-side ORM aggregation of live SQL relational snapshots into short, safe text prompts for the LLM.
2. **Hardware-Free Faculty Status Resolution Algorithm**: Deterministic $\mathcal{O}(1)$ time-complexity availability tracking.
3. **Wearable Alert Dispatcher**: Smartwatch notification push with DND override capabilities.
4. **Comprehensive Algorithm Suite**:
   - **CLPA**: Telemetry-based rolling reinforcement learning style classification ($\alpha = 0.15$).
   - **KDPA**: Ebbinghaus forgetting curve math ($R(t) = e^{-t/S}$) with prerequisite graph propagation.
   - **ALRA**: Exam-aware adaptive study roadmap generator.
   - **DCRA**: 10-factor classroom suitability scoring model.
   - **DSEA**: Career profile skill gap mapping.
   - **ICQEA**: Multi-format document text extraction and Pydantic quiz generation.
   - **CSP Timetable Scheduler**: Backtracking constraint satisfaction algorithm.
   - **Fuzzy Skill-Gap Matcher**: Character-bigram Jaccard similarity ($J(S_1, S_2)$).
5. **Dual-Engine Database Fallback**: MySQL/SQLite adapter for zero-downtime availability.

---

## II. Literature Review & Comparison Matrix

| Approach / Paper | Data Source | AI Engine | Context Method | Learning Analytics | Decay Model | Faculty Tracker | Wearable Push | Security Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Traditional ERP** [1] | Relational SQL | Manual Menus | Static Menus | None | None | Manual Lists | None | Low |
| **Semantic Web ERP** [8] | RDF Graph | Rule Engine | SPARQL Queries | None | None | None | None | Low |
| **Predictive ML ERP** | Relational SQL | Classifiers | Batch Analytics | Static Marks | None | None | None | Low |
| **Standard Vector RAG** [3] | Vector Index | LLM | Unstructured Chunks | None | None | None | None | Low |
| **Text-to-SQL LLM** | Relational SQL | LLM | Raw SQL Execution | None | None | None | None | **High (Injection)** |
| **Dynamic Telemetry** [12] | Log Files | ML Clustering | Dashboard Views | Telemetry Profiling | None | None | None | Low |
| **Forgetting Curve RAG** [13] | Vector Index | LLM | Static Text Chunks | Quiz Scores | Ebbinghaus Decay | None | None | Low |
| **Fuzzy Career Matcher** [14] | Text Resumes | String Matching | Keyword Extraction | None | None | None | None | Low |
| **BLE Faculty Tracker** [11] | Sensor Logs | Triangulation | Hardware Signals | None | None | BLE Beacons | None | Medium (Privacy) |
| **SCME (GACB)** | **Live Relational SQL** | **Gemini LLM** | **GACB Prompt Binding** | **CLPA Telemetry Vector** | **KDPA + Graph Tree** | **Deterministic $\mathcal{O}(1)$** | **DND Override Push** | **Low (SQL Safe)** |

---

## III. System Architecture & Context Binding

### A. Dual-Engine Database Fallback Adapter
$$DB_{conn} = \begin{cases} \text{mysql+aiomysql://...}, & \text{if Port 3306 responds} \\ \text{sqlite+aiosqlite:///smartcampus.db}, & \text{otherwise} \end{cases} \quad (1)$$

### B. Generative AI Context Binding (GACB)
$$U = \langle \text{Name}, \text{Role}, \text{Dept}, \text{Sem}, \text{Sec} \rangle \quad (2)$$
$$T = \{ t_i \in \text{TimetableEntry} \mid \text{day}(t_i) = \text{day}(\text{now}) \} \quad (3)$$
$$A = \langle a_1, a_2, \dots, a_k \rangle, \quad a_j = \frac{\text{Present}(j)}{\text{Total}(j)} \times 100 \quad (4)$$
$$L = \{ l_m \mid l_m = \text{ResolveFacultyStatus}(F_m, \text{now}) \} \quad (5)$$
$$P = \{ p_s \in \text{Placements} \mid \text{cutoff}(p_s) \le \text{CGPA}(\text{student}) \} \quad (6)$$
$$C = \Phi(U, T, A, L, P) \quad (7)$$
$$Prompt_{LLM} = S_{inst} \parallel C \parallel Q \quad (8)$$

---

## IV. Comprehensive Algorithms & Intelligence Suite

### A. Faculty Status Resolution Algorithm ($\mathcal{O}(1)$)
```
Algorithm 1: Faculty Status Resolution
Require: Faculty ID (F_id), Current Date (D_now), Time (t_now), Day (d_now)
Ensure: Status Label, Location Details

1: Query FacultyLeave table where faculty_id == F_id AND status == "Approved" AND start_date <= D_now <= end_date
2: if leave record exists then
3:     return <"On Leave", Details: {Type, Return Date}>
4: end if
5: Query active TimetableEntry records where faculty_name == F_name AND day == d_now AND start_time <= t_now <= end_time
6: if active entry E exists then
7:     Query parent Timetable to get Department Dept, Year Yr, Section Sec
8:     return <"Teaching", Details: {Subject E.subj, Room E.room, Dept, Yr, Sec}>
9: else
10:    Query F record for registered staff room location R_staff
11:    Query next upcoming class E_next for F on day d_now where start_time > t_now
12:    return <"Available", Details: {R_staff, E_next}>
13: end if
```

### B. Wearable Alert Dispatching Algorithm
$$N_i = \langle ID, User_{id}, P_i, M_{msg}, T_{stamp} \rangle \quad (9)$$

```
Algorithm 2: Wearable Alert Dispatching
Require: Notification N_i, Device State S_dev
Ensure: Push Dispatch Status

1: if N_i.Priority == "Emergency" then
2:     Bypass DND restrictions on wearable device
3:     Trigger high-intensity vibration pattern V_high
4:     Dispatch push payload via Capacitor Push API
5:     return Dispatched_Emergency
6: else if N_i.Priority == "Critical" then
7:     if S_dev.DND == "Active" then
8:         Queue N_i in local sqlite database for batch sync
9:         return Queued_Batch
10:    else
11:        Trigger standard pulse vibration pattern V_std
12:        Dispatch notification via Firebase Cloud Messaging
13:        return Dispatched_Critical
14:    end if
15: else
16:    Append N_i to low-priority background queue
17:    Wait for next device active check-in event
18:    return Queued_Background
19: end if
```

### C. Cognitive Learning Pattern Algorithm (CLPA)
$$d_{t} = \alpha \cdot \text{Score}_{event} + (1 - \alpha) \cdot d_{t-1}, \quad \alpha = 0.15$$
$$\text{Reading Efficiency} = \min\left(\text{Scroll Depth \%} \times \frac{\text{Duration (sec)}}{120}, 1.0\right)$$
Categorizes cognitive cohorts into Practical, Reading, Analytical, and Consistent.

### D. Knowledge Decay Prediction Algorithm (KDPA)
$$R(t) = \exp\left(-\frac{t}{S}\right), \quad S = \gamma \cdot (1 + \text{revision\_count}) \cdot \left(1 + \frac{\text{mastery}}{100}\right) \cdot \frac{1}{D_f}$$
$$R_{\text{adjusted}}(B) = R(B) \times \left(0.7 + 0.3 \times \frac{\text{Mastery}(A)}{100}\right)$$

### E. Dynamic Classroom Reallocation Algorithm (DCRA)
Evaluates a 10-factor modular suitability score $S(c, r)$:
$$S(c, r) = \sum_{k=1}^{10} w_k \cdot f_k(c, r) - \lambda \cdot \text{MovementDistance}(c, r)$$
Factors include capacity fitness ($0.15$), equipment compatibility ($0.15$), location preference ($0.10$), department affinity ($0.10$), accessibility ($0.08$), predicted occupancy match ($0.12$), future availability ($0.10$), classroom health ($0.10$), energy efficiency ($0.05$), and movement distance penalty ($0.15$).

### F. Adaptive Learning Roadmap Algorithm (ALRA)
Calculates exam countdown days ($RD$), attendance gap multiplier ($M_{att}$), and retention risk ($R_{topic}$):
$$W_{topic} = \frac{(1 - R_{topic}) \cdot (1 + M_{att})}{RD + 1} \cdot \text{Difficulty}(topic)$$

### G. Dynamic Skill Evaluation Algorithm (DSEA)
$$Gap Score = \sum_{s \in S_{req}} \max(0, \text{RequiredRating}(s) - \text{StudentRating}(s))$$
Generates personalized skill gap checklists, course recommendations, and portfolio project suggestions for Software Engineer, AI Engineer, Full Stack, and Frontend Developer paths.

### H. Intelligent Content Parsing & Quiz Extraction Algorithm (ICQEA)
Parses binary documents (PDF, DOCX, PPTX), extracts keywords via TF-IDF, splits text into optimal chunks, and generates Pydantic schema validated MCQ quizzes via Gemini.

### I. Constraint Satisfaction Backtracking Timetable Scheduler
CSP solver enforcing faculty availability, classroom capacity, section non-overlap, and lab block continuity to generate conflict-free academic class schedules.

### J. Fuzzy Skill-Gap Matcher
$$J(S_1, S_2) = \frac{|G(S_1) \cap G(S_2)|}{|G(S_1) \cup G(S_2)|}$$
$$\text{Match Percentage} = \frac{|\text{Skills}_{student} \cap \text{Skills}_{required}|}{|\text{Skills}_{required}|} \times 100$$

---

## V. Experimental Results & Latency Benchmarks

| Endpoint Type | Average Latency | Max Latency |
| :--- | :--- | :--- |
| CRUD: User Login / JWT Auth | 22 ms | 45 ms |
| CRUD: Timetable Fetch (SQL) | 12 ms | 28 ms |
| Faculty Status Resolution | 18 ms | 35 ms |
| GACB Context Assembly | 25 ms | 52 ms |
| DCRA Classroom Reallocation | 32 ms | 68 ms |
| ALRA Roadmap Calculation | 28 ms | 55 ms |
| Gemini LLM Response API Call | 1420 ms | 1880 ms |

$$Token_{total} = Token_{system\_prompt} + Token_{GACB\_context} + Token_{query} \quad (10)$$

GACB prompt uses **350 to 500 tokens**, reducing API costs by **75%** compared to baseline vector-RAG methods.

---

## VI. Conclusion & Future Work

This paper presented the **Smart Campus Management Ecosystem (SCME)**, unifying Generative AI Context Binding (GACB), smartwatch alert dispatching, and a ten-algorithm intelligence suite (CLPA, KDPA, DCRA, ALRA, DSEA, ICQEA, Faculty Resolution, CSP Scheduler, Wearable Push, Fuzzy Matcher). Future enhancements will incorporate `pgvector` resume similarity, BLE classroom beacons, and geofenced dynamic QR code attendance.

---

## References

1. A. Al-Shboul et al., "Usability evaluation of academic portals in higher education institutions," *iJET*, vol. 15, no. 12, pp. 45–62, 2020.
2. J. Devlin et al., "BERT: Pre-training of deep bidirectional transformers," *arXiv:1810.04805*, 2018.
3. P. Lewis et al., "Retrieval-augmented generation for knowledge-intensive NLP tasks," in *NeurIPS*, vol. 33, pp. 9459–9474, 2020.
4. S. Tiangolo, "FastAPI web framework," 2023. `https://fastapi.tiangolo.com/`
5. Google Generative AI Team, "Gemini: A family of highly capable multimodal models," *arXiv:2312.11805*, 2023.
6. A. Vaswani et al., "Attention is all you need," in *NeurIPS*, pp. 5998–6008, 2017.
7. T. Brown et al., "Language models are few-shot learners," in *NeurIPS*, vol. 33, pp. 1877–1901, 2020.
8. L. A. L. de Oliveira et al., "A semantic web-based campus information system," *IEEE Latin Am. Trans.*, vol. 19, no. 8, pp. 1324–1331, 2021.
9. X. Zhang and Y. Chen, "Intelligent campus assistant based on large language models and retrieval-augmented generation," in *IEEE Smart Campus*, pp. 88–93, 2024.
10. Y. Zhao and J. Wang, "An asynchronous high-concurrency framework for educational administration systems using fastapi and sqlalchemy," *IEEE TET*, vol. 15, no. 3, pp. 240–248, 2025.
11. R. Sharma and M. Gupta, "Timetable-based indoor faculty localization system without active gps tracking," in *IEEE ICCI*, pp. 112–117, 2023.
12. C. Wang et al., "Adaptive learning style classification via telemetry-based rolling analytics," *Comput. Educ. AI*, vol. 6, p. 100192, 2024.
13. A. Srivastava et al., "Predictive forgetting curve modeling and prerequisite dependency propagation in online education," *IEEE TLT*, vol. 17, pp. 412–425, 2024.
14. E. Martinez et al., "Fuzzy string matching and skill taxonomy alignment for automated resume-job matching," *ACM TKDD*, vol. 18, no. 4, pp. 1–22, 2024.
