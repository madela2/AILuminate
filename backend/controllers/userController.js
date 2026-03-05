import AuthenticatedUser from '../models/authenticatedModel.js';
import Visitor from '../models/non-authenticatedModel.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail, sendResearcherApprovalEmail } from '../utils/emailService.js';

// Visitor requests researcher role and delete researcher
export const requestResearcherOrDeletion = async (req, res) => {
    try {
        const { username, email, password, action } = req.body;

        // Validate data
        if (!username || !email || !password || !action) {
            return res.status(400).json({ message: 'Please provide username, email and password' });
        }

        if (!['researcher', 'delete'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action. Must be "researcher" or "delete"' });
        }

        if (action === 'researcher') {
            if (!username || !password) {
                return res.status(400).json({ message: 'Please provide username and password' });
            }

            // Check if email is already used
            const existingResearcher = await AuthenticatedUser.findOne({ email });
            if (existingResearcher) {
                return res.status(400).json({ message: 'Email already in use' });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create verification token (valid for 15 minutes)
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            // Create or update visitor record with researcher request
            const visitor = await Visitor.findOneAndUpdate(
                {
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                },
                {
                    email: email,
                    researcherRequest: {
                        username,
                        email,
                        password: hashedPassword,
                        requested: true,
                        requestDate: new Date(),
                        verificationToken,
                        tokenExpiry,
                        verified: false
                    }
                },
                { upsert: true, new: true }
            );

            // Send verification email
            await sendVerificationEmail(email, username, verificationToken);

            return res.status(201).json({
                message: 'Verification email sent. Please verify your email within 15 minutes to complete your researcher request.'
            });
        }

        if (action === 'delete') {
            const deletionToken = crypto.randomBytes(32).toString('hex');
            const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            const visitor = await Visitor.findOneAndUpdate(
                {
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                },
                {
                    email,
                    deletionRequest: {
                        requested: true,
                        requestDate: new Date(),
                        deletionToken,
                        tokenExpiry,
                        confirmed: false
                    }
                },
                { upsert: true, new: true }
            );

            await sendDeletionConfirmationEmail(email, deletionToken);

            return res.status(201).json({
                message: 'Account deletion request received. Please confirm via the email sent to you within 15 minutes.'
            });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const verifyResearcherRequest = async (req, res) => {
    try {
        const { token } = req.params;

        // Find visitor with this verification token
        const visitor = await Visitor.findOne({
            'researcherRequest.verificationToken': token,
            'researcherRequest.tokenExpiry': { $gt: new Date() }
        });

        if (!visitor) {
            return res.status(400).json({
                message: 'Invalid or expired verification token. Please submit a new request.'
            });
        }

        // Mark the request as verified
        visitor.researcherRequest.verified = true;
        visitor.researcherRequest.verificationToken = undefined;
        visitor.researcherRequest.tokenExpiry = undefined;
        await visitor.save();

        res.json({
            message: 'Email verified successfully. Your request will be reviewed by an administrator.'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: Get list of researcher requests
export const getResearcherRequests = async (req, res) => {
    const requests = await Visitor.find({
         'researcherRequest.requested': true,
         'researcherRequest.verified': true 
    });

    res.json(requests);
};

// Admin: Approve researcher request
export const approveResearcher = async (req, res) => {
    console.log('🚀 approveResearcher controller triggered');
    try {
        const visitorId = req.params.id;
        const visitor = await Visitor.findById(visitorId);
         console.log('Session lookup result:', visitor);

        if (!visitor || !visitor.researcherRequest || !visitor.researcherRequest.requested) {
            console.log('❌ Visitor missing researcherRequest or not requested');
            return res.status(404).json({ message: 'Reseacher request not found' });
        }

        // Create authenticated user from visitor's request data
        const { username, email, password } = visitor.researcherRequest;

        // Check if email is already in use
        const existingUser = await AuthenticatedUser.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use by another user' });
        }

        // Create the new authenticated user
        const newUser = await AuthenticatedUser.create({
            username,
            email,
            password,
            role: 'researcher',
            isVerified: true,
        });

        // Mark the request as processed
        visitor.researcherRequest.requested = false;
        await visitor.save();

        // Send approval email to the new researcher
        await sendResearcherApprovalEmail(email, username);

        res.json({ message: `${username} is now a researcher. Approval notification email sent.` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: Ban or unban a user
export const setBanStatus = async (req, res) => {
    try {
        const { banned } = req.body;
        const userId = req.params.id;
        
        console.log(`Setting banned status for user ID ${userId} to ${banned}`);
        
        const user = await AuthenticatedUser.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Convert to boolean explicitly
        user.banned = Boolean(banned);
        await user.save();
        
        console.log(`Updated user ${user.username}, banned status is now ${user.banned}`);
        
        res.json({ 
            message: `User ${user.username} is now ${banned ? 'banned' : 'unbanned'}`,
            user: {
                id: user._id,
                username: user.username,
                banned: user.banned
            }
        });
    } catch (err) {
        console.error('Error updating ban status:', err);
        res.status(500).json({ message: 'Failed to update user status' });
    }
};

// Admin: Search for user
export const userSearch = async (req, res) =>{
    try{
        const { query } = req.query;

        if(!query || typeof query !== 'string'){
            return res.status(400).json({ error: 'Query param is required' });
        }

        const searchRegex = new RegExp(query, 'i');

        const users = await AuthenticatedUser.find({
            $or: [

                { username: { $regex: searchRegex } },
                { email: { $regex: searchRegex} }
            ]
        }).select('_id username email');

        return res.json(users);
    }catch (err){
        return res.status(500).json({ error: 'Internal server error' });
    }
};