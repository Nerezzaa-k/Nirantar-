const analyticsService = require('../services/analyticsService');

// @desc    Get dashboard summary metrics
// @route   GET /api/v1/analytics/summary
// @access  Private
const getSummary = async (req, res, next) => {
  try {
    const metrics = await analyticsService.getSummaryMetrics(req.query);
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get worker dashboard metrics, risk pie & priority queue
// @route   GET /api/v1/analytics/worker-dashboard
// @access  Private
const getWorkerDashboard = async (req, res, next) => {
  try {
    const workerId = req.user?.role === 'healthcare_worker' ? req.user._id : req.query.workerId;
    const data = await analyticsService.getWorkerDashboard(workerId);
    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get administrator dashboard analytics, Recharts charts datasets
// @route   GET /api/v1/analytics/admin-dashboard
// @access  Private
const getAdminDashboard = async (req, res, next) => {
  try {
    const data = await analyticsService.getAdminDashboardAnalytics(req.query);
    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dropout reasons breakdown
// @route   GET /api/v1/analytics/dropout-reasons
// @access  Private
const getDropoutReasons = async (req, res, next) => {
  try {
    const reasons = await analyticsService.getDropoutReasons(req.query);
    res.json({
      success: true,
      reasons
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get intervention effectiveness ("What Works") table & metrics
// @route   GET /api/v1/analytics/intervention-effectiveness
// @access  Private
const getInterventionEffectiveness = async (req, res, next) => {
  try {
    const effectiveness = await analyticsService.getInterventionEffectiveness(req.query);
    res.json({
      success: true,
      effectiveness
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get geographic hotspots data for Leaflet map
// @route   GET /api/v1/analytics/hotspots
// @access  Private
const getHotspots = async (req, res, next) => {
  try {
    const hotspots = await analyticsService.getGeographicHotspots(req.query);
    res.json({
      success: true,
      hotspots
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getWorkerDashboard,
  getAdminDashboard,
  getDropoutReasons,
  getInterventionEffectiveness,
  getHotspots
};
