const NotificationService = require('../services/NotificationService');
const { asyncHandler } = require('../../../shared/errors');

/**
 * Notification Controller
 */
class NotificationController {
  constructor() {
    this.service = new NotificationService();
  }

  /**
   * Send email notification
   */
  sendEmail = asyncHandler(async (req, res) => {
    const { recipientUserId, subject, message, recipientEmail } = req.body;

    const notification = await this.service.sendEmailNotification({
      recipientUserId,
      subject,
      message,
      recipientEmail,
    });

    res.status(201).json({
      success: true,
      message: 'Email notification sent successfully',
      data: notification,
    });
  });

  /**
   * Send SMS notification
   */
  sendSMS = asyncHandler(async (req, res) => {
    const { recipientUserId, subject, message, phoneNumber } = req.body;

    const notification = await this.service.sendSMSNotification({
      recipientUserId,
      subject,
      message,
      phoneNumber,
    });

    res.status(201).json({
      success: true,
      message: 'SMS notification sent successfully',
      data: notification,
    });
  });

  /**
   * Send in-app notification
   */
  sendInApp = asyncHandler(async (req, res) => {
    const { recipientUserId, subject, message } = req.body;

    const notification = await this.service.sendInAppNotification({
      recipientUserId,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: 'In-app notification sent successfully',
      data: notification,
    });
  });

  /**
   * Get user notifications
   */
  getUserNotifications = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { unreadOnly } = req.query;

    const notifications = await this.service.getUserNotifications(
      userId,
      unreadOnly === 'true',
    );

    res.json({
      success: true,
      data: notifications,
      totalNotifications: notifications.length,
    });
  });

  /**
   * Mark as read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await this.service.markNotificationAsRead(notificationId);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  });

  /**
   * Broadcast notification
   */
  broadcastNotification = asyncHandler(async (req, res) => {
    const { recipientUserIds, subject, message, notificationType } = req.body;

    const notifications = await this.service.broadcastNotification({
      recipientUserIds,
      subject,
      message,
      notificationType,
    });

    res.status(201).json({
      success: true,
      message: 'Notifications broadcasted successfully',
      data: notifications,
      totalSent: notifications.length,
    });
  });

  /**
   * Delete notification
   */
  deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    await this.service.deleteNotification(notificationId);

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  });
}

module.exports = NotificationController;
