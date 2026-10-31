const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController');

const router = express.Router();

router.use(protect);

router.get('/',             getNotifications);    // GET with ?read=false for unread count
router.patch('/read-all',   markAllAsRead);       // Mark all as read — MUST be before /:id
router.patch('/:id/read',   markAsRead);
router.delete('/:id',       deleteNotification);

module.exports = router;
