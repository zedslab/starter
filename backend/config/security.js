/**
 * Security Configuration
 * Centralizes security middleware and configurations
 */
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const crypto = require("crypto");
const sanitizeHtml = require("sanitize-html");
const logger = require("@/config/logger");

/**
 * Security Configuration
 * Provides middleware functions for security
 */
class Security {
  /**
   * Configure security headers using Helmet
   * @returns {Function} - Express middleware function
   */
  securityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'", "http://localhost:*"],// "https://*.myapp.com"
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          formAction: ["'self'"],
          reportUri: ["/api/csp-report"],
          upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: { policy: "require-corp" },
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "same-site" },
      dnsPrefetchControl: { allow: false },
      expectCt: { maxAge: 86400, enforce: true },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true,
    });
    return true;
  }

  /**
   * General rate limiting
   */
  get generalRateLimit() {
    return rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10), // 100 requests per window
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: "Too Many Requests",
        message: "Too many requests, please try again later.",
      },
      handler: (req, res, next, options) => {
        logger.security("Rate limit exceeded", {
          ip: req.ip,
          path: req.path,
          method: req.method,
          limit: options.max,
          window: options.windowMs,
        });
        res.status(429).json(options.message);
      },
      skip: (req) => req.path === "/api/health",
    });
  }

  /**
   * Authentication rate limiting
   */
  get authRateLimit() {
    return rateLimit({
      windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
      max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || "5", 10), // 5 requests per window
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: "Too Many Requests",
        message: "Too many login attempts, please try again later.",
      },
      handler: (req, res, next, options) => {
        logger.security("Authentication rate limit exceeded", {
          ip: req.ip,
          path: req.path,
          method: req.method,
          limit: options.max,
          window: options.windowMs,
        });
        res.status(429).json(options.message);
      },
    });
  }

  /**
   * Enhanced CSRF protection
   * @returns {Function} - Express middleware function
   */
  get csrfProtection() {
    return (req, res, next) => {
      // Skip CSRF for safe methods
      if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return next();
      }
      
      // Skip CSRF for specific paths
      const skipPaths = [
        "/api/auth/login",
        "/api/auth/register", 
        "/api/auth/refresh",
        "/api/auth/google",
        "/api/auth/microsoft",
        "/api/auth/github",
        "/api/logs/siem",
        "/api/health"
      ];
      
      if (skipPaths.some((path) => req.path.startsWith(path))) {
        return next();
      }

      // Check if session exists
      if (!req.session) {
        logger.security("CSRF validation failed - no session", {
          ip: req.ip,
          path: req.path,
          method: req.method,
          requestId: req.id,
        });
        return res.status(403).json({
          error: "Forbidden",
          message: "Session required for CSRF protection",
        });
      }

      const csrfToken = req.headers["x-csrf-token"] || req.body._csrf;
      const sessionToken = req.session.csrfToken;

      if (!csrfToken || !sessionToken) {
        logger.security("CSRF validation failed - missing token", {
          ip: req.ip,
          path: req.path,
          method: req.method,
          hasSessionToken: !!sessionToken,
          hasRequestToken: !!csrfToken,
          requestId: req.id,
        });
        return res.status(403).json({
          error: "Forbidden",
          message: "CSRF token required",
        });
      }

      // Use timing-safe comparison
      if (!crypto.timingSafeEqual(
        Buffer.from(csrfToken),
        Buffer.from(sessionToken)
      )) {
        logger.security("CSRF validation failed - token mismatch", {
          ip: req.ip,
          path: req.path,
          method: req.method,
          requestId: req.id,
        });
        return res.status(403).json({
          error: "Forbidden",
          message: "Invalid CSRF token",
        });
      }
      
      next();
    };
  }

  /**
   * Generate CSRF token and store in session
   * @param {Object} req - Express request object
   * @returns {String} - CSRF token
   */
  generateCsrfToken(req) {
    if (!req.session) {
      throw new Error("Session middleware must be initialized before CSRF protection");
    }
    const token = crypto.randomBytes(32).toString("hex");
    req.session.csrfToken = token;
    return token;
  }

  /**
   * Input sanitization for MongoDB queries
   * @returns {Function} - Express middleware function
   */
  inputSanitization() {
    return (req, res, next) => {
      const sanitizeMongoQuery = (obj, path = '') => {
        if (!obj || typeof obj !== "object") return obj;
        
        const sanitized = Array.isArray(obj) ? [] : {};
        
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            // Check for MongoDB injection patterns
            if (typeof key === 'string' && (key.startsWith('$') || key.includes('.'))) {
              logger.security("MongoDB query injection attempt detected", {
                ip: req.ip,
                path: req.path,
                key: currentPath,
                requestId: req.id,
              });
              // Replace dangerous keys with safe alternatives
              const safeKey = key.replace(/[$\.]/g, '_');
              sanitized[safeKey] = obj[key];
            } else if (typeof obj[key] === "object" && obj[key] !== null) {
              sanitized[key] = sanitizeMongoQuery(obj[key], currentPath);
            } else {
              sanitized[key] = obj[key];
            }
          }
        }
        
        return sanitized;
      };

      try {
        // Sanitize body (this is usually writable)
        if (req.body && typeof req.body === "object") {
          req.body = sanitizeMongoQuery(req.body);
        }

        // For query and params, handle Express 5 read-only properties carefully
        if (req.query && typeof req.query === "object") {
          const sanitizedQuery = sanitizeMongoQuery(req.query);
          try {
            // Try to update the query object
            Object.keys(req.query).forEach(key => delete req.query[key]);
            Object.assign(req.query, sanitizedQuery);
          } catch (error) {
            // If query is read-only, store sanitized version in custom property
            req.sanitizedQuery = sanitizedQuery;
            logger.warn("Query object is read-only, using req.sanitizedQuery", {
              requestId: req.id,
              path: req.path
            });
          }
        }

        if (req.params && typeof req.params === "object") {
          const sanitizedParams = sanitizeMongoQuery(req.params);
          try {
            // Try to update the params object
            Object.keys(req.params).forEach(key => delete req.params[key]);
            Object.assign(req.params, sanitizedParams);
          } catch (error) {
            // If params is read-only, store sanitized version in custom property
            req.sanitizedParams = sanitizedParams;
            logger.warn("Params object is read-only, using req.sanitizedParams", {
              requestId: req.id,
              path: req.path
            });
          }
        }
      } catch (error) {
        logger.error("Error in input sanitization middleware", {
          error: error.message,
          stack: error.stack,
          requestId: req.id,
          path: req.path
        });
        // Continue processing even if sanitization fails
      }

      next();
    };
  }

  /**
   * XSS protection using sanitize-html
   * @returns {Function} - Express middleware function
   */
  xssProtection() {
    return (req, res, next) => {
      const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== "object") return obj;
        const sanitized = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            if (typeof obj[key] === "string") {
              const original = obj[key];
              const cleaned = sanitizeHtml(obj[key], {
                allowedTags: [], // Disallow all HTML tags
                allowedAttributes: {}, // Disallow all attributes
                disallowedTagsMode: "discard",
              });
              if (original !== cleaned) {
                logger.security("XSS attempt detected", {
                  ip: req.ip,
                  path: req.path,
                  key,
                  original,
                  requestId: req.id,
                });
              }
              sanitized[key] = cleaned;
            } else if (typeof obj[key] === "object") {
              sanitized[key] = sanitizeObject(obj[key]);
            } else {
              sanitized[key] = obj[key];
            }
          }
        }
        return sanitized;
      };

      try {
        // Sanitize body (this is usually writable)
        if (req.body && typeof req.body === "object") {
          req.body = sanitizeObject(req.body);
        }

        // For query and params, we need to be more careful in Express 5
        // Create sanitized versions and store them in a custom property
        if (req.query && typeof req.query === "object") {
          const sanitizedQuery = sanitizeObject(req.query);
          // Try to replace if possible, otherwise store in custom property
          try {
            Object.assign(req.query, sanitizedQuery);
          } catch (error) {
            // If query is read-only, store sanitized version in custom property
            req.sanitizedQuery = sanitizedQuery;
            logger.warn("Query object is read-only, using req.sanitizedQuery", {
              requestId: req.id,
              path: req.path
            });
          }
        }

        if (req.params && typeof req.params === "object") {
          const sanitizedParams = sanitizeObject(req.params);
          // Try to replace if possible, otherwise store in custom property
          try {
            Object.assign(req.params, sanitizedParams);
          } catch (error) {
            // If params is read-only, store sanitized version in custom property
            req.sanitizedParams = sanitizedParams;
            logger.warn("Params object is read-only, using req.sanitizedParams", {
              requestId: req.id,
              path: req.path
            });
          }
        }
      } catch (error) {
        logger.error("Error in XSS protection middleware", {
          error: error.message,
          stack: error.stack,
          requestId: req.id,
          path: req.path
        });
        // Continue processing even if sanitization fails
      }

      next();
    };
  }

  /**
   * Compression middleware
   */
  get compressionMiddleware() {
    return compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
    });
  }

  /**
   * Request logger
   */
  requestLogger(req, res, next) {
    if (process.env.NODE_ENV === "production" && req.path === "/api/health") {
      return next();
    }
    req.id = require("uuid").v4();
    logger.info(`${req.method} ${req.path}`, {
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      query: req.query,
      userId: req.user?.id || null,
    });
    res.setHeader("X-Request-ID", req.id);
    const originalSend = res.send;
    res.send = function (body) {
      res.send = originalSend;
      res.body = body;
      logger.info(`Response ${res.statusCode}`, {
        requestId: req.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime: Date.now() - req._startTime,
        userId: req.user?.id || null,
      });
      return originalSend.call(this, body);
    };
    req._startTime = Date.now();
    next();
  }

  /**
   * Security event logger
   */
  securityEventLogger(req, res, next) {
    if (req.path === "/api/auth/login" && req.method === "POST") {
      logger.security("Login attempt", {
        requestId: req.id,
        ip: req.ip,
        email: req.body.email,
        userAgent: req.get("User-Agent"),
      });
    }
    if (req.path === "/api/auth/register" && req.method === "POST") {
      logger.security("Registration attempt", {
        requestId: req.id,
        ip: req.ip,
        email: req.body.email,
        userAgent: req.get("User-Agent"),
      });
    }
    if (req.path === "/api/auth/change-password" && req.method === "POST") {
      logger.security("Password change attempt", {
        requestId: req.id,
        ip: req.ip,
        userId: req.user?.id || null,
        userAgent: req.get("User-Agent"),
      });
    }
    const originalStatus = res.status;
    res.status = function (code) {
      res.status = originalStatus;
      res.statusCode = code;
      if (code >= 400) {
        const level = code >= 500 ? "error" : "warn";
        logger[level](`HTTP ${code}`, {
          requestId: req.id,
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          userId: req.user?.id || null,
        });
      }
      return originalStatus.call(this, code);
    };
    next();
  }

  /**
   * CSP report handler
   */
  cspReportHandler(req, res, next) {
    if (req.path === "/api/csp-report" && req.method === "POST") {
      logger.security("CSP violation", {
        requestId: req.id,
        report: req.body,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      return res.status(204).end();
    }
    next();
  }

  /**
   * Content-Type validation middleware
   */
  validateContentType(allowedTypes = ["application/json", "application/x-www-form-urlencoded"]) {
    return (req, res, next) => {
      if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return next();
      }
      const contentType = req.headers["content-type"];
      if (!contentType) {
        logger.security("Missing Content-Type header", {
          requestId: req.id,
          ip: req.ip,
          path: req.path,
        });
        return res.status(415).json({
          error: "Unsupported Media Type",
          message: "Content-Type header is required",
        });
      }
      const isAllowed = allowedTypes.some((type) => contentType.includes(type));
      if (!isAllowed) {
        logger.security("Invalid content type", {
          requestId: req.id,
          contentType,
          allowedTypes,
          ip: req.ip,
          path: req.path,
        });
        return res.status(415).json({
          error: "Unsupported Media Type",
          message: `Content-Type ${contentType} is not supported. Allowed types: ${allowedTypes.join(", ")}`,
        });
      }
      next();
    };
  }
}

module.exports = new Security();