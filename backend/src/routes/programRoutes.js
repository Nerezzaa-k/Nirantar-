const express = require('express');
const router = express.Router();
const {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram
} = require('../controllers/programController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/', getPrograms);
router.get('/:id', getProgramById);
router.post('/', authorize(ROLES.ADMIN), createProgram);
router.put('/:id', authorize(ROLES.ADMIN), updateProgram);

module.exports = router;
