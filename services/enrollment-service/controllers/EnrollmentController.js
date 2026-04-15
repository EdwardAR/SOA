const EnrollmentService = require('../services/EnrollmentService');
const { asyncHandler } = require('../../../shared/errors');

/**
 * Enrollment Controller
 */
class EnrollmentController {
  constructor() {
    this.service = new EnrollmentService();
  }

  /**
   * Enroll student in classroom
   */
  enrollStudent = asyncHandler(async (req, res) => {
    const { studentId, classroomId, enrollmentDate } = req.body;

    const enrollment = await this.service.enrollStudent({
      studentId,
      classroomId,
      enrollmentDate,
    });

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: enrollment,
    });
  });

  /**
   * Get student enrollments
   */
  getStudentEnrollments = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const enrollments = await this.service.getStudentEnrollments(studentId);

    res.json({
      success: true,
      data: enrollments,
    });
  });

  /**
   * Get classroom enrollments
   */
  getClassroomEnrollments = asyncHandler(async (req, res) => {
    const { classroomId } = req.params;
    const enrollments = await this.service.getClassroomEnrollments(classroomId);

    res.json({
      success: true,
      data: enrollments,
      totalEnrollments: enrollments.length,
    });
  });

  /**
   * Update enrollment status
   */
  updateEnrollmentStatus = asyncHandler(async (req, res) => {
    const { enrollmentId } = req.params;
    const { status } = req.body;

    const enrollment = await this.service.updateEnrollmentStatus(enrollmentId, status);

    res.json({
      success: true,
      message: 'Enrollment status updated',
      data: enrollment,
    });
  });

  /**
   * Delete enrollment
   */
  deleteEnrollment = asyncHandler(async (req, res) => {
    const { enrollmentId } = req.params;
    await this.service.deleteEnrollment(enrollmentId);

    res.json({
      success: true,
      message: 'Enrollment deleted successfully',
    });
  });

  /**
   * Get enrollments by date range
   */
  getEnrollmentsByDateRange = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const enrollments = await this.service.getEnrollmentsByDateRange(startDate, endDate);

    res.json({
      success: true,
      data: enrollments,
    });
  });
}

module.exports = EnrollmentController;
