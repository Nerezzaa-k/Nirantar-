const mongoose = require('mongoose');

const outcomeSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required']
    },
    interventionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intervention',
      required: [true, 'Intervention ID is required']
    },
    outcomeType: {
      type: String,
      enum: [
        'treatment_resumed',
        'treatment_maintained',
        'patient_unreachable',
        'escalated_to_doctor',
        'refused_care',
        'other'
      ],
      default: 'treatment_resumed'
    },
    patientReached: {
      type: Boolean,
      default: true
    },
    treatmentResumedOrMaintained: {
      type: Boolean,
      default: true
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true
    },
    recordedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

outcomeSchema.index({ patientId: 1 });
outcomeSchema.index({ interventionId: 1 });
outcomeSchema.index({ treatmentResumedOrMaintained: 1 });

module.exports = mongoose.model('Outcome', outcomeSchema);
