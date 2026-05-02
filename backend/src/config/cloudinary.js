const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const env = require('./env');

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Storage for health records
const healthRecordStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nirogyasathi/health-records',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
  },
});

// Storage for lab reports
const labReportStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nirogyasathi/lab-reports',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
  },
});

// Storage for doctor profile images
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nirogyasathi/doctors',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

// Upload instances
const uploadHealthRecord = multer({ storage: healthRecordStorage });
const uploadLabReport = multer({ storage: labReportStorage });
const uploadProfileImage = multer({ storage: profileImageStorage });

const deleteFile = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
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
