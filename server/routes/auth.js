import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { logAction } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_drive_sync_token_key_1298471';

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if active
      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create JWT
      const payload = {
        id: user._id,
        role: user.role
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

      // Write to audit log
      await logAction({
        req,
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'user_login',
        module: 'auth',
        details: `Successful login for user email ${user.email} (${user.role})`
      });

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user details
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    // req.user is set by authenticate middleware
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isActive: req.user.isActive
    });
  } catch (err) {
    console.error('Fetch me error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
