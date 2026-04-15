const pool = require('../../../shared/database');
const { APIError } = require('../../../shared/errors');

/**
 * Enrollment Service - Business logic
 */
class EnrollmentService {
  /**
   * Enroll student in a classroom
   */
  async enrollStudent(enrollmentData) {
    try {
      const { studentId, classroomId, enrollmentDate } = enrollmentData;

      // Check if student exists
      const [students] = await pool.execute('SELECT id FROM students WHERE id = ?', [studentId]);
      if (students.length === 0) {
        throw new APIError(404, 'Student not found');
      }

      // Check if classroom exists
      const [classrooms] = await pool.execute('SELECT id FROM classrooms WHERE id = ?', [classroomId]);
      if (classrooms.length === 0) {
        throw new APIError(404, 'Classroom not found');
      }

      // Check if enrollment already exists
      const [existing] = await pool.execute(
        'SELECT id FROM enrollments WHERE student_id = ? AND classroom_id = ?',
        [studentId, classroomId],
      );
      if (existing.length > 0) {
        throw new APIError(409, 'Student is already enrolled in this classroom');
      }

      // Create enrollment
      const query = `
        INSERT INTO enrollments (student_id, classroom_id, enrollment_date, status)
        VALUES (?, ?, ?, 'active')
      `;
      const [result] = await pool.execute(query, [studentId, classroomId, enrollmentDate]);

      return {
        id: result.insertId,
        studentId,
        classroomId,
        enrollmentDate,
        status: 'active',
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, 'Enrollment failed', error.message);
    }
  }

  /**
   * Get student enrollments
   */
  async getStudentEnrollments(studentId) {
    const query = `
      SELECT e.*, c.name as classroom_name, c.grade_level
      FROM enrollments e
      LEFT JOIN classrooms c ON e.classroom_id = c.id
      WHERE e.student_id = ?
      ORDER BY e.enrollment_date DESC
    `;

    const [enrollments] = await pool.execute(query, [studentId]);
    return enrollments;
  }

  /**
   * Get classroom enrollments
   */
  async getClassroomEnrollments(classroomId) {
    const query = `
      SELECT e.*, s.enrollment_number, s.first_name, s.last_name
      FROM enrollments e
      LEFT JOIN students s ON e.student_id = s.id
      WHERE e.classroom_id = ? AND e.status = 'active'
      ORDER BY s.first_name
    `;

    const [enrollments] = await pool.execute(query, [classroomId]);
    return enrollments;
  }

  /**
   * Update enrollment status
   */
  async updateEnrollmentStatus(enrollmentId, status) {
    const validStatuses = ['active', 'graduated', 'dropped', 'suspended'];

    if (!validStatuses.includes(status)) {
      throw new APIError(400, 'Invalid enrollment status');
    }

    const query = 'UPDATE enrollments SET status = ? WHERE id = ?';
    const [result] = await pool.execute(query, [status, enrollmentId]);

    if (result.affectedRows === 0) {
      throw new APIError(404, 'Enrollment not found');
    }

    const [updated] = await pool.execute('SELECT * FROM enrollments WHERE id = ?', [enrollmentId]);
    return updated[0];
  }

  /**
   * Delete enrollment
   */
  async deleteEnrollment(enrollmentId) {
    const query = 'DELETE FROM enrollments WHERE id = ?';
    const [result] = await pool.execute(query, [enrollmentId]);

    if (result.affectedRows === 0) {
      throw new APIError(404, 'Enrollment not found');
    }

    return { message: 'Enrollment deleted successfully' };
  }

  /**
   * Get enrollments by date range
   */
  async getEnrollmentsByDateRange(startDate, endDate) {
    const query = `
      SELECT e.*, s.enrollment_number, s.first_name, s.last_name, c.name as classroom_name
      FROM enrollments e
      LEFT JOIN students s ON e.student_id = s.id
      LEFT JOIN classrooms c ON e.classroom_id = c.id
      WHERE e.enrollment_date BETWEEN ? AND ?
      ORDER BY e.enrollment_date DESC
    `;

    const [enrollments] = await pool.execute(query, [startDate, endDate]);
    return enrollments;
  }
}

module.exports = EnrollmentService;
