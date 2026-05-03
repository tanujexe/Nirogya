const express = require('express');
const { getBloodBanks, searchBloodGroup } = require('../controllers/bloodBankController');

const router = express.Router();

router.get('/', getBloodBanks);
router.get('/search', searchBloodGroup);

module.exports = router;
