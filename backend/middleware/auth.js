// auth.js remains the same as previous
/**
 * Authentication Middleware
 * Handles JWT token verification and role-based access control with CASL
 */
const jwt = require('jsonwebtoken');
const User = require('@/models/common/User');
const logger = require('@/config/logger');
const { defineAbilityFor } = require('./permissions');

class AuthMiddleware {
  async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Access token is required'
        });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id);
      if (!user) {
        logger.security('Authentication failed - user not found', { userId: decoded.id, ip: req.ip, requestId: req.id });
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid access token' });
      }

      if (!user.isActive) {
        logger.security('Authentication failed - inactive user', { userId: user._id, email: user.email, ip: req.ip, requestId: req.id });
        return res.status(401).json({ error: 'Unauthorized', message: 'Account is not active' });
      }

      if (user.isAccountLocked()) {
        logger.security('Authentication failed - locked account', { userId: user._id, email: user.email, ip: req.ip, lockUntil: user.lockUntil, requestId: req.id });
        return res.status(423).json({ error: 'Account Locked', message: 'Account is temporarily locked' });
      }

      req.user = user;
      req.ability = defineAbilityFor(user);
      console.log('Ability', req.ability)
      next();
    } catch (error) {
      logger.error('Authentication middleware error:', { error: error.message, stack: error.stack, requestId: req.id });

      if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Unauthorized', message: 'Invalid access token' });
      if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Unauthorized', message: 'Access token has expired' });

      return res.status(500).json({ error: 'Internal Server Error', message: 'Authentication service error' });
    }
  }

  async optionalAuthenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

      return this.authenticate(req, res, next);
    } catch (error) {
      logger.warn('Optional authentication failed:', { error: error.message, requestId: req.id });
      next();
    }
  }

  async checkAccountStatus(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });

      const user = await User.findById(req.user._id);
      if (!user) return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });

      req.user = user;
      req.ability = defineAbilityFor(user);

      if (!user.isActive) {
        logger.security('Account status check failed - inactive user', { userId: user._id, email: user.email, ip: req.ip, requestId: req.id });
        return res.status(401).json({ error: 'Unauthorized', message: 'Account is not active' });
      }

      if (user.isAccountLocked()) {
        logger.security('Account status check failed - locked account', { userId: user._id, email: user.email, ip: req.ip, lockUntil: user.lockUntil, requestId: req.id });
        return res.status(423).json({ error: 'Account Locked', message: 'Account is temporarily locked' });
      }

      next();
    } catch (error) {
      logger.error('Account status check error:', { error: error.message, stack: error.stack, requestId: req.id });
      return res.status(500).json({ error: 'Internal Server Error', message: 'Account status check failed' });
    }
  }

  requireSuperAdmin(req, res, next) {
    if (!req.user || !req.user.roles.includes('SUPER_ADMIN')) {
      logger.security('Access denied - super admin access required', {
        userId: req.user?._id,
        email: req.user?.email,
        roles: req.user?.roles,
        ip: req.ip,
        path: req.path,
        requestId: req.id
      });
      return res.status(403).json({ error: 'Forbidden', message: 'Super administrator access required' });
    }
    next();
  }
}

module.exports = new AuthMiddleware();