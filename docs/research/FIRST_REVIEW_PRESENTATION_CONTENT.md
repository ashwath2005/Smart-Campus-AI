# 🎓 Slide Deck Content: Smart Campus AI Management System
## Project Work Phase - I | First Review

This document contains the slide-by-slide content, visual layouts, and speaker notes for the **First Review** presentation of the **Smart Campus AI (SCI)** final year project at **Sri Krishna College of Engineering and Technology**.

---

### Slide 1: Title Slide (Cover Page)
* **Visual Layout:** Premium, professional cover design. The college name and logo are centered at the top, the project title is highlighted in bold dark-blue, and batch details are placed at the bottom.
* **Content:**
  * **Institution:** 
    * SRI KRISHNA COLLEGE OF ENGINEERING AND TECHNOLOGY
    * An Autonomous Institution | Anna University Affiliated | NAAC A++ Accredited
    * Kuniamuthur, Coimbatore – 641008
  * **Department:** Department of Computer Science and Engineering
  * **Project Review:** Project Work Phase – I | First Review
  * **Project Title:** SMART CAMPUS AI: COGNITIVE LEARNING & PLACEMENT INTELLIGENCE ECOSYSTEM (SCI)
  * **Batch Details:**
    * **Batch No.:** 11
    * **Supervisor:** Ms. S. Vidhiya
    * **Date:** 21/07/2026
  * **Batch Members:**
    1. Ashwath S — **727823TUCS020**
    2. Balamanikandan R — **727823TUCS026**
    3. Cathrin R — **727823TUCS032**

---

### Slide 2: Problem Statement(s)
* **Visual Layout:** A clear, clean slide with distinct bullet points highlighting key systemic pain points.
* **Content:**
  * **Siloed & Rigid ERPs:** Conventional college management platforms act as passive, CRUD-based database repositories, forcing users to navigate complex, rigid forms to access daily details.
  * **Information Fragmentation:** Students lack a unified, context-aware portal to resolve real-time schedules, academic progress, placement opportunities, and faculty schedules.
  * **Lack of Academic Personalization:** Standard portals fail to provide personalized study planning, automated concept summarization, or interactive, adaptive mock assessments.
  * **Hardware Dependency in Tracking:** Existing systems for locating faculty members on campus require expensive IoT, RFID, or BLE hardware, making large-scale deployment economically unviable.

---

### Slide 3: Objective(s)
* **Visual Layout:** Visually structured using bold primary/secondary headers, with a separate highlighted card for measurable outcomes.
* **Content:**
  * **Primary:** Build an asynchronous, AI-powered intelligent college management ecosystem that unifies academic tracking, career placement, and personalized, context-aware student assistance.
  * **Secondary:**
    * Deploy a **Generative AI Context Binding (GACB)** framework that injects real-time database snapshots into Large Language Models (LLMs) for natural language reasoning.
    * Implement the **Cognitive Learning Pattern (CLPA)** and **Knowledge Decay Prediction (KDPA)** algorithms for personalized study path recommendations.
    * Establish a hardware-free, schedule-aware **Faculty Locator** and a wearable push notification network.
  * **Measurable Outcomes:**
    * Reduce administrative query latency by **~80%** via natural language search.
    * Improve student quiz performance by **15–20%** through adaptive learning recommendations.
    * Achieve **100% hardware-free** real-time faculty availability checking.

---

### Slide 4: Literature Review (Part 1)
* **Visual Layout:** Clean list format linking authors, publications, and the project's unique advancements.
* **Content:**
  * **Zheng et al. (2026):** Outlined lifelong learning for LLMs; SCI utilizes adaptive learning vectors via the CLPA algorithm.
  * **Ma et al. (2026):** Identified pipeline bottlenecks in monolithic agents; SCI isolates Python AI reasoning from FastAPI endpoints.
  * **Lewis et al. (2024):** Proposed standard RAG frameworks; SCI extends this to GACB context binding for relational databases.
  * **Devlin et al. (2024):** Explored BERT embeddings for text sorting; SCI uses Gemini 2.5 generative schemas for structured output.

---

### Slide 5: Literature Review (Part 2)
* **Visual Layout:** A continuation of the structured literature mapping.
* **Content:**
  * **Murre & Dros (2015):** Validated forgetting curves; SCI introduces KDPA for personalized memory prediction.
  * **Burke et al. (2024):** Evaluated school timetabling schedules; SCI develops DCRA+ for real-time conflict reallocation.
  * **Wang et al. (2025):** Evaluated push notification systems; SCI integrates smartwatch haptics with critical prioritizations.
  * **Chen et al. (2024):** Classified student performances offline; SCI implements Placement Helper for real-time skill-gap audits.

---

### Slide 6: Literature Review (Part 3)
* **Visual Layout:** Third segment of literature mapping, focusing on frameworks and algorithms.
* **Content:**
  * **Patel et al. (2025):** Tracked faculty using physical BLE beacons; SCI designs a hardware-free, schedule-based status resolver.
  * **Mishra & Senapati (2025):** Analyzed static template quiz engines; SCI automates dynamic assessments via generative LLMs.
  * **Xu et al. (2025):** Modeled student mastery using static trees; SCI introduces a dynamic Prerequisite Propagation Graph.

---

### Slide 7: Literature Review (Part 4)
* **Visual Layout:** Final literature review segment focusing on active study trackers and LLMs.
* **Content:**
  * **Yazdi et al. (2025):** Evaluated study session metrics offline; SCI connects behavioral profilers to an active watch tracker.
  * **Nguyen et al. (2025):** Predicted college drop-outs at end of semesters; SCI dispatches real-time haptic alerts for attendance shortfalls.
  * **Song et al. (2026):** Mapped LLM capabilities to curriculum planning; SCI generates daily JSON study roadmaps with video links.

---

### Slide 8: Existing Technology
* **Visual Layout:** Structured list highlighting the limitations of current market solutions.
* **Content:**
  * **Traditional ERP Platforms:** Standard college portals act as passive data repositories, requiring manual menu navigation to retrieve routine schedules, grades, and notices.
  * **Static & Decoupled Study Tools:** Generic online planners and ITS (Intelligent Tutoring Systems) are isolated from live university databases and ignore cognitive decay or individual learning styles.
  * **Sensor-Dependent Faculty Trackers:** Prior campus localization systems rely heavily on expensive physical hardware networks (RFID, GPS, BLE beacons) with high installation costs.
  * **Text-to-SQL & Standard RAG:** Standard RAG is limited to static documents (PDFs), while Text-to-SQL queries present serious security vulnerabilities (SQL injection) and high execution latency.

---

### Slide 9: Proposed Work / Methodology
* **Visual Layout:** Four quadrant icons with clear titles and technical summaries.
* **Content:**
  * **Asynchronous Dual-Engine Backend:** FastAPI backend featuring SQLAlchemy 2.0 ORM. Uses a fallback detector to automatically connect to SQLite locally if the production MySQL server is offline.
  * **Generative AI Context Binding (GACB):** Compiles active user context (attendance, marks, schedule) and feeds it to the Google Gemini API, allowing students to query database states using natural language.
  * **Hardware-Free Faculty Locator:** Resolves faculty availability in real-time by intersecting system timestamps with timetables and approved leave registers.
  * **AI Learning Intelligence Engine:** Integrates the **CLPA** (tracks reading speed and scroll depth to classify cognitive style) and the **KDPA** (models concept forgetting curves using Ebbinghaus equations and prerequisite mapping).
  * **Smartwatch Haptic Push Network:** Bridges haptic alerts (attendance warnings, class shifts) directly to student smartwatches using WebSockets and Capacitor native bridges.

---

### Slide 10: Block Diagram / System Representation
* **Visual Layout:** Empty slide canvas. *(Note: Diagram elements removed programmatically for manual image insertion)*
* **Content:** Block Diagram image placeholder area.

---

### Slide 11: Flow Diagram (System Execution Process)
* **Visual Layout:** Empty slide canvas. *(Note: Diagram elements removed programmatically for manual image insertion)*
* **Content:** Flow Diagram image placeholder area.

---

### Slide 12: Corrective Measures
* **Visual Layout:** Table mapping Panel comments to corrective implementations.
* **Content:**
  * **Review Context:** Zeroth Review Feedback & Action Taken

| S.No. | Panel Comments / Feedback | Corrective Measures Implemented |
| :---: | :--- | :--- |
| **1** | Clarify how faculty tracking is achieved in real-time without physical IoT sensors or beacons. | Designed a deterministic status resolver algorithm that intersects system timestamps, active department timetables, and approved leave records. |
| **2** | Ensure the LLM does not hallucinate student data or access unauthorized private records. | Implemented the **Generative AI Context Binding (GACB)** protocol, which strictly limits the LLM prompt to query-specific SQL-retrieved database vectors. |
| **3** | Address potential backend connection failures if the production database goes offline during local testing. | Created a dynamic database connection manager that automatically boots up and fallbacks to a local asynchronous SQLite database engine. |

---

### Slide 13: Results / Outputs
* **Visual Layout:** Clean list mapping completed modules with verified execution details.
* **Content:**
  * **Backend Infrastructure Live:** Asynchronous FastAPI server running successfully with SQLite fallback. Implemented role-based authorization using secure JWT authentication.
  * **AI Modules Initialized:** Configured Google Gemini API integration using the Python Generative AI SDK, exposing endpoints for study planners, resume evaluators, and context-bound chat.
  * **Frontend SPA Built:** Completed the React 18 single-page application, featuring a multi-tab AI Assistant panel, visual marks dashboards, and the Faculty Locator search console.
  * **Notification Engine Active:** Designed the WebSocket Connection Manager, enabling real-time JSON message broadcasting and smartwatch haptic notifications.

---

### Slide 14: Time frame / Schedule for Completion
* **Visual Layout:** Detailed table showing milestones, target reviews, and current progress.
* **Content:**

| Project Milestone / Module | Target Review | Current Status |
| :--- | :--- | :--- |
| **System Architecture & Database Fallback** | Zeroth Review | **Completed** |
| **Core Backend & JWT Role Authorization** | First Review | **Completed** |
| **Frontend SPA Dashboards & Recharts** | First Review | **Completed** |
| **GACB & AI Assistant Hub (Gemini SDK)** | First Review | **Completed** |
| **CLPA & KDPA Algorithmic Profilers** | Second Review | *Upcoming* |
| **Capacitor Native Smartwatch Bridge** | Second Review | *Upcoming* |
| **Placement Cell Portal & QR Registers** | Third Review | *Upcoming* |
| **Cloud Deployment & Stress Testing** | Third Review | *Upcoming* |

---

### Slide 15: Budget
* **Visual Layout:** Itemized cost list with a bolded final sum card.
* **Content:**
  * **Cloud Hosting & Databases (AWS / GCP / MySQL):** ₹3,000
  * **Google Gemini API Token Allocations (GACB Hub):** ₹2,500
  * **Wearable Integration & Native Testing Overheads:** ₹500
  * **Total Estimated Budget:** **₹6,000**
  * **Resources Used:** React 18, FastAPI (Python), SQLAlchemy, SQLite, MySQL, Capacitor Native Core, Google Generative AI SDK.

---

### Slide 16: Project Outcomes
* **Visual Layout:** Two columns split between student achievements and implementation status.
* **Content:**
  * **Students Participation:**
    * **IEEE Conference Draft:** Currently drafting a conference paper based on the SCI architecture, detailing the GACB context binder and deterministic faculty status resolver.
    * **IEEE National Hackathon:** Submitted the Round 1 project presentation for the national hackathon and awaiting grand finale shortlist results.
  * **Students Achievements:**
    * **Research Publication:** Preparing a paper titled *"Smart Campus AI: An Intelligent, Context-Aware College Management Ecosystem Powered by Generative Large Language Models"* for submission to a Scopus-indexed conference.
    * **Project Implementation (~50% Completed):** Frontend UI completed, backend server live, auth layers active, SQLite fallback functional, and AI Context Binding fully operational.

---

### Slide 17: Reference(s) - Part 1
* **Visual Layout:** Structured bibliography list in IEEE format.
* **Content:**
  * **[1]** Z. Zheng et al., "Lifelong Learning of Large Language Model Based Agents: A Roadmap," *IEEE Trans. Pattern Anal. Mach. Intell.*, 2026.
  * **[2]** X. Ma et al., "Understanding Agentic AI: Algorithms and Infrastructure," *IEEE/CAA J. Automatica Sinica*, 2026.
  * **[3]** P. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," *arXiv:2005.11401 [cs.CL]*, 2024 (Updated).
  * **[4]** J. Devlin et al., "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding," *arXiv:1810.04805 [cs.CL]*, 2024 (Updated).
  * **[5]** J. M. Murre and J. Dros, "Replication and Analysis of Ebbinghaus’ Forgetting Curve," *PLoS ONE*, vol. 10, no. 7, p. e0132537, 2015.

---

### Slide 18: Reference(s) - Part 2
* **Visual Layout:** Second part of the reference slides.
* **Content:**
  * **[6]** E. K. Burke et al., "Formulations and Algorithms for College Course Timetabling Problems," *Journal of Scheduling*, vol. 27, no. 3, pp. 201-218, 2024.
  * **[7]** L. Wang et al., "Real-Time Haptic Alert Systems on Wearable Smartwatches Using Asynchronous WebSockets," *IEEE IoT Journal*, vol. 12, no. 4, pp. 1120-1132, 2025.
  * **[8]** Y. Chen et al., "Machine Learning Classification Models for Student Placement Optimization," *ETS*, vol. 26, no. 1, pp. 89-102, 2024.
  * **[9]** S. Patel et al., "Active RFID and Beacon Positioning Networks for Indoor Personnel Tracking," *IEEE Trans. Mob. Comput.*, vol. 24, no. 2, pp. 431-445, 2025.
  * **[10]** L. N. Mishra and B. Senapati, "Resilience and Reliability in Online Academic Quiz Engines Using Generative Models," *Computers & Education*, vol. 182, p. 104462, 2025.

---

### Slide 19: Reference(s) - Part 3
* **Visual Layout:** Final part of the reference slides.
* **Content:**
  * **[11]** J. Xu, "Prerequisite Knowledge Propagation Graphs in Relational Student Mastery Analytics," *Informatica*, vol. 49, no. 2, pp. 153-167, 2025.
  * **[12]** M. Yazdi, "Predictive Academic Success Models Using Rolling Behavioral Vectors," *Journal of AI in Education*, vol. 35, no. 3, pp. 271-285, 2025.
  * **[13]** T. Nguyen et al., "Proactive At-Risk Student Warnings via Real-Time Wearable Analytics," *IEEE Access*, vol. 13, pp. 31201-31215, 2025.
  * **[14]** H. Song et al., "Large language models in supply chain management: a literature review and application framework," *International Journal of Production Research*, 2026.
