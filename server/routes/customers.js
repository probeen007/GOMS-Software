import express from 'express';
import { body, validationResult } from 'express-validator';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAction } from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/customers
// @desc    Get all customers (with search & pagination)
// @access  Private (admin, receptionist, technician)
router.get('/', authenticate, authorize('admin', 'receptionist', 'technician'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Search query: matching name, phone, or email
    let query = { deletedAt: null };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    console.error('Fetch customers error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/customers
// @desc    Create a new customer
// @access  Private (admin, receptionist)
router.post(
  '/',
  authenticate,
  authorize('admin', 'receptionist'),
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('phone').notEmpty().withMessage('Phone number is required').trim(),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please include a valid email').normalizeEmail(),
    body('address').optional().trim(),
    body('type').optional().isIn(['individual', 'corporate']).withMessage('Type must be individual or corporate')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, email, address, type } = req.body;

    try {
      // Check if phone or email already registered (if email is provided)
      const existingCustomer = await Customer.findOne({ phone, deletedAt: null }).lean();
      if (existingCustomer) {
        return res.status(400).json({ message: 'Customer with this phone number already exists' });
      }

      const newCustomer = new Customer({
        name,
        phone,
        email: email || '',
        address: address || '',
        type: type || 'individual'
      });

      const customer = await newCustomer.save();

      // Write to audit log
      await logAction({
        req,
        action: 'customer_created',
        module: 'customers',
        details: `Created customer: ${customer.name} (Phone: ${customer.phone}, Email: ${customer.email || 'N/A'})`
      });

      res.status(201).json(customer);
    } catch (err) {
      console.error('Create customer error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/customers/:id
// @desc    Get customer details including their vehicles
// @access  Private (admin, receptionist, technician)
router.get('/:id', authenticate, authorize('admin', 'receptionist', 'technician'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer || customer.deletedAt) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const vehicles = await Vehicle.find({ customerId: customer._id }).lean();

    res.json({
      customer,
      vehicles
    });
  } catch (err) {
    console.error('Fetch customer by id error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/customers/:id/vehicles
// @desc    Add a vehicle to a customer
// @access  Private (admin, receptionist)
router.post(
  '/:id/vehicles',
  authenticate,
  authorize('admin', 'receptionist'),
  [
    body('plateNo').notEmpty().withMessage('License plate number is required').trim().toUpperCase(),
    body('make').optional({ checkFalsy: true }).trim(),
    body('model').notEmpty().withMessage('Vehicle model is required').trim(),
    body('year').optional({ checkFalsy: true }).isNumeric().withMessage('Year must be a number'),
    body('vin').optional().trim().toUpperCase(),
    body('colour').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const customer = await Customer.findById(req.params.id).lean();
      if (!customer || customer.deletedAt) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const { plateNo, make, model, year, vin, colour } = req.body;

      // Check if plateNo already exists
      const existingVehicle = await Vehicle.findOne({ plateNo }).lean();
      if (existingVehicle) {
        return res.status(400).json({ message: `Vehicle with plate number ${plateNo} is already registered` });
      }

      const newVehicle = new Vehicle({
        customerId: customer._id,
        plateNo,
        make,
        model,
        year,
        vin: vin || '',
        colour: colour || ''
      });

      const vehicle = await newVehicle.save();

      // Write to audit log
      await logAction({
        req,
        action: 'vehicle_created',
        module: 'customers',
        details: `Added vehicle to customer ${customer.name}: ${vehicle.make} ${vehicle.model} (Plate: ${vehicle.plateNo})`
      });

      res.status(201).json(vehicle);
    } catch (err) {
      console.error('Add vehicle error:', err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/customers/:id
// @desc    Soft delete a customer
// @access  Private (admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer || customer.deletedAt) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.deletedAt = new Date();
    await customer.save();

    // Write to audit log
    await logAction({
      req,
      action: 'customer_deleted',
      module: 'customers',
      details: `Soft-deleted customer: ${customer.name}`
    });

    res.json({ message: 'Customer soft-deleted successfully' });
  } catch (err) {
    console.error('Soft delete customer error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
