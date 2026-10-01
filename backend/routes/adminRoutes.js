const express = require('express');
const {
  getAllUsers, updateUser, deleteUser,
  adminGetAllProducts, adminUpdateProduct, adminDeleteProduct,
  adminGetInventory, monitorBlockchain, verifySuspiciousTransaction, getSystemOverview
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const auditMiddleware = require('../middleware/auditMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/overview', getSystemOverview);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id', auditMiddleware('admin_update_user', 'User'), updateUser);
router.delete('/users/:id', auditMiddleware('admin_delete_user', 'User'), deleteUser);

// Products
router.get('/products', adminGetAllProducts);
router.put('/products/:id', auditMiddleware('admin_update_product', 'Product'), adminUpdateProduct);
router.delete('/products/:id', auditMiddleware('admin_delete_product', 'Product'), adminDeleteProduct);

// Inventory
router.get('/inventory', adminGetInventory);

// Blockchain
router.get('/blockchain', monitorBlockchain);
router.put('/blockchain/:id/verify', auditMiddleware('admin_verify_transaction', 'BlockchainTransaction'), verifySuspiciousTransaction);

module.exports = router;
