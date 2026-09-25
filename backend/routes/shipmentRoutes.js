const express = require('express');
const { body } = require('express-validator');
const { createShipment, getAllShipments, getShipmentById, updateShipmentStatus, dispatchShipment, confirmReceived, getShipmentHistory } = require('../controllers/shipmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAllShipments);
router.get('/:id', getShipmentById);
router.get('/:id/history', getShipmentHistory);

router.post('/', authorize('admin', 'supplier', 'warehouse_manager'), [
  body('product').notEmpty().withMessage('Product is required'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('source').notEmpty().withMessage('Source is required'),
  body('destination').notEmpty().withMessage('Destination is required')
], createShipment);

router.put('/:id/status', authorize('admin', 'warehouse_manager', 'supplier'), updateShipmentStatus);
router.put('/:id/dispatch', authorize('admin', 'supplier', 'warehouse_manager'), dispatchShipment);
router.put('/:id/receive', authorize('admin', 'warehouse_manager', 'distributor', 'retailer'), confirmReceived);

module.exports = router;
