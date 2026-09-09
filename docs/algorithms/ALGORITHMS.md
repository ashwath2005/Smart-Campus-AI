# Smart Campus AI — Algorithmic Intelligence Engines & Mathematical Formulations

This document specifies the core algorithmic engines, mathematical foundations, and optimization models governing the Smart Campus AI platform.

---

## 1. ALRA — Academic Latent Risk Assessment Engine

### Objective
Identify students exhibiting latent academic distress before midterm or final failure by combining multi-modal indicators (attendance trajectory, continuous assessment marks, backlog penalties, and assignment submission latency).

### Mathematical Formulation
$$\text{RiskScore}(s) = w_1 \cdot \max\left(0, \frac{T_{\text{att}} - A_s}{T_{\text{att}}}\right) + w_2 \cdot \left(1 - \frac{M_s}{M_{\text{max}}}\right) + w_3 \cdot \min(1.0, \beta \cdot B_s) + w_4 \cdot L_s$$

Where:
- $A_s$: Student current cumulative attendance percentage (threshold $T_{\text{att}} = 75\%$).
- $M_s$: Continuous internal marks average scaled to $[0, 1]$.
- $B_s$: Number of active academic backlogs ($\beta = 0.25$).
- $L_s$: Normalized assignment submission delay index $[0, 1]$.
- Weights: $w_1 = 0.35, w_2 = 0.35, w_3 = 0.20, w_4 = 0.10$ such that $\sum w_i = 1.0$.

### Risk Categorization
$$\text{Category}(s) = \begin{cases}
\text{LOW}, & \text{RiskScore} < 0.35 \\
\text{MODERATE}, & 0.35 \le \text{RiskScore} < 0.65 \\
\text{CRITICAL / HIGH}, & \text{RiskScore} \ge 0.65
\end{cases}$$

---

## 2. KDPA — Knowledge Decay & Retention Modeling (Ebbinghaus Formulation)

### Objective
Model topic-level memory retention degradation over elapsed time to dynamically trigger personalized spaced-repetition revision schedules.

### Mathematical Formulation
$$R(t) = \exp\left(-\frac{t}{S_k}\right)$$

Where:
- $R(t)$: Probability of topic retention at elapsed time $t$ (days).
- $t$: Days elapsed since last active study or quiz revision on topic $k$.
- $S_k$: Memory strength factor calculated dynamically from revision count $n$ and mastery level $m \in [0, 1]$:
$$S_k = S_0 \cdot (1 + \alpha \cdot n) \cdot (0.5 + 0.5 \cdot m)$$
- Base memory stability $S_0 = 7.0$ days, repetition reinforcement rate $\alpha = 0.65$.

### Revision Trigger Rule
A topic is flagged for mandatory revision whenever:
$$R(t) < 0.40 \quad \text{or} \quad \text{DecayRisk} > 60\%$$

---

## 3. CLPA — Cognitive Learning Pathway Allocation

### Objective
Quantify multi-dimensional student cognitive engagement across reading efficiency, quiz accuracy, coding problem-solving velocity, and focus consistency.

### Tensor Metrics
$$\mathbf{C}_s = \begin{bmatrix}
E_{\text{reading}} & A_{\text{quiz}} & V_{\text{coding}} & F_{\text{focus}}
\end{bmatrix}^T$$

- **Reading Efficiency ($E_{\text{reading}}$)**: Ratio of completed reading modules relative to time spent.
- **Quiz Accuracy ($A_{\text{quiz}}$)**: First-attempt accuracy on concept checks.
- **Focus Index ($F_{\text{focus}}$)**: Ratio of continuous active session duration without idle interruptions.
- **Composite Velocity**:
$$\text{Velocity} = \sqrt{w_r E^2 + w_q A^2 + w_c V^2 + w_f F^2}$$

---

## 4. DCRA+ — Dynamic Capacity & Resource Allocation

### Objective
Optimize physical classroom and laboratory capacity utilization while minimizing building transition overhead and energy waste.

### Mathematical Optimization Function
$$\max \sum_{r \in R} \sum_{c \in C} \left[ \frac{\text{Enrollment}(c)}{\text{Capacity}(r)} \cdot \mathbb{I}(r, c) - \lambda \cdot \text{Distance}(r, \text{Dept}(c)) \right]$$

Subject to:
1. $\text{Capacity}(r) \ge \text{Enrollment}(c)$ (No classroom oversubscription).
2. $\sum_{c \in C} \mathbb{I}(r, c, t) \le 1, \forall t$ (No spatial overlap).
3. Specialized lab requirement constraints for practical courses.

---

## 5. CSP Timetable Solver — Backtracking Constraint Satisfaction

### Objective
Automatically generate conflict-free academic weekly schedules satisfying all institutional hard and soft constraints.

### Constraint Hierarchy
- **Hard Constraints (Zero-Tolerance)**:
  1. $\text{NoFacultyClash}(f, d, p)$: A faculty member cannot teach two distinct classes at the same day $d$ and period $p$.
  2. $\text{NoRoomDoubleBooking}(r, d, p)$: A room cannot host more than one section concurrently.
  3. $\text{NoSectionOverlap}(s, d, p)$: A student section can only attend one subject per time slot.
  4. $\text{LabContiguity}$: Practical laboratory sessions require contiguous multi-period blocks.
- **Soft Constraints (Optimization Objectives)**:
  1. Faculty daily workload spread across the week.
  2. Core lecture placement in early morning high-retention slots.

---

## 6. DSEA — Domain Skill Evolution & Career Readiness

### Objective
Evaluate alignment between student acquired competencies and industry career track profiles using tokenized n-gram bigram similarity and Jaccard vector distance.

### Mathematical Formulation
$$\text{Similarity}(S_{\text{student}}, S_{\text{target}}) = \frac{|S_{\text{student}} \cap S_{\text{target}}|}{|S_{\text{student}} \cup S_{\text{target}}|}$$

$$\text{ReadinessScore} = 0.50 \cdot \text{Similarity} + 0.30 \cdot \left(\frac{\text{CGPA}}{10.0}\right) + 0.20 \cdot \min\left(1.0, \frac{\text{Projects}}{4}\right)$$
