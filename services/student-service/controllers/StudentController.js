const StudentService = require('../services/StudentService');
const { asyncHandler } = require('../../../shared/errors');

/**
 * Student Controller - HTTP request handler layer
 */
class StudentController {
  constructor() {
    this.service = new StudentService();
  }

  /**
   * Register a new student
   */
  registerStudent = asyncHandler(async (req, res) => {
    const studentData = {
      enrollmentNumber: req.body.enrollmentNumber,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
    };

    const student = await this.service.registerStudent(studentData);

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: student,
    });
  });

  /**
   * Get student by ID
   */
  getStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const student = await this.service.getStudentById(id);

    res.json({
      success: true,
      data: student,
    });
  });

  /**
   * Get all students
   */
  getAllStudents = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const students = await this.service.getAllStudents(page, limit);

    res.json({
      success: true,
      data: students,
      pagination: { page, limit },
    });
  });

  /**
   * Update student
   */
  updateStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
    };

    const student = await this.service.updateStudent(id, updateData);

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    });
  });

  /**
   * Delete student
   */
  deleteStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await this.service.deleteStudent(id);

    res.json({
      success: true,
      message: 'Student deleted successfully',
    });
  });

  /**
   * Search students
   */
  searchStudents = asyncHandler(async (req, res) => {
    const criteria = {
      firstName: req.query.firstName,
      lastName: req.query.lastName,
      grade: req.query.grade,
    };

    const students = await this.service.searchStudents(criteria);

    res.json({
      success: true,
      data: students,
    });
  });

  /**
   * Get student academic record
   */
  getAcademicRecord = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const record = await this.service.getStudentAcademicRecord(id);

    res.json({
      success: true,
      data: record,
    });
  });

  /**
   * Get student enrollment history
   */
  getEnrollmentHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const history = await this.service.getStudentEnrollmentHistory(id);

    res.json({
      success: true,
      data: history,
    });
  });
}

module.exports = StudentController;
