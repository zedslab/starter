/**
 * Health Controller
 * Handles health check routes
 */
const database = require('@/config/database');
const logger = require('@/config/logger');

/**
 * Health Controller
 * Handles health check routes
 */
class HealthController {
  /**
   * Check application health
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async check(req, res, next) {
    try {
      // Check database health
      const dbHealth = await database.healthCheck();
      
      // Overall health status
      const status = dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy';
      
      // Response
      const health = {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: dbHealth
      };
      
      // Log health check if unhealthy
      if (status !== 'healthy') {
        logger.warn('Health check failed', health);
      }
      
      // Set status code based on health
      const statusCode = status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('Health check error:', error);
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }
}

module.exports = new HealthController();

