import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    deviceType: {
        type: String,
        default: 'Unknown'
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    currentQuestionIndex: {
        type: Number,
        default: 0
    },
    ipAddress: String,
    userAgent: String,
    visitorId: String
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);
export default Session;