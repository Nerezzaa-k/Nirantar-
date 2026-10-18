const mongoose = require('mongoose');

const SUPPORT_ACTION_STATUSES = [
  'suggested',
  'accepted',
  'in_progress',
  'completed',
  'unable_to_complete'
];

const supportActionSchema = new mongoose.Schema(
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
    relatedBarrier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barrier'
    },
    actionType: {
      type: String,
      required: [true, 'Action type is required']
    },
    title: {
      type: String,
      trim: true
    },
    suggestedAction: {
      type: String,
      required: [true, 'Suggested action details required']
    },
    recommendationReason: {
      type: String,
      required: [true, 'Reason for recommendation is required']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedTeam: {
      type: String,
      default: 'Primary Care Outreach Team'
    },
    status: {
      type: String,
      enum: SUPPORT_ACTION_STATUSES,
      default: 'suggested'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    dueDate: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    outcome: {
      status: {
        type: String,
        enum: ['resolved', 'partially_resolved', 'referred_externally', 'patient_declined', 'resource_unavailable']
      },
      notes: String,
      reasonNotCompleted: String,
      recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      recordedAt: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

supportActionSchema.index({ patient: 1, status: 1 });
supportActionSchema.index({ assignedTo: 1, status: 1 });
supportActionSchema.index({ status: 1 });

module.exports = mongoose.model('SupportAction', supportActionSchema);
module.exports.SUPPORT_ACTION_STATUSES = SUPPORT_ACTION_STATUSES;
