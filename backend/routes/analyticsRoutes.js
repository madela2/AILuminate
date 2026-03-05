import express from 'express';
import { getQuizStats, getPlatformStats, getRequestAnalytics } from '../controllers/analyticsController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Researcher analytics - restricted to owner of the quiz
router.get('/quiz/:id/stats', requireAuth, requireRole('researcher'), getQuizStats);

// Admin analytics
router.get('/analytics', requireAuth, requireRole('admin'), getPlatformStats);
router.get('/requests-analytics', requireAuth, requireRole('admin'), getRequestAnalytics);

export default router;