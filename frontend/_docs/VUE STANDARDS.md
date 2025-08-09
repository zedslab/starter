Vue.js Development Standards
This document outlines the development standards for building Vue.js applications, ensuring consistency, maintainability, and scalability across projects. These standards incorporate the provided requirements, corrections for Tailwind CSS 4 syntax and Axios interceptors, and additional recommendations for best practices.
Core Standards
1. Vue.js Version

Always use the latest stable version of Vue.js, which is currently v3.5.18. Ensure all projects are updated to this version to leverage the latest features, performance improvements, and security patches.

2. Composition API with <script setup>

Use the Composition API with the <script setup> syntax for all components. This promotes concise, readable, and maintainable code.
Example:<script setup>
import { ref, onMounted } from 'vue';

const count = ref(0);

onMounted(() => {
  console.log('Component mounted');
});
</script>



3. Composables for Logic and State

Encapsulate reusable logic and global variables in composables (stored in /composables folder).
Use composables for API calls, shared state, or utility functions to keep components clean and focused on UI logic.
Include global variables outside the composable function and export them in the return object.
Example:// composables/useApi.js
import axios from 'axios';

const apiBaseUrl = 'https://api.example.com';
const apiTimeout = 5000;

const instance = axios.create({
  baseURL: apiBaseUrl,
  timeout: apiTimeout,
});

instance.interceptors.request.use((config) => {
  // Add auth token if needed
  config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export function useApi() {
  const fetchData = async (url) => {
    const response = await instance.get(url);
    return response.data;
  };

  return { fetchData, apiBaseUrl, apiTimeout };
}



4. Component and View Structure

Build components for reusable page elements and store them in the /components folder.
Example: /components/Button.vue, /components/Header.vue.


Create views for full-page layouts and store them in the /views folder.
Example: /views/Home.vue, /views/About.vue.



5. Routing with Vue Router

Use Vue Router 4 for client-side routing, configured in router/index.js.
Define routes clearly and use lazy loading for performance.
Example:// router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: () => import('../views/About.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;



6. Styling with Tailwind CSS

Use Tailwind CSS 4 for styling, with a custom stylesheet in /styles/main.css.
Import the custom stylesheet into the main application file (e.g., main.js).
Use the correct Tailwind CSS 4 syntax, ensuring proper configuration with @import or @config if needed, and avoid deprecated directives.
Example:/* styles/main.css */
@import 'tailwindcss';

@layer base {
  h1 {
    @apply text-2xl font-bold;
  }
}

@layer components {
  .btn-primary {
    @apply bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600;
  }
}

@layer utilities {
  .custom-utility {
    @apply max-w-screen-sm mx-auto;
  }
}

// main.js
import './styles/main.css';



7. API Interactions with Axios

Use Axios with interceptors for handling API requests and responses consistently, as shown in the useApi composable above.
Configure interceptors to manage authentication, error handling, or logging.

8. Reactive Variables

Use refs for dynamic variables tied to the user interface. Avoid using refs for static values or non-UI-related data.
Avoid reactive objects unless necessary for complex state management.
Example:<script setup>
import { ref } from 'vue';

const inputValue = ref(''); // Dynamic, tied to UI
const staticConfig = { apiKey: 'abc123' }; // Static, no ref needed
</script>



9. Lifecycle Hooks

Use onMounted for initialization tasks (e.g., API calls, setting up event listeners).
Use onUnmounted for cleanup (e.g., removing event listeners, clearing intervals).
Example:<script setup>
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  console.log('Initialize component');
  // Fetch initial data or set up listeners
});

onUnmounted(() => {
  console.log('Cleanup component');
  // Remove listeners or clear intervals
});
</script>



10. Component Communication

Use props for parent-to-child communication and emits for child-to-parent communication.
Define props and emits explicitly to ensure clarity.
Example:<script setup>
defineProps(['title']);
const emit = defineEmits(['update']);

const handleClick = () => {
  emit('update', 'New value');
};
</script>



11. State Management

Never use Pinia or Vuex for state management. Rely on composables for managing global state.
Store shared state in composables to ensure modularity and reusability.

12. TypeScript Avoidance

Never use TypeScript unless explicitly required. Stick to plain JavaScript to reduce complexity and build time.

Additional Recommendations

File Naming Conventions

Use PascalCase for component and view files (e.g., MyComponent.vue, HomeView.vue).
Use kebab-case for other files (e.g., use-api.js, main.css).


Component Granularity

Keep components small and focused on a single responsibility. Aim for reusability across views.


Error Handling

Implement consistent error handling in API calls using try-catch blocks within composables.
Display user-friendly error messages in the UI.
Example:async function fetchData(url) {
  try {
    const response = await instance.get(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return null;
  }
}




Code Comments

Add clear, concise comments to explain complex logic, especially in composables and utility functions.
Avoid over-commenting obvious code.


Folder Structure

Maintain a consistent project structure:src/
├── components/
├── composables/
├── router/
│   └── index.js
├── styles/
│   └── main.css
├── views/
└── main.js




Performance Optimization

Use v-memo or v-once for static content to reduce unnecessary re-renders.
Lazy-load components and routes to improve initial load times.


Accessibility (a11y)

Ensure components are accessible by adding ARIA attributes and semantic HTML.
Test with screen readers to verify usability.


Testing

Write unit tests for composables and critical components using a lightweight testing framework like Vitest.
Mock API responses to ensure reliable tests.


Environment Variables

Store configuration values (e.g., API base URLs) in environment variables using .env files.
Access them via import.meta.env in Vite-based projects.


Code Linting and Formatting

Use ESLint with a Vue-specific configuration to enforce code quality.
Use Prettier for consistent code formatting across the team.


Version Control

Follow a consistent Git commit message format (e.g., Conventional Commits).
Example: feat: add user authentication composable.


Documentation

Maintain a README.md in each project with setup instructions, project structure, and key dependencies.
Document composables with JSDoc for better maintainability.



Conclusion
Adhering to these standards ensures that Vue.js applications are consistent, scalable, and maintainable. Regularly review and update these guidelines to incorporate new Vue.js features and best practices as they evolve.