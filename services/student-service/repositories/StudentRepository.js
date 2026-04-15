const pool = require('../../../shared/database');

/**
 * Student Repository - Data access layer
 */
class StudentRepository {
  /**
   * Create a new student
   */
  async create(studentData) {
    const {
      userId, enrollmentNumber, firstName, lastName, dateOfBirth, gender, phone, address, city, state, postalCode,
    } = studentData;

    const query = `
      INSERT INTO students (
        user_id, enrollment_number, first_name, last_name, date_of_birth, gender, phone, address, city, state, postal_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      userId, enrollmentNumber, firstName, lastName, dateOfBirth, gender, phone, address, city, state, postalCode,
    ]);

    return { id: result.insertId, ...studentData };
  }

  /**
   * Get student by ID
   */
  async findById(id) {
    const query = `
      SELECT s.*, u.email, u.username, u.role 
      FROM students s 
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE s.id = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get all students
   */
  async findAll(limit = 50, offset = 0) {
    const query = `
      SELECT s.*, u.email, u.username, u.role 
      FROM students s 
      LEFT JOIN users u ON s.user_id = u.id 
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [limit, offset]);
    return rows;
  }

  /**
   * Get student by enrollment number
   */
  async findByEnrollmentNumber(enrollmentNumber) {
    const query = `
      SELECT s.*, u.email, u.username, u.role 
      FROM students s 
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE s.enrollment_number = ?
    `;

    const [rows] = await pool.execute(query, [enrollmentNumber]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Update student
   */
  async update(id, updateData) {
    const allowedFields = [
      'firstName', 'lastName', 'dateOfBirth', 'gender', 'phone', 'address', 'city', 'state', 'postalCode',
    ];

    const fields = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key) => {
        const fieldMap = {
          firstName: 'first_name',
          lastName: 'last_name',
          dateOfBirth: 'date_of_birth',
          postalCode: 'postal_code',
        };
        return `${fieldMap[key] || key} = ?`;
      });

    if (fields.length === 0) return null;

    const values = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key) => updateData[key]);

    const query = `UPDATE students SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0 ? await this.findById(id) : null;
  }

  /**
   * Delete student
   */
  async delete(id) {
    const query = 'DELETE FROM students WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Search students
   */
  async search(criteria) {
    let query = 'SELECT s.*, u.email FROM students s LEFT JOIN users u ON s.user_id = u.id WHERE 1=1';
    const params = [];

    if (criteria.firstName) {
      query += ' AND s.first_name LIKE ?';
      params.push(`%${criteria.firstName}%`);
    }

    if (criteria.lastName) {
      query += ' AND s.last_name LIKE ?';
      params.push(`%${criteria.lastName}%`);
    }

    query += ' LIMIT 50';

    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

module.exports = StudentRepository;
