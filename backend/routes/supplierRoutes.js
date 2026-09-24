const express = require('express');
const { body } = require('express-validator');
const {
  createSupplier, getAllSuppliers, getSupplierById, updateSupplier,
  deleteSupplier, addProductToSupplier, createPurchaseOrder,
  updatePurchaseOrderStatus, getTransactionHistory
} = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAllSuppliers);
router.get('/:id', getSupplierById);
router.get('/:id/transactions', getTransactionHistory);

router.post('/', authorize('admin'), [
  body('name').notEmpty().withMessage('Supplier name is required'),
  body('email').isEmail().withMessage('Valid email is required')
], createSupplier);

router.put('/:id', authorize('admin'), updateSupplier);
router.delete('/:id', authorize('admin'), deleteSupplier);

router.post('/:id/products', authorize('admin', 'supplier'), addProductToSupplier);
router.post('/:id/purchase-orders', authorize('admin', 'warehouse_manager'), createPurchaseOrder);
router.put('/:id/purchase-orders/:orderId', authorize('admin', 'warehouse_manager'), updatePurchaseOrderStatus);

module.exports = router;
