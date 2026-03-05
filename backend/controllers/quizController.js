import Quiz from '../models/quizModel.js';
import Question from '../models/questionModel.js';

// Get all quizzes for the logged-in researcher
export const getMyQuizzes = async (req, res) => {
    const quizzes = await Quiz.find({ owner:req.user._id }).populate('questions');
    res.json(quizzes);
};

// Create a new quiz
export const createQuiz = async (req, res) => {
    const { title, description } = req.body;
    const quiz = await Quiz.create({
        title,
        description,
        owner: req.user._id
    });
    res.status(201).json(quiz);
};

// Get one quiz (only if owned)
export const getQuiz = async (req, res) => {
    const quiz = await Quiz.findById(req.params.id).populate('questions');
    if (!quiz || !quiz.owner.equals(req.user._id)) {
        return res.status(403).json({ message: 'Access denied '});
    }
    res.json(quiz);
};

// Update quiz
export const updateQuiz = async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || !quiz.owner.equals(req.user._id)) {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, status } = req.body;
    if (title) quiz.title = title;
    if (description) quiz.description = description;
    if (status) quiz.status = status;

    await quiz.save();
    res.json(quiz);
};

// Delete quiz
export const deleteQuiz = async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || !quiz.owner.equals(req.user._id)) {
        return res.status(403).json({ message: 'Access denied' });
    }
    await quiz.deleteOne();
    res.json({ message: 'Quiz deleted' });
};