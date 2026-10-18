const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required']
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    appointmentType: {
      type: String,
      required: [true, 'Appointment type is required'],
      trim: true
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date/time is required']
    },
    completedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'missed', 'cancelled', 'rescheduled'],
      default: 'scheduled'
    },
    facility: {
      type: String,
      default: 'Primary Health Center'
    },
    missedReasonReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barrier'
    },
    missedReason: {
      type: String,
      trim: true
    },
    rescheduledTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

appointmentSchema.index({ patient: 1, scheduledAt: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
