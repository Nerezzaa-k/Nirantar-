const express = require('express');
const router = express.Router();
const { getRefills, createRefill, updateRefill } = require('../controllers/refillController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/', getRefills);
router.post('/', authorize(ROLES.HEALTHCARE_WORKER, ROLES.ADMIN), createRefill);
router.patch('/:id', authorize(ROLES.HEALTHCARE_WORKER, ROLES.ADMIN), updateRefill);

module.exports = router;
