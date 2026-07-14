import cron from 'node-cron';
import InventoryStock from '../models/InventoryStock.js';
import DayBook from '../models/DayBook.js';
import Settings from '../models/Settings.js';
import { createNotification } from '../utils/notifier.js';

// Perform the inventory audit logic
export const checkLowStock = async () => {
  console.log('[Inventory Audit] Starting automated stock check...');
  try {
    // Check if lowStockAlerts setting is disabled
    const settings = await Settings.findOne();
    if (settings && settings.lowStockAlerts === false) {
      console.log('[Inventory Audit] Low stock alerts are disabled in global settings. Skipping notifications.');
      return;
    }

    // Find items where qty < minQty
    const lowStockItems = await InventoryStock.find({
      $expr: { $lt: ['$qty', '$minQty'] }
    });

    if (lowStockItems.length > 0) {
      console.warn(`[Inventory Audit] WARNING: The following ${lowStockItems.length} items are running low on stock:`);
      lowStockItems.forEach((item) => {
        console.warn(` - SKU: ${item.sku} | Name: ${item.name} | Current Stock: ${item.qty} | Minimum Threshold: ${item.minQty}`);
      });

      // Send alert notification to administrators
      await createNotification({
        recipientRoles: ['admin'],
        title: 'Low Stock Alert',
        message: `${lowStockItems.length} inventory items are below their minimum threshold.`,
        type: 'inventory',
        link: '/inventory'
      });
    } else {
      console.log('[Inventory Audit] All items are sufficiently stocked.');
    }
  } catch (error) {
    console.error('[Inventory Audit] Error running automated stock check:', error.message);
  }
};

// Check if today's Day Book has been closed — send reminder to admin if not
export const checkDayBookClosure = async () => {
  console.log('[Day Book Reminder] Checking if today\'s day book is closed...');
  try {
    const settings = await Settings.findOne();
    if (settings && settings.daybookClosureReminder === false) {
      console.log('[Day Book Reminder] Reminder is disabled in global settings. Skipping.');
      return;
    }

    // Build today's date range (midnight to midnight)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayEntry = await DayBook.findOne({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!todayEntry || !todayEntry.isClosed) {
      console.warn('[Day Book Reminder] Today\'s Day Book is NOT closed. Sending notification to admin.');
      await createNotification({
        recipientRoles: ['admin', 'accountant'],
        title: 'Day Book Not Closed',
        message: `Today's Day Book has not been closed yet. Please reconcile and close it before end of business.`,
        type: 'alert',
        link: '/daybook'
      });
    } else {
      console.log('[Day Book Reminder] Today\'s Day Book is already closed. All good.');
    }
  } catch (error) {
    console.error('[Day Book Reminder] Error checking day book closure:', error.message);
  }
};

// Schedule Cron Jobs
export const initCronJobs = () => {
  // Inventory audit: daily at midnight (00:00)
  cron.schedule('0 0 * * *', () => {
    checkLowStock();
  });
  console.log('[Cron] Automated inventory checks scheduled for daily audit at midnight.');

  // Day Book reminder: daily at 10 PM (22:00)
  cron.schedule('0 22 * * *', () => {
    checkDayBookClosure();
  });
  console.log('[Cron] Day Book closure reminder scheduled for 10:00 PM daily.');
};
