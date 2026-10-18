const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Barrier = require('../models/Barrier');
const SupportAction = require('../models/SupportAction');
const FollowUpCase = require('../models/FollowUpCase');
const Notification = require('../models/Notification');
const Visit = require('../models/Visit');
const MedicationRefill = require('../models/MedicationRefill');
const CheckIn = require('../models/CheckIn');
const RiskScore = require('../models/RiskScore');
const Intervention = require('../models/Intervention');
const AuditLog = require('../models/AuditLog');
const { assessPatientPrioritization } = require('../services/prioritizationService');
const { calculatePatientRisk } = require('../services/riskEngine');
const { ROLES, RISK_CATEGORIES, INTERVENTION_STATUS } = require('../config/constants');
const { logAudit } = require('../middleware/audit');

// @desc    Get patient list with filters, search, and pagination
// @route   GET /api/v1/patients
// @access  Private (Role restricted)
const getPatients = async (req, res, next) => {
  try {
    const {
      filter,
      search,
      conditionId,
      villageId,
      riskCategory,
      treatmentProgram,
      page = 1,
      limit = 100
    } = req.query;

    let query = { isActive: true };

    // Role-based scoping:
    if (req.user.role === ROLES.PATIENT) {
      if (!req.user.patientId) {
        return res.json({ success: true, count: 0, patients: [] });
      }
      query._id = req.user.patientId;
    } else if (req.user.role === ROLES.CAREGIVER) {
      if (!req.user.linkedPatientIds || req.user.linkedPatientIds.length === 0) {
        return res.json({ success: true, count: 0, patients: [] });
      }
      query._id = { $in: req.user.linkedPatientIds };
    } else if (req.user.role === ROLES.HEALTHCARE_WORKER) {
      // Healthcare worker views assigned patients or area patients
      const conditions = [];
      if (req.user.assignedVillageIds && req.user.assignedVillageIds.length > 0) {
        conditions.push({ villageId: { $in: req.user.assignedVillageIds } });
      }
      conditions.push({ assignedWorkerId: req.user._id });
      conditions.push({ assignedWorker: req.user._id });
      conditions.push({ assignedWorkerId: null });

      if (conditions.length > 0) {
        query.$or = conditions;
      }
    }

    if (treatmentProgram) {
      query.treatmentProgram = new RegExp(treatmentProgram, 'i');
    }
    if (conditionId) query.primaryCondition = conditionId;
    if (villageId) query.villageId = villageId;
    if (riskCategory) {
      query.$or = [{ currentRiskCategory: riskCategory }, { currentRiskLevel: riskCategory }];
    }

    // Search by name, code or ID
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } },
          { patientCode: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const now = new Date();
    if (filter === 'high_risk') {
      query.$or = [{ currentRiskLevel: 'high' }, { currentRiskCategory: 'high' }];
    } else if (filter === 'due_soon') {
      const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      query.nextAppointmentDate = { $gte: now, $lte: sevenDaysLater };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Patient.countDocuments(query);

    const patients = await Patient.find(query)
      .populate('primaryCondition', 'name code')
      .populate('villageId', 'name district season')
      .populate('assignedWorker', 'name phone email')
      .populate('assignedWorkerId', 'name phone email')
      .populate('facilityId', 'name type')
      .sort({ currentRiskScore: -1, updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Attach latest recovery case & active barrier
    const enrichedPatients = await Promise.all(
      patients.map(async (p) => {
        const pObj = p.toObject();
        const activeCase = await FollowUpCase.findOne({
          patient: p._id,
          status: { $nin: ['follow_up_completed', 'closed'] }
        }).sort({ updatedAt: -1 });

        const openBarrier = await Barrier.findOne({
          patient: p._id,
          status: { $in: ['open', 'in_review', 'support_matched'] }
        }).sort({ reportedAt: -1 });

        const upcomingAppt = await Appointment.findOne({
          patient: p._id,
          status: 'scheduled',
          scheduledAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).sort({ scheduledAt: 1 });

        pObj.activeFollowUpCase = activeCase || null;
        pObj.activeBarrier = openBarrier || null;
        pObj.nextAppointment = upcomingAppt || null;
        pObj.recommendedNextAction = activeCase?.recommendedNextAction || 'Maintain routine monitoring schedule';

        return pObj;
      })
    );

    res.json({
      success: true,
      count: enrichedPatients.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      patients: enrichedPatients
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single patient details
// @route   GET /api/v1/patients/:id
// @access  Private (Patient access verified)
const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('primaryCondition')
      .populate('villageId')
      .populate('facilityId')
      .populate('assignedWorker', 'name phone email')
      .populate('assignedWorkerId', 'name phone email')
      .populate('authorizedCaregivers', 'name phone email')
      .populate('linkedCaregiverIds', 'name phone email');

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({
      success: true,
      patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete Consolidated Patient Journey
// @route   GET /api/v1/patients/:id/journey
// @access  Private
const getPatientJourney = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    const patient = await Patient.findById(patientId)
      .populate('assignedWorker', 'name phone email role')
      .populate('assignedWorkerId', 'name phone email role')
      .populate('authorizedCaregivers', 'name phone email role')
      .populate('linkedCaregiverIds', 'name phone email role');

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // 1. Appointments
    const appointments = await Appointment.find({
      $or: [{ patient: patientId }, { patientId }]
    }).sort({ scheduledAt: -1 });

    // 2. Barriers
    const barriers = await Barrier.find({
      $or: [{ patient: patientId }, { patientId }]
    })
      .populate('matchedSupportAction')
      .populate('reportedBy', 'name role')
      .sort({ reportedAt: -1 });

    // 3. Support Actions
    const supportActions = await SupportAction.find({
      $or: [{ patient: patientId }, { patientId }]
    })
      .populate('assignedTo', 'name role phone')
      .populate('relatedBarrier')
      .sort({ createdAt: -1 });

    // 4. Follow-up Recovery Cases
    const followUpCases = await FollowUpCase.find({
      $or: [{ patient: patientId }, { patientId }]
    })
      .populate('assignedTo', 'name role')
      .sort({ createdAt: -1 });

    // 5. Communications / Notifications Log
    const notifications = await Notification.find({
      $or: [{ patient: patientId }, { patientId }]
    }).sort({ createdAt: -1 });

    // 6. Build unified chronological timeline
    const timeline = [];

    // Registration event
    timeline.push({
      id: `reg-${patient._id}`,
      type: 'registration',
      title: 'Patient Registered in Care Program',
      description: `Enrolled in ${patient.treatmentProgram || 'Chronic Disease Continuity'} program.`,
      timestamp: patient.createdAt,
      actor: 'System / Healthcare Worker',
      badge: 'Registration'
    });

    appointments.forEach((a) => {
      let title = `Appointment ${a.status.toUpperCase()}: ${a.appointmentType}`;
      let badge = 'Appointment';
      if (a.status === 'missed') badge = 'Missed Visit';
      else if (a.status === 'rescheduled') badge = 'Rescheduled';
      else if (a.status === 'completed') badge = 'Completed';

      timeline.push({
        id: `appt-${a._id}`,
        type: `appointment_${a.status}`,
        title,
        description: a.notes || `Scheduled date: ${new Date(a.scheduledAt).toLocaleDateString()}`,
        timestamp: a.completedAt || a.scheduledAt || a.createdAt,
        actor: 'Clinic Team',
        badge
      });
    });

    barriers.forEach((b) => {
      timeline.push({
        id: `barr-${b._id}`,
        type: 'barrier_reported',
        title: `Barrier Reported: ${b.categoryLabel || b.category.replace(/_/g, ' ')}`,
        description: b.description || 'Assistance requested with treatment continuity.',
        timestamp: b.reportedAt,
        actor: `${b.sourceType.toUpperCase()} (${b.reporterName || 'Patient'})`,
        badge: 'Barrier Identified'
      });
    });

    supportActions.forEach((sa) => {
      timeline.push({
        id: `sa-${sa._id}`,
        type: 'support_action',
        title: `Support Action [${sa.status.toUpperCase()}]: ${sa.title || sa.actionType}`,
        description: sa.suggestedAction,
        timestamp: sa.completedAt || sa.createdAt,
        actor: sa.assignedTo?.name || sa.assignedTeam || 'Outreach Worker',
        badge: 'Support Assigned'
      });
    });

    followUpCases.forEach((fc) => {
      (fc.contactAttempts || []).forEach((ca, idx) => {
        timeline.push({
          id: `ca-${fc._id}-${idx}`,
          type: 'contact_attempt',
          title: `Contact Attempt via ${ca.channel.toUpperCase()}: Outcome ${ca.outcome.toUpperCase()}`,
          description: ca.notes || `Attempt #${ca.attemptNumber} logged.`,
          timestamp: ca.date,
          actor: ca.recordedByName || 'Outreach Worker',
          badge: 'Patient Contacted'
        });
      });

      if (fc.outcome?.status) {
        timeline.push({
          id: `out-${fc._id}`,
          type: 'recovery_outcome',
          title: `Follow-Up Case Outcome: ${fc.outcome.status.toUpperCase()}`,
          description: fc.outcome.recoveryReason || 'Case closed with recorded outcome.',
          timestamp: fc.outcome.recordedAt || fc.updatedAt,
          actor: 'Supervisor / Staff',
          badge: 'Follow-up Completed'
        });
      }
    });

    notifications.forEach((n) => {
      timeline.push({
        id: `notif-${n._id}`,
        type: 'communication',
        title: `Simulated ${n.channel.toUpperCase()} Sent [DEMO]`,
        description: n.message,
        timestamp: n.createdAt,
        actor: 'Simulated Notification Gateway',
        badge: 'Simulated Message'
      });
    });

    // Sort timeline chronologically (newest first)
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      patient,
      journey: {
        appointments,
        barriers,
        supportActions,
        followUpCases,
        notifications,
        timeline
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new patient
// @route   POST /api/v1/patients
// @access  Private (Healthcare worker / Admin)
const createPatient = async (req, res, next) => {
  try {
    const {
      name,
      age,
      gender,
      phone,
      treatmentProgram,
      villageId,
      facilityId,
      primaryCondition,
      distanceToFacilityKm,
      address,
      assignedWorkerId,
      consentPreferences
    } = req.body;

    const count = await Patient.countDocuments();
    const patientId = `PAT-${1000 + count + 1}`;

    const patient = await Patient.create({
      patientId,
      patientCode: patientId,
      name,
      age,
      gender: gender || 'Female',
      phone,
      contactInfo: {
        phone: phone || '',
        address: address || 'Sector 4, Rampur',
        preferredContactMethod: 'phone_call'
      },
      treatmentProgram: treatmentProgram || 'Diabetes',
      healthcareFacility: {
        name: 'Primary Health Center Rampur',
        code: 'PHC-01',
        distanceKm: distanceToFacilityKm || 4.5,
        location: { lat: 26.8520, lng: 80.9490 }
      },
      location: {
        lat: 26.8467 + (Math.random() - 0.5) * 0.05,
        lng: 80.9462 + (Math.random() - 0.5) * 0.05,
        address: address || 'Rampur'
      },
      villageId,
      facilityId,
      primaryCondition,
      assignedWorker: assignedWorkerId || req.user._id,
      assignedWorkerId: assignedWorkerId || req.user._id,
      treatmentStartDate: new Date(),
      nextAppointmentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      consentPreferences: consentPreferences || {
        shareWithFamily: true,
        allowSmsReminders: true,
        allowIvrCalls: true,
        allowDoorstepRefill: true,
        allowLocationSharing: true
      }
    });

    // Run initial prioritization
    await assessPatientPrioritization(patient._id).catch(() => {});

    await logAudit(req.user._id, 'PATIENT_CREATE', 'Patient', patient._id, { patientId, name });

    res.status(201).json({
      success: true,
      patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient information
// @route   PATCH /api/v1/patients/:id
// @access  Private
const updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    await assessPatientPrioritization(patient._id).catch(() => {});
    await logAudit(req.user._id, 'PATIENT_UPDATE', 'Patient', patient._id);

    res.json({
      success: true,
      patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete longitudinal patient history (backward compat)
const getPatientHistory = async (req, res, next) => {
  return getPatientJourney(req, res, next);
};

// @desc    Get patient latest risk breakdown & explanation
const getPatientRisk = async (req, res, next) => {
  try {
    const assessment = await assessPatientPrioritization(req.params.id);
    res.json({
      success: true,
      riskScore: assessment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  getPatientJourney,
  createPatient,
  updatePatient,
  getPatientHistory,
  getPatientRisk
};
