const express = require('express');
const router = express.Router();
const {
  uploadHealthRecord,
  getHealthRecords,
  getHealthRecordById,
  updateHealthRecord,
  deleteHealthRecord,
  getHealthRecordStats,
} = require('../controllers/healthRecordController');
const { protect } = require('../middleware/authMiddleware');
const { uploadHealthRecord: upload } = require('../utils/cloudinary');

// All routes are protected (require authentication)
router.use(protect);

router.post('/', upload.single('file'), uploadHealthRecord);
router.get('/', getHealthRecords);
router.get('/stats', getHealthRecordStats);
router.get('/:id', getHealthRecordById);
router.put('/:id', updateHealthRecord);
router.delete('/:id', deleteHealthRecord);

module.exports = router;