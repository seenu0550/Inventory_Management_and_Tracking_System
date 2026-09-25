const express = require('express');
const { registerProductOnChain, recordInventoryTransfer, verifyTransaction, getAllTransactions, getTransactionByHash, getProductChainHistory } = require('../controllers/blockchainController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/transactions', getAllTransactions);
router.get('/transactions/:hash', getTransactionByHash);
router.get('/history/:productId', getProductChainHistory);

router.post('/register-product', authorize('admin', 'supplier'), registerProductOnChain);
router.post('/transfer', authorize('admin', 'warehouse_manager', 'supplier'), recordInventoryTransfer);
router.post('/verify', verifyTransaction);

module.exports = router;
