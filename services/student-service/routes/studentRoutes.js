const express = require('express');
const StudentController = require('../controllers/StudentController');
const { authMiddleware } = require('../../../shared/auth');
const { validateStudent, validateRequest } = require('../../../shared/validators');

const router = express.Router();
const controller = new StudentController();

/**
 * Student Service Routes
 */

// Register a new student
router.post(
  '/',
  validateStudent,
  validateRequest,
  (req, res, next) => controller.registerStudent(req, res, next),
);

// Get all students
router.get(
  '/',
  authMiddleware,
  (req, res, next) => controller.getAllStudents(req, res, next),
);

// Search students
router.get(
  '/search',
  authMiddleware,
  (req, res, next) => controller.searchStudents(req, res, next),
);

// Get student by ID
router.get(
  '/:id',
  authMiddleware,
  (req, res, next) => controller.getStudent(req, res, next),
);

// Get student academic record
router.get(
  '/:id/academic-record',
  authMiddleware,
  (req, res, next) => controller.getAcademicRecord(req, res, next),
);

// Get student enrollment history
router.get(
  '/:id/enrollment-history',
  authMiddleware,
  (req, res, next) => controller.getEnrollmentHistory(req, res, next),
);

// Update student
router.put(
  '/:id',
  authMiddleware,
  (req, res, next) => controller.updateStudent(req, res, next),
);

// Delete student
router.delete(
  '/:id',
  authMiddleware,
  (req, res, next) => controller.deleteStudent(req, res, next),
);

module.exports = router;
