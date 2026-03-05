import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/private', requireAuth, (req, res) => {
    res.json({ message: `Hello ${req.user.username}, you are authenticated!` });
});

export default router;