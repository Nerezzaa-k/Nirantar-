const mongoose = require('mongoose');

const BARRIER_CATEGORIES = [
  'financial_difficulties',
  'transportation_problems',
  'medication_availability',
  'reported_side_effects',
  'lack_of_awareness',
  'forgotten_appointments',
  'scheduling_conflicts',
  'difficulty_accessing_services',
  'family_personal_circumstances',
  'other'
];

const SOURCE_TYPES = ['patient', 'caregiver', 'healthcare_worker', 'system'];

const barrierSchema = new mongoose.Schema(
  {
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
    category: {
      type: String,
      required: [true, 'Barrier category is required'],
      enum: BARRIER_CATEGORIES
    },
    categoryLabel: {
      type: String
    },
    description: {
      type: String,
      trim: true
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reporterName: {
      type: String,
      trim: true
    },
    sourceType: {
      type: String,
      required: [true, 'Source type is required'],
      enum: SOURCE_TYPES,
      default: 'patient'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    difficultyDate: {
      type: Date,
      default: Date.now
    },
    preferredMethodOfContact: {
      type: String,
      enum: ['phone_call', 'sms', 'whatsapp', 'home_visit'],
      default: 'phone_call'
    },
    assistanceRequested: {
      type: Boolean,
      default: false
    },
    assistanceDetails: {
      type: String,
      trim: true
    },
    voiceInputUsed: {
      type: Boolean,
      default: false
    },
    voiceTranscript: {
      type: String
    },
    status: {
      type: String,
      enum: ['open', 'in_review', 'support_matched', 'resolved', 'escalated'],
      default: 'open'
    },
    matchedSupportAction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportAction'
    },
    resolvedAt: {
      type: Date
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

barrierSchema.index({ patient: 1, reportedAt: -1 });
barrierSchema.index({ category: 1 });
barrierSchema.index({ status: 1 });
barrierSchema.index({ sourceType: 1 });

module.exports = mongoose.model('Barrier', barrierSchema);
module.exports.BARRIER_CATEGORIES = BARRIER_CATEGORIES;
module.exports.SOURCE_TYPES = SOURCE_TYPES;
