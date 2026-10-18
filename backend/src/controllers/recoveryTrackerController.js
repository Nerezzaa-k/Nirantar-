const FollowUpCase = require('../models/FollowUpCase');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Barrier = require('../models/Barrier');
const AuditLog = require('../models/AuditLog');
const { assessPatientPrioritization } = require('../services/prioritizationService');

// GET /api/v1/recovery-cases
exports.getRecoveryCases = async (req, res) => {
  try {
    const { status, riskLevel, overdue, assignedTo, search, limit = 100 } = req.query;
    const query = {};

    if (status) {
      if (status === 'open') {
        query.status = { $nin: ['follow_up_completed', 'closed'] };
      } else if (status === 'awaiting_contact') {
        query.status = { $in: ['new', 'contact_pending'] };
      } else if (status === 'awaiting_assistance') {
        query.status = { $in: ['barrier_identified', 'support_assigned'] };
      } else {
        query.status = status;
      }
    }

    if (riskLevel) {
      query.riskLevel = riskLevel;
    }

    if (overdue === 'true') {
      query.isOverdue = true;
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    let cases = await FollowUpCase.find(query)
      .populate({
        path: 'patient',
        select: 'name patientId patientCode age gender treatmentProgram phone contactInfo healthcareFacility location currentRiskScore currentRiskLevel assignedWorker'
      })
      .populate('relatedAppointment')
      .populate('relatedBarrier')
      .populate('assignedTo', 'name role email phone')
      .populate('supportActions')
      .sort({ riskScore: -1, updatedAt: -1 })
      .limit(Number(limit));

    // Optional text search filter
    if (search) {
      const s = search.toLowerCase();
      cases = cases.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(s) ||
          c.patient?.name?.toLowerCase().includes(s) ||
          c.patient?.patientId?.toLowerCase().includes(s) ||
          c.patient?.patientCode?.toLowerCase().includes(s)
      );
    }

    res.json({ success: true, count: cases.length, cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/recovery-cases/:id
exports.getRecoveryCaseById = async (req, res) => {
  try {
    const caseDoc = await FollowUpCase.findById(req.params.id)
      .populate({
        path: 'patient',
        select: 'name patientId patientCode age gender treatmentProgram phone contactInfo healthcareFacility location currentRiskScore currentRiskLevel assignedWorker authorizedCaregivers'
      })
      .populate('relatedAppointment')
      .populate('relatedBarrier')
      .populate('assignedTo', 'name role email phone')
      .populate('supportActions');

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Recovery case not found' });
    }

    res.json({ success: true, recoveryCase: caseDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/recovery-cases/:id/contact-attempt
exports.recordContactAttempt = async (req, res) => {
  try {
    const { channel, outcome, notes } = req.body;
    const caseDoc = await FollowUpCase.findById(req.params.id);

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Recovery case not found' });
    }

    if (!channel || !outcome) {
      return res.status(400).json({ success: false, message: 'channel and outcome are required' });
    }

    const attemptNumber = (caseDoc.contactAttempts?.length || 0) + 1;
    caseDoc.contactAttempts.push({
      attemptNumber,
      channel,
      outcome,
      notes,
      date: new Date(),
      recordedBy: req.user?._id,
      recordedByName: req.user?.name || 'Healthcare Worker'
    });

    if (caseDoc.status === 'new' || caseDoc.status === 'contact_pending') {
      caseDoc.status = 'contact_attempted';
    }

    await caseDoc.save();

    // Reassess risk prioritization
    const updatedPrioritization = await assessPatientPrioritization(caseDoc.patient).catch(() => null);

    await AuditLog.create({
      actor: req.user?._id,
      action: 'CONTACT_ATTEMPT_RECORDED',
      entityType: 'FollowUpCase',
      entityId: caseDoc._id.toString(),
      details: { channel, outcome, attemptNumber, caseNumber: caseDoc.caseNumber }
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Contact attempt logged successfully',
      recoveryCase: caseDoc,
      updatedPrioritization
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/recovery-cases/:id/status
exports.updateCaseStatus = async (req, res) => {
  try {
    const { status, nextFollowUpAt, notes } = req.body;
    const caseDoc = await FollowUpCase.findById(req.params.id);

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Recovery case not found' });
    }

    if (status) caseDoc.status = status;
    if (nextFollowUpAt) caseDoc.nextFollowUpAt = new Date(nextFollowUpAt);
    if (notes) caseDoc.notes = notes;

    await caseDoc.save();

    res.json({ success: true, recoveryCase: caseDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/recovery-cases/:id/assign
exports.assignCase = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const caseDoc = await FollowUpCase.findById(req.params.id);

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Recovery case not found' });
    }

    caseDoc.assignedTo = assignedTo;
    if (caseDoc.status === 'new') {
      caseDoc.status = 'contact_pending';
    }

    await caseDoc.save();

    res.json({ success: true, recoveryCase: caseDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/recovery-cases/:id/record-outcome (Mark Recovered / Closed)
exports.recordCaseOutcome = async (req, res) => {
  try {
    const { outcomeStatus, recoveryReason, notes } = req.body;
    const caseDoc = await FollowUpCase.findById(req.params.id);

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Recovery case not found' });
    }

    if (!outcomeStatus || !recoveryReason) {
      return res.status(400).json({
        success: false,
        message: 'outcomeStatus and recoveryReason are required to record verified outcome'
      });
    }

    caseDoc.outcome = {
      status: outcomeStatus,
      recoveryReason,
      recordedAt: new Date(),
      recordedBy: req.user?._id
    };

    if (outcomeStatus === 'recovered_to_care' || outcomeStatus === 'completed_followup') {
      caseDoc.status = 'follow_up_completed';
    } else {
      caseDoc.status = 'closed';
    }

    if (notes) caseDoc.notes = notes;
    await caseDoc.save();

    // Reassess risk score to reflect recovery
    const assessment = await assessPatientPrioritization(caseDoc.patient);

    await AuditLog.create({
      actor: req.user?._id,
      action: 'CASE_RECOVERY_RECORDED',
      entityType: 'FollowUpCase',
      entityId: caseDoc._id.toString(),
      details: { outcomeStatus, recoveryReason, caseNumber: caseDoc.caseNumber }
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Recovery outcome recorded successfully',
      recoveryCase: caseDoc,
      updatedAssessment: assessment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/recovery-cases/assess-patient/:patientId
exports.reassessPatientRisk = async (req, res) => {
  try {
    const assessment = await assessPatientPrioritization(req.params.patientId);
    res.json({ success: true, assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
