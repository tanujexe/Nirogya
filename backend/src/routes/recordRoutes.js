const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { uploadRecord, getMyRecords, getRecordById, viewRecord, updateRecord, deleteRecord, summarizeRecordController } = require('../controllers/recordController');
const { uploadHealthRecord } = require('../config/cloudinary');

const router = express.Router();

router.use(protect);

router.post('/upload',  uploadHealthRecord.single('file'), uploadRecord);
router.get('/my',       getMyRecords);
router.get('/:id/view',   viewRecord);           // Inline proxy — must be before /:id
router.get('/:id',        getRecordById);         // MUST be after /my
router.put('/:id',        updateRecord);
router.delete('/:id',     deleteRecord);
router.post('/:id/summarize', summarizeRecordController);

module.exports = router;
