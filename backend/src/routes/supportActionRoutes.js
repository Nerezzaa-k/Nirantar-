const express = require('express');
const router = express.Router();
const {
  getSupportActions,
  createSupportAction,
  updateSupportActionStatus,
  assignSupportAction
} = require('../controllers/supportActionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getSupportActions);
router.post('/', createSupportAction);
router.patch('/:id/status', updateSupportActionStatus);
router.patch('/:id/assign', assignSupportAction);

module.exports = router;
