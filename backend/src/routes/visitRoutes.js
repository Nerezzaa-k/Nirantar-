const express = require('express');
const router = express.Router();
const { getVisits, createVisit, updateVisit } = require('../controllers/visitController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/', getVisits);
router.post('/', authorize(ROLES.HEALTHCARE_WORKER, ROLES.ADMIN), createVisit);
router.patch('/:id', authorize(ROLES.HEALTHCARE_WORKER, ROLES.ADMIN), updateVisit);

module.exports = router;
