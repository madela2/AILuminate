import jwt from 'jsonwebtoken';
import AuthenticatedUser from '../models/authenticatedModel.js';
import { config } from '../config/env.js';

const JWT_SECRET = config.JWT_SECRET;

// Require authentication
export const requireAuth = async (req, res, next) => {
    const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unatuhorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await AuthenticatedUser.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
    }
};

// Require specific role(s)
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient role' });
        }
        next();
    };
};