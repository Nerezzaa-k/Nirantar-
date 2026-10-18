const express = require('express');
const router = express.Router();
const {
  calculateRisk,
  getRiskPatients,
  getConfiguration,
  updateConfiguration
} = require('../controllers/riskController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(protect);

router.post('/calculate/:patientId', authorize(ROLES.HEALTHCARE_WORKER, ROLES.ADMIN), calculateRisk);
router.get('/patients', getRiskPatients);
router.get('/configuration', getConfiguration);
router.patch('/configuration/:conditionId', authorize(ROLES.ADMIN), updateConfiguration);

module.exports = router;
