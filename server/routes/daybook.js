import express from 'express';
import { body, validationResult } from 'express-validator';
import DayBook from '../models/DayBook.js';
import Payment from '../models/Payment.js';
import Expenditure from '../models/Expenditure.js';
import Purchase from '../models/Purchase.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAction } from '../utils/logger.js';

const router = express.Router();

// Helper to normalize a date to 00:00:00 UTC
const normalizeDate = (dateVal) => {
  const d = new Date(dateVal);
  d.setHours(0, 0, 0, 0);
  return d;
};

// @route   GET /api/daybook
// @desc    Get list of DayBook entries
// @access  Private (admin, accountant, receptionist)
router.get('/', authenticate, authorize('admin', 'accountant', 'receptionist'), async (req, res) => {
  try {
    const daybooks = await DayBook.find().sort({ date: -1 });
    res.json(daybooks);
  } catch (err) {
    console.error('Fetch daybooks error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/daybook/date/:date
// @desc    Get DayBook details & transaction logs for a specific calendar date (YYYY-MM-DD)
// @access  Private (admin, accountant, receptionist)
router.get('/date/:date', authenticate, authorize('admin', 'accountant', 'receptionist'), async (req, res) => {
  try {
    const dateStr = req.params.date;
    const targetDate = normalizeDate(dateStr);
    
    // Start & end bounds of the selected day
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    // 1. Fetch/Find DayBook record
    let daybook = await DayBook.findOne({ date: targetDate });
    if (!daybook) {
      // Find the most recent closed DayBook to get the closing balances to pre-fill as opening balances
      const lastClosed = await DayBook.findOne({ isClosed: true, date: { $lt: targetDate } }).sort({ date: -1 });
      
      daybook = new DayBook({
        date: targetDate,
        openingBalanceCash: lastClosed ? lastClosed.closingBalanceCash : 0,
        openingBalanceBank: lastClosed ? lastClosed.closingBalanceBank : 0,
        closingBalanceCash: lastClosed ? lastClosed.closingBalanceCash : 0,
        closingBalanceBank: lastClosed ? lastClosed.closingBalanceBank : 0,
        isClosed: false,
        notes: ''
      });
      // Do not save yet, just return pre-filled object
    }

    // 2. Fetch all daily transactions
    const [payments, expenditures, purchases] = await Promise.all([
      Payment.find({ createdAt: { $gte: dayStart, $lte: dayEnd } })
        .populate('invoiceId', 'invoiceNo customerId')
        .populate('receivedBy', 'name'),
      Expenditure.find({ date: { $gte: dayStart, $lte: dayEnd } }),
      Purchase.find({ createdAt: { $gte: dayStart, $lte: dayEnd } })
    ]);

    // Aggregate receipts (payments in)
    let receiptsCash = 0;
    let receiptsBank = 0;
    payments.forEach(p => {
      if (p.method === 'cash') {
        receiptsCash += p.amount;
      } else {
        receiptsBank += p.amount;
      }
    });

    // Aggregate payments (cash out)
    // Purchases and Expenditures are cash out (outflow)
    let paymentsCash = 0;
    let paymentsBank = 0;

    expenditures.forEach(e => {
      // Treat manual expenditures as cash by default unless noted
      paymentsCash += e.amount;
    });

    purchases.forEach(p => {
      // Treat purchases as bank transactions by default since they are usually bank/invoice settlements
      paymentsBank += p.totalCost;
    });

    res.json({
      daybook,
      transactions: {
        payments,
        expenditures,
        purchases
      },
      aggregates: {
        receiptsCash,
        receiptsBank,
        paymentsCash,
        paymentsBank,
        netCash: receiptsCash - paymentsCash,
        netBank: receiptsBank - paymentsBank
      }
    });
  } catch (err) {
    console.error('Fetch DayBook date details error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/daybook/save
// @desc    Save or update a DayBook record
// @access  Private (admin, accountant, receptionist)
router.post(
  '/save',
  authenticate,
  authorize('admin', 'accountant', 'receptionist'),
  [
    body('date').notEmpty().withMessage('Date is required').isISO8601().toDate(),
    body('openingBalanceCash').isFloat({ min: 0 }).withMessage('Opening balance cash must be non-negative'),
    body('openingBalanceBank').isFloat({ min: 0 }).withMessage('Opening balance bank must be non-negative'),
    body('closingBalanceCash').isFloat({ min: 0 }).withMessage('Closing balance cash must be non-negative'),
    body('closingBalanceBank').isFloat({ min: 0 }).withMessage('Closing balance bank must be non-negative'),
    body('isClosed').isBoolean().withMessage('isClosed status must be boolean'),
    body('notes').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      date,
      openingBalanceCash,
      openingBalanceBank,
      closingBalanceCash,
      closingBalanceBank,
      isClosed,
      notes
    } = req.body;

    try {
      const targetDate = normalizeDate(date);
      
      let daybook = await DayBook.findOne({ date: targetDate });
      if (daybook && daybook.isClosed && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only an admin can edit a closed Day Book entry' });
      }

      if (!daybook) {
        daybook = new DayBook({ date: targetDate });
      }

      daybook.openingBalanceCash = openingBalanceCash;
      daybook.openingBalanceBank = openingBalanceBank;
      daybook.closingBalanceCash = closingBalanceCash;
      daybook.closingBalanceBank = closingBalanceBank;
      daybook.isClosed = isClosed;
      daybook.notes = notes || '';

      await daybook.save();

      // Log action
      await logAction({
        req,
        action: 'daybook_saved',
        module: 'finance',
        details: `Saved Day Book for date ${targetDate.toISOString().split('T')[0]}. Closed: ${isClosed}. Cash Opening/Closing: Rs. ${openingBalanceCash}/Rs. ${closingBalanceCash}. Bank Opening/Closing: Rs. ${openingBalanceBank}/Rs. ${closingBalanceBank}`
      });

      res.json(daybook);
    } catch (err) {
      console.error('Save DayBook error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
