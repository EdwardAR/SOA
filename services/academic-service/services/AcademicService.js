const pool = require('../../../shared/database');
const { APIError } = require('../../../shared/errors');

/**
 * Academic Service - Business logic
 */
class AcademicService {
  /**
   * Register grades for a student
   */
  async registerGrades(gradeData) {
    try {
      const { studentId, courseId, teacherId, midtermScore, finalScore, recordedDate } = gradeData;

      // Calculate overall score and grade
      const overallScore = (midtermScore + finalScore) / 2;
      let grade = 'F';

      if (overallScore >= 90) grade = 'A';
      else if (overallScore >= 80) grade = 'B';
      else if (overallScore >= 70) grade = 'C';
      else if (overallScore >= 60) grade = 'D';

      const query = `
        INSERT INTO grades (student_id, course_id, teacher_id, midterm_score, final_score, overall_score, grade, recorded_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          midterm_score = VALUES(midterm_score),
          final_score = VALUES(final_score),
          overall_score = VALUES(overall_score),
          grade = VALUES(grade),
          recorded_date = VALUES(recorded_date)
      `;

      const [result] = await pool.execute(query, [
        studentId, courseId, teacherId, midtermScore, finalScore, overallScore, grade, recordedDate,
      ]);

      return {
        id: result.insertId || result.affectedRows,
        studentId,
        courseId,
        teacherId,
        midtermScore,
        finalScore,
        overallScore,
        grade,
        recordedDate,
      };
    } catch (error) {
      throw new APIError(500, 'Failed to register grades', error.message);
    }
  }

  /**
   * Get student's academic history
   */
  async getStudentAcademicHistory(studentId) {
    const query = `
      SELECT g.*, c.name as course_name, c.course_code,
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
   * Get course grades
   */
  async getCourseGrades(courseId) {
    const query = `
      SELECT g.*, s.enrollment_number, s.first_name, s.last_name,
             t.first_name as teacher_first_name, t.last_name as teacher_last_name
      FROM grades g
      LEFT JOIN students s ON g.student_id = s.id
      LEFT JOIN teachers t ON g.teacher_id = t.id
      WHERE g.course_id = ?
      ORDER BY s.first_name
    `;

    const [records] = await pool.execute(query, [courseId]);
    return records;
  }

  /**
   * Get class average
   */
  async getClassAverage(courseId) {
    const query = `
      SELECT 
        AVG(overall_score) as average_score,
        MIN(overall_score) as minimum_score,
        MAX(overall_score) as maximum_score,
        COUNT(*) as total_students
      FROM grades
      WHERE course_id = ?
    `;

    const [result] = await pool.execute(query, [courseId]);
    return result[0];
  }

  /**
   * Get student GPA
   */
  async getStudentGPA(studentId) {
    const query = `
      SELECT 
        AVG(overall_score) as gpa,
        COUNT(*) as total_courses,
        SUM(CASE WHEN grade = 'A' THEN 1 ELSE 0 END) as grade_a_count,
        SUM(CASE WHEN grade = 'B' THEN 1 ELSE 0 END) as grade_b_count,
        SUM(CASE WHEN grade = 'C' THEN 1 ELSE 0 END) as grade_c_count,
        SUM(CASE WHEN grade = 'D' THEN 1 ELSE 0 END) as grade_d_count,
        SUM(CASE WHEN grade = 'F' THEN 1 ELSE 0 END) as grade_f_count
      FROM grades
      WHERE student_id = ?
    `;

    const [result] = await pool.execute(query, [studentId]);
    return result[0];
  }

  /**
   * Update grade
   */
  async updateGrade(gradeId, updateData) {
    const { midtermScore, finalScore } = updateData;
    const overallScore = (midtermScore + finalScore) / 2;

    let grade = 'F';
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 80) grade = 'B';
    else if (overallScore >= 70) grade = 'C';
    else if (overallScore >= 60) grade = 'D';

    const query = `
      UPDATE grades 
      SET midterm_score = ?, final_score = ?, overall_score = ?, grade = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [midtermScore, finalScore, overallScore, grade, gradeId]);

    if (result.affectedRows === 0) {
      throw new APIError(404, 'Grade not found');
    }

    const [updated] = await pool.execute('SELECT * FROM grades WHERE id = ?', [gradeId]);
    return updated[0];
  }
}

module.exports = AcademicService;
