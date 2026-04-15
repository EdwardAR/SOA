const express = require('express');
const NotificationController = require('../controllers/NotificationController');
const { authMiddleware } = require('../../../shared/auth');
const { validateNotification, validateRequest } = require('../../../shared/validators');

const router = express.Router();
const controller = new NotificationController();

/**
 * Notification Service Routes
 */

// Send email
router.post(
  '/send/email',
  authMiddleware,
  validateNotification,
  validateRequest,
  (req, res, next) => controller.sendEmail(req, res, next),
);

// Send SMS
router.post(
  '/send/sms',
  authMiddleware,
  validateNotification,
  validateRequest,
  (req, res, next) => controller.sendSMS(req, res, next),
);

// Send in-app notification
router.post(
  '/send/in-app',
  authMiddleware,
  validateNotification,
  validateRequest,
  (req, res, next) => controller.sendInApp(req, res, next),
);

// Broadcast notification
router.post(
  '/broadcast',
  authMiddleware,
  (req, res, next) => controller.broadcastNotification(req, res, next),
);

// Get user notifications
router.get(
  '/users/:userId',
  authMiddleware,
  (req, res, next) => controller.getUserNotifications(req, res, next),
);

// Mark as read
router.put(
  '/:notificationId/read',
  authMiddleware,
  (req, res, next) => controller.markAsRead(req, res, next),
);

// Delete notification
router.delete(
  '/:notificationId',
  authMiddleware,
  (req, res, next) => controller.deleteNotification(req, res, next),
);

module.exports = router;
