const express = require('express');
const { verifyProduct, verifyInventory, verifyShipment } = require('../controllers/tamperController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/product/:productId', verifyProduct);
router.get('/inventory/:id', verifyInventory);
router.get('/shipment/:id', verifyShipment);

module.exports = router;
