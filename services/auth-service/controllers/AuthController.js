const AuthService = require('../services/AuthService');
const { asyncHandler } = require('../../../shared/errors');

/**
 * Auth Controller
 */
class AuthController {
  constructor() {
    this.service = new AuthService();
  }

  /**
   * Register user
   */
  register = asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body;

    const user = await this.service.register({
      username,
      email,
      password,
      role,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: user,
    });
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await this.service.login({
      email,
      password,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: user,
    });
  });

  /**
   * Verify token
   */
  verifyToken = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No token provided',
      });
    }

    const result = await this.service.verifyTokenValidity(token);

    res.json({
      success: result.valid,
      message: result.valid ? 'Token is valid' : result.message,
      data: result.user || null,
    });
  });

  /**
   * Get profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const profile = await this.service.getUserProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  });

  /**
   * Update profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { username, email } = req.body;

    const profile = await this.service.updateProfile(userId, { username, email });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile,
    });
  });

  /**
   * Change password
   */
  changePassword = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    await this.service.changePassword(userId, { currentPassword, newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  });
}

module.exports = AuthController;
