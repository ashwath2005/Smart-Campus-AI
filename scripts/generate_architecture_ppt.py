import os
import sys

def generate_dark_svg():
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" style="background:#0a0f1d; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1329" />
      <stop offset="100%" stop-color="#060913" />
    </linearGradient>
    
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#818cf8" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>

    <linearGradient id="clientCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e3a5f" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0f2137" stop-opacity="0.9" />
    </linearGradient>

    <linearGradient id="gatewayCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#134e4a" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0a2a28" stop-opacity="0.9" />
    </linearGradient>

    <linearGradient id="serviceCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#312e81" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#1e1b4b" stop-opacity="0.9" />
    </linearGradient>

    <linearGradient id="algoBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a123d" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#180b24" stop-opacity="0.95" />
    </linearGradient>

    <linearGradient id="dataCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9" />
    </linearGradient>

    <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5" />
    </filter>

    <marker id="arrowCyan" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
    </marker>
    <marker id="arrowEmerald" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
    </marker>
    <marker id="arrowPurple" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 0 L 8 4 L 0 8 Z" fill="#c084fc" />
    </marker>
    <marker id="arrowIndigo" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 0 L 8 4 L 0 8 Z" fill="#818cf8" />
    </marker>
  </defs>

  <rect width="1920" height="1080" fill="url(#bgGrad)" />
  
  <g opacity="0.06">
    <pattern id="gridDark" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="1"/>
    </pattern>
    <rect width="1920" height="1080" fill="url(#gridDark)" />
  </g>

  <!-- SLIDE HEADER -->
  <g id="SlideHeader" transform="translate(60, 45)">
    <rect x="0" y="0" width="310" height="28" rx="14" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <circle cx="14" cy="14" r="5" fill="#38bdf8" />
    <text x="28" y="19" fill="#94a3b8" font-size="13" font-weight="600" letter-spacing="1">PROJECT WORK PHASE - I | FIRST REVIEW</text>

    <text x="0" y="65" fill="url(#headerGrad)" font-size="32" font-weight="800" letter-spacing="0.5">SMART CAMPUS AI (SCI) — SYSTEM ARCHITECTURE</text>
    <text x="0" y="92" fill="#94a3b8" font-size="15" font-weight="400">
      An Asynchronous End-to-End Operational Pipeline: Full-Stack React Client, FastAPI Core, Mathematical Intelligence Suite &amp; Generative AI Context Binding
    </text>

    <text x="1800" y="32" text-anchor="end" fill="#f8fafc" font-size="16" font-weight="700">SRI KRISHNA COLLEGE OF ENGINEERING AND TECHNOLOGY</text>
    <text x="1800" y="54" text-anchor="end" fill="#64748b" font-size="13" font-weight="500">Department of Computer Science and Engineering | Batch 11</text>
  </g>

  <!-- TIER 1: CLIENT & PRESENTATION LAYER -->
  <g id="Tier1_Presentation" transform="translate(60, 165)">
    <rect x="0" y="0" width="1800" height="135" rx="16" fill="url(#clientCard)" stroke="#0284c7" stroke-width="1.5" filter="url(#dropShadow)" />
    
    <rect x="18" y="-12" width="280" height="26" rx="6" fill="#0369a1" />
    <text x="26" y="6" fill="#ffffff" font-size="12" font-weight="700" letter-spacing="0.8">TIER 1 : CLIENT &amp; PRESENTATION LAYER</text>

    <g transform="translate(25, 26)">
      <rect x="0" y="0" width="310" height="92" rx="10" fill="#0c1a2e" stroke="#1e3a5f" stroke-width="1" />
      <text x="15" y="24" fill="#38bdf8" font-size="13" font-weight="700">CAMPUS USER PERSONAS</text>
      
      <g transform="translate(15, 36)">
        <rect x="0" y="0" width="132" height="22" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="0.8" />
        <text x="10" y="15" fill="#f1f5f9" font-size="11" font-weight="600">🎓 Student Portal</text>
        
        <rect x="145" y="0" width="135" height="22" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="0.8" />
        <text x="155" y="15" fill="#f1f5f9" font-size="11" font-weight="600">👨‍🏫 Faculty / HOD</text>
        
        <rect x="0" y="26" width="132" height="22" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="0.8" />
        <text x="10" y="41" fill="#f1f5f9" font-size="11" font-weight="600">🏛️ Admin Console</text>
        
        <rect x="145" y="26" width="135" height="22" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="0.8" />
        <text x="155" y="41" fill="#f1f5f9" font-size="11" font-weight="600">🛡️ Warden / Guard</text>
      </g>
    </g>

    <path d="M 340 72 L 368 72" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrowCyan)" />

    <g transform="translate(375, 26)">
      <rect x="0" y="0" width="980" height="92" rx="10" fill="#0c1a2e" stroke="#1e3a5f" stroke-width="1" />
      <text x="16" y="24" fill="#38bdf8" font-size="13" font-weight="700">REACT 18 SINGLE PAGE APPLICATION (VITE + TAILWIND + FRAMER MOTION)</text>
      
      <g transform="translate(16, 36)">
        <rect x="0" y="0" width="180" height="48" rx="6" fill="#132742" stroke="#1d4ed8" stroke-width="0.8" />
        <text x="12" y="20" fill="#e2e8f0" font-size="12" font-weight="600">Academic Agenda</text>
        <text x="12" y="38" fill="#93c5fd" font-size="10">Attendance (75% Gate)</text>

        <rect x="192" y="0" width="180" height="48" rx="6" fill="#132742" stroke="#1d4ed8" stroke-width="0.8" />
        <text x="12" y="20" fill="#e2e8f0" font-size="12" font-weight="600">Digital Gate Pass</text>
        <text x="12" y="38" fill="#93c5fd" font-size="10">Signed QR Verification</text>

        <rect x="384" y="0" width="180" height="48" rx="6" fill="#132742" stroke="#1d4ed8" stroke-width="0.8" />
        <text x="12" y="20" fill="#e2e8f0" font-size="12" font-weight="600">Learning Intelligence</text>
        <text x="12" y="38" fill="#93c5fd" font-size="10">Active Watch Tracker</text>

        <rect x="576" y="0" width="180" height="48" rx="6" fill="#132742" stroke="#1d4ed8" stroke-width="0.8" />
        <text x="12" y="20" fill="#e2e8f0" font-size="12" font-weight="600">Campus Pulse Hub</text>
        <text x="12" y="38" fill="#93c5fd" font-size="10">Density Heatmaps</text>

        <rect x="768" y="0" width="180" height="48" rx="6" fill="#132742" stroke="#1d4ed8" stroke-width="0.8" />
        <text x="12" y="20" fill="#e2e8f0" font-size="12" font-weight="600">Career &amp; Placement</text>
        <text x="12" y="38" fill="#93c5fd" font-size="10">ATS Resume &amp; Skills</text>
      </g>
    </g>

    <path d="M 1360 72 L 1388 72" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrowCyan)" />

    <g transform="translate(1395, 26)">
      <rect x="0" y="0" width="380" height="92" rx="10" fill="#0c1a2e" stroke="#1e3a5f" stroke-width="1" />
      <text x="16" y="24" fill="#38bdf8" font-size="13" font-weight="700">CLIENT RUNTIME &amp; BRIDGES</text>
      
      <g transform="translate(16, 36)">
        <rect x="0" y="0" width="168" height="48" rx="6" fill="#1e293b" stroke="#334155" stroke-width="0.8" />
        <text x="10" y="18" fill="#f8fafc" font-size="11" font-weight="600">Axios HTTP Client</text>
        <text x="10" y="36" fill="#64748b" font-size="10">JWT Bearer Interceptors</text>

        <rect x="180" y="0" width="168" height="48" rx="6" fill="#1e293b" stroke="#334155" stroke-width="0.8" />
        <text x="10" y="18" fill="#f8fafc" font-size="11" font-weight="600">WebSocket / Native</text>
        <text x="10" y="36" fill="#64748b" font-size="10">Capacitor Haptic Bridge</text>
      </g>
    </g>
  </g>

  <!-- Connectors T1 to T2 -->
  <g id="Connectors_T1_T2">
    <path d="M 680 300 L 680 338" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="4 3" marker-end="url(#arrowCyan)" />
    <rect x="620" y="306" width="120" height="20" rx="4" fill="#0f172a" stroke="#0284c7" stroke-width="0.8" />
    <text x="680" y="320" text-anchor="middle" fill="#38bdf8" font-size="10" font-weight="700">HTTPS REST API</text>

    <path d="M 1480 300 L 1480 338" stroke="#34d399" stroke-width="2.5" stroke-dasharray="4 3" marker-end="url(#arrowEmerald)" />
    <rect x="1405" y="306" width="150" height="20" rx="4" fill="#0f172a" stroke="#059669" stroke-width="0.8" />
    <text x="1480" y="320" text-anchor="middle" fill="#34d399" font-size="10" font-weight="700">WSS NOTIFICATION STREAM</text>
  </g>

  <!-- TIER 2: API GATEWAY & SECURITY LAYER -->
  <g id="Tier2_Gateway" transform="translate(60, 345)">
    <rect x="0" y="0" width="1800" height="90" rx="16" fill="url(#gatewayCard)" stroke="#0d9488" stroke-width="1.5" filter="url(#dropShadow)" />
    
    <rect x="18" y="-12" width="310" height="26" rx="6" fill="#0f766e" />
    <text x="26" y="6" fill="#ffffff" font-size="12" font-weight="700" letter-spacing="0.8">TIER 2 : API GATEWAY &amp; SECURITY (FASTAPI)</text>

    <g transform="translate(25, 22)">
      <rect x="0" y="0" width="320" height="52" rx="8" fill="#042f2e" stroke="#14b8a6" stroke-width="1" />
      <text x="15" y="22" fill="#5eead4" font-size="12" font-weight="700">FastAPI Asynchronous Engine</text>
      <text x="15" y="40" fill="#99f6e4" font-size="10">Uvicorn Worker · Central Router · v1 Versioning</text>

      <rect x="340" y="0" width="330" height="52" rx="8" fill="#042f2e" stroke="#14b8a6" stroke-width="1" />
      <text x="15" y="22" fill="#5eead4" font-size="12" font-weight="700">Auth &amp; RBAC Route Guards</text>
      <text x="15" y="40" fill="#99f6e4" font-size="10">JWT Token Decode · Role Enforcement (4 Tiers)</text>

      <rect x="690" y="0" width="350" height="52" rx="8" fill="#042f2e" stroke="#14b8a6" stroke-width="1" />
      <text x="15" y="22" fill="#5eead4" font-size="12" font-weight="700">Security &amp; Rate-Limiting Guard</text>
      <text x="15" y="40" fill="#99f6e4" font-size="10">CORS · XSS Sanitizer · Token Bucket Rate-Limiter</text>

      <rect x="1060" y="0" width="330" height="52" rx="8" fill="#042f2e" stroke="#14b8a6" stroke-width="1" />
      <text x="15" y="22" fill="#5eead4" font-size="12" font-weight="700">Pydantic v2 Contract Layer</text>
      <text x="15" y="40" fill="#99f6e4" font-size="10">Strict Request Validation &amp; Schema Serialization</text>

      <rect x="1410" y="0" width="365" height="52" rx="8" fill="#042f2e" stroke="#14b8a6" stroke-width="1" />
      <text x="15" y="22" fill="#5eead4" font-size="12" font-weight="700">WebSocket Broadcast Manager</text>
      <text x="15" y="40" fill="#99f6e4" font-size="10">Real-time Haptic &amp; Attendance Push Dispatch</text>
    </g>
  </g>

  <!-- Connectors T2 to T3 -->
  <g id="Connectors_T2_T3">
    <path d="M 960 435 L 960 473" stroke="#14b8a6" stroke-width="2.5" marker-end="url(#arrowEmerald)" />
    <rect x="880" y="442" width="160" height="20" rx="4" fill="#0f172a" stroke="#0d9488" stroke-width="0.8" />
    <text x="960" y="456" text-anchor="middle" fill="#5eead4" font-size="10" font-weight="700">DISPATCH SERVICE CALLS</text>
  </g>

  <!-- TIER 3: CORE APPLICATION SERVICES -->
  <g id="Tier3_Services" transform="translate(60, 480)">
    <rect x="0" y="0" width="1800" height="100" rx="16" fill="url(#serviceCard)" stroke="#6366f1" stroke-width="1.5" filter="url(#dropShadow)" />
    
    <rect x="18" y="-12" width="320" height="26" rx="6" fill="#4338ca" />
    <text x="26" y="6" fill="#ffffff" font-size="12" font-weight="700" letter-spacing="0.8">TIER 3 : BUSINESS LOGIC &amp; DOMAIN SERVICES</text>

    <g transform="translate(25, 24)">
      <rect x="0" y="0" width="335" height="58" rx="8" fill="#1e1b4b" stroke="#4f46e5" stroke-width="1" />
      <text x="16" y="24" fill="#a5b4fc" font-size="13" font-weight="700">Academic &amp; Timetable Service</text>
      <text x="16" y="44" fill="#c7d2fe" font-size="10.5">75% Attendance Guard · Department Rosters</text>

      <rect x="355" y="0" width="335" height="58" rx="8" fill="#1e1b4b" stroke="#4f46e5" stroke-width="1" />
      <text x="16" y="24" fill="#a5b4fc" font-size="13" font-weight="700">Gate Pass Lifecycle Service</text>
      <text x="16" y="44" fill="#c7d2fe" font-size="10.5">Multi-tier Workflow · QR Signing &amp; Invalidation</text>

      <rect x="710" y="0" width="335" height="58" rx="8" fill="#1e1b4b" stroke="#4f46e5" stroke-width="1" />
      <text x="16" y="24" fill="#a5b4fc" font-size="13" font-weight="700">Cognitive Learning Service</text>
      <text x="16" y="44" fill="#c7d2fe" font-size="10.5">Study Tracker · YouTube Embeds · Quizzes</text>

      <rect x="1065" y="0" width="335" height="58" rx="8" fill="#1e1b4b" stroke="#4f46e5" stroke-width="1" />
      <text x="16" y="24" fill="#a5b4fc" font-size="13" font-weight="700">Placement &amp; Resume Service</text>
      <text x="16" y="44" fill="#c7d2fe" font-size="10.5">Resume Extraction · Bigram Matching · ATS Index</text>

      <rect x="1420" y="0" width="355" height="58" rx="8" fill="#1e1b4b" stroke="#4f46e5" stroke-width="1" />
      <text x="16" y="24" fill="#a5b4fc" font-size="13" font-weight="700">Operations &amp; Faculty Locator</text>
      <text x="16" y="44" fill="#c7d2fe" font-size="10.5">Hardware-Free Schedule Resolver · Density</text>
    </g>
  </g>

  <!-- Connectors T3 to T4 -->
  <g id="Connectors_T3_T4">
    <path d="M 960 580 L 960 618" stroke="#c084fc" stroke-width="2.5" marker-end="url(#arrowPurple)" />
    <rect x="850" y="588" width="220" height="20" rx="4" fill="#0f172a" stroke="#9333ea" stroke-width="0.8" />
    <text x="960" y="602" text-anchor="middle" fill="#d8b4fe" font-size="10" font-weight="700">MATHEMATICAL INFERENCE &amp; REASONING</text>
  </g>

  <!-- TIER 4: MATHEMATICAL INTELLIGENCE SUITE -->
  <g id="Tier4_Intelligence" transform="translate(60, 625)">
    <rect x="0" y="0" width="1800" height="195" rx="16" fill="url(#algoBoxGrad)" stroke="#c026d3" stroke-width="2" filter="url(#dropShadow)" />
    
    <rect x="18" y="-14" width="480" height="28" rx="6" fill="#a21caf" />
    <text x="26" y="5" fill="#ffffff" font-size="13" font-weight="800" letter-spacing="0.8">TIER 4 : MATHEMATICAL INTELLIGENCE SUITE &amp; AI ENGINES</text>

    <g transform="translate(25, 24)">
      <!-- Algo 1 -->
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="425" height="66" rx="8" fill="#1e0c2b" stroke="#d946ef" stroke-width="1" />
        <circle cx="20" cy="22" r="8" fill="#d946ef" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">1</text>
        <text x="36" y="24" fill="#f5d0fe" font-size="12" font-weight="700">CSP Backtracking Timetable Solver</text>
        <text x="16" y="44" fill="#e879f9" font-size="10">Constraint Satisfaction · Zero Faculty/Room Clashes</text>
        <text x="16" y="58" fill="#a855f7" font-size="9">Heuristic: Minimum Remaining Values (MRV)</text>
      </g>

      <!-- Algo 2 -->
      <g transform="translate(445, 0)">
        <rect x="0" y="0" width="425" height="66" rx="8" fill="#1e0c2b" stroke="#d946ef" stroke-width="1" />
        <circle cx="20" cy="22" r="8" fill="#d946ef" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">2</text>
        <text x="36" y="24" fill="#f5d0fe" font-size="12" font-weight="700">CLPA Cognitive Pathway Classifier</text>
        <text x="16" y="44" fill="#e879f9" font-size="10">Rolling Reinforcement: dt = α·Score + (1-α)·dt-1</text>
        <text x="16" y="58" fill="#a855f7" font-size="9">Classifies: Practical, Reading, Analytical &amp; Consistent</text>
      </g>

      <!-- Algo 3 -->
      <g transform="translate(890, 0)">
        <rect x="0" y="0" width="425" height="66" rx="8" fill="#1e0c2b" stroke="#d946ef" stroke-width="1" />
        <circle cx="20" cy="22" r="8" fill="#d946ef" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">3</text>
        <text x="36" y="24" fill="#f5d0fe" font-size="12" font-weight="700">KDPA Ebbinghaus Decay Predictor</text>
        <text x="16" y="44" fill="#e879f9" font-size="10">Memory Curve: R(t) = exp(-t / S)</text>
        <text x="16" y="58" fill="#a855f7" font-size="9">Dynamic Prerequisite Graph: Propagation adjustments</text>
      </g>

      <!-- Algo 4 -->
      <g transform="translate(1335, 0)">
        <rect x="0" y="0" width="440" height="66" rx="8" fill="#1e0c2b" stroke="#d946ef" stroke-width="1" />
        <circle cx="20" cy="22" r="8" fill="#d946ef" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">4</text>
        <text x="36" y="24" fill="#f5d0fe" font-size="12" font-weight="700">ALRA Academic Latent Risk Assessor</text>
        <text x="16" y="44" fill="#e879f9" font-size="10">Weighted Dropout Distress Classifier</text>
        <text x="16" y="58" fill="#a855f7" font-size="9">Attendance Trends + Arrear History + Mark Anomalies</text>
      </g>

      <!-- Algo 5 -->
      <g transform="translate(0, 78)">
        <rect x="0" y="0" width="425" height="66" rx="8" fill="#1e0c2b" stroke="#a21caf" stroke-width="1" />
        <circle cx="20" cy="22" r="8" fill="#a21caf" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">5</text>
        <text x="36" y="24" fill="#f5d0fe" font-size="12" font-weight="700">DCRA+ Dynamic Resource Allocator</text>
        <text x="16" y="44" fill="#f0abfc" font-size="10">Classroom Seat Optimization &amp; Energy Savings</text>
        <text x="16" y="58" fill="#c084fc" font-size="9">Real-time Emergency &amp; Maintenance Reallocation</text>
      </g>

      <!-- Algo 6 -->
      <g transform="translate(445, 78)">
        <rect x="0" y="0" width="425" height="66" rx="8" fill="#1e0c2b" stroke="#a21caf" stroke-width="1" />
        <circle cx="20" cy="22" r="8" fill="#a21caf" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">6</text>
        <text x="36" y="24" fill="#f5d0fe" font-size="12" font-weight="700">DSEA Skill Evolution &amp; Gap Matcher</text>
        <text x="16" y="44" fill="#f0abfc" font-size="10">Fuzzy Jaccard Bigram: J(S1,S2) = |G1 ∩ G2| / |G1 ∪ G2|</text>
        <text x="16" y="58" fill="#c084fc" font-size="9">ATS Parser + Synonym Ontology Mapping</text>
      </g>

      <!-- Algo 7 -->
      <g transform="translate(890, 78)">
        <rect x="0" y="0" width="425" height="66" rx="8" fill="#1e0c2b" stroke="#a21caf" stroke-width="1" />
        <circle cx="20" cy="22" r="8" fill="#a21caf" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">7</text>
        <text x="36" y="24" fill="#f5d0fe" font-size="12" font-weight="700">Campus Pulse Real-Time Engine</text>
        <text x="16" y="44" fill="#f0abfc" font-size="10">Zonal Activity Density &amp; Bottleneck Detection</text>
        <text x="16" y="58" fill="#c084fc" font-size="9">1-3 Hour Forward Movement Predictive Matrix</text>
      </g>

      <!-- Algo 8 -->
      <g transform="translate(1335, 78)">
        <rect x="0" y="0" width="440" height="66" rx="8" fill="#2d0639" stroke="#f43f5e" stroke-width="1.2" />
        <circle cx="20" cy="22" r="8" fill="#f43f5e" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">8</text>
        <text x="36" y="24" fill="#fecdd3" font-size="12" font-weight="700">Generative AI Context Binding (GACB)</text>
        <text x="16" y="44" fill="#fda4af" font-size="10">Zero-Hallucination SQL Vector Prompt Injection</text>
        <text x="16" y="58" fill="#fb7185" font-size="9">Google Gemini 2.5 Flash Structured Reasoning</text>
      </g>
    </g>
  </g>

  <!-- Connectors T4 to T5 -->
  <g id="Connectors_T4_T5">
    <path d="M 960 820 L 960 858" stroke="#818cf8" stroke-width="2.5" marker-end="url(#arrowIndigo)" />
    <rect x="850" y="828" width="220" height="20" rx="4" fill="#0f172a" stroke="#4f46e5" stroke-width="0.8" />
    <text x="960" y="842" text-anchor="middle" fill="#a5b4fc" font-size="10" font-weight="700">ASYNC DATA PERSISTENCE &amp; SYNC</text>
  </g>

  <!-- TIER 5: PERSISTENCE & EXTERNAL ECOSYSTEM -->
  <g id="Tier5_Persistence" transform="translate(60, 865)">
    <rect x="0" y="0" width="1800" height="135" rx="16" fill="url(#dataCard)" stroke="#475569" stroke-width="1.5" filter="url(#dropShadow)" />
    
    <rect x="18" y="-12" width="370" height="26" rx="6" fill="#334155" />
    <text x="26" y="6" fill="#ffffff" font-size="12" font-weight="700" letter-spacing="0.8">TIER 5 : DATA PERSISTENCE &amp; EXTERNAL SERVICES</text>

    <!-- Sub-Block 1 -->
    <g transform="translate(25, 26)">
      <rect x="0" y="0" width="530" height="92" rx="10" fill="#0c1222" stroke="#334155" stroke-width="1" />
      <text x="16" y="24" fill="#f8fafc" font-size="13" font-weight="700">DUAL-ENGINE RELATIONAL PERSISTENCE (SQLAlchemy 2.0 Async)</text>
      
      <g transform="translate(16, 36)">
        <rect x="0" y="0" width="235" height="46" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="0.8" />
        <text x="12" y="18" fill="#e0f2fe" font-size="11" font-weight="700">🐬 MySQL 8.0 / MariaDB</text>
        <text x="12" y="34" fill="#94a3b8" font-size="9.5">Production Relational Engine</text>

        <rect x="250" y="0" width="245" height="46" rx="6" fill="#1e293b" stroke="#34d399" stroke-width="0.8" />
        <text x="12" y="18" fill="#d1fae5" font-size="11" font-weight="700">🔄 Dynamic SQLite 3 Fallback</text>
        <text x="12" y="34" fill="#94a3b8" font-size="9.5">Auto Offline / Local Dev Engine</text>
      </g>
    </g>

    <!-- Sub-Block 2 -->
    <g transform="translate(580, 26)">
      <rect x="0" y="0" width="480" height="92" rx="10" fill="#0c1222" stroke="#334155" stroke-width="1" />
      <text x="16" y="24" fill="#f8fafc" font-size="13" font-weight="700">STORAGE &amp; PERFORMANCE ACCELERATION</text>
      
      <g transform="translate(16, 36)">
        <rect x="0" y="0" width="215" height="46" rx="6" fill="#1e293b" stroke="#64748b" stroke-width="0.8" />
        <text x="12" y="18" fill="#f8fafc" font-size="11" font-weight="700">📁 Local Media Storage</text>
        <text x="12" y="34" fill="#94a3b8" font-size="9.5">PDFs, Resumes, QR Tokens</text>

        <rect x="230" y="0" width="215" height="46" rx="6" fill="#1e293b" stroke="#64748b" stroke-width="0.8" />
        <text x="12" y="18" fill="#f8fafc" font-size="11" font-weight="700">⚡ Memory LRU Cache</text>
        <text x="12" y="34" fill="#94a3b8" font-size="9.5">TTL-Controlled Query Caching</text>
      </g>
    </g>

    <!-- Sub-Block 3 -->
    <g transform="translate(1085, 26)">
      <rect x="0" y="0" width="690" height="92" rx="10" fill="#0c1222" stroke="#334155" stroke-width="1" />
      <text x="16" y="24" fill="#f8fafc" font-size="13" font-weight="700">EXTERNAL CLOUD &amp; HARDWARE-FREE INTEGRATIONS</text>
      
      <g transform="translate(16, 36)">
        <rect x="0" y="0" width="210" height="46" rx="6" fill="#1e293b" stroke="#f43f5e" stroke-width="0.8" />
        <text x="12" y="18" fill="#ffe4e6" font-size="11" font-weight="700">✨ Google Gemini 2.5 API</text>
        <text x="12" y="34" fill="#f43f5e" font-size="9.5">LLM Generation &amp; Parsing</text>

        <rect x="225" y="0" width="210" height="46" rx="6" fill="#1e293b" stroke="#ef4444" stroke-width="0.8" />
        <text x="12" y="18" fill="#fee2e2" font-size="11" font-weight="700">▶️ YouTube Streaming</text>
        <text x="12" y="34" fill="#ef4444" font-size="9.5">Curated Study Roadmap Vids</text>

        <rect x="450" y="0" width="205" height="46" rx="6" fill="#1e293b" stroke="#a855f7" stroke-width="0.8" />
        <text x="12" y="18" fill="#f3e8ff" font-size="11" font-weight="700">⌚ Wearable Haptics</text>
        <text x="12" y="34" fill="#c084fc" font-size="9.5">Smartwatch Push Notifications</text>
      </g>
    </g>
  </g>

  <!-- SLIDE FOOTER -->
  <g id="SlideFooter" transform="translate(60, 1025)">
    <text x="0" y="18" fill="#64748b" font-size="12" font-weight="600">CORE HIGHLIGHTS:</text>
    
    <g transform="translate(140, 4)">
      <rect x="0" y="0" width="260" height="22" rx="11" fill="#0f172a" stroke="#0284c7" stroke-width="0.8" />
      <text x="15" y="15" fill="#38bdf8" font-size="11" font-weight="600">⚡ 100% Hardware-Free Faculty Tracking</text>
      
      <rect x="275" y="0" width="245" height="22" rx="11" fill="#0f172a" stroke="#059669" stroke-width="0.8" />
      <text x="15" y="15" fill="#34d399" font-size="11" font-weight="600">🛡️ Zero-Clash CSP Timetable Solver</text>
      
      <rect x="535" y="0" width="275" height="22" rx="11" fill="#0f172a" stroke="#9333ea" stroke-width="0.8" />
      <text x="15" y="15" fill="#c084fc" font-size="11" font-weight="600">🧠 Ebbinghaus KDPA Retention Modeling</text>

      <rect x="825" y="0" width="265" height="22" rx="11" fill="#0f172a" stroke="#e11d48" stroke-width="0.8" />
      <text x="15" y="15" fill="#fb7185" font-size="11" font-weight="600">🔒 Zero-Hallucination GACB Architecture</text>
      
      <rect x="1105" y="0" width="280" height="22" rx="11" fill="#0f172a" stroke="#4f46e5" stroke-width="0.8" />
      <text x="15" y="15" fill="#a5b4fc" font-size="11" font-weight="600">🔄 Dynamic MySQL to SQLite Fallback Engine</text>
    </g>

    <text x="1800" y="18" text-anchor="end" fill="#64748b" font-size="12" font-weight="600">Verified Architecture · 72/72 Tests Passing (100%)</text>
  </g>
</svg>
"""

def generate_light_svg():
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" style="background:#ffffff; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="headerGradLight" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0369a1" />
      <stop offset="50%" stop-color="#4338ca" />
      <stop offset="100%" stop-color="#7e22ce" />
    </linearGradient>

    <filter id="cardShadowLight" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.08" />
    </filter>

    <marker id="arrowCyanLight" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 0 L 8 4 L 0 8 Z" fill="#0284c7" />
    </marker>
    <marker id="arrowEmeraldLight" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 0 L 8 4 L 0 8 Z" fill="#059669" />
    </marker>
    <marker id="arrowPurpleLight" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 0 L 8 4 L 0 8 Z" fill="#9333ea" />
    </marker>
    <marker id="arrowIndigoLight" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 0 L 8 4 L 0 8 Z" fill="#4f46e5" />
    </marker>
  </defs>

  <!-- Background Canvas -->
  <rect width="1920" height="1080" fill="#f8fafc" />
  
  <!-- Grid -->
  <g opacity="0.4">
    <pattern id="gridLight" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" stroke-width="1"/>
    </pattern>
    <rect width="1920" height="1080" fill="url(#gridLight)" />
  </g>

  <!-- SLIDE HEADER -->
  <g id="SlideHeader" transform="translate(60, 45)">
    <rect x="0" y="0" width="310" height="28" rx="14" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1" />
    <circle cx="14" cy="14" r="5" fill="#0284c7" />
    <text x="28" y="19" fill="#334155" font-size="13" font-weight="700" letter-spacing="1">PROJECT WORK PHASE - I | FIRST REVIEW</text>

    <text x="0" y="65" fill="url(#headerGradLight)" font-size="32" font-weight="800" letter-spacing="0.5">SMART CAMPUS AI (SCI) — SYSTEM ARCHITECTURE</text>
    <text x="0" y="92" fill="#475569" font-size="15" font-weight="500">
      An Asynchronous End-to-End Operational Pipeline: Full-Stack React Client, FastAPI Core, Mathematical Intelligence Suite &amp; Generative AI Context Binding
    </text>

    <text x="1800" y="32" text-anchor="end" fill="#0f172a" font-size="16" font-weight="800">SRI KRISHNA COLLEGE OF ENGINEERING AND TECHNOLOGY</text>
    <text x="1800" y="54" text-anchor="end" fill="#64748b" font-size="13" font-weight="600">Department of Computer Science and Engineering | Batch 11</text>
  </g>

  <!-- TIER 1: CLIENT & PRESENTATION LAYER -->
  <g id="Tier1_Presentation" transform="translate(60, 165)">
    <rect x="0" y="0" width="1800" height="135" rx="16" fill="#ffffff" stroke="#0284c7" stroke-width="2" filter="url(#cardShadowLight)" />
    
    <rect x="18" y="-12" width="280" height="26" rx="6" fill="#0284c7" />
    <text x="26" y="6" fill="#ffffff" font-size="12" font-weight="700" letter-spacing="0.8">TIER 1 : CLIENT &amp; PRESENTATION LAYER</text>

    <!-- Personas -->
    <g transform="translate(25, 26)">
      <rect x="0" y="0" width="310" height="92" rx="10" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1" />
      <text x="15" y="24" fill="#0369a1" font-size="13" font-weight="800">CAMPUS USER PERSONAS</text>
      
      <g transform="translate(15, 36)">
        <rect x="0" y="0" width="132" height="22" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="0.8" />
        <text x="10" y="15" fill="#0f172a" font-size="11" font-weight="700">🎓 Student Portal</text>
        
        <rect x="145" y="0" width="135" height="22" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="0.8" />
        <text x="155" y="15" fill="#0f172a" font-size="11" font-weight="700">👨‍🏫 Faculty / HOD</text>
        
        <rect x="0" y="26" width="132" height="22" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="0.8" />
        <text x="10" y="41" fill="#0f172a" font-size="11" font-weight="700">🏛️ Admin Console</text>
        
        <rect x="145" y="26" width="135" height="22" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="0.8" />
        <text x="155" y="41" fill="#0f172a" font-size="11" font-weight="700">🛡️ Warden / Guard</text>
      </g>
    </g>

    <path d="M 340 72 L 368 72" stroke="#0284c7" stroke-width="2" marker-end="url(#arrowCyanLight)" />

    <!-- React Modules -->
    <g transform="translate(375, 26)">
      <rect x="0" y="0" width="980" height="92" rx="10" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1" />
      <text x="16" y="24" fill="#0369a1" font-size="13" font-weight="800">REACT 18 SINGLE PAGE APPLICATION (VITE + TAILWIND + FRAMER MOTION)</text>
      
      <g transform="translate(16, 36)">
        <rect x="0" y="0" width="180" height="48" rx="6" fill="#ffffff" stroke="#93c5fd" stroke-width="1" />
        <text x="12" y="20" fill="#0f172a" font-size="12" font-weight="700">Academic Agenda</text>
        <text x="12" y="38" fill="#0369a1" font-size="10" font-weight="600">Attendance (75% Gate)</text>

        <rect x="192" y="0" width="180" height="48" rx="6" fill="#ffffff" stroke="#93c5fd" stroke-width="1" />
        <text x="12" y="20" fill="#0f172a" font-size="12" font-weight="700">Digital Gate Pass</text>
        <text x="12" y="38" fill="#0369a1" font-size="10" font-weight="600">Signed QR Verification</text>

        <rect x="384" y="0" width="180" height="48" rx="6" fill="#ffffff" stroke="#93c5fd" stroke-width="1" />
        <text x="12" y="20" fill="#0f172a" font-size="12" font-weight="700">Learning Intelligence</text>
        <text x="12" y="38" fill="#0369a1" font-size="10" font-weight="600">Active Watch Tracker</text>

        <rect x="576" y="0" width="180" height="48" rx="6" fill="#ffffff" stroke="#93c5fd" stroke-width="1" />
        <text x="12" y="20" fill="#0f172a" font-size="12" font-weight="700">Campus Pulse Hub</text>
        <text x="12" y="38" fill="#0369a1" font-size="10" font-weight="600">Density Heatmaps</text>

        <rect x="768" y="0" width="180" height="48" rx="6" fill="#ffffff" stroke="#93c5fd" stroke-width="1" />
        <text x="12" y="20" fill="#0f172a" font-size="12" font-weight="700">Career &amp; Placement</text>
        <text x="12" y="38" fill="#0369a1" font-size="10" font-weight="600">ATS Resume &amp; Skills</text>
      </g>
    </g>

    <path d="M 1360 72 L 1388 72" stroke="#0284c7" stroke-width="2" marker-end="url(#arrowCyanLight)" />

    <!-- State & Gateway -->
    <g transform="translate(1395, 26)">
      <rect x="0" y="0" width="380" height="92" rx="10" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1" />
      <text x="16" y="24" fill="#0369a1" font-size="13" font-weight="800">CLIENT RUNTIME &amp; BRIDGES</text>
      
      <g transform="translate(16, 36)">
        <rect x="0" y="0" width="168" height="48" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
        <text x="10" y="18" fill="#0f172a" font-size="11" font-weight="700">Axios HTTP Client</text>
        <text x="10" y="36" fill="#64748b" font-size="10">JWT Bearer Interceptors</text>

        <rect x="180" y="0" width="168" height="48" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
        <text x="10" y="18" fill="#0f172a" font-size="11" font-weight="700">WebSocket / Native</text>
        <text x="10" y="36" fill="#64748b" font-size="10">Capacitor Haptic Bridge</text>
      </g>
    </g>
  </g>

  <!-- Connectors T1 to T2 -->
  <g id="Connectors_T1_T2">
    <path d="M 680 300 L 680 338" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="4 3" marker-end="url(#arrowCyanLight)" />
    <rect x="620" y="306" width="120" height="20" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="1" />
    <text x="680" y="320" text-anchor="middle" fill="#0369a1" font-size="10" font-weight="800">HTTPS REST API</text>

    <path d="M 1480 300 L 1480 338" stroke="#059669" stroke-width="2.5" stroke-dasharray="4 3" marker-end="url(#arrowEmeraldLight)" />
    <rect x="1405" y="306" width="150" height="20" rx="4" fill="#ffffff" stroke="#059669" stroke-width="1" />
    <text x="1480" y="320" text-anchor="middle" fill="#047857" font-size="10" font-weight="800">WSS NOTIFICATION STREAM</text>
  </g>

  <!-- TIER 2: API GATEWAY & SECURITY LAYER -->
  <g id="Tier2_Gateway" transform="translate(60, 345)">
    <rect x="0" y="0" width="1800" height="90" rx="16" fill="#ffffff" stroke="#0d9488" stroke-width="2" filter="url(#cardShadowLight)" />
    
    <rect x="18" y="-12" width="310" height="26" rx="6" fill="#0d9488" />
    <text x="26" y="6" fill="#ffffff" font-size="12" font-weight="700" letter-spacing="0.8">TIER 2 : API GATEWAY &amp; SECURITY (FASTAPI)</text>

    <g transform="translate(25, 22)">
      <rect x="0" y="0" width="320" height="52" rx="8" fill="#f0fdf4" stroke="#99f6e4" stroke-width="1" />
      <text x="15" y="22" fill="#0f766e" font-size="12" font-weight="700">FastAPI Asynchronous Engine</text>
      <text x="15" y="40" fill="#134e4a" font-size="10">Uvicorn Worker · Central Router · v1 Versioning</text>

      <rect x="340" y="0" width="330" height="52" rx="8" fill="#f0fdf4" stroke="#99f6e4" stroke-width="1" />
      <text x="15" y="22" fill="#0f766e" font-size="12" font-weight="700">Auth &amp; RBAC Route Guards</text>
      <text x="15" y="40" fill="#134e4a" font-size="10">JWT Token Decode · Role Enforcement (4 Tiers)</text>

      <rect x="690" y="0" width="350" height="52" rx="8" fill="#f0fdf4" stroke="#99f6e4" stroke-width="1" />
      <text x="15" y="22" fill="#0f766e" font-size="12" font-weight="700">Security &amp; Rate-Limiting Guard</text>
      <text x="15" y="40" fill="#134e4a" font-size="10">CORS · XSS Sanitizer · Token Bucket Rate-Limiter</text>

      <rect x="1060" y="0" width="330" height="52" rx="8" fill="#f0fdf4" stroke="#99f6e4" stroke-width="1" />
      <text x="15" y="22" fill="#0f766e" font-size="12" font-weight="700">Pydantic v2 Contract Layer</text>
      <text x="15" y="40" fill="#134e4a" font-size="10">Strict Request Validation &amp; Schema Serialization</text>

      <rect x="1410" y="0" width="365" height="52" rx="8" fill="#f0fdf4" stroke="#99f6e4" stroke-width="1" />
      <text x="15" y="22" fill="#0f766e" font-size="12" font-weight="700">WebSocket Broadcast Manager</text>
      <text x="15" y="40" fill="#134e4a" font-size="10">Real-time Haptic &amp; Attendance Push Dispatch</text>
    </g>
  </g>

  <!-- Connectors T2 to T3 -->
  <g id="Connectors_T2_T3">
    <path d="M 960 435 L 960 473" stroke="#0d9488" stroke-width="2.5" marker-end="url(#arrowEmeraldLight)" />
    <rect x="880" y="442" width="160" height="20" rx="4" fill="#ffffff" stroke="#0d9488" stroke-width="1" />
    <text x="960" y="456" text-anchor="middle" fill="#0f766e" font-size="10" font-weight="800">DISPATCH SERVICE CALLS</text>
  </g>

  <!-- TIER 3: CORE APPLICATION SERVICES -->
  <g id="Tier3_Services" transform="translate(60, 480)">
    <rect x="0" y="0" width="1800" height="100" rx="16" fill="#ffffff" stroke="#4f46e5" stroke-width="2" filter="url(#cardShadowLight)" />
    
    <rect x="18" y="-12" width="320" height="26" rx="6" fill="#4f46e5" />
    <text x="26" y="6" fill="#ffffff" font-size="12" font-weight="700" letter-spacing="0.8">TIER 3 : BUSINESS LOGIC &amp; DOMAIN SERVICES</text>

    <g transform="translate(25, 24)">
      <rect x="0" y="0" width="335" height="58" rx="8" fill="#eef2ff" stroke="#c7d2fe" stroke-width="1" />
      <text x="16" y="24" fill="#3730a3" font-size="13" font-weight="700">Academic &amp; Timetable Service</text>
      <text x="16" y="44" fill="#4338ca" font-size="10.5">75% Attendance Guard · Department Rosters</text>

      <rect x="355" y="0" width="335" height="58" rx="8" fill="#eef2ff" stroke="#c7d2fe" stroke-width="1" />
      <text x="16" y="24" fill="#3730a3" font-size="13" font-weight="700">Gate Pass Lifecycle Service</text>
      <text x="16" y="44" fill="#4338ca" font-size="10.5">Multi-tier Workflow · QR Signing &amp; Invalidation</text>

      <rect x="710" y="0" width="335" height="58" rx="8" fill="#eef2ff" stroke="#c7d2fe" stroke-width="1" />
      <text x="16" y="24" fill="#3730a3" font-size="13" font-weight="700">Cognitive Learning Service</text>
      <text x="16" y="44" fill="#4338ca" font-size="10.5">Study Tracker · YouTube Embeds · Quizzes</text>

      <rect x="1065" y="0" width="335" height="58" rx="8" fill="#eef2ff" stroke="#c7d2fe" stroke-width="1" />
      <text x="16" y="24" fill="#3730a3" font-size="13" font-weight="700">Placement &amp; Resume Service</text>
      <text x="16" y="44" fill="#4338ca" font-size="10.5">Resume Extraction · Bigram Matching · ATS Index</text>

      <rect x="1420" y="0" width="355" height="58" rx="8" fill="#eef2ff" stroke="#c7d2fe" stroke-width="1" />
      <text x="16" y="24" fill="#3730a3" font-size="13" font-weight="700">Operations &amp; Faculty Locator</text>
      <text x="16" y="44" fill="#4338ca" font-size="10.5">Hardware-Free Schedule Resolver · Density</text>
    </g>
  </g>

  <!-- Connectors T3 to T4 -->
  <g id="Connectors_T3_T4">
    <path d="M 960 580 L 960 618" stroke="#9333ea" stroke-width="2.5" marker-end="url(#arrowPurpleLight)" />
    <rect x="850" y="588" width="220" height="20" rx="4" fill="#ffffff" stroke="#9333ea" stroke-width="1" />
    <text x="960" y="602" text-anchor="middle" fill="#7e22ce" font-size="10" font-weight="800">MATHEMATICAL INFERENCE &amp; REASONING</text>
  </g>

  <!-- TIER 4: MATHEMATICAL INTELLIGENCE SUITE -->
  <g id="Tier4_Intelligence" transform="translate(60, 625)">
    <rect x="0" y="0" width="1800" height="195" rx="16" fill="#ffffff" stroke="#a21caf" stroke-width="2" filter="url(#cardShadowLight)" />
    
    <rect x="18" y="-14" width="480" height="28" rx="6" fill="#a21caf" />
    <text x="26" y="5" fill="#ffffff" font-size="13" font-weight="800" letter-spacing="0.8">TIER 4 : MATHEMATICAL INTELLIGENCE SUITE &amp; AI ENGINES</text>

    <g transform="translate(25, 24)">
      <!-- Algo 1 -->
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="425" height="66" rx="8" fill="#faf5ff" stroke="#d8b4fe" stroke-width="1" />
        <circle cx="20" cy="22" r="8" fill="#a21caf" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">1</text>
        <text x="36" y="24" fill="#581c87" font-size="12" font-weight="700">CSP Backtracking Timetable Solver</text>
        <text x="16" y="44" fill="#7e22ce" font-size="10">Constraint Satisfaction · Zero Faculty/Room Clashes</text>
        <text x="16" y="58" fill="#9333ea" font-size="9">Heuristic: Minimum Remaining Values (MRV)</text>
      </g>

      <!-- Algo 2 -->
      <g transform="translate(445, 0)">
        <rect x="0" y="0" width="425" height="66" rx="8" fill="#faf5ff" stroke="#d8b4fe" stroke-width="1" />
        <circle cx="20" cy="22" r="8" fill="#a21caf" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">2</text>
        <text x="36" y="24" fill="#581c87" font-size="12" font-weight="700">CLPA Cognitive Pathway Classifier</text>
        <text x="16" y="44" fill="#7e22ce" font-size="10">Rolling Reinforcement: dt = α·Score + (1-α)·dt-1</text>
        <text x="16" y="58" fill="#9333ea" font-size="9">Classifies: Practical, Reading, Analytical &amp; Consistent</text>
      </g>

      <!-- Algo 3 -->
      <g transform="translate(890, 0)">
        <rect x="0" y="0" width="425" height="66" rx="8" fill="#faf5ff" stroke="#d8b4fe" stroke-width="1" />
        <circle cx="20" cy="22" r="8" fill="#a21caf" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">3</text>
        <text x="36" y="24" fill="#581c87" font-size="12" font-weight="700">KDPA Ebbinghaus Decay Predictor</text>
        <text x="16" y="44" fill="#7e22ce" font-size="10">Memory Curve: R(t) = exp(-t / S)</text>
        <text x="16" y="58" fill="#9333ea" font-size="9">Dynamic Prerequisite Graph: Propagation adjustments</text>
      </g>

      <!-- Algo 4 -->
      <g transform="translate(1335, 0)">
        <rect x="0" y="0" width="440" height="66" rx="8" fill="#faf5ff" stroke="#d8b4fe" stroke-width="1" />
        <circle cx="20" cy="22" r="8" fill="#a21caf" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">4</text>
        <text x="36" y="24" fill="#581c87" font-size="12" font-weight="700">ALRA Academic Latent Risk Assessor</text>
        <text x="16" y="44" fill="#7e22ce" font-size="10">Weighted Dropout Distress Classifier</text>
        <text x="16" y="58" fill="#9333ea" font-size="9">Attendance Trends + Arrear History + Mark Anomalies</text>
      </g>

      <!-- Algo 5 -->
      <g transform="translate(0, 78)">
        <rect x="0" y="0" width="425" height="66" rx="8" fill="#faf5ff" stroke="#d8b4fe" stroke-width="1" />
        <circle cx="20" cy="22" r="8" fill="#7e22ce" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">5</text>
        <text x="36" y="24" fill="#581c87" font-size="12" font-weight="700">DCRA+ Dynamic Resource Allocator</text>
        <text x="16" y="44" fill="#7e22ce" font-size="10">Classroom Seat Optimization &amp; Energy Savings</text>
        <text x="16" y="58" fill="#9333ea" font-size="9">Real-time Emergency &amp; Maintenance Reallocation</text>
      </g>

      <!-- Algo 6 -->
      <g transform="translate(445, 78)">
        <rect x="0" y="0" width="425" height="66" rx="8" fill="#faf5ff" stroke="#d8b4fe" stroke-width="1" />
        <circle cx="20" cy="22" r="8" fill="#7e22ce" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">6</text>
        <text x="36" y="24" fill="#581c87" font-size="12" font-weight="700">DSEA Skill Evolution &amp; Gap Matcher</text>
        <text x="16" y="44" fill="#7e22ce" font-size="10">Fuzzy Jaccard Bigram: J(S1,S2) = |G1 ∩ G2| / |G1 ∪ G2|</text>
        <text x="16" y="58" fill="#9333ea" font-size="9">ATS Parser + Synonym Ontology Mapping</text>
      </g>

      <!-- Algo 7 -->
      <g transform="translate(890, 78)">
        <rect x="0" y="0" width="425" height="66" rx="8" fill="#faf5ff" stroke="#d8b4fe" stroke-width="1" />
        <circle cx="20" cy="22" r="8" fill="#7e22ce" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">7</text>
        <text x="36" y="24" fill="#581c87" font-size="12" font-weight="700">Campus Pulse Real-Time Engine</text>
        <text x="16" y="44" fill="#7e22ce" font-size="10">Zonal Activity Density &amp; Bottleneck Detection</text>
        <text x="16" y="58" fill="#9333ea" font-size="9">1-3 Hour Forward Movement Predictive Matrix</text>
      </g>

      <!-- Algo 8 -->
      <g transform="translate(1335, 78)">
        <rect x="0" y="0" width="440" height="66" rx="8" fill="#fff1f2" stroke="#f43f5e" stroke-width="1.2" />
        <circle cx="20" cy="22" r="8" fill="#e11d48" />
        <text x="16" y="26" fill="#ffffff" font-size="10" font-weight="800">8</text>
        <text x="36" y="24" fill="#9f1239" font-size="12" font-weight="700">Generative AI Context Binding (GACB)</text>
        <text x="16" y="44" fill="#be123c" font-size="10">Zero-Hallucination SQL Vector Prompt Injection</text>
        <text x="16" y="58" fill="#e11d48" font-size="9">Google Gemini 2.5 Flash Structured Reasoning</text>
      </g>
    </g>
  </g>

  <!-- Connectors T4 to T5 -->
  <g id="Connectors_T4_T5">
    <path d="M 960 820 L 960 858" stroke="#4f46e5" stroke-width="2.5" marker-end="url(#arrowIndigoLight)" />
    <rect x="850" y="828" width="220" height="20" rx="4" fill="#ffffff" stroke="#4f46e5" stroke-width="1" />
    <text x="960" y="842" text-anchor="middle" fill="#3730a3" font-size="10" font-weight="800">ASYNC DATA PERSISTENCE &amp; SYNC</text>
  </g>

  <!-- TIER 5: PERSISTENCE & EXTERNAL ECOSYSTEM -->
  <g id="Tier5_Persistence" transform="translate(60, 865)">
    <rect x="0" y="0" width="1800" height="135" rx="16" fill="#ffffff" stroke="#64748b" stroke-width="2" filter="url(#cardShadowLight)" />
    
    <rect x="18" y="-12" width="370" height="26" rx="6" fill="#475569" />
    <text x="26" y="6" fill="#ffffff" font-size="12" font-weight="700" letter-spacing="0.8">TIER 5 : DATA PERSISTENCE &amp; EXTERNAL SERVICES</text>

    <!-- Sub-Block 1 -->
    <g transform="translate(25, 26)">
      <rect x="0" y="0" width="530" height="92" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
      <text x="16" y="24" fill="#1e293b" font-size="13" font-weight="800">DUAL-ENGINE RELATIONAL PERSISTENCE (SQLAlchemy 2.0 Async)</text>
      
      <g transform="translate(16, 36)">
        <rect x="0" y="0" width="235" height="46" rx="6" fill="#ffffff" stroke="#38bdf8" stroke-width="1" />
        <text x="12" y="18" fill="#0369a1" font-size="11" font-weight="700">🐬 MySQL 8.0 / MariaDB</text>
        <text x="12" y="34" fill="#64748b" font-size="9.5">Production Relational Engine</text>

        <rect x="250" y="0" width="245" height="46" rx="6" fill="#ffffff" stroke="#34d399" stroke-width="1" />
        <text x="12" y="18" fill="#047857" font-size="11" font-weight="700">🔄 Dynamic SQLite 3 Fallback</text>
        <text x="12" y="34" fill="#64748b" font-size="9.5">Auto Offline / Local Dev Engine</text>
      </g>
    </g>

    <!-- Sub-Block 2 -->
    <g transform="translate(580, 26)">
      <rect x="0" y="0" width="480" height="92" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
      <text x="16" y="24" fill="#1e293b" font-size="13" font-weight="800">STORAGE &amp; PERFORMANCE ACCELERATION</text>
      
      <g transform="translate(16, 36)">
        <rect x="0" y="0" width="215" height="46" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
        <text x="12" y="18" fill="#0f172a" font-size="11" font-weight="700">📁 Local Media Storage</text>
        <text x="12" y="34" fill="#64748b" font-size="9.5">PDFs, Resumes, QR Tokens</text>

        <rect x="230" y="0" width="215" height="46" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
        <text x="12" y="18" fill="#0f172a" font-size="11" font-weight="700">⚡ Memory LRU Cache</text>
        <text x="12" y="34" fill="#64748b" font-size="9.5">TTL-Controlled Query Caching</text>
      </g>
    </g>

    <!-- Sub-Block 3 -->
    <g transform="translate(1085, 26)">
      <rect x="0" y="0" width="690" height="92" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
      <text x="16" y="24" fill="#1e293b" font-size="13" font-weight="800">EXTERNAL CLOUD &amp; HARDWARE-FREE INTEGRATIONS</text>
      
      <g transform="translate(16, 36)">
        <rect x="0" y="0" width="210" height="46" rx="6" fill="#ffffff" stroke="#f43f5e" stroke-width="1" />
        <text x="12" y="18" fill="#be123c" font-size="11" font-weight="700">✨ Google Gemini 2.5 API</text>
        <text x="12" y="34" fill="#64748b" font-size="9.5">LLM Generation &amp; Parsing</text>

        <rect x="225" y="0" width="210" height="46" rx="6" fill="#ffffff" stroke="#ef4444" stroke-width="1" />
        <text x="12" y="18" fill="#b91c1c" font-size="11" font-weight="700">▶️ YouTube Streaming</text>
        <text x="12" y="34" fill="#64748b" font-size="9.5">Curated Study Roadmap Vids</text>

        <rect x="450" y="0" width="205" height="46" rx="6" fill="#ffffff" stroke="#a855f7" stroke-width="1" />
        <text x="12" y="18" fill="#7e22ce" font-size="11" font-weight="700">⌚ Wearable Haptics</text>
        <text x="12" y="34" fill="#64748b" font-size="9.5">Smartwatch Push Notifications</text>
      </g>
    </g>
  </g>

  <!-- SLIDE FOOTER -->
  <g id="SlideFooter" transform="translate(60, 1025)">
    <text x="0" y="18" fill="#475569" font-size="12" font-weight="700">CORE HIGHLIGHTS:</text>
    
    <g transform="translate(140, 4)">
      <rect x="0" y="0" width="260" height="22" rx="11" fill="#f0f9ff" stroke="#0284c7" stroke-width="1" />
      <text x="15" y="15" fill="#0369a1" font-size="11" font-weight="700">⚡ 100% Hardware-Free Faculty Tracking</text>
      
      <rect x="275" y="0" width="245" height="22" rx="11" fill="#ecfdf5" stroke="#059669" stroke-width="1" />
      <text x="15" y="15" fill="#047857" font-size="11" font-weight="700">🛡️ Zero-Clash CSP Timetable Solver</text>
      
      <rect x="535" y="0" width="275" height="22" rx="11" fill="#faf5ff" stroke="#9333ea" stroke-width="1" />
      <text x="15" y="15" fill="#7e22ce" font-size="11" font-weight="700">🧠 Ebbinghaus KDPA Retention Modeling</text>

      <rect x="825" y="0" width="265" height="22" rx="11" fill="#fff1f2" stroke="#e11d48" stroke-width="1" />
      <text x="15" y="15" fill="#be123c" font-size="11" font-weight="700">🔒 Zero-Hallucination GACB Architecture</text>
      
      <rect x="1105" y="0" width="280" height="22" rx="11" fill="#eef2ff" stroke="#4f46e5" stroke-width="1" />
      <text x="15" y="15" fill="#3730a3" font-size="11" font-weight="700">🔄 Dynamic MySQL to SQLite Fallback Engine</text>
    </g>

    <text x="1800" y="18" text-anchor="end" fill="#64748b" font-size="12" font-weight="700">Verified Architecture · 72/72 Tests Passing (100%)</text>
  </g>
</svg>
"""

def main():
    target_dir = os.path.join(os.getcwd(), "docs", "architecture")
    os.makedirs(target_dir, exist_ok=True)
    
    dark_svg = generate_dark_svg()
    light_svg = generate_light_svg()
    
    # Save SVG variants
    with open(os.path.join(target_dir, "smart_campus_architecture_dark.svg"), "w", encoding="utf-8") as f:
        f.write(dark_svg)
    with open(os.path.join(target_dir, "smart_campus_architecture_light.svg"), "w", encoding="utf-8") as f:
        f.write(light_svg)
    with open(os.path.join(target_dir, "smart_campus_architecture_ppt.svg"), "w", encoding="utf-8") as f:
        f.write(dark_svg)  # Default
    
    # Save Slide Preview HTML with Interactive Theme Switcher
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Campus AI - System Architecture (16:9 Slide Ready)</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: #090d16;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      padding: 24px;
    }}
    .header-bar {{
      width: 100%;
      max-width: 1920px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .title-group h1 {{
      font-size: 20px;
      font-weight: 700;
      color: #f8fafc;
    }}
    .title-group p {{
      font-size: 13px;
      color: #94a3b8;
    }}
    .controls {{
      display: flex;
      gap: 12px;
      align-items: center;
    }}
    .theme-toggle {{
      display: flex;
      background: #1e293b;
      border-radius: 8px;
      padding: 3px;
      border: 1px solid #334155;
    }}
    .theme-btn {{
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 600;
      border: none;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;
    }}
    .theme-btn.active {{
      background: #0284c7;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
    }}
    .btn {{
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid #334155;
      background: #1e293b;
      color: #f1f5f9;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }}
    .btn:hover {{
      background: #334155;
      border-color: #38bdf8;
      color: #ffffff;
    }}
    .btn-accent {{
      background: #0284c7;
      border-color: #38bdf8;
    }}
    .btn-accent:hover {{
      background: #0369a1;
    }}
    .slide-container {{
      width: 1920px;
      height: 1080px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9);
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }}
    .slide-svg {{
      width: 100%;
      height: 100%;
      display: block;
    }}
    .hidden {{
      display: none !important;
    }}
    .footer-note {{
      margin-top: 16px;
      color: #64748b;
      font-size: 13px;
    }}
  </style>
</head>
<body>

  <div class="header-bar">
    <div class="title-group">
      <h1>Smart Campus AI Management System — System Architecture Slide</h1>
      <p>Native 16:9 (1920×1080) slide presentation diagram for PowerPoint, Keynote &amp; IEEE evaluation</p>
    </div>
    
    <div class="controls">
      <div class="theme-toggle">
        <button class="theme-btn active" id="btnDark" onclick="setTheme('dark')">🌙 Dark Theme (Modern Tech)</button>
        <button class="theme-btn" id="btnLight" onclick="setTheme('light')">☀️ Light Theme (Academic White)</button>
      </div>

      <a id="downloadSvgLink" href="smart_campus_architecture_dark.svg" download="smart_campus_architecture.svg" class="btn btn-accent">
        ⬇️ Download SVG for PPT
      </a>
      <a id="downloadPngLink" href="smart_campus_architecture_dark.png" download="smart_campus_architecture.png" class="btn">
        🖼️ Download PNG
      </a>
      <button onclick="window.print()" class="btn">🖨️ Print PDF</button>
    </div>
  </div>

  <div class="slide-container" id="slide">
    <div id="svgContainerDark" class="slide-svg">
      {dark_svg}
    </div>
    <div id="svgContainerLight" class="slide-svg hidden">
      {light_svg}
    </div>
  </div>

  <div class="footer-note">
    💡 <b>Tip for PowerPoint:</b> Drag and drop the downloaded <code>.svg</code> file directly onto your slide in PowerPoint (or <i>Insert &gt; Picture &gt; From This Device</i>). You can right-click the diagram in PowerPoint and select <b>"Convert to Shape"</b> to edit any box, text, or color directly!
  </div>

  <script>
    function setTheme(theme) {{
      const darkContainer = document.getElementById('svgContainerDark');
      const lightContainer = document.getElementById('svgContainerLight');
      const btnDark = document.getElementById('btnDark');
      const btnLight = document.getElementById('btnLight');
      const downloadSvg = document.getElementById('downloadSvgLink');
      const downloadPng = document.getElementById('downloadPngLink');

      if (theme === 'dark') {{
        darkContainer.classList.remove('hidden');
        lightContainer.classList.add('hidden');
        btnDark.classList.add('active');
        btnLight.classList.remove('active');
        downloadSvg.href = 'smart_campus_architecture_dark.svg';
        downloadPng.href = 'smart_campus_architecture_dark.png';
      }} else {{
        darkContainer.classList.add('hidden');
        lightContainer.classList.remove('hidden');
        btnDark.classList.remove('active');
        btnLight.classList.add('active');
        downloadSvg.href = 'smart_campus_architecture_light.svg';
        downloadPng.href = 'smart_campus_architecture_light.png';
      }}
    }}
  </script>
</body>
</html>
"""
    with open(os.path.join(target_dir, "smart_campus_architecture_ppt.html"), "w", encoding="utf-8") as f:
        f.write(html_content)
    print("Files successfully generated in docs/architecture!")

if __name__ == "__main__":
    main()
