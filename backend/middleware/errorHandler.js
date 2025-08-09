/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */
const logger = require('@/config/logger');

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Log error with stack trace
  logger.error('Error:', {
    requestId: req.id,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || null
  });
  
  // Default error status and message
  let status = 500;
  let message = 'Internal Server Error';
  let details = null;
  
  // Handle specific error types
  switch (err.name) {
    case 'ValidationError': // Mongoose validation error
      status = 400;
      message = 'Validation Error';
      details = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      break;
      
    case 'JsonWebTokenError':
    case 'TokenExpiredError':
    case 'NotBeforeError':
      status = 401;
      message = 'Authentication Error';
      break;
      
    case 'MongoServerError':
      if (err.code === 11000) { // Duplicate key error
        status = 409;
        message = 'Conflict Error';
        // Extract the duplicate key field
        const field = Object.keys(err.keyValue)[0];
        details = [{
          field,
          message: `${field} already exists`
        }];
      }
      break;
      
    case 'ForbiddenError':
      status = 403;
      message = 'Forbidden';
      break;
      
    case 'NotFoundError':
      status = 404;
      message = 'Not Found';
      break;
      
    case 'BadRequestError':
      status = 400;
      message = 'Bad Request';
      break;
      
    case 'UnauthorizedError':
      status = 401;
      message = 'Unauthorized';
      break;
      
    case 'TooManyRequestsError':
      status = 429;
      message = 'Too Many Requests';
      break;
  }
  
  // Send error response
  res.status(status).json({
    error: message,
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred while processing your request' 
      : err.message,
    details: details,
    requestId: req.id
  });
}

module.exports = errorHandler;

