/**
 * Winston Logger with DailyRotateFile, Redaction, Custom Methods, and MongoDB Monitoring
 */
const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, errors, json } = format;
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

/**
 * Custom format for console output
 */
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let metaStr = '';
  if (Object.keys(metadata).length > 0 && metadata.stack === undefined) {
    metaStr = JSON.stringify(metadata, null, 2);
  }
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

/**
 * Redact sensitive information in message and metadata
 */
const redactSensitiveInfo = format((info) => {
  const sensitiveFields = [
    'password', 'confirmpassword', 'currentpassword',
    'token', 'refreshtoken', 'accesstoken',
    'secret', 'apikey', 'apisecret',
    'creditcard', 'ssn', 'socialsecuritynumber'
  ];

  // Redact sensitive fields in metadata
  const redactObject = (obj) => {
    if (!obj || typeof obj !== 'object' || obj === null) return obj;
    const result = { ...obj };
    Object.keys(result).forEach(key => {
      if (sensitiveFields.includes(key.toLowerCase())) {
        result[key] = '[REDACTED]';
      } else if (typeof result[key] === 'object') {
        result[key] = redactObject(result[key]);
      }
    });
    return result;
  };

  // Redact sensitive keywords and their values in the message
  let redactedMessage = info.message;
  sensitiveFields.forEach(field => {
    // Match patterns like "password: value" or "Password: value"
    const regex = new RegExp(`\\b${field}\\b\\s*:\\s*[^\\s]+`, 'gi');
    redactedMessage = redactedMessage.replace(regex, `${field}: [REDACTED]`);
  });

  return {
    ...redactObject(info),
    message: redactedMessage
  };
});

/**
 * Create Winston logger
 */
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    redactSensitiveInfo(),
    process.env.NODE_ENV === 'development' ? consoleFormat : json()
  ),
  defaultMeta: { service: process.env.APP_NAME || 'simple-app' },
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        consoleFormat
      ),
      silent: process.env.NODE_ENV === 'test'
    }),
    new transports.DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
      zippedArchive: true
    }),
    new transports.DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
      zippedArchive: true
    }),
    new transports.DailyRotateFile({
      filename: path.join(logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
      zippedArchive: true,
      level: 'info',
      format: combine(timestamp(), json())
    }),
    new transports.DailyRotateFile({
      filename: path.join(logsDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
      zippedArchive: true,
      level: 'info',
      format: combine(timestamp(), json())
    }),
    new transports.DailyRotateFile({
      filename: path.join(logsDir, 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
      zippedArchive: true,
      level: 'info',
      format: combine(timestamp(), json())
    })
  ],
  exceptionHandlers: [
    new transports.DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
      zippedArchive: true
    })
  ],
  rejectionHandlers: [
    new transports.DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
      zippedArchive: true
    })
  ],
  exitOnError: false
});

/**
 * Add security logging method
 * @param {String} message - Log message
 * @param {Object} metadata - Additional metadata
 */
logger.security = (message, metadata = {}) => {
  logger.log({
    level: 'info',
    message,
    ...metadata,
    type: 'security_event'
  });
};

/**
 * Add audit logging method
 * @param {String} message - Log message
 * @param {String} userId - User ID
 * @param {Object} metadata - Additional metadata
 */
logger.audit = (message, userId, metadata = {}) => {
  logger.log({
    level: 'info',
    message,
    userId,
    ...metadata,
    type: 'audit_event'
  });
};

/**
 * Add performance logging method
 * @param {String} message - Log message
 * @param {Number} duration - Duration in milliseconds
 * @param {Object} metadata - Additional metadata
 */
logger.performance = (message, duration, metadata = {}) => {
  logger.log({
    level: 'info',
    message,
    duration,
    ...metadata,
    type: 'performance_event'
  });
};

/**
 * MongoDB query performance monitoring
 * @param {Object} mongoose - Mongoose instance
 */
logger.monitorMongoDBQueries = (mongoose) => {
  if (!mongoose) {
    logger.warn('MongoDB query monitoring skipped: No Mongoose instance provided');
    return;
  }
  mongoose.set('debug', (collectionName, methodName, ...methodArgs) => {
    const startTime = Date.now();
    const queryInfo = {
      collection: collectionName,
      operation: methodName,
      arguments: methodArgs.slice(0, -1)
    };
    const originalCallback = methodArgs[methodArgs.length - 1];
    methodArgs[methodArgs.length - 1] = function (err, result) {
      const duration = Date.now() - startTime;
      if (duration > 500) {
        logger.performance('Slow MongoDB query', duration, {
          ...queryInfo,
          result: result ? 'success' : 'error'
        });
      }
      if (typeof originalCallback === 'function') {
        originalCallback(err, result);
      }
    };
  });
};

// Test logger
logger.info('Info: Logger initialized', { test: 'info', password: 'secret123' });
logger.security('Security event', { action: 'login', token: 'abc123' });
logger.audit('User action', 'user123', { action: 'update' });
logger.performance('API call', 600, { endpoint: '/api/data' });
logger.info('Password: SuperAdmin123!');

module.exports = logger;