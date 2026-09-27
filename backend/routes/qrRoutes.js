const express = require('express');
const { generateQR, scanQR } = require('../controllers/qrController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/generate/:productId', generateQR);
router.post('/scan', scanQR);

module.exports = router;
