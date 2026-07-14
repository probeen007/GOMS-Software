import express from 'express';
import { body, validationResult } from 'express-validator';
import Payment from '../models/Payment.js';
import Expenditure from '../models/Expenditure.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import InventoryStock from '../models/InventoryStock.js';
import Appointment from '../models/Appointment.js';
import Servicing from '../models/Servicing.js';
import Attendance from '../models/Attendance.js';
import Purchase from '../models/Purchase.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAction } from '../utils/logger.js';
import { isWithinSupportedDateRange } from '../utils/dateRange.js';

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
    body('date')
      .optional()
      .isISO8601().withMessage('Invalid date format')
      .bail()
      .custom(isWithinSupportedDateRange).withMessage('Expenditure date is out of the supported range')
      .toDate()
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

    // 4. Vehicles Serviced (Closed Servicing records within the timeframe)
    const vehiclesServiced = await Servicing.countDocuments({
      status: 'closed',
      closedAt: { $gte: start, $lte: end }
    });

    // 5. Total Customers (Active customer database)
    const totalCustomers = await Customer.countDocuments({ deletedAt: null });

    // 6. Pending Services (Servicing records currently in progress / open)
    const pendingServices = await Servicing.countDocuments({
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
    const completedServices = await Servicing.countDocuments({
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

// Shared helper to resolve a date range, defaulting to the last 30 days
const resolveDateRange = (query) => {
  const { startDate, endDate } = query;
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date();
  if (!startDate) {
    start.setDate(end.getDate() - 30);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @route   GET /api/finance/vat-report
// @desc    VAT invoices and purchases in the given date range, with totals
// @access  Private (admin, accountant)
router.get('/vat-report', authenticate, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { start, end } = resolveDateRange(req.query);

    const [invoices, purchases] = await Promise.all([
      Invoice.find({
        invoiceType: 'vat',
        createdAt: { $gte: start, $lte: end }
      })
        .populate('customerId', 'name phone')
        .populate('vehicleId', 'plateNo make model')
        .sort({ createdAt: -1 }),
      Purchase.find({
        purchaseType: 'vat',
        createdAt: { $gte: start, $lte: end }
      }).sort({ createdAt: -1 })
    ]);

    const totals = invoices.reduce(
      (acc, inv) => {
        acc.subtotal += inv.subtotal;
        acc.vat += inv.vat;
        acc.total += inv.total;
        return acc;
      },
      { subtotal: 0, vat: 0, total: 0 }
    );

    const purchaseTotals = purchases.reduce(
      (acc, p) => {
        acc.subtotal += p.subtotal;
        acc.vat += p.vat;
        acc.total += p.totalCost;
        return acc;
      },
      { subtotal: 0, vat: 0, total: 0 }
    );

    res.json({
      invoices,
      totals,
      count: invoices.length,
      purchases,
      purchaseTotals,
      purchaseCount: purchases.length
    });
  } catch (err) {
    console.error('Fetch VAT report error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/finance/non-vat-report
// @desc    Non-VAT invoices and purchases in the given date range, with totals
// @access  Private (admin, accountant)
router.get('/non-vat-report', authenticate, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { start, end } = resolveDateRange(req.query);

    const [invoices, purchases] = await Promise.all([
      Invoice.find({
        invoiceType: 'non-vat',
        createdAt: { $gte: start, $lte: end }
      })
        .populate('customerId', 'name phone')
        .populate('vehicleId', 'plateNo make model')
        .sort({ createdAt: -1 }),
      Purchase.find({
        purchaseType: 'non-vat',
        createdAt: { $gte: start, $lte: end }
      }).sort({ createdAt: -1 })
    ]);

    const totals = invoices.reduce(
      (acc, inv) => {
        acc.subtotal += inv.subtotal;
        acc.total += inv.total;
        return acc;
      },
      { subtotal: 0, total: 0 }
    );

    const purchaseTotals = purchases.reduce(
      (acc, p) => {
        acc.subtotal += p.subtotal;
        acc.total += p.totalCost;
        return acc;
      },
      { subtotal: 0, total: 0 }
    );

    res.json({
      invoices,
      totals,
      count: invoices.length,
      purchases,
      purchaseTotals,
      purchaseCount: purchases.length
    });
  } catch (err) {
    console.error('Fetch Non-VAT report error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/finance/summary-report
// @desc    Consolidated financial summary: income, expenditure, VAT/Non-VAT split, outstanding dues
// @access  Private (admin, accountant)
router.get('/summary-report', authenticate, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { start, end } = resolveDateRange(req.query);

    const [
      payments,
      expenditures,
      vatInvoices,
      nonVatInvoices,
      outstandingInvoices,
      vatPurchases,
      nonVatPurchases
    ] = await Promise.all([
      Payment.find({ createdAt: { $gte: start, $lte: end } }),
      Expenditure.find({ date: { $gte: start, $lte: end } }),
      Invoice.find({ invoiceType: 'vat', createdAt: { $gte: start, $lte: end } }),
      Invoice.find({ invoiceType: 'non-vat', createdAt: { $gte: start, $lte: end } }),
      Invoice.find({ status: { $ne: 'paid' }, createdAt: { $gte: start, $lte: end } }),
      Purchase.find({ purchaseType: 'vat', createdAt: { $gte: start, $lte: end } }),
      Purchase.find({ purchaseType: 'non-vat', createdAt: { $gte: start, $lte: end } })
    ]);

    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenditure = expenditures.reduce((sum, e) => sum + e.amount, 0);
    const vatInvoiceTotal = vatInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const vatCollected = vatInvoices.reduce((sum, inv) => sum + inv.vat, 0);
    const nonVatInvoiceTotal = nonVatInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const outstandingDues = outstandingInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);

    const vatPurchaseTotal = vatPurchases.reduce((sum, p) => sum + p.totalCost, 0);
    const vatPaid = vatPurchases.reduce((sum, p) => sum + p.vat, 0);
    const nonVatPurchaseTotal = nonVatPurchases.reduce((sum, p) => sum + p.totalCost, 0);

    res.json({
      totalIncome,
      totalExpenditure,
      netProfit: totalIncome - totalExpenditure,
      vatInvoiceCount: vatInvoices.length,
      vatInvoiceTotal,
      vatCollected,
      nonVatInvoiceCount: nonVatInvoices.length,
      nonVatInvoiceTotal,
      outstandingDues,
      vatPurchaseCount: vatPurchases.length,
      vatPurchaseTotal,
      vatPaid,
      nonVatPurchaseCount: nonVatPurchases.length,
      nonVatPurchaseTotal,
      netVatPayable: vatCollected - vatPaid
    });
  } catch (err) {
    console.error('Fetch summary report error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
