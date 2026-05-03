const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id }).sort('-createdAt');
  res.json({ success: true, data: notifications });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  if (notification.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized');
  }
  notification.read = true;
  await notification.save();
  res.json({ success: true, data: notification });
});

module.exports = { getNotifications, markAsRead };
