<template>
  <div class="goa-container">
    <!-- Skip link for accessibility -->
    <a href="#main-content" class="goa-skip-link">Skip to main content</a>
    
    <!-- Header Section -->
    <header class="header-section">
      <div class="goa-content">
        <div class="goa-main">
          <!-- Breadcrumb Navigation -->
          <nav class="goa-breadcrumb" aria-label="Breadcrumb">
            <a href="/" class="goa-breadcrumb__link">Home</a>
            <span class="goa-breadcrumb__separator" aria-hidden="true">/</span>
            <span class="goa-breadcrumb__current" aria-current="page">Design System Demo</span>
          </nav>

          <!-- Page Title -->
          <h1 id="main-content">Design System</h1>
          <p class="intro-text">
            This template serves as a starting point for a rapid AI-based delivery template, built on the VENOM (Vue/Express+NOde/Mongo) Stack. It integrates Alberta.ca design system elements with Tailwind 4 libraries for maximum flexibility.
          </p>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="goa-content">
      <!-- Sidebar Navigation -->
      <aside class="goa-sidebar">
        <nav aria-label="Page sections">
          <h2 class="sidebar-title">Page Sections</h2>
          <ul class="sidebar-nav">
            <li><a href="#alerts" class="sidebar-link">Alerts & Status</a></li>
            <li><a href="#buttons" class="sidebar-link">Buttons</a></li>
            <li><a href="#forms" class="sidebar-link">Forms</a></li>
            <li><a href="#cards" class="sidebar-link">Cards</a></li>
            <li><a href="#tables" class="sidebar-link">Tables</a></li>
            <li><a href="#typography" class="sidebar-link">Typography</a></li>
          </ul>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <div class="goa-main">
        <!-- Alert Examples Section -->
        <section id="alerts" class="content-section">
          <h2>Alerts & Status Messages</h2>
          <p>Status messages using Alberta.ca design tokens for consistent communication.</p>
          
          <div class="goa-alert goa-alert--success">
            <h4 class="goa-alert__title">Success</h4>
            <p class="goa-alert__content">Your application has been submitted successfully. You will receive a confirmation email shortly.</p>
          </div>

          <div class="goa-alert goa-alert--info">
            <h4 class="goa-alert__title">Information</h4>
            <p class="goa-alert__content">New features are now available. Check out the latest updates to improve your experience.</p>
          </div>

          <div class="goa-alert goa-alert--warning">
            <h4 class="goa-alert__title">Warning</h4>
            <p class="goa-alert__content">Your session will expire in 5 minutes. Please save your work to avoid losing any changes.</p>
          </div>

          <div class="goa-alert goa-alert--error">
            <h4 class="goa-alert__title">Error</h4>
            <p class="goa-alert__content">There was an error processing your request. Please try again or contact support if the problem persists.</p>
          </div>
        </section>

        <!-- Button Examples Section -->
        <section id="buttons" class="content-section">
          <h2>Buttons & Actions</h2>
          <p>Interactive elements following Alberta.ca interaction patterns and accessibility standards.</p>
          
          <div class="button-group">
            <h3>Button Variants</h3>
            <div class="button-row">
              <button class="goa-button goa-button--primary" @click="handlePrimaryAction">
                Primary Action
              </button>
              <button class="goa-button goa-button--secondary" @click="handleSecondaryAction">
                Secondary Action
              </button>
              <button class="goa-button goa-button--tertiary" @click="handleTertiaryAction">
                Tertiary Action
              </button>
              <button class="goa-button goa-button--error" @click="handleErrorAction">
                Delete Item
              </button>
            </div>

            <h3>Button Sizes</h3>
            <div class="button-row">
              <button class="goa-button goa-button--primary goa-button--small">Small</button>
              <button class="goa-button goa-button--primary">Regular</button>
              <button class="goa-button goa-button--primary goa-button--large">Large</button>
            </div>

            <h3>Button States</h3>
            <div class="button-row">
              <button class="goa-button goa-button--primary">Normal</button>
              <button class="goa-button goa-button--primary" disabled>Disabled</button>
              <button class="goa-button goa-button--primary" :class="{ 'loading': isLoading }" @click="simulateLoading">
                {{ isLoading ? 'Loading...' : 'Click to Load' }}
              </button>
            </div>
          </div>
        </section>

        <!-- Form Examples Section -->
        <section id="forms" class="content-section">
          <h2>Forms & Input Controls</h2>
          <p>Form components with proper validation states and accessibility features.</p>
          
          <form @submit.prevent="handleFormSubmit" class="demo-form">
            <div class="form-row">
              <div class="goa-form-group">
                <label class="goa-label goa-label--required" for="firstName">First Name</label>
                <input 
                  class="goa-input" 
                  type="text" 
                  id="firstName" 
                  v-model="form.firstName"
                  :class="{ 'goa-input--error': errors.firstName }"
                  required
                >
                <div v-if="errors.firstName" class="goa-error-text">{{ errors.firstName }}</div>
              </div>

              <div class="goa-form-group">
                <label class="goa-label goa-label--required" for="lastName">Last Name</label>
                <input 
                  class="goa-input" 
                  type="text" 
                  id="lastName" 
                  v-model="form.lastName"
                  :class="{ 'goa-input--error': errors.lastName }"
                  required
                >
                <div v-if="errors.lastName" class="goa-error-text">{{ errors.lastName }}</div>
              </div>
            </div>

            <div class="goa-form-group">
              <label class="goa-label goa-label--required" for="email">Email Address</label>
              <input 
                class="goa-input" 
                type="email" 
                id="email" 
                v-model="form.email"
                :class="{ 'goa-input--error': errors.email }"
                required
              >
              <div class="goa-help-text">We'll never share your email address with third parties.</div>
              <div v-if="errors.email" class="goa-error-text">{{ errors.email }}</div>
            </div>

            <div class="goa-form-group">
              <label class="goa-label" for="province">Province</label>
              <select class="goa-select" id="province" v-model="form.province">
                <option value="">Select a province</option>
                <option value="AB">Alberta</option>
                <option value="BC">British Columbia</option>
                <option value="SK">Saskatchewan</option>
                <option value="MB">Manitoba</option>
                <option value="ON">Ontario</option>
                <option value="QC">Quebec</option>
                <option value="NB">New Brunswick</option>
                <option value="NS">Nova Scotia</option>
                <option value="PE">Prince Edward Island</option>
                <option value="NL">Newfoundland and Labrador</option>
                <option value="YT">Yukon</option>
                <option value="NT">Northwest Territories</option>
                <option value="NU">Nunavut</option>
              </select>
            </div>

            <div class="goa-form-group">
              <label class="goa-label" for="message">Message</label>
              <textarea 
                class="goa-textarea" 
                id="message" 
                v-model="form.message"
                rows="4"
                placeholder="Tell us about your experience..."
              ></textarea>
              <div class="goa-help-text">Optional: Share any additional feedback or questions.</div>
            </div>

            <div class="form-actions">
              <button type="submit" class="goa-button goa-button--primary">Submit Form</button>
              <button type="button" class="goa-button goa-button--secondary" @click="resetForm">Reset</button>
            </div>
          </form>
        </section>

        <!-- Card Examples Section -->
        <section id="cards" class="content-section">
          <h2>Cards & Content Containers</h2>
          <p>Flexible card components for organizing and displaying content.</p>
          
          <div class="card-grid">
            <div class="goa-card">
              <div class="goa-card-header">
                <h3 class="goa-card-title">Service Information</h3>
              </div>
              <div class="goa-card-content">
                <p>Access important government services and information. This card demonstrates the standard layout with header, content, and footer sections.</p>
                <ul>
                  <li>Online applications</li>
                  <li>Document downloads</li>
                  <li>Status tracking</li>
                </ul>
              </div>
              <div class="goa-card-footer">
                <button class="goa-button goa-button--primary">Learn More</button>
              </div>
            </div>

            <div class="goa-card">
              <div class="goa-card-header">
                <h3 class="goa-card-title">Quick Actions</h3>
              </div>
              <div class="goa-card-content">
                <p>Frequently used actions and shortcuts for common tasks.</p>
                <div class="quick-actions">
                  <button class="goa-button goa-button--secondary goa-button--small">Renew License</button>
                  <button class="goa-button goa-button--secondary goa-button--small">Pay Fees</button>
                  <button class="goa-button goa-button--secondary goa-button--small">Book Appointment</button>
                </div>
              </div>
            </div>

            <div class="goa-card">
              <div class="goa-card-header">
                <h3 class="goa-card-title">Statistics</h3>
              </div>
              <div class="goa-card-content">
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-number">{{ stats.applications }}</div>
                    <div class="stat-label">Applications Processed</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number">{{ stats.users }}</div>
                    <div class="stat-label">Active Users</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number">{{ stats.satisfaction }}%</div>
                    <div class="stat-label">Satisfaction Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Table Examples Section -->
        <section id="tables" class="content-section">
          <h2>Data Tables</h2>
          <p>Responsive tables for displaying structured data with proper accessibility.</p>
          
          <table class="goa-table">
            <thead class="goa-table__header">
              <tr>
                <th class="goa-table__header-cell">Service</th>
                <th class="goa-table__header-cell">Status</th>
                <th class="goa-table__header-cell">Last Updated</th>
                <th class="goa-table__header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr class="goa-table__row" v-for="service in services" :key="service.id">
                <td class="goa-table__cell">{{ service.name }}</td>
                <td class="goa-table__cell">
                  <span :class="getStatusClass(service.status)">{{ service.status }}</span>
                </td>
                <td class="goa-table__cell">{{ formatDate(service.lastUpdated) }}</td>
                <td class="goa-table__cell">
                  <button class="goa-button goa-button--tertiary goa-button--small" @click="viewService(service)">
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Typography Examples Section -->
        <section id="typography" class="content-section">
          <h2>Typography Scale</h2>
          <p>Complete typography hierarchy using Acumin Pro SemiCondensed and Alberta.ca design tokens.</p>
          
          <div class="typography-examples">
            <div class="type-example">
              <h1 class="type-sample">Heading XL (H1)</h1>
              <code class="type-code">font: var(--goa-typography-heading-xl)</code>
            </div>
            
            <div class="type-example">
              <h2 class="type-sample">Heading Large (H2)</h2>
              <code class="type-code">font: var(--goa-typography-heading-l)</code>
            </div>
            
            <div class="type-example">
              <h3 class="type-sample">Heading Medium (H3)</h3>
              <code class="type-code">font: var(--goa-typography-heading-m)</code>
            </div>
            
            <div class="type-example">
              <h4 class="type-sample">Heading Small (H4)</h4>
              <code class="type-code">font: var(--goa-typography-heading-s)</code>
            </div>
            
            <div class="type-example">
              <h5 class="type-sample">Heading XS (H5)</h5>
              <code class="type-code">font: var(--goa-typography-heading-xs)</code>
            </div>
            
            <div class="type-example">
              <p class="type-sample body-large">Body Large - Used for important body text and introductory paragraphs.</p>
              <code class="type-code">font: var(--goa-typography-body-l)</code>
            </div>
            
            <div class="type-example">
              <p class="type-sample">Body Medium - Standard body text for most content and descriptions.</p>
              <code class="type-code">font: var(--goa-typography-body-m)</code>
            </div>
            
            <div class="type-example">
              <p class="type-sample body-small">Body Small - Used for captions, labels, and secondary information.</p>
              <code class="type-code">font: var(--goa-typography-body-s)</code>
            </div>
            
            <div class="type-example">
              <code class="type-sample number-sample">1234567890</code>
              <code class="type-code">font: var(--goa-typography-number-m) (Roboto Mono)</code>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer-section">
      <div class="goa-content">
        <div class="goa-main">
          <p class="footer-text">
            This demo showcases the Alberta.ca design system implementation. 
            Built with Vue.js and Tailwind 4, following accessibility best practices.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// Reactive data
const isLoading = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  province: '',
  message: ''
})

const errors = reactive({
  firstName: '',
  lastName: '',
  email: ''
})

const stats = reactive({
  applications: '12,847',
  users: '3,291',
  satisfaction: '94'
})

const services = ref([
  {
    id: 1,
    name: 'Driver License Renewal',
    status: 'Active',
    lastUpdated: new Date('2024-01-15')
  },
  {
    id: 2,
    name: 'Vehicle Registration',
    status: 'Maintenance',
    lastUpdated: new Date('2024-01-10')
  },
  {
    id: 3,
    name: 'Health Card Application',
    status: 'Active',
    lastUpdated: new Date('2024-01-12')
  },
  {
    id: 4,
    name: 'Business License',
    status: 'Under Review',
    lastUpdated: new Date('2024-01-08')
  }
])

// Methods
const handlePrimaryAction = () => {
  console.log('Primary action clicked')
}

const handleSecondaryAction = () => {
  console.log('Secondary action clicked')
}

const handleTertiaryAction = () => {
  console.log('Tertiary action clicked')
}

const handleErrorAction = () => {
  if (confirm('Are you sure you want to delete this item?')) {
    console.log('Item deleted')
  }
}

const simulateLoading = () => {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 2000)
}

const validateForm = () => {
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  let isValid = true

  if (!form.firstName.trim()) {
    errors.firstName = 'First name is required'
    isValid = false
  }

  if (!form.lastName.trim()) {
    errors.lastName = 'Last name is required'
    isValid = false
  }

  if (!form.email.trim()) {
    errors.email = 'Email address is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address'
    isValid = false
  }

  return isValid
}

const handleFormSubmit = () => {
  if (validateForm()) {
    console.log('Form submitted:', form)
    alert('Form submitted successfully!')
  }
}

const resetForm = () => {
  Object.keys(form).forEach(key => {
    form[key] = ''
  })
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

const getStatusClass = (status) => {
  const statusClasses = {
    'Active': 'status-active',
    'Maintenance': 'status-warning',
    'Under Review': 'status-info'
  }
  return statusClasses[status] || 'status-default'
}

const formatDate = (date) => {
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const viewService = (service) => {
  console.log('Viewing service:', service.name)
  alert(`Viewing details for: ${service.name}`)
}
</script>

<style scoped>
/* Component-specific styles that complement the Alberta.ca design system */

.header-section {
  background-color: var(--goa-color-greyscale-50);
  padding: var(--goa-space-xl) 0;
  margin-bottom: var(--goa-space-2xl);
  border-bottom: var(--goa-border-width-s) solid var(--goa-color-greyscale-200);
}

.intro-text {
  font: var(--goa-typography-body-l);
  color: var(--goa-color-text-secondary);
  max-width: 72ch;
  margin-top: var(--goa-space-m);
}

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

.content-section {
  margin-bottom: var(--goa-space-4xl);
  padding-bottom: var(--goa-space-2xl);
  border-bottom: var(--goa-border-width-s) solid var(--goa-color-greyscale-150);
}

.content-section:last-child {
  border-bottom: none;
}

.button-group {
  margin-top: var(--goa-space-l);
}

.button-group h3 {
  margin-top: var(--goa-space-xl);
  margin-bottom: var(--goa-space-m);
}

.button-row {
  display: flex;
  gap: var(--goa-space-m);
  margin-bottom: var(--goa-space-l);
  flex-wrap: wrap;
}

.demo-form {
  max-width: 600px;
  margin-top: var(--goa-space-l);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--goa-space-l);
}

.form-actions {
  display: flex;
  gap: var(--goa-space-m);
  margin-top: var(--goa-space-xl);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--goa-space-l);
  margin-top: var(--goa-space-l);
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-s);
  margin-top: var(--goa-space-m);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--goa-space-m);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font: var(--goa-typography-heading-l);
  color: var(--goa-color-interactive-default);
  margin-bottom: var(--goa-space-xs);
}

.stat-label {
  font: var(--goa-typography-body-xs);
  color: var(--goa-color-text-secondary);
}

.status-active {
  color: var(--goa-color-status-success-default);
  font-weight: 600;
}

.status-warning {
  color: var(--goa-color-status-warning-default);
  font-weight: 600;
}

.status-info {
  color: var(--goa-color-status-info-default);
  font-weight: 600;
}

.status-default {
  color: var(--goa-color-text-secondary);
}

.typography-examples {
  margin-top: var(--goa-space-l);
}

.type-example {
  margin-bottom: var(--goa-space-xl);
  padding: var(--goa-space-l);
  border: var(--goa-border-width-s) solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-s);
  background-color: var(--goa-color-greyscale-white);
}

.type-sample {
  margin: 0 0 var(--goa-space-s) 0;
}

.body-large {
  font: var(--goa-typography-body-l);
}

.body-small {
  font: var(--goa-typography-body-s);
}

.number-sample {
  font: var(--goa-typography-number-m);
  background-color: var(--goa-color-greyscale-100);
  padding: var(--goa-space-xs) var(--goa-space-s);
  border-radius: var(--goa-border-radius-s);
  display: inline-block;
}

.type-code {
  font: var(--goa-typography-number-s);
  color: var(--goa-color-text-secondary);
  background-color: var(--goa-color-greyscale-100);
  padding: var(--goa-space-3xs) var(--goa-space-2xs);
  border-radius: var(--goa-border-radius-s);
  display: block;
  margin-top: var(--goa-space-xs);
}

.footer-section {
  background-color: var(--goa-color-greyscale-100);
  padding: var(--goa-space-2xl) 0;
  margin-top: var(--goa-space-4xl);
  border-top: var(--goa-border-width-s) solid var(--goa-color-greyscale-200);
}

.footer-text {
  font: var(--goa-typography-body-s);
  color: var(--goa-color-text-secondary);
  text-align: center;
  margin: 0;
}

/* Loading state for button */
.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Responsive adjustments */
@media screen and (max-width: 896px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .button-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .card-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 623px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .type-example {
    padding: var(--goa-space-m);
  }
}
</style>

