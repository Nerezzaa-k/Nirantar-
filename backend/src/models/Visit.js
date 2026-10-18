const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required']
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    visitDate: {
      type: Date,
      required: [true, 'Visit date is required'],
      default: Date.now
    },
    visitType: {
      type: String,
      enum: ['routine_checkup', 'follow_up', 'home_visit', 'emergency', 'refill_collection'],
      default: 'routine_checkup'
    },
    status: {
      type: String,
      enum: ['attended', 'missed', 'scheduled', 'cancelled'],
      default: 'attended'
    },
    clinicalMeasurements: {
      bloodPressureSystolic: Number,
      bloodPressureDiastolic: Number,
      bloodGlucose: Number,
      pulse: Number,
      weightKg: Number,
      notes: String
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

visitSchema.index({ patientId: 1, visitDate: -1 });
visitSchema.index({ status: 1 });

module.exports = mongoose.model('Visit', visitSchema);
