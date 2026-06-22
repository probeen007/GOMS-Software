import cron from 'node-cron';
import InventoryStock from '../models/InventoryStock.js';
import { createNotification } from '../utils/notifier.js';

// Perform the inventory audit logic
export const checkLowStock = async () => {
  console.log('[Inventory Audit] Starting automated stock check...');
  try {
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

// Schedule Cron Job: runs daily at midnight (00:00)
export const initCronJobs = () => {
  cron.schedule('0 0 * * *', () => {
    checkLowStock();
  });
  console.log('[Cron] Automated inventory checks scheduled for daily audit at midnight.');
};
