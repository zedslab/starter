/**
 * Session Model
 * Defines the session schema for Express session storage in MongoDB
 */
const mongoose = require('mongoose');
const logger = require('@/config/logger');

/**
 * Session Schema for Express Sessions
 * This model stores Express session data in MongoDB
 */
const sessionSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    description: 'Session ID from express-session'
  },
  session: {
    type: String,
    required: true,
    description: 'JSON stringified session data'
  },
  expires: {
    type: Date,
    required: true,
    // index: { expireAfterSeconds: 0 },
    description: 'Session expiration date for TTL'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    description: 'Associated user ID if logged in'
  },
  ipAddress: {
    type: String,
    default: null,
    description: 'IP address of the session'
  },
  userAgent: {
    type: String,
    default: null,
    description: 'User agent string'
  },
  isActive: {
    type: Boolean,
    default: true,
    description: 'Whether the session is active'
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
    description: 'Last time the session was accessed'
  }
}, {
  collection: 'express_sessions',
  timestamps: true
});

/**
 * Indexes for performance and TTL
 */
sessionSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ isActive: 1 });
sessionSchema.index({ lastAccessed: 1 });

/**
 * Static method to clean up expired sessions
 * @returns {Promise<Number>} Number of deleted sessions
 */
sessionSchema.statics.cleanupExpiredSessions = async function() {
  try {
    const result = await this.deleteMany({
      expires: { $lt: new Date() }
    });
    
    if (result.deletedCount > 0) {
      logger.info(`Cleaned up ${result.deletedCount} expired sessions`);
    }
    
    return result.deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired sessions:', error);
    throw error;
  }
};

/**
 * Static method to get active sessions for a user
 * @param {String} userId - User ID
 * @returns {Promise<Array>} Array of active sessions
 */
sessionSchema.statics.getActiveSessionsForUser = async function(userId) {
  try {
    return await this.find({
      userId: userId,
      isActive: true,
      expires: { $gt: new Date() }
    }).sort({ lastAccessed: -1 });
  } catch (error) {
    logger.error('Error getting active sessions for user:', error);
    throw error;
  }
};

/**
 * Static method to invalidate all sessions for a user
 * @param {String} userId - User ID
 * @returns {Promise<Number>} Number of invalidated sessions
 */
sessionSchema.statics.invalidateUserSessions = async function(userId) {
  try {
    const result = await this.updateMany(
      { userId: userId, isActive: true },
      { isActive: false }
    );
    
    logger.info(`Invalidated ${result.modifiedCount} sessions for user ${userId}`);
    return result.modifiedCount;
  } catch (error) {
    logger.error('Error invalidating user sessions:', error);
    throw error;
  }
};

/**
 * Pre-save hook to update lastAccessed
 */
sessionSchema.pre('save', function(next) {
  if (this.isModified('session')) {
    this.lastAccessed = new Date();
  }
  next();
});

/**
 * Session model
 */
const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;

