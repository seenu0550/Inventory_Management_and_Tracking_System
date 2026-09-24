const express = require('express');
const { body } = require('express-validator');
const {
  createWarehouse, getAllWarehouses, getWarehouseById, updateWarehouse,
  deleteWarehouse, transferStock, getWarehouseInventoryReport
} = require('../controllers/warehouseController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAllWarehouses);
router.get('/:id', getWarehouseById);
router.get('/:name/report', getWarehouseInventoryReport);

router.post('/', authorize('admin'), [
  body('name').notEmpty().withMessage('Warehouse name is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('capacity').isNumeric().withMessage('Capacity must be a number')
], createWarehouse);

router.put('/:id', authorize('admin'), updateWarehouse);
router.delete('/:id', authorize('admin'), deleteWarehouse);
router.post('/transfer', authorize('admin', 'warehouse_manager'), transferStock);

module.exports = router;
