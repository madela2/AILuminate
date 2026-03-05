import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'video', 'audio'],
        default: 'text'
    },
    content: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        validate: {
            validator: (arr) => arr.length >= 2,
            message: 'At least two answer options are required.'
        }
    },
    correctIndex: {
        type: Number,
        required: true
    },
    explanation: {
        type: String
    },
    mediaUrls: {
        type: [String],
        default: []
    },
    optionMedia: {
        type: Map,
        of: [String],
        default: () => new Map()
    },
    order: {
        type: Number
    }
}, {timestamps: true });

const Question = mongoose.model('Question', questionSchema);
export default Question;