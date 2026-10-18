const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const AuditLog = require('../models/AuditLog');
const { assessPatientPrioritization } = require('../services/prioritizationService');

// GET /api/v1/appointments
exports.getAppointments = async (req, res) => {
  try {
    const { patientId, status, dateFrom, dateTo, limit = 50 } = req.query;
    const query = {};

    if (patientId) {
      query.$or = [{ patient: patientId }, { patientId }];
    }
    if (status) {
      query.status = status;
    }
    if (dateFrom || dateTo) {
      query.scheduledAt = {};
      if (dateFrom) query.scheduledAt.$gte = new Date(dateFrom);
      if (dateTo) query.scheduledAt.$lte = new Date(dateTo);
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name patientId patientCode treatmentProgram phone contactInfo')
      .populate('missedReasonReference')
      .sort({ scheduledAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/appointments
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, appointmentType, scheduledAt, notes, facility } = req.body;

    if (!patientId || !appointmentType || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'patientId, appointmentType, and scheduledAt are required.'
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const appointment = new Appointment({
      patient: patient._id,
      patientId: patient._id,
      appointmentType,
      scheduledAt: new Date(scheduledAt),
      status: 'scheduled',
      facility: facility || patient.healthcareFacility?.name || 'Primary Health Center',
      notes,
      createdBy: req.user?._id
    });

    await appointment.save();

    // Update patient next appointment date
    patient.nextAppointmentDate = appointment.scheduledAt;
    await patient.save();

    // Recalculate prioritization
    await assessPatientPrioritization(patient._id).catch(() => {});

    await AuditLog.create({
      actor: req.user?._id,
      action: 'APPOINTMENT_SCHEDULED',
      entityType: 'Appointment',
      entityId: appointment._id.toString(),
      details: { appointmentType, scheduledAt, patientId: patient._id }
    }).catch(() => {});

    res.status(201).json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/appointments/:id/status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes, completedAt } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.status = status || appointment.status;
    if (notes) appointment.notes = notes;
    if (status === 'completed') {
      appointment.completedAt = completedAt ? new Date(completedAt) : new Date();
    }

    await appointment.save();

    // Recalculate prioritization
    await assessPatientPrioritization(appointment.patient).catch(() => {});

    await AuditLog.create({
      actor: req.user?._id,
      action: `APPOINTMENT_${status.toUpperCase()}`,
      entityType: 'Appointment',
      entityId: appointment._id.toString(),
      details: { status, appointmentId: appointment._id }
    }).catch(() => {});

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/appointments/:id/reschedule
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { newScheduledAt, reason, notes } = req.body;
    const oldAppointment = await Appointment.findById(req.params.id);

    if (!oldAppointment) {
      return res.status(404).json({ success: false, message: 'Original appointment not found' });
    }

    if (!newScheduledAt) {
      return res.status(400).json({ success: false, message: 'newScheduledAt is required' });
    }

    // Create new scheduled appointment
    const newAppointment = new Appointment({
      patient: oldAppointment.patient,
      patientId: oldAppointment.patient,
      appointmentType: oldAppointment.appointmentType,
      scheduledAt: new Date(newScheduledAt),
      status: 'scheduled',
      facility: oldAppointment.facility,
      rescheduledFrom: oldAppointment._id,
      notes: notes || `Rescheduled from ${new Date(oldAppointment.scheduledAt).toLocaleDateString()}. Reason: ${reason || 'Patient request'}`,
      createdBy: req.user?._id
    });
    await newAppointment.save();

    // Mark old as rescheduled
    oldAppointment.status = 'rescheduled';
    oldAppointment.rescheduledTo = newAppointment._id;
    await oldAppointment.save();

    // Update patient next appointment
    await Patient.findByIdAndUpdate(oldAppointment.patient, {
      nextAppointmentDate: newAppointment.scheduledAt
    });

    // Reassess prioritization
    await assessPatientPrioritization(oldAppointment.patient).catch(() => {});

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      rescheduledAppointment: newAppointment,
      previousAppointment: oldAppointment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/appointments/:id/record-missed
exports.recordMissedAppointment = async (req, res) => {
  try {
    const { missedReason, notes } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.status = 'missed';
    appointment.missedReason = missedReason || 'Unspecified absence';
    if (notes) appointment.notes = notes;
    await appointment.save();

    // Recalculate prioritization to reflect missed appointment risk
    const assessment = await assessPatientPrioritization(appointment.patient);

    res.json({
      success: true,
      message: 'Missed appointment recorded and prioritization score updated',
      appointment,
      assessment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
