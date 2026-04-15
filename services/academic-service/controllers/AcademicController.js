const AcademicService = require('../services/AcademicService');
const { asyncHandler } = require('../../../shared/errors');

/**
 * Academic Controller
 */
class AcademicController {
  constructor() {
    this.service = new AcademicService();
  }

  /**
   * Register grades
   */
  registerGrades = asyncHandler(async (req, res) => {
    const { studentId, courseId, teacherId, midtermScore, finalScore, recordedDate } = req.body;

    const grade = await this.service.registerGrades({
      studentId,
      courseId,
      teacherId,
      midtermScore,
      finalScore,
      recordedDate,
    });

    res.status(201).json({
      success: true,
      message: 'Grades registered successfully',
      data: grade,
    });
  });

  /**
   * Get student academic history
   */
  getStudentHistory = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const history = await this.service.getStudentAcademicHistory(studentId);

    res.json({
      success: true,
      data: history,
    });
  });

  /**
   * Get course grades
   */
  getCourseGrades = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const grades = await this.service.getCourseGrades(courseId);

    res.json({
      success: true,
      data: grades,
      totalStudents: grades.length,
    });
  });

  /**
   * Get class average
   */
  getClassAverage = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const average = await this.service.getClassAverage(courseId);

    res.json({
      success: true,
      data: average,
    });
  });

  /**
   * Get student GPA
   */
  getStudentGPA = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const gpa = await this.service.getStudentGPA(studentId);

    res.json({
      success: true,
      data: gpa,
    });
  });

  /**
   * Update grade
   */
  updateGrade = asyncHandler(async (req, res) => {
    const { gradeId } = req.params;
    const { midtermScore, finalScore } = req.body;

    const updated = await this.service.updateGrade(gradeId, { midtermScore, finalScore });

    res.json({
      success: true,
      message: 'Grade updated successfully',
      data: updated,
    });
  });
}

module.exports = AcademicController;
