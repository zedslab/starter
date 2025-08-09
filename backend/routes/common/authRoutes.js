const express = require('express');
const router = express.Router();
const authController = require('@controllers/authController');
const security = require('@/config/security');
const authMiddleware = require('@/middleware/auth');
const validationMiddleware = require('@/middleware/validation');

// Apply authentication rate limiting to login and register
const authLimiter = security.authRateLimit;

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticate user with email and password, returns JWT token and user profile
 *     operationId: loginUser
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: user@REDVENOM.ca
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: User's password
 *                 example: SecurePassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT access token
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       description: JWT refresh token
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 *       423:
 *         description: Account locked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Account Locked
 *                 message:
 *                   type: string
 *                   example: Account is temporarily locked due to too many failed login attempts
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
  '/login',
  authLimiter,
  security.validateContentType(['application/json']),
  validationMiddleware.sanitizeRequest,
  validationMiddleware.validationSets.userLogin,
  validationMiddleware.validateRequest,
  authController.login
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Generate new access token using refresh token
 *     operationId: refreshToken
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: New JWT access token
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       description: New refresh token
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post(
  '/refresh',
  authController.refreshToken
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User logout
 *     description: Logout user and invalidate current session
 *     operationId: logoutUser
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logout successful
 */
router.post(
  '/logout',
  authMiddleware.authenticate,
  authController.logout
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get user profile
 *     description: Retrieve current user's profile information
 *     operationId: getUserProfile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/profile',
  authMiddleware.authenticate,
  authMiddleware.checkAccountStatus,
  authController.getProfile
);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     tags:
 *       - Authentication
 *     summary: Update user profile
 *     description: Update current user's profile information
 *     operationId: updateUserProfile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: John
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@REDVENOM.ca
 *               phone:
 *                 type: string
 *                 pattern: '^\\+?[1-9]\\d{1,14}$'
 *                 example: +1-780-555-0123
 *               department:
 *                 type: string
 *                 example: Treasury Board and Finance
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put(
  '/profile',
  authMiddleware.authenticate,
  authMiddleware.checkAccountStatus,
  security.validateContentType(['application/json']),
  validationMiddleware.sanitizeRequest,
  validationMiddleware.validationSets.profileUpdate,
  validationMiddleware.validateRequest,
  authController.updateProfile
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Change password
 *     description: Change current user's password
 *     operationId: changePassword
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *                 example: OldPassword123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: New password (minimum 8 characters, must include uppercase, lowercase, number, and special character)
 *                 example: NewSecurePassword123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  '/change-password',
  authMiddleware.authenticate,
  authMiddleware.checkAccountStatus,
  security.validateContentType(['application/json']),
  validationMiddleware.sanitizeRequest,
  validationMiddleware.validationSets.changePassword,
  validationMiddleware.validateRequest,
  authController.changePassword
);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout from all devices
 *     description: Invalidate all sessions for the current user
 *     operationId: logoutAllDevices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out from all devices successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  '/logout-all',
  authMiddleware.authenticate,
  authMiddleware.checkAccountStatus,
  authController.logoutAll
);

/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get active sessions
 *     description: Retrieve all active sessions for the current user
 *     operationId: getActiveSessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Session'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/sessions',
  authMiddleware.authenticate,
  authMiddleware.checkAccountStatus,
  authController.getSessions
);

// Register route (if registration is enabled)
if (process.env.ENABLE_REGISTRATION === 'true') {
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: User registration
   *     description: Register a new user account (only available if registration is enabled)
   *     operationId: registerUser
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - firstName
   *               - lastName
   *               - email
   *               - username
   *               - password
   *             properties:
   *               firstName:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 50
   *                 example: John
   *               lastName:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 50
   *                 example: Doe
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john.doe@alberta.ca
   *               username:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 30
   *                 pattern: '^[a-zA-Z0-9_-]+$'
   *                 example: johndoe
   *               password:
   *                 type: string
   *                 format: password
   *                 minLength: 8
   *                 description: Password (minimum 8 characters, must include uppercase, lowercase, number, and special character)
   *                 example: SecurePassword123!
   *               department:
   *                 type: string
   *                 example: Treasury Board and Finance
   *               phone:
   *                 type: string
   *                 pattern: '^\\+?[1-9]\\d{1,14}$'
   *                 example: +1-780-555-0123
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: User registered successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     token:
   *                       type: string
   *                       description: JWT access token
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       409:
   *         description: User already exists
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: Conflict
   *                 message:
   *                   type: string
   *                   example: User with this email already exists
   *       429:
   *         $ref: '#/components/responses/RateLimitError'
   */
  router.post(
    '/register',
    authLimiter,
    security.validateContentType(['application/json']),
    validationMiddleware.sanitizeRequest,
    validationMiddleware.validationSets.userRegistration,
    validationMiddleware.validateRequest,
    authController.register
  );
}

// SSO Routes - Only enabled if SSO is enabled in environment variables
if (process.env.ENABLE_SSO === 'true') {
  // Google OAuth routes
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    /**
     * @swagger
     * /api/auth/google:
     *   get:
     *     tags:
     *       - Authentication
     *       - SSO
     *     summary: Google OAuth login
     *     description: Initiate Google OAuth authentication flow
     *     operationId: googleAuth
     *     security: []
     *     responses:
     *       302:
     *         description: Redirect to Google OAuth
     */
    router.get('/google', authController.googleAuth);
    
    /**
     * @swagger
     * /api/auth/google/callback:
     *   get:
     *     tags:
     *       - Authentication
     *       - SSO
     *     summary: Google OAuth callback
     *     description: Handle Google OAuth callback and complete authentication
     *     operationId: googleCallback
     *     security: []
     *     parameters:
     *       - name: code
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *         description: Authorization code from Google
     *       - name: state
     *         in: query
     *         schema:
     *           type: string
     *         description: State parameter for CSRF protection
     *     responses:
     *       302:
     *         description: Redirect to application with authentication result
     *       400:
     *         description: OAuth authentication failed
     */
    router.get('/google/callback', authController.googleCallback);
  }
  
  // Microsoft OAuth routes
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    /**
     * @swagger
     * /api/auth/microsoft:
     *   get:
     *     tags:
     *       - Authentication
     *       - SSO
     *     summary: Microsoft OAuth login
     *     description: Initiate Microsoft OAuth authentication flow
     *     operationId: microsoftAuth
     *     security: []
     *     responses:
     *       302:
     *         description: Redirect to Microsoft OAuth
     */
    router.get('/microsoft', authController.microsoftAuth);
    
    /**
     * @swagger
     * /api/auth/microsoft/callback:
     *   get:
     *     tags:
     *       - Authentication
     *       - SSO
     *     summary: Microsoft OAuth callback
     *     description: Handle Microsoft OAuth callback and complete authentication
     *     operationId: microsoftCallback
     *     security: []
     *     responses:
     *       302:
     *         description: Redirect to application with authentication result
     */
    router.get('/microsoft/callback', authController.microsoftCallback);
  }
  
  // GitHub OAuth routes
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    /**
     * @swagger
     * /api/auth/github:
     *   get:
     *     tags:
     *       - Authentication
     *       - SSO
     *     summary: GitHub OAuth login
     *     description: Initiate GitHub OAuth authentication flow
     *     operationId: githubAuth
     *     security: []
     *     responses:
     *       302:
     *         description: Redirect to GitHub OAuth
     */
    router.get('/github', authController.githubAuth);
    
    /**
     * @swagger
     * /api/auth/github/callback:
     *   get:
     *     tags:
     *       - Authentication
     *       - SSO
     *     summary: GitHub OAuth callback
     *     description: Handle GitHub OAuth callback and complete authentication
     *     operationId: githubCallback
     *     security: []
     *     responses:
     *       302:
     *         description: Redirect to application with authentication result
     */
    router.get('/github/callback', authController.githubCallback);
  }
}

/**
 * @swagger
 * /api/auth/csrf-token:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get CSRF token
 *     description: Generate and return a CSRF token for the current session
 *     operationId: getCsrfToken
 *     security: []
 *     responses:
 *       200:
 *         description: CSRF token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 csrfToken:
 *                   type: string
 *                   description: CSRF token for session
 *                   example: a1b2c3d4e5f6...
 *       500:
 *         description: Session not available
 */
router.get('/csrf-token', 
  authMiddleware.authenticate,
  authMiddleware.checkAccountStatus,
  (req, res) => {

try {
    if (!req.session) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Session not available'
      });
    }

    const security = require('@/config/security');
    const csrfToken = security.generateCsrfToken(req);
    
    res.status(200).json({
      success: true,
      csrfToken
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate CSRF token'
    });
  }
});

module.exports = router;