const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  applyAsProvider, 
  getProvidersByType, 
  getProviderById,
  getMyProfile,
  updateMyProfile
} = require('../controllers/providerController');

const router = express.Router();

router.post('/apply', protect, applyAsProvider);
router.get('/profile', protect, getMyProfile);
router.put('/profile', protect, updateMyProfile);
router.get('/:type', getProvidersByType);
router.get('/:type/:id', getProviderById);


module.exports = router;
