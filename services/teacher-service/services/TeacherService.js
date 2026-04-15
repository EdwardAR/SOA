const pool = require('../../../shared/database');
const bcrypt = require('bcryptjs');
const { APIError } = require('../../../shared/errors');

/**
 * Teacher Service - Business logic
 */
class TeacherService {
  /**
   * Create a new teacher
   */
  async createTeacher(teacherData) {
    try {
      const hashedPassword = await bcrypt.hash(teacherData.password, 10);

      // Create user account
      const userQuery = `
        INSERT INTO users (username, email, password_hash, role) 
        VALUES (?, ?, ?, 'teacher')
      `;

      const [userResult] = await pool.execute(userQuery, [
        teacherData.email,
        teacherData.email,
        hashedPassword,
      ]);

      // Create teacher record
      const teacherQuery = `
        INSERT INTO teachers (user_id, employee_id, first_name, last_name, specialization, phone, email, hire_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.execute(teacherQuery, [
        userResult.insertId,
        teacherData.employeeId,
        teacherData.firstName,
        teacherData.lastName,
        teacherData.specialization,
        teacherData.phone,
        teacherData.email,
        teacherData.hireDate,
      ]);

      return {
        id: result.insertId,
        userId: userResult.insertId,
        ...teacherData,
      };
    } catch (error) {
      throw new APIError(500, 'Failed to create teacher', error.message);
    }
  }

  /**
   * Get teacher by ID
   */
  async getTeacherById(id) {
    const query = `
      SELECT t.*, u.email, u.username, u.role 
      FROM teachers t 
      LEFT JOIN users u ON t.user_id = u.id 
      WHERE t.id = ?
    `;

    const [rows] = await pool.execute(query, [id]);

    if (rows.length === 0) {
      throw new APIError(404, 'Teacher not found');
    }

    return rows[0];
  }

  /**
   * Get all teachers
   */
  async getAllTeachers(limit = 50, offset = 0) {
    const query = `
      SELECT t.*, u.email, u.username 
      FROM teachers t 
      LEFT JOIN users u ON t.user_id = u.id 
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [limit, offset]);
    return rows;
  }

  /**
   * Update teacher
   */
  async updateTeacher(id, updateData) {
    const allowedFields = ['firstName', 'lastName', 'specialization', 'phone', 'address'];

    const fields = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key) => {
        const fieldMap = {
          firstName: 'first_name',
          lastName: 'last_name',
        };
        return `${fieldMap[key] || key} = ?`;
      });

    if (fields.length === 0) return null;

    const values = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key) => updateData[key]);

    const query = `UPDATE teachers SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    const [result] = await pool.execute(query, values);

    if (result.affectedRows === 0) {
      throw new APIError(404, 'Teacher not found');
    }

    return await this.getTeacherById(id);
  }

  /**
   * Assign teacher to course
   */
  async assignTeacherToCourse(teacherId, courseId) {
    try {
      // Check if teacher exists
      const [teachers] = await pool.execute('SELECT id FROM teachers WHERE id = ?', [teacherId]);
      if (teachers.length === 0) {
        throw new APIError(404, 'Teacher not found');
      }

      // Check if course exists
      const [courses] = await pool.execute('SELECT id FROM courses WHERE id = ?', [courseId]);
      if (courses.length === 0) {
        throw new APIError(404, 'Course not found');
      }

      // Check if assignment already exists
      const [existing] = await pool.execute(
        'SELECT id FROM teacher_courses WHERE teacher_id = ? AND course_id = ?',
        [teacherId, courseId],
      );
      if (existing.length > 0) {
        throw new APIError(409, 'Teacher is already assigned to this course');
      }

      const query = `
        INSERT INTO teacher_courses (teacher_id, course_id, assigned_date)
        VALUES (?, ?, CURDATE())
      `;

      const [result] = await pool.execute(query, [teacherId, courseId]);

      return {
        id: result.insertId,
        teacherId,
        courseId,
        assignedDate: new Date().toISOString().split('T')[0],
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, 'Failed to assign teacher', error.message);
    }
  }

  /**
   * Get teacher's courses
   */
  async getTeacherCourses(teacherId) {
    const query = `
      SELECT tc.*, c.name as course_name, c.course_code, c.description,
             cr.name as classroom_name, cr.grade_level
      FROM teacher_courses tc
      LEFT JOIN courses c ON tc.course_id = c.id
      LEFT JOIN classrooms cr ON c.classroom_id = cr.id
      WHERE tc.teacher_id = ?
      ORDER BY c.name
    `;

    const [courses] = await pool.execute(query, [teacherId]);
    return courses;
  }

  /**
   * Delete teacher
   */
  async deleteTeacher(id) {
    const query = 'DELETE FROM teachers WHERE id = ?';
    const [result] = await pool.execute(query, [id]);

    if (result.affectedRows === 0) {
      throw new APIError(404, 'Teacher not found');
    }

    return { message: 'Teacher deleted successfully' };
  }
}

module.exports = TeacherService;
