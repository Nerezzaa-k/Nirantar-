const express = require('express');
const router = express.Router();
const {
  getPatients,
  getPatientById,
  getPatientJourney,
  createPatient,
  updatePatient,
  getPatientHistory,
  getPatientRisk
} = require('../controllers/patientController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { verifyPatientAccess } = require('../middleware/patientAccess');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/', getPatients);
router.post('/', authorize(ROLES.HEALTHCARE_WORKER, ROLES.ADMIN), createPatient);

router.get('/:id', verifyPatientAccess, getPatientById);
router.get('/:id/journey', verifyPatientAccess, getPatientJourney);
router.patch('/:id', verifyPatientAccess, updatePatient);
router.get('/:id/history', verifyPatientAccess, getPatientHistory);
router.get('/:id/risk', verifyPatientAccess, getPatientRisk);

module.exports = router;
