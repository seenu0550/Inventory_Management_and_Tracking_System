const express = require('express');
const { getInventoryReport, getShipmentReport, getSupplierReport, getWarehouseReport, getBlockchainReport, exportInventoryPDF, exportInventoryExcel, exportShipmentExcel } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin', 'warehouse_manager'));

router.get('/inventory', getInventoryReport);
router.get('/shipments', getShipmentReport);
router.get('/suppliers', getSupplierReport);
router.get('/warehouses', getWarehouseReport);
router.get('/blockchain', getBlockchainReport);

router.get('/export/inventory/pdf', exportInventoryPDF);
router.get('/export/inventory/excel', exportInventoryExcel);
router.get('/export/shipments/excel', exportShipmentExcel);

module.exports = router;
