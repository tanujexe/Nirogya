const asyncHandler = require('../utils/asyncHandler');
const MedicalRecord = require('../models/MedicalRecord');
const { deleteFile, cloudinary } = require('../config/cloudinary');
const aiSummaryService = require('../services/aiSummaryService');
const axios = require('axios');

// ── UPLOAD RECORD ─────────────────────────────────────────────────────────────
const uploadRecord = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file (PDF, JPG, PNG)');
  }

  const { title, category, hospitalName, reportDate, notes } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('title is required');
  }

  const record = await MedicalRecord.create({
    userId:        req.user.id,
    title:         title.trim(),
    category:      category || 'Other',
    hospitalName,
    reportDate:    reportDate ? new Date(reportDate) : new Date(),
    notes,
    fileUrl:       req.file.path,         // Cloudinary secure URL
    fileType:      req.file.mimetype,
    cloudinaryId:  req.file.filename,     // public_id for deletion
    uploadedBy:    req.user.id,
    uploaderModel: req.user.role === 'doctor' ? 'Doctor' : 'User',
  });

  res.status(201).json({ success: true, data: record });
});

// ── GET MY RECORDS ────────────────────────────────────────────────────────────
const getMyRecords = asyncHandler(async (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = { userId: req.user.id };
  if (category && category !== 'all') query.category = category;

  let records = await MedicalRecord.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  // Search by title or hospital name
  if (search) {
    const q = search.toLowerCase();
    records = records.filter(r =>
      r.title?.toLowerCase().includes(q) ||
      r.hospitalName?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q)
    );
  }

  const total = await MedicalRecord.countDocuments(query);

  // Generate signed download URLs for the AI summarizer.
  // The viewUrl now points to our own backend proxy that serves files inline.
  const recordsWithSignedUrls = records.map(record => {
    if (record.cloudinaryId) {
      const resourceType = record.fileUrl && record.fileUrl.includes('/raw/upload') ? 'raw' : 'image';

      // fileUrl: signed Cloudinary URL (used by AI summarizer for download)
      const fileUrl = cloudinary.url(record.cloudinaryId, {
        sign_url: true,
        secure: true,
        resource_type: resourceType
      });

      // viewUrl: our backend proxy, which sets correct inline headers
      const viewUrl = `http://localhost:5000/api/records/${record._id}/view`;

      return { ...record, fileUrl, viewUrl };
    }
    return record;
  });

  res.json({ success: true, data: recordsWithSignedUrls, total, page: Number(page) });
});

// ── GET SINGLE RECORD ─────────────────────────────────────────────────────────
const getRecordById = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error('Record not found');
  }
  if (record.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this record');
  }

  const recordObj = record.toObject();
  if (record.cloudinaryId) {
    const resourceType = record.fileUrl && record.fileUrl.includes('/raw/upload') ? 'raw' : 'image';

    recordObj.fileUrl = cloudinary.url(record.cloudinaryId, {
      sign_url: true,
      secure: true,
      resource_type: resourceType
    });

    recordObj.viewUrl = `http://localhost:5000/api/records/${record._id}/view`;
  }

  res.json({ success: true, data: recordObj });
});

// ── UPDATE RECORD METADATA ────────────────────────────────────────────────────
const updateRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);

  if (!record) {
    res.status(404);
    throw new Error('Record not found');
  }
  if (record.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this record');
  }

  const { title, category, hospitalName, reportDate, notes } = req.body;
  if (title)        record.title        = title.trim();
  if (category)     record.category     = category;
  if (hospitalName !== undefined) record.hospitalName = hospitalName;
  if (reportDate)   record.reportDate   = new Date(reportDate);
  if (notes !== undefined)        record.notes        = notes;

  const updated = await record.save();
  res.json({ success: true, data: updated });
});

// ── DELETE RECORD ─────────────────────────────────────────────────────────────
const deleteRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);

  if (!record) {
    res.status(404);
    throw new Error('Record not found');
  }
  if (record.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this record');
  }

  // Delete the actual file from Cloudinary
  if (record.cloudinaryId) {
    try {
      await deleteFile(record.cloudinaryId);
    } catch (err) {
      
      // Don't fail the whole request if Cloudinary fails
    }
  }

  await record.deleteOne();
  res.json({ success: true, message: 'Record deleted successfully' });
});

// ── VIEW RECORD (Inline Proxy) ────────────────────────────────────────────────
// Streams the original Cloudinary asset with correct inline headers.
// This bypasses Cloudinary's image-type PDF transformation limitation.
const viewRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);

  if (!record) { res.status(404); throw new Error('Record not found'); }
  if (record.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized');
  }

  let fetchUrl = record.fileUrl;
  if (fetchUrl && fetchUrl.startsWith('//')) fetchUrl = 'https:' + fetchUrl;

  // Use authenticated private_download_url for Cloudinary assets to bypass PDF 401 delivery restrictions
  if (record.cloudinaryId && fetchUrl?.includes('cloudinary.com')) {
    try {
      const resourceType = fetchUrl.includes('/raw/upload') ? 'raw' : 'image';
      const format = record.fileType === 'application/pdf' ? 'pdf' : undefined;
      fetchUrl = cloudinary.utils.private_download_url(record.cloudinaryId, format, {
        resource_type: resourceType,
        type: 'upload',
      });
    } catch (e) {
      console.warn('Failed to build private download URL for viewRecord:', e.message);
    }
  }

  if (!fetchUrl) {
    res.status(404);
    throw new Error('File URL not found for this record');
  }

  // Fetch and proxy-stream with inline headers
  const upstream = await axios.get(fetchUrl, { responseType: 'stream' });

  const mimeType = record.fileType || upstream.headers['content-type'] || 'application/octet-stream';
  const isPdf = mimeType === 'application/pdf';
  const ext = isPdf ? '.pdf' : (mimeType.startsWith('image/') ? `.${mimeType.split('/')[1]}` : '');
  const safeTitle = (record.title || 'report').replace(/[^a-z0-9]/gi, '_');
  const filename = `${safeTitle}${ext}`;

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Cache-Control', 'private, max-age=300');
  // Forward content-length if available so browser shows progress
  if (upstream.headers['content-length']) {
    res.setHeader('Content-Length', upstream.headers['content-length']);
  }

  upstream.data.pipe(res);
});

// ── SUMMARIZE RECORD ──────────────────────────────────────────────────────────
const summarizeRecordController = asyncHandler(async (req, res) => {
  try {
    const summary = await aiSummaryService.summarizeRecord(req.params.id, req.user.id);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('[AI Summary Error]:', error.message, error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = { uploadRecord, getMyRecords, getRecordById, viewRecord, updateRecord, deleteRecord, summarizeRecordController };
