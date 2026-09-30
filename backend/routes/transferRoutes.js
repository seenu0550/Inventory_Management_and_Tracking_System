const express = require('express');
const { initiateTransfer, confirmBySender, confirmByReceiver, getAllTransfers, cancelTransfer } = require('../controllers/transferController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAllTransfers);
router.post('/', authorize('admin', 'warehouse_manager'), initiateTransfer);
router.put('/:id/confirm-sender', authorize('admin', 'warehouse_manager', 'supplier'), confirmBySender);
router.put('/:id/confirm-receiver', authorize('admin', 'warehouse_manager', 'distributor', 'retailer'), confirmByReceiver);
router.put('/:id/cancel', authorize('admin', 'warehouse_manager'), cancelTransfer);

module.exports = router;
