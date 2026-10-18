const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.HEALTHCARE_WORKER
    },
    assignedFacility: {
      type: String,
      default: 'Primary Health Center Rampur'
    },
    assignedDepartment: {
      type: String,
      default: 'Chronic Disease Care'
    },
    assignedVillageIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Village'
      }
    ],
    assignedFacilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facility'
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    linkedPatientIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
      }
    ],
    preferences: {
      notifications: { type: Boolean, default: true },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
      smsAlerts: { type: Boolean, default: true }
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

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

userSchema.index({ role: 1 });
userSchema.index({ patientId: 1 });

module.exports = mongoose.model('User', userSchema);
