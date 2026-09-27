const express = require('express');
const { getProductJourney, getCurrentLocation, getPreviousLocations } = require('../controllers/trackingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/:productId', getProductJourney);
router.get('/:productId/location', getCurrentLocation);
router.get('/:productId/locations', getPreviousLocations);

module.exports = router;
