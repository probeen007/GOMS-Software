import express from 'express';
import { body, validationResult } from 'express-validator';
import LoyaltyLedger from '../models/LoyaltyLedger.js';
import Customer from '../models/Customer.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAction } from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/loyalty/customer/:customerId
// @desc    Get loyalty ledger transactions for a customer
// @access  Private (admin, receptionist, accountant)
router.get('/customer/:customerId', authenticate, authorize('admin', 'receptionist', 'accountant'), async (req, res) => {
  try {
    const history = await LoyaltyLedger.find({ customerId: req.params.customerId })
      .populate('invoiceId', 'invoiceNo')
      .sort({ createdAt: -1 })
      .lean();

    res.json(history);
  } catch (err) {
    console.error('Fetch customer loyalty error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/loyalty/adjust
// @desc    Manually adjust customer loyalty points
// @access  Private (admin)
router.post(
  '/adjust',
  authenticate,
  authorize('admin'),
  [
    body('customerId').notEmpty().withMessage('Customer ID is required'),
    body('points').isInt().withMessage('Points must be a non-zero integer'),
    body('notes').notEmpty().withMessage('Adjustment reason notes are required').trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, points, notes } = req.body;

    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Check that balance doesn't drop below zero
      if (customer.loyaltyPoints + points < 0) {
        return res.status(400).json({
          message: `Cannot adjust points. Action would result in a negative points balance (${customer.loyaltyPoints + points})`
        });
      }

      // Create ledger entry
      const ledger = new LoyaltyLedger({
        customerId: customer._id,
        points,
        transactionType: 'adjusted',
        notes
      });
      await ledger.save();

      // Update customer balance
      customer.loyaltyPoints += points;
      await customer.save();

      // Write to audit log
      await logAction({
        req,
        action: 'loyalty_adjusted',
        module: 'loyalty',
        details: `Manually adjusted loyalty points for customer ${customer.name}. Points: ${points > 0 ? '+' : ''}${points} (New Balance: ${customer.loyaltyPoints}). Reason: ${notes}`
      });

      res.status(201).json({ customer, ledger });
    } catch (err) {
      console.error('Adjust points error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
