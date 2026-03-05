import mongoose from 'mongoose';
import validator from 'validator';

const quizAttemptSchema = new mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    answers: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        },
        selectedOption: Number,
        isCorrect: Boolean
    }],
    score: {
        type: Number,
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    userEmail: {
        type: String,
        validate: {
            validator: function(email) {
                return email ? validator.isEmail(email) : true; // Optional but must be valid if provided
            },
            message: 'Invalid email address'
        }
    },
    demographics: {
        ageGroup: String,
        gender: String,
        aiExperience: String
    },
    ipAddress: String,
    userAgent: String
}, { timestamps: true });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;