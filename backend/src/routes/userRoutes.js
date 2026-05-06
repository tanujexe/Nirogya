const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getProfile, updateProfile } = require('../controllers/userController');
const { getNotifications } = require('../controllers/notificationController');
const { uploadProfileImage } = require('../config/cloudinary');

const router = express.Router();

router.use(protect);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.get('/notifications', getNotifications);

router.post('/upload-avatar', uploadProfileImage.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({ success: true, url: req.file.path });
});

module.exports = router;
