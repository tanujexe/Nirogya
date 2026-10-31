const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');

// ── GET NOTIFICATIONS ─────────────────────────────────────────────────────────
const getNotifications = asyncHandler(async (req, res) => {
  const { read, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = { userId: req.user.id };
  if (read === 'true')  query.read = true;
  if (read === 'false') query.read = false;

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, data: notifications, total, unreadCount, page: Number(page) });
});

// ── MARK SINGLE AS READ ───────────────────────────────────────────────────────
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

// ── MARK ALL AS READ ──────────────────────────────────────────────────────────
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, read: false },
    { $set: { read: true } }
  );
  res.json({ success: true, message: 'All notifications marked as read' });
});

// ── DELETE NOTIFICATION ────────────────────────────────────────────────────────
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  if (notification.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized');
  }
  await notification.deleteOne();
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
