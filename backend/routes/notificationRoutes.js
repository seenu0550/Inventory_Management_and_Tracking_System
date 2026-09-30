const express = require('express');
const { getMyNotifications, markAsRead, markAllAsRead, getLowStockAlerts } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.get('/low-stock', getLowStockAlerts);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

module.exports = router;
