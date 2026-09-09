# -*- coding: utf-8 -*-
"""
Updated Metadata Module:
- Deleted BLE, RFID, XAI as requested by user.
- Calibrated Abstract and Acknowledgement to strictly fit on single pages.
"""

METADATA = {
    "title": "A SMART CAMPUS MANAGEMENT ECOSYSTEM WITH AI-POWERED ASSISTANCE, WEARABLE NOTIFICATIONS, AND ADAPTIVE LEARNING ANALYTICS (SCME-AWN)",
    "degree": "BACHELOR OF ENGINEERING IN COMPUTER SCIENCE AND ENGINEERING",
    "department": "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING",
    "college": "SRI KRISHNA COLLEGE OF TECHNOLOGY",
    "college_sub": "An Autonomous Institution | Accredited by NAAC with 'A' Grade\nAffiliated to Anna University | Approved by AICTE",
    "location": "KOVAIPUDUR, COIMBATORE 641042",
    "date": "NOVEMBER 2025",
    "students": [
        {"name": "ASHWATH S.", "reg_no": "727823TUCS020"},
        {"name": "BALAMANIKANDAN R.", "reg_no": "727823TUCS026"},
        {"name": "CATHRIN R.", "reg_no": "727823TUCS032"}
    ],
    "supervisor": {
        "name": "Ms. S. VIDHIYA",
        "designation": "Assistant Professor",
        "dept": "Department of Computer Science and Engineering",
        "institution": "Sri Krishna College of Technology, Coimbatore-641042."
    },
    "hod": {
        "name": "Dr. M. UDHAYAMOORTHI",
        "designation": "Associate Professor & Head",
        "dept": "Department of Computer Science and Engineering",
        "institution": "Sri Krishna College of Technology, Coimbatore-641042."
    },
    "principal": "Dr. M.G. SUMITHRA",
    "coordinator": "Dr. M. KAVITHA MARGRET"
}

ABSTRACT_PARAS = [
    "Modern higher education institutions rely extensively on Enterprise Resource Planning (ERP) platforms and Learning Management Systems (LMS) to administer academic records, course registrations, timetables, attendance tracking, and campus communication. However, traditional campus ERP platforms act primarily as passive, siloed relational repositories characterized by rigid, menu-driven User Interfaces. Consequently, students and faculty spend an estimated 40% of their digital navigation time traversing fragmented menus to locate routine context-aware information. Furthermore, these platforms lack personalized, predictive learning analytics, treating all students uniformly without factoring in cognitive learning styles, memory retention decay, or real-time academic risk. Simultaneously, off-the-shelf generative Artificial Intelligence (AI) solutions fail in institutional deployments because public Large Language Models (LLMs) lack access to private, real-time relational states, leading to severe hallucination risks or requiring precarious Text-to-SQL query executions.",
    "To overcome these systemic limitations, this project presents the design, architectural formulation, implementation, and empirical evaluation of the Smart Campus Management Ecosystem with AI-Powered Assistance, Wearable Notifications, and Adaptive Learning Analytics (SCME-AWN). Engineered on an asynchronous microservice framework utilizing React 18, FastAPI, and SQLAlchemy 2.0 Async, SCME-AWN introduces the Generative AI Context Binding (GACB) architecture. GACB dynamically intercepts natural language queries, resolves user security context, compiles real-time relational database states (active timetable slots, attendance percentages, faculty leave records, course syllabi, and official announcements) into structured, role-scoped JSON system prompts, and interfaces with Google Gemini 2.5 Flash with zero vector database re-indexing latency.",
    "Complementing context-bound conversational assistance, SCME-AWN deploys ten proprietary algorithms: CLPA for telemetry learning archetype classification; KDPA for predictive Ebbinghaus forgetting curve modeling; ALRA for balanced exam preparation roadmaps; DCRA+ for 10-factor classroom reallocation; DSEA for career skill-gap evaluation; ICQEA for diagnostic quiz generation; deterministic O(1) hardware-free faculty status resolution; CSP backtracking timetable scheduler; fuzzy bigram skill matcher; and a priority push notification dispatcher. Empirical benchmarks across 22 verification test suites demonstrate sub-50ms database latency, sub-25ms context compilation, and a 75% reduction in API token costs relative to vector-RAG architectures."
]

ACKNOWLEDGEMENT_PARAS = [
    "First and foremost, we offer our humble prayers and deepest thanksgiving to the Almighty for showering His divine grace, wisdom, perseverance, and enlightenment throughout the tenure of this Phase-I project work.",
    "We express our immense gratitude and profound respect to our beloved Principal, Dr. M.G. Sumithra, for providing state-of-the-art computing laboratories, digital library resources, and an enabling research atmosphere at Sri Krishna College of Technology that inspired the fruition of this project.",
    "We convey our heartfelt and sincere thanks to our respected Head of the Department, Dr. M. Udhayamoorthi, Associate Professor & Head, Department of Computer Science and Engineering, for his constant administrative support, technical leadership, and scholarly encouragement during all project phases.",
    "We place on record our sincere appreciation and gratitude to Dr. M. Kavitha Margret, Project Coordinator, Department of Computer Science and Engineering, for her systematic project reviews, constructive feedback, and invaluable suggestions that elevated the quality of our documentation and technical deliverables.",
    "We are eternally indebted and express our deepest sense of gratitude to our respected project supervisor, Ms. S. Vidhiya, Assistant Professor, Department of Computer Science and Engineering, for her invaluable guidance, exemplary mentorship, intellectual stimulation, and continuous encouragement at every stage of the system architecture, algorithm formulation, and implementation.",
    "We also express our heartfelt thanks to all Teaching and Non-Teaching Staff Members of the Department of Computer Science and Engineering for their continuous support and assistance.",
    "Last but never least, we express our warmest love, gratitude, and indebtedness to our beloved parents, family members, and friends for their endless sacrifices, moral encouragement, and constant belief in our potential, without which this achievement would not have been possible."
]

# Deleted BLE, RFID, XAI as requested!
ABBREVIATIONS = [
    ('SCME-AWN', 'Smart Campus Management Ecosystem with AI-Powered Assistance, Wearable Notifications, and Adaptive Learning Analytics'),
    ('GACB', 'Generative AI Context Binding'),
    ('CLPA', 'Cognitive Learning Pattern Algorithm'),
    ('KDPA', 'Knowledge Decay Prediction Algorithm'),
    ('ALRA', 'Adaptive Learning Roadmap Algorithm'),
    ('DCRA+', 'Dynamic Classroom Reallocation Algorithm (Enhanced)'),
    ('DSEA', 'Dynamic Skill Evolution Algorithm'),
    ('ICQEA', 'Intelligent Context-Aware Question Evolution Algorithm'),
    ('CSP', 'Constraint Satisfaction Problem'),
    ('LLM', 'Large Language Model'),
    ('RAG', 'Retrieval-Augmented Generation'),
    ('ERP', 'Enterprise Resource Planning'),
    ('LMS', 'Learning Management System'),
    ('SRS', 'Software Requirements Specification'),
    ('DFD', 'Data Flow Diagram'),
    ('ERD', 'Entity-Relationship Diagram'),
    ('API', 'Application Programming Interface'),
    ('REST', 'Representational State Transfer'),
    ('JWT', 'JSON Web Token'),
    ('ORM', 'Object-Relational Mapping'),
    ('SPA', 'Single Page Application'),
    ('RBAC', 'Role-Based Access Control'),
    ('JSON', 'JavaScript Object Notation'),
    ('FCM', 'Firebase Cloud Messaging'),
    ('DND', 'Do Not Disturb'),
    ('SQL', 'Structured Query Language'),
    ('UAT', 'User Acceptance Testing')
]

FIGURES_LIST = [
    ('4.1', 'Block Diagram of Smart Campus AI Management Ecosystem', '21'),
    ('4.2', 'High-Level System Flow Diagram of Campus Operations', '21'),
    ('5.1', 'Unified Student & Faculty Intelligence Dashboard (Desktop View)', '48'),
    ('5.2', 'Timetable Management Module with Dynamic Conflict Detection', '49'),
    ('5.3', 'AI Study Materials & Cognitive Question Generation Module', '49'),
    ('5.4', 'Digital Gate Pass & Guardian Approval Interface', '50'),
    ('5.5', 'Secure Authentication & Role-Based Access Control Portal', '50'),
    ('5.6', 'Responsive Mobile View & Wearable Sync Dashboard', '51')
]

TABLES_LIST = [
    ('2.1', 'Comprehensive Literature Review Matrix (10 Research Papers)', '12'),
    ('3.1', 'Hardware Requirements Specification', '17'),
    ('3.2', 'Software Requirements Specification', '17'),
    ('3.3', 'System Feasibility Analysis Matrix', '18'),
    ('4.1', 'Relational Database Schema & Entity Summary', '22'),
    ('4.2', 'CLPA Learning Style Scoring Coefficients & Telemetry Factors', '34'),
    ('4.3', 'DCRA+ 10-Factor Suitability Weights Matrix', '34'),
    ('5.1', 'Software Verification and Validation Test Suite (22 Test Cases)', '38'),
    ('5.2', 'System Performance Benchmarking & Quantitative Latency Metrics', '47'),
    ('5.3', 'Comparative Token Cost and Context Efficiency Analysis', '48')
]

TOC_ENTRIES = [
    ["", "ABSTRACT", "i"],
    ["", "ACKNOWLEDGEMENT", "ii"],
    ["", "LIST OF FIGURES", "iii"],
    ["", "LIST OF TABLES", "iv"],
    ["", "LIST OF ABBREVIATIONS", "v"],
    ["1", "INTRODUCTION", "1"],
    ["", "1.1 Domain Background & Campus ERP Systems", "1"],
    ["", "1.2 Problem Formulation & Systemic Bottlenecks", "1"],
    ["", "1.3 Project Objectives", "2"],
    ["", "1.4 Scope of the Project (Phase-I vs Phase-II)", "3"],
    ["", "1.5 Organization of the Report", "4"],
    ["2", "LITERATURE SURVEY", "5"],
    ["", "2.1 Evolution of Campus Management Platforms", "5"],
    ["", "2.2 Generative AI & Large Language Models in Education", "5"],
    ["", "2.3 Context Binding vs Retrieval-Augmented Generation", "6"],
    ["", "2.4 Cognitive Student Modeling & Ebbinghaus Forgetting Dynamics", "6"],
    ["", "2.5 Wearable Notification Systems in Academic Operations", "7"],
    ["", "2.6 Comprehensive Literature Review Matrix (10 Papers)", "7"],
    ["", "2.7 Research Gap Analysis and Motivation", "14"],
    ["3", "SYSTEM ANALYSIS", "15"],
    ["", "3.1 Existing System Analysis & Inherent Bottlenecks", "15"],
    ["", "3.2 Proposed System Architecture & Core Innovations", "15"],
    ["", "3.3 Software Requirements Specification (SRS)", "16"],
    ["", "3.4 Feasibility Study (Technical, Operational, Economic, Legal)", "18"],
    ["4", "SYSTEM ARCHITECTURE AND DESIGN", "20"],
    ["", "4.1 High-Level Architectural Topology (GACB Framework)", "20"],
    ["", "4.2 Data Flow Diagrams (Level 0, Level 1, Level 2)", "21"],
    ["", "4.3 Relational Database Schema & Entity Summary", "22"],
    ["", "4.4 System Algorithms & Mathematical Formulation", "23"],
    ["", "4.5 Security Architecture & Role-Based Access Control", "36"],
    ["5", "IMPLEMENTATION AND RESULTS", "37"],
    ["", "5.1 Development Environment & Technology Stack", "37"],
    ["", "5.2 System Modules Implementation", "37"],
    ["", "5.3 Software Verification & Test Case Suite (22 Full Test Cases)", "38"],
    ["", "5.4 Performance Benchmarking & Quantitative Evaluation", "47"],
    ["", "5.5 System Output & User Interface Visualizations", "48"],
    ["6", "CONCLUSION AND FUTURE WORK", "53"],
    ["", "6.1 Phase-I Summary and Achievements", "53"],
    ["", "6.2 Phase-II Proposed Extensions & Implementation Roadmap", "53"],
    ["", "REFERENCES", "55"],
    ["", "APPENDIX 1: CORE ALGORITHM SOURCE CODE", "58"]
]

print("Updated report_metadata.py successfully.")
