const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const patientRoutes = require('./patientRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const barrierRoutes = require('./barrierRoutes');
const supportActionRoutes = require('./supportActionRoutes');
const recoveryRoutes = require('./recoveryRoutes');
const notificationRoutes = require('./notificationRoutes');
const programRoutes = require('./programRoutes');
const visitRoutes = require('./visitRoutes');
const checkInRoutes = require('./checkInRoutes');
const refillRoutes = require('./refillRoutes');
const stockRoutes = require('./stockRoutes');
const riskRoutes = require('./riskRoutes');
const interventionRoutes = require('./interventionRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const aiRoutes = require('./aiRoutes');
const conditionRoutes = require('./conditionRoutes');
const villageRoutes = require('./villageRoutes');
const userRoutes = require('./userRoutes');

// API Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Nirantar AI-Powered Treatment Continuity Platform',
    version: '3.0.0',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/barriers', barrierRoutes);
router.use('/support-actions', supportActionRoutes);
router.use('/recovery-cases', recoveryRoutes);
router.use('/notifications', notificationRoutes);
router.use('/programs', programRoutes);
router.use('/visits', visitRoutes);
router.use('/checkins', checkInRoutes);
router.use('/refills', refillRoutes);
router.use('/stock', stockRoutes);
router.use('/risk', riskRoutes);
router.use('/interventions', interventionRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);
router.use('/conditions', conditionRoutes);
router.use('/', villageRoutes);
router.use('/', userRoutes);

module.exports = router;
