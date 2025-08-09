import axios from 'axios';
import router from '../router';

/**
 * Universal API Service for Vue.js Applications
 * 
 * A comprehensive, production-ready API service that handles:
 * - JWT token management with automatic refresh
 * - HttpOnly cookie-based refresh tokens
 * - CSRF token lifecycle management
 * - Request/response interceptors with robust error handling
 * - Rate limiting and retry mechanisms
 * - Security logging and monitoring
 * - File upload/download capabilities
 * 
 * Security Features:
 * - Automatic token refresh with queue management
 * - CSRF protection with token rotation
 * - Request fingerprinting and validation
 * - Comprehensive error handling and recovery
 * - Security event logging
 * - Environment-aware configuration
 * 
 * @author Manus AI
 * @version 2.0.0
 * @license MIT
 */
class ApiService {
  /**
   * Initialize the API service with comprehensive security configuration
   * 
   * Environment Variables:
   * - VITE_API_BASE_URL: Base URL for API endpoints
   * - VITE_API_TIMEOUT: Request timeout in milliseconds
   * - VITE_MAX_RETRY_ATTEMPTS: Maximum retry attempts for failed requests
   * - VITE_RETRY_DELAY: Base delay between retries in milliseconds
   * - VITE_TOKEN_STORAGE_KEY: Key for storing access tokens
   * - VITE_REFRESH_TOKEN_COOKIE_NAME: Name of refresh token cookie
   * - VITE_CSRF_TOKEN_COOKIE_NAME: Name of CSRF token cookie
   * - VITE_TOKEN_REFRESH_THRESHOLD: Time before expiry to refresh token (ms)
   * - VITE_ENABLE_DEBUG: Enable debug logging
   * - VITE_ENABLE_SECURITY_LOGGING: Enable security event logging
   * - VITE_REQUEST_FINGERPRINTING: Enable request fingerprinting
   */
  constructor() {
    // Core configuration from environment variables
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    this.timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);
    this.maxRetries = parseInt(import.meta.env.VITE_MAX_RETRY_ATTEMPTS || '3', 10);
    this.retryDelay = parseInt(import.meta.env.VITE_RETRY_DELAY || '1000', 10);
    
    // Token management configuration
    this.tokenStorageKey = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'accessToken';
    this.refreshTokenCookieName = import.meta.env.VITE_REFRESH_TOKEN_COOKIE_NAME || 'refresh_token';
    this.csrfTokenCookieName = import.meta.env.VITE_CSRF_TOKEN_COOKIE_NAME || 'csrf-token';
    this.tokenRefreshThreshold = parseInt(import.meta.env.VITE_TOKEN_REFRESH_THRESHOLD || '300000', 10); // 5 minutes
    
    // Feature flags
    this.enableDebug = import.meta.env.VITE_ENABLE_DEBUG === 'true';
    this.enableSecurityLogging = import.meta.env.VITE_ENABLE_SECURITY_LOGGING === 'true';
    this.enableRequestFingerprinting = import.meta.env.VITE_REQUEST_FINGERPRINTING === 'true';
    
    // Create axios instance with security-first configuration
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // CSRF protection
      },
      withCredentials: true, // Essential for HttpOnly cookies and CSRF tokens
    });

    // State management for token refresh and request queuing
    this.isRefreshing = false;
    this.failedQueue = [];
    this.retryCount = 0;
    this.tokenExpirationTimer = null;
    this.csrfToken = null;
    this.csrfTokenExpiry = null;
    
    // Security monitoring
    this.securityEvents = [];
    this.requestFingerprint = null;
    
    // Initialize the service
    this.initializeService();
  }

  /**
   * Initialize the API service
   * Sets up interceptors, fetches initial CSRF token, and configures security
   */
  async initializeService() {
    this.setupInterceptors();
    this.setupTokenExpirationTimer();
    this.generateRequestFingerprint();
    
    // Fetch initial CSRF token if not available
    await this.ensureCsrfToken();
    
    this.logSecurityEvent('service_initialized', {
      baseURL: this.baseURL,
      features: {
        debug: this.enableDebug,
        securityLogging: this.enableSecurityLogging,
        requestFingerprinting: this.enableRequestFingerprinting,
      }
    });
  }

  /**
   * Setup comprehensive request and response interceptors
   * Handles authentication, CSRF protection, error recovery, and security logging
   */
  setupInterceptors() {
    // Request interceptor - adds security headers and tokens
    this.api.interceptors.request.use(
      async config => {
        // Ensure CSRF token is available for state-changing requests
        if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
          await this.ensureCsrfToken();
        }

        // Add access token to Authorization header
        const token = this.getToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Add CSRF token for state-changing requests
        const csrfToken = this.getCsrfToken();
        if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }

        // Add request fingerprint for additional security
        if (this.enableRequestFingerprinting && this.requestFingerprint) {
          config.headers['X-Request-Fingerprint'] = this.requestFingerprint;
        }

        // Add unique request ID for tracking and debugging
        const requestId = this.generateRequestId();
        config.headers['X-Request-ID'] = requestId;
        config.metadata = { requestId, startTime: Date.now() };

        // Add client information for security monitoring
        config.headers['X-Client-Version'] = this.getClientVersion();
        config.headers['X-Client-Timestamp'] = new Date().toISOString();

        // Log request in development mode
        if (this.enableDebug) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            data: config.data,
            requestId
          });
        }

        // Log security-relevant requests
        if (this.enableSecurityLogging) {
          this.logSecurityEvent('request_sent', {
            method: config.method?.toUpperCase(),
            url: config.url,
            requestId,
            hasAuth: !!token,
            hasCsrf: !!csrfToken,
          });
        }

        return config;
      },
      error => {
        console.error('[API] Request interceptor error:', error);
        this.logSecurityEvent('request_error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor - handles errors, token refresh, and security monitoring
    this.api.interceptors.response.use(
      response => {
        // Reset retry count on successful response
        this.retryCount = 0;
        
        // Calculate request duration for monitoring
        const duration = response.config.metadata ? 
          Date.now() - response.config.metadata.startTime : 0;
        
        // Check for new CSRF token in response headers
        const newCsrfToken = response.headers['x-csrf-token'];
        if (newCsrfToken) {
          this.setCsrfToken(newCsrfToken);
        }

        // Log successful response in development
        if (this.enableDebug) {
          console.log(`[API] Response ${response.status} (${duration}ms):`, {
            requestId: response.config.metadata?.requestId,
            status: response.status,
            duration,
            data: response.data
          });
        }

        // Log security-relevant responses
        if (this.enableSecurityLogging) {
          this.logSecurityEvent('response_received', {
            status: response.status,
            requestId: response.config.metadata?.requestId,
            duration,
            hasNewCsrf: !!newCsrfToken,
          });
        }

        return response;
      },
      async error => {
        const originalRequest = error.config;
        const requestId = originalRequest?.metadata?.requestId;

        // Log all errors for security monitoring
        this.logSecurityEvent('response_error', {
          status: error.response?.status,
          message: error.message,
          requestId,
          url: originalRequest?.url,
          method: originalRequest?.method,
        });

        // Handle 401 Unauthorized - Token expired or invalid
        if (error.response?.status === 401 && !originalRequest._retry) {
          return this.handleUnauthorizedError(error, originalRequest);
        }

        // Handle 403 Forbidden - CSRF token issues or insufficient permissions
        if (error.response?.status === 403) {
          return this.handleForbiddenError(error, originalRequest);
        }

        // Handle 429 Rate Limiting
        if (error.response?.status === 429) {
          return this.handleRateLimitError(error, originalRequest);
        }

        // Handle network errors with retry logic
        if (error.message === 'Network Error' || error.code === 'NETWORK_ERROR') {
          return this.handleNetworkError(error, originalRequest);
        }

        // Handle timeout errors
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          return this.handleTimeoutError(error, originalRequest);
        }

        // Handle server errors (5xx) with retry
        if (error.response?.status >= 500) {
          return this.handleServerError(error, originalRequest);
        }

        // Log unhandled errors
        console.error('[API] Unhandled response error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle 401 Unauthorized errors with intelligent token refresh
   * Implements queue management to prevent multiple simultaneous refresh attempts
   * 
   * @param {Error} error - The 401 error
   * @param {Object} originalRequest - The original axios request config
   * @returns {Promise} - Resolves with retry response or rejects with error
   */
  async handleUnauthorizedError(error, originalRequest) {
    this.logSecurityEvent('unauthorized_error', {
      url: originalRequest?.url,
      requestId: originalRequest?.metadata?.requestId,
      isRefreshing: this.isRefreshing,
    });

    // If already refreshing, queue the request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return this.api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    // Check if we've exceeded max retries
    if (this.retryCount >= this.maxRetries) {
      this.logSecurityEvent('max_retries_exceeded', {
        retryCount: this.retryCount,
        maxRetries: this.maxRetries,
      });
      this.clearAuth();
      this.redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    this.isRefreshing = true;

    try {
      // Check if refresh token cookie exists
      if (!this.hasRefreshToken()) {
        throw new Error('No refresh token available');
      }

      // Add exponential backoff delay
      await this.delay(Math.min(this.retryCount * this.retryDelay, 10000));
      this.retryCount++;

      this.logSecurityEvent('token_refresh_attempt', {
        attempt: this.retryCount,
        requestId: originalRequest?.metadata?.requestId,
      });

      // Attempt to refresh token
      const response = await this.api.post('/auth/refresh');
      const { accessToken, expiresIn } = response.data;
      
      // Store new token and setup expiration timer
      this.setToken(accessToken);
      this.setupTokenExpirationTimer(expiresIn * 1000);
      
      // Process queued requests with new token
      this.processQueue(null, accessToken);
      
      // Reset retry count on success
      this.retryCount = 0;
      
      this.logSecurityEvent('token_refresh_success', {
        expiresIn,
        queueSize: this.failedQueue.length,
      });
      
      // Retry original request with new token
      originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
      return this.api(originalRequest);
      
    } catch (refreshError) {
      console.error('[API] Token refresh failed:', refreshError);
      this.logSecurityEvent('token_refresh_failed', {
        error: refreshError.message,
        status: refreshError.response?.status,
      });
      
      this.processQueue(refreshError, null);
      this.clearAuth();
      this.redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Handle 403 Forbidden errors - may indicate CSRF token issues
   * Attempts to refresh CSRF token and retry the request
   * 
   * @param {Error} error - The 403 error
   * @param {Object} originalRequest - The original axios request config
   * @returns {Promise} - Resolves with retry response or rejects with error
   */
  async handleForbiddenError(error, originalRequest) {
    this.logSecurityEvent('forbidden_error', {
      url: originalRequest?.url,
      requestId: originalRequest?.metadata?.requestId,
      hasAuth: !!originalRequest.headers['Authorization'],
      hasCsrf: !!originalRequest.headers['X-CSRF-Token'],
    });

    // Check if this might be a CSRF token issue
    const errorMessage = error.response?.data?.message || '';
    const isCsrfError = errorMessage.toLowerCase().includes('csrf') || 
                       errorMessage.toLowerCase().includes('token') ||
                       error.response?.data?.error === 'CSRF_TOKEN_MISMATCH';

    if (isCsrfError && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;
      
      try {
        // Fetch fresh CSRF token
        await this.fetchCsrfToken();
        const newCsrfToken = this.getCsrfToken();
        
        if (newCsrfToken) {
          originalRequest.headers['X-CSRF-Token'] = newCsrfToken;
          this.logSecurityEvent('csrf_token_refreshed', {
            requestId: originalRequest?.metadata?.requestId,
          });
          return this.api(originalRequest);
        }
      } catch (csrfError) {
        this.logSecurityEvent('csrf_refresh_failed', {
          error: csrfError.message,
        });
      }
    }

    // If not a CSRF issue or CSRF refresh failed, don't retry
    console.error('[API] Permission denied:', error.response?.data);
    return Promise.reject(error);
  }

  /**
   * Handle 429 Rate Limiting errors with exponential backoff
   * 
   * @param {Error} error - The 429 error
   * @param {Object} originalRequest - The original axios request config
   * @returns {Promise} - Resolves with retry response or rejects with error
   */
  async handleRateLimitError(error, originalRequest) {
    const retryAfter = error.response?.headers['retry-after'];
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.retryCount * this.retryDelay;
    
    this.logSecurityEvent('rate_limit_error', {
      retryAfter,
      delay,
      attempt: this.retryCount,
      url: originalRequest?.url,
    });

    console.warn('[API] Rate limit exceeded:', error.response?.data);
    
    if (this.retryCount < this.maxRetries) {
      await this.delay(Math.min(delay, 30000)); // Max 30 second delay
      this.retryCount++;
      return this.api(originalRequest);
    } else {
      console.error('[API] Max retries reached for rate-limited request');
      return Promise.reject(error);
    }
  }

  /**
   * Handle network errors with retry logic
   * 
   * @param {Error} error - The network error
   * @param {Object} originalRequest - The original axios request config
   * @returns {Promise} - Resolves with retry response or rejects with error
   */
  async handleNetworkError(error, originalRequest) {
    this.logSecurityEvent('network_error', {
      attempt: this.retryCount,
      url: originalRequest?.url,
      requestId: originalRequest?.metadata?.requestId,
    });

    console.error('[API] Network error - check your connection');
    
    if (this.retryCount < this.maxRetries) {
      await this.delay(this.retryCount * this.retryDelay);
      this.retryCount++;
      return this.api(originalRequest);
    }
    return Promise.reject(error);
  }

  /**
   * Handle timeout errors with retry logic
   * 
   * @param {Error} error - The timeout error
   * @param {Object} originalRequest - The original axios request config
   * @returns {Promise} - Resolves with retry response or rejects with error
   */
  async handleTimeoutError(error, originalRequest) {
    this.logSecurityEvent('timeout_error', {
      attempt: this.retryCount,
      timeout: this.timeout,
      url: originalRequest?.url,
    });

    console.error('[API] Request timeout - server took too long to respond');
    
    if (this.retryCount < this.maxRetries) {
      await this.delay(this.retryCount * this.retryDelay);
      this.retryCount++;
      return this.api(originalRequest);
    }
    return Promise.reject(error);
  }

  /**
   * Handle server errors (5xx) with retry logic
   * 
   * @param {Error} error - The server error
   * @param {Object} originalRequest - The original axios request config
   * @returns {Promise} - Resolves with retry response or rejects with error
   */
  async handleServerError(error, originalRequest) {
    this.logSecurityEvent('server_error', {
      status: error.response?.status,
      attempt: this.retryCount,
      url: originalRequest?.url,
    });

    console.error('[API] Server error:', error.response?.status, error.response?.data);
    
    if (this.retryCount < this.maxRetries) {
      await this.delay(this.retryCount * this.retryDelay);
      this.retryCount++;
      return this.api(originalRequest);
    }
    return Promise.reject(error);
  }

  /**
   * Process queued requests after token refresh
   * Resolves or rejects all queued requests based on refresh result
   * 
   * @param {Error|null} error - Error if refresh failed, null if successful
   * @param {string|null} token - New access token if refresh successful
   */
  processQueue(error, token) {
    this.failedQueue.forEach(request => {
      if (error) {
        request.reject(error);
      } else {
        request.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  /**
   * Setup automatic token refresh timer
   * Refreshes token before it expires to prevent 401 errors
   * 
   * @param {number|null} expiresIn - Token expiration time in milliseconds
   */
  setupTokenExpirationTimer(expiresIn = null) {
    // Clear existing timer
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }

    // If no expiration time provided, try to get from stored token
    if (!expiresIn) {
      const token = this.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const now = Math.floor(Date.now() / 1000);
          expiresIn = (payload.exp - now) * 1000; // Convert to milliseconds
        } catch (e) {
          console.warn('[API] Could not parse token expiration');
          return;
        }
      } else {
        return;
      }
    }

    // Set timer to refresh token before it expires
    const refreshTime = Math.max(expiresIn - this.tokenRefreshThreshold, 0);
    
    if (refreshTime > 0) {
      this.tokenExpirationTimer = setTimeout(async () => {
        try {
          this.logSecurityEvent('automatic_token_refresh', {
            refreshTime,
            threshold: this.tokenRefreshThreshold,
          });
          await this.refreshToken();
        } catch (error) {
          console.error('[API] Automatic token refresh failed:', error);
          this.logSecurityEvent('automatic_refresh_failed', {
            error: error.message,
          });
          this.clearAuth();
          this.redirectToLogin();
        }
      }, refreshTime);
    }
  }

  /**
   * Manually refresh the access token
   * Uses the refresh token cookie to get a new access token
   * 
   * @returns {Promise} - Resolves with refresh response
   * @throws {Error} - If no refresh token available or refresh fails
   */
  async refreshToken() {
    if (!this.hasRefreshToken()) {
      throw new Error('No refresh token available');
    }

    const response = await this.api.post('/auth/refresh');
    const { accessToken, expiresIn } = response.data;
    
    this.setToken(accessToken);
    this.setupTokenExpirationTimer(expiresIn * 1000);
    
    this.logSecurityEvent('manual_token_refresh', {
      expiresIn,
    });
    
    return response;
  }

  /**
   * Ensure CSRF token is available and valid
   * Fetches a new token if none exists or current token is expired
   * 
   * @returns {Promise<void>}
   */
  async ensureCsrfToken() {
    const currentToken = this.getCsrfToken();
    const now = Date.now();
    
    // Check if we need a new CSRF token
    if (!currentToken || (this.csrfTokenExpiry && now >= this.csrfTokenExpiry)) {
      await this.fetchCsrfToken();
    }
  }

  /**
   * Fetch a fresh CSRF token from the server
   * 
   * @returns {Promise<void>}
   */
  async fetchCsrfToken() {
    try {
      const response = await this.api.get('/auth/csrf-token');
      const { csrfToken, expiresIn } = response.data;
      
      this.setCsrfToken(csrfToken);
      this.csrfTokenExpiry = Date.now() + (expiresIn * 1000);
      
      this.logSecurityEvent('csrf_token_fetched', {
        expiresIn,
      });
    } catch (error) {
      console.error('[API] Failed to fetch CSRF token:', error);
      this.logSecurityEvent('csrf_fetch_failed', {
        error: error.message,
      });
    }
  }

  /**
   * Set CSRF token in memory and optionally in cookie
   * 
   * @param {string} token - The CSRF token
   */
  setCsrfToken(token) {
    this.csrfToken = token;
    // Note: Server should set the CSRF token cookie, but we store in memory as backup
  }

  /**
   * Check if refresh token cookie exists
   * 
   * @returns {boolean} - True if refresh token cookie exists
   */
  hasRefreshToken() {
    const match = document.cookie.match(new RegExp(`(^|;\\s*)(${this.refreshTokenCookieName})=([^;]*)`));
    return !!match;
  }

  /**
   * Get CSRF token from memory or cookie
   * Prioritizes memory storage over cookie for performance
   * 
   * @returns {string|null} - The CSRF token or null if not found
   */
  getCsrfToken() {
    // First check memory storage
    if (this.csrfToken) {
      return this.csrfToken;
    }
    
    // Fallback to cookie
    const match = document.cookie.match(new RegExp(`(^|;\\s*)(${this.csrfTokenCookieName})=([^;]*)`));
    const token = match ? decodeURIComponent(match[3]) : null;
    
    if (token) {
      this.csrfToken = token; // Cache in memory
    }
    
    return token;
  }

  /**
   * Generate a unique request ID for tracking and debugging
   * 
   * @returns {string} - A UUID v4 string
   */
  generateRequestId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate a request fingerprint for additional security
   * Creates a unique identifier based on client characteristics
   */
  generateRequestFingerprint() {
    if (!this.enableRequestFingerprinting) {
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Request fingerprint', 2, 2);
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL(),
      ].join('|');
      
      // Create a simple hash
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      this.requestFingerprint = Math.abs(hash).toString(16);
    } catch (error) {
      console.warn('[API] Could not generate request fingerprint:', error);
    }
  }

  /**
   * Get client version information
   * 
   * @returns {string} - Client version string
   */
  getClientVersion() {
    return import.meta.env.VITE_APP_VERSION || '1.0.0';
  }

  /**
   * Log security events for monitoring and auditing
   * 
   * @param {string} event - The event type
   * @param {Object} data - Additional event data
   */
  logSecurityEvent(event, data = {}) {
    if (!this.enableSecurityLogging) {
      return;
    }

    const securityEvent = {
      timestamp: new Date().toISOString(),
      event,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.securityEvents.push(securityEvent);
    
    // Keep only last 100 events to prevent memory issues
    if (this.securityEvents.length > 100) {
      this.securityEvents = this.securityEvents.slice(-100);
    }

    // In development, also log to console
    if (this.enableDebug) {
      console.log(`[SECURITY] ${event}:`, data);
    }

    // In production, you might want to send these to a security monitoring service
    if (import.meta.env.PROD && import.meta.env.VITE_SECURITY_ENDPOINT) {
      // Send to security monitoring endpoint (implement as needed)
      // this.sendSecurityEvent(securityEvent);
    }
  }

  /**
   * Get recent security events for debugging
   * 
   * @param {number} limit - Maximum number of events to return
   * @returns {Array} - Array of security events
   */
  getSecurityEvents(limit = 50) {
    return this.securityEvents.slice(-limit);
  }

  /**
   * Delay execution for specified milliseconds
   * Used for retry logic and rate limiting
   * 
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Set access token in sessionStorage
   * SessionStorage is used instead of localStorage for security
   * 
   * @param {string|null} token - The access token to store
   */
  setToken(token) {
    if (token) {
      sessionStorage.setItem(this.tokenStorageKey, token);
    } else {
      sessionStorage.removeItem(this.tokenStorageKey);
    }
  }

  /**
   * Get access token from sessionStorage
   * 
   * @returns {string|null} - The stored access token
   */
  getToken() {
    return sessionStorage.getItem(this.tokenStorageKey);
  }

  /**
   * Clear access token from sessionStorage and cancel expiration timer
   */
  clearToken() {
    sessionStorage.removeItem(this.tokenStorageKey);
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }

  /**
   * Clear all authentication data
   * Removes tokens and resets security state
   */
  clearAuth() {
    this.clearToken();
    this.csrfToken = null;
    this.csrfTokenExpiry = null;
    this.logSecurityEvent('auth_cleared');
    // Note: HttpOnly refresh token cookie will be cleared by server on logout
  }

  /**
   * Redirect to login page
   * Only redirects if not already on login page to prevent loops
   */
  redirectToLogin() {
    if (router.currentRoute.value.path !== '/login') {
      this.logSecurityEvent('redirect_to_login', {
        from: router.currentRoute.value.path,
      });
      router.push('/login');
    }
  }

  /**
   * Check if user is authenticated
   * Verifies both token existence and validity
   * 
   * @returns {boolean} - True if user has valid authentication
   */
  isAuthenticated() {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (error) {
      console.warn('[API] Invalid token format');
      return false;
    }
  }

  /**
   * Get user information from stored token
   * 
   * @returns {Object|null} - User information or null if no valid token
   */
  getUserInfo() {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id,
        email: payload.email,
        accessLevel: payload.accessLevel,
        userType: payload.userType,
        exp: payload.exp,
        iat: payload.iat,
      };
    } catch (error) {
      console.warn('[API] Could not parse token payload');
      return null;
    }
  }

  /**
   * Logout user and clear all authentication data
   * Calls server logout endpoint and clears local state
   * 
   * @returns {Promise} - Resolves when logout is complete
   */
  async logout() {
    try {
      // Call server logout endpoint to clear refresh token cookie
      await this.api.post('/auth/logout');
      this.logSecurityEvent('logout_success');
    } catch (error) {
      console.error('[API] Logout request failed:', error);
      this.logSecurityEvent('logout_failed', { error: error.message });
    } finally {
      // Clear local authentication data regardless of server response
      this.clearAuth();
      this.redirectToLogin();
    }
  }

  // ==========================================
  // HTTP Method Wrappers
  // ==========================================

  /**
   * Perform GET request
   * 
   * @param {string} url - Request URL
   * @param {Object} params - Query parameters
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Axios response promise
   */
  get(url, params = {}, config = {}) {
    return this.api.get(url, { params, ...config });
  }

  /**
   * Perform POST request
   * 
   * @param {string} url - Request URL
   * @param {Object} data - Request body data
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Axios response promise
   */
  post(url, data = {}, config = {}) {
    return this.api.post(url, data, config);
  }

  /**
   * Perform PUT request
   * 
   * @param {string} url - Request URL
   * @param {Object} data - Request body data
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Axios response promise
   */
  put(url, data = {}, config = {}) {
    return this.api.put(url, data, config);
  }

  /**
   * Perform PATCH request
   * 
   * @param {string} url - Request URL
   * @param {Object} data - Request body data
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Axios response promise
   */
  patch(url, data = {}, config = {}) {
    return this.api.patch(url, data, config);
  }

  /**
   * Perform DELETE request
   * 
   * @param {string} url - Request URL
   * @param {Object} params - Query parameters
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Axios response promise
   */
  delete(url, params = {}, config = {}) {
    return this.api.delete(url, { params, ...config });
  }

  /**
   * Upload file with progress tracking and security validation
   * 
   * @param {string} url - Upload endpoint URL
   * @param {FormData} formData - Form data containing file(s)
   * @param {Function} onUploadProgress - Progress callback function
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Axios response promise
   */
  upload(url, formData, onUploadProgress = null, config = {}) {
    // Validate file types and sizes if configured
    if (import.meta.env.VITE_UPLOAD_VALIDATION === 'true') {
      this.validateUpload(formData);
    }

    return this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted, progressEvent);
        }
      },
      ...config,
    });
  }

  /**
   * Validate upload files for security
   * 
   * @param {FormData} formData - Form data to validate
   * @throws {Error} - If validation fails
   */
  validateUpload(formData) {
    const maxFileSize = parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760', 10); // 10MB default
    const allowedTypes = (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/*,application/pdf').split(',');

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Check file size
        if (value.size > maxFileSize) {
          throw new Error(`File ${value.name} exceeds maximum size of ${maxFileSize} bytes`);
        }

        // Check file type
        const isAllowed = allowedTypes.some(type => {
          if (type.endsWith('/*')) {
            return value.type.startsWith(type.slice(0, -1));
          }
          return value.type === type;
        });

        if (!isAllowed) {
          throw new Error(`File type ${value.type} is not allowed`);
        }

        this.logSecurityEvent('file_upload_validated', {
          fileName: value.name,
          fileSize: value.size,
          fileType: value.type,
        });
      }
    }
  }

  /**
   * Download file with security headers
   * 
   * @param {string} url - Download URL
   * @param {Object} params - Query parameters
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Axios response promise with blob data
   */
  download(url, params = {}, config = {}) {
    return this.api.get(url, {
      params,
      responseType: 'blob',
      ...config,
    });
  }

  /**
   * Download file and trigger browser download
   * 
   * @param {string} url - Download URL
   * @param {string} filename - Suggested filename
   * @param {Object} params - Query parameters
   * @returns {Promise} - Resolves when download starts
   */
  async downloadFile(url, filename, params = {}) {
    try {
      const response = await this.download(url, params);
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(downloadUrl);
      
      this.logSecurityEvent('file_downloaded', {
        filename,
        size: response.data.size,
      });
    } catch (error) {
      console.error('[API] Download failed:', error);
      this.logSecurityEvent('download_failed', {
        filename,
        error: error.message,
      });
      throw error;
    }
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  /**
   * Get API service health status
   * 
   * @returns {Object} - Health status information
   */
  getHealthStatus() {
    return {
      isAuthenticated: this.isAuthenticated(),
      hasRefreshToken: this.hasRefreshToken(),
      hasCsrfToken: !!this.getCsrfToken(),
      retryCount: this.retryCount,
      isRefreshing: this.isRefreshing,
      queueSize: this.failedQueue.length,
      securityEventsCount: this.securityEvents.length,
      baseURL: this.baseURL,
      features: {
        debug: this.enableDebug,
        securityLogging: this.enableSecurityLogging,
        requestFingerprinting: this.enableRequestFingerprinting,
      },
    };
  }

  /**
   * Reset retry counter and clear failed queue
   * Useful for manual recovery scenarios
   */
  resetRetryState() {
    this.retryCount = 0;
    this.failedQueue = [];
    this.isRefreshing = false;
    this.logSecurityEvent('retry_state_reset');
  }

  /**
   * Update configuration at runtime
   * 
   * @param {Object} config - Configuration updates
   */
  updateConfig(config) {
    if (config.baseURL) {
      this.baseURL = config.baseURL;
      this.api.defaults.baseURL = config.baseURL;
    }
    
    if (config.timeout) {
      this.timeout = config.timeout;
      this.api.defaults.timeout = config.timeout;
    }
    
    if (config.maxRetries !== undefined) {
      this.maxRetries = config.maxRetries;
    }
    
    if (config.retryDelay !== undefined) {
      this.retryDelay = config.retryDelay;
    }
    
    this.logSecurityEvent('config_updated', config);
  }
}

// Export singleton instance
export default new ApiService();

/**
 * Usage Examples:
 * 
 * // Basic usage
 * import api from '@/services/api';
 * 
 * // GET request
 * const users = await api.get('/users');
 * 
 * // POST request with data
 * const newUser = await api.post('/users', { name: 'John', email: 'john@example.com' });
 * 
 * // File upload with progress
 * const formData = new FormData();
 * formData.append('file', file);
 * await api.upload('/upload', formData, (progress) => {
 *   console.log(`Upload progress: ${progress}%`);
 * });
 * 
 * // File download
 * await api.downloadFile('/files/report.pdf', 'monthly-report.pdf');
 * 
 * // Check authentication status
 * if (api.isAuthenticated()) {
 *   const userInfo = api.getUserInfo();
 *   console.log('Current user:', userInfo);
 * }
 * 
 * // Manual logout
 * await api.logout();
 * 
 * // Get service health
 * const health = api.getHealthStatus();
 * console.log('API Health:', health);
 * 
 * // Get security events for debugging
 * const events = api.getSecurityEvents(10);
 * console.log('Recent security events:', events);
 */

