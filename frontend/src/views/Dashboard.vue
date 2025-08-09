<template>
  <div class="dashboard-page">
    <!-- Skip link for accessibility -->
    <a href="#main-content" class="goa-skip-link">Skip to main content</a>
    
    <!-- Header -->
    <header class="dashboard-header">
      <div class="goa-container">
        <div class="header-content">
          <div class="logo-section">
            <h1 class="app-title">{{ appName }}</h1>
            <p class="app-subtitle">Dashboard</p>
          </div>
          
          <nav class="user-nav" aria-label="User navigation">
            <div class="user-info">
              <span class="user-greeting">Welcome, {{ user?.firstName || user?.username || 'User' }}</span>
              <div class="user-details">
                <span class="user-role">{{ primaryRole }}</span>
              </div>
            </div>
            
            <div class="nav-actions">
              <button
                class="goa-button goa-button--tertiary"
                @click="handleProfile"
                :disabled="isLoading"
              >
                Profile
              </button>
              <button
                class="goa-button goa-button--secondary"
                @click="handleLogout"
                :disabled="isLoading"
              >
                {{ isLoading ? 'Signing Out...' : 'Sign Out' }}
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main id="main-content" class="dashboard-main">
      <div class="goa-container">
        <div class="goa-content">
          <!-- Sidebar Navigation -->
          <aside class="goa-sidebar">
            <nav aria-label="Main navigation">
              <h2 class="sidebar-title">Navigation</h2>
              <ul class="sidebar-nav">
                <li>
                  <a href="#overview" class="sidebar-link active" @click.prevent="setActiveSection('overview')">
                    Overview
                  </a>
                </li>
                <li>
                  <a href="#grants" class="sidebar-link" @click.prevent="setActiveSection('programs')">
                     Programs
                  </a>
                </li>
                <li>
                  <a href="#applications" class="sidebar-link" @click.prevent="setActiveSection('applications')">
                    Applications
                  </a>
                </li>
                <li>
                  <a href="#reports" class="sidebar-link" @click.prevent="setActiveSection('reports')">
                    Reports
                  </a>
                </li>
                <li v-if="isSuperAdmin">
                  <a href="#admin" class="sidebar-link" @click.prevent="setActiveSection('admin')">
                    Administration
                  </a>
                </li>
              </ul>
            </nav>
          </aside>

          <!-- Main Content Area -->
          <div class="goa-main">
            <!-- Welcome Section -->
            <section v-if="activeSection === 'overview'" class="content-section">
              <h2>Dashboard Overview</h2>
              <p class="section-description">
                Welcome to the Template Dashboard. This is your central hub for managing application data, 
                users, and administrative tasks.
              </p>

              <!-- User Information Card -->
              <div class="goa-card user-info-card">
                <div class="goa-card-header">
                  <h3 class="goa-card-title">Your Account Information</h3>
                </div>
                <div class="goa-card-content">
                  <div class="info-grid">
                    <div class="info-item">
                      <label class="info-label">Username:</label>
                      <span class="info-value">{{ user?.username || 'Not available' }}</span>
                    </div>
                    <div class="info-item">
                      <label class="info-label">Email:</label>
                      <span class="info-value">{{ user?.email || 'Not available' }}</span>
                    </div>
                    <div class="info-item">
                      <label class="info-label">Full Name:</label>
                      <span class="info-value">
                        {{ user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Not available' }}
                      </span>
                    </div>
                    <div class="info-item">
                      <label class="info-label">Roles:</label>
                      <span class="info-value">
                        <span v-for="role in userRoles" :key="role" class="role-badge">
                          {{ formatRole(role) }}
                        </span>
                      </span>
                    </div>
                    <div v-if="user?.organizationId" class="info-item">
                      <label class="info-label">Organization:</label>
                      <span class="info-value">{{ user.organizationId }}</span>
                    </div>
                    <div v-if="user?.ministryId" class="info-item">
                      <label class="info-label">Ministry:</label>
                      <span class="info-value">{{ user.ministryId }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Stats -->
              <div class="stats-section">
                <h3>Quick Statistics</h3>
                <div class="stats-grid">
                  <div class="goa-card stat-card">
                    <div class="goa-card-content">
                      <div class="stat-number">{{ stats.totalGrants }}</div>
                      <div class="stat-label"> Programs</div>
                    </div>
                  </div>
                  <div class="goa-card stat-card">
                    <div class="goa-card-content">
                      <div class="stat-number">{{ stats.activeApplications }}</div>
                      <div class="stat-label">Active Applications</div>
                    </div>
                  </div>
                  <div class="goa-card stat-card">
                    <div class="goa-card-content">
                      <div class="stat-number">${{ stats.totalFunding }}</div>
                      <div class="stat-label">Total Funding</div>
                    </div>
                  </div>
                  <div class="goa-card stat-card">
                    <div class="goa-card-content">
                      <div class="stat-number">{{ stats.pendingReviews }}</div>
                      <div class="stat-label">Pending Reviews</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recent Activity -->
              <div class="activity-section">
                <h3>Recent Activity</h3>
                <div class="goa-card">
                  <div class="goa-card-content">
                    <div class="activity-list">
                      <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
                        <div class="activity-icon">📋</div>
                        <div class="activity-content">
                          <div class="activity-title">{{ activity.title }}</div>
                          <div class="activity-description">{{ activity.description }}</div>
                          <div class="activity-time">{{ formatDate(activity.timestamp) }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Programs Section -->
            <section v-else-if="activeSection === 'programs'" class="content-section">
              <h2> Programs</h2>
              <p class="section-description">
                Manage and oversee  programs available in the system.
              </p>
              
              <div class="goa-alert goa-alert--info">
                <h4 class="goa-alert__title">Coming Soon</h4>
                <p class="goa-alert__content">
                  Program management features will be available in the next release.
                </p>
              </div>
            </section>

            <!-- Applications Section -->
            <section v-else-if="activeSection === 'applications'" class="content-section">
              <h2> Applications</h2>
              <p class="section-description">
                Review and manage  applications submitted to your programs.
              </p>
              
              <div class="goa-alert goa-alert--info">
                <h4 class="goa-alert__title">Coming Soon</h4>
                <p class="goa-alert__content">
                  Application management features will be available in the next release.
                </p>
              </div>
            </section>

            <!-- Reports Section -->
            <section v-else-if="activeSection === 'reports'" class="content-section">
              <h2>Reports & Analytics</h2>
              <p class="section-description">
                Generate reports and view analytics for programs and applications.
              </p>
              
              <div class="goa-alert goa-alert--info">
                <h4 class="goa-alert__title">Coming Soon</h4>
                <p class="goa-alert__content">
                  Reporting and analytics features will be available in the next release.
                </p>
              </div>
            </section>

            <!-- Administration Section -->
            <section v-else-if="activeSection === 'admin' && isSuperAdmin" class="content-section">
              <h2>System Administration</h2>
              <p class="section-description">
                Administrative tools and system management features.
              </p>
              
              <div class="goa-alert goa-alert--warning">
                <h4 class="goa-alert__title">Administrator Access</h4>
                <p class="goa-alert__content">
                  You have administrator privileges. Use these tools carefully as they affect the entire system.
                </p>
              </div>
              
              <div class="admin-tools">
                <div class="goa-card">
                  <div class="goa-card-header">
                    <h3 class="goa-card-title">User Management</h3>
                  </div>
                  <div class="goa-card-content">
                    <p>Manage user accounts, roles, and permissions.</p>
                    <button class="goa-button goa-button--secondary" disabled>
                      Manage Users (Coming Soon)
                    </button>
                  </div>
                </div>
                
                <div class="goa-card">
                  <div class="goa-card-header">
                    <h3 class="goa-card-title">System Settings</h3>
                  </div>
                  <div class="goa-card-content">
                    <p>Configure system-wide settings and preferences.</p>
                    <button class="goa-button goa-button--secondary" disabled>
                      System Settings (Coming Soon)
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="dashboard-footer">
      <div class="goa-container">
        <div class="footer-content">
          <p class="footer-text">
            © {{ currentYear }} Government of Alberta. All rights reserved.
          </p>
          <div class="footer-info">
            <span>Version {{ appVersion }}</span>
            <span class="footer-separator">|</span>
            <span>Last login: {{ formatDate(lastLoginTime) }}</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

// ==========================================
// Composables and Router
// ==========================================

const router = useRouter()
const { user, userRoles, isSuperAdmin, logout, isLoading } = useAuth()

// ==========================================
// Reactive Data
// ==========================================

const activeSection = ref('overview')

// Mock data for demonstration
const stats = ref({
  totalGrants: 24,
  activeApplications: 156,
  totalFunding: '2.4M',
  pendingReviews: 12
})

const recentActivities = ref([
  {
    id: 1,
    title: 'New  Application Submitted',
    description: 'Community Development Application #2024-001',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    id: 2,
    title: 'Program Updated',
    description: 'Environmental Sustainability Program - Funding increased',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
  },
  {
    id: 3,
    title: 'Application Review Completed',
    description: 'Youth Development Application approved',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
  }
])

// ==========================================
// Configuration
// ==========================================

const appName = import.meta.env.VITE_APP_NAME || 'Application Template'
const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'
const currentYear = new Date().getFullYear()
const lastLoginTime = ref(new Date())

// ==========================================
// Computed Properties
// ==========================================

/**
 * Get the primary role for display
 */
const primaryRole = computed(() => {
  if (!userRoles.value || userRoles.value.length === 0) {
    return 'User'
  }
  
  // Prioritize roles for display
  const rolePriority = ['SUPER_ADMIN', 'ADMINISTRATOR', 'ADVANCED', 'INTERNAL', 'APPLICANT']
  
  for (const role of rolePriority) {
    if (userRoles.value.includes(role)) {
      return formatRole(role)
    }
  }
  
  return formatRole(userRoles.value[0])
})

// ==========================================
// Methods
// ==========================================

/**
 * Format role name for display
 * @param {string} role - Role name
 * @returns {string} Formatted role name
 */
function formatRole(role) {
  const roleMap = {
    'SUPER_ADMIN': 'Super Administrator',
    'ADMINISTRATOR': 'Administrator',
    'ADVANCED': 'Advanced User',
    'INTERNAL': 'Internal User',
    'APPLICANT': 'Applicant'
  }
  
  return roleMap[role] || role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return 'Not available'
  
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffHours < 1) {
    return 'Just now'
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

/**
 * Set active navigation section
 * @param {string} section - Section name
 */
function setActiveSection(section) {
  activeSection.value = section
  
  // Update sidebar active state
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active')
  })
  
  const activeLink = document.querySelector(`[href="#${section}"]`)
  if (activeLink) {
    activeLink.classList.add('active')
  }
}

/**
 * Handle profile button click
 */
function handleProfile() {
  // In a real app, this would navigate to profile page
  alert('Profile management would be implemented here')
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    await logout()
    // Logout function handles redirect to login page
  } catch (error) {
    console.error('Logout error:', error)
    // Force redirect even if logout request fails
    router.push('/login')
  }
}

// ==========================================
// Lifecycle
// ==========================================

/**
 * Component mounted
 */
onMounted(() => {
  // Set last login time (in a real app, this would come from the server)
  lastLoginTime.value = new Date()
  
  console.log('Dashboard mounted for user:', user.value?.username)
})
</script>

<style scoped>
/* ==========================================
   Dashboard Page Styles - Alberta.ca Design System
   ========================================== */

.dashboard-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--goa-color-greyscale-white);
}

/* ==========================================
   Header Styles
   ========================================== */

.dashboard-header {
  background-color: var(--goa-color-brand-default);
  color: var(--goa-color-text-light);
  padding: var(--goa-space-l) 0;
  box-shadow: var(--goa-shadow-sm);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--goa-space-l);
}

.logo-section {
  flex-shrink: 0;
}

.app-title {
  font: var(--goa-typography-heading-m);
  color: var(--goa-color-text-light);
  margin: 0;
}

.app-subtitle {
  font: var(--goa-typography-body-s);
  color: var(--goa-color-brand-light);
  margin: var(--goa-space-3xs) 0 0 0;
}

.user-nav {
  display: flex;
  align-items: center;
  gap: var(--goa-space-l);
}

.user-info {
  text-align: right;
}

.user-greeting {
  font: var(--goa-typography-body-s);
  color: var(--goa-color-text-light);
  display: block;
}

.user-details {
  margin-top: var(--goa-space-3xs);
}

.user-role {
  font: var(--goa-typography-body-xs);
  color: var(--goa-color-brand-light);
}

.nav-actions {
  display: flex;
  gap: var(--goa-space-s);
}

/* ==========================================
   Main Content Styles
   ========================================== */

.dashboard-main {
  flex: 1;
  padding: var(--goa-space-2xl) 0;
}

.content-section {
  margin-bottom: var(--goa-space-2xl);
}

.section-description {
  font: var(--goa-typography-body-m);
  color: var(--goa-color-text-secondary);
  margin-bottom: var(--goa-space-xl);
  max-width: 72ch;
}

/* ==========================================
   Sidebar Styles
   ========================================== */

.sidebar-title {
  font: var(--goa-typography-heading-xs);
  color: var(--goa-color-text-default);
  margin: 0 0 var(--goa-space-m) 0;
  padding: 0 var(--goa-space-m);
}

.sidebar-nav {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-nav li {
  margin-bottom: var(--goa-space-xs);
}

.sidebar-link {
  display: block;
  padding: var(--goa-space-s) var(--goa-space-m);
  color: var(--goa-color-interactive-default);
  text-decoration: none;
  font: var(--goa-typography-body-s);
  border-radius: var(--goa-border-radius-s);
  transition: background-color var(--goa-transition-fast);
}

.sidebar-link:hover {
  background-color: var(--goa-color-greyscale-100);
  color: var(--goa-color-interactive-hover);
}

.sidebar-link.active {
  background-color: var(--goa-color-interactive-default);
  color: var(--goa-color-text-light);
}

.sidebar-link:focus {
  outline: 2px solid var(--goa-color-interactive-focus);
  outline-offset: 2px;
}

/* ==========================================
   User Info Card Styles
   ========================================== */

.user-info-card {
  margin-bottom: var(--goa-space-xl);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--goa-space-m);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-xs);
}

.info-label {
  font: var(--goa-typography-heading-xs);
  color: var(--goa-color-text-secondary);
}

.info-value {
  font: var(--goa-typography-body-s);
  color: var(--goa-color-text-default);
}

.role-badge {
  display: inline-block;
  background-color: var(--goa-color-status-info-background);
  color: var(--goa-color-status-info-dark);
  padding: var(--goa-space-3xs) var(--goa-space-xs);
  border-radius: var(--goa-border-radius-s);
  font: var(--goa-typography-body-xs);
  margin-right: var(--goa-space-xs);
  margin-bottom: var(--goa-space-xs);
}

/* ==========================================
   Stats Section Styles
   ========================================== */

.stats-section {
  margin-bottom: var(--goa-space-xl);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--goa-space-l);
  margin-top: var(--goa-space-l);
}

.stat-card {
  text-align: center;
  transition: transform var(--goa-transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-number {
  font: var(--goa-typography-heading-l);
  color: var(--goa-color-interactive-default);
  margin-bottom: var(--goa-space-xs);
}

.stat-label {
  font: var(--goa-typography-body-s);
  color: var(--goa-color-text-secondary);
}

/* ==========================================
   Activity Section Styles
   ========================================== */

.activity-section {
  margin-bottom: var(--goa-space-xl);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-m);
}

.activity-item {
  display: flex;
  gap: var(--goa-space-m);
  padding: var(--goa-space-m);
  border-radius: var(--goa-border-radius-s);
  transition: background-color var(--goa-transition-fast);
}

.activity-item:hover {
  background-color: var(--goa-color-greyscale-50);
}

.activity-icon {
  font-size: var(--goa-font-size-4);
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font: var(--goa-typography-heading-xs);
  color: var(--goa-color-text-default);
  margin-bottom: var(--goa-space-3xs);
}

.activity-description {
  font: var(--goa-typography-body-s);
  color: var(--goa-color-text-secondary);
  margin-bottom: var(--goa-space-xs);
}

.activity-time {
  font: var(--goa-typography-body-xs);
  color: var(--goa-color-text-secondary);
}

/* ==========================================
   Admin Tools Styles
   ========================================== */

.admin-tools {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--goa-space-l);
  margin-top: var(--goa-space-l);
}

/* ==========================================
   Footer Styles
   ========================================== */

.dashboard-footer {
  background-color: var(--goa-color-greyscale-100);
  border-top: var(--goa-border-width-s) solid var(--goa-color-greyscale-200);
  padding: var(--goa-space-l) 0;
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--goa-space-l);
}

.footer-text {
  font: var(--goa-typography-body-xs);
  color: var(--goa-color-text-secondary);
  margin: 0;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: var(--goa-space-s);
  font: var(--goa-typography-body-xs);
  color: var(--goa-color-text-secondary);
}

.footer-separator {
  color: var(--goa-color-greyscale-400);
}

/* ==========================================
   Responsive Design
   ========================================== */

@media screen and (max-width: 1231px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--goa-space-m);
  }
  
  .user-nav {
    width: 100%;
    justify-content: space-between;
  }
  
  .user-info {
    text-align: left;
  }
}

@media screen and (max-width: 896px) {
  .dashboard-main {
    padding: var(--goa-space-xl) 0;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: var(--goa-space-s);
  }
  
  .nav-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .admin-tools {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 623px) {
  .dashboard-header {
    padding: var(--goa-space-m) 0;
  }
  
  .app-title {
    font-size: var(--goa-font-size-3);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .activity-item {
    flex-direction: column;
    text-align: center;
  }
  
  .activity-icon {
    align-self: center;
  }
}

/* ==========================================
   Print Styles
   ========================================== */

@media print {
  .dashboard-header,
  .dashboard-footer,
  .goa-sidebar,
  .nav-actions {
    display: none;
  }
  
  .dashboard-main {
    padding: 0;
  }
  
  .goa-content {
    flex-direction: column;
  }
  
  .goa-main {
    margin: 0;
  }
}
</style>

