import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/audit-logs
// @desc    Retrieve system audit logs with pagination and filters
// @access  Private (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { module, userEmail, action, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};

    // Filter by module
    if (module && module !== 'all') {
      query.module = module;
    }

    // Filter by user email (case-insensitive partial match)
    if (userEmail) {
      query.userEmail = { $regex: userEmail, $options: 'i' };
    }

    // Filter by action (case-insensitive partial match)
    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const totalLogs = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    res.json({
      logs,
      totalLogs,
      totalPages: Math.ceil(totalLogs / limitNumber),
      currentPage: pageNumber
    });
  } catch (err) {
    console.error('Fetch audit logs error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
