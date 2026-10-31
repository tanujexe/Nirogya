const express = require('express');
const multer = require('multer');
const { predict, followUp, normalizeInput, analyzeReport } = require('../controllers/aiController');
// If auth is required, we can add `const { protect } = require('../middleware/authMiddleware');`

const router = express.Router();

// Memory storage for multer since we just pass it to the python proxy
const upload = multer({ storage: multer.memoryStorage() });

router.post('/predict', predict);
router.post('/follow_up', followUp);
router.post('/normalize-input', normalizeInput);
router.post('/analyze-report', upload.single('file'), analyzeReport);

module.exports = router;
