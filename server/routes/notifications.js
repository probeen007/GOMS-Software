import express from 'express';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get all notifications for logged in user (by role or recipientId)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { recipientId: req.user._id },
        { recipientRoles: req.user.role }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const unreadCount = notifications.filter(
      (n) => !n.readBy.some((id) => id.toString() === req.user._id.toString())
    ).length;

    res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    console.error('Fetch notifications error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Ensure this notification was actually addressed to the requesting user
    // (by direct recipient or by role) before allowing them to view/mark it.
    const isRecipient =
      (notification.recipientId && notification.recipientId.toString() === req.user._id.toString()) ||
      (notification.recipientRoles && notification.recipientRoles.includes(req.user.role));
    if (!isRecipient) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Add to readBy array if not already present
    const alreadyRead = notification.readBy.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }

    res.json(notification);
  } catch (err) {
    console.error('Mark notification read error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notifications/read-all
// @desc    Mark all matching notifications as read
// @access  Private
router.post('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { recipientId: req.user._id },
          { recipientRoles: req.user.role }
        ],
        readBy: { $ne: req.user._id }
      },
      {
        $push: { readBy: req.user._id }
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all notifications read error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
