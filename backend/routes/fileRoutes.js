import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadFile, getMyFiles, deleteFile } from '../controllers/fileController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure upload middleware
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Validate file types
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mp3', 'audio/mpeg', 'video/mp4', 'text/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed types: jpeg, png, mp3, mp4, gif'), false);
        }
    }
});

// Apply authentication middleware to all routes
router.use(requireAuth, requireRole('researcher'));

// File routes
router.post('/upload', upload.single('file'), uploadFile);
router.get('/', getMyFiles);
router.delete('/:id', deleteFile);

export default router;