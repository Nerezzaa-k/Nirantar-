const express = require('express');
const router = express.Router();
const {
  getNotifications,
  triggerSimulatedNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.post('/simulate', triggerSimulatedNotification);

module.exports = router;
