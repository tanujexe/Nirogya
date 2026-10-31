const Notification = require('../models/Notification');
const logger = require('../utils/logger');

const createNotification = async (userId, title, message) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
    });
    // In a real application, you might also trigger socket.io event here
    return notification;
  } catch (error) {
    logger.error(`Error creating notification: ${error.message}`);
  }
};

module.exports = { createNotification };
