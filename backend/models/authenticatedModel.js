import mongoose from 'mongoose';
import validator from 'validator';

const authenticatedSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        validate: [validator.isEmail, 'Invalid email address']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'researcher'],
        default: 'researcher'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    banned: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    tokenExpiry: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
}, { timestamps: true });

const AuthenticatedUser = mongoose.model('AuthenticatedUser', authenticatedSchema);
export default AuthenticatedUser;