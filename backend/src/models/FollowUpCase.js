const mongoose = require('mongoose');

const CASE_STATUSES = [
  'new',
  'contact_pending',
  'contact_attempted',
  'barrier_identified',
  'support_assigned',
  'in_progress',
  'appointment_rescheduled',
  'follow_up_completed',
  'unresolved',
  'closed'
];

const RISK_LEVELS = ['low', 'medium', 'high'];

const contactAttemptSchema = new mongoose.Schema(
  {
    attemptNumber: {
      type: Number,
      default: 1
    },
    channel: {
      type: String,
      enum: ['phone_call', 'sms', 'ivr_call', 'home_visit', 'whatsapp'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    outcome: {
      type: String,
      enum: ['reached', 'no_answer', 'busy', 'wrong_number', 'patient_unreachable', 'callback_scheduled'],
      required: true
    },
    notes: {
      type: String,
      trim: true
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recordedByName: {
      type: String
    }
  },
  { _id: true }
);

const followUpCaseSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required']
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    relatedAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    relatedBarrier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barrier'
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0
    },
    riskLevel: {
      type: String,
      enum: RISK_LEVELS,
      required: true,
      default: 'low'
    },
    contributingFactors: [
      {
        factor: String,
        points: Number,
        maxPoints: Number,
        description: String
      }
    ],
    recommendedNextAction: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: CASE_STATUSES,
      default: 'new'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    nextFollowUpAt: {
      type: Date
    },
    contactAttempts: [contactAttemptSchema],
    rescheduledAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    supportActions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupportAction'
      }
    ],
    outcome: {
      status: {
        type: String,
        enum: ['recovered_to_care', 'completed_followup', 'unresolved_refusal', 'patient_relocated', 'deceased', 'other']
      },
      recoveryReason: String,
      recordedAt: Date,
      recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    isOverdue: {
      type: Boolean,
      default: false
    },
    overdueDays: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

followUpCaseSchema.index({ patient: 1, status: 1 });
followUpCaseSchema.index({ assignedTo: 1, status: 1 });
followUpCaseSchema.index({ riskLevel: 1 });
followUpCaseSchema.index({ status: 1 });
followUpCaseSchema.index({ nextFollowUpAt: 1 });

module.exports = mongoose.model('FollowUpCase', followUpCaseSchema);
module.exports.CASE_STATUSES = CASE_STATUSES;
module.exports.RISK_LEVELS = RISK_LEVELS;
