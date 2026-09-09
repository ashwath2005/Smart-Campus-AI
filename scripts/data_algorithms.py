# -*- coding: utf-8 -*-
"""
Algorithms Data Module for Smart Campus AI (SCME-AWN)
Contains mathematical formulations, variables, complexity analysis,
and step-by-step execution workflows for the ten core system algorithms.
"""

ALGORITHMS_DATA = [
    {
        "no": "4.4.1",
        "name": "Cognitive Learning Pattern Algorithm (CLPA)",
        "module": "AI Learning Intelligence Engine",
        "objective": "Dynamically infer and update a student's cognitive learning archetype (Practical, Reading, Analytical, Consistent) based on continuous behavioral telemetry within the platform.",
        "math_desc": "CLPA uses an exponential rolling reinforcement update rule to compute normalized archetype weights:\n\n"
                     "  S_new = (1 - alpha) * S_prev + alpha * Delta_S\n\n"
                     "where S_prev is the student's historical archetype score vector, alpha = 0.15 is the learning rate balancing stability and responsiveness, and Delta_S is the instantaneous feature vector extracted from recent session interactions:\n\n"
                     "  Delta_S = [ W_code * E_code, W_doc * E_read, W_quiz * E_quiz, W_reg * E_streak ]\n\n"
                     "Here, E_code represents code execution success rate, E_read denotes document reading scroll depth and dwell time ratio, E_quiz is the diagnostic assessment accuracy, and E_streak is daily active login consistency.",
        "complexity": "Time Complexity: O(1) update per interaction event; Space Complexity: O(1) persistent state vector per student.",
        "workflow": [
            "Student performs learning action (reads document, executes code snippet, completes quiz, logs in).",
            "Client frontend logs event timestamp, duration, interaction depth, and sends telemetry payload to /api/v1/telemetry/event.",
            "FastAPI backend extracts telemetry features, computes instantaneous score Delta_S, and fetches historical vector S_prev.",
            "Applies exponential smoothing with alpha = 0.15 to calculate S_new.",
            "Normalizes S_new using softmax to produce probability distribution across the four archetypes.",
            "Persists updated scores in student_learning_interactions table and refreshes AI assistant prompt context."
        ]
    },
    {
        "no": "4.4.2",
        "name": "Knowledge Decay Prediction Algorithm (KDPA)",
        "module": "AI Memory Retention & Revision Engine",
        "objective": "Predict the retention probability of learned concepts over time using modified Ebbinghaus forgetting dynamics and propagate decay warnings across prerequisite syllabus dependency graphs.",
        "math_desc": "KDPA calculates the instantaneous concept retention probability R(t) as:\n\n"
                     "  R(t) = exp( - t / S )\n\n"
                     "where t is the elapsed time in days since the last successful review, and S is the memory stability index defined as:\n\n"
                     "  S = S_0 * (1 + ln(1 + n_reviews)) * (1 + 0.25 * (Score_avg - 0.70))\n\n"
                     "Here, S_0 = 1.8 days is the baseline initial concept half-life, n_reviews is the cumulative number of successful quiz repetitions, and Score_avg is the historical test accuracy on that concept (clamped between 0.0 and 1.0).\n\n"
                     "Prerequisite Decay Propagation:\n"
                     "For a concept C with prerequisite parents P(C), the effective composite retention R_comp(C) is:\n\n"
                     "  R_comp(C) = R(C) * Product_{p in P(C)} [ 0.70 + 0.30 * R(p) ]",
        "complexity": "Time Complexity: O(|V| + |E|) over syllabus DAG where |V| is number of topics; Space Complexity: O(|V|).",
        "workflow": [
            "KDPA cron service executes daily at 02:00 AM for all active courses.",
            "Fetches last review timestamp t_last and review count n_reviews for each student-topic pair.",
            "Calculates memory stability S and evaluates current retention R(t).",
            "Traverses syllabus DAG to compute composite retention R_comp factoring in prerequisite decay.",
            "If R_comp < 0.65, flags concept as 'Urgent Revision Required' and generates an automated notification.",
            "Feeds flagged concept IDs directly to ALRA for dynamic insertion into the student's daily study schedule."
        ]
    },
    {
        "no": "4.4.3",
        "name": "Adaptive Learning Roadmap Algorithm (ALRA)",
        "module": "AI Study Planner & Exam Countdown Engine",
        "objective": "Dynamically generate and balance daily study workloads per subject by evaluating academic urgency, exam proximity, syllabus weightage, and attendance deficits.",
        "math_desc": "ALRA calculates the Academic Priority Score (PS_s) for each enrolled subject s as:\n\n"
                     "  PS_s = [ W_exam * (1 / max(1, D_exam)) + W_att * max(0, 0.75 - Att_s) / 0.75 + W_decay * (1.0 - R_s) + W_cred * (C_s / C_max) ] * Mult_style\n\n"
                     "where:\n"
                     "  - D_exam is the days remaining until the scheduled examination;\n"
                     "  - Att_s is the current percentage attendance in subject s (mandatory threshold = 75%);\n"
                     "  - R_s is the average concept retention score from KDPA;\n"
                     "  - C_s is the credit weightage of subject s, normalized against maximum course credits C_max;\n"
                     "  - Weights satisfy W_exam (0.40) + W_att (0.25) + W_decay (0.20) + W_cred (0.15) = 1.00;\n"
                     "  - Mult_style is a cognitive tuning multiplier derived from CLPA (e.g., 1.15 for Practical learners needing lab time).\n\n"
                     "Daily Allocated Study Minutes (T_s):\n"
                     "  T_s = round( (PS_s / Sum_{j} PS_j) * Total_Available_Study_Time )",
        "complexity": "Time Complexity: O(N) where N is number of enrolled subjects (typically 6-8); Space Complexity: O(N).",
        "workflow": [
            "Student navigates to AI Study Planner or triggers /api/v1/roadmaps/generate.",
            "ALRA queries database for upcoming exam schedules, current attendance logs, and KDPA retention scores.",
            "Calculates Priority Score PS_s for each subject and normalizes across total available daily study hours.",
            "Allocates specific study minutes T_s and selects prioritized subtopics from the syllabus DAG.",
            "Formats roadmap into visual interactive daily milestones with tick-box completion tracking.",
            "Updates roadmap dynamically if student logs into the portal or completes targeted revision tasks."
        ]
    },
    {
        "no": "4.4.4",
        "name": "Dynamic Classroom Reallocation Algorithm (DCRA+)",
        "module": "Smart Timetable & Campus Resource Optimizer",
        "objective": "Resolve classroom allocation conflicts dynamically when scheduled rooms become unavailable due to repairs, maintenance, or capacity oversubscription, optimizing for physical suitability and proximity.",
        "math_desc": "DCRA+ evaluates candidate classrooms r using the Classroom Health Index (CHI_r):\n\n"
                     "  CHI_r = Sum_{i=1}^{10} [ w_i * f_i(r, s) ]\n\n"
                     "where f_i(r, s) are normalized evaluation factors and w_i are calibrated importance weights (Sum w_i = 1.0):\n"
                     "  1. Capacity Fit (w_1 = 0.25): max(0, 1 - |Cap_r - Enrolled_s| / Cap_r)\n"
                     "  2. Projector / AV Readiness (w_2 = 0.15): binary flag {0, 1}\n"
                     "  3. Air Conditioning / Ventilation (w_3 = 0.10): binary flag {0, 1}\n"
                     "  4. Proximity / Walking Distance (w_4 = 0.15): 1 - Distance(r, Orig_r) / Max_Dist\n"
                     "  5. Accessibility / Elevator Proximity (w_5 = 0.10): normalized floor height factor\n"
                     "  6. Lab Workstation Equipment (w_6 = 0.08): equipment match ratio\n"
                     "  7. Acoustic Isolation / Noise Level (w_7 = 0.05): low ambient dB score\n"
                     "  8. Power Outlet Availability (w_8 = 0.04): laptop plug density\n"
                     "  9. Smart Board / Interactive Screen (w_9 = 0.04): interactive stylus display\n"
                     "  10. Department Proximity (w_10 = 0.04): same building wing bonus\n\n"
                     "Selection Decision: Target Room = argmax_{r in FreeRooms} [ CHI_r ]",
        "complexity": "Time Complexity: O(M * K) where M is available vacant rooms (<= 50) and K = 10 factors; Space Complexity: O(M).",
        "workflow": [
            "Classroom outage or overflow detected (admin triggers room reassignment or section size exceeds capacity).",
            "DCRA+ queries timetable database for all rooms vacant during the required time slot [T_start, T_end].",
            "Filters out hard-constraint violations (insufficient capacity, missing mandatory lab equipment).",
            "Computes CHI_r across all surviving candidate rooms using the 10-factor weighted formula.",
            "Ranks candidates and automatically commits top-scoring room to database.",
            "Dispatches instantaneous push alerts to faculty and student timetables notifying them of room change."
        ]
    },
    {
        "no": "4.4.5",
        "name": "Dynamic Skill Evolution Algorithm (DSEA)",
        "module": "Placement & Career Intelligence Analyzer",
        "objective": "Quantify engineering students' domain readiness against evolving industry job requirements and produce actionable learning gap remediation pathways.",
        "math_desc": "DSEA models career roles as weighted skill profiles R = {(k_i, w_i)} where Sum w_i = 1.0. For student profile S with validated skills (s_j, p_j) where p_j in [0.0, 1.0] is proficiency, the Skill Gap Score (SGS) is:\n\n"
                     "  SGS(S, R) = 1.0 - Sum_{k_i in R} [ w_i * MatchScore(k_i, S) ]\n\n"
                     "where MatchScore is determined via semantic ontology lookup:\n"
                     "  MatchScore(k_i, S) = max_{s_j in S} [ Sim_fuzzy(k_i, s_j) * p_j ]\n\n"
                     "Sim_fuzzy(a, b) combines character-bigram Jaccard similarity J_2(a, b) with Levenshtein ratio Lev(a, b):\n"
                     "  Sim_fuzzy(a, b) = 0.60 * J_2(a, b) + 0.40 * (1 - LevDist(a, b) / max(|a|, |b|))\n\n"
                     "Target Competency Percentage: Readiness = (1.0 - SGS) * 100%",
        "complexity": "Time Complexity: O(|R| * |S|) where |R| is role skill count (<= 25) and |S| is student skill count (<= 30); Space Complexity: O(|R|).",
        "workflow": [
            "Student uploads resume or updates technical skill tags on Placement portal.",
            "Student selects target industry role (e.g., 'Full-Stack Web Developer', 'AI/ML Engineer').",
            "DSEA loads target competency vector from placement database.",
            "Computes fuzzy bigram-Levenshtein similarity matrix between candidate skills and role requirements.",
            "Calculates total Skill Gap Score (SGS) and identifies missing or low-proficiency prerequisite tools.",
            "Generates prioritized roadmap of online certifications, recommended campus electives, and practice quizzes."
        ]
    },
    {
        "no": "4.4.6",
        "name": "Intelligent Context-Aware Question Evolution Algorithm (ICQEA)",
        "module": "AI Offline Diagnostic Assessment Engine",
        "objective": "Automatically extract high-yield diagnostic questions from uploaded academic documents (PDF, DOCX, TXT) and calibrate question difficulty dynamically based on student response accuracy.",
        "math_desc": "ICQEA computes the Question Evolution Difficulty Score (QES) for newly generated items:\n\n"
                     "  QES = 0.45 * Comp_lex + 0.35 * Bloom_tier + 0.20 * (1.0 - Avg_accuracy)\n\n"
                     "where Comp_lex is lexical complexity (Flesch-Kincaid grade level normalized), Bloom_tier is the cognitive demand index (1: Recall, 2: Understand, 3: Apply, 4: Analyze), and Avg_accuracy is historical student cohort accuracy on related topics.",
        "complexity": "Time Complexity: O(L) text chunking + O(Q) schema validation; Space Complexity: O(Chunk_size).",
        "workflow": [
            "Faculty or student uploads lecture notes, textbook chapters, or question banks.",
            "ICQEA cleans text, strips formatting noise, and extracts semantic chunks of 350-500 words.",
            "Executes structured JSON schema extraction prompting Google Gemini LLM with Pydantic type guarantees.",
            "Validates that output conforms strictly to {question, options[4], correct_index, explanation, bloom_tier}.",
            "Stores validated question records in database with evolution score QES.",
            "Serves adaptive practice tests where subsequent question difficulty scales with live user performance."
        ]
    },
    {
        "no": "4.4.7",
        "name": "Deterministic O(1) Faculty Status Resolution Algorithm",
        "module": "Hardware-Free Faculty & Classroom Locator",
        "objective": "Determine real-time faculty availability and current classroom location in O(1) time without requiring expensive Bluetooth beacons, RFID tags, or GPS tracking.",
        "math_desc": "Let T be the weekly master timetable tensor indexed by [Faculty_ID, DayOfWeek, TimeSlot].\n"
                     "Let L be the approved leave hash set containing [Faculty_ID, Date].\n\n"
                     "Resolution Function Status(f, t_now):\n"
                     "  1. If (f, Date(t_now)) in L: return (ON_LEAVE, 'Approved Official Leave', None)\n"
                     "  2. slot = GetCurrentSlot(Time(t_now))\n"
                     "     If slot is None: return (OFF_HOURS, 'Outside Academic Hours', None)\n"
                     "  3. entry = T[f, Day(t_now), slot]\n"
                     "     If entry is not None and entry.type == 'TEACHING':\n"
                     "         return (IN_CLASS, entry.course_code, entry.room_number)\n"
                     "     Else:\n"
                     "         return (AVAILABLE_IN_CABIN, 'Available for Mentorship', f.cabin_number)",
        "complexity": "Time Complexity: O(1) hash lookup; Space Complexity: O(F * D * S) where F = faculty count, D = 6 days, S = 8 slots.",
        "workflow": [
            "Student asks AI assistant: 'Is Prof. Vidhiya available right now?' or views faculty card.",
            "Algorithm retrieves current system timestamp, maps to academic day and active slot index.",
            "Performs O(1) hash lookup against leave table; if approved leave found, returns On-Leave status.",
            "Performs O(1) matrix lookup on master timetable slot; if teaching, returns classroom location.",
            "If no active lecture assigned, returns faculty member's official cabin location.",
            "Returns response in < 5ms without polling physical sensors or draining mobile batteries."
        ]
    },
    {
        "no": "4.4.8",
        "name": "Constraint Satisfaction Backtracking Timetable Scheduler",
        "module": "Automated Timetable Generation Engine",
        "objective": "Generate conflict-free academic timetables satisfying all institutional hard and soft constraints across courses, faculty, student sections, and physical classrooms.",
        "math_desc": "Formulated as a Constraint Satisfaction Problem CSP = (V, D, C):\n"
                     "  - Variables V = {E_{c, s, i}}: i-th lecture of course c for section s\n"
                     "  - Domain D = {(day, slot, room): day in [1..5], slot in [1..8], room in Classrooms}\n"
                     "  - Hard Constraints C_hard:\n"
                     "      1. No faculty member assigned to > 1 room simultaneously: T(f, d, s) <= 1\n"
                     "      2. No student section assigned to > 1 room simultaneously: T(sec, d, s) <= 1\n"
                     "      3. No classroom assigned to > 1 section simultaneously: T(r, d, s) <= 1\n"
                     "      4. Classroom capacity >= section enrollment: Cap(r) >= Size(sec)\n"
                     "  - Soft Constraints C_soft (Optimization):\n"
                     "      1. Minimize faculty idle gaps between lectures\n"
                     "      2. Distribute core theoretical courses evenly across morning slots\n"
                     "      3. Cluster lab sessions into 3-period contiguous blocks",
        "complexity": "Worst-case Time Complexity: O(d^n) where d = |D| and n = |V|; Pruned with Minimum Remaining Values (MRV) and Forward Checking to O(n * d) average case.",
        "workflow": [
            "Admin inputs curriculum course list, assigned faculty, sections, and room inventory.",
            "Scheduler initializes search space and applies MRV heuristic to pick most constrained variable.",
            "Applies Least Constraining Value (LCV) heuristic to assign candidate (day, slot, room).",
            "Executes Forward Checking to prune incompatible domain values from neighboring variables.",
            "If conflict detected, backtracks immediately to prior decision branch.",
            "Outputs verified conflict-free schedule and commits timetable slots to relational database."
        ]
    },
    {
        "no": "4.4.9",
        "name": "Fuzzy Skill-Gap Matcher",
        "module": "Career Intelligence Engine",
        "objective": "Align non-standard student resume skill tokens with standard industry taxonomies using bigram Jaccard and Levenshtein similarity metrics.",
        "math_desc": "Given query token Q and taxonomy token T:\n"
                     "  Bigram Set B(S) = { S[i:i+2] : 0 <= i < |S|-1 }\n\n"
                     "  Jaccard Similarity J_2(Q, T) = |B(Q) intersect B(T)| / |B(Q) union B(T)|\n\n"
                     "  Normalized Levenshtein Ratio: L_norm(Q, T) = 1.0 - (LevDist(Q, T) / max(|Q|, |T|))\n\n"
                     "  Combined Match Score = 0.55 * J_2(Q, T) + 0.45 * L_norm(Q, T)\n\n"
                     "Match declared TRUE if Combined Score >= 0.72.",
        "complexity": "Time Complexity: O(|Q| * |T|) per pair; Space Complexity: O(|Q| + |T|).",
        "workflow": [
            "Extracts skill tokens from student profile and target placement job posting.",
            "Converts strings to lowercase, strips punctuation, and computes character bigrams.",
            "Evaluates combined similarity score across candidate taxonomy entries.",
            "Matches aliases (e.g., 'react.js' -> 'ReactJS', 'postgres' -> 'PostgreSQL').",
            "Returns canonical skill IDs and quantified competency alignment percentages."
        ]
    },
    {
        "no": "4.4.10",
        "name": "Wearable Priority Push Notification Dispatcher",
        "module": "Smartwatch & Mobile Alert Engine",
        "objective": "Filter, prioritize, and dispatch academic notifications to student smartwatches and mobile clients, respecting user Do Not Disturb (DND) periods while guaranteeing delivery of emergency alerts.",
        "math_desc": "Alert Priority Levels P in {EMERGENCY (4), URGENT_ACADEMIC (3), GENERAL_NOTICE (2), SOCIAL_UPDATE (1)}.\n\n"
                     "Dispatch Logic Decision D(alert, user, t_now):\n"
                     "  1. If alert.priority == EMERGENCY: DispatchImmediately(BypassDND=True, Sound=Loud, Vibrate=True)\n"
                     "  2. If t_now in user.dnd_window:\n"
                     "         If alert.priority >= URGENT_ACADEMIC: QueueForMorningDigest(user)\n"
                     "         Else: SuppressNotification(alert)\n"
                     "  3. Else: DispatchPushWebSocket(alert, user.client_tokens)",
        "complexity": "Time Complexity: O(1) evaluation per notification event; Space Complexity: O(U) where U is active socket connections.",
        "workflow": [
            "Event triggered (class room change, gate pass approved, exam schedule published).",
            "Notification dispatcher inspects alert priority and target user preferences.",
            "Checks if recipient is currently in a scheduled lecture slot or active DND window.",
            "If priority is EMERGENCY, bypasses DND and triggers high-frequency wearable haptic vibration.",
            "If normal notice during class, batches message into end-of-class summary queue.",
            "Delivers notification payload via WebSocket / Firebase Cloud Messaging (FCM)."
        ]
    }
]

print("Algorithms data module ready.")
