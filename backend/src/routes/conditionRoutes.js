const express = require('express');
const router = express.Router();
const { getConditions, createCondition, updateCondition } = require('../controllers/conditionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.get('/', getConditions);
router.post('/', protect, authorize(ROLES.ADMIN), createCondition);
router.patch('/:id', protect, authorize(ROLES.ADMIN), updateCondition);

module.exports = router;
