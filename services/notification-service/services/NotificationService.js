const nodemailer = require('nodemailer');
const pool = require('../../../shared/database');
const { APIError } = require('../../../shared/errors');

/**
 * Notification Service - Business logic
 */
class NotificationService {
  constructor() {
    // Configure email transporter (update with your SMTP settings)
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-password',
      },
    });
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(notificationData) {
    try {
      const {
        recipientUserId, subject, message, recipientEmail,
      } = notificationData;

      // Get recipient info
      const [users] = await pool.execute('SELECT email FROM users WHERE id = ?', [recipientUserId]);
      if (users.length === 0) {
        throw new APIError(404, 'Recipient not found');
      }

      const email = recipientEmail || users[0].email;

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@schoolmanagement.com',
        to: email,
        subject,
        html: `<p>${message}</p>`,
      };

      // In production, you would actually send this
      // await this.emailTransporter.sendMail(mailOptions);
      console.log(`[Email] Sent to ${email}: ${subject}`);

      // Save notification to database
      const query = `
        INSERT INTO notifications (recipient_user_id, subject, message, notification_type, status)
        VALUES (?, ?, ?, 'email', 'sent')
      `;

      const [result] = await pool.execute(query, [recipientUserId, subject, message]);

      return {
        id: result.insertId,
        recipientUserId,
        subject,
        message,
        notificationType: 'email',
        status: 'sent',
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, 'Failed to send email notification', error.message);
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMSNotification(notificationData) {
    try {
      const {
        recipientUserId, subject, message, phoneNumber,
      } = notificationData;

      // Get recipient info
      const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [recipientUserId]);
      if (users.length === 0) {
        throw new APIError(404, 'Recipient not found');
      }

      // In production, use Twilio or similar SMS service
      console.log(`[SMS] Sent to ${phoneNumber}: ${message}`);

      // Save notification to database
      const query = `
        INSERT INTO notifications (recipient_user_id, subject, message, notification_type, status)
        VALUES (?, ?, ?, 'sms', 'sent')
      `;

      const [result] = await pool.execute(query, [recipientUserId, subject, message]);

      return {
        id: result.insertId,
        recipientUserId,
        subject,
        message,
        notificationType: 'sms',
        status: 'sent',
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, 'Failed to send SMS notification', error.message);
    }
  }

  /**
   * Send in-app notification
   */
  async sendInAppNotification(notificationData) {
    try {
      const { recipientUserId, subject, message } = notificationData;

      // Get recipient info
      const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [recipientUserId]);
      if (users.length === 0) {
        throw new APIError(404, 'Recipient not found');
      }

      // Save notification to database
      const query = `
        INSERT INTO notifications (recipient_user_id, subject, message, notification_type, status)
        VALUES (?, ?, ?, 'in-app', 'sent')
      `;

      const [result] = await pool.execute(query, [recipientUserId, subject, message]);

      return {
        id: result.insertId,
        recipientUserId,
        subject,
        message,
        notificationType: 'in-app',
        status: 'sent',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, 'Failed to send in-app notification', error.message);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, unreadOnly = false) {
    let query = `
      SELECT * FROM notifications
      WHERE recipient_user_id = ?
    `;

    const params = [userId];

    if (unreadOnly) {
      query += ' AND read_at IS NULL';
    }

    query += ' ORDER BY created_at DESC';

    const [notifications] = await pool.execute(query, params);
    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId) {
    const query = `
      UPDATE notifications 
      SET read_at = NOW()
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [notificationId]);

    if (result.affectedRows === 0) {
      throw new APIError(404, 'Notification not found');
    }

    const [updated] = await pool.execute('SELECT * FROM notifications WHERE id = ?', [notificationId]);
    return updated[0];
  }

  /**
   * Broadcast notification to multiple users
   */
  async broadcastNotification(notificationData) {
    try {
      const { recipientUserIds, subject, message, notificationType } = notificationData;

      const notifications = [];

      for (const userId of recipientUserIds) {
        const query = `
          INSERT INTO notifications (recipient_user_id, subject, message, notification_type, status)
          VALUES (?, ?, ?, ?, 'sent')
        `;

        const [result] = await pool.execute(query, [userId, subject, message, notificationType]);

        notifications.push({
          id: result.insertId,
          recipientUserId: userId,
          subject,
          message,
          notificationType,
          status: 'sent',
        });
      }

      return notifications;
    } catch (error) {
      throw new APIError(500, 'Failed to broadcast notifications', error.message);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    const query = 'DELETE FROM notifications WHERE id = ?';
    const [result] = await pool.execute(query, [notificationId]);

    if (result.affectedRows === 0) {
      throw new APIError(404, 'Notification not found');
    }

    return { message: 'Notification deleted successfully' };
  }
}

module.exports = NotificationService;
