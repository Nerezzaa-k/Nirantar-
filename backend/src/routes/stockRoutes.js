const express = require('express');
const router = express.Router();
const { getStock, createStock, updateStock } = require('../controllers/stockController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/', getStock);
router.post('/', authorize(ROLES.ADMIN, ROLES.HEALTHCARE_WORKER), createStock);
router.patch('/:id', authorize(ROLES.ADMIN, ROLES.HEALTHCARE_WORKER), updateStock);

module.exports = router;
