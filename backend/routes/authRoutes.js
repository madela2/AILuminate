import express from 'express';
import { register, login, refresh, logout, verifyEmail, supportEmail, forgotPassword, resetPassword } from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import AuthenticatedUser from '../models/authenticatedModel.js';
import mongoose from 'mongoose';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/verify/:token', verifyEmail);
router.post('/support', supportEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/admin/dashboard',
    requireAuth,
    requireRole('admin'),
    (req, res) => {
        res.json({ message: 'Welcome to the admin dashboard.' });
    }
);

router.get('/profile', requireAuth, async (req, res) => {
    try {
        // Add error validation for the user ID
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'User ID not found in request' });
        }

        // Validate that the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        const user = await AuthenticatedUser.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (err) {
        console.error('Profile route error:', err);
        res.status(500).json({ message: err.message });
    }
});
export default router;