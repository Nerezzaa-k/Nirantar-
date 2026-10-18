const express = require('express');
const router = express.Router();
const {
  getSummary,
  getWorkerDashboard,
  getAdminDashboard,
  getDropoutReasons,
  getInterventionEffectiveness,
  getHotspots
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getSummary);
router.get('/worker-dashboard', getWorkerDashboard);
router.get('/admin-dashboard', getAdminDashboard);
router.get('/dropout-reasons', getDropoutReasons);
router.get('/intervention-effectiveness', getInterventionEffectiveness);
router.get('/hotspots', getHotspots);

module.exports = router;
