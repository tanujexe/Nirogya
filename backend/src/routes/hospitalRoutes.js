const express = require('express');
const { getHospitals, getNearbyHospitals } = require('../controllers/hospitalController');

const router = express.Router();

router.get('/', getHospitals);
router.get('/nearby', getNearbyHospitals);

module.exports = router;
