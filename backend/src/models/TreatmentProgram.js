const mongoose = require('mongoose');

const treatmentProgramSchema = new mongoose.Schema(
  {
    programCode: {
      type: String,
      required: [true, 'Program code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Program name is required'],
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    defaultFollowUpIntervalDays: {
      type: Number,
      default: 30
    },
    appointmentTypes: [
      {
        type: String,
        trim: true
      }
    ],
    applicableBarrierCategories: [
      {
        type: String,
        trim: true
      }
    ],
    prioritizationRules: {
      missedAppointmentWeight: { type: Number, default: 25 },
      daysSinceFollowUpWeight: { type: Number, default: 20 },
      overdueDaysWeight: { type: Number, default: 20 },
      unsuccessfulContactWeight: { type: Number, default: 15 },
      unresolvedBarrierWeight: { type: Number, default: 20 }
    },
    supportActionTemplates: [
      {
        barrierCategory: String,
        suggestedAction: String,
        defaultAssigneeRole: { type: String, default: 'healthcare_worker' },
        urgency: { type: String, default: 'medium' }
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

treatmentProgramSchema.index({ department: 1 });

module.exports = mongoose.model('TreatmentProgram', treatmentProgramSchema);
