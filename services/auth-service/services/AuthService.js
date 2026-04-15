const bcrypt = require('bcryptjs');
const pool = require('../../../shared/database');
const { generateToken, verifyToken } = require('../../../shared/auth');
const { APIError } = require('../../../shared/errors');

/**
 * Auth Service - Business logic
 */
class AuthService {
  /**
   * Register a new user
   */
  async register(registrationData) {
    try {
      const { username, email, password, role } = registrationData;

      // Check if user already exists
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email],
      );

      if (existing.length > 0) {
        throw new APIError(409, 'Username or email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const query = `
        INSERT INTO users (username, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `;

      const [result] = await pool.execute(query, [
        username,
        email,
        hashedPassword,
        role || 'student',
      ]);

      // Generate token
      const token = generateToken(result.insertId, username, email, role || 'student');

      return {
        id: result.insertId,
        username,
        email,
        role: role || 'student',
        token,
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, 'Registration failed', error.message);
    }
  }

  /**
   * Login user
   */
  async login(credentials) {
    try {
      const { email, password } = credentials;

      // Get user
      const [users] = await pool.execute(
        'SELECT id, username, email, password_hash, role FROM users WHERE email = ?',
        [email],
      );

      if (users.length === 0) {
        throw new APIError(401, 'Invalid email or password');
      }

      const user = users[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        throw new APIError(401, 'Invalid email or password');
      }

      // Generate token
      const token = generateToken(user.id, user.username, user.email, user.role);

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        token,
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, 'Login failed', error.message);
    }
  }

  /**
   * Verify token
   */
  async verifyTokenValidity(token) {
    try {
      const decoded = verifyToken(token);
      return {
        valid: true,
        user: decoded,
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message,
      };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    const query = 'SELECT id, username, email, role, created_at FROM users WHERE id = ?';
    const [users] = await pool.execute(query, [userId]);

    if (users.length === 0) {
      throw new APIError(404, 'User not found');
    }

    return users[0];
  }

  /**
   * Change password
   */
  async changePassword(userId, passwordData) {
    try {
      const { currentPassword, newPassword } = passwordData;

      // Get user
      const [users] = await pool.execute(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId],
      );

      if (users.length === 0) {
        throw new APIError(404, 'User not found');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);

      if (!isPasswordValid) {
        throw new APIError(401, 'Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const query = 'UPDATE users SET password_hash = ? WHERE id = ?';
      await pool.execute(query, [hashedPassword, userId]);

      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, 'Failed to change password', error.message);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, profileData) {
    try {
      const { username, email } = profileData;

      // Check if email already exists
      if (email) {
        const [existing] = await pool.execute(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, userId],
        );

        if (existing.length > 0) {
          throw new APIError(409, 'Email already exists');
        }
      }

      const updateFields = [];
      const updateValues = [];

      if (username) {
        updateFields.push('username = ?');
        updateValues.push(username);
      }

      if (email) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }

      if (updateFields.length === 0) {
        return await this.getUserProfile(userId);
      }

      updateValues.push(userId);

      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      await pool.execute(query, updateValues);

      return await this.getUserProfile(userId);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, 'Failed to update profile', error.message);
    }
  }
}

module.exports = AuthService;
