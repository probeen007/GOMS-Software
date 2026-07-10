import express from 'express';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAction } from '../utils/logger.js';
import { isWithinSupportedDateRange } from '../utils/dateRange.js';

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks (filtered by assignment for technicians)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'technician') {
      query.assignedTo = req.user.id;
    }
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email role')
      .sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    console.error('Fetch tasks error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private (admin, receptionist, accountant)
router.post(
  '/',
  authenticate,
  authorize('admin', 'receptionist', 'accountant'),
  [
    body('title').notEmpty().withMessage('Title is required').trim(),
    body('assignedTo').notEmpty().withMessage('Staff assignment is required'),
    body('dueDate')
      .isISO8601().withMessage('Invalid due date')
      .bail()
      .custom(isWithinSupportedDateRange).withMessage('Due date is out of the supported range')
      .toDate(),
    body('priority').isIn(['high', 'medium', 'low']).withMessage('Invalid priority'),
    body('description').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, priority, assignedTo, dueDate } = req.body;

    try {
      const task = new Task({
        title,
        description: description || '',
        priority,
        assignedTo,
        dueDate
      });

      await task.save();

      // Write to audit log
      await logAction({
        req,
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'task_created',
        module: 'tasks',
        details: `Created task: "${task.title}" with priority ${task.priority.toUpperCase()}, assigned to user ${task.assignedTo}`
      });

      const populated = await Task.findById(task._id).populate('assignedTo', 'name email role');
      res.status(201).json(populated);
    } catch (err) {
      console.error('Create task error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PATCH /api/tasks/:id
// @desc    Update a task (toggle completion or change details)
// @access  Private
router.patch(
  '/:id',
  authenticate,
  [
    body('status').optional().isIn(['pending', 'completed']).withMessage('Invalid status'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty').trim(),
    body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Invalid priority'),
    body('assignedTo').optional().notEmpty().withMessage('Staff assignment is required'),
    body('dueDate')
      .optional()
      .isISO8601().withMessage('Invalid due date')
      .bail()
      .custom(isWithinSupportedDateRange).withMessage('Due date is out of the supported range')
      .toDate(),
    body('description').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Technicians can only toggle status of their assigned tasks
      if (req.user.role === 'technician') {
        if (task.assignedTo.toString() !== req.user.id) {
          return res.status(403).json({ message: 'Forbidden: You cannot modify tasks assigned to other staff.' });
        }
        
        // Technicians can only change status
        const allowedKeys = ['status'];
        const requestedKeys = Object.keys(req.body).filter(k => req.body[k] !== undefined);
        const disallowed = requestedKeys.filter(k => !allowedKeys.includes(k));
        if (disallowed.length > 0) {
          return res.status(403).json({ message: 'Forbidden: Technicians are only permitted to update task status.' });
        }
      } else {
        // Only admin, receptionist, accountant can edit details
        if (!['admin', 'receptionist', 'accountant'].includes(req.user.role)) {
          return res.status(403).json({ message: 'Forbidden: Role not authorized to modify task details.' });
        }
      }

      const updates = req.body;
      Object.keys(updates).forEach((key) => {
        if (updates[key] !== undefined) {
          task[key] = updates[key];
        }
      });

      await task.save();

      // Write to audit log
      await logAction({
        req,
        action: 'task_updated',
        module: 'tasks',
        details: `Updated task: "${task.title}". Status: ${task.status.toUpperCase()}, Priority: ${task.priority.toUpperCase()}`
      });

      const populated = await Task.findById(task._id).populate('assignedTo', 'name email role');
      res.json(populated);
    } catch (err) {
      console.error('Update task error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private (admin, receptionist, accountant)
router.delete('/:id', authenticate, authorize('admin', 'receptionist', 'accountant'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.deleteOne();

    // Write to audit log
    await logAction({
      req,
      action: 'task_deleted',
      module: 'tasks',
      details: `Deleted task: "${task.title}"`
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
