const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    // Backwards compatibility alias
    patientCode: {
      type: String,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true
    },
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Female'
    },
    contactInfo: {
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
      villageOrSector: { type: String, trim: true },
      preferredContactMethod: {
        type: String,
        enum: ['phone_call', 'sms', 'whatsapp', 'home_visit'],
        default: 'phone_call'
      },
      preferredContactTime: {
        type: String,
        default: 'morning'
      }
    },
    phone: {
      type: String,
      trim: true
    },
    treatmentProgram: {
      type: String,
      required: true,
      default: 'Diabetes'
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TreatmentProgram'
    },
    healthcareFacility: {
      name: { type: String, default: 'Primary Health Center Rampur' },
      code: { type: String, default: 'PHC-01' },
      distanceKm: { type: Number, default: 4.5 },
      location: {
        lat: { type: Number, default: 26.8520 },
        lng: { type: Number, default: 80.9490 }
      }
    },
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facility'
    },
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedWorkerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    authorizedCaregivers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    linkedCaregiverIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    consentPreferences: {
      shareWithFamily: { type: Boolean, default: true },
      allowSmsReminders: { type: Boolean, default: true },
      allowIvrCalls: { type: Boolean, default: true },
      allowDoorstepRefill: { type: Boolean, default: true },
      allowLocationSharing: { type: Boolean, default: true }
    },
    consentSettings: {
      shareWithFamily: { type: Boolean, default: true },
      allowSmsReminders: { type: Boolean, default: true },
      allowDoorstepDelivery: { type: Boolean, default: true }
    },
    location: {
      lat: { type: Number, default: 26.8467 },
      lng: { type: Number, default: 80.9462 },
      address: { type: String, default: 'Rampur Sector 4' },
      district: { type: String, default: 'Lucknow' }
    },
    currentRiskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    currentRiskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    currentRiskCategory: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    lastAssessmentDate: {
      type: Date,
      default: Date.now
    },
    followUpMetadata: {
      lastCompletedFollowUp: { type: Date },
      nextScheduledAppointment: { type: Date },
      totalMissedAppointments: { type: Number, default: 0 },
      overdueDays: { type: Number, default: 0 },
      unresolvedBarriersCount: { type: Number, default: 0 },
      unsuccessfulContactAttempts: { type: Number, default: 0 }
    },
    treatmentStartDate: {
      type: Date,
      default: Date.now
    },
    nextAppointmentDate: {
      type: Date
    },
    lastVisitDate: {
      type: Date
    },
    villageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Village'
    },
    primaryCondition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Condition'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

patientSchema.pre('save', function (next) {
  if (!this.patientCode && this.patientId) {
    this.patientCode = this.patientId;
  }
  if (!this.patientId && this.patientCode) {
    this.patientId = this.patientCode;
  }
  if (!this.assignedWorkerId && this.assignedWorker) {
    this.assignedWorkerId = this.assignedWorker;
  }
  if (!this.assignedWorker && this.assignedWorkerId) {
    this.assignedWorker = this.assignedWorkerId;
  }
  if (this.currentRiskLevel && !this.currentRiskCategory) {
    this.currentRiskCategory = this.currentRiskLevel;
  }
  if (this.currentRiskCategory && !this.currentRiskLevel) {
    this.currentRiskLevel = this.currentRiskCategory;
  }
  if (this.phone && (!this.contactInfo || !this.contactInfo.phone)) {
    this.contactInfo = this.contactInfo || {};
    this.contactInfo.phone = this.phone;
  }
  next();
});

patientSchema.index({ treatmentProgram: 1 });
patientSchema.index({ currentRiskLevel: 1 });
patientSchema.index({ assignedWorker: 1 });
patientSchema.index({ assignedWorkerId: 1 });

module.exports = mongoose.model('Patient', patientSchema);
