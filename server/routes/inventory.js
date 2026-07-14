import express from 'express';
import { body, validationResult } from 'express-validator';
import InventoryStock from '../models/InventoryStock.js';
import Purchase from '../models/Purchase.js';
import Expenditure from '../models/Expenditure.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAction } from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/inventory
// @desc    Get all inventory items (with optional search & low-stock filter)
// @access  Private (admin, technician, accountant)
router.get('/', authenticate, authorize('admin', 'technician', 'accountant'), async (req, res) => {
  try {
    const search = req.query.search || '';
    const lowStockOnly = req.query.lowStock === 'true';

    let query = {};

    // Apply text search
    if (search) {
      query.$or = [
        { sku: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { supplierName: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply low stock filter: qty < minQty
    if (lowStockOnly) {
      query.$expr = { $lt: ['$qty', '$minQty'] };
    }

    const items = await InventoryStock.find(query).sort({ name: 1 });
    res.json(items);
  } catch (err) {
    console.error('Fetch inventory error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory
// @desc    Create a new inventory item
// @access  Private (admin, accountant)
router.post(
  '/',
  authenticate,
  authorize('admin', 'accountant'),
  [
    body('sku').notEmpty().withMessage('SKU is required').trim().toUpperCase(),
    body('name').notEmpty().withMessage('Item name is required').trim(),
    body('supplierName').optional().trim(),
    body('qty').optional().isInt({ min: 0 }).withMessage('Quantity must be 0 or more'),
    body('minQty').optional().isInt({ min: 0 }).withMessage('Minimum warning quantity must be 0 or more'),
    body('unitCost').isFloat({ min: 0 }).withMessage('Unit cost must be a positive number'),
    body('unitPrice').isFloat({ min: 0 }).withMessage('Unit selling price must be a positive number')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sku, name, supplierName, qty, minQty, unitCost, unitPrice } = req.body;

    try {
      // Check if SKU exists
      const existingItem = await InventoryStock.findOne({ sku });
      if (existingItem) {
        return res.status(400).json({ message: `Inventory item with SKU '${sku}' already exists` });
      }

      const newItem = new InventoryStock({
        sku,
        name,
        supplierName: supplierName || '',
        qty: qty || 0,
        minQty: minQty !== undefined ? minQty : 5,
        unitCost,
        unitPrice
      });

      const item = await newItem.save();

      // Write to audit log
      await logAction({
        req,
        action: 'inventory_created',
        module: 'inventory',
        details: `Created new inventory item: ${item.name} (SKU: ${item.sku})`
      });

      res.status(201).json(item);
    } catch (err) {
      console.error('Create inventory item error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PATCH /api/inventory/:id
// @desc    Update inventory item details
// @access  Private (admin, accountant)
router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'accountant'),
  [
    body('sku').optional().trim().toUpperCase(),
    body('name').optional().trim(),
    body('supplierName').optional().trim(),
    body('qty').optional().isInt({ min: 0 }).withMessage('Quantity must be 0 or more'),
    body('minQty').optional().isInt({ min: 0 }).withMessage('Minimum warning quantity must be 0 or more'),
    body('unitCost').optional().isFloat({ min: 0 }).withMessage('Unit cost must be a positive number'),
    body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit selling price must be a positive number')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const item = await InventoryStock.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }

      // Check SKU uniqueness if updating it
      if (req.body.sku && req.body.sku !== item.sku) {
        const duplicateSKU = await InventoryStock.findOne({ sku: req.body.sku });
        if (duplicateSKU) {
          return res.status(400).json({ message: `SKU '${req.body.sku}' is already assigned to another item` });
        }
      }

      const fieldsToUpdate = ['sku', 'name', 'supplierName', 'qty', 'minQty', 'unitCost', 'unitPrice'];
      fieldsToUpdate.forEach((field) => {
        if (req.body[field] !== undefined) {
          item[field] = req.body[field];
        }
      });

      const updatedItem = await item.save();

      // Write to audit log
      await logAction({
        req,
        action: 'inventory_updated',
        module: 'inventory',
        details: `Updated inventory item: ${updatedItem.name} (SKU: ${updatedItem.sku}). Quantity: ${updatedItem.qty}, Unit Cost: Rs. ${updatedItem.unitCost.toFixed(2)}, Unit Price: Rs. ${updatedItem.unitPrice.toFixed(2)}`
      });

      res.json(updatedItem);
    } catch (err) {
      console.error('Update inventory item error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/inventory/purchases
// @desc    Record a purchase, update stock levels, and auto-create an expenditure entry
// @access  Private (admin, accountant)
router.post(
  '/purchases',
  authenticate,
  authorize('admin', 'accountant'),
  [
    body('supplierName').notEmpty().withMessage('Supplier name is required').trim(),
    body('items').isArray({ min: 1 }).withMessage('Items list must contain at least 1 item'),
    body('items.*.partId').notEmpty().withMessage('Part ID is required'),
    body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be 1 or more'),
    body('items.*.unitCost').isFloat({ min: 0 }).withMessage('Unit cost must be 0 or more'),
    body('totalCost').isFloat({ min: 0 }).withMessage('Total cost must be 0 or more'),
    body('purchaseType').optional().isIn(['vat', 'non-vat']).withMessage('Purchase type must be vat or non-vat'),
    body('subtotal').optional().isFloat({ min: 0 }).withMessage('Subtotal must be 0 or more'),
    body('vat').optional().isFloat({ min: 0 }).withMessage('VAT must be 0 or more'),
    body('billFileUrl').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { supplierName, items, totalCost, purchaseType, subtotal, vat, billFileUrl } = req.body;

    try {
      // 1. Create the Purchase Document
      const purchase = new Purchase({
        supplierName,
        items,
        totalCost,
        purchaseType: purchaseType || 'non-vat',
        subtotal: subtotal !== undefined ? subtotal : totalCost,
        vat: vat !== undefined ? vat : 0,
        billFileUrl: billFileUrl || ''
      });
      await purchase.save();

      // 2. Increment inventory stock quantities
      for (const purchaseItem of items) {
        await InventoryStock.findByIdAndUpdate(
          purchaseItem.partId,
          {
            $inc: { qty: purchaseItem.qty },
            $set: { unitCost: purchaseItem.unitCost } // update current unitCost to reflect latest purchase price
          }
        );
      }

      // 3. Auto-Create corresponding Expenditure log
      const expenditure = new Expenditure({
        category: (purchaseType || 'non-vat') === 'vat' ? 'Inventory Purchase (VAT)' : 'Inventory Purchase (Non-VAT)',
        amount: totalCost,
        note: `Restocked ${items.length} parts from ${supplierName}. (Ref Purchase ID: ${purchase._id})`,
        date: new Date()
      });
      await expenditure.save();

      // Write to audit log
      await logAction({
        req,
        action: 'inventory_restocked',
        module: 'inventory',
        details: `Restocked ${items.length} parts from supplier ${supplierName}. Total cost: Rs. ${totalCost.toFixed(2)}`
      });

      res.status(251).json({
        message: 'Purchase recorded, inventory updated, and expense logged successfully',
        purchase,
        expenditure
      });
    } catch (err) {
      console.error('Record purchase error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
