const express = require('express');
const router = express.Router();
const { createCheckIn, getCheckIns } = require('../controllers/checkInController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createCheckIn);
router.get('/', getCheckIns);

module.exports = router;
