const express = require('express');
const router = express.Router();
const {
  getBarriers,
  createBarrier,
  updateBarrierStatus,
  matchSupportAction
} = require('../controllers/barrierController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getBarriers);
router.post('/', createBarrier);
router.patch('/:id/status', updateBarrierStatus);
router.post('/:id/match-support', matchSupportAction);

module.exports = router;
