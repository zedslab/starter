const express = require("express");
const path = require("path");
require('module-alias/register');
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { app } = require("@/config/app.js");

// In test and production, serve built files from public/dist
if (['production', 'test'].includes(process.env.NODE_ENV)) {
app.use(express.static(path.join(__dirname, "../frontend/dist")));
}

// In development, serve static files from public
// if (process.env.NODE_ENV === "development") {
//   app.use(express.static(path.join(__dirname, "./public")));
// }

// Setup Swagger documentation (using fixed version)
try {
  const { initializeSwagger } = require('@/config/swagger');
  console.log('🔧 Initializing Swagger documentation...');
  initializeSwagger(app);
} catch (error) {
  console.warn('⚠️ Swagger initialization failed:', error.message);
}



// SPA Fallback: Serve `index.html` for any non-API routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    res.status(404).json({ 
      error: "API route not found",
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  } else if (
    req.path.startsWith("/assets/") ||
    req.path.match(/\.(js|css|png|jpg|jpeg|svg|ico|json|txt|woff2?)$/)
  ) {
    res.status(404).end();
  } else {
    res.sendFile(path.join(__dirname, "@/public/index.html"));
  }
});

// 404 error handler for unrecognized routes
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.path}`);
  error.status = 404;
  next(error);
});

// Global error handler
app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';
  
  console.error(`❌ Error ${status}: ${message}`, {
    path: req.path,
    method: req.method,
    stack: error.stack
  });
  
  res.status(status).json({
    success: false,
    error: status === 500 ? 'Internal Server Error' : message,
    message: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = app;

