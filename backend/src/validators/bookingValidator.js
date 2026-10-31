const { body } = require('express-validator');

const createBookingValidator = [
  body('doctorId', 'Doctor ID is required').not().isEmpty(),
  body('date', 'Date is required').not().isEmpty(),
  body('time', 'Time slot is required').not().isEmpty(),
];

module.exports = { createBookingValidator };
