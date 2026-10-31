const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getDoctors, getDoctorById, updateDoctorProfile, getSpecializations } = require('../controllers/doctorController');

const { uploadProfileImage } = require('../config/cloudinary');

const router = express.Router();

router.get('/specializations', getSpecializations);  // MUST be before /:id
router.get('/', getDoctors);
router.patch('/profile', protect, updateDoctorProfile);  // MUST be before /:id
router.post('/upload-avatar', protect, uploadProfileImage.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: req.file.path });
});
router.get('/:id', getDoctorById);

module.exports = router;
