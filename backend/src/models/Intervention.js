const mongoose = require('mongoose');
const { INTERVENTION_STATUS } = require('../config/constants');

const interventionSchema = new mongoose.Schema(
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
    checkInId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CheckIn'
    },
    reportedReason: {
      type: String,
      required: [true, 'Reported reason is required'],
      trim: true
    },
    interventionType: {
      type: String,
      required: [true, 'Intervention type is required']
    },
    recommendedAction: {
      type: String,
      required: [true, 'Recommended action is required']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: Object.values(INTERVENTION_STATUS),
      default: INTERVENTION_STATUS.PENDING
    },
    dueDate: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    outcomeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outcome'
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

interventionSchema.index({ patientId: 1, status: 1 });
interventionSchema.index({ assignedTo: 1, status: 1 });
interventionSchema.index({ interventionType: 1 });

module.exports = mongoose.model('Intervention', interventionSchema);
