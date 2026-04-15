const AttendanceService = require('../services/AttendanceService');
const { asyncHandler } = require('../../../shared/errors');

/**
 * Attendance Controller
 */
class AttendanceController {
  constructor() {
    this.service = new AttendanceService();
  }

  /**
   * Mark attendance
   */
  markAttendance = asyncHandler(async (req, res) => {
    const {
      studentId, classroomId, attendanceDate, status, remarks, markedBy,
    } = req.body;

    const attendance = await this.service.markAttendance({
      studentId,
      classroomId,
      attendanceDate,
      status,
      remarks,
      markedBy,
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance,
    });
  });

  /**
   * Get student attendance
   */
  getStudentAttendance = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const records = await this.service.getStudentAttendance(studentId, startDate, endDate);

    res.json({
      success: true,
      data: records,
    });
  });

  /**
   * Get classroom attendance report
   */
  getClassroomReport = asyncHandler(async (req, res) => {
    const { classroomId, attendanceDate } = req.query;

    if (!attendanceDate) {
      return res.status(400).json({
        success: false,
        message: 'attendanceDate query parameter is required',
      });
    }

    const records = await this.service.getClassroomAttendanceReport(classroomId, attendanceDate);

    res.json({
      success: true,
      data: records,
      date: attendanceDate,
    });
  });

  /**
   * Get attendance summary
   */
  getAttendanceSummary = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const summary = await this.service.getAttendanceSummary(studentId, startDate, endDate);

    res.json({
      success: true,
      data: summary,
    });
  });

  /**
   * Get monthly attendance report
   */
  getMonthlyReport = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'month and year query parameters are required',
      });
    }

    const records = await this.service.getMonthlyAttendanceReport(studentId, month, year);

    res.json({
      success: true,
      data: records,
      period: `${month}/${year}`,
    });
  });

  /**
   * Update attendance
   */
  updateAttendance = asyncHandler(async (req, res) => {
    const { attendanceId } = req.params;
    const { status, remarks } = req.body;

    const updated = await this.service.updateAttendance(attendanceId, { status, remarks });

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: updated,
    });
  });
}

module.exports = AttendanceController;
