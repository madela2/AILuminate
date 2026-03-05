import express from 'express';
import { requestResearcherOrDeletion, verifyResearcherRequest, getResearcherRequests, approveResearcher, setBanStatus, userSearch } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Visitor requests researcher role
router.post('/request-researcher', requestResearcherOrDeletion);
router.get('/verify-researcher-request/:token', verifyResearcherRequest);

// Admin actions
router.get('/researcher-requests', requireAuth, requireRole('admin'), getResearcherRequests);
router.post('/approve-researcher/:id', requireAuth, requireRole('admin'), approveResearcher);
router.patch('/ban/:id', requireAuth, requireRole('admin'), setBanStatus);
router.get('/search', requireAuth, requireRole('admin'), userSearch);

export default router;