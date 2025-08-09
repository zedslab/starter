const express = require("express");
const path = require("path");
const http = require("http");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const { EventEmitter } = require("events");
const logger = require("./logger");
const database = require("./database");
const security = require("./security");
const { fullBootstrap } = require("./bootstrap");

const app = express();

const port = process.env.PORT || 3000;
const apiUrl = process.env.API_URL || "http://localhost:3000";

// Validate critical environment variables
function validateEnv() {
  const requiredEnvVars = ["SESSION_SECRET"];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
  // Validate SESSION_SECRET format
  if (process.env.SESSION_SECRET.length < 32) {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters long for security"
    );
  }
}

// Import Session model
const Session = require('../models/common/Session');

/**
 * Initialize session middleware after database connection
 * @returns {Function} Session middleware
 */
async function initializeSessionMiddleware() {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error(
        `MongoDB connection not ready (readyState: ${mongoose.connection.readyState})`
      );
    }
    
    // Verify Session model is available
    if (!mongoose.models.Session) {
      throw new Error("Session model not registered");
    }
    
    logger.info("Session store connectivity test passed");

    // Return session middleware configuration using connect-mongo
    return session({
      secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'express_sessions',
        ttl: parseInt(process.env.SESSION_MAX_AGE || "3600000", 10) / 1000 // TTL in seconds
      }),
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: parseInt(process.env.SESSION_MAX_AGE || "3600000", 10), // Default 1 hour
      },
      name: 'sessionId', // Custom session name
    });
  } catch (err) {
    console.error("Session middleware error details:", err);
    logger.error("Failed to initialize session middleware:", {
      error: err.message,
      stack: err.stack,
      readyState: mongoose.connection.readyState,
      models: Object.keys(mongoose.models),
    });
    throw err;
  }
}

// Process JSON and urlencoded parameters
app.use(express.json({ extended: true, limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply security middleware with proper error handling
app.use(security.requestLogger);
app.use(security.securityEventLogger);
app.use(security.securityHeaders());

// Input sanitization and XSS protection - now fixed for Express 5 compatibility
app.use(security.inputSanitization());
app.use(security.xssProtection());

app.use(security.compressionMiddleware);
app.use(
  security.validateContentType([
    "application/json",
    "application/x-www-form-urlencoded",
  ])
);
app.use(security.cspReportHandler);

// Setup CORS
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin || "*");
    } else {
      logger.security("CORS policy violation", {
        origin,
        ip: origin ? origin : "unknown",
      });
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
    "X-Request-ID",
  ],
};

//Register CORS
app.use((req, res, next) => {
  if (req.path === "/health" || req.path === "/api/health") {
    return next();
  }
  
  return cors(corsOptions)(req, res, next);
});

// Apply rate limiting
app.use(security.generalRateLimit);
app.use("/api/auth", security.authRateLimit);

// Add CSRF protection middleware (will be enabled after session middleware is initialized)
app.use((req, res, next) => {
  // Skip CSRF for health checks and if session is not available
  if (req.path === "/health" || req.path === "/api/health" || !req.session) {
    return next();
  }
  
  // Apply CSRF protection
  security.csrfProtection(req, res, next);
});

// Add full URL to request object
app.use((req, res, next) => {
  req.fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  next();
});

// Catch-all error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", {
    error: err.message,
    stack: err.stack,
    requestId: req.id,
    path: req.path,
    method: req.method,
  });
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred",
  });
});

// Start the server and bootstrap the application
async function startServer() {
  try {
    // Validate environment variables
    validateEnv();
    logger.info("Environment variables validated");

    // Connect to MongoDB
    await database.connect();
    logger.info("Database connection established");

    // Initialize session middleware and add it to the app
    const sessionMiddleware = await initializeSessionMiddleware();
    app.use(sessionMiddleware);
    logger.info("Session middleware initialized successfully");

    // Add debug middleware
    app.use((req, res, next) => {
      console.log('Session debug:', {
        sessionID: req.sessionID,
        session: req.session,
        cookies: req.headers.cookie
      });
      next();
    });

    // Run bootstrap process
    await fullBootstrap();
    logger.info("Bootstrap completed");

    // Setup dynamic routing system AFTER session middleware is ready
    try {
      const routing = require('./routing');
      console.log('🚀 Using dynamic routing system...');
      routing.registerRoutes(app);
    } catch (error) {
      console.error('❌ Error registering routes!', error);
    }

    // Create HTTP server
    const server = http.createServer(app);
    server.listen(port, "0.0.0.0", () => {
      logger.info(
        `GAC - Node.js service listening at ${apiUrl} on port ${port}`
      );
    });
  } catch (error) {
    console.error("Server startup error details:", error);
    logger.error("Failed to start server:", {
      error: error.message,
      stack: error.stack,
    });
    // Delay exit to ensure logs are written
    setTimeout(() => process.exit(1), 1000);
  }
}

startServer();

module.exports = { app };

