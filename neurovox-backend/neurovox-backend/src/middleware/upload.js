const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
['uploads', 'uploads/profiles', 'uploads/reports', 'uploads/attachments', 'uploads/resources'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = 'uploads/attachments';
    if (file.fieldname === 'profileImage') dest = 'uploads/profiles';
    else if (file.fieldname === 'report') dest = 'uploads/reports';
    else if (file.fieldname === 'resource') dest = 'uploads/resources';
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf|mp4|webm|mp3|wav|doc|docx/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype);
  if (extname || mimetype) cb(null, true);
  else cb(new Error('File type not supported'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;
