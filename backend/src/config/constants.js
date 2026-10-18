module.exports = {
  ROLES: {
    HEALTHCARE_WORKER: 'healthcare_worker',
    PATIENT: 'patient',
    CAREGIVER: 'caregiver',
    ADMIN: 'admin'
  },
  RISK_CATEGORIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  },
  DEFAULT_THRESHOLDS: {
    LOW_MAX: 29,
    MEDIUM_MAX: 59,
    HIGH_MIN: 60
  },
  FACTOR_WEIGHTS: {
    REFILL_OVERDUE: 25,
    DAYS_SINCE_LAST_VISIT: 20,
    PAST_MISSED_VISITS: 15,
    CLINICAL_TREND: 15,
    SEASONAL_FACTOR: 10,
    DISTANCE: 10,
    MEDICINE_STOCKOUT: 5
  },
  INTERVENTION_STATUS: {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    ESCALATED: 'escalated',
    CANCELLED: 'cancelled'
  },
  REASON_TO_ACTION_MAPPING: {
    "Feels fine and thinks treatment is unnecessary": {
      recommendedAction: "Counselling script, review of treatment trends, optional authorized family support",
      interventionType: "counselling",
      priority: "medium",
      requiresMedicalReview: false
    },
    "Medicine is unavailable": {
      recommendedAction: "Identify an alternate pharmacy or PHC with available stock and escalate stock issues",
      interventionType: "stock_escalation",
      priority: "high",
      requiresMedicalReview: false
    },
    "I cannot travel to the healthcare facility": {
      recommendedAction: "Add the patient to an eligible village doorstep refill or outreach batch",
      interventionType: "doorstep_refill",
      priority: "high",
      requiresMedicalReview: false
    },
    "I cannot afford transport or lose wages by attending": {
      recommendedAction: "Offer a follow-up appointment outside peak work hours when available",
      interventionType: "flexible_hours",
      priority: "medium",
      requiresMedicalReview: false
    },
    "I am experiencing side effects": {
      recommendedAction: "Escalate to an authorized medical professional immediately",
      interventionType: "clinical_escalation",
      priority: "urgent",
      requiresMedicalReview: true
    },
    "I forgot my medication or appointment": {
      recommendedAction: "Offer reminders and an optional caregiver-supported reminder plan",
      interventionType: "reminder_plan",
      priority: "low",
      requiresMedicalReview: false
    },
    "I am too busy with work or family responsibilities": {
      recommendedAction: "Suggest an alternative follow-up time and flexible visit schedule",
      interventionType: "flexible_schedule",
      priority: "medium",
      requiresMedicalReview: false
    },
    "Other": {
      recommendedAction: "Schedule human follow-up to understand the barrier",
      interventionType: "human_followup",
      priority: "medium",
      requiresMedicalReview: false
    },
    "Prefer not to say": {
      recommendedAction: "Schedule gentle in-person check-in by assigned healthcare worker",
      interventionType: "human_followup",
      priority: "low",
      requiresMedicalReview: false
    }
  }
};
