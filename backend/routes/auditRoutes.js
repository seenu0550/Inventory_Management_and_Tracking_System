const express = require('express');
const { getAllLogs, getMyActivity, getLogById } = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/my-activity', getMyActivity);
router.get('/', authorize('admin'), getAllLogs);
router.get('/:id', authorize('admin'), getLogById);

module.exports = router;
