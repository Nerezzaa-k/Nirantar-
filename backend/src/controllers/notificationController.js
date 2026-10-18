const Notification = require('../models/Notification');
const { sendSimulatedNotification, TEMPLATES } = require('../services/notificationSimulationService');

// GET /api/v1/notifications
exports.getNotifications = async (req, res) => {
  try {
    const { patientId, type, channel, limit = 50 } = req.query;
    const query = {};

    if (patientId) {
      query.$or = [{ patient: patientId }, { patientId }];
    }
    if (type) {
      query.type = type;
    }
    if (channel) {
      query.channel = channel;
    }

    const notifications = await Notification.find(query)
      .populate('patient', 'name patientId patientCode treatmentProgram phone contactInfo')
      .populate('relatedAppointment')
      .populate('relatedFollowUpCase')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      count: notifications.length,
      notifications,
      templatesAvailable: Object.keys(TEMPLATES)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/notifications/simulate
exports.triggerSimulatedNotification = async (req, res) => {
  try {
    const {
      patientId,
      relatedAppointmentId,
      relatedFollowUpCaseId,
      type = 'appointment_reminder',
      channel = 'sms',
      customMessage,
      templateVariables = {}
    } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, message: 'patientId is required' });
    }

    const notification = await sendSimulatedNotification({
      patientId,
      relatedAppointmentId,
      relatedFollowUpCaseId,
      type,
      channel,
      customMessage,
      templateVariables,
      createdByUserId: req.user?._id
    });

    res.status(201).json({
      success: true,
      message: `Simulated ${channel.toUpperCase()} message sent successfully [DEMO / MOCK]`,
      notification
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
