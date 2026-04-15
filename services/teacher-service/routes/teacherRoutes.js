const express = require('express');
const TeacherController = require('../controllers/TeacherController');
const { authMiddleware } = require('../../../shared/auth');
const { validateTeacher, validateRequest } = require('../../../shared/validators');

const router = express.Router();
const controller = new TeacherController();

/**
 * Teacher Service Routes
 */

// Create teacher
router.post(
  '/',
  validateTeacher,
  validateRequest,
  (req, res, next) => controller.createTeacher(req, res, next),
);

// Get all teachers
router.get(
  '/',
  authMiddleware,
  (req, res, next) => controller.getAllTeachers(req, res, next),
);

// Get teacher
router.get(
  '/:id',
  authMiddleware,
  (req, res, next) => controller.getTeacher(req, res, next),
);

// Get teacher courses
router.get(
  '/:teacherId/courses',
  authMiddleware,
  (req, res, next) => controller.getCourses(req, res, next),
);

// Update teacher
router.put(
  '/:id',
  authMiddleware,
  (req, res, next) => controller.updateTeacher(req, res, next),
);

// Assign course
router.post(
  '/:teacherId/courses',
  authMiddleware,
  (req, res, next) => controller.assignCourse(req, res, next),
);

// Delete teacher
router.delete(
  '/:id',
  authMiddleware,
  (req, res, next) => controller.deleteTeacher(req, res, next),
);

module.exports = router;
