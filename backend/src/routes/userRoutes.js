const express = require('express');
const router = express.Router();
const { getUsers, getAuditLogs } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.get('/users', protect, getUsers);
router.get('/audit-logs', protect, authorize(ROLES.ADMIN), getAuditLogs);

module.exports = router;
