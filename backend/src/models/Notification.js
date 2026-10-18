const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
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
    relatedAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    relatedFollowUpCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FollowUpCase'
    },
    type: {
      type: String,
      enum: ['appointment_reminder', 'follow_up', 'check_in_request', 'support_update', 'custom'],
      required: [true, 'Notification type is required']
    },
    channel: {
      type: String,
      enum: ['sms', 'ivr', 'in_app'],
      default: 'sms'
    },
    recipientPhone: {
      type: String,
      trim: true
    },
    recipientName: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true
    },
    deliveryStatus: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'failed'],
      default: 'delivered'
    },
    simulated: {
      type: Boolean,
      default: true
    },
    simulationDetails: {
      provider: { type: String, default: 'Nirantar Mock SMS/IVR Gateway v3' },
      networkLatencyMs: { type: Number, default: 240 },
      ivrSpeechAudioUrl: { type: String }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ patient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ channel: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
