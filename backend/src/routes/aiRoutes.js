const express = require('express');
const router = express.Router();
const {
  explainRisk,
  summarizeNotes,
  categorizeBarrier,
  draftMessage,
  classifyReason,
  recommendIntervention,
  getDistrictSummary,
  workerAssistant
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/explain-risk', explainRisk);
router.post('/summarize-notes', summarizeNotes);
router.post('/categorize-barrier', categorizeBarrier);
router.post('/draft-message', draftMessage);
router.post('/classify-reason', classifyReason);
router.post('/recommend-intervention', recommendIntervention);
router.post('/district-summary', getDistrictSummary);
router.post('/worker-assistant', workerAssistant);

module.exports = router;
