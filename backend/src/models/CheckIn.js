const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required']
    },
    conditionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Condition'
    },
    reportedSymptomsOrConcerns: {
      type: String,
      enum: ['I feel fine', 'I have symptoms or concerns', 'I need help'],
      default: 'I feel fine'
    },
    medicineAvailable: {
      type: Boolean,
      default: true
    },
    tabletsRemaining: {
      type: Number,
      default: 10
    },
    selectedReason: {
      type: String,
      trim: true
    },
    additionalNotes: {
      type: String,
      trim: true
    },
    submittedBy: {
      type: String,
      enum: ['patient', 'caregiver', 'worker'],
      default: 'patient'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

checkInSchema.index({ patientId: 1, submittedAt: -1 });
checkInSchema.index({ selectedReason: 1 });

module.exports = mongoose.model('CheckIn', checkInSchema);
