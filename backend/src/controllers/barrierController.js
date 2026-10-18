const Barrier = require('../models/Barrier');
const Patient = require('../models/Patient');
const AuditLog = require('../models/AuditLog');
const { matchBarrierToSupportAction } = require('../services/barrierMatchingService');
const { assessPatientPrioritization } = require('../services/prioritizationService');

const CATEGORY_DISPLAY_LABELS = {
  financial_difficulties: 'Financial Difficulties',
  transportation_problems: 'Transportation Problems',
  medication_availability: 'Medication Availability',
  reported_side_effects: 'Reported Medication Side Effects',
  lack_of_awareness: 'Lack of Awareness / Literacy',
  forgotten_appointments: 'Forgotten Appointments',
  scheduling_conflicts: 'Scheduling Conflicts',
  difficulty_accessing_services: 'Difficulty Accessing Healthcare Services',
  family_personal_circumstances: 'Family / Personal Circumstances',
  other: 'Other Barriers'
};

// GET /api/v1/barriers
exports.getBarriers = async (req, res) => {
  try {
    const { patientId, category, status, sourceType, limit = 50 } = req.query;
    const query = {};

    if (patientId) {
      query.$or = [{ patient: patientId }, { patientId }];
    }
    if (category) {
      query.category = category;
    }
    if (status) {
      query.status = status;
    }
    if (sourceType) {
      query.sourceType = sourceType;
    }

    const barriers = await Barrier.find(query)
      .populate('patient', 'name patientId patientCode treatmentProgram phone contactInfo')
      .populate('reportedBy', 'name role')
      .populate('matchedSupportAction')
      .sort({ reportedAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: barriers.length, barriers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/barriers
exports.createBarrier = async (req, res) => {
  try {
    const {
      patientId,
      relatedAppointmentId,
      category,
      description,
      difficultyDate,
      preferredMethodOfContact,
      assistanceRequested,
      assistanceDetails,
      sourceType,
      voiceInputUsed,
      voiceTranscript
    } = req.body;

    if (!patientId || !category) {
      return res.status(400).json({
        success: false,
        message: 'patientId and category are required.'
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Determine source attribution clearly
    let calculatedSource = sourceType;
    if (!calculatedSource) {
      if (req.user?.role === 'patient') calculatedSource = 'patient';
      else if (req.user?.role === 'caregiver') calculatedSource = 'caregiver';
      else if (req.user?.role === 'healthcare_worker') calculatedSource = 'healthcare_worker';
      else calculatedSource = 'patient';
    }

    const categoryLabel = CATEGORY_DISPLAY_LABELS[category] || category.replace(/_/g, ' ');

    const barrier = new Barrier({
      patient: patient._id,
      patientId: patient._id,
      relatedAppointment: relatedAppointmentId,
      category,
      categoryLabel,
      description,
      reportedBy: req.user?._id,
      reporterName: req.user?.name || (calculatedSource === 'patient' ? patient.name : 'Reporter'),
      sourceType: calculatedSource,
      reportedAt: new Date(),
      difficultyDate: difficultyDate ? new Date(difficultyDate) : new Date(),
      preferredMethodOfContact: preferredMethodOfContact || patient.contactInfo?.preferredContactMethod || 'phone_call',
      assistanceRequested: Boolean(assistanceRequested),
      assistanceDetails: assistanceDetails || (assistanceRequested ? description : ''),
      voiceInputUsed: Boolean(voiceInputUsed),
      voiceTranscript: voiceTranscript || null,
      status: 'open'
    });

    await barrier.save();

    // Automatically trigger barrier-to-support matching engine
    let matchedAction = null;
    try {
      matchedAction = await matchBarrierToSupportAction(barrier, req.user?._id);
    } catch (matchErr) {
      console.warn('[Barrier] Auto-match action failed:', matchErr.message);
    }

    // Recalculate prioritization risk
    let prioritization = null;
    try {
      prioritization = await assessPatientPrioritization(patient._id);
    } catch (pErr) {
      console.warn('[Barrier] Prioritization recalculation failed:', pErr.message);
    }

    await AuditLog.create({
      actor: req.user?._id,
      action: 'BARRIER_REPORTED',
      entityType: 'Barrier',
      entityId: barrier._id.toString(),
      details: {
        category,
        sourceType: calculatedSource,
        assistanceRequested,
        patientId: patient._id
      }
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Barrier reported successfully and support action matched',
      barrier,
      matchedSupportAction: matchedAction,
      updatedPrioritization: prioritization
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/barriers/:id/status
exports.updateBarrierStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const barrier = await Barrier.findById(req.params.id);

    if (!barrier) {
      return res.status(404).json({ success: false, message: 'Barrier record not found' });
    }

    barrier.status = status || barrier.status;
    if (notes) barrier.notes = notes;
    if (status === 'resolved') {
      barrier.resolvedAt = new Date();
    }

    await barrier.save();

    // Recalculate patient risk score
    await assessPatientPrioritization(barrier.patient).catch(() => {});

    res.json({ success: true, barrier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/barriers/:id/match-support
exports.matchSupportAction = async (req, res) => {
  try {
    const barrier = await Barrier.findById(req.params.id);
    if (!barrier) {
      return res.status(404).json({ success: false, message: 'Barrier not found' });
    }

    const supportAction = await matchBarrierToSupportAction(barrier, req.user?._id);

    res.json({
      success: true,
      message: 'Support action matched successfully',
      supportAction,
      barrier
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
