const express = require('express');
const PaymentController = require('../controllers/PaymentController');
const { authMiddleware } = require('../../../shared/auth');
const { validatePayment, validateRequest } = require('../../../shared/validators');

const router = express.Router();
const controller = new PaymentController();

/**
 * Payment Service Routes
 */

// Generate invoice
router.post(
  '/invoices',
  authMiddleware,
  validatePayment,
  validateRequest,
  (req, res, next) => controller.generateInvoice(req, res, next),
);

// Get student invoices
router.get(
  '/students/:studentId/invoices',
  authMiddleware,
  (req, res, next) => controller.getStudentInvoices(req, res, next),
);

// Get payment summary
router.get(
  '/students/:studentId/summary',
  authMiddleware,
  (req, res, next) => controller.getPaymentSummary(req, res, next),
);

// Track payment
router.get(
  '/:paymentId',
  authMiddleware,
  (req, res, next) => controller.trackPayment(req, res, next),
);

// Get overdue payments
router.get(
  '/report/overdue',
  authMiddleware,
  (req, res, next) => controller.getOverduePayments(req, res, next),
);

// Record payment
router.post(
  '/:paymentId/record',
  authMiddleware,
  (req, res, next) => controller.recordPayment(req, res, next),
);

// Cancel payment
router.put(
  '/:paymentId/cancel',
  authMiddleware,
  (req, res, next) => controller.cancelPayment(req, res, next),
);

module.exports = router;
