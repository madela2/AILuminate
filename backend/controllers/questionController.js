import Quiz from '../models/quizModel.js';
import Question from '../models/questionModel.js';

// Add question to a quiz
export const addQuestion = async (req, res) => {
    const { quizId, type, content, options, correctIndex, explanation, order } = req.body;

    const quiz = await Quiz.findById(quizId);
    if(!quiz || !quiz.owner.equals(req.user._id)) {
        return res.status(403).json({ message: 'Access denied' });
    }

    const question = await Question.create({
        quiz: quizId, type, content, options, correctIndex, explanation, order
    });

    quiz.questions.push(question._id);
    await quiz.save();

    res.status(201).json(question);
};

// Edit question
export const updateQuestion = async (req, res) => {
    const question = await Question.findById(req.params.id).populate('quiz');
    if (!question || !question.quiz.owner.equals(req.user._id)) {
        return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(question, req.body);
    await question.save();
    res.json(question);
};

// Get all questions for quiz with id..
export const getQuestionsByQuizId = async (req, res) =>{
    const { quizId } = req.query;

    if(!quizId){
        return res.status(400).json({ message: 'quizId query parameter is required'});
    }

    try{
        const questions = await Question.find({ quiz: quizId });
        res.json(questions);
    }catch (err){
        res.status(500).json({ message: 'Failed to fetch questions', error: err.message });
    }
};

// Delete question
export const deleteQuestion = async (req, res) => {
    const question = await Question.findById(req.params.id).populate('quiz');
    if (!question || !question.quiz.owner.equals(req.user._id)) {
        return res.status(403).json({ message: 'Access denied' });
    }

    await question.deleteOne();
    res.json({ message: 'Question deleted' });
};