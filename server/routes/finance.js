import express from 'express';
import { body, validationResult } from 'express-validator';
import Payment from '../models/Payment.js';
import Expenditure from '../models/Expenditure.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import InventoryStock from '../models/InventoryStock.js';
import Appointment from '../models/Appointment.js';
import JobCard from '../models/JobCard.js';
import Attendance from '../models/Attendance.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAction } from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/finance/cash-flow
// @desc    Get income vs expenditures grouped by day
// @access  Private (admin, accountant)
router.get('/cash-flow', authenticate, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date();
    if (!startDate) {
      start.setDate(end.getDate() - 30);
    }
    
    // Normalize time to cover full days
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // 1. Fetch Payments (Inflow)
    const payments = await Payment.find({
      createdAt: { $gte: start, $lte: end }
    });

    // 2. Fetch Expenditures (Outflow)
    const expenditures = await Expenditure.find({
      date: { $gte: start, $lte: end }
    });

    // 3. Aggregate daily values
    const dailyMap = {};

    // Helper to format date
    const formatDate = (date) => date.toISOString().split('T')[0];

    // Populate date range to ensure days with zero transactions are included if desired,
    // or we can populate dynamically based on transactions. Let's populate dynamically.
    payments.forEach((p) => {
      const dateStr = formatDate(p.createdAt);
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, income: 0, expenditure: 0 };
      }
      dailyMap[dateStr].income += p.amount;
    });

    expenditures.forEach((e) => {
      const dateStr = formatDate(e.date);
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, income: 0, expenditure: 0 };
      }
      dailyMap[dateStr].expenditure += e.amount;
    });

    // Convert map to sorted array
    const chartData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Summary totals
    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenditure = expenditures.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      summary: {
        totalIncome,
        totalExpenditure,
        netProfit: totalIncome - totalExpenditure
      },
      chartData
    });
  } catch (err) {
    console.error('Fetch cash flow error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/finance/expenditures
// @desc    Get all manual & auto-logged expenditures
// @access  Private (admin, accountant)
router.get('/expenditures', authenticate, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const expenditures = await Expenditure.find().sort({ date: -1 });
    res.json(expenditures);
  } catch (err) {
    console.error('Fetch expenditures error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/finance/expenditures
// @desc    Record a manual expenditure
// @access  Private (admin, accountant)
router.post(
  '/expenditures',
  authenticate,
  authorize('admin', 'accountant'),
  [
    body('category').notEmpty().withMessage('Category is required').trim(),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('note').optional().trim(),
    body('date').optional().isISO8601().toDate().withMessage('Invalid date format')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, amount, note, date } = req.body;

    try {
      const expenditure = new Expenditure({
        category,
        amount: parseFloat(amount),
        note: note || '',
        date: date || new Date()
      });

      await expenditure.save();

      // Write to audit log
      await logAction({
        req,
        action: 'expenditure_created',
        module: 'finance',
        details: `Recorded manual expenditure category "${expenditure.category}". Amount: Rs. ${expenditure.amount.toFixed(2)}. Notes: ${expenditure.note || 'None'}`
      });

      res.status(201).json(expenditure);
    } catch (err) {
      console.error('Create expenditure error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/finance/expenditures/:id
// @desc    Delete/Void a manual expenditure
// @access  Private (admin)
router.delete('/expenditures/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const expenditure = await Expenditure.findById(req.params.id);
    if (!expenditure) {
      return res.status(404).json({ message: 'Expenditure not found' });
    }

    await expenditure.deleteOne();

    // Write to audit log
    await logAction({
      req,
      action: 'expenditure_deleted',
      module: 'finance',
      details: `Voided manual expenditure category "${expenditure.category}". Voided Amount: Rs. ${expenditure.amount.toFixed(2)}`
    });

    res.json({ message: 'Expenditure voided successfully' });
  } catch (err) {
    console.error('Delete expenditure error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/summary
// @desc    Get summary KPI metrics for dashboard analytics
// @access  Private (admin, receptionist, accountant)
router.get('/summary', authenticate, authorize('admin', 'receptionist', 'accountant'), async (req, res) => {
  try {
    const { filter } = req.query; // 'day', 'week', 'month', 'year'
    
    const start = new Date();
    const end = new Date();

    if (filter === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (filter === 'week') {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (filter === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (filter === 'year') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default to month if not specified
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    // 1. Total Income (Inflow Ledger)
    const payments = await Payment.find({
      createdAt: { $gte: start, $lte: end }
    });
    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);

    // 2. Total Expenditures
    const expenditures = await Expenditure.find({
      date: { $gte: start, $lte: end }
    });
    const totalExpenditures = expenditures.reduce((sum, e) => sum + e.amount, 0);

    // 3. Outstanding Invoices Balance (Unpaid Dues)
    const invoices = await Invoice.find({ 
      status: { $ne: 'paid' },
      createdAt: { $gte: start, $lte: end }
    });
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);

    // 4. Vehicles Serviced (Closed Job Cards within the timeframe)
    const vehiclesServiced = await JobCard.countDocuments({
      status: 'closed',
      closedAt: { $gte: start, $lte: end }
    });

    // 5. Total Customers (Active customer database)
    const totalCustomers = await Customer.countDocuments({ deletedAt: null });

    // 6. Pending Services (Job Cards currently in progress / open)
    const pendingServices = await JobCard.countDocuments({
      status: 'open',
      createdAt: { $gte: start, $lte: end }
    });

    // 7. Upcoming Service Reminders (Invoices with next service date in range)
    const upcomingServiceReminders = await Invoice.countDocuments({
      nextServiceDate: { $gte: start, $lte: end }
    });

    // 8. Staff Present Today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const staffPresentToday = await Attendance.countDocuments({
      date: { $gte: startOfToday, $lte: endOfToday },
      status: 'present'
    });

    // 9. Completed Services (Successfully completed/closed job cards in range)
    const completedServices = await JobCard.countDocuments({
      status: 'closed',
      closedAt: { $gte: start, $lte: end }
    });

    res.json({
      metrics: {
        totalIncome,
        totalExpenditures,
        netProfit: totalIncome - totalExpenditures,
        totalOutstanding,
        vehiclesServiced,
        totalCustomers,
        pendingServices,
        upcomingServiceReminders,
        staffPresentToday,
        completedServices
      }
    });
  } catch (err) {
    console.error('Fetch analytics summary error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
