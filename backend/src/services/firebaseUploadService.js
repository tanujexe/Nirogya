const admin = require('firebase-admin');
const crypto = require('crypto');

// Note: You need to initialize firebase-admin in your app.js or server.js
// using your serviceAccountKey.json:
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: 'your-app.appspot.com'
// });

/**
 * Uploads a file buffer to Firebase Storage
 */
const uploadToFirebase = async (fileBuffer, mimetype, originalname) => {
  try {
    const bucket = admin.storage().bucket();
    const extension = originalname.split('.').pop();
    const filename = `medical-vault/${crypto.randomUUID()}.${extension}`;
    const file = bucket.file(filename);

    await file.save(fileBuffer, {
      metadata: {
        contentType: mimetype,
      },
    });

    // Make the file publicly accessible or use signed URLs
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    return {
      fileUrl: publicUrl,
      filePath: filename,
    };
  } catch (error) {
    console.error('Firebase upload error:', error);
    throw new Error('Failed to upload file to Firebase');
  }
};

/**
 * Deletes a file from Firebase Storage
 */
const deleteFromFirebase = async (filePath) => {
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    await file.delete();
    return true;
  } catch (error) {
    console.error('Firebase delete error:', error);
    // Don't throw if file not found, maybe already deleted
    return false;
  }
};

module.exports = {
  uploadToFirebase,
  deleteFromFirebase
};
