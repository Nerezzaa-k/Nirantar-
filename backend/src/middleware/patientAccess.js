const Patient = require('../models/Patient');
const { ROLES } = require('../config/constants');

const verifyPatientAccess = async (req, res, next) => {
  const patientId = req.params.id || req.params.patientId || req.body.patientId;

  if (!patientId) {
    return res.status(400).json({
      success: false,
      message: 'Patient identifier is required.'
    });
  }

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient record not found.'
      });
    }

    const { role } = req.user;

    // Admin has access to all records
    if (role === ROLES.ADMIN) {
      req.patient = patient;
      return next();
    }

    // Healthcare worker has access if assigned or in assigned village
    if (role === ROLES.HEALTHCARE_WORKER) {
      const isAssigned = patient.assignedWorkerId && patient.assignedWorkerId.toString() === req.user._id.toString();
      const inAssignedVillage = req.user.assignedVillageIds && req.user.assignedVillageIds.some(
        vId => vId.toString() === patient.villageId.toString()
      );

      // In community health, workers can view patients within their assigned sector/villages or directly assigned
      if (isAssigned || inAssignedVillage || !patient.assignedWorkerId) {
        req.patient = patient;
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to access this patient outside your catchment area.'
      });
    }

    // Patient can only access their own record
    if (role === ROLES.PATIENT) {
      if (req.user.patientId && req.user.patientId.toString() === patient._id.toString()) {
        req.patient = patient;
        return next();
      }
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Patients can only view their own personal medical information.'
      });
    }

    // Caregiver can only access explicitly linked patients
    if (role === ROLES.CAREGIVER) {
      const isLinked = req.user.linkedPatientIds && req.user.linkedPatientIds.some(
        pId => pId.toString() === patient._id.toString()
      );

      if (isLinked) {
        // Check patient consent
        if (patient.consentSettings && patient.consentSettings.shareWithFamily === false) {
          return res.status(403).json({
            success: false,
            message: 'Patient has not granted permission to share records with family caregivers.'
          });
        }
        req.patient = patient;
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not linked to this patient.'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying patient access permissions.',
      error: error.message
    });
  }
};

module.exports = { verifyPatientAccess };
