import express from 'express';
import { addQuestion, updateQuestion, getQuestionsByQuizId, deleteQuestion } from '../controllers/questionController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth, requireRole('researcher'));

router.post('/', addQuestion);
router.get('/', getQuestionsByQuizId);
router.put('/:id', updateQuestion);
router.patch('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

export default router;