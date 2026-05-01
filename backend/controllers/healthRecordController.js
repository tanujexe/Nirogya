const asyncHandler = require('express-async-handler');
const HealthRecord = require('../models/HealthRecord');
const { deleteFile } = require('../utils/cloudinary');

/**
 * @desc    Upload a new health record
 * @route   POST /api/health-records
 * @access  Private
 */
const uploadHealthRecord = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  const { title, description, recordType, recordDate, doctor, tags } = req.body;

  // Determine file type
  let fileType = 'document';
  if (req.file.mimetype === 'application/pdf') {
    fileType = 'pdf';
  } else if (req.file.mimetype.startsWith('image/')) {
    fileType = 'image';
  }

  // Create health record
  const healthRecord = await HealthRecord.create({
    user: req.user._id,
    title,
    description,
    recordType,
    fileUrl: req.file.path,
    fileType,
    fileSize: req.file.size,
    publicId: req.file.filename,
    recordDate: new Date(recordDate),
    doctor: doctor ? JSON.parse(doctor) : undefined,
    tags: tags ? JSON.parse(tags) : [],
  });

  res.status(201).json({
    success: true,
    data: healthRecord,
    message: 'Health record uploaded successfully',
  });
});

/**
 * @desc    Get all health records for logged-in user
 * @route   GET /api/health-records
 * @access  Private
 */
const getHealthRecords = asyncHandler(async (req, res) => {
  const { recordType, search, page = 1, limit = 10 } = req.query;

  // Build query
  let query = { user: req.user._id, isActive: true };

  if (recordType && recordType !== 'All') {
    query.recordType = recordType;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const healthRecords = await HealthRecord.find(query)
    .sort({ recordDate: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await HealthRecord.countDocuments(query);

  res.json({
    success: true,
    data: healthRecords,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * @desc    Get single health record by ID
 * @route   GET /api/health-records/:id
 * @access  Private
 */
const getHealthRecordById = asyncHandler(async (req, res) => {
  const healthRecord = await HealthRecord.findById(req.params.id);

  if (!healthRecord || !healthRecord.isActive) {
    res.status(404);
    throw new Error('Health record not found');
  }

  // Check if user owns this record
  if (
    healthRecord.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to access this record');
  }

  res.json({
    success: true,
    data: healthRecord,
  });
});

/**
 * @desc    Update health record
 * @route   PUT /api/health-records/:id
 * @access  Private
 */
const updateHealthRecord = asyncHandler(async (req, res) => {
  const healthRecord = await HealthRecord.findById(req.params.id);

  if (!healthRecord || !healthRecord.isActive) {
    res.status(404);
    throw new Error('Health record not found');
  }

  // Check authorization
  if (
    healthRecord.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to update this record');
  }

  // Update allowed fields
  const allowedUpdates = ['title', 'description', 'recordType', 'recordDate', 'doctor', 'tags'];
  
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      healthRecord[field] = req.body[field];
    }
  });

  await healthRecord.save();

  res.json({
    success: true,
    data: healthRecord,
    message: 'Health record updated successfully',
  });
});

/**
 * @desc    Delete health record (soft delete)
 * @route   DELETE /api/health-records/:id
 * @access  Private
 */
const deleteHealthRecord = asyncHandler(async (req, res) => {
  const healthRecord = await HealthRecord.findById(req.params.id);

  if (!healthRecord) {
    res.status(404);
    throw new Error('Health record not found');
  }

  // Check authorization
  if (
    healthRecord.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this record');
  }

  // Soft delete
  healthRecord.isActive = false;
  await healthRecord.save();

  // Optionally, delete file from Cloudinary
  // await deleteFile(healthRecord.publicId);

  res.json({
    success: true,
    message: 'Health record deleted successfully',
  });
});

/**
 * @desc    Get health records statistics
 * @route   GET /api/health-records/stats
 * @access  Private
 */
const getHealthRecordStats = asyncHandler(async (req, res) => {
  const stats = await HealthRecord.aggregate([
    {
      $match: {
        user: req.user._id,
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$recordType',
        count: { $sum: 1 },
      },
    },
  ]);

  const total = await HealthRecord.countDocuments({
    user: req.user._id,
    isActive: true,
  });

  res.json({
    success: true,
    data: {
      total,
      byType: stats,
    },
  });
});

module.exports = {
  uploadHealthRecord,
  getHealthRecords,
  getHealthRecordById,
  updateHealthRecord,
  deleteHealthRecord,
  getHealthRecordStats,
};