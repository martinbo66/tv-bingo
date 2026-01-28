<template>
  <div class="create-show-page">
    <div class="header-section">
      <h2>Create New TV Show</h2>
      <p class="subtitle">Create a new TV show and add phrases to it.</p>
    </div>
    <div v-if="error" class="error-message" role="alert">
      {{ error }}
    </div>
    <CreateShow @show-created="onShowCreated" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import CreateShow from '../components/CreateShow.vue'
import type { CreateShowInput } from '../types/Show'
import { showService } from '../services/showService'
import { ApiError } from '../services/apiClient'

const router = useRouter()
const error = ref<string | null>(null)

const formatValidationErrors = (errorData: any): string => {
  if (!errorData || typeof errorData !== 'object') {
    return 'Validation error occurred'
  }

  // Extract field-specific error messages
  const errorMessages = Object.entries(errorData)
    .map(([field, message]) => `${field}: ${message}`)
    .join(', ')

  return errorMessages || 'Validation error occurred'
}

const onShowCreated = async (showInput: CreateShowInput) => {
  error.value = null
  try {
    // API will assign the ID - no need to generate it client-side
    await showService.addShow(showInput)
    router.push('/')
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 400) {
        // Validation errors - show field-specific messages
        error.value = formatValidationErrors(e.data)
      } else if (e.status === 409) {
        // Conflict - duplicate show title
        error.value = e.data?.showTitle || 'Show title must be unique'
      } else {
        error.value = `Failed to create show: ${e.message}`
      }
    } else {
      error.value = 'Failed to create show. Please try again.'
    }
    console.error(e)
  }
}
</script>

<style scoped>
.create-show-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  min-height: calc(100vh - 200px);
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 600px;
}

.header-section h2 {
  margin: 0;
  color: #fff;
  font-size: 2rem;
  font-weight: 600;
}

.subtitle {
  margin-top: 0.5rem;
  color: #888;
  font-size: 1rem;
}

.error-message {
  width: 100%;
  max-width: 600px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  background-color: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: 6px;
  color: #ff4444;
  font-size: 0.9rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .create-show-page {
    padding: 1rem;
  }

  .header-section h2 {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .create-show-page {
    padding: 0.5rem;
  }

  .header-section h2 {
    font-size: 1.5rem;
  }
}
</style>
