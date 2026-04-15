const pool = require('../../../shared/database');
const { APIError } = require('../../../shared/errors');

/**
 * Attendance Service - Business logic
 */
class AttendanceService {
  /**
   * Mark attendance
   */
  async markAttendance(attendanceData) {
    try {
      const { studentId, classroomId, attendanceDate, status, remarks, markedBy } = attendanceData;

      const query = `
        INSERT INTO attendance (student_id, classroom_id, attendance_date, status, remarks, marked_by)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          status = VALUES(status),
          remarks = VALUES(remarks),
          marked_by = VALUES(marked_by),
          updated_at = NOW()
      `;

      const [result] = await pool.execute(query, [
        studentId, classroomId, attendanceDate, status, remarks, markedBy,
      ]);

      return {
        id: result.insertId,
        studentId,
        classroomId,
        attendanceDate,
        status,
        remarks,
        markedBy,
      };
    } catch (error) {
      throw new APIError(500, 'Failed to mark attendance', error.message);
    }
  }

  /**
   * Get student attendance
   */
  async getStudentAttendance(studentId, startDate = null, endDate = null) {
    let query = `
      SELECT a.*, c.name as classroom_name, 
             t.first_name as marked_by_first_name, t.last_name as marked_by_last_name
      FROM attendance a
      LEFT JOIN classrooms c ON a.classroom_id = c.id
      LEFT JOIN teachers t ON a.marked_by = t.id
      WHERE a.student_id = ?
    `;

    const params = [studentId];

    if (startDate && endDate) {
      query += ' AND a.attendance_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY a.attendance_date DESC';

    const [records] = await pool.execute(query, params);
    return records;
  }

  /**
   * Get attendance report for classroom
   */
  async getClassroomAttendanceReport(classroomId, attendanceDate) {
    const query = `
      SELECT a.*, s.enrollment_number, s.first_name, s.last_name
      FROM attendance a
      LEFT JOIN students s ON a.student_id = s.id
      WHERE a.classroom_id = ? AND a.attendance_date = ?
      ORDER BY s.first_name
    `;

    const [records] = await pool.execute(query, [classroomId, attendanceDate]);
    return records;
  }

  /**
   * Get attendance summary
   */
  async getAttendanceSummary(studentId, startDate = null, endDate = null) {
    let query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM attendance
      WHERE student_id = ?
    `;

    const params = [studentId];

    if (startDate && endDate) {
      query += ' AND attendance_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' GROUP BY status';

    const [records] = await pool.execute(query, params);

    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    records.forEach((record) => {
      summary[record.status] = record.count;
    });

    return summary;
  }

  /**
   * Get monthly attendance report
   */
  async getMonthlyAttendanceReport(studentId, month, year) {
    const query = `
      SELECT 
        DATE(attendance_date) as date,
        status,
        COUNT(*) as count
      FROM attendance
      WHERE student_id = ? 
        AND MONTH(attendance_date) = ? 
        AND YEAR(attendance_date) = ?
      GROUP BY DATE(attendance_date), status
      ORDER BY attendance_date ASC
    `;

    const [records] = await pool.execute(query, [studentId, month, year]);
    return records;
  }

  /**
   * Update attendance
   */
  async updateAttendance(attendanceId, updateData) {
    const { status, remarks } = updateData;

    const query = `
      UPDATE attendance 
      SET status = ?, remarks = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [status, remarks, attendanceId]);

    if (result.affectedRows === 0) {
      throw new APIError(404, 'Attendance record not found');
    }

    const [updated] = await pool.execute('SELECT * FROM attendance WHERE id = ?', [attendanceId]);
    return updated[0];
  }
}

module.exports = AttendanceService;
