import mongoose from 'mongoose';
import validator from 'validator';

const nonAuthenticatedSchema = new mongoose.Schema({
    email: {
        type: String,
        sparse: true,
        validate: {
            validator: function(email) {
                return email ? validator.isEmail(email) : true;
            },
            message: 'invalid email address'
        }
    },
    demographics: {
        ageGroup: String,
        gender: String,
        aiExperience: String
    },
    ipAddress: String,
    userAgent: String,
    // For users who want to become researchers
    researcherRequest: {
        username: String,
        email: String,
        password: String,
        requested: {
            type: Boolean,
            default: false
        },
        requestDate: Date,
        verificationToken: String,
        tokenExpiry: Date,
        verified: {
            type: Boolean,
            default: false
        }
    }
}, { timestamps: true });

const Visitor = mongoose.model('Visitor', nonAuthenticatedSchema);
export default Visitor;