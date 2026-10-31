const asyncHandler = require('../utils/asyncHandler');
const FormData = require('form-data');
const axios = require('axios');
// fetch is native in Node 18+ (if still used)

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:5002';

const predict = asyncHandler(async (req, res) => {
  try {
    console.log(`[DEBUG] Node: /predict -> ${PYTHON_AI_URL}/predict`, req.body);
    const response = await fetch(`${PYTHON_AI_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { error: text || 'Invalid response from AI server' }; }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(503).json({ success: false, error: 'AI Backend is unreachable: ' + error.message });
  }
});

const followUp = asyncHandler(async (req, res) => {
  try {
    console.log(`[DEBUG] Node: /follow_up -> ${PYTHON_AI_URL}/follow_up`, req.body);
    const response = await fetch(`${PYTHON_AI_URL}/follow_up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { error: text || 'Invalid response from AI server' }; }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(503).json({ success: false, error: 'AI Backend is unreachable: ' + error.message });
  }
});

const normalizeInput = asyncHandler(async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_AI_URL}/normalize-input`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { error: text || 'Invalid response from AI server' }; }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(503).json({ success: false, error: 'AI Backend is unreachable: ' + error.message });
  }
});

const analyzeReport = asyncHandler(async (req, res) => {
  console.log('[DEBUG] Node: /analyze-report received file:', req.file ? req.file.originalname : 'NONE');
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const formData = new FormData();
  formData.append('file', req.file.buffer, {
    filename: req.file.originalname,
    contentType: req.file.mimetype,
  });
  
  if (req.body.gender) formData.append('gender', req.body.gender);
  if (req.body.sex) formData.append('sex', req.body.sex);
  if (req.body.age) formData.append('age', req.body.age);
  if (req.body.dob) formData.append('dob', req.body.dob);
  if (req.body.date_of_birth) formData.append('date_of_birth', req.body.date_of_birth);
  if (req.body.symptoms) formData.append('symptoms', req.body.symptoms);

  try {
    console.log(`[DEBUG] Node: Sending file to Python via Axios -> ${PYTHON_AI_URL}/analyze-report`);
    const response = await axios.post(`${PYTHON_AI_URL}/analyze-report`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 120000, // 120 seconds for OCR cascade
    });

    let data = response.data;

    // Normalize lab report response to match standard AI response format
    if (data.ml_prediction && !data.predictions) {
      data.predictions = data.ml_prediction;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('[ERROR] Python API Error:', error.response?.data || error.message);
    const status = error.response?.status || 503;
    const errorData = error.response?.data || { error: 'AI Backend is unreachable: ' + error.message };
    res.status(status).json(errorData);
  }
});

module.exports = {
  predict,
  followUp,
  normalizeInput,
  analyzeReport
};
