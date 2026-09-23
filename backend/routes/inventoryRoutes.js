const express = require('express');
const { addStock, updateStock, removeStock, getInventory, getLowStockAlerts, getStockByWarehouse } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getInventory);
router.get('/low-stock', getLowStockAlerts);
router.get('/by-warehouse', getStockByWarehouse);

router.post('/add', authorize('admin', 'warehouse_manager', 'supplier'), addStock);
router.put('/:id', authorize('admin', 'warehouse_manager'), updateStock);
router.post('/remove', authorize('admin', 'warehouse_manager'), removeStock);

module.exports = router;
