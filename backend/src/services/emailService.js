const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

const sendEmail = async (options) => {
  if (!env.SMTP_HOST) {
    logger.warn('Email service disabled: SMTP details not provided.');
    return;
  }
  
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  const message = {
    from: `${env.EMAIL_FROM_NAME || 'Nirogya Sathi'} <${env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);
  logger.info(`Message sent: ${info.messageId}`);
};

module.exports = sendEmail;
