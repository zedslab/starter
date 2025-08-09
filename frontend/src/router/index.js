// router/index.js - Merged Vue Router configuration
// Combines authentication guards with accessibility and SEO features

import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Login from "../views/Login.vue";
import DesignSystem from "../views/DesignSystem.vue";
import Dashboard from "../views/Dashboard.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: {
      title: "RED Template",
      description: "Secure VENOM-stack Application Development Template",
      requiresAuth: false, // Set to true if authentication is required for this route
    },
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: {
      title: "Login - Template",
      description: "Secure Login to Template",
      requiresAuth: false, // Set to true if authentication is required for this route
    },
  },

  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: {
      title: "Dashboard - Template",
      description: "Authenticated Dashboard Template",
      requiresAuth: false, // Set to true if authentication is required for this route
    },
  },

  {
    path: "/design-system",
    name: "DesignSystem",
    component: DesignSystem,
    meta: {
      title: "RED Design System ",
      description: "Alberta.ca inspired Tailwind4 Vue/Vite Template",
      requiresAuth: false, // Set to true if authentication is required for this route
    },
  },

  // Example of a protected route
  // {
  //   path: '/dashboard',
  //   name: 'Dashboard',
  //   component: () => import('../views/Dashboard.vue'),
  //   meta: {
  //     title: 'Dashboard - Alberta.ca',
  //     description: 'User dashboard with personalized content',
  //     requiresAuth: true // This route requires authentication
  //   }
  // },
  // {
  //   path: '/login',
  //   name: 'Login',
  //   component: () => import('../views/Login.vue'),
  //   meta: {
  //     title: 'Login - Alberta.ca',
  //     description: 'Sign in to access your account',
  //     requiresAuth: false
  //   }
  // },
  // Add more routes as needed
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // Scroll behavior for better UX
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
        top: 0, // Account for fixed headers
      };
    } else {
      return { top: 0 };
    }
  },
});

// Combined navigation guards for authentication, accessibility, and SEO
router.beforeEach((to, from, next) => {
  // 1. Authentication check (your existing logic)
  if (to.meta.requiresAuth && !api.isAuthenticated()) {
    next("/login");
    return;
  }

  // 2. Update document title for SEO and accessibility
  if (to.meta.title) {
    document.title = to.meta.title;
  }

  // 3. Update meta description for SEO
  if (to.meta.description) {
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", to.meta.description);
    } else {
      // Create meta description if it doesn't exist
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = to.meta.description;
      document.getElementsByTagName("head")[0].appendChild(meta);
    }
  }

  // 4. Continue with navigation
  next();
});

// After navigation: focus management for accessibility
router.afterEach((to, from) => {
  // Focus the main content area for screen readers after route change
  // This helps screen reader users understand that the page content has changed
  setTimeout(() => {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      // Set tabindex to -1 to make it focusable programmatically
      mainContent.setAttribute("tabindex", "-1");
      // mainContent.focus()

      // Remove tabindex after focus to prevent it from being in tab order
      mainContent.addEventListener(
        "blur",
        () => {
          mainContent.removeAttribute("tabindex");
        },
        { once: true }
      );
    }
  }, 100); // Small delay to ensure DOM is updated
});

// Optional: Handle route errors
router.onError((error) => {
  console.error("Router error:", error);

  // You could redirect to an error page or show a notification
  // Example: router.push('/error')
});

export default router;
