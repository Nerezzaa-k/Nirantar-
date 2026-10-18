const mongoose = require('mongoose');

const medicationRefillSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required']
    },
    conditionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Condition',
      required: [true, 'Condition ID is required']
    },
    medicationName: {
      type: String,
      required: [true, 'Medication name is required']
    },
    quantity: {
      type: Number,
      default: 30
    },
    refillDueDate: {
      type: Date,
      required: [true, 'Refill due date is required']
    },
    refillDate: {
      type: Date
    },
    stockSource: {
      type: String,
      default: 'Primary Health Centre'
    },
    status: {
      type: String,
      enum: ['collected', 'overdue', 'pending', 'doorstep_delivered'],
      default: 'collected'
    }
  },
  {
    timestamps: true
  }
);

medicationRefillSchema.index({ patientId: 1, refillDueDate: -1 });
medicationRefillSchema.index({ status: 1 });

module.exports = mongoose.model('MedicationRefill', medicationRefillSchema);
