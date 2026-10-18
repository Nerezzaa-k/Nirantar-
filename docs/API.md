# Nirantar v3 — REST API Specification

**Base URL**: `/api/v1`  
**Protocol**: HTTP/1.1 or HTTP/2 over TLS (Production)  
**Encoding**: UTF-8, JSON payload  

---

## 1. Authentication & Security

All protected endpoints require a valid JWT token passed in either:
- **Authorization Header**: `Authorization: Bearer <token>`
- **HTTP-Only Cookie**: `nirantar_token=<token>`

### Roles & Access Matrix

| Role | Identifier | Permitted Operations |
|------|------------|-----------------------|
| **PHC / District Admin** | `admin` | Full read/write access to district analytics, audit logs, worker assignments, stock management, patient populations. |
| **Healthcare Worker** | `worker` | Manage assigned patients, log visits, record refills, capture reasons, trigger interventions, log outcomes, consult AI copilot. |
| **Patient** | `patient` | Access own medical records, submit weekly check-ins, report barriers, view remaining tablets and refill schedule. |
| **Family Caregiver** | `caregiver` | Read-only view for linked patient's adherence, upcoming dates, submit authorized barriers/reminders. |

---

## 2. Authentication Endpoints (`/auth`)

### 2.1 Login
`POST /auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "asha.sunita@nirantar.org",
  "password": "worker123"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "67114b7e...",
    "name": "Sunita Devi",
    "email": "asha.sunita@nirantar.org",
    "role": "worker",
    "assignedVillages": ["Rampur", "Bhimtal"]
  }
}
```

### 2.2 Register
`POST /auth/register`
- **Access**: Public or Admin restricted depending on setup
- **Request Body**:
```json
{
  "name": "Ramesh Kumar",
  "email": "ramesh.kumar@patient.nirantar.org",
  "password": "patient123",
  "role": "patient",
  "phone": "+919876543210"
}
```

### 2.3 Current User Info
`GET /auth/me`
- **Access**: Authenticated (Any role)
- **Response `200 OK`**:
```json
{
  "success": true,
  "user": {
    "id": "67114b7e...",
    "name": "Sunita Devi",
    "role": "worker",
    "email": "asha.sunita@nirantar.org"
  }
}
```

### 2.4 Forgot Password
`POST /auth/forgot-password`
- **Request Body**: `{"email": "user@example.com"}`
- **Response `200 OK`**: `{"success": true, "message": "Password reset token sent"}`

### 2.5 Reset Password
`POST /auth/reset-password`
- **Request Body**: `{"token": "reset_token_here", "password": "newSecurePassword123"}`
- **Response `200 OK`**: `{"success": true, "message": "Password updated successfully"}`

---

## 3. Patients Endpoints (`/patients`)

### 3.1 List Patients
`GET /patients`
- **Access**: `worker`, `admin`
- **Query Parameters**:
  - `riskCategory`: `low` | `medium` | `high`
  - `condition`: String (e.g. `Hypertension`, `Type 2 Diabetes`, `Tuberculosis`)
  - `village`: Village ID or Name
  - `search`: Name or Patient ID (`PAT-1001`)
  - `page`: Integer (default: 1)
  - `limit`: Integer (default: 20)
- **Response `200 OK`**:
```json
{
  "success": true,
  "total": 35,
  "page": 1,
  "pages": 2,
  "patients": [
    {
      "_id": "67114b7e...",
      "patientId": "PAT-1001",
      "name": "Ramesh Kumar",
      "age": 54,
      "gender": "male",
      "village": { "name": "Rampur", "distanceKm": 14 },
      "primaryCondition": { "name": "Hypertension" },
      "currentRiskScore": 77,
      "currentRiskCategory": "high",
      "remainingDaysOfMedication": 2,
      "nextRefillDate": "2026-10-19T00:00:00.000Z",
      "lastCheckInDate": "2026-10-15T10:00:00.000Z"
    }
  ]
}
```

### 3.2 Get Single Patient Details
`GET /patients/:id`
- **Access**: `admin`, `worker` (assigned), `patient` (self), `caregiver` (linked)
- **Response `200 OK`**: Detailed patient object including conditions, contacts, care worker details, and risk status.

### 3.3 Create New Patient
`POST /patients`
- **Access**: `worker`, `admin`
- **Request Body**:
```json
{
  "name": "Pooja Sharma",
  "age": 42,
  "gender": "female",
  "phone": "+919876543220",
  "village": "67114b7e...",
  "primaryCondition": "67114b7e...",
  "regimenDetails": "Metformin 500mg BID",
  "initialTabletsSupplied": 60,
  "nextAppointmentDate": "2026-11-15T09:00:00.000Z"
}
```

---

## 4. Risk Engine Endpoints (`/risk`)

### 4.1 Get Latest Risk Score & Factor Breakdown
`GET /risk/:patientId`
- **Access**: `worker`, `admin`, `patient` (self)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "patientId": "PAT-1001",
    "score": 77,
    "category": "high",
    "calculatedAt": "2026-10-17T15:20:00.000Z",
    "factors": [
      {
        "factor": "Medication Refill Overdue",
        "weight": 25,
        "scoreContribution": 20,
        "details": "Only 2 days remaining, last refill was 28 days ago"
      },
      {
        "factor": "Days Since Last Clinical Visit",
        "weight": 20,
        "scoreContribution": 18,
        "details": "42 days since last visit (target: 30 days)"
      },
      {
        "factor": "Distance to Primary Health Center",
        "weight": 10,
        "scoreContribution": 10,
        "details": "Distance is 14 km (threshold > 10km)"
      },
      {
        "factor": "Seasonal Travel Barrier",
        "weight": 10,
        "scoreContribution": 10,
        "details": "Monsoon/harvest season in Rampur sector"
      }
    ],
    "recommendation": "Urgent home visit or doorstep delivery required before medication exhaustion."
  }
}
```

### 4.2 Recalculate Risk Score
`POST /risk/:patientId/calculate`
- **Access**: `worker`, `admin`
- Triggers deterministic explainable 0–100 scoring engine based on real-time database state and persists the new score.

### 4.3 AI Explain Risk (Natural Language Clinical Summary)
`POST /risk/:patientId/explain`
- **Access**: `worker`, `admin`
- Calls Python AI Service (`/ai/explain-risk`) with deterministic fallback.
- **Response `200 OK`**:
```json
{
  "success": true,
  "explanation": "Patient Ramesh Kumar (PAT-1001) has an elevated risk score of 77/100 (HIGH). The primary drivers are impending medication stock exhaustion (2 days remaining) combined with a 14km travel distance to Rampur CHC during harvest season. Immediate doorstep refill intervention is advised.",
  "keyDrivers": ["Refill gap", "Distance barrier", "Seasonal transport disruption"],
  "recommendedAction": "ASHA worker doorstep delivery within 48 hours"
}
```

---

## 5. Check-Ins & Barrier Reporting (`/checkins`)

### 5.1 Submit Weekly Check-In
`POST /checkins`
- **Access**: `patient`, `caregiver`, `worker`
- **Request Body**:
```json
{
  "patientId": "PAT-1001",
  "feeling": "symptoms_or_concerns",
  "hasEnoughMedicine": false,
  "reportedReason": "cannot_travel",
  "notes": "Bus service stopped due to bridge repair; cannot afford private rickshaw."
}
```
- **Backend Workflow triggered automatically**:
  1. Validates patient existence and authorization.
  2. Saves check-in record in MongoDB.
  3. Evaluates reason-to-action protocol (`cannot_travel` → Doorstep Delivery / Mobile Van).
  4. Automatically dispatches an `Intervention` assigned to the patient's care worker.
  5. Recalculates patient risk score.
- **Response `201 Created`**:
```json
{
  "success": true,
  "checkIn": {
    "_id": "67115c00...",
    "patientId": "PAT-1001",
    "feeling": "symptoms_or_concerns",
    "reportedReason": "cannot_travel",
    "createdAt": "2026-10-17T15:30:00.000Z"
  },
  "interventionCreated": {
    "type": "doorstep_delivery",
    "assignedTo": "Sunita Devi (ASHA)",
    "priority": "high",
    "status": "pending"
  },
  "message": "Check-in recorded and follow-up intervention dispatched."
}
```

---

## 6. Visits & Medication Refills (`/visits`, `/refills`)

### 6.1 Record Visit
`POST /visits`
- **Request Body**:
```json
{
  "patientId": "PAT-1001",
  "visitDate": "2026-10-17T10:00:00.000Z",
  "status": "completed",
  "systolicBp": 138,
  "diastolicBp": 88,
  "bloodGlucose": 142,
  "notes": "Patient reported slight dizziness. BP stabilized with current medication."
}
```

### 6.2 Record Medication Refill
`POST /refills`
- **Request Body**:
```json
{
  "patientId": "PAT-1001",
  "refillDate": "2026-10-17T11:00:00.000Z",
  "daysSupplied": 30,
  "tabletsSupplied": 60,
  "facility": "Rampur CHC",
  "deliveredBy": "worker_doorstep"
}
```

---

## 7. Rescue Interventions & Outcomes (`/interventions`)

### 7.1 List Interventions
`GET /interventions`
- **Query Filters**: `status` (`pending` | `in_progress` | `completed`), `type`, `patientId`

### 7.2 Update Status
`PATCH /interventions/:id/status`
- **Request Body**: `{"status": "in_progress"}`

### 7.3 Record Intervention Outcome
`POST /interventions/:id/outcome`
- **Access**: `worker`, `admin`
- **Request Body**:
```json
{
  "outcomeStatus": "successful",
  "refillSecured": true,
  "nextAppointmentKept": true,
  "notes": "Hand-delivered 30-day supply of Amlodipine to Ramesh Kumar at his home in Rampur."
}
```
- **Backend Workflow**:
  1. Updates intervention status to `completed`.
  2. Creates permanent `Outcome` document.
  3. Increments success metrics in `Analytics` cache / queries.
  4. Recalculates patient risk score (drops score down from High to Low/Medium).

---

## 8. Analytics & "What Works" Engine (`/analytics`)

### 8.1 Summary KPIs
`GET /analytics/summary`
- **Response `200 OK`**:
```json
{
  "success": true,
  "totalPatients": 35,
  "highRiskCount": 9,
  "mediumRiskCount": 14,
  "lowRiskCount": 12,
  "interventionsActive": 8,
  "overallAdherenceRate": 84.6,
  "interventionsSuccessRate": 89.2
}
```

### 8.2 Geographic Hotspots
`GET /analytics/hotspots`
- Returns coordinates, active patients, high-risk counts, and predominant barrier per village for Leaflet rendering.

### 8.3 Barrier Breakdown
`GET /analytics/dropout-reasons`
- Aggregates reported reasons: `cannot_travel`, `cannot_afford_transport`, `medicine_unavailable`, `side_effects`, `felt_fine`, `forgot`.

### 8.4 "What Works" Intervention Effectiveness
`GET /analytics/intervention-effectiveness`
- Groups completed outcomes by barrier and intervention type to compute real-world success percentages:
```json
[
  {
    "barrier": "cannot_travel",
    "interventionType": "doorstep_delivery",
    "totalInterventions": 18,
    "successfulOutcomes": 16,
    "successRate": 88.9
  },
  {
    "barrier": "side_effects",
    "interventionType": "clinical_consultation_home",
    "totalInterventions": 12,
    "successfulOutcomes": 10,
    "successRate": 83.3
  }
]
```

---

## 9. Python AI Microservice Endpoints (Port 8000)

Internal service protected by `X-Internal-Secret: <SECRET>`.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | `GET` | AI Service health check & LLM provider status |
| `/ai/explain-risk` | `POST` | Generates 3-bullet clinical explanation of patient risk |
| `/ai/classify-reason` | `POST` | Maps free-text patient voice/text to structured barrier |
| `/ai/recommend-intervention` | `POST` | Clinical decision support matching intervention to barrier |
| `/ai/district-summary` | `POST` | Executive narrative briefing for District Health Officer |
| `/ai/worker-assistant` | `POST` | Interactive conversational copilot for ASHA/ANM workers |
