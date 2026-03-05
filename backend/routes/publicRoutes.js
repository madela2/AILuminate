import express from 'express';
import { getAccountById, getAccounts, startPublicQuizSession, getPublishedQuizzes, getQuizById, submitQuizAttempt, submitDemographics, getQuizAttempt, sendEmailResults } from '../controllers/publicController.js';

const router = express.Router();

// Public routes
router.get('/quizzes', getPublishedQuizzes);
router.get('/quizzes/:id', getQuizById);
router.post('/quizzes/:id/start', startPublicQuizSession);
router.post('/quizzes/:id/submit', submitQuizAttempt);
router.post('/demographics', submitDemographics);
router.get('/quizzes/attempts/:id', getQuizAttempt)
router.post('/email-results', sendEmailResults);
router.get('/accounts', getAccounts);
router.get('/account/:id', getAccountById);

export default router;