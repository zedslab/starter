# Authentication System Documentation

## Overview

This authentication system provides a comprehensive, secure, and user-friendly authentication solution for Vue.js applications using the Alberta.ca design system. The system implements modern security best practices including JWT tokens, HttpOnly cookies, CSRF protection, and robust error handling.

## Architecture

### Components Overview

```
Authentication System
├── useAuth.js          # Core authentication composable
├── Login.vue           # Login interface component
├── Dashboard.vue       # Protected dashboard component
└── api.js             # API service integration
```

### Security Features

- **JWT Access Tokens**: Stored in sessionStorage for API authentication
- **HttpOnly Refresh Tokens**: Secure cookies for token renewal
- **CSRF Protection**: Token-based CSRF protection for state-changing requests
- **Automatic Token Refresh**: Seamless token renewal without user intervention
- **Security Logging**: Comprehensive security event monitoring
- **Input Validation**: Client-side and server-side validation
- **Rate Limiting**: Protection against brute force attacks

## useAuth.js Composable

### Purpose

The `useAuth.js` composable is the core of the authentication system. It provides a centralized, reactive authentication state management solution that integrates seamlessly with Vue 3's Composition API.

### Key Features

#### 🔐 **Authentication State Management**
- Reactive user state with automatic updates
- Token lifecycle management
- Session persistence across browser refreshes
- Singleton pattern to ensure consistent state

#### 🔄 **Token Management**
- JWT access token handling with sessionStorage
- HttpOnly refresh token cookie integration
- Automatic token expiration detection
- Seamless token refresh with queue management

#### 🛡️ **Security Features**
- CSRF token management
- Security event logging
- Request fingerprinting (optional)
- Comprehensive error handling

#### ♿ **Accessibility & UX**
- Loading states for better user feedback
- Error state management
- Automatic redirects after authentication

### API Reference

#### State Properties

```javascript
const {
  // Reactive state (readonly)
  user,              // Current user object
  accessToken,       // Current JWT access token
  isLoading,         // Loading state for async operations
  error,             // Current error message
  isInitialized,     // Whether auth has been initialized
  
  // Computed properties
  isAuthenticated,   // Boolean: user is logged in
  userRoles,         // Array: user's roles
  hasRole,           // Function: check if user has specific role
  isSuperAdmin,      // Boolean: user is super admin
  
  // Actions
  initAuth,          // Initialize authentication
  login,             // Login with credentials
  logout,            // Logout and clear session
  refreshToken,      // Manually refresh token
  fetchUserProfile,  // Fetch current user profile
  updateProfile,     // Update user profile
  changePassword,    // Change user password
  
  // Utilities
  clearAuth,         // Clear all auth data
  hasRefreshToken,   // Check if refresh token exists
  isTokenExpired     // Check if token is expired
} = useAuth()
```

#### Methods

##### `initAuth()`
Initializes the authentication system on app startup.

```javascript
await initAuth()
```

**What it does:**
- Checks for existing tokens in sessionStorage
- Validates token expiration
- Attempts token refresh if needed
- Fetches user profile if token is valid
- Sets up initial authentication state

**When to use:**
- Call once in your main.js or App.vue
- Essential for restoring authentication state on page refresh

##### `login(username, password)`
Authenticates user with credentials.

```javascript
try {
  const result = await login('user@example.com', 'password123')
  console.log('Login successful:', result)
} catch (error) {
  console.error('Login failed:', error.message)
}
```

**Parameters:**
- `username` (string): Username or email address
- `password` (string): User's password

**Returns:**
- Promise resolving to login response data

**What it does:**
- Validates input parameters
- Sends login request to `/api/auth/login`
- Stores JWT token in sessionStorage
- Sets user data in reactive state
- Logs security events

##### `logout()`
Logs out the user and clears all authentication data.

```javascript
await logout()
```

**What it does:**
- Calls `/api/auth/logout` endpoint
- Clears sessionStorage
- Resets all reactive state
- Redirects to login page
- Logs security events

##### `refreshToken()`
Refreshes the access token using the refresh token cookie.

```javascript
try {
  const newToken = await refreshToken()
  console.log('Token refreshed successfully')
} catch (error) {
  console.error('Token refresh failed:', error.message)
  // User will be redirected to login
}
```

**Returns:**
- Promise resolving to new access token

**What it does:**
- Checks for refresh token cookie
- Sends request to `/api/auth/refresh`
- Updates access token in sessionStorage
- Updates user data if provided
- Handles refresh failures gracefully

##### `fetchUserProfile()`
Fetches the current user's profile data.

```javascript
try {
  const userData = await fetchUserProfile()
  console.log('User profile:', userData)
} catch (error) {
  console.error('Failed to fetch profile:', error.message)
}
```

**Returns:**
- Promise resolving to user profile data

**What it does:**
- Sends GET request to `/api/auth/profile`
- Updates user reactive state
- Handles authentication errors

##### `updateProfile(profileData)`
Updates the user's profile information.

```javascript
try {
  const updatedUser = await updateProfile({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com'
  })
  console.log('Profile updated:', updatedUser)
} catch (error) {
  console.error('Profile update failed:', error.message)
}
```

**Parameters:**
- `profileData` (object): Profile fields to update

**Returns:**
- Promise resolving to updated user data

##### `changePassword(currentPassword, newPassword)`
Changes the user's password.

```javascript
try {
  await changePassword('oldPassword123', 'newPassword456')
  console.log('Password changed successfully')
} catch (error) {
  console.error('Password change failed:', error.message)
}
```

**Parameters:**
- `currentPassword` (string): Current password
- `newPassword` (string): New password

### Configuration

The composable uses environment variables for configuration:

```env
# Token storage configuration
VITE_TOKEN_STORAGE_KEY=accessToken
VITE_REFRESH_TOKEN_COOKIE_NAME=refresh_token
VITE_CSRF_TOKEN_COOKIE_NAME=csrf-token

# API configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Feature flags
VITE_ENABLE_DEBUG=true
VITE_SECURITY_ENDPOINT=https://security.yourdomain.com/events
```

### Usage Examples

#### Basic Setup in main.js

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth.js'

const app = createApp(App)

// Initialize authentication
const { initAuth } = useAuth()
initAuth()

app.use(router).mount('#app')
```

#### Using in Components

```vue
<script setup>
import { useAuth } from '@/composables/useAuth.js'

const { 
  user, 
  isAuthenticated, 
  isLoading, 
  login, 
  logout 
} = useAuth()

async function handleLogin() {
  try {
    await login(username.value, password.value)
    // Redirect handled automatically
  } catch (error) {
    // Handle error
  }
}
</script>

<template>
  <div v-if="isAuthenticated">
    <h1>Welcome, {{ user.firstName }}!</h1>
    <button @click="logout">Sign Out</button>
  </div>
  <div v-else>
    <button @click="handleLogin" :disabled="isLoading">
      {{ isLoading ? 'Signing In...' : 'Sign In' }}
    </button>
  </div>
</template>
```

#### Role-Based Access Control

```vue
<script setup>
import { useAuth } from '@/composables/useAuth.js'

const { hasRole, isSuperAdmin } = useAuth()
</script>

<template>
  <div>
    <div v-if="hasRole('ADMINISTRATOR')">
      <h2>Admin Panel</h2>
      <!-- Admin content -->
    </div>
    
    <div v-if="isSuperAdmin">
      <h2>Super Admin Tools</h2>
      <!-- Super admin content -->
    </div>
  </div>
</template>
```

### Error Handling

The composable provides comprehensive error handling:

```javascript
const { error, login } = useAuth()

// Watch for errors
watch(error, (newError) => {
  if (newError) {
    // Display error to user
    console.error('Auth error:', newError)
  }
})

// Handle specific errors
try {
  await login(username, password)
} catch (error) {
  if (error.message.includes('Invalid credentials')) {
    // Handle invalid credentials
  } else if (error.message.includes('Account locked')) {
    // Handle account lockout
  } else {
    // Handle other errors
  }
}
```

### Security Considerations

#### Token Storage
- **Access tokens** are stored in sessionStorage (cleared on tab close)
- **Refresh tokens** are stored in HttpOnly cookies (secure, not accessible to JavaScript)
- **CSRF tokens** are managed automatically by the API service

#### Security Events
All authentication events are logged for security monitoring:

```javascript
// Events logged automatically:
// - login_success / login_failed
// - logout_success
// - token_refresh_success / token_refresh_failed
// - profile_updated / profile_update_failed
// - password_changed / password_change_failed
// - auth_cleared / auth_init_error
```

#### Best Practices
1. **Always use HTTPS** in production
2. **Validate tokens server-side** for every request
3. **Implement rate limiting** on authentication endpoints
4. **Monitor security events** for suspicious activity
5. **Use strong passwords** and consider 2FA
6. **Regularly rotate secrets** and tokens

### Troubleshooting

#### Common Issues

**1. "No refresh token available" error**
- Cause: Refresh token cookie expired or not set
- Solution: User needs to log in again

**2. Token refresh fails repeatedly**
- Cause: Server-side session expired or invalid
- Solution: Clear auth state and redirect to login

**3. User state not persisting across page refreshes**
- Cause: `initAuth()` not called on app startup
- Solution: Ensure `initAuth()` is called in main.js

**4. CSRF token errors**
- Cause: CSRF token missing or expired
- Solution: Handled automatically by the composable

#### Debug Mode

Enable debug logging to troubleshoot issues:

```env
VITE_ENABLE_DEBUG=true
```

This will log detailed information about:
- Authentication state changes
- Token operations
- API requests and responses
- Security events

### Integration with Vue Router

The composable works seamlessly with Vue Router for protected routes:

```javascript
// router/index.js
import { useAuth } from '@/composables/useAuth.js'

router.beforeEach((to, from, next) => {
  const { isAuthenticated } = useAuth()
  
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/login')
  } else {
    next()
  }
})
```

## Login.vue Component

### Purpose

The `Login.vue` component provides a secure, accessible, and user-friendly login interface that follows the Alberta.ca design system guidelines.

### Key Features

#### 🎨 **Alberta.ca Design System**
- Complete implementation of Alberta.ca design tokens
- Consistent typography, colors, and spacing
- Responsive design for all device sizes
- Accessibility-first approach

#### 🔐 **Security Features**
- Input validation and sanitization
- Password visibility toggle
- CSRF protection integration
- Security notices and warnings

#### ♿ **Accessibility Features**
- WCAG 2.1 AA compliant
- Screen reader support
- Keyboard navigation
- Focus management
- Skip links for navigation

#### 📱 **Responsive Design**
- Mobile-first approach
- Touch-friendly interface
- Adaptive layouts
- Print-friendly styles

### Component Structure

```vue
<template>
  <!-- Skip link for accessibility -->
  <a href="#main-content" class="goa-skip-link">Skip to main content</a>
  
  <!-- Header with branding -->
  <header class="login-header">
    <!-- App title and subtitle -->
  </header>

  <!-- Main login form -->
  <main id="main-content" class="login-main">
    <div class="goa-card login-card">
      <!-- Error/success alerts -->
      <!-- Login form with validation -->
      <!-- Additional links -->
    </div>
    
    <!-- Security notice -->
    <div class="security-notice">
      <!-- Government security warning -->
    </div>
  </main>

  <!-- Footer with links -->
  <footer class="login-footer">
    <!-- Copyright and legal links -->
  </footer>
</template>
```

### Form Validation

The component includes comprehensive client-side validation:

#### Username/Email Validation
- Required field validation
- Minimum length requirements
- Real-time validation feedback
- Accessibility-compliant error messages

#### Password Validation
- Required field validation
- Minimum length requirements
- Password visibility toggle
- Secure input handling

#### Form State Management
```javascript
const form = reactive({
  username: '',
  password: '',
  rememberMe: false
})

const validationErrors = reactive({
  username: '',
  password: ''
})

const isFormValid = computed(() => {
  return form.username.trim() && 
         form.password && 
         !validationErrors.username && 
         !validationErrors.password
})
```

### User Experience Features

#### Loading States
- Visual loading indicators
- Disabled form during submission
- Screen reader announcements
- Progress feedback

#### Error Handling
- Clear error messages
- Contextual help text
- Recovery suggestions
- Focus management after errors

#### Success States
- Success message display
- Automatic redirection
- Progress indication
- Smooth transitions

### Accessibility Features

#### Screen Reader Support
```html
<!-- Proper labeling -->
<label class="goa-label goa-label--required" for="username">
  Username or Email
</label>

<!-- Error announcements -->
<div v-if="validationErrors.username" class="goa-error-text">
  {{ validationErrors.username }}
</div>

<!-- Loading status -->
<div v-if="isLoading" id="loading-status" class="goa-visually-hidden" aria-live="polite">
  Signing in, please wait...
</div>
```

#### Keyboard Navigation
- Logical tab order
- Focus indicators
- Skip links
- Keyboard shortcuts

#### ARIA Attributes
- Role definitions
- State announcements
- Relationship indicators
- Live regions for dynamic content

### Security Implementation

#### Input Sanitization
```javascript
// Trim whitespace and validate input
const cleanUsername = form.username.trim()

// Prevent common injection attacks
if (cleanUsername.includes('<script>')) {
  // Handle malicious input
}
```

#### CSRF Protection
- Automatic CSRF token handling
- Integration with api.js service
- Token refresh on expiration

#### Security Notices
```html
<div class="goa-alert goa-alert--info">
  <h4 class="goa-alert__title">Security Notice</h4>
  <p class="goa-alert__content">
    This is a secure government system. Unauthorized access is prohibited 
    and may be subject to criminal prosecution. All activities are logged 
    and monitored.
  </p>
</div>
```

### Responsive Design

#### Breakpoints
- **Desktop**: Full layout with sidebar navigation
- **Tablet** (≤1231px): Adjusted spacing and layout
- **Mobile** (≤896px): Stacked layout, full-width forms
- **Small Mobile** (≤623px): Compact design, minimal spacing

#### Touch Optimization
- Minimum 44px touch targets
- Appropriate spacing for touch interaction
- Swipe-friendly interfaces
- Touch-specific hover states

### Integration Examples

#### Basic Router Setup
```javascript
// router/index.js
{
  path: '/login',
  name: 'Login',
  component: () => import('@/views/Login.vue'),
  meta: {
    title: 'Login',
    requiresAuth: false
  }
}
```

#### Redirect Handling
```javascript
// Login.vue
async function handleLogin() {
  try {
    await login(form.username, form.password)
    
    // Redirect to intended page or dashboard
    const redirectTo = route.query.redirect || '/dashboard'
    router.push(redirectTo)
  } catch (error) {
    // Handle login error
  }
}
```

#### Query Parameter Messages
```javascript
// Display messages from query parameters
if (route.query.message) {
  successMessage.value = route.query.message
}

// Example usage:
// /login?message=Session expired, please sign in again
```

## Dashboard.vue Component

### Purpose

The `Dashboard.vue` component serves as a protected landing page that demonstrates the authentication system's integration with a typical application interface.

### Key Features

#### 🏠 **Dashboard Overview**
- User information display
- Quick statistics
- Recent activity feed
- Navigation structure

#### 🔐 **Authentication Integration**
- User profile display
- Role-based content
- Logout functionality
- Session information

#### 📊 **Placeholder Content**
- Mock statistics and data
- Sample navigation structure
- Coming soon sections
- Admin tools preview

### Component Structure

```vue
<template>
  <!-- Header with user navigation -->
  <header class="dashboard-header">
    <div class="logo-section">
      <!-- App branding -->
    </div>
    <nav class="user-nav">
      <!-- User info and actions -->
    </nav>
  </header>

  <!-- Main dashboard content -->
  <main class="dashboard-main">
    <div class="goa-content">
      <!-- Sidebar navigation -->
      <aside class="goa-sidebar">
        <!-- Navigation menu -->
      </aside>
      
      <!-- Main content area -->
      <div class="goa-main">
        <!-- Dynamic sections based on navigation -->
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="dashboard-footer">
    <!-- App info and links -->
  </footer>
</template>
```

### User Information Display

#### Profile Information
```javascript
// Display user data from authentication
const { user, userRoles, isSuperAdmin } = useAuth()

// Format user information
const primaryRole = computed(() => {
  // Determine primary role for display
  const rolePriority = ['SUPER_ADMIN', 'ADMINISTRATOR', 'ADVANCED', 'INTERNAL', 'APPLICANT']
  
  for (const role of rolePriority) {
    if (userRoles.value.includes(role)) {
      return formatRole(role)
    }
  }
  
  return 'User'
})
```

#### Role-Based Content
```vue
<template>
  <!-- Admin-only sections -->
  <section v-if="isSuperAdmin" class="admin-section">
    <h2>System Administration</h2>
    <!-- Admin tools and settings -->
  </section>
  
  <!-- Role-specific navigation -->
  <li v-if="hasRole('ADMINISTRATOR')">
    <a href="#admin" class="sidebar-link">Administration</a>
  </li>
</template>
```

### Navigation Structure

#### Sidebar Navigation
- Overview (default)
- Programs
- Applications
- Reports
- Administration (admin only)

#### Dynamic Content Sections
```javascript
const activeSection = ref('overview')

function setActiveSection(section) {
  activeSection.value = section
  
  // Update active state in navigation
  updateNavigationState(section)
}
```

### Mock Data and Statistics

#### Sample Statistics
```javascript
const stats = ref({
  totalGrants: 24,
  activeApplications: 156,
  totalFunding: '2.4M',
  pendingReviews: 12
})
```

#### Recent Activity Feed
```javascript
const recentActivities = ref([
  {
    id: 1,
    title: 'New  Application Submitted',
    description: 'Community Development Application #2024-001',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
  }
  // ... more activities
])
```

### Logout Integration

#### Secure Logout Process
```javascript
async function handleLogout() {
  try {
    await logout()
    // Logout function handles redirect automatically
  } catch (error) {
    console.error('Logout error:', error)
    // Force redirect even if logout request fails
    router.push('/login')
  }
}
```

#### User Confirmation
- Loading states during logout
- Error handling for failed requests
- Automatic redirect to login page
- Session cleanup

## Backend Integration

### Required API Endpoints

The authentication system expects the following backend endpoints:

#### POST `/api/auth/login`
**Purpose**: Authenticate user with credentials

**Request Body**:
```json
{
  "username": "user@example.com",
  "password": "userPassword123"
}
```

**Success Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user123",
    "username": "user@example.com",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["APPLICANT"],
    "organizationId": "org123",
    "ministryId": "ministry123"
  },
  "expiresIn": 900
}
```

**Error Response** (401):
```json
{
  "message": "Invalid credentials",
  "error": "INVALID_CREDENTIALS"
}
```

**Implementation Notes**:
- Set HttpOnly refresh token cookie
- Set CSRF token cookie
- Log security events
- Implement rate limiting

#### POST `/api/auth/logout`
**Purpose**: Logout user and clear server-side session

**Headers**:
```
Authorization: Bearer <accessToken>
X-CSRF-Token: <csrfToken>
```

**Success Response** (200):
```json
{
  "message": "Logout successful"
}
```

**Implementation Notes**:
- Clear refresh token cookie
- Clear CSRF token cookie
- Invalidate server-side session
- Log security events

#### POST `/api/auth/refresh`
**Purpose**: Refresh access token using refresh token cookie

**Cookies**:
- `refresh_token`: HttpOnly refresh token

**Success Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    // Updated user data
  },
  "expiresIn": 900
}
```

**Error Response** (401):
```json
{
  "message": "Invalid refresh token",
  "error": "INVALID_REFRESH_TOKEN"
}
```

**Implementation Notes**:
- Validate refresh token cookie
- Generate new access token
- Optionally rotate refresh token
- Update CSRF token

#### GET `/api/auth/profile`
**Purpose**: Get current user profile

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Success Response** (200):
```json
{
  "_id": "user123",
  "username": "user@example.com",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["APPLICANT"],
  "organizationId": "org123",
  "ministryId": "ministry123",
  "lastLogin": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### PUT `/api/auth/profile`
**Purpose**: Update user profile

**Headers**:
```
Authorization: Bearer <accessToken>
X-CSRF-Token: <csrfToken>
```

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com"
}
```

**Success Response** (200):
```json
{
  // Updated user object
}
```

#### PUT `/api/auth/change-password`
**Purpose**: Change user password

**Headers**:
```
Authorization: Bearer <accessToken>
X-CSRF-Token: <csrfToken>
```

**Request Body**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Success Response** (200):
```json
{
  "message": "Password changed successfully"
}
```

### Security Requirements

#### JWT Token Configuration
```javascript
// Example JWT payload
{
  "sub": "user123",           // User ID
  "username": "user@example.com",
  "roles": ["APPLICANT"],
  "iat": 1642234567,          // Issued at
  "exp": 1642235467,          // Expires at (15 minutes)
  "jti": "token123"           // JWT ID for revocation
}
```

#### Cookie Configuration
```javascript
// Refresh token cookie
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth'
})

// CSRF token cookie
res.cookie('csrf-token', csrfToken, {
  httpOnly: false,  // Accessible to JavaScript
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
})
```

#### CORS Configuration
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,  // Essential for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
}))
```

## Environment Configuration

### Frontend Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000

# App Configuration
VITE_APP_NAME=RED Template Application
VITE_APP_VERSION=1.0.0

# Security Configuration
VITE_ENABLE_DEBUG=true
VITE_ENABLE_SECURITY_LOGGING=true
VITE_REQUEST_FINGERPRINTING=true

# Token Configuration
VITE_TOKEN_STORAGE_KEY=accessToken
VITE_REFRESH_TOKEN_COOKIE_NAME=refresh_token
VITE_CSRF_TOKEN_COOKIE_NAME=csrf-token
VITE_TOKEN_REFRESH_THRESHOLD=300000

# Feature Flags
VITE_ENABLE_REGISTRATION=true
VITE_ENABLE_SSO=false

# Cookie Configuration
VITE_COOKIE_DOMAIN=localhost
VITE_COOKIE_SECURE=false
VITE_COOKIE_SAME_SITE=lax

# Security Monitoring
VITE_SECURITY_ENDPOINT=https://security.yourdomain.com/events
```

### Backend Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=your-session-secret
SESSION_NAME=app_session
SESSION_MAX_AGE=3600000

# Security Configuration
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=900000
PASSWORD_RESET_EXPIRES=3600000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_CREDENTIALS=true
```

## Installation and Setup

### Prerequisites

- Node.js 16+ and npm/yarn
- Vue 3.3+
- Vue Router 4+
- Backend API with authentication endpoints

### Installation Steps

#### 1. Install Dependencies

```bash
# Install Vue Router if not already installed
npm install vue-router@4

# Install any additional dependencies for your backend integration
npm install axios  # If not using the provided api.js
```

#### 2. File Structure Setup

```
src/
├── composables/
│   └── useAuth.js          # Authentication composable
├── views/
│   ├── Login.vue           # Login component
│   └── Dashboard.vue       # Dashboard component
├── router/
│   └── index.js           # Router configuration
├── api.js                 # API service (your existing file)
└── main.css              # Alberta.ca design system styles
```

#### 3. Environment Configuration

Create or update your `.env` file with the required variables:

```env
# Copy the frontend environment variables from the configuration section
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Your App Name
# ... other variables
```

#### 4. Router Configuration

Update your router to include authentication routes:

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: 'Login - Your App',
      requiresAuth: false
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: 'Dashboard - Your App',
      requiresAuth: true
    }
  },
  {
    path: '/',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Authentication guard
router.beforeEach((to, from, next) => {
  const { isAuthenticated } = useAuth()
  
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/login')
  } else {
    next()
  }
})

export default router
```

#### 5. Main Application Setup

Initialize authentication in your main.js:

```javascript
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth.js'

// Import Alberta.ca design system styles
import './main.css'

const app = createApp(App)

// Initialize authentication
const { initAuth } = useAuth()
initAuth()

app.use(router).mount('#app')
```

#### 6. App.vue Configuration

Update your App.vue to use router-view:

```vue
<!-- App.vue -->
<script setup>
// App.vue serves as the root container
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
@import './main.css';

#app {
  min-height: 100vh;
  background-color: var(--goa-color-greyscale-white);
  color: var(--goa-color-text-default);
}
</style>
```

### Testing the Setup

#### 1. Start Development Server

```bash
npm run dev
```

#### 2. Test Authentication Flow

1. Navigate to `/dashboard` - should redirect to `/login`
2. Try logging in with test credentials
3. Verify redirect to dashboard after successful login
4. Test logout functionality
5. Verify session persistence across page refreshes

#### 3. Debug Common Issues

**Issue**: "Failed to resolve component: router-view"
**Solution**: Ensure Vue Router is installed and properly configured in main.js

**Issue**: Authentication state not persisting
**Solution**: Verify `initAuth()` is called in main.js

**Issue**: CORS errors
**Solution**: Check backend CORS configuration and allowed origins

**Issue**: Token refresh failures
**Solution**: Verify refresh token cookie configuration and backend endpoint

## Best Practices

### Security Best Practices

#### 1. Token Management
- **Never store sensitive tokens in localStorage** - use sessionStorage for access tokens
- **Use HttpOnly cookies for refresh tokens** - prevents XSS attacks
- **Implement token rotation** - refresh tokens should be rotated on use
- **Set appropriate expiration times** - short-lived access tokens (15 minutes), longer refresh tokens (7 days)

#### 2. Input Validation
```javascript
// Always validate and sanitize user input
function validateUsername(username) {
  const trimmed = username.trim()
  
  // Check for minimum length
  if (trimmed.length < 2) {
    return 'Username must be at least 2 characters'
  }
  
  // Check for malicious content
  if (/<script|javascript:|data:/i.test(trimmed)) {
    return 'Invalid characters in username'
  }
  
  return null
}
```

#### 3. Error Handling
```javascript
// Don't expose sensitive information in error messages
try {
  await login(username, password)
} catch (error) {
  // Log detailed error server-side
  console.error('Login error:', error)
  
  // Show generic message to user
  const userMessage = error.response?.status === 401 
    ? 'Invalid username or password'
    : 'Login failed. Please try again.'
    
  setError(userMessage)
}
```

#### 4. Rate Limiting
- Implement client-side rate limiting for login attempts
- Use exponential backoff for failed requests
- Display appropriate messages for rate-limited users

### Performance Best Practices

#### 1. Lazy Loading
```javascript
// Lazy load authentication-related components
const Login = () => import('@/views/Login.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
```

#### 2. Token Refresh Optimization
```javascript
// Implement token refresh queue to prevent multiple simultaneous requests
let refreshPromise = null

async function refreshToken() {
  if (refreshPromise) {
    return refreshPromise
  }
  
  refreshPromise = performTokenRefresh()
  
  try {
    const result = await refreshPromise
    return result
  } finally {
    refreshPromise = null
  }
}
```

#### 3. State Management
```javascript
// Use singleton pattern for authentication state
let globalAuthInstance = null

export function useAuth() {
  if (globalAuthInstance) {
    return globalAuthInstance
  }
  
  // Create new instance only if none exists
  globalAuthInstance = createAuthInstance()
  return globalAuthInstance
}
```

### Accessibility Best Practices

#### 1. Form Accessibility
```vue
<template>
  <!-- Proper labeling -->
  <label class="goa-label goa-label--required" for="username">
    Username or Email
  </label>
  <input
    id="username"
    v-model="form.username"
    type="text"
    class="goa-input"
    :class="{ 'goa-input--error': validationErrors.username }"
    :aria-describedby="validationErrors.username ? 'username-error' : 'username-help'"
    autocomplete="username"
    required
  >
  
  <!-- Help text -->
  <div id="username-help" class="goa-help-text">
    Enter your username or email address
  </div>
  
  <!-- Error message -->
  <div v-if="validationErrors.username" id="username-error" class="goa-error-text">
    {{ validationErrors.username }}
  </div>
</template>
```

#### 2. Loading States
```vue
<template>
  <!-- Loading announcement for screen readers -->
  <div v-if="isLoading" class="goa-visually-hidden" aria-live="polite">
    Signing in, please wait...
  </div>
  
  <!-- Visual loading indicator -->
  <button 
    type="submit" 
    class="goa-button goa-button--primary"
    :disabled="isLoading"
    :aria-describedby="isLoading ? 'loading-status' : null"
  >
    <span v-if="isLoading" class="loading-spinner" aria-hidden="true"></span>
    {{ isLoading ? 'Signing In...' : 'Sign In' }}
  </button>
</template>
```

#### 3. Focus Management
```javascript
// Manage focus after authentication state changes
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    // Focus main content after successful login
    nextTick(() => {
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        mainContent.focus()
      }
    })
  }
})
```

### Code Organization Best Practices

#### 1. Composable Structure
```javascript
// Keep composables focused and single-purpose
export function useAuth() {
  // State management only
}

export function useAuthValidation() {
  // Validation logic only
}

export function useAuthSecurity() {
  // Security utilities only
}
```

#### 2. Component Composition
```vue
<!-- Break down large components into smaller, focused components -->
<template>
  <div class="login-page">
    <LoginHeader />
    <LoginForm @submit="handleLogin" />
    <LoginFooter />
  </div>
</template>
```

#### 3. Error Boundaries
```javascript
// Implement error boundaries for authentication failures
app.config.errorHandler = (err, vm, info) => {
  if (err.message.includes('authentication')) {
    // Handle auth errors specifically
    const { clearAuth } = useAuth()
    clearAuth()
    router.push('/login')
  }
  
  console.error('Global error:', err, info)
}
```

## Troubleshooting Guide

### Common Issues and Solutions

#### Authentication Issues

**Issue**: User gets logged out immediately after login
**Symptoms**: 
- Login appears successful but user is redirected back to login
- Token exists in sessionStorage but user state is null

**Solutions**:
1. Check if `fetchUserProfile()` is failing after login
2. Verify backend `/api/auth/profile` endpoint is working
3. Ensure token is being set correctly in API service
4. Check for CORS issues preventing profile fetch

**Debug Steps**:
```javascript
// Enable debug logging
localStorage.setItem('debug', 'true')

// Check token validity
const { isTokenExpired } = useAuth()
console.log('Token expired:', isTokenExpired())

// Manually test profile fetch
const { fetchUserProfile } = useAuth()
fetchUserProfile().catch(console.error)
```

**Issue**: Token refresh fails repeatedly
**Symptoms**:
- User gets logged out after 15 minutes
- "No refresh token available" errors
- Infinite redirect loops

**Solutions**:
1. Verify refresh token cookie is being set by backend
2. Check cookie domain and path configuration
3. Ensure CORS credentials are enabled
4. Verify backend refresh endpoint implementation

**Debug Steps**:
```javascript
// Check for refresh token cookie
document.cookie.split(';').forEach(cookie => {
  if (cookie.includes('refresh_token')) {
    console.log('Refresh token found:', cookie)
  }
})

// Test refresh endpoint manually
fetch('/api/auth/refresh', {
  method: 'POST',
  credentials: 'include'
}).then(response => {
  console.log('Refresh response:', response.status)
})
```

#### CSRF Token Issues

**Issue**: CSRF token validation failures
**Symptoms**:
- 403 Forbidden errors on POST/PUT/DELETE requests
- "CSRF token mismatch" error messages

**Solutions**:
1. Verify CSRF token cookie is being set
2. Check if token is being sent in request headers
3. Ensure backend CSRF validation is configured correctly
4. Verify cookie accessibility (not HttpOnly for CSRF tokens)

**Debug Steps**:
```javascript
// Check CSRF token cookie
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf-token='))
  ?.split('=')[1]

console.log('CSRF token:', csrfToken)

// Check if token is being sent in requests
// (This should be handled automatically by api.js)
```

#### Router and Navigation Issues

**Issue**: Protected routes not working
**Symptoms**:
- Users can access protected pages without authentication
- Authentication guard not triggering

**Solutions**:
1. Verify router guard is properly configured
2. Check if `useAuth()` is being called correctly in guard
3. Ensure authentication state is initialized before routing

**Debug Steps**:
```javascript
// Test authentication guard
router.beforeEach((to, from, next) => {
  const { isAuthenticated } = useAuth()
  console.log('Route guard:', {
    to: to.path,
    requiresAuth: to.meta.requiresAuth,
    isAuthenticated: isAuthenticated.value
  })
  
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/login')
  } else {
    next()
  }
})
```

#### Component Issues

**Issue**: Login form validation not working
**Symptoms**:
- Form submits with empty fields
- Validation errors not displaying
- Form state not updating

**Solutions**:
1. Check reactive form state setup
2. Verify validation functions are being called
3. Ensure error state is properly bound to form fields

**Debug Steps**:
```javascript
// Check form state
watch(form, (newForm) => {
  console.log('Form state:', newForm)
}, { deep: true })

// Check validation state
watch(validationErrors, (newErrors) => {
  console.log('Validation errors:', newErrors)
}, { deep: true })
```

### Performance Issues

**Issue**: Slow authentication initialization
**Symptoms**:
- Long delay before authentication state is determined
- Multiple unnecessary API calls

**Solutions**:
1. Optimize token validation logic
2. Implement proper caching for user profile
3. Reduce unnecessary re-renders

**Debug Steps**:
```javascript
// Monitor authentication initialization
console.time('auth-init')
initAuth().finally(() => {
  console.timeEnd('auth-init')
})

// Monitor API calls
const originalFetch = window.fetch
window.fetch = function(...args) {
  console.log('API call:', args[0])
  return originalFetch.apply(this, args)
}
```

### Browser Compatibility Issues

**Issue**: Authentication not working in specific browsers
**Symptoms**:
- Works in Chrome but not Safari/Firefox
- Cookie-related issues in certain browsers

**Solutions**:
1. Check SameSite cookie compatibility
2. Verify localStorage/sessionStorage support
3. Test CORS configuration across browsers

**Debug Steps**:
```javascript
// Check browser capabilities
console.log('Browser support:', {
  localStorage: typeof Storage !== 'undefined',
  sessionStorage: typeof sessionStorage !== 'undefined',
  cookies: navigator.cookieEnabled,
  fetch: typeof fetch !== 'undefined'
})
```

### Development vs Production Issues

**Issue**: Authentication works in development but not production
**Symptoms**:
- CORS errors in production
- Cookie issues with HTTPS
- Environment variable problems

**Solutions**:
1. Update CORS configuration for production domain
2. Ensure cookies are configured for HTTPS
3. Verify environment variables are set correctly
4. Check API base URL configuration

**Production Checklist**:
```env
# Production environment variables
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_COOKIE_SECURE=true
VITE_COOKIE_SAME_SITE=strict
VITE_ENABLE_DEBUG=false
```

### Getting Help

#### Debug Information to Collect

When reporting issues, include:

1. **Browser and version**
2. **Environment** (development/production)
3. **Console errors** (with full stack traces)
4. **Network tab** (failed requests)
5. **Authentication state** (from Vue DevTools)
6. **Environment variables** (sanitized)

#### Useful Debug Commands

```javascript
// Get current authentication state
const auth = useAuth()
console.log('Auth state:', {
  isAuthenticated: auth.isAuthenticated.value,
  user: auth.user.value,
  hasToken: !!auth.accessToken.value,
  isLoading: auth.isLoading.value,
  error: auth.error.value
})

// Test API connectivity
fetch(import.meta.env.VITE_API_BASE_URL + '/health')
  .then(response => console.log('API health:', response.status))
  .catch(error => console.error('API error:', error))

// Check cookies
console.log('All cookies:', document.cookie)

// Check sessionStorage
console.log('Session storage:', {
  accessToken: !!sessionStorage.getItem('accessToken'),
  keys: Object.keys(sessionStorage)
})
```

This comprehensive documentation should provide everything needed to understand, implement, and troubleshoot the authentication system. The system is designed to be secure, accessible, and maintainable while following Vue.js and Alberta.ca design system best practices.

