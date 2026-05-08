const { body } = require('express-validator');

const updateProfileValidator = [
  body('specialization', 'Specialization is required').optional().not().isEmpty(),
  body('experience', 'Experience must be a number').optional().isNumeric(),
  body('fees', 'Fees must be a number').optional().isNumeric(),
];

module.exports = { updateProfileValidator };
