import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { JWT_SECRET } from '../utils/jwtSecret.js';

dotenv.config();

export async function authenticate(req, res, next) {
  try {
    let token = null;

    // Extract from Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // Fallback: Extract from token query parameter
    else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found or token invalid' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'This user account is inactive' });
    }

    // Only one active session per account: a token whose sid doesn't match
    // the account's current session was superseded by a later login
    // elsewhere, so it's rejected here.
    if (decoded.sid && user.activeSessionId && decoded.sid !== user.activeSessionId) {
      return res.status(401).json({ message: 'This account was signed in from another device. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated request' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource` 
      });
    }
    
    next();
  };
}
