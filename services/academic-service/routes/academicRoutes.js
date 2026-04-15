const express = require('express');
const AcademicController = require('../controllers/AcademicController');
const { authMiddleware } = require('../../../shared/auth');
const { validateGrade, validateRequest } = require('../../../shared/validators');

const router = express.Router();
const controller = new AcademicController();

/**
 * Academic Service Routes
 */

// Register grades
router.post(
  '/grades',
  authMiddleware,
  validateGrade,
  validateRequest,
  (req, res, next) => controller.registerGrades(req, res, next),
);

// Get student academic history
router.get(
  '/students/:studentId/history',
  authMiddleware,
  (req, res, next) => controller.getStudentHistory(req, res, next),
);

// Get student GPA
router.get(
  '/students/:studentId/gpa',
  authMiddleware,
  (req, res, next) => controller.getStudentGPA(req, res, next),
);

// Get course grades
router.get(
  '/courses/:courseId/grades',
  authMiddleware,
  (req, res, next) => controller.getCourseGrades(req, res, next),
);

// Get course average
router.get(
  '/courses/:courseId/average',
  authMiddleware,
  (req, res, next) => controller.getClassAverage(req, res, next),
);

// Update grade
router.put(
  '/grades/:gradeId',
  authMiddleware,
  (req, res, next) => controller.updateGrade(req, res, next),
);

module.exports = router;
