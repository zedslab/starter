/**
 * Validation Middleware
 * Handles request validation using express-validator
 */
const { body, validationResult } = require('express-validator');
const logger = require('@/config/logger');

/**
 * Validation Middleware Class
 */
class ValidationMiddleware {
  /**
   * Validation sets for different endpoints
   */
  get validationSets() {
    return {
      // User login validation
      userLogin: [
        body('email')
          .isEmail()
          .normalizeEmail()
          .withMessage('Please provide a valid email address'),
        body('password')
          .isLength({ min: 8 })
          .withMessage('Password must be at least 8 characters long')
      ],

      // User registration validation
      userRegistration: [
        body('firstName')
          .trim()
          .isLength({ min: 2, max: 50 })
          .withMessage('First name must be between 2 and 50 characters'),
        body('lastName')
          .trim()
          .isLength({ min: 2, max: 50 })
          .withMessage('Last name must be between 2 and 50 characters'),
        body('email')
          .isEmail()
          .normalizeEmail()
          .withMessage('Please provide a valid email address'),
        body('username')
          .trim()
          .isLength({ min: 3, max: 30 })
          .matches(/^[a-zA-Z0-9_-]+$/)
          .withMessage('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens'),
        body('password')
          .isLength({ min: 8 })
          .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
          .withMessage('Password must be at least 8 characters and contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
        body('confirmPassword')
          .custom((value, { req }) => {
            if (value !== req.body.password) {
              throw new Error('Password confirmation does not match password');
            }
            return true;
          })
      ],

      // Profile update validation
      profileUpdate: [
        body('firstName')
          .optional()
          .trim()
          .isLength({ min: 2, max: 50 })
          .withMessage('First name must be between 2 and 50 characters'),
        body('lastName')
          .optional()
          .trim()
          .isLength({ min: 2, max: 50 })
          .withMessage('Last name must be between 2 and 50 characters'),
        body('phone')
          .optional()
          .trim()
          .isMobilePhone()
          .withMessage('Please provide a valid phone number'),
        body('title')
          .optional()
          .trim()
          .isLength({ max: 100 })
          .withMessage('Title must not exceed 100 characters'),
        body('bio')
          .optional()
          .trim()
          .isLength({ max: 500 })
          .withMessage('Bio must not exceed 500 characters')
      ],

      // Change password validation
      changePassword: [
        body('currentPassword')
          .notEmpty()
          .withMessage('Current password is required'),
        body('newPassword')
          .isLength({ min: 8 })
          .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
          .withMessage('New password must be at least 8 characters and contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
        body('confirmNewPassword')
          .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
              throw new Error('Password confirmation does not match new password');
            }
            return true;
          })
      ],

      // Password reset request validation
      passwordResetRequest: [
        body('email')
          .isEmail()
          .normalizeEmail()
          .withMessage('Please provide a valid email address')
      ],

      // Password reset validation
      passwordReset: [
        body('token')
          .notEmpty()
          .withMessage('Reset token is required'),
        body('newPassword')
          .isLength({ min: 8 })
          .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
          .withMessage('New password must be at least 8 characters and contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
        body('confirmNewPassword')
          .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
              throw new Error('Password confirmation does not match new password');
            }
            return true;
          })
      ]
    };
  }

  /**
   * Validate request and return errors if any
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  validateRequest(req, res, next) {
    try {
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
          field: error.path || error.param,
          message: error.msg,
          value: error.value
        }));

        logger.warn('Validation failed', {
          errors: errorMessages,
          path: req.path,
          method: req.method,
          ip: req.ip,
          requestId: req.id
        });

        return res.status(400).json({
          error: 'Validation Error',
          message: 'Request validation failed',
          details: errorMessages
        });
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error:', {
        error: error.message,
        stack: error.stack,
        requestId: req.id
      });
      
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Validation service error'
      });
    }
  }

  /**
   * Sanitize request data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  sanitizeRequest(req, res, next) {
    try {
      // Trim string values in body
      if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
          if (typeof req.body[key] === 'string') {
            req.body[key] = req.body[key].trim();
          }
        }
      }

      // Trim string values in query
      if (req.query && typeof req.query === 'object') {
        for (const key in req.query) {
          if (typeof req.query[key] === 'string') {
            req.query[key] = req.query[key].trim();
          }
        }
      }

      next();
    } catch (error) {
      logger.error('Request sanitization error:', {
        error: error.message,
        stack: error.stack,
        requestId: req.id
      });
      next();
    }
  }

  /**
   * Custom validation for MongoDB ObjectId
   * @param {String} value - Value to validate
   * @returns {Boolean} - True if valid ObjectId
   */
  isValidObjectId(value) {
    return /^[0-9a-fA-F]{24}$/.test(value);
  }

  /**
   * Custom validation for strong password
   * @param {String} password - Password to validate
   * @returns {Boolean} - True if password is strong
   */
  isStrongPassword(password) {
    // At least 8 characters, one lowercase, one uppercase, one number, one special character
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  /**
   * Custom validation for Canadian postal code
   * @param {String} postalCode - Postal code to validate
   * @returns {Boolean} - True if valid Canadian postal code
   */
  isValidCanadianPostalCode(postalCode) {
    const canadianPostalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    return canadianPostalCodeRegex.test(postalCode);
  }

  /**
   * Custom validation for government email
   * @param {String} email - Email to validate
   * @returns {Boolean} - True if valid government email
   */
  isAlbertaGovEmail(email) {
    const albertaGovEmailRegex = /^[a-zA-Z0-9._%+-]+@(alberta\.ca|gov\.ab\.ca)$/i;
    return albertaGovEmailRegex.test(email);
  }
}

module.exports = new ValidationMiddleware();

