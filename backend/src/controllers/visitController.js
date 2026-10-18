const Visit = require('../models/Visit');
const Patient = require('../models/Patient');
const { calculatePatientRisk } = require('../services/riskEngine');
const { logAudit } = require('../middleware/audit');

// @desc    Get visits list
// @route   GET /api/v1/visits
// @access  Private
const getVisits = async (req, res, next) => {
  try {
    const { patientId, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Visit.countDocuments(filter);

    const visits = await Visit.find(filter)
      .populate('patientId', 'name patientCode villageId')
      .populate('workerId', 'name')
      .sort({ visitDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: visits.length,
      total,
      visits
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record new visit
// @route   POST /api/v1/visits
// @access  Private (Worker, Admin)
const createVisit = async (req, res, next) => {
  try {
    const {
      patientId,
      visitDate,
      visitType,
      status = 'attended',
      clinicalMeasurements,
      notes,
      nextAppointmentDate
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const visit = await Visit.create({
      patientId,
      workerId: req.user._id,
      visitDate: visitDate || new Date(),
      visitType: visitType || 'routine_checkup',
      status,
      clinicalMeasurements,
      notes
    });

    // Update patient's lastVisitDate and nextAppointmentDate if provided
    patient.lastVisitDate = visit.visitDate;
    if (nextAppointmentDate) {
      patient.nextAppointmentDate = nextAppointmentDate;
    }
    await patient.save();

    // Recalculate risk score
    await calculatePatientRisk(patient._id);

    await logAudit(req.user._id, 'VISIT_CREATE', 'Visit', visit._id, { patientId, status });

    res.status(201).json({
      success: true,
      visit
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update visit status
// @route   PATCH /api/v1/visits/:id
// @access  Private
const updateVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    // Recalculate risk score
    await calculatePatientRisk(visit.patientId);

    await logAudit(req.user._id, 'VISIT_UPDATE', 'Visit', visit._id);

    res.json({
      success: true,
      visit
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVisits,
  createVisit,
  updateVisit
};
