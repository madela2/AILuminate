import Quiz from '../models/quizModel.js';
import Question from '../models/questionModel.js';
import QuizAttempt from '../models/quizAttemptModel.js';
import Visitor from '../models/non-authenticatedModel.js';
import AuthenticatedUser from '../models/authenticatedModel.js';
import Session from '../models/sessionModel.js';
import { sendQuizResults } from '../utils/emailService.js';

// Get all user accounts (for the researcher list)
export const getAccounts = async (req, res) => {
    try {
        // Add banned field explicitly to the selection
        const accounts = await AuthenticatedUser.find({ role: 'researcher' })
            .select('username email role createdAt banned');

        if (!accounts || accounts.length === 0) {
            return res.status(404).json({ message: 'No accounts found' });
        }
        
        console.log('Returning accounts with banned status:', accounts.map(a => ({
            username: a.username,
            banned: a.banned
        })));
        
        res.json(accounts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get users accounts by id
export const getAccountById = async (req, res) =>{
    try{
        const account = await AuthenticatedUser.findById(req.params.id);
        if(!account) return res.status(404).json({ message: 'Account not found'});
        res.status(200).json(account);
    }catch (err){
        res.status(500).json({ error: err.message });
    }
};

// Get all published quizzes (for landing page - top quizzes)
export const getPublishedQuizzes = async (req, res) => {
    try {
        // Get published quizzes and sort by most answered first
        const quizzes = await Quiz.find({ status: 'published' })
            .populate({
                path: 'owner',
                select: 'username'
            })
            .lean();
        
        // For each quiz, add the count of attempts
        const quizzesWithAttemptCount = await Promise.all(
            quizzes.map(async (quiz) => {
                const attemptCount = await QuizAttempt.countDocuments({ quiz: quiz._id });
                return {
                    ...quiz,
                    attemptCount
                };
            })
        );

        // Sort by attempt count in descending order
        quizzesWithAttemptCount.sort((a, b) => b.attemptCount - a.attemptCount);

        res.json(quizzesWithAttemptCount);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get a specific published quiz with its questions
export const getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({
            _id: req.params.id,
            status: 'published'
        }).populate('questions');

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found or not published' });
        }

        res.json(quiz);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Start a public quiz on the landing page
export const startPublicQuizSession = async (req, res) => {
    const quizId = req.params.id;
    const deviceType = req.body.deviceType || 'Unknown';
    const visitorId = req.body.visitorId;

    try {
        const quiz = await Quiz.findOne({ _id: quizId, status: 'published' })
        .populate('questions');

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found or not published' });
        }

        if (!quiz.questions || quiz.questions.length === 0) {
            return res.status(400).json({ error: 'This quiz has no questions' });
        }

        const session = new Session({
            quiz: quizId,
            startedAt: new Date(),
            deviceType,
            isPublic: true,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            visitorId: req.body.visitorId
        });

        await session.save();

        res.status(201).json({
            sessionId: session._id,
            firstQuestionId: quiz.questions?.[0]?._id
        });

    } catch (err) {
        console.error('Error starting public quiz:', err);
        res.status(500).json({ error: 'Server error' });
    }
};


// Submit quiz answers
export const submitQuizAttempt = async (req, res) => {
    try {
        const { answers } = req.body;
        const quizId = req.params.id;
        const visitorId = req.body.visitorId;

        // Validate that the quiz exists and published
        const quiz = await Quiz.findOne({ _id: quizId, status: 'published' });
        if (!quiz) {
            return res.status(404).json({ message: ' Quiz not found or not published' });
        }

        await Session.findOneAndUpdate(
            {
                quiz: quizId,
                visitorId: visitorId,
                completed: false
            },
            { completed: true }
        );

        // Calculate score
        let score = 0;
        const answersWithCorrectness = [];

        for (const answer of answers) {
            const question = await Question.findById(answer.questionId);
            if (question) {
                const isCorrect = question.correctIndex === answer.selectedOption;
                if (isCorrect) score++;

                answersWithCorrectness.push({
                    question: question._id,
                    selectedOption: answer.selectedOption,
                    isCorrect
                });
            }
        }

        // Create quiz attempt record (without demographics)
        const quizAttempt = await QuizAttempt.create({
            quiz: quizId,
            answers: answersWithCorrectness,
            score,
            completed: true,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            visitorId
        });

        // Track visitor without authentication
        const visitor = await Session.create({
            quiz: quizId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json({
            score,
            totalQuestions: answers.length,
            attemptId: quizAttempt._id,
            visitorId: visitor._id
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Submit demographics after completing a quiz
export const submitDemographics = async (req, res) => {
    try {
        const { attemptId, visitorId, email, ageGroup, gender, aiExperience } = req.body;

        const quizAttempt = await QuizAttempt.findById(attemptId);
        if (!quizAttempt) {
            return res.status(404).json({ message: 'Quiz attempt not found' });
        }

        // Update with demographics
        quizAttempt.userEmail = email;
        quizAttempt.demographics = { ageGroup, gender, aiExperience };
        await quizAttempt.save();

        if(visitorId) {
            const visitor = await Session.findById(visitorId);
            if (visitor) {
                visitor.email = email;
                visitor.demographics = { ageGroup, gender, aiExperience };
                await visitor.save();
            }
        }

        res.json({ message: 'Demographics saved successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Send quiz results via email
export const sendEmailResults = async (req, res) => {
    try {
        const { attemptId } = req.body;

        const quizAttempt = await QuizAttempt.findById(attemptId)
        .populate({
            path: 'quiz',
            select: 'title'
        })
        .populate({
            path: 'answers.question',
            select: 'explanation'
        });
    if (!quizAttempt || !quizAttempt.userEmail) {
        return res.status(400).json({ message: 'Quiz attempt not found or email not provided' });
    }

    // Generate feedback based on answers
    const feedback = quizAttempt.answers.map((answer, index) => {
        return `
        <p><strong>Question ${index + 1}</strong></p>
        <p>${answer.isCorrect ? '✓ Correct!' : '✗ Incorrect'}</p>
        <p>Explanation: ${answer.question?.explanation || 'No explanation provided'}</p>
        `;
    }).join('<hr>');

    // Send email
    await sendQuizResults(
        quizAttempt.userEmail,
        quizAttempt.quiz.title,
        quizAttempt.score,
        quizAttempt.answers.length,
        feedback
    );

    res.json({ message: 'Results sent to your email' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getQuizAttempt = async (req, res) => {
    try {
        const attemptId = req.params.id;

        const quizAttempt = await QuizAttempt.findById(attemptId)
            .populate({
                path: 'quiz',
                select: 'title description'
            })
            .populate({
                path: 'answers.question',
                select: 'content options correctIndex explanation'
            });
        if (!quizAttempt) {
            return res.status(404).json({ message: 'Quiz attempt not found' });
        }

        // Calculate percentage score
        const percentage = Math.round((quizAttempt.score / quizAttempt.answers.length) * 100);

        // Format the feedback for each answer
        const feedback = quizAttempt.answers.map(answer => {
            return {
                question: answer.question.content,
                correct: answer.isCorrect,
                selectedOption: answer.selectedOption,
                correctOption: answer.question.correctIndex,
                explanation: answer.question.explanation || 'No explanation provided'
            };
        });

        // Return formatted result
        res.json({
            quizTitle: quizAttempt.quiz.title,
            quizDescription: quizAttempt.quiz.description,
            score: quizAttempt.score,
            totalQuestions: quizAttempt.answers.length,
            percentage: percentage,
            feedback: feedback,
            demographics: quizAttempt.demographics || null,
            completed: quizAttempt.completed
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};