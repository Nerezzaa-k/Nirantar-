const Notification = require('../models/Notification');
const Patient = require('../models/Patient');
const FollowUpCase = require('../models/FollowUpCase');

/**
 * Message Templates
 */
const TEMPLATES = {
  appointment_reminder: (patientName, details) =>
    `[DEMO MOCK SMS] Namaste ${patientName}. This is a gentle reminder from PHC Rampur that your treatment follow-up visit is scheduled for ${details.date || 'tomorrow at 10:00 AM'}. If you are facing any difficulty attending, reply to this message or speak to your ASHA worker.`,

  follow_up: (patientName, details) =>
    `[DEMO MOCK SMS] Hello ${patientName}, we noticed you could not attend your scheduled follow-up on ${details.date || 'recently'}. We care about your health. Please let us know if you need transport or medication assistance by replying here.`,

  check_in_request: (patientName) =>
    `[DEMO MOCK SMS] Namaste ${patientName}. Please complete your quick weekly health check-in on Nirantar. How are your medicines and health this week? Reply 1 for All Good, 2 if Medicines Needed, 3 for Call Request.`,

  support_update: (patientName, details) =>
    `[DEMO MOCK SMS] Hello ${patientName}, update on your assistance request: Your ${details.actionTitle || 'support plan'} has been assigned to health coordinator ${details.workerName || 'Sunita'}. They will reach out to assist you shortly.`,

  ivr_voice_script: (patientName, details) =>
    `[DEMO MOCK IVR CALL] "Namaste ${patientName} ji. This is an automated voice wellness check from Nirantar and your primary health center. Your doctor wants to make sure you have sufficient medicine supply for ${details.program || 'your ongoing treatment'}. Press 1 if you have sufficient medicines, press 2 if your medicines are finished, or press 3 to speak with health worker ${details.workerName || 'Sunita'}."`
};

/**
 * Send simulated notification (SMS or IVR)
 * @param {Object} params - notification parameters
 * @returns {Promise<Object>} Created simulated notification
 */
async function sendSimulatedNotification({
  patientId,
  relatedAppointmentId = null,
  relatedFollowUpCaseId = null,
  type = 'appointment_reminder',
  channel = 'sms',
  customMessage = null,
  templateVariables = {},
  createdByUserId = null
}) {
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new Error(`Patient ${patientId} not found`);
  }

  const patientName = patient.name;
  let messageContent = customMessage;

  if (!messageContent) {
    if (channel === 'ivr') {
      messageContent = TEMPLATES.ivr_voice_script(patientName, {
        program: patient.treatmentProgram,
        workerName: 'Sunita (ASHA)',
        ...templateVariables
      });
    } else {
      const templateFn = TEMPLATES[type] || TEMPLATES.appointment_reminder;
      messageContent = templateFn(patientName, templateVariables);
    }
  }

  // Guarantee clear DEMO / MOCK tag
  if (!messageContent.includes('[DEMO') && !messageContent.includes('[MOCK')) {
    messageContent = `[DEMO MOCK ${channel.toUpperCase()}] ${messageContent}`;
  }

  const notification = new Notification({
    patient: patient._id,
    patientId: patient._id,
    relatedAppointment: relatedAppointmentId,
    relatedFollowUpCase: relatedFollowUpCaseId,
    type,
    channel,
    recipientPhone: patient.contactInfo?.phone || patient.phone || '+91 98765 43210',
    recipientName: patient.name,
    message: messageContent,
    deliveryStatus: 'delivered',
    simulated: true,
    simulationDetails: {
      provider: 'Nirantar Simulated Telecom Bridge (Mock)',
      networkLatencyMs: Math.floor(Math.random() * 200) + 120,
      ivrSpeechAudioUrl: channel === 'ivr' ? '/demo-assets/mock-ivr-audio.mp3' : null
    },
    createdBy: createdByUserId,
    createdAt: new Date()
  });

  await notification.save();

  // If there is an active follow-up case, also log as a contact attempt
  if (relatedFollowUpCaseId) {
    const followUpCase = await FollowUpCase.findById(relatedFollowUpCaseId);
    if (followUpCase) {
      followUpCase.contactAttempts.push({
        attemptNumber: followUpCase.contactAttempts.length + 1,
        channel: channel === 'ivr' ? 'ivr_call' : 'sms',
        date: new Date(),
        outcome: 'reached',
        notes: `Simulated ${channel.toUpperCase()} message sent: "${messageContent.slice(0, 80)}..."`,
        recordedBy: createdByUserId,
        recordedByName: 'Simulated Notification Service'
      });
      if (followUpCase.status === 'contact_pending' || followUpCase.status === 'new') {
        followUpCase.status = 'contact_attempted';
      }
      await followUpCase.save();
    }
  }

  return notification;
}

module.exports = {
  TEMPLATES,
  sendSimulatedNotification
};
