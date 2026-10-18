const mongoose = require('mongoose');
const { FACTOR_WEIGHTS, DEFAULT_THRESHOLDS } = require('../config/constants');

const conditionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Condition name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Condition code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    riskFactorConfiguration: {
      refillOverdueMax: { type: Number, default: FACTOR_WEIGHTS.REFILL_OVERDUE },
      daysSinceLastVisitMax: { type: Number, default: FACTOR_WEIGHTS.DAYS_SINCE_LAST_VISIT },
      pastMissedVisitsMax: { type: Number, default: FACTOR_WEIGHTS.PAST_MISSED_VISITS },
      clinicalTrendMax: { type: Number, default: FACTOR_WEIGHTS.CLINICAL_TREND },
      seasonalFactorMax: { type: Number, default: FACTOR_WEIGHTS.SEASONAL_FACTOR },
      distanceMax: { type: Number, default: FACTOR_WEIGHTS.DISTANCE },
      medicineStockoutMax: { type: Number, default: FACTOR_WEIGHTS.MEDICINE_STOCKOUT }
    },
    riskThresholds: {
      lowMax: { type: Number, default: DEFAULT_THRESHOLDS.LOW_MAX },
      mediumMax: { type: Number, default: DEFAULT_THRESHOLDS.MEDIUM_MAX },
      highMin: { type: Number, default: DEFAULT_THRESHOLDS.HIGH_MIN }
    },
    refillGracePeriodDays: {
      type: Number,
      default: 5
    },
    followUpIntervalDays: {
      type: Number,
      default: 30
    },
    standardMedications: [
      {
        name: String,
        dosage: String,
        frequency: String
      }
    ],
    enabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

conditionSchema.index({ code: 1, enabled: 1 });

module.exports = mongoose.model('Condition', conditionSchema);
