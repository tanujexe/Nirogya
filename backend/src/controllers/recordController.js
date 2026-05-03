const asyncHandler = require('../utils/asyncHandler');
const MedicalRecord = require('../models/MedicalRecord');
const cloudinary = require('../config/cloudinary');

const uploadRecord = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  const { title, category, hospitalName, reportDate, notes } = req.body;

  const record = await MedicalRecord.create({
    userId: req.user.id,
    title: title || 'Untitled',
    category: category || 'Other',
    hospitalName,
    reportDate,
    notes,
    fileUrl: req.file.path,
    cloudinaryId: req.file.filename // Assuming multer-storage-cloudinary or similar is used
  });

  res.status(201).json({ success: true, data: record });
});

const getMyRecords = asyncHandler(async (req, res) => {
  const records = await MedicalRecord.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: records });
});

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

  const updatedRecord = await MedicalRecord.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({ success: true, data: updatedRecord });
});

const deleteRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error('Record not found');
  }
  if (record.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this record');
  }
  
  // Optionally delete from Cloudinary here if needed
  // await cloudinary.uploader.destroy(record.cloudinaryId);

  await record.deleteOne();
  res.json({ success: true, message: 'Record deleted' });
});

module.exports = { uploadRecord, getMyRecords, updateRecord, deleteRecord };
