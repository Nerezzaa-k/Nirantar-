# Nirantar v3 — System Architecture Documentation

## Core Workflow Loop
**PREDICT → UNDERSTAND → RESCUE → LEARN**

```
┌────────────────────────────────────────────────────────────────────────┐
│                          NIRANTAR v3 PLATFORM                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
1. PREDICT                   2. UNDERSTAND                3. RESCUE
Explainable Risk Engine      Weekly Check-ins             Configured Mapping
(0-100 Score)                (Reason Capture)             (Targeted Action)
 • Refill Overdue (25 pts)    • Cannot travel              • Doorstep refill batch
 • Visit Overdue (20 pts)     • Feels fine                 • Asymptomatic counselling
 • Missed Visits (15 pts)     • No medicine                • Alternate PHC stock
 • Clinical Trend (15 pts)    • Side effects               • Escalate to doctor
 • Seasonal Factor (10 pts)   • Wage/Money barrier         • Flexible clinic hours
 • Distance (10 pts)
 • Stockout (5 pts)
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    ▼
                                4. LEARN
                     What Works Outcome Feedback Loop
                      • Contact confirmation
                      • Adherence resumption logged
                      • Real-time effectiveness analytics
```

---

## Service Decomposition

### 1. Frontend Client (`frontend/`)
- **Technology**: React 18, Vite 5, Tailwind CSS 3, React Router v6, Recharts, Leaflet / OpenStreetMap, Lucide Icons.
- **Roles & Interfaces**:
  - Healthcare Worker Mode (ASHA / ANM field queue, priority rescue actions).
  - Patient Mode (Accessible 3-step check-in, tablet slider, next clinic appointment).
  - Family Caregiver Mode (Linked family members, supportive reminders and nudges).
  - PHC / District Administration Dashboard (Executive KPIs, Leaflet Hotspots map, "What Works" engine, Inventory sentinel).
- **Design System**: Deep teal brand identity (`#0D5C58`), light/dark themes with instant toggle, accessible text contrast, mobile-first PWA navigation.

### 2. Main Backend (`backend/`)
- **Technology**: Node.js v24, Express.js, Mongoose ODM, MongoDB Atlas, JWT, bcrypt.
- **Architecture**: Strict MVC (Model-View-Controller) architecture:
  - `src/models/`: Schema definitions with validations, compound indexes, and references.
  - `src/controllers/`: HTTP request handling and response formatting.
  - `src/services/`: Core business logic (`riskEngine.js`, `reasonActionService.js`, `analyticsService.js`, `aiBridgeService.js`).
  - `src/middleware/`: JWT verification, role-based access control, patient ownership authorization, centralized error handling, audit logging.
  - `src/routes/`: Versioned RESTful APIs (`/api/v1/*`).

### 3. AI Reasoning & Recommendation Service (`ai-service/`)
- **Technology**: Python 3.11, FastAPI, OpenAI Python SDK, Pydantic v2, Uvicorn.
- **Capabilities**:
  - Feature A: Explain risk scores with transparent factor attribution.
  - Feature B: Classify self-reported barriers into normalized action categories.
  - Feature C: Recommend contextual community interventions.
  - Feature D: Summarize district-level non-adherence insights.
  - Feature E: Care worker interactive AI assistant.
- **Safety & Resilience**:
  - Strict fallback to deterministic adherence protocols when OpenAI API key is missing or service is offline.
  - Mandates human review for all consequential medical actions.
  - Strict prohibition against automatic dosage changes or medicine prescriptions.
  ### 4. Smart Escalation & Follow-up Alerts
- Automatically flag unresolved high-priority follow-up cases.
- Notify assigned healthcare workers when patients remain unreachable.
- Escalate unresolved cases to authorized supervisors after configurable time limits.
- Track escalation status until the case is reviewed or resolved.
