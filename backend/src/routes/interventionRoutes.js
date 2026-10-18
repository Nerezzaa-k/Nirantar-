const express = require('express');
const router = express.Router();
const {
  getInterventions,
  getInterventionById,
  createIntervention,
  updateIntervention,
  recordOutcome
} = require('../controllers/interventionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/', getInterventions);
router.post('/', authorize(ROLES.HEALTHCARE_WORKER, ROLES.ADMIN), createIntervention);
router.get('/:id', getInterventionById);
router.patch('/:id', authorize(ROLES.HEALTHCARE_WORKER, ROLES.ADMIN), updateIntervention);
router.post('/:id/outcome', authorize(ROLES.HEALTHCARE_WORKER, ROLES.ADMIN), recordOutcome);

module.exports = router;
