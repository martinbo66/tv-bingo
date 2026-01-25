<template>
  <div class="create-show-page">
    <div class="header">
      <h2>Create New TV Show</h2>
      <p>Create a new TV show and add phrases to it.</p>
    </div>
    <div v-if="error" class="error-message">
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
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.back-link {
  color: #646cff;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.error-message {
  background-color: #fef2f2;
  color: #dc2626;
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}
</style>
