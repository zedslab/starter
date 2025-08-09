/**
 * Centralized Routing Configuration
 * Automatically registers all route files with their base paths and metadata
 * Exports ROUTE_REGISTRY for Swagger integration
 */

const fs = require('fs').promises;
const path = require('path');

// =============================================================================
// ROUTE REGISTRY
// =============================================================================

const ROUTE_REGISTRY = {
  './routes/common/authRoutes.js': {
    basePath: '/api/auth',
    description: 'Authentication and user management endpoints',
    tags: ['Authentication'],
    requiresAuth: false
  },
  './routes/common/healthRoutes.js': {
    basePath: '/api/health',
    description: 'System health check endpoints',
    tags: ['Health'],
    requiresAuth: false
  }
};

// =============================================================================
// ROUTE DISCOVERY AND REGISTRATION
// =============================================================================

/**
 * Parse route file to extract endpoints using Express router inspection
 * @param {string} filePath - Path to route file
 * @param {string} basePath - Base path for the routes
 * @returns {Array} Array of endpoint objects { method, path, description }
 */
async function parseRouteEndpoints(filePath, basePath) {
  const endpoints = [];
  try {
    // Clear require cache to ensure fresh load
    const requireResolvePath = path.resolve(filePath);
    delete require.cache[requireResolvePath];
    
    const routeModule = require(filePath);
    const router = routeModule.default || routeModule;

    if (router && router.stack) {
      router.stack.forEach(layer => {
        if (layer.route) {
          const route = layer.route;
          Object.keys(route.methods).forEach(method => {
            // Combine basePath with route path using posix for consistent forward slashes
            const fullPath = path.posix.join(basePath, route.path);
            endpoints.push({
              method: method.toUpperCase(),
              path: fullPath,
              description: route.description || `${method.toUpperCase()} ${fullPath}`
            });
          });
        }
      });
    }
  } catch (error) {
    console.warn(`⚠️ Failed to parse endpoints from ${filePath}:`, error.message);
  }
  return endpoints;
}

/**
 * Register routes dynamically
 * @param {Express} app - Express application instance
 * @param {string} routesDir - Directory containing route files (defaults to current working directory)
 */
async function registerRoutes(app, routesDir = process.cwd()) {
  const registeredRoutes = [];
  const errors = [];
  const skippedFiles = [];

  console.log('🚀 Starting route registration...');
  console.log(`📁 Base directory: ${routesDir}`);

  for (const [routeFile, config] of Object.entries(ROUTE_REGISTRY)) {
    // Resolve the full path to the route file
    const fullPath = path.resolve(routesDir, routeFile);
    console.log(`🔍 Processing route: ${routeFile} -> Full path: ${fullPath}`);

    try {
      // Check if the file exists
      await fs.access(fullPath);
      
      // Clear require cache to ensure a fresh load
      delete require.cache[fullPath];

      // Load the route module
      const routeModule = require(fullPath);
      const router = routeModule.default || routeModule;

      if (typeof router === 'function') {
        app.use(config.basePath, router);
        
        // Parse endpoints for documentation
        const endpoints = await parseRouteEndpoints(fullPath, config.basePath);
        
        registeredRoutes.push({
          file: routeFile,
          basePath: config.basePath,
          endpoints,
          tags: config.tags,
          requiresAuth: config.requiresAuth
        });
        
        console.log(`✅ Registered: ${routeFile} -> ${config.basePath} (${endpoints.length} endpoints)`);
      } else {
        throw new Error('Invalid route module: expected a function (Express router)');
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        skippedFiles.push(routeFile);
        console.warn(`⚠️ Skipped missing file: ${routeFile} (Expected at ${fullPath})`);
      } else {
        errors.push(`Failed to register ${routeFile}: ${error.message}`);
        console.error(`❌ Failed to register ${routeFile}:`, error.message);
      }
    }
  }

  console.log(`📊 Registration complete: ${registeredRoutes.length} routes registered, ${skippedFiles.length} skipped, ${errors.length} errors`);
  
  if (errors.length > 0) {
    console.error('❌ Registration errors:', errors);
  }

  return { registeredRoutes, errors, skippedFiles };
}

/**
 * Get detailed route information
 * @returns {Object} Route information including endpoints
 */
function getRouteInfo() {
  const routes = Object.entries(ROUTE_REGISTRY).map(([file, config]) => ({
    file,
    basePath: config.basePath,
    tags: config.tags,
    requiresAuth: config.requiresAuth
  }));
  return { registry: ROUTE_REGISTRY, routes };
}

/**
 * Get all endpoints from registered routes with fully qualified paths
 * @param {string} routesDir - Directory containing route files (defaults to current working directory)
 * @returns {Array} Array of all endpoint objects with fully qualified paths
 */
async function getAllEndpoints(routesDir = process.cwd()) {
  const allEndpoints = [];
  
  for (const [routeFile, config] of Object.entries(ROUTE_REGISTRY)) {
    const fullPath = path.resolve(routesDir, routeFile);
    
    try {
      await fs.access(fullPath);
      const endpoints = await parseRouteEndpoints(fullPath, config.basePath);
      allEndpoints.push(...endpoints);
    } catch (error) {
      console.warn(`⚠️ Could not process ${routeFile} for endpoint discovery:`, error.message);
    }
  }
  
  return allEndpoints;
}

/**
 * Get route configuration by file path
 * @param {string} routeFile - Route file path
 * @returns {Object|null} Route configuration or null if not found
 */
function getRouteConfig(routeFile) {
  return ROUTE_REGISTRY[routeFile] || null;
}

/**
 * Get all route files for swagger-autogen
 * @param {string} routesDir - Directory containing route files
 * @returns {Array} Array of absolute paths to route files
 */
function getRouteFilesForSwagger(routesDir = process.cwd()) {
  return Object.keys(ROUTE_REGISTRY)
    .map(routeFile => path.resolve(routesDir, routeFile))
    .filter(fullPath => {
      try {
        require.resolve(fullPath);
        return true;
      } catch (error) {
        console.warn(`⚠️ Route file not found for Swagger: ${fullPath}`);
        return false;
      }
    });
}

module.exports = {
  registerRoutes,
  getRouteInfo,
  getAllEndpoints,
  getRouteConfig,
  getRouteFilesForSwagger,
  ROUTE_REGISTRY
};

