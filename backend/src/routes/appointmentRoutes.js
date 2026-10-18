const express = require('express');
const router = express.Router();
const {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  recordMissedAppointment
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAppointments);
router.post('/', createAppointment);
router.patch('/:id/status', updateAppointmentStatus);
router.post('/:id/reschedule', rescheduleAppointment);
router.post('/:id/record-missed', recordMissedAppointment);

module.exports = router;
