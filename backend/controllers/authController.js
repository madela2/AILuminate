import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import util from 'util';
import AuthenticatedUser from '../models/authenticatedModel.js';
import crypto from 'crypto';
import { config } from '../config/env.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendSupportMessageEmail } from '../utils/emailService.js';

// Load from .env
const JWT_SECRET = config.JWT_SECRET;
const JWT_REFRESH_SECRET = config.JWT_REFRESH_SECRET;

const verifyAsync = util.promisify(jwt.verify);

// Utility to create tokens
const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: '15m' }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user._id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
};

// Register
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await AuthenticatedUser.findOne({ email });
        
        if (existingUser) {
            if (!existingUser.isVerified) {
                // Generate new verification token
                const verificationToken = crypto.randomBytes(32).toString('hex');
                const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

                // Update the existing user
                existingUser.username = username;
                existingUser.password = await bcrypt.hash(password, 10);
                existingUser.verificationToken = verificationToken;
                existingUser.tokenExpiry = tokenExpiry;
                await existingUser.save();

                // Send verification email
                await sendVerificationEmail(email, username, verificationToken);

                return res.status(201).json({
                    message: 'User information updated. Check your email to verify your account.'
                });
            } else {
                // User exists and is already verified
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Create new user if email doesn't exist
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        const user = await AuthenticatedUser.create({
            username,
            email,
            password: hashedPassword,
            verificationToken,
            tokenExpiry,
            role: 'researcher'
        });

        // Send verification email
        await sendVerificationEmail(email, username, verificationToken);

        res.status(201).json({ message: 'User created. Check your email to verify your account.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Login
export const login = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        let user;
        if (email) {
            user = await AuthenticatedUser.findOne({ email }).select('+password');
        } else if (username) {
            user = await AuthenticatedUser.findOne({ username }).select('+password');
        } else {
            return res.status(400).json({ message: 'Please provide username or email' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.banned) {
            console.log(`Login attempt by banned user: ${user.username}`);
            return res.status(403).json({ message: 'Your account has been banned. Please contact support.' });
        }

        if (!await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email first.' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'Lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24  // 1 day, but will be cleared on browser close
        });

        // Set a non-HTTP-only flag cookie that gets checked on page load
        res.cookie('sessionValid', 'true', {
            httpOnly: false,
            sameSite: 'Lax',
            secure: process.env.NODE_ENV === 'production'
            // No maxAge - this becomes a session cookie
        });

        // Set access token as HttpOnly cookie
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            sameSite: 'Lax',
            secure: process.env.NODE_ENV === 'production',
            expires: undefined,
            path: '/'
        });

        res.json({ username: user.username, role: user.role, _id: user._id });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Refresh
export const refresh = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) return res.status(401).json({ message: 'Missing refresh token' });

        jwt.verify(token, JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Invalid refresh token' });

            const user = await AuthenticatedUser.findById(decoded.userId);
            if (!user) return res.status(404).json({ message: 'User not found' });

            const accessToken = generateAccessToken(user);

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                sameSite: 'Lax',
                secure: process.env.NODE_ENV === 'production',
                expires: undefined,
                path: '/'
            });

            res.json({ 
                username: user.username,
                role: user.role,
                _id: user._id
            });
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Logout
export const logout = (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        sameSite: 'Strict',
        secure: process.env.NODE_ENV === 'production'
    });
    res.clearCookie('accessToken', {
        httpOnly: true,
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production'
    });
    res.json({ message: 'Logged out successfully' });
};

// Verify Email
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await AuthenticatedUser.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification link.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified.' });
        }

        if (user.tokenExpiry < new Date()) {
            return res.status(400).json({ message: 'Verification link expired. Please register again.' });
        }

        user.isVerified = true;
        user.verificationToken = null;
        user.tokenExpiry = null;
        await user.save();

        res.json({ message: 'Email successfully verified. You can now log in.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Support Email
export const supportEmail = async (req, res) =>{
    const { name, email, subject, message } = req.body;

    if(!name || !email || !subject || !message){
        return res.status(400).json({ error: 'All fields are required'});
    }

    try{
        await sendSupportMessageEmail(name, email, subject, message);
        res.status(200).json({ message: 'Support message successfully sent' });
    }catch (err){
        console.error('Error sending support message:', err);
        res.status(500).json({ error: 'Failed to send message...'});
    }
};


// Forgot password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await AuthenticatedUser.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();
        
        // Send password reset email
        await sendPasswordResetEmail(user.email, user.username, resetToken);
        
        res.json({ message: 'Password reset instructions sent to your email' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Reset password
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        
        const user = await AuthenticatedUser.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        
        res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};