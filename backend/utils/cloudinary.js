const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Cloudinary storage for health records
 */
const healthRecordStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nirogyasathi/health-records',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
  },
});

/**
 * Cloudinary storage for lab reports
 */
const labReportStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nirogyasathi/lab-reports',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
  },
});

/**
 * Cloudinary storage for doctor profile images
 */
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nirogyasathi/doctors',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

// Multer file filter for images and PDFs
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpg, .jpeg, .png, and .pdf files are allowed!'), false);
  }
};

// Multer upload instances
const uploadHealthRecord = multer({
  storage: healthRecordStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const uploadLabReport = multer({
  storage: labReportStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/png'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpg, .jpeg, and .png files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for profile images
  },
});

/**
 * Delete file from Cloudinary
 */
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error('Error deleting file from Cloudinary');
  }
};

module.exports = {
  cloudinary,
  uploadHealthRecord,
  uploadLabReport,
  uploadProfileImage,
  deleteFile,
};