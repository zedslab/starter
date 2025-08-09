// main.js - Correct Vue 3 + Vue Router setup

import { createApp } from 'vue'
import App from './App.vue'
import router from './router/' // Make sure this path matches your router file location

// Import the Alberta.ca design system CSS
import './styles/main.css'
import './styles/enhanced.css'
import 'primeicons/primeicons.css'

// Create the Vue app
const app = createApp(App)

// Use the router
app.use(router)

// Mount the app
app.mount('#app')

// Optional: Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err, info)
}

// Optional: Global warning handler for development
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, vm, trace) => {
    console.warn('Vue warning:', msg, trace)
  }
}
