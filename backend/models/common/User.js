// Full Updated User.js
/**
 * User Model
 * Defines the user schema and methods with the application
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const logger = require('@/config/logger');
const { createEnumValidator } = require('@/models/common/Metadata'); 

/**
 * User Schema
 */
const userSchema = new mongoose.Schema({
  // Basic user information
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  fullName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 255,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens']
  },
  // Security fields
  passwordHash: {
    type: String,
    required: true
  },
  passwordSalt: {
    type: String,
    required: true
  },
  // Role specific fields
  roles: [{
    type: String,
    uppercase: true,
    validate: createEnumValidator('ROLE_TYPES') // Using dynamic enum from Metadata
  }],
  //Organization specific fields
  ministryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ministry',
    default: null
  },
  // Contact information
  phone: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  employeeId: {
    type: String,
    trim: true,
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: {
    type: Date,
    default: null
  },
  lockReason: {
    type: String,
    trim: true
  },
  // Login tracking
  loginAttempts: {
    type: Number,
    default: 0
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  // Password management
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  passwordHistory: {
    type: [String],
    default: []
  },
  // Profile information
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  avatar: {
    type: String,
    trim: true
  },
  preferences: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Two-factor authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    default: null
  },
  // SSO integration
  ssoProvider: {
    type: String,
    enum: createEnumValidator('SSO_PROVIDERS'), // Using dynamic enum from Metadata
    default: null
  },
  ssoId: {
    type: String,
    default: null
  },
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.passwordHash;
      delete ret.passwordSalt;
      delete ret.passwordHistory;
      delete ret.twoFactorSecret;
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Pre-save hook to generate full name and handle password
 */
userSchema.pre('save', async function(next) {
  try {
    const user = this;
    
    // Generate full name
    if (user.isModified('firstName') || user.isModified('lastName')) {
      user.fullName = `${user.firstName} ${user.lastName}`.trim();
    }
    
    // Handle password hashing (for backward compatibility with 'password' field)
    if (user.password && user.isModified('password')) {
      // Generate salt
      const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
      
      // Hash password
      const hash = await bcrypt.hash(user.password, salt);
      
      // Add current password to history
      if (user.passwordHistory.length >= 5) {
        user.passwordHistory.shift();
      }
      if (user.passwordHash) {
        user.passwordHistory.push(user.passwordHash);
      }
      
      // Set hashed password
      user.passwordHash = hash;
      user.passwordSalt = salt;
      
      // Set last password change date
      user.lastPasswordChange = Date.now();
      
      // Remove the plain password field
      user.password = undefined;
    }
    
    next();
  } catch (error) {
    logger.error('Error in user pre-save hook:', error);
    next(error);
  }
});

/**
 * Compare password
 * @param {String} candidatePassword - Password to compare
 * @returns {Promise<Boolean>} - True if password matches
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw error;
  }
};

/**
 * Check if password has been used before
 * @param {String} candidatePassword - Password to check
 * @returns {Promise<Boolean>} - True if password has been used before
 */
userSchema.methods.isPasswordUsedBefore = async function(candidatePassword) {
  try {
    // Check against password history
    for (const historicalPassword of this.passwordHistory) {
      if (await bcrypt.compare(candidatePassword, historicalPassword)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    logger.error('Error checking password history:', error);
    throw error;
  }
};

/**
 * Increment login attempts
 * @returns {Promise<Number>} - Number of login attempts
 */
userSchema.methods.incrementLoginAttempts = async function() {
  try {
    // Increment login attempts
    this.loginAttempts += 1;
    this.failedLoginAttempts += 1;
    
    // Lock account if max attempts reached
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
    const lockTime = parseInt(process.env.LOCKOUT_TIME || '900000', 10); // 15 minutes
    
    if (this.failedLoginAttempts >= maxAttempts) {
      this.isLocked = true;
      this.lockUntil = new Date(Date.now() + lockTime);
      this.lockReason = 'Too many failed login attempts';
      
      logger.security('Account locked due to too many failed login attempts', {
        userId: this._id,
        email: this.email,
        loginAttempts: this.failedLoginAttempts
      });
    }
    
    await this.save();
    
    return this.failedLoginAttempts;
  } catch (error) {
    logger.error('Error incrementing login attempts:', error);
    throw error;
  }
};

/**
 * Reset login attempts
 * @returns {Promise<void>}
 */
userSchema.methods.resetLoginAttempts = async function() {
  try {
    this.loginAttempts = 0;
    this.failedLoginAttempts = 0;
    this.isLocked = false;
    this.lockUntil = null;
    this.lockReason = null;
    this.lastLogin = Date.now();
    this.loginCount += 1;
    
    await this.save();
  } catch (error) {
    logger.error('Error resetting login attempts:', error);
    throw error;
  }
};

/**
 * Check if account is locked
 * @returns {Boolean} - True if account is locked
 */
userSchema.methods.isAccountLocked = function() {
  // Check if account is locked and lock time has not expired
  return this.isLocked && this.lockUntil && this.lockUntil > Date.now();
};

/**
 * Check if user has specific role
 * @param {String} requiredRole - Required role
 * @returns {Boolean} - True if user has the required role
 */
userSchema.methods.hasRole = function(requiredRole) {
  return this.roles.includes(requiredRole.toUpperCase());
};

/**
 * Create indexes
 */
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ employeeId: 1 } ); //Maybe unique, depending on your logic { unique: true, sparse: true }
userSchema.index({ createdAt: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isLocked: 1, lockUntil: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ firstName: 1, lastName: 1 });

/**
 * User model
 */
const User = mongoose.model('User', userSchema);

module.exports = User;