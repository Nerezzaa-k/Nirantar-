const express = require('express');
const router = express.Router();
const { getVillages, getFacilities } = require('../controllers/villageController');

router.get('/villages', getVillages);
router.get('/facilities', getFacilities);

module.exports = router;
