<template>
  <div class="goa-container">

    <!-- Breadcrumb Navigation -->
    <div class="goa-content">
      <nav class="goa-breadcrumb" aria-label="Breadcrumb">
        <span class="goa-breadcrumb__current" aria-current="page">Home</span>
      </nav>
    </div>

    <!-- Enhanced Hero Section -->
    <section class="goa-hero goa-hero--enhanced flex items-center justify-center min-h-[50vh] relative">
      <div class="goa-hero__background absolute inset-0 bg-gray-900"></div>
      <div class="goa-hero__overlay absolute inset-0 bg-black opacity-50"></div>
      <div class="goa-hero__content relative z-10 flex justify-center w-full">
        <div class="goa-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="goa-main flex flex-col items-center text-center">
            <!-- Hero Content -->
            <div class="goa-hero__text-content space-y-6">
              <h1 id="main-content" class="goa-hero__title text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
                RED VENOM Template
              </h1>
              <p class="goa-hero__subtitle text-lg sm:text-xl lg:text-2xl text-gray-200 max-w-3xl">
                Rapid Execution and Delivery (RED) with Vue/Express+Node/Mongo (VENOM) Stack
              </p>
              <p class="goa-hero__description text-base sm:text-lg text-gray-300 max-w-2xl">
                Build secure, accessible, and scalable web applications with AI-powered development. 
                Production-ready template combining enterprise security, WCAG 2.1 accessibility, and rapid deployment capabilities.
              </p>
              <div class="goa-hero__actions flex flex-col sm:flex-row gap-4 justify-center">
                <router-link 
                  to="/design-system" 
                  class="goa-button goa-button--primary goa-button--large goa-hero__cta flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  <svg class="goa-button__icon w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10,17 15,12 10,7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Design System
                </router-link>
                <a 
                  href="#" 
                  class="goa-button goa-button--secondary goa-button--large goa-hero__cta flex items-center justify-center px-6 py-3 text-base font-medium text-blue-600 bg-white hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg class="goa-button__icon w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                  </svg>
                  Demo (Coming Shortly)
                </a>
              </div>
              
              <!-- Hero Stats -->
              <div class="goa-hero__stats flex flex-col sm:flex-row gap-6 justify-center mt-8">
                <div class="goa-stat-item flex flex-col items-center">
                  <div class="goa-stat-item__number text-3xl font-bold text-white">100%</div>
                  <div class="goa-stat-item__label text-sm text-gray-300">WCAG 2.1 Compliant</div>
                </div>
                <div class="goa-stat-item flex flex-col items-center">
                  <div class="goa-stat-item__number text-3xl font-bold text-white">0</div>
                  <div class="goa-stat-item__label text-sm text-gray-300">Known Vulnerabilities</div>
                </div>
                <div class="goa-stat-item flex flex-col items-center">
                  <div class="goa-stat-item__number text-3xl font-bold text-white">5min</div>
                  <div class="goa-stat-item__label text-sm text-gray-300">Setup Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Enhanced Features Section -->
    <section class="goa-features-section py-12">
      <div class="goa-content">
        <div class="goa-main">
          <div class="goa-section-header text-center mb-8">
            <h2 class="goa-section-title text-3xl font-bold text-gray-900">Why Choose RED VENOM?</h2>
            <p class="goa-section-intro text-lg text-gray-600 max-w-3xl mx-auto">
              A production-ready template combining enterprise-grade security, accessibility, and AI-driven development for rapid application deployment.
            </p>
          </div>
          
          <!-- Frontend Security Features -->
          <div class="mb-12">
            <h3 class="text-2xl font-semibold text-gray-800 mb-4">Frontend Security</h3>
            <div class="goa-features-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="feature in frontendFeatures" :key="feature.name" 
                   class="goa-feature-card shadow-md rounded-lg p-6 transition-transform transform hover:scale-105"
                   :class="feature.bgColor">
                <div class="goa-feature-card__icon mb-4">
                  <i :class="['pi', feature.icon, 'text-2xl', feature.textColor]" aria-hidden="true"></i>
                </div>
                <h4 class="goa-feature-card__title text-xl font-semibold text-gray-900 mb-2">{{ feature.name }}</h4>
                <p class="goa-feature-card__description text-sm text-gray-600 mb-4">{{ feature.description }}</p>
                <ul class="goa-feature-card__features list-disc list-inside text-sm text-gray-700 mb-4">
                  <li v-for="item in feature.features" :key="item">{{ item }}</li>
                </ul>
                <a :href="feature.link" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Learn More</a>
              </div>
            </div>
          </div>

          <!-- Backend Security Features -->
          <div>
            <h3 class="text-2xl font-semibold text-gray-800 mb-4">Backend Security</h3>
            <div class="goa-features-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="feature in backendFeatures" :key="feature.name" 
                   class="goa-feature-card shadow-md rounded-lg p-6 transition-transform transform hover:scale-105"
                   :class="feature.bgColor">
                <div class="goa-feature-card__icon mb-4">
                  <i :class="['pi', feature.icon, 'text-2xl', feature.textColor]" aria-hidden="true"></i>
                </div>
                <h4 class="goa-feature-card__title text-xl font-semibold text-gray-900 mb-2">{{ feature.name }}</h4>
                <p class="goa-feature-card__description text-sm text-gray-600 mb-4">{{ feature.description }}</p>
                <ul class="goa-feature-card__features list-disc list-inside text-sm text-gray-700 mb-4">
                  <li v-for="item in feature.features" :key="item">{{ item }}</li>
                </ul>
                <a :href="feature.link" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Learn More</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Enhanced Call-to-Action Section -->
    <section class="goa-cta-section bg-blue-900 text-white py-12">
      <div class="goa-content">
        <div class="goa-main">
          <div class="goa-cta-section__content text-center">
            <h2 class="goa-cta-section__title text-3xl font-bold mb-4">Get Started with RED VENOM</h2>
            <p class="goa-cta-section__text text-lg mb-6 max-w-3xl mx-auto">
              Start building secure, accessible, and scalable web applications today. 
              Explore our comprehensive documentation or try the interactive demo to see RED VENOM in action.
            </p>
            <div class="goa-cta-section__actions flex flex-col sm:flex-row gap-4 justify-center">
              <button class="goa-button goa-button--primary goa-button--large goa-cta-section__button flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                <svg class="goa-button__icon w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10,17 15,12 10,7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Try the Demo (Coming Shortly)
              </button>
              <a href="https://github.com/developmentation/red-venom-template" class="goa-button goa-button--secondary goa-button--large goa-cta-section__button flex items-center justify-center px-6 py-3 text-base font-medium text-blue-600 bg-white hover:bg-gray-100 rounded-md transition-colors">
                <svg class="goa-button__icon w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
                Get the Code
              </a>
            </div>
            
            <!-- Trust Indicators -->
            <div class="goa-trust-indicators mt-8 flex flex-col sm:flex-row gap-6 justify-center">
              <div class="goa-trust-indicators__item flex items-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
                <span class="ml-2">Production Ready</span>
              </div>
              <div class="goa-trust-indicators__item flex items-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span class="ml-2">Enterprise Security</span>
              </div>
              <div class="goa-trust-indicators__item flex items-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
                <span class="ml-2">Developer Friendly</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Enhanced Footer -->
    <footer class="goa-footer-section bg-gray-100 py-8">
      <div class="goa-content">
        <div class="goa-main">
          <div class="goa-footer-section__content">
            <div class="goa-footer-section__main">
              <h3 class="goa-footer-section__title text-2xl font-bold text-gray-900">RED VENOM Template</h3>
              <p class="goa-footer-section__description text-gray-600">
                Powered by Vue.js, Node.js, and the Alberta.ca design system. 
                Built for rapid, secure, and accessible web application development.
              </p>
              <div class="goa-footer-section__links flex flex-wrap gap-4 mt-4">
                <a href="/docs" class="goa-footer-section__link text-blue-600 hover:text-blue-800">Documentation</a>
                <a href="/examples" class="goa-footer-section__link text-blue-600 hover:text-blue-800">Examples</a>
                <a href="/support" class="goa-footer-section__link text-blue-600 hover:text-blue-800">Support</a>
                <a href="https://github.com/developmentation/red-venom-template" class="goa-footer-section__link text-blue-600 hover:text-blue-800">GitHub</a>
              </div>
            </div>
            <div class="goa-footer-section__secondary mt-4">
              <p class="goa-footer-section__copyright text-gray-600">
                © 2025 Government of Alberta. MIT License. Built by AIM ❤️ for all Albertans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Reactive data for potential interactivity
const isLoading = ref(false)

// Frontend security features
const frontendFeatures = ref([
  {
    name: 'CSRF Protection',
    description: 'Safeguards form submissions against cross-site request forgery attacks.',
    features: [
      'Validates x-csrf-token headers for secure form submissions.',
      'Skips safe methods (GET, HEAD, OPTIONS) for performance.'
    ],
    icon: 'pi-shield',
    bgColor: 'bg-blue-100 hover:bg-blue-200',
    textColor: 'text-blue-600',
    link: 'https://owasp.org/www-community/attacks/csrf'
  },
  {
    name: 'XSS Prevention',
    description: 'Protects against cross-site scripting attacks through input sanitization.',
    features: [
      'Sanitizes user inputs to prevent script injection.',
      'Uses Vue’s built-in escaping for safe rendering.'
    ],
    icon: 'pi-shield',
    bgColor: 'bg-green-100 hover:bg-green-200',
    textColor: 'text-green-600',
    link: 'https://owasp.org/www-community/attacks/xss/'
  },
  {
    name: 'Secure Navigation',
    description: 'Ensures safe client-side navigation with Vue Router.',
    features: [
      'Employs router-link for secure navigation.',
      'Respects authentication state to prevent unauthorized access.'
    ],
    icon: 'pi-arrow-right',
    bgColor: 'bg-purple-100 hover:bg-purple-200',
    textColor: 'text-purple-600',
    link: 'https://router.vuejs.org/guide/advanced/navigation-guards'
  },
  {
    name: 'WCAG 2.1 Compliance',
    description: 'Accessible, standardized UI.',
    features: [
      'Semantic HTML with ARIA attributes for accessibility.',
      'Ensures compliance with WCAG 2.1 standards.'
    ],
    icon: 'pi-users',
    bgColor: 'bg-indigo-100 hover:bg-indigo-200',
    textColor: 'text-indigo-600',
    link: 'https://www.w3.org/TR/WCAG21/'
  },
  {
    name: 'Common Look and Feel Design System',
    description: 'Standardized UI components enhance security and consistency.',
    features: [
      'Consistent UI reduces vulnerabilities from custom code.',
      'Leverages Alberta.ca design system for secure patterns.'
    ],
    icon: 'pi-desktop',
    bgColor: 'bg-teal-100 hover:bg-teal-200',
    textColor: 'text-teal-600',
    link: 'https://design.alberta.ca/'
  },
  {
    name: 'Axios Interceptors',
    description: 'Secures HTTP requests with automated handling.',
    features: [
      'Automatically handles token refresh and error responses.',
      'Sanitizes outgoing requests to prevent data leaks.'
    ],
    icon: 'pi-globe',
    bgColor: 'bg-orange-100 hover:bg-orange-200',
    textColor: 'text-orange-600',
    link: 'https://axios-http.com/docs/interceptors'
  },
  {
    name: 'HTTP-only Cookies',
    description: 'Protects session tokens from JavaScript access.',
    features: [
      'Stores tokens in HTTP-only cookies.',
      'Enforces secure cookie attributes in production.'
    ],
    icon: 'pi-lock',
    bgColor: 'bg-pink-100 hover:bg-pink-200',
    textColor: 'text-pink-600',
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies'
  },
  {
    name: 'Short-lived JWT Tokens',
    description: 'Minimizes exposure with short-lived tokens.',
    features: [
      'Uses short-lived JWTs to reduce compromise impact.',
      'Integrates with refresh tokens for seamless experience.'
    ],
    icon: 'pi-clock',
    bgColor: 'bg-cyan-100 hover:bg-cyan-200',
    textColor: 'text-cyan-600',
    link: 'https://www.jwt.io/introduction'
  }
])

// Backend security features
const backendFeatures = ref([
  {
    name: 'JWT Authentication',
    description: 'Secures user authentication with JSON Web Tokens.',
    features: [
      'Verifies JWTs for secure authentication.',
      'Checks user existence and account status.'
    ],
    icon: 'pi-shield',
    bgColor: 'bg-blue-100 hover:bg-blue-200',
    textColor: 'text-blue-600',
    link: 'https://medium.com/@utkarsh.gupta0311/secure-user-authentication-with-jwt-bcrypt-and-node-js-78c7bb2d86a1'
  },
  {
    name: 'Role / Attribute-Based Access Control',
    description: 'Manages permissions with fine-grained control using CASL.',
    features: [
      'Uses CASL for role-based permissions.',
      'Supports additive roles for flexible access.'
    ],
    icon: 'pi-shield',
    bgColor: 'bg-green-100 hover:bg-green-200',
    textColor: 'text-green-600',
    link: 'https://casl.js.org/v5/en/guide/intro'
  },
  {
    name: 'Rate Limiting',
    description: 'Prevents abuse with request rate restrictions.',
    features: [
      '100 requests per 15 minutes for general endpoints.',
      '5 login attempts per 15 minutes for authentication.'
    ],
    icon: 'pi-shield',
    bgColor: 'bg-red-100 hover:bg-red-200',
    textColor: 'text-red-600',
    link: 'https://www.npmjs.com/package/express-rate-limit'
  },
  {
    name: 'CSRF Protection',
    description: 'Secures server-side requests with token validation.',
    features: [
      'Timing-safe token comparison.',
      'Skips CSRF for safe paths like /api/auth/login.'
    ],
    icon: 'pi-shield',
    bgColor: 'bg-purple-100 hover:bg-purple-200',
    textColor: 'text-purple-600',
    link: 'https://owasp.org/www-community/attacks/csrf'
  },
  {
    name: 'Session Management',
    description: 'Secures user sessions with robust configurations.',
    features: [
      'MongoDB session store with HTTP-only cookies.',
      'Strict sameSite policy and secure cookies in production.'
    ],
    icon: 'pi-lock',
    bgColor: 'bg-indigo-100 hover:bg-indigo-200',
    textColor: 'text-indigo-600',
    link: 'https://github.com/developmentation/red-venom-template/blob/main/docs/security.md#session-management'
  },
  {
    name: 'CORS Configuration',
    description: 'Restricts cross-origin requests to trusted sources.',
    features: [
      'Limits origins to allowed list.',
      'Logs CORS violations for monitoring.'
    ],
    icon: 'pi-globe',
    bgColor: 'bg-teal-100 hover:bg-teal-200',
    textColor: 'text-teal-600',
    link: 'https://www.npmjs.com/package/cors'
  },
  {
    name: 'Helmet Security Headers',
    description: 'Enhances security with HTTP headers.',
    features: [
      'Configures CSP, HSTS, XSS filter, and frameguard.',
      'Disables DNS prefetching and enforces referrer policy.'
    ],
    icon: 'pi-shield',
    bgColor: 'bg-orange-100 hover:bg-orange-200',
    textColor: 'text-orange-600',
    link: 'https://www.npmjs.com/package/helmet'
  },
  {
    name: 'Input Sanitization',
    description: 'Prevents injection attacks through data sanitization.',
    features: [
      'Prevents MongoDB injection with express-mongo-sanitize.',
      'Sanitizes HTML inputs to prevent XSS.'
    ],
    icon: 'pi-shield',
    bgColor: 'bg-yellow-100 hover:bg-yellow-200',
    textColor: 'text-yellow-600',
    link: 'https://www.npmjs.com/package/sanitize-html'
  },
  {
    name: 'Secure Compression',
    description: 'Optimizes performance with secure compression.',
    features: [
      'Applies compression with customizable thresholds.',
      'Respects x-no-compression header.'
    ],
    icon: 'pi-file',
    bgColor: 'bg-pink-100 hover:bg-pink-200',
    textColor: 'text-pink-600',
    link: 'https://www.npmjs.com/package/compression'
  },
  {
    name: 'Comprehensive Logging',
    description: 'Tracks application activity with secure logging.',
    features: [
      'Redacts sensitive data like passwords and tokens.',
      'Supports daily log rotation and multiple log types.'
    ],
    icon: 'pi-file-edit',
    bgColor: 'bg-cyan-100 hover:bg-cyan-200',
    textColor: 'text-cyan-600',
    link: 'https://www.npmjs.com/package/winston'
  },
  {
    name: 'Error Handling',
    description: 'Manages errors securely with detailed logging.',
    features: [
      'Centralized error handling with safe responses.',
      'Handles specific errors like validation and duplicates.'
    ],
    icon: 'pi-exclamation-triangle',
    bgColor: 'bg-gray-100 hover:bg-gray-200',
    textColor: 'text-gray-600',
    link: 'https://github.com/developmentation/red-venom-template'
  },
  {
    name: 'MongoDB Query Monitoring',
    description: 'Optimizes database performance with monitoring.',
    features: [
      'Logs slow queries (>500ms).',
      'Tracks query success/failure with context.'
    ],
    icon: 'pi-database',
    bgColor: 'bg-blue-200 hover:bg-blue-300',
    textColor: 'text-blue-700',
    link: 'https://github.com/developmentation/red-venom-template/blob/main/docs/security.md#mongodb-monitoring'
  },
  {
    name: 'Content-Type Validation',
    description: 'Ensures valid request content types.',
    features: [
      'Enforces allowed content types (e.g., JSON).',
      'Logs invalid content type attempts.'
    ],
    icon: 'pi-check-circle',
    bgColor: 'bg-green-200 hover:bg-green-300',
    textColor: 'text-green-700',
    link: 'https://github.com/developmentation/red-venom-template/blob/main/docs/security.md#content-type-validation'
  },
  {
    name: 'Environment Validation',
    description: 'Ensures secure configuration of environment variables.',
    features: [
      'Validates critical environment variables.',
      'Enforces SESSION_SECRET length.'
    ],
    icon: 'pi-cog',
    bgColor: 'bg-red-200 hover:bg-red-300',
    textColor: 'text-red-700',
    link: 'https://github.com/developmentation/red-venom-template/blob/main/docs/security.md#environment-validation'
  },
  {
    name: 'Account Lockout',
    description: 'Protects against brute force attacks.',
    features: [
      'Locks accounts after repeated failed logins.',
      'Logs lockout events for auditing.'
    ],
    icon: 'pi-lock',
    bgColor: 'bg-purple-200 hover:bg-purple-300',
    textColor: 'text-purple-700',
    link: 'https://github.com/developmentation/red-venom-template/blob/main/docs/security.md#account-lockout'
  },
  {
    name: 'CSP Violation Reporting',
    description: 'Monitors Content Security Policy violations.',
    features: [
      'Logs CSP violations for analysis.',
      'Returns 204 status for report-only endpoint.'
    ],
    icon: 'pi-shield',
    bgColor: 'bg-indigo-200 hover:bg-indigo-300',
    textColor: 'text-indigo-700',
    link: 'https://github.com/developmentation/red-venom-template/blob/main/docs/security.md#csp-reporting'
  }
])

// Methods
const handleDemoClick = () => {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}

// Intersection Observer for animations
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('goa-animate-in')
        }
      })
    },
    { threshold: 0.1 }
  )

  // Observe feature cards for animation
  document.querySelectorAll('.goa-feature-card').forEach((card) => {
    observer.observe(card)
  })
})
</script>

<style scoped>
.goa-feature-card {
  transition: transform 0.2s ease-in-out;
}
.goa-feature-card:hover {
  transform: scale(1.05);
}
.goa-cta-section {
  background-color: #1e3a8a; /* Tailwind bg-blue-900 */
}
.goa-cta-section__title,
.goa-cta-section__text {
  color: #ffffff; /* Ensure text is white for contrast */
}
</style>