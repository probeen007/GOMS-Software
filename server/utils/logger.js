import AuditLog from '../models/AuditLog.js';

/**
 * Utility to write an entry to the AuditLog collection.
 * @param {Object} params
 * @param {Object} [params.req] - Express request object to automatically fetch IP and current user
 * @param {String} [params.userId] - Fallback user ID
 * @param {String} [params.userName] - Fallback user Name
 * @param {String} [params.userEmail] - Fallback user Email
 * @param {String} params.action - Descriptive action tag (e.g. 'quote_approved')
 * @param {String} params.module - Target module name
 * @param {String} [params.details] - Extra descriptions or change details
 */
export const logAction = async ({
  req,
  userId,
  userName,
  userEmail,
  action,
  module,
  details = ''
}) => {
  try {
    let ip = '';
    if (req) {
      ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      // Clean up IP if needed (e.g. IPv6 loopback)
      if (ip === '::1') ip = '127.0.0.1';
    }

    let finalUserId = userId;
    let finalUserName = userName;
    let finalUserEmail = userEmail;

    if (req && req.user) {
      finalUserId = req.user._id || req.user.id || finalUserId;
      finalUserName = req.user.name || finalUserName;
      finalUserEmail = req.user.email || finalUserEmail;
    }

    if (!finalUserId) {
      // Fallback for customer public interactions (like quote approval)
      finalUserId = '000000000000000000000000'; // System placeholder ID
      finalUserName = 'Customer (Public Portal)';
      finalUserEmail = 'public-client@drivesync.com';
    }

    const log = new AuditLog({
      userId: finalUserId,
      userName: finalUserName,
      userEmail: finalUserEmail,
      action,
      module,
      details,
      ipAddress: ip
    });

    await log.save();
    return log;
  } catch (err) {
    console.error('[Audit Logger Error]:', err.message);
  }
};
