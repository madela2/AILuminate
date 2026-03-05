import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AuthenticatedUser',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'unavailable'],
        default: 'draft'
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
});

quizSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;