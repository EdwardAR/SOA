const pool = require('../../../shared/database');
const { APIError } = require('../../../shared/errors');

/**
 * Payment Service - Business logic
 */
class PaymentService {
  /**
   * Generate invoice
   */
  async generateInvoice(invoiceData) {
    try {
      const {
        studentId, feeType, amount, dueDate,
      } = invoiceData;

      // Check if student exists
      const [students] = await pool.execute('SELECT id FROM students WHERE id = ?', [studentId]);
      if (students.length === 0) {
        throw new APIError(404, 'Student not found');
      }

      // Generate unique invoice ID
      const invoiceId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const query = `
        INSERT INTO payments (student_id, invoice_id, amount, fee_type, due_date, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `;

      const [result] = await pool.execute(query, [
        studentId, invoiceId, amount, feeType, dueDate,
      ]);

      return {
        id: result.insertId,
        invoiceId,
        studentId,
        feeType,
        amount,
        dueDate,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, 'Failed to generate invoice', error.message);
    }
  }

  /**
   * Track payment
   */
  async trackPayment(paymentId) {
    const query = `
      SELECT p.*, s.enrollment_number, s.first_name, s.last_name, u.email
      FROM payments p
      LEFT JOIN students s ON p.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE p.id = ?
    `;

    const [payments] = await pool.execute(query, [paymentId]);

    if (payments.length === 0) {
      throw new APIError(404, 'Payment record not found');
    }

    return payments[0];
  }

  /**
   * Get student invoices
   */
  async getStudentInvoices(studentId, status = null) {
    let query = `
      SELECT p.*, s.first_name, s.last_name, s.enrollment_number
      FROM payments p
      LEFT JOIN students s ON p.student_id = s.id
      WHERE p.student_id = ?
    `;

    const params = [studentId];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const [invoices] = await pool.execute(query, params);
    return invoices;
  }

  /**
   * Record payment
   */
  async recordPayment(paymentId, paymentData) {
    try {
      const { paymentMethod, transactionId } = paymentData;

      // Update payment status
      const query = `
        UPDATE payments 
        SET status = 'paid', payment_date = CURDATE(), payment_method = ?, transaction_id = ?, updated_at = NOW()
        WHERE id = ?
      `;

      const [result] = await pool.execute(query, [paymentMethod, transactionId, paymentId]);

      if (result.affectedRows === 0) {
        throw new APIError(404, 'Payment record not found');
      }

      const [updated] = await pool.execute(
        'SELECT * FROM payments WHERE id = ?',
        [paymentId],
      );

      return updated[0];
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, 'Failed to record payment', error.message);
    }
  }

  /**
   * Get overdue payments
   */
  async getOverduePayments() {
    const query = `
      SELECT p.*, s.enrollment_number, s.first_name, s.last_name, u.email
      FROM payments p
      LEFT JOIN students s ON p.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE p.status = 'pending' AND p.due_date < CURDATE()
      ORDER BY p.due_date ASC
    `;

    const [overdue] = await pool.execute(query);
    return overdue;
  }

  /**
   * Get payment summary
   */
  async getPaymentSummary(studentId) {
    const query = `
      SELECT 
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'pending' AND due_date < CURDATE() THEN amount ELSE 0 END) as total_overdue,
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
      FROM payments
      WHERE student_id = ?
    `;

    const [summary] = await pool.execute(query, [studentId]);
    return summary[0];
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId) {
    const query = `
      UPDATE payments 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ? AND status != 'paid'
    `;

    const [result] = await pool.execute(query, [paymentId]);

    if (result.affectedRows === 0) {
      throw new APIError(404, 'Payment record not found or already paid');
    }

    const [updated] = await pool.execute('SELECT * FROM payments WHERE id = ?', [paymentId]);
    return updated[0];
  }
}

module.exports = PaymentService;
