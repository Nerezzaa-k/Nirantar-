# Nirantar v3 — Database Architecture & Schema Reference

Database: **MongoDB Atlas**  
ODM: **Mongoose**

---

## Collections & Schemas

### 1. `users`
Represents healthcare workers (ASHA/ANM), patients, family caregivers, and administrators.
- `_id`: ObjectId
- `name`: String (Required)
- `email`: String (Unique, Indexed)
- `phone`: String
- `passwordHash`: String (bcrypt hashed)
- `role`: Enum (`'healthcare_worker'`, `'patient'`, `'caregiver'`, `'admin'`)
- `assignedVillageIds`: Array of ObjectIds (`ref: Village`)
- `assignedFacilityId`: ObjectId (`ref: Facility`)
- `patientId`: ObjectId (`ref: Patient`)
- `linkedPatientIds`: Array of ObjectIds (`ref: Patient`)
- `preferences`: `{ notifications: Boolean, theme: String, smsAlerts: Boolean }`
- `isActive`: Boolean (Default: true)
- `timestamps`: true

### 2. `patients`
Central medical record for chronic illness surveillance.
- `_id`: ObjectId
- `patientCode`: String (Unique, Indexed, e.g. `'PAT-1001'`)
- `name`: String (Required)
- `age`: Number (1-120)
- `gender`: Enum (`'Male'`, `'Female'`, `'Other'`)
- `phone`: String
- `villageId`: ObjectId (`ref: Village`, Indexed)
- `facilityId`: ObjectId (`ref: Facility`)
- `assignedWorkerId`: ObjectId (`ref: User`)
- `linkedCaregiverIds`: Array of ObjectIds (`ref: User`)
- `consentSettings`: `{ shareWithFamily: Boolean, allowSmsReminders: Boolean, allowDoorstepDelivery: Boolean }`
- `supportedConditions`: Array of ObjectIds (`ref: Condition`)
- `primaryCondition`: ObjectId (`ref: Condition`, Indexed)
- `treatmentStartDate`: Date
- `nextAppointmentDate`: Date
- `lastVisitDate`: Date
- `distanceToFacilityKm`: Number
- `currentRiskScore`: Number (0-100, Indexed)
- `currentRiskCategory`: Enum (`'low'`, `'medium'`, `'high'`, Indexed)
- `lastCalculatedAt`: Date

### 3. `conditions`
Configurable chronic diseases and risk score weights.
- `_id`: ObjectId
- `name`: String (e.g. `'Hypertension'`, `'Type 2 Diabetes'`, `'Tuberculosis'`, `'Asthma'`, `'Epilepsy'`)
- `code`: String (Unique, Indexed)
- `riskFactorConfiguration`:
  - `refillOverdueMax`: Number (25)
  - `daysSinceLastVisitMax`: Number (20)
  - `pastMissedVisitsMax`: Number (15)
  - `clinicalTrendMax`: Number (15)
  - `seasonalFactorMax`: Number (10)
  - `distanceMax`: Number (10)
  - `medicineStockoutMax`: Number (5)
- `riskThresholds`: `{ lowMax: 29, mediumMax: 59, highMin: 60 }`
- `refillGracePeriodDays`: Number (5)
- `followUpIntervalDays`: Number (30)
- `enabled`: Boolean

### 4. `checkIns`
Weekly patient-reported barriers and symptom checks.
- `_id`: ObjectId
- `patientId`: ObjectId (`ref: Patient`, Indexed)
- `conditionId`: ObjectId (`ref: Condition`)
- `reportedSymptomsOrConcerns`: Enum (`'I feel fine'`, `'I have symptoms or concerns'`, `'I need help'`)
- `medicineAvailable`: Boolean
- `tabletsRemaining`: Number
- `selectedReason`: String (Indexed)
- `additionalNotes`: String
- `submittedBy`: Enum (`'patient'`, `'caregiver'`, `'worker'`)
- `submittedAt`: Date (Default: now)

### 5. `riskScores`
Explainable score log calculated by the deterministic rules engine.
- `_id`: ObjectId
- `patientId`: ObjectId (`ref: Patient`, Indexed)
- `conditionId`: ObjectId (`ref: Condition`)
- `score`: Number (0-100, Indexed)
- `category`: Enum (`'low'`, `'medium'`, `'high'`, Indexed)
- `factorBreakdown`: Array of `{ factor, points, maxPoints, description, underlyingData }`
- `missingDataPoints`: Array of Strings
- `recommendedFollowUp`: String
- `modelVersion`: String (`'v3.0.0-rules'`)
- `calculatedAt`: Date

### 6. `interventions`
Targeted community rescue tasks created by the rescue engine.
- `_id`: ObjectId
- `patientId`: ObjectId (`ref: Patient`, Indexed)
- `conditionId`: ObjectId (`ref: Condition`)
- `checkInId`: ObjectId (`ref: CheckIn`)
- `reportedReason`: String
- `interventionType`: String (`'doorstep_refill'`, `'counselling'`, `'stock_escalation'`, `'flexible_hours'`, `'clinical_escalation'`, `'reminder_plan'`, `'human_followup'`)
- `recommendedAction`: String
- `assignedTo`: ObjectId (`ref: User`, Indexed)
- `priority`: Enum (`'low'`, `'medium'`, `'high'`, `'urgent'`)
- `status`: Enum (`'pending'`, `'assigned'`, `'in_progress'`, `'completed'`, `'escalated'`, `'cancelled'`)
- `dueDate`: Date
- `completedAt`: Date
- `outcomeId`: ObjectId (`ref: Outcome`)
- `notes`: String

### 7. `outcomes`
Evaluated results of rescue interventions (LEARN engine).
- `_id`: ObjectId
- `patientId`: ObjectId (`ref: Patient`, Indexed)
- `interventionId`: ObjectId (`ref: Intervention`, Indexed)
- `outcomeType`: Enum (`'treatment_resumed'`, `'treatment_maintained'`, `'patient_unreachable'`, `'escalated_to_doctor'`, `'refused_care'`, `'other'`)
- `patientReached`: Boolean (Default: true)
- `treatmentResumedOrMaintained`: Boolean (Default: true, Indexed)
- `recordedBy`: ObjectId (`ref: User`)
- `notes`: String
- `recordedAt`: Date

### 8. `medicineStock`
Facility pharmacy inventory sentinel.
- `_id`: ObjectId
- `facilityId`: ObjectId (`ref: Facility`, Indexed)
- `conditionId`: ObjectId (`ref: Condition`)
- `medicationName`: String (Indexed)
- `quantityAvailable`: Number
- `unit`: String
- `reorderThreshold`: Number
- `isStockout`: Boolean (Indexed)

### 9. `villages`
Geographic catchment locations with GPS coordinates and seasons.
- `_id`: ObjectId
- `name`: String
- `district`: String
- `facilityId`: ObjectId (`ref: Facility`, Indexed)
- `latitude`: Number
- `longitude`: Number
- `season`: Enum (`'monsoon'`, `'harvest'`, `'winter'`, `'normal'`)
- `population`: Number

### 10. `auditLogs`
Immutable security and compliance logging.
- `_id`: ObjectId
- `userId`: ObjectId (`ref: User`, Indexed)
- `action`: String
- `resourceType`: String
- `resourceId`: String
- `timestamp`: Date (Indexed)
- `relevantMetadata`: Mixed (Sanitized)
