const express = require('express');
const { getAmbulances, requestAmbulance } = require('../controllers/ambulanceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getAmbulances);
router.post('/request', protect, requestAmbulance);

module.exports = router;
