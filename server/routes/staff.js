import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Expenditure from '../models/Expenditure.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAction } from '../utils/logger.js';
import { formatNepaliDate } from '../utils/nepaliDate.js';
import { isWithinSupportedDateRange } from '../utils/dateRange.js';

const router = express.Router();

// @route   GET /api/staff
// @desc    Get all staff members
// @access  Private (admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const staff = await User.find().sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    console.error('Fetch staff error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/staff/active-list
// @desc    Get non-sensitive information of active staff members
// @access  Private (all authenticated users)
router.get('/active-list', authenticate, async (req, res) => {
  try {
    const staff = await User.find({ isActive: true })
      .select('name role isActive')
      .sort({ name: 1 });
    res.json(staff);
  } catch (err) {
    console.error('Fetch active staff list error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/staff
// @desc    Create a new staff account
// @access  Private (admin)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Please include a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isIn(['admin', 'receptionist', 'technician', 'accountant']).withMessage('Invalid role')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, baseSalary, hourlyRate } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newStaff = new User({
        name,
        email,
        passwordHash,
        role,
        baseSalary: baseSalary !== undefined ? Number(baseSalary) : 30000,
        hourlyRate: hourlyRate !== undefined ? Number(hourlyRate) : 200,
        isActive: true
      });

      await newStaff.save();

      // Write to audit log
      await logAction({
        req,
        action: 'staff_registered',
        module: 'staff',
        details: `Registered new staff member: ${newStaff.name} (${newStaff.email}) as role ${newStaff.role}`
      });

      res.status(201).json(newStaff);
    } catch (err) {
      console.error('Create staff account error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PATCH /api/staff/:id
// @desc    Update a staff member account (edit name, email, role, isActive status, reset password)
// @access  Private (admin)
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
    body('email').optional().isEmail().withMessage('Please include a valid email').normalizeEmail(),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').optional().isIn(['admin', 'receptionist', 'technician', 'accountant']).withMessage('Invalid role'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, isActive, baseSalary, hourlyRate } = req.body;

    try {
      const userToUpdate = await User.findById(req.params.id);
      if (!userToUpdate) {
        return res.status(404).json({ message: 'Staff member not found' });
      }

      // Check if updating email and it's already taken
      if (email && email !== userToUpdate.email) {
        const emailTaken = await User.findOne({ email });
        if (emailTaken) {
          return res.status(400).json({ message: 'Email is already taken by another account' });
        }
        userToUpdate.email = email;
      }

      // Prevent deactivating own admin account
      if (isActive === false && req.user._id.toString() === userToUpdate._id.toString()) {
        return res.status(400).json({ message: 'You cannot deactivate your own admin account' });
      }

      if (name !== undefined) userToUpdate.name = name;
      if (role !== undefined) userToUpdate.role = role;
      if (isActive !== undefined) userToUpdate.isActive = isActive;
      if (baseSalary !== undefined) userToUpdate.baseSalary = Number(baseSalary);
      if (hourlyRate !== undefined) userToUpdate.hourlyRate = Number(hourlyRate);
      if (password !== undefined) {
        userToUpdate.passwordHash = await bcrypt.hash(password, 10);
      }

      await userToUpdate.save();

      // Write to audit log
      await logAction({
        req,
        action: 'staff_updated',
        module: 'staff',
        details: `Updated staff member ${userToUpdate.name} (${userToUpdate.email}). Status: ${userToUpdate.isActive ? 'Active' : 'Deactivated'}, Role: ${userToUpdate.role}`
      });

      res.json(userToUpdate);
    } catch (err) {
      console.error('Update staff member error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/staff/attendance
// @desc    Get attendance records for a specific date or date range
// @access  Private (admin)
router.get('/attendance', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { date } = req.query;
    let query = {};
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    const records = await Attendance.find(query).populate('userId', 'name email role');
    res.json(records);
  } catch (err) {
    console.error('Fetch attendance error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/staff/attendance
// @desc    Record/Update daily attendance for staff
// @access  Private (admin)
router.post('/attendance', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { records, date } = req.body;
    if (!records || !Array.isArray(records) || !date) {
      return res.status(400).json({ message: 'Invalid attendance payload' });
    }

    if (!isWithinSupportedDateRange(date)) {
      return res.status(400).json({ message: 'Attendance date is invalid or out of the supported range' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const savedRecords = [];
    for (const record of records) {
      const { userId, status, workingHours } = record;
      // Check if entry already exists
      const existing = await Attendance.findOne({ userId, date: targetDate });
      if (existing) {
        existing.status = status;
        existing.workingHours = Number(workingHours || 8);
        await existing.save();
        savedRecords.push(existing);
      } else {
        const entry = new Attendance({
          userId,
          date: targetDate,
          status,
          workingHours: Number(workingHours || 8)
        });
        await entry.save();
        savedRecords.push(entry);
      }
    }

    // Write to audit log
    await logAction({
      req,
      action: 'attendance_logged',
      module: 'staff',
      details: `Logged/updated staff attendance for date: ${formatNepaliDate(targetDate)}`
    });

    res.status(201).json(savedRecords);
  } catch (err) {
    console.error('Log attendance error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/staff/salary-sheet
// @desc    Generate monthly salary sheet for all active staff
// @access  Private (admin)
router.get('/salary-sheet', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { month, year } = req.query;
    if (month === undefined || year === undefined) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    const startOfMonth = new Date(y, m, 1);
    const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59, 999);

    const staff = await User.find({ isActive: true });
    const attendanceRecords = await Attendance.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const salarySheet = staff.map((member) => {
      const memberRecords = attendanceRecords.filter(
        (r) => r.userId.toString() === member._id.toString()
      );

      const presentDays = memberRecords.filter((r) => r.status === 'present').length;
      const leaveDays = memberRecords.filter((r) => r.status === 'leave').length;
      const absentDays = memberRecords.filter((r) => r.status === 'absent').length;

      const totalHoursWorked = memberRecords
        .filter((r) => r.status === 'present')
        .reduce((sum, r) => sum + r.workingHours, 0);

      // standard daily hours is 8. Overtime is positive difference.
      const standardHours = presentDays * 8;
      const overtimeHours = Math.max(0, totalHoursWorked - standardHours);

      // Formula: (baseSalary / 30) * (presentDays + leaveDays) + (overtimeHours * hourlyRate)
      const dailyRate = member.baseSalary / 30;
      const basePay = dailyRate * (presentDays + leaveDays);
      const overtimePay = overtimeHours * member.hourlyRate;
      const netPay = Math.round(basePay + overtimePay);

      return {
        userId: member._id,
        name: member.name,
        role: member.role,
        baseSalary: member.baseSalary,
        hourlyRate: member.hourlyRate,
        presentDays,
        leaveDays,
        absentDays,
        overtimeHours,
        netPay
      };
    });

    res.json(salarySheet);
  } catch (err) {
    console.error('Calculate salaries error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/staff/pay-salary
// @desc    Record salary payment (creates an expenditure entry)
// @access  Private (admin)
router.post('/pay-salary', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { userId, amount, month, year, method } = req.body;
    if (!userId || !amount || month === undefined || year === undefined || !method) {
      return res.status(400).json({ message: 'Invalid payment parameters' });
    }

    const member = await User.findById(userId);
    if (!member) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Log the salary payment as a business expenditure
    const expenditure = new Expenditure({
      category: 'Staff Salary',
      amount: Number(amount),
      date: new Date(),
      note: `Monthly Salary Payment to ${member.name} (${member.role.toUpperCase()}) for ${monthNames[month]} ${year}. Paid via ${method.toUpperCase()}.`
    });

    await expenditure.save();

    // Write to audit log
    await logAction({
      req,
      action: 'salary_paid',
      module: 'staff',
      details: `Paid salary of Rs. ${amount} to ${member.name} for ${monthNames[month]} ${year}`
    });

    res.status(201).json({ message: 'Salary payment recorded successfully', expenditure });
  } catch (err) {
    console.error('Record salary payment error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
