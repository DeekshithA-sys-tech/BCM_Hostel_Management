const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
];

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            // put uploads in uploads/<userId> when available, else in uploads/misc
            const userId = req.user?._id || 'misc';
            const dest = path.join(uploadDir, String(userId));
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
            cb(null, dest);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const safeName = `${Date.now()}-${Math.round(Math.random()*1e9)}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g,'')}`;
        cb(null, safeName);
    }
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, `File type ${file.mimetype} not allowed. Allowed: JPEG, PNG, WebP, PDF`), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter
});

module.exports = { upload };
