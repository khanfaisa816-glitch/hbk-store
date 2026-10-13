const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { AppError } = require('../utils/errors');

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// File extension comes from the checked mime type, never from the user's file name.
const EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, crypto.randomBytes(12).toString('hex') + EXT[file.mimetype]),
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    EXT[file.mimetype]
      ? cb(null, true)
      : cb(new AppError(400, 'Only JPG, PNG, WEBP or GIF images are allowed')),
});

// Deletes a file we stored earlier (url looks like "/uploads/abc.jpg").
function removeUpload(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  fs.promises.unlink(path.join(uploadDir, path.basename(url))).catch(() => {});
}

module.exports = { upload, removeUpload, uploadDir };
