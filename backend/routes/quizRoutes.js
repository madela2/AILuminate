import express from 'express';
import { getMyQuizzes, createQuiz, getQuiz, updateQuiz, deleteQuiz } from '../controllers/quizController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth, requireRole('researcher'));

router.get('/', getMyQuizzes);
router.post('/', createQuiz);
router.get('/:id', getQuiz);
router.put('/:id', updateQuiz);
router.patch('/:id', updateQuiz);
router.delete('/:id', deleteQuiz);

export default router;