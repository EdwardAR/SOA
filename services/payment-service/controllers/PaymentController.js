const PaymentService = require('../services/PaymentService');
const { asyncHandler } = require('../../../shared/errors');

/**
 * Payment Controller
 */
class PaymentController {
  constructor() {
    this.service = new PaymentService();
  }

  /**
   * Generate invoice
   */
  generateInvoice = asyncHandler(async (req, res) => {
    const { studentId, feeType, amount, dueDate } = req.body;

    const invoice = await this.service.generateInvoice({
      studentId,
      feeType,
      amount,
      dueDate,
    });

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice,
    });
  });

  /**
   * Track payment
   */
  trackPayment = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const payment = await this.service.trackPayment(paymentId);

    res.json({
      success: true,
      data: payment,
    });
  });

  /**
   * Get student invoices
   */
  getStudentInvoices = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { status } = req.query;

    const invoices = await this.service.getStudentInvoices(studentId, status);

    res.json({
      success: true,
      data: invoices,
      totalInvoices: invoices.length,
    });
  });

  /**
   * Record payment
   */
  recordPayment = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { paymentMethod, transactionId } = req.body;

    const updated = await this.service.recordPayment(paymentId, { paymentMethod, transactionId });

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: updated,
    });
  });

  /**
   * Get overdue payments
   */
  getOverduePayments = asyncHandler(async (req, res) => {
    const overdue = await this.service.getOverduePayments();

    res.json({
      success: true,
      data: overdue,
      totalOverdue: overdue.length,
    });
  });

  /**
   * Get payment summary
   */
  getPaymentSummary = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const summary = await this.service.getPaymentSummary(studentId);

    res.json({
      success: true,
      data: summary,
    });
  });

  /**
   * Cancel payment
   */
  cancelPayment = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const updated = await this.service.cancelPayment(paymentId);

    res.json({
      success: true,
      message: 'Payment cancelled successfully',
      data: updated,
    });
  });
}

module.exports = PaymentController;
