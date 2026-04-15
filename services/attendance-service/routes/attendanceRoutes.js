const express = require('express');
const AttendanceController = require('../controllers/AttendanceController');
const { authMiddleware } = require('../../../shared/auth');
const { validateAttendance, validateRequest } = require('../../../shared/validators');

const router = express.Router();
const controller = new AttendanceController();

/**
 * Attendance Service Routes
 */

// Mark attendance
router.post(
  '/',
  authMiddleware,
  validateAttendance,
  validateRequest,
  (req, res, next) => controller.markAttendance(req, res, next),
);

// Get student attendance
router.get(
  '/students/:studentId',
  authMiddleware,
  (req, res, next) => controller.getStudentAttendance(req, res, next),
);

// Get attendance summary
router.get(
  '/students/:studentId/summary',
  authMiddleware,
  (req, res, next) => controller.getAttendanceSummary(req, res, next),
);

// Get monthly report
router.get(
  '/students/:studentId/monthly',
  authMiddleware,
  (req, res, next) => controller.getMonthlyReport(req, res, next),
);

// Get classroom report
router.get(
  '/report/classroom',
  authMiddleware,
  (req, res, next) => controller.getClassroomReport(req, res, next),
);

// Update attendance
router.put(
  '/:attendanceId',
  authMiddleware,
  (req, res, next) => controller.updateAttendance(req, res, next),
);

module.exports = router;
