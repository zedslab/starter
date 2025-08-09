<template>
  <div class="login-page">
    <!-- Skip link for accessibility -->
    <a href="#main-content" class="goa-skip-link">Skip to main content</a>
    
    <!-- Header -->
    <header class="login-header">
      <div class="goa-container">
        <div class="header-content">
          <div class="logo-section">
            <h1 class="app-title">{{ appName }}</h1>
            <p class="app-subtitle">Government of Alberta</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main id="main-content" class="login-main">
      <div class="goa-container">
        <div class="login-container">
          <!-- Login Card -->
          <div class="goa-card login-card">
            <div class="goa-card-header">
              <h2 class="goa-card-title">Sign In</h2>
              <p class="login-description">
                Enter your credentials to access the System
              </p>
            </div>

            <div class="goa-card-content">
              <!-- Error Alert -->
              <div v-if="error" class="goa-alert goa-alert--error" role="alert">
                <h4 class="goa-alert__title">Sign In Error</h4>
                <p class="goa-alert__content">{{ error }}</p>
              </div>

              <!-- Success Alert (for redirects or messages) -->
              <div v-if="successMessage" class="goa-alert goa-alert--info" role="alert">
                <h4 class="goa-alert__title">Information</h4>
                <p class="goa-alert__content">{{ successMessage }}</p>
              </div>

              <!-- Login Form -->
              <form @submit.prevent="handleLogin" class="login-form" novalidate>
                <!-- Username Field -->
                <div class="goa-form-group">
                  <label class="goa-label goa-label--required" for="username">
                    Username or Email
                  </label>
                  <input
                    id="username"
                    v-model="form.username"
                    type="text"
                    class="goa-input"
                    :class="{ 'goa-input--error': validationErrors.username }"
                    autocomplete="username"
                    autocapitalize="none"
                    spellcheck="false"
                    required
                    :disabled="isLoading"
                    @blur="validateField('username')"
                    @input="clearFieldError('username')"
                  >
                  <div v-if="validationErrors.username" class="goa-error-text">
                    {{ validationErrors.username }}
                  </div>
                  <div class="goa-help-text">
                    Enter your username or email address
                  </div>
                </div>

                <!-- Password Field -->
                <div class="goa-form-group">
                  <label class="goa-label goa-label--required" for="password">
                    Password
                  </label>
                  <div class="password-input-container">
                    <input
                      id="password"
                      v-model="form.password"
                      :type="showPassword ? 'text' : 'password'"
                      class="goa-input password-input"
                      :class="{ 'goa-input--error': validationErrors.password }"
                      autocomplete="current-password"
                      required
                      :disabled="isLoading"
                      @blur="validateField('password')"
                      @input="clearFieldError('password')"
                    >
                    <button
                      type="button"
                      class="password-toggle"
                      :aria-label="showPassword ? 'Hide password' : 'Show password'"
                      @click="togglePasswordVisibility"
                      :disabled="isLoading"
                    >
                      <span class="password-toggle-icon">
                        {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                      </span>
                    </button>
                  </div>
                  <div v-if="validationErrors.password" class="goa-error-text">
                    {{ validationErrors.password }}
                  </div>
                </div>

                <!-- Remember Me Checkbox -->
                <div class="goa-form-group">
                  <label class="checkbox-label">
                    <input
                      v-model="form.rememberMe"
                      type="checkbox"
                      class="checkbox-input"
                      :disabled="isLoading"
                    >
                    <span class="checkbox-text">Keep me signed in</span>
                  </label>
                  <div class="goa-help-text">
                    Your session will be extended for convenience
                  </div>
                </div>

                <!-- Submit Button -->
                <div class="form-actions">
                  <button
                    type="submit"
                    class="goa-button goa-button--primary goa-button--large login-button"
                    :disabled="isLoading || !isFormValid"
                    :aria-describedby="isLoading ? 'loading-status' : null"
                  >
                    <span v-if="isLoading" class="loading-spinner" aria-hidden="true"></span>
                    {{ isLoading ? 'Signing In...' : 'Sign In' }}
                  </button>
                </div>

                <!-- Loading Status for Screen Readers -->
                <div v-if="isLoading" id="loading-status" class="goa-visually-hidden" aria-live="polite">
                  Signing in, please wait...
                </div>
              </form>

              <!-- Additional Links -->
              <div class="login-links">
                <div class="link-group">
                  <a href="#" class="login-link" @click.prevent="handleForgotPassword">
                    Forgot your password?
                  </a>
                </div>
                
                <div v-if="enableRegistration" class="link-group">
                  <span class="link-separator">•</span>
                  <a href="#" class="login-link" @click.prevent="handleRegister">
                    Create an account
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Security Notice -->
          <div class="security-notice">
            <div class="goa-alert goa-alert--info">
              <h4 class="goa-alert__title">Security Notice</h4>
              <p class="goa-alert__content">
                This is a secure government system. Unauthorized access is prohibited and may be subject to criminal prosecution.
                All activities are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="login-footer">
      <div class="goa-container">
        <div class="footer-content">
          <p class="footer-text">
            © {{ currentYear }} Government of Alberta. All rights reserved.
          </p>
          <div class="footer-links">
            <a href="#" class="footer-link">Privacy Policy</a>
            <span class="footer-separator">|</span>
            <a href="#" class="footer-link">Terms of Service</a>
            <span class="footer-separator">|</span>
            <a href="#" class="footer-link">Accessibility</a>
            <span class="footer-separator">|</span>
            <a href="#" class="footer-link">Help</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

// ==========================================
// Composables and Router
// ==========================================

const router = useRouter()
const route = useRoute()
const { login, isLoading, error, isAuthenticated } = useAuth()

// ==========================================
// Reactive Data
// ==========================================

const form = reactive({
  username: '',
  password: '',
  rememberMe: false
})

const validationErrors = reactive({
  username: '',
  password: ''
})

const showPassword = ref(false)
const successMessage = ref('')

// ==========================================
// Configuration
// ==========================================

const appName = import.meta.env.VITE_APP_NAME || 'RED Template'
const enableRegistration = import.meta.env.VITE_ENABLE_REGISTRATION === 'true'
const currentYear = new Date().getFullYear()

// ==========================================
// Computed Properties
// ==========================================

/**
 * Check if form is valid for submission
 */
const isFormValid = computed(() => {
  return form.username.trim() && 
         form.password && 
         !validationErrors.username && 
         !validationErrors.password
})

// ==========================================
// Validation Functions
// ==========================================

/**
 * Validate a specific form field
 * @param {string} field - Field name to validate
 */
function validateField(field) {
  switch (field) {
    case 'username':
      if (!form.username.trim()) {
        validationErrors.username = 'Username or email is required'
      } else if (form.username.trim().length < 2) {
        validationErrors.username = 'Username must be at least 2 characters'
      } else {
        validationErrors.username = ''
      }
      break
      
    case 'password':
      if (!form.password) {
        validationErrors.password = 'Password is required'
      } else if (form.password.length < 3) {
        validationErrors.password = 'Password must be at least 3 characters'
      } else {
        validationErrors.password = ''
      }
      break
  }
}

/**
 * Clear validation error for a specific field
 * @param {string} field - Field name to clear error for
 */
function clearFieldError(field) {
  if (validationErrors[field]) {
    validationErrors[field] = ''
  }
}

/**
 * Validate entire form
 * @returns {boolean} True if form is valid
 */
function validateForm() {
  validateField('username')
  validateField('password')
  
  return !validationErrors.username && !validationErrors.password
}

// ==========================================
// Event Handlers
// ==========================================

/**
 * Handle form submission
 */
async function handleLogin() {
  // Clear any previous errors
  successMessage.value = ''
  
  // Validate form
  if (!validateForm()) {
    return
  }

  try {
    // Attempt login
    await login(form.username, form.password)
    
    // Login successful - redirect to intended page or dashboard
    const redirectTo = route.query.redirect || '/dashboard'
    
    console.log('Login successful, redirecting to:', redirectTo)
    
    // Show success message briefly before redirect
    successMessage.value = 'Login successful! Redirecting...'
    
    // Redirect after a short delay to show success message
    setTimeout(() => {
      router.push(redirectTo)
    }, 1000)
    
  } catch (loginError) {
    console.error('Login failed:', loginError.message)
    
    // Focus back to username field for retry
    setTimeout(() => {
      const usernameField = document.getElementById('username')
      if (usernameField) {
        usernameField.focus()
      }
    }, 100)
  }
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

/**
 * Handle forgot password link
 */
function handleForgotPassword() {
  // In a real app, this would navigate to forgot password page
  alert('Forgot password functionality would be implemented here')
}

/**
 * Handle registration link
 */
function handleRegister() {
  // In a real app, this would navigate to registration page
  router.push('/register')
}

// ==========================================
// Lifecycle and Watchers
// ==========================================

/**
 * Component mounted - check if already authenticated
 */
onMounted(() => {
  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated.value) {
    const redirectTo = route.query.redirect || '/dashboard'
    router.push(redirectTo)
  }
  
  // Check for any success messages from query params
  if (route.query.message) {
    successMessage.value = route.query.message
  }
  
  // Focus username field
  setTimeout(() => {
    const usernameField = document.getElementById('username')
    if (usernameField) {
      usernameField.focus()
    }
  }, 100)
})

/**
 * Watch for authentication state changes
 */
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    const redirectTo = route.query.redirect || '/dashboard'
    router.push(redirectTo)
  }
})

/**
 * Watch for route query changes (e.g., redirect messages)
 */
watch(() => route.query, (newQuery) => {
  if (newQuery.message) {
    successMessage.value = newQuery.message
  }
})
</script>

<style scoped>
/* ==========================================
   Login Page Styles - Alberta.ca Design System
   ========================================== */

.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--goa-color-greyscale-50);
}

/* ==========================================
   Header Styles
   ========================================== */

.login-header {
  background-color: var(--goa-color-brand-default);
  color: var(--goa-color-text-light);
  padding: var(--goa-space-l) 0;
  box-shadow: var(--goa-shadow-sm);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-section {
  text-align: center;
}

.app-title {
  font: var(--goa-typography-heading-l);
  color: var(--goa-color-text-light);
  margin: 0;
}

.app-subtitle {
  font: var(--goa-typography-body-s);
  color: var(--goa-color-brand-light);
  margin: var(--goa-space-xs) 0 0 0;
}

/* ==========================================
   Main Content Styles
   ========================================== */

.login-main {
  flex: 1;
  display: flex;
  align-items: center;
  padding: var(--goa-space-2xl) 0;
}

.login-container {
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}

.login-card {
  margin-bottom: var(--goa-space-xl);
  box-shadow: var(--goa-shadow-lg);
}

.login-description {
  font: var(--goa-typography-body-s);
  color: var(--goa-color-text-secondary);
  margin: var(--goa-space-xs) 0 0 0;
}

/* ==========================================
   Form Styles
   ========================================== */

.login-form {
  margin-top: var(--goa-space-l);
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  padding-right: var(--goa-space-3xl);
}

.password-toggle {
  position: absolute;
  right: var(--goa-space-s);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--goa-space-xs);
  border-radius: var(--goa-border-radius-s);
  color: var(--goa-color-text-secondary);
  transition: background-color var(--goa-transition-fast);
}

.password-toggle:hover {
  background-color: var(--goa-color-greyscale-100);
}

.password-toggle:focus {
  outline: 2px solid var(--goa-color-interactive-focus);
  outline-offset: 2px;
}

.password-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.password-toggle-icon {
  font-size: var(--goa-font-size-3);
  line-height: 1;
}

/* ==========================================
   Checkbox Styles
   ========================================== */

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--goa-space-s);
  cursor: pointer;
  font: var(--goa-typography-body-s);
}

.checkbox-input {
  width: 18px;
  height: 18px;
  border: var(--goa-border-width-s) solid var(--goa-color-greyscale-400);
  border-radius: var(--goa-border-radius-s);
  cursor: pointer;
}

.checkbox-input:checked {
  background-color: var(--goa-color-interactive-default);
  border-color: var(--goa-color-interactive-default);
}

.checkbox-input:focus {
  outline: 2px solid var(--goa-color-interactive-focus);
  outline-offset: 2px;
}

.checkbox-input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.checkbox-text {
  color: var(--goa-color-text-default);
}

/* ==========================================
   Button and Loading Styles
   ========================================== */

.form-actions {
  margin-top: var(--goa-space-xl);
}

.login-button {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--goa-space-s);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ==========================================
   Links Styles
   ========================================== */

.login-links {
  margin-top: var(--goa-space-xl);
  padding-top: var(--goa-space-l);
  border-top: var(--goa-border-width-s) solid var(--goa-color-greyscale-200);
  text-align: center;
}

.link-group {
  display: inline-flex;
  align-items: center;
  gap: var(--goa-space-s);
}

.login-link {
  font: var(--goa-typography-body-s);
  color: var(--goa-color-interactive-default);
  text-decoration: none;
  transition: color var(--goa-transition-fast);
}

.login-link:hover {
  color: var(--goa-color-interactive-hover);
  text-decoration: underline;
}

.login-link:focus {
  outline: 2px solid var(--goa-color-interactive-focus);
  outline-offset: 2px;
  border-radius: var(--goa-border-radius-s);
}

.link-separator {
  color: var(--goa-color-text-secondary);
  margin: 0 var(--goa-space-s);
}

/* ==========================================
   Security Notice Styles
   ========================================== */

.security-notice {
  margin-top: var(--goa-space-l);
}

/* ==========================================
   Footer Styles
   ========================================== */

.login-footer {
  background-color: var(--goa-color-greyscale-100);
  border-top: var(--goa-border-width-s) solid var(--goa-color-greyscale-200);
  padding: var(--goa-space-l) 0;
  margin-top: auto;
}

.footer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--goa-space-s);
  text-align: center;
}

.footer-text {
  font: var(--goa-typography-body-xs);
  color: var(--goa-color-text-secondary);
  margin: 0;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: var(--goa-space-s);
  flex-wrap: wrap;
  justify-content: center;
}

.footer-link {
  font: var(--goa-typography-body-xs);
  color: var(--goa-color-interactive-default);
  text-decoration: none;
  transition: color var(--goa-transition-fast);
}

.footer-link:hover {
  color: var(--goa-color-interactive-hover);
  text-decoration: underline;
}

.footer-link:focus {
  outline: 2px solid var(--goa-color-interactive-focus);
  outline-offset: 2px;
  border-radius: var(--goa-border-radius-s);
}

.footer-separator {
  color: var(--goa-color-text-secondary);
}

/* ==========================================
   Responsive Design
   ========================================== */

@media screen and (max-width: 896px) {
  .login-main {
    padding: var(--goa-space-xl) 0;
  }
  
  .login-container {
    max-width: 100%;
    padding: 0 var(--goa-space-m);
  }
  
  .app-title {
    font-size: var(--goa-font-size-4);
  }
  
  .footer-content {
    gap: var(--goa-space-m);
  }
  
  .footer-links {
    flex-direction: column;
    gap: var(--goa-space-xs);
  }
  
  .footer-separator {
    display: none;
  }
}

@media screen and (max-width: 623px) {
  .login-header {
    padding: var(--goa-space-m) 0;
  }
  
  .login-main {
    padding: var(--goa-space-l) 0;
  }
  
  .login-card {
    margin-bottom: var(--goa-space-l);
  }
  
  .app-title {
    font-size: var(--goa-font-size-3);
  }
  
  .link-group {
    flex-direction: column;
    gap: var(--goa-space-xs);
  }
  
  .link-separator {
    display: none;
  }
}

/* ==========================================
   High Contrast Mode Support
   ========================================== */

@media (prefers-contrast: high) {
  .login-card {
    border: var(--goa-border-width-m) solid var(--goa-color-greyscale-800);
  }
  
  .password-toggle {
    border: var(--goa-border-width-s) solid var(--goa-color-greyscale-600);
  }
}

/* ==========================================
   Reduced Motion Support
   ========================================== */

@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
  
  .password-toggle,
  .login-link,
  .footer-link {
    transition: none;
  }
}

/* ==========================================
   Print Styles
   ========================================== */

@media print {
  .login-page {
    background-color: white;
  }
  
  .login-header,
  .login-footer,
  .security-notice {
    display: none;
  }
  
  .login-main {
    padding: 0;
  }
  
  .login-card {
    box-shadow: none;
    border: var(--goa-border-width-s) solid var(--goa-color-greyscale-400);
  }
}
</style>

