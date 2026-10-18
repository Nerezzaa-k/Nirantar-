const express = require('express');
const router = express.Router();
const {
  getRecoveryCases,
  getRecoveryCaseById,
  recordContactAttempt,
  updateCaseStatus,
  assignCase,
  recordCaseOutcome,
  reassessPatientRisk
} = require('../controllers/recoveryTrackerController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getRecoveryCases);
router.get('/:id', getRecoveryCaseById);
router.post('/:id/contact-attempt', recordContactAttempt);
router.patch('/:id/status', updateCaseStatus);
router.patch('/:id/assign', assignCase);
router.post('/:id/record-outcome', recordCaseOutcome);
router.post('/assess-patient/:patientId', reassessPatientRisk);

module.exports = router;
