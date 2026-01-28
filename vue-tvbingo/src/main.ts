import { createApp } from 'vue'
import './style.css'
import './styles/form-theme.css'
import App from './App.vue'
import router from './router'

// Add console logging for debugging
console.log('Vue app initializing...')

try {
  const app = createApp(App)
  
  // Add error handler
  app.config.errorHandler = (err, _instance, info) => {
    console.error('Vue Error:', err)
    console.error('Error Info:', info)
  }
  
  app.use(router)
  
  // Check if mount element exists
  const mountElement = document.getElementById('app')
  if (!mountElement) {
    console.error('Mount element #app not found in DOM')
  } else {
    console.log('Mount element found, mounting app...')
    app.mount('#app')
    console.log('App mounted successfully')
  }
} catch (error) {
  console.error('Failed to initialize Vue app:', error)
}