const mongoose = require('mongoose');
const { RISK_CATEGORIES } = require('../config/constants');

const riskScoreSchema = new mongoose.Schema(
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
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    category: {
      type: String,
      enum: Object.values(RISK_CATEGORIES),
      required: true
    },
    factorBreakdown: [
      {
        factor: { type: String, required: true },
        points: { type: Number, required: true },
        maxPoints: { type: Number, required: true },
        description: { type: String },
        underlyingData: { type: mongoose.Schema.Types.Mixed }
      }
    ],
    missingDataPoints: [
      {
        type: String
      }
    ],
    recommendedFollowUp: {
      type: String
    },
    modelVersion: {
      type: String,
      default: 'v3.0.0-rules'
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

riskScoreSchema.index({ patientId: 1, calculatedAt: -1 });
riskScoreSchema.index({ score: -1, category: 1 });

module.exports = mongoose.model('RiskScore', riskScoreSchema);
