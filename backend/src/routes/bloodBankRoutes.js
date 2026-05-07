const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getBloodBanks, searchBloodGroup, requestBlood, getBloodBankById } = require('../controllers/bloodBankController');

const router = express.Router();

router.get('/',        getBloodBanks);
router.get('/search',  searchBloodGroup);
router.get('/:id',     getBloodBankById);
router.post('/request', protect, requestBlood);  // authenticated — reduces stock

module.exports = router;
