import express from 'express';
import Settings from '../models/Settings.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAction } from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/settings
// @desc    Get system settings (creates default if empty)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    console.error('Fetch settings error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/settings
// @desc    Update system settings
// @access  Private (admin only)
router.put('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    const {
      garageName,
      garagePhone,
      garageAddress,
      lowStockAlerts,
      daybookClosureReminder,
      autoWhatsAppPrompts,
      vatEnabled,
      vatRate,
      loyaltySystemEnabled
    } = req.body;

    if (garageName !== undefined) settings.garageName = garageName;
    if (garagePhone !== undefined) settings.garagePhone = garagePhone;
    if (garageAddress !== undefined) settings.garageAddress = garageAddress;
    if (lowStockAlerts !== undefined) settings.lowStockAlerts = lowStockAlerts;
    if (daybookClosureReminder !== undefined) settings.daybookClosureReminder = daybookClosureReminder;
    if (autoWhatsAppPrompts !== undefined) settings.autoWhatsAppPrompts = autoWhatsAppPrompts;
    if (vatEnabled !== undefined) settings.vatEnabled = vatEnabled;
    if (vatRate !== undefined) settings.vatRate = Number(vatRate);
    if (loyaltySystemEnabled !== undefined) settings.loyaltySystemEnabled = loyaltySystemEnabled;

    await settings.save();

    // Log this settings update action to audit logs
    await logAction(
      req.user.id,
      'UPDATE_SETTINGS',
      `Updated system settings. Garage: ${settings.garageName}`
    );

    res.json(settings);
  } catch (err) {
    console.error('Update settings error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
