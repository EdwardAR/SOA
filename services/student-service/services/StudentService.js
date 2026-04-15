const bcrypt = require('bcryptjs');
const pool = require('../../../shared/database');
const StudentRepository = require('../repositories/StudentRepository');
const { APIError } = require('../../../shared/errors');

/**
 * Student Service - Business logic layer
 */
class StudentService {
  constructor() {
    this.repository = new StudentRepository();
  }

  /**
   * Register a new student
   */
  async registerStudent(studentData) {
    try {
      // Check if enrollment number already exists
      const existingStudent = await this.repository.findByEnrollmentNumber(
        studentData.enrollmentNumber,
      );

      if (existingStudent) {
        throw new APIError(409, 'Student with this enrollment number already exists');
      }

      // Create user account
      const hashedPassword = await bcrypt.hash(studentData.password, 10);
      const userQuery = `
        INSERT INTO users (username, email, password_hash, role) 
        VALUES (?, ?, ?, 'student')
      `;

      const [userResult] = await pool.execute(userQuery, [
        studentData.email,
        studentData.email,
        hashedPassword,
      ]);

      // Create student record
      const studentPayload = {
        userId: userResult.insertId,
        enrollmentNumber: studentData.enrollmentNumber,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        dateOfBirth: studentData.dateOfBirth,
        gender: studentData.gender,
        phone: studentData.phone || null,
        address: studentData.address || null,
        city: studentData.city || null,
        state: studentData.state || null,
        postalCode: studentData.postalCode || null,
      };

      const student = await this.repository.create(studentPayload);
      return student;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, 'Failed to register student', error.message);
    }
  }

  /**
   * Get student by ID
   */
  async getStudentById(id) {
    const student = await this.repository.findById(id);

    if (!student) {
      throw new APIError(404, 'Student not found');
    }

    return student;
  }

  /**
   * Get all students
   */
  async getAllStudents(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const students = await this.repository.findAll(limit, offset);
    return students;
  }

  /**
   * Update student information
   */
  async updateStudent(id, updateData) {
    const student = await this.repository.findById(id);

    if (!student) {
      throw new APIError(404, 'Student not found');
    }

    const updatedStudent = await this.repository.update(id, updateData);
    return updatedStudent;
  }

  /**
   * Delete student
   */
  async deleteStudent(id) {
    const student = await this.repository.findById(id);

    if (!student) {
      throw new APIError(404, 'Student not found');
    }

    const result = await this.repository.delete(id);

    if (!result) {
      throw new APIError(500, 'Failed to delete student');
    }

    return { message: 'Student deleted successfully' };
  }

  /**
   * Search students
   */
  async searchStudents(criteria) {
    return await this.repository.search(criteria);
  }

  /**
   * Get student's academic record
   */
  async getStudentAcademicRecord(studentId) {
    const student = await this.repository.findById(studentId);

    if (!student) {
      throw new APIError(404, 'Student not found');
    }

    const query = `
      SELECT 
        g.*, c.name as course_name, c.course_code,
        t.first_name as teacher_first_name, t.last_name as teacher_last_name
      FROM grades g
      LEFT JOIN courses c ON g.course_id = c.id
      LEFT JOIN teachers t ON g.teacher_id = t.id
      WHERE g.student_id = ?
      ORDER BY g.recorded_date DESC
    `;

    const [records] = await pool.execute(query, [studentId]);
    return records;
  }

  /**
   * Get student's enrollment history
   */
  async getStudentEnrollmentHistory(studentId) {
    const student = await this.repository.findById(studentId);

    if (!student) {
      throw new APIError(404, 'Student not found');
    }

    const query = `
      SELECT e.*, c.name as classroom_name, c.grade_level
      FROM enrollments e
      LEFT JOIN classrooms c ON e.classroom_id = c.id
      WHERE e.student_id = ?
      ORDER BY e.enrollment_date DESC
    `;

    const [records] = await pool.execute(query, [studentId]);
    return records;
  }
}

module.exports = StudentService;
