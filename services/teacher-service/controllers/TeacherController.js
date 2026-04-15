const TeacherService = require('../services/TeacherService');
const { asyncHandler } = require('../../../shared/errors');

/**
 * Teacher Controller
 */
class TeacherController {
  constructor() {
    this.service = new TeacherService();
  }

  /**
   * Create teacher
   */
  createTeacher = asyncHandler(async (req, res) => {
    const teacherData = {
      employeeId: req.body.employeeId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      specialization: req.body.specialization,
      phone: req.body.phone,
      hireDate: req.body.hireDate,
    };

    const teacher = await this.service.createTeacher(teacherData);

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: teacher,
    });
  });

  /**
   * Get teacher
   */
  getTeacher = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const teacher = await this.service.getTeacherById(id);

    res.json({
      success: true,
      data: teacher,
    });
  });

  /**
   * Get all teachers
   */
  getAllTeachers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const teachers = await this.service.getAllTeachers(limit, offset);

    res.json({
      success: true,
      data: teachers,
      pagination: { page, limit },
    });
  });

  /**
   * Update teacher
   */
  updateTeacher = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const teacher = await this.service.updateTeacher(id, req.body);

    res.json({
      success: true,
      message: 'Teacher updated successfully',
      data: teacher,
    });
  });

  /**
   * Assign teacher to course
   */
  assignCourse = asyncHandler(async (req, res) => {
    const { teacherId } = req.params;
    const { courseId } = req.body;

    const assignment = await this.service.assignTeacherToCourse(teacherId, courseId);

    res.status(201).json({
      success: true,
      message: 'Teacher assigned to course successfully',
      data: assignment,
    });
  });

  /**
   * Get teacher courses
   */
  getCourses = asyncHandler(async (req, res) => {
    const { teacherId } = req.params;
    const courses = await this.service.getTeacherCourses(teacherId);

    res.json({
      success: true,
      data: courses,
    });
  });

  /**
   * Delete teacher
   */
  deleteTeacher = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await this.service.deleteTeacher(id);

    res.json({
      success: true,
      message: 'Teacher deleted successfully',
    });
  });
}

module.exports = TeacherController;
