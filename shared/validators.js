const { body, validationResult } = require('express-validator');
const { APIError } = require('./errors');

/**
 * Middleware de validacion para verificar errores
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new APIError(400, 'Error de validacion', errors.array());
  }
  next();
};

/**
 * Reglas de validacion para estudiantes
 */
const validateStudent = [
  body('enrollmentNumber').notEmpty().withMessage('Enrollment number is required').trim(),
  body('firstName').notEmpty().withMessage('First name is required').trim(),
  body('lastName').notEmpty().withMessage('Last name is required').trim(),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['M', 'F', 'Other']).withMessage('Valid gender is required'),
];

/**
 * Reglas de validacion para docentes
 */
const validateTeacher = [
  body('employeeId').notEmpty().withMessage('Employee ID is required').trim(),
  body('firstName').notEmpty().withMessage('First name is required').trim(),
  body('lastName').notEmpty().withMessage('Last name is required').trim(),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('specialization').notEmpty().withMessage('Specialization is required').trim(),
  body('hireDate').isISO8601().withMessage('Valid hire date is required'),
];

/**
 * Reglas de validacion para matriculas
 */
const validateEnrollment = [
  body('studentId').isInt().withMessage('Valid student ID is required'),
  body('classroomId').isInt().withMessage('Valid classroom ID is required'),
  body('enrollmentDate').isISO8601().withMessage('Valid enrollment date is required'),
];

/**
 * Reglas de validacion para calificaciones
 */
const validateGrade = [
  body('studentId').isInt().withMessage('Valid student ID is required'),
  body('courseId').isInt().withMessage('Valid course ID is required'),
  body('teacherId').isInt().withMessage('Valid teacher ID is required'),
  body('midtermScore').isDecimal().withMessage('Valid midterm score is required'),
  body('finalScore').isDecimal().withMessage('Valid final score is required'),
  body('overallScore').optional().isDecimal().withMessage('Valid overall score is required'),
];

/**
 * Reglas de validacion para asistencia
 */
const validateAttendance = [
  body('studentId').isInt().withMessage('Valid student ID is required'),
  body('classroomId').isInt().withMessage('Valid classroom ID is required'),
  body('attendanceDate').isISO8601().withMessage('Valid attendance date is required'),
  body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Valid status is required'),
];

/**
 * Reglas de validacion para pagos
 */
const validatePayment = [
  body('studentId').isInt().withMessage('Valid student ID is required'),
  body('amount').isDecimal().withMessage('Valid amount is required'),
  body('feeType').notEmpty().withMessage('Fee type is required').trim(),
];

/**
 * Reglas de validacion para notificaciones
 */
const validateNotification = [
  body('recipientUserId').isInt().withMessage('Valid recipient user ID is required'),
  body('subject').notEmpty().withMessage('Subject is required').trim(),
  body('message').notEmpty().withMessage('Message is required').trim(),
  body('notificationType').optional().isIn(['email', 'sms', 'in-app']).withMessage('Valid notification type is required'),
];

module.exports = {
  validateRequest,
  validateStudent,
  validateTeacher,
  validateEnrollment,
  validateGrade,
  validateAttendance,
  validatePayment,
  validateNotification,
};
