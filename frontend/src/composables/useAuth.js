/**
 * Authentication Composable for Vue 3
 * 
 * A simplified, robust authentication composable that handles:
 * - JWT token management with sessionStorage
 * - HttpOnly refresh token cookies
 * - CSRF token management
 * - User profile management
 * - Authentication state reactivity
 * - Integration with api.js service
 * 
 * @author Manus AI
 * @version 5.0.0 - Simplified and cleaned up
 * @license MIT
 */

import { ref, computed, watch, nextTick } from 'vue'
import api from '../services/api.js'
import router from '../router'

// Global singleton instance to ensure consistent state across components
let globalAuthInstance = null

export function useAuth() {
  // Return existing instance if available (singleton pattern)
  if (globalAuthInstance) {
    return globalAuthInstance
  }

  // ==========================================
  // Reactive State
  // ==========================================
  
  const user = ref(null)
  const accessToken = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const isInitialized = ref(false)

  // ==========================================
  // Configuration from Environment Variables
  // ==========================================
  
  const config = {
    tokenStorageKey: import.meta.env.VITE_TOKEN_STORAGE_KEY || 'accessToken',
    refreshTokenCookieName: import.meta.env.VITE_REFRESH_TOKEN_COOKIE_NAME || 'refresh_token',
    csrfTokenCookieName: import.meta.env.VITE_CSRF_TOKEN_COOKIE_NAME || 'csrf-token',
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  }

  // ==========================================
  // Computed Properties
  // ==========================================
  
  /**
   * Check if user is authenticated
   * User is authenticated if they have both a valid token and user data
   */
  const isAuthenticated = computed(() => {
    const result = !!(accessToken.value && user.value)
    debugLog(`Authentication status: ${result}`, {
      hasToken: !!accessToken.value,
      hasUser: !!user.value,
      userEmail: user.value?.email
    })
    return result
  })

  /**
   * Get user roles for authorization checks
   */
  const userRoles = computed(() => {
    return user.value?.roles || []
  })

  /**
   * Check if user has a specific role
   */
  const hasRole = computed(() => {
    return (role) => {
      return userRoles.value.includes(role)
    }
  })

  /**
   * Check if user is a super admin
   */
  const isSuperAdmin = computed(() => {
    return hasRole.value('SUPER_ADMIN')
  })

  // ==========================================
  // Utility Functions
  // ==========================================
  
  /**
   * Debug logging utility
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  function debugLog(message, data = null) {
    if (config.enableDebug) {
      const timestamp = new Date().toISOString()
      console.log(`[useAuth ${timestamp}] ${message}`, data || '')
    }
  }

  /**
   * Log security events for monitoring
   * @param {string} event - Event name
   * @param {Object} details - Event details
   */
  function logSecurityEvent(event, details = {}) {
    debugLog(`Security Event: ${event}`, details)
    
    // In production, you might want to send this to a security monitoring service
    if (import.meta.env.VITE_SECURITY_ENDPOINT) {
      // Send to security monitoring endpoint
      fetch(import.meta.env.VITE_SECURITY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, details, timestamp: new Date().toISOString() })
      }).catch(() => {
        // Silently fail - don't break app if security logging fails
      })
    }
  }

  /**
   * Check if refresh token cookie exists
   * @returns {boolean} True if refresh token cookie exists
   */
  function hasRefreshToken() {
    const match = document.cookie.match(
      new RegExp(`(^|;\\s*)(${config.refreshTokenCookieName})=([^;]*)`)
    )
    return !!match
  }

  /**
   * Parse JWT token payload
   * @param {string} token - JWT token
   * @returns {Object|null} Parsed payload or null if invalid
   */
  function parseJwtPayload(token) {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      debugLog('Failed to parse JWT payload', error.message)
      return null
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if token is expired
   */
  function isTokenExpired(token) {
    if (!token) return true
    
    const payload = parseJwtPayload(token)
    if (!payload || !payload.exp) return true
    
    const now = Math.floor(Date.now() / 1000)
    return payload.exp <= now
  }

  /**
   * Set token in storage and api service
   * @param {string} token - JWT access token
   */
  function setToken(token) {
    debugLog('Setting access token', { hasToken: !!token })
    
    accessToken.value = token
    
    if (token) {
      sessionStorage.setItem(config.tokenStorageKey, token)
      api.setToken(token)
    } else {
      sessionStorage.removeItem(config.tokenStorageKey)
      api.clearToken()
    }
  }

  /**
   * Clear all authentication data
   */
  function clearAuth() {
    debugLog('Clearing authentication data')
    
    user.value = null
    accessToken.value = null
    error.value = null
    
    sessionStorage.removeItem(config.tokenStorageKey)
    api.clearToken()
    
    logSecurityEvent('auth_cleared')
  }

  // ==========================================
  // Authentication Actions
  // ==========================================
  
  /**
   * Initialize authentication on app startup
   * Checks for existing tokens and validates them
   */
  async function initAuth() {
    if (isInitialized.value) {
      debugLog('Auth already initialized')
      return
    }

    debugLog('Initializing authentication')
    isLoading.value = true
    error.value = null

    try {
      const token = sessionStorage.getItem(config.tokenStorageKey)
      
      if (token) {
        debugLog('Found token in storage')
        
        // Check if token is expired
        if (isTokenExpired(token)) {
          debugLog('Token is expired, attempting refresh')
          logSecurityEvent('expired_token_found')
          
          if (hasRefreshToken()) {
            await refreshToken()
          } else {
            clearAuth()
          }
        } else {
          // Token is valid, set it and fetch user profile
          setToken(token)
          await fetchUserProfile()
          logSecurityEvent('auth_restored_from_token')
        }
      } else if (hasRefreshToken()) {
        debugLog('No access token but refresh token exists, attempting refresh')
        await refreshToken()
      } else {
        debugLog('No tokens found, user not authenticated')
      }
    } catch (error) {
      console.error('[useAuth] Initialization error:', error)
      logSecurityEvent('auth_init_error', { error: error.message })
      clearAuth()
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  /**
   * Login with username and password
   * @param {string} username - User's username or email
   * @param {string} password - User's password
   * @returns {Promise<Object>} Login response
   */
  async function login(username, password) {
    debugLog('Attempting login', { username })
    
    isLoading.value = true
    error.value = null

    try {
      // Validate input
      if (!username || !password) {
        throw new Error('Username and password are required')
      }

      // Make login request to /api/auth/login
      const response = await api.post('/auth/login', {
        username: username.trim(),
        password
      })

      const { accessToken: token, user: userData, expiresIn } = response.data

      if (!token || !userData) {
        throw new Error('Invalid login response from server')
      }

      // Set token and user data
      setToken(token)
      user.value = userData

      logSecurityEvent('login_success', {
        userId: userData._id,
        username: userData.username,
        roles: userData.roles,
        expiresIn
      })

      debugLog('Login successful', {
        userId: userData._id,
        username: userData.username,
        roles: userData.roles
      })

      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed'
      
      logSecurityEvent('login_failed', {
        username,
        error: errorMessage,
        status: error.response?.status
      })

      error.value = errorMessage
      clearAuth()
      
      throw new Error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Logout user and clear all authentication data
   */
  async function logout() {
    debugLog('Logging out user')
    
    isLoading.value = true

    try {
      // Call logout endpoint to clear server-side session
      await api.post('/auth/logout')
      
      logSecurityEvent('logout_success', {
        userId: user.value?._id,
        username: user.value?.username
      })
    } catch (error) {
      // Don't fail logout if server request fails
      debugLog('Logout request failed, continuing with client-side logout', error.message)
      logSecurityEvent('logout_server_error', { error: error.message })
    } finally {
      clearAuth()
      isLoading.value = false
      
      // Redirect to login page
      if (router.currentRoute.value.name !== 'Login') {
        router.push('/login')
      }
    }
  }

  /**
   * Refresh access token using refresh token cookie
   * @returns {Promise<string>} New access token
   */
  async function refreshToken() {
    debugLog('Attempting token refresh')

    if (!hasRefreshToken()) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await api.post('/auth/refresh')
      const { accessToken: newToken, user: userData, expiresIn } = response.data

      if (!newToken) {
        throw new Error('No access token in refresh response')
      }

      setToken(newToken)
      
      if (userData) {
        user.value = userData
      }

      logSecurityEvent('token_refresh_success', {
        userId: userData?._id,
        expiresIn
      })

      debugLog('Token refresh successful')
      return newToken
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      
      logSecurityEvent('token_refresh_failed', {
        error: errorMessage,
        status: error.response?.status
      })

      debugLog('Token refresh failed', errorMessage)
      clearAuth()
      
      throw new Error(errorMessage)
    }
  }

  /**
   * Fetch current user profile
   * @returns {Promise<Object>} User profile data
   */
  async function fetchUserProfile() {
    debugLog('Fetching user profile')

    try {
      const response = await api.get('/auth/profile')
      const userData = response.data

      if (!userData) {
        throw new Error('No user data in profile response')
      }

      user.value = userData
      
      debugLog('User profile fetched successfully', {
        userId: userData._id,
        username: userData.username,
        roles: userData.roles
      })

      return userData
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      
      logSecurityEvent('profile_fetch_failed', {
        error: errorMessage,
        status: error.response?.status
      })

      debugLog('Failed to fetch user profile', errorMessage)
      
      // If profile fetch fails with 401, clear auth
      if (error.response?.status === 401) {
        clearAuth()
      }
      
      throw new Error(errorMessage)
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise<Object>} Updated user data
   */
  async function updateProfile(profileData) {
    debugLog('Updating user profile')

    try {
      const response = await api.put('/auth/profile', profileData)
      const updatedUser = response.data

      user.value = updatedUser

      logSecurityEvent('profile_updated', {
        userId: updatedUser._id,
        fields: Object.keys(profileData)
      })

      debugLog('Profile updated successfully')
      return updatedUser
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      
      logSecurityEvent('profile_update_failed', {
        error: errorMessage,
        status: error.response?.status
      })

      error.value = errorMessage
      throw new Error(errorMessage)
    }
  }

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async function changePassword(currentPassword, newPassword) {
    debugLog('Changing user password')

    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      })

      logSecurityEvent('password_changed', {
        userId: user.value?._id
      })

      debugLog('Password changed successfully')
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      
      logSecurityEvent('password_change_failed', {
        error: errorMessage,
        status: error.response?.status,
        userId: user.value?._id
      })

      error.value = errorMessage
      throw new Error(errorMessage)
    }
  }

  // ==========================================
  // Watchers
  // ==========================================
  
  // Watch for authentication state changes
  watch(isAuthenticated, (newValue, oldValue) => {
    if (newValue !== oldValue) {
      debugLog(`Authentication state changed: ${oldValue} -> ${newValue}`)
      
      // Force reactivity update
      nextTick(() => {
        debugLog('Post-auth change state', {
          isAuthenticated: isAuthenticated.value,
          hasUser: !!user.value,
          userEmail: user.value?.email
        })
      })
    }
  })

  // ==========================================
  // Create and Return Singleton Instance
  // ==========================================
  
  const authInstance = {
    // State
    user: readonly(user),
    accessToken: readonly(accessToken),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isInitialized: readonly(isInitialized),
    
    // Computed
    isAuthenticated,
    userRoles,
    hasRole,
    isSuperAdmin,
    
    // Actions
    initAuth,
    login,
    logout,
    refreshToken,
    fetchUserProfile,
    updateProfile,
    changePassword,
    
    // Utilities
    clearAuth,
    hasRefreshToken,
    isTokenExpired: (token) => isTokenExpired(token || accessToken.value)
  }

  // Store as global singleton
  globalAuthInstance = authInstance

  debugLog('useAuth composable created')
  
  return authInstance
}

// Helper function to make properties readonly
function readonly(ref) {
  return computed(() => ref.value)
}

