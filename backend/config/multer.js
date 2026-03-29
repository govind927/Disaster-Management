const multer = require('multer');

// Use memory storage — file stored in buffer, then uploaded to Cloudinary manually
const storage = multer.memoryStorage();

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    allowed.test(file.mimetype) ? cb(null, true) : cb(new Error('Only images allowed'));
  },
});