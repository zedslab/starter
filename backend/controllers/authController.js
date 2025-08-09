/**
 * Authentication Controller
 * Handles authentication-related routes with proper security
 */
const User = require('@/models/common/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('@/config/logger');

class AuthController {
  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        logger.security('Login attempt with missing credentials', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        });
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        logger.security('Login attempt with non-existent email', {
          email,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        logger.security('Login attempt on locked account', {
          userId: user._id,
          email: user.email,
          ip: req.ip,
          lockUntil: user.lockUntil,
          requestId: req.id
        });
        return res.status(423).json({
          error: 'Account Locked',
          message: 'Account is temporarily locked due to too many failed login attempts'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        logger.security('Login attempt on inactive account', {
          userId: user._id,
          email: user.email,
          ip: req.ip,
          requestId: req.id
        });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Account is not active'
        });
      }

      // Verify password using bcrypt
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Increment failed login attempts
        await user.incrementLoginAttempts();
        
        logger.security('Failed login attempt - invalid password', {
          userId: user._id,
          email: user.email,
          ip: req.ip,
          failedAttempts: user.failedLoginAttempts + 1,
          requestId: req.id
        });
        
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Validate JWT secrets
      if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
        logger.error('JWT secrets not configured', { requestId: req.id });
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Authentication service not properly configured'
        });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { 
          id: user._id,
          email: user.email,
          roles: user.roles
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );
      
      const refreshToken = jwt.sign(
        { id: user._id }, 
        process.env.JWT_REFRESH_SECRET, 
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      // Set refresh token in HTTP-only cookie
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth/refresh'
      });

      // Generate CSRF token for session and store user ID
      if (req.session) {
        const security = require('@/config/security');
        const csrfToken = security.generateCsrfToken(req);
        req.session.userId = user._id.toString(); // Store user ID in session
        res.setHeader('X-CSRF-Token', csrfToken);
      }

      // Log successful login
      logger.security('Successful login', {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id
      });

      // Return success response
      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          roles: user.roles
        },
        accessToken,
        expiresIn: 900 // 15 minutes in seconds
      });
    } catch (error) {
      logger.error('Login error:', {
        error: error.message,
        stack: error.stack,
        requestId: req.id
      });
      next(error);
    }
  }

  /**
   * Refresh access token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refresh_token;
      
      if (!refreshToken) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Refresh token not provided'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { 
          id: user._id,
          email: user.email,
          roles: user.roles
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      res.status(200).json({
        message: 'Token refreshed successfully',
        accessToken,
        expiresIn: 900 // 15 minutes in seconds
      });
    } catch (error) {
      logger.error('Token refresh error:', {
        error: error.message,
        stack: error.stack,
        requestId: req.id
      });
      
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token'
        });
      }
      
      next(error);
    }
  }

  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async logout(req, res, next) {
    try {
      // Clear refresh token cookie
      res.clearCookie('refresh_token', {
        path: '/api/auth/refresh'
      });

      // Destroy session if it exists
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            logger.error('Session destruction error:', {
              error: err.message,
              requestId: req.id
            });
          }
        });
      }

      logger.info('User logged out', {
        userId: req.user?.id || null,
        ip: req.ip,
        requestId: req.id
      });

      res.status(200).json({
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', {
        error: error.message,
        stack: error.stack,
        requestId: req.id
      });
      next(error);
    }
  }

  /**
   * Get user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getProfile(req, res, next) {
    try {
      const user = req.user;
      
      res.status(200).json({
        message: 'Profile retrieved successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          username: user.username,
          roles: user.roles,
          phone: user.phone,
          title: user.title,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      logger.error('Get profile error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?._id,
        requestId: req.id
      });
      next(error);
    }
  }

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async updateProfile(req, res, next) {
    try {
      const user = req.user;
      const { firstName, lastName, phone, title, bio } = req.body;

      // Update allowed fields
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (phone !== undefined) user.phone = phone;
      if (title !== undefined) user.title = title;
      if (bio !== undefined) user.bio = bio;

      // Save updated user
      await user.save();

      logger.info('Profile updated', {
        userId: user._id,
        email: user.email,
        updatedFields: Object.keys(req.body),
        requestId: req.id
      });

      res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          phone: user.phone,
          title: user.title,
          bio: user.bio,
          roles: user.roles
        }
      });
    } catch (error) {
      logger.error('Update profile error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?._id,
        requestId: req.id
      });
      next(error);
    }
  }

  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async changePassword(req, res, next) {
    try {
      const user = req.user;
      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        logger.security('Password change attempt with invalid current password', {
          userId: user._id,
          email: user.email,
          ip: req.ip,
          requestId: req.id
        });
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Current password is incorrect'
        });
      }

      // Check if new password was used before
      const wasPasswordUsedBefore = await user.isPasswordUsedBefore(newPassword);
      if (wasPasswordUsedBefore) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'New password cannot be the same as a previously used password'
        });
      }

      // Set new password (this will trigger the pre-save hook to hash it)
      user.password = newPassword;
      await user.save();

      logger.security('Password changed successfully', {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        requestId: req.id
      });

      res.status(200).json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?._id,
        requestId: req.id
      });
      next(error);
    }
  }

  /**
   * Logout from all devices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async logoutAll(req, res, next) {
    try {
      const user = req.user;

      // In a real implementation, you would invalidate all refresh tokens
      // For now, we'll just log the action
      logger.security('User logged out from all devices', {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        requestId: req.id
      });

      // Clear current refresh token cookie
      res.clearCookie('refresh_token', {
        path: '/api/auth/refresh'
      });

      // Destroy current session if it exists
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            logger.error('Session destruction error:', {
              error: err.message,
              requestId: req.id
            });
          }
        });
      }

      res.status(200).json({
        message: 'Logged out from all devices successfully'
      });
    } catch (error) {
      logger.error('Logout all error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?._id,
        requestId: req.id
      });
      next(error);
    }
  }

  /**
   * Get active sessions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getSessions(req, res, next) {
    try {
      const user = req.user;

      // In a real implementation, you would query active sessions from the database
      // For now, we'll return basic session information
      const sessions = [
        {
          id: req.session?.id || 'current',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          lastActivity: new Date(),
          isCurrent: true
        }
      ];

      res.status(200).json({
        message: 'Active sessions retrieved successfully',
        sessions
      });
    } catch (error) {
      logger.error('Get sessions error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?._id,
        requestId: req.id
      });
      next(error);
    }
  }

  /**
   * Register new user (if registration is enabled)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async register(req, res, next) {
    try {
      const { firstName, lastName, email, username, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username }]
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'User with this email or username already exists'
        });
      }

      // Create new user
      const userData = {
        firstName,
        lastName,
        email: email.toLowerCase(),
        username,
        password, // This will be hashed by the pre-save hook
        roles: ['APPLICANT'], // Default role for new users
        isActive: true,
        isEmailVerified: false
      };

      const user = new User(userData);
      await user.save();

      logger.security('New user registered', {
        userId: user._id,
        email: user.email,
        username: user.username,
        ip: req.ip,
        requestId: req.id
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          roles: user.roles
        }
      });
    } catch (error) {
      logger.error('Registration error:', {
        error: error.message,
        stack: error.stack,
        requestId: req.id
      });

      if (error.code === 11000) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'User with this email or username already exists'
        });
      }

      next(error);
    }
  }

  /**
   * Get active sessions for current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */

  async getSessions(req, res, next) {
    try {
      const Session = require('@/models/common/Session');
      const sessions = await Session.getActiveSessionsForUser(req.user.id);
      
      // Format sessions for response (remove sensitive data)
      const formattedSessions = sessions.map(session => ({
        id: session._id,
        lastAccessed: session.lastAccessed,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        expires: session.expires
      }));

      res.status(200).json({
        success: true,
        data: formattedSessions
      });
    } catch (error) {
      logger.error('Get sessions error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        requestId: req.id
      });
      next(error);
    }
  }

  /**
   * Logout from all devices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async logoutAll(req, res, next) {
    try {
      const Session = require('@/models/common/Session');
      const invalidatedCount = await Session.invalidateUserSessions(req.user.id);
      
      // Clear current session
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            logger.error('Session destroy error:', err);
          }
        });
      }

      // Clear refresh token cookie
      res.clearCookie('refresh_token', { path: '/api/auth/refresh' });

      logger.security('User logged out from all devices', {
        userId: req.user.id,
        invalidatedSessions: invalidatedCount,
        ip: req.ip,
        requestId: req.id
      });

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully'
      });
    } catch (error) {
      logger.error('Logout all error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        requestId: req.id
      });
      next(error);
    }
  }

  /**
   * Enhanced logout with session cleanup
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async logout(req, res, next) {
    try {
      // Clear current session
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            logger.error('Session destroy error:', err);
          }
        });
      }

      // Clear refresh token cookie
      res.clearCookie('refresh_token', { path: '/api/auth/refresh' });

      logger.security('User logged out', {
        userId: req.user?.id,
        ip: req.ip,
        requestId: req.id
      });

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        requestId: req.id
      });
      next(error);
    }
  }
}

module.exports = new AuthController();