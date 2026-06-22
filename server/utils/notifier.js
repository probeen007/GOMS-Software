import Notification from '../models/Notification.js';

/**
 * Creates and saves a notification in the database.
 * @param {Object} params
 * @param {String[]} params.recipientRoles - Roles to receive notification (e.g. ['admin', 'receptionist'])
 * @param {String|null} params.recipientId - Targeted user ID (optional)
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification body content
 * @param {String} params.type - Category ('appointment', 'quotation', 'job-card', 'inventory', 'payment', 'system')
 * @param {String} params.link - Frontend route link (optional)
 */
export const createNotification = async ({
  recipientRoles = [],
  recipientId = null,
  title,
  message,
  type = 'system',
  link = ''
}) => {
  try {
    const notification = new Notification({
      recipientRoles,
      recipientId,
      title,
      message,
      type,
      link,
      readBy: []
    });
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err.message);
  }
};
