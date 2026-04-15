const express = require('express');
const EnrollmentController = require('../controllers/EnrollmentController');
const { authMiddleware } = require('../../../shared/auth');
const { validateEnrollment, validateRequest } = require('../../../shared/validators');

const router = express.Router();
const controller = new EnrollmentController();

/**
 * Enrollment Service Routes
 */

// Enroll student
router.post(
  '/',
  authMiddleware,
  validateEnrollment,
  validateRequest,
  (req, res, next) => controller.enrollStudent(req, res, next),
);

// Get student enrollments
router.get(
  '/student/:studentId',
  authMiddleware,
  (req, res, next) => controller.getStudentEnrollments(req, res, next),
);

// Get classroom enrollments
router.get(
  '/classroom/:classroomId',
  authMiddleware,
  (req, res, next) => controller.getClassroomEnrollments(req, res, next),
);

// Get enrollments by date range
router.get(
  '/date-range/report',
  authMiddleware,
  (req, res, next) => controller.getEnrollmentsByDateRange(req, res, next),
);

// Update enrollment status
router.put(
  '/:enrollmentId/status',
  authMiddleware,
  (req, res, next) => controller.updateEnrollmentStatus(req, res, next),
);

// Delete enrollment
router.delete(
  '/:enrollmentId',
  authMiddleware,
  (req, res, next) => controller.deleteEnrollment(req, res, next),
);

module.exports = router;
