const express = require('express');
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../../../shared/auth');

const router = express.Router();
const controller = new AuthController();

/**
 * Auth Service Routes
 */

// Register
router.post(
  '/register',
  (req, res, next) => controller.register(req, res, next),
);

// Login
router.post(
  '/login',
  (req, res, next) => controller.login(req, res, next),
);

// Verify token
router.post(
  '/verify',
  (req, res, next) => controller.verifyToken(req, res, next),
);

// Get profile
router.get(
  '/profile',
  authMiddleware,
  (req, res, next) => controller.getProfile(req, res, next),
);

// Update profile
router.put(
  '/profile',
  authMiddleware,
  (req, res, next) => controller.updateProfile(req, res, next),
);

// Change password
router.post(
  '/change-password',
  authMiddleware,
  (req, res, next) => controller.changePassword(req, res, next),
);

module.exports = router;
