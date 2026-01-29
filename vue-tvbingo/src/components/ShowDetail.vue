<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Show } from '../types/Show'
import { showService } from '../services/showService'
import { ApiError } from '../services/apiClient'
import { useUnsavedChangesGuard } from '../composables/useUnsavedChangesGuard'
import FormFieldWithValidation from './common/FormFieldWithValidation.vue'
import PhraseListManager from './common/PhraseListManager.vue'
import { VALIDATION_LIMITS } from '../constants/formValidation'

const props = defineProps<{
  id: string
}>()

// Extend Show type to make optional fields required for form binding
interface ShowWithRequiredFields extends Omit<Show, 'gameTitle' | 'centerSquare'> {
  gameTitle: string
  centerSquare: string
}

const router = useRouter()
const show = ref<ShowWithRequiredFields | null>(null)
const originalShow = ref<ShowWithRequiredFields | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Field-specific validation errors from API
interface FieldError {
  showTitle?: string
  gameTitle?: string
  centerSquare?: string
}
const fieldErrors = ref<FieldError>({})

// Unsaved changes guard
const { hasUnsavedChanges, markClean, setupGuards } = useUnsavedChangesGuard(originalShow, show)

onMounted(async () => {
  try {
    const loadedShow = await showService.getShowById(parseInt(props.id))
    if (loadedShow) {
      // Ensure optional fields are always strings (not undefined)
      show.value = {
        ...loadedShow,
        gameTitle: loadedShow.gameTitle || '',
        centerSquare: loadedShow.centerSquare || ''
      }
      originalShow.value = {
        ...loadedShow,
        gameTitle: loadedShow.gameTitle || '',
        centerSquare: loadedShow.centerSquare || ''
      }
    } else {
      error.value = 'Show not found'
      router.push('/')
    }
  } catch (e) {
    error.value = 'Failed to load show'
    console.error(e)
  } finally {
    loading.value = false
  }

  setupGuards()
})

// Cancel with confirmation
const handleCancel = () => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm(
      'You have unsaved changes. Are you sure you want to discard them?'
    )
    if (!answer) return
  }
  router.push('/')
}

// Handle phrases update from PhraseListManager
const handlePhrasesUpdate = (updatedPhrases: string[]) => {
  if (show.value) {
    show.value.phrases = updatedPhrases
  }
}

// Custom validator for show title (uniqueness check happens on server)
const validateShowTitle = (_value: string): string | undefined => {
  if (fieldErrors.value.showTitle) {
    // Return server-side validation error if present
    return fieldErrors.value.showTitle
  }
  return undefined
}

// Format validation errors from API
const formatValidationErrors = (errorData: any): string => {
  if (!errorData || typeof errorData !== 'object') {
    return 'Validation error occurred'
  }

  const errorMessages = Object.entries(errorData)
    .map(([field, message]) => `${field}: ${message}`)
    .join(', ')

  return errorMessages || 'Validation error occurred'
}

// Save show
const saveShow = async () => {
  if (!show.value) return

  // Clear previous errors
  error.value = null
  fieldErrors.value = {}

  try {
    // Create a plain JavaScript object copy without reactive proxies
    const plainShow = JSON.parse(JSON.stringify(show.value))
    await showService.updateShow(plainShow)
    markClean()
    router.push('/')
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 400) {
        // Validation errors - try to extract field-specific errors
        if (e.data && typeof e.data === 'object') {
          Object.keys(e.data).forEach(field => {
            if (field in fieldErrors.value) {
              ;(fieldErrors.value as any)[field] = e.data[field]
            }
          })
        }
        error.value = formatValidationErrors(e.data)
      } else if (e.status === 409) {
        // Conflict - duplicate show title
        fieldErrors.value.showTitle = 'Show title must be unique'
        error.value = e.data?.showTitle || 'Show title must be unique'
      } else if (e.status === 404) {
        error.value = 'Show not found. It may have been deleted.'
      } else {
        error.value = `Failed to save show: ${e.message}`
      }
    } else {
      error.value = 'Failed to save show. Please try again.'
    }
    console.error(e)
  }
}
</script>

<template>
  <div class="show-detail">
    <div v-if="loading" class="loading">
      <div class="loading-content">
        <h3>Loading show...</h3>
      </div>
    </div>

    <div v-else-if="error && !show" class="error">
      <div class="error-content">
        <h3>{{ error }}</h3>
      </div>
    </div>

    <div v-else class="content-container">
      <div class="header-section">
        <h2>Edit TV Show</h2>
      </div>

      <form v-if="show" class="edit-form" @submit.prevent="saveShow">
        <!-- General error message -->
        <div v-if="error" class="form-error" role="alert">
          {{ error }}
        </div>

        <!-- Show Title -->
        <FormFieldWithValidation
          id="show-title-input"
          v-model="show.showTitle"
          label="Show Title"
          :required="true"
          :max-length="VALIDATION_LIMITS.SHOW_TITLE"
          placeholder="Enter show title"
          :validator="validateShowTitle"
        />

        <!-- Game Title -->
        <FormFieldWithValidation
          id="game-title-input"
          v-model="show.gameTitle"
          label="Game Title"
          :max-length="VALIDATION_LIMITS.GAME_TITLE"
          placeholder="Enter game title (optional)"
        />

        <!-- Center Square -->
        <FormFieldWithValidation
          id="center-square-input"
          v-model="show.centerSquare"
          label="Center Square"
          :max-length="VALIDATION_LIMITS.CENTER_SQUARE"
          placeholder="Enter center square text (optional)"
        />

        <!-- Phrases -->
        <PhraseListManager
          :phrases="show.phrases"
          :allow-inline-edit="true"
          :show-bulk-add="true"
          :auto-sort="true"
          :max-phrase-length="VALIDATION_LIMITS.PHRASE"
          @update:phrases="handlePhrasesUpdate"
        />

        <!-- Action Buttons -->
        <div class="buttons">
          <button
            type="button"
            class="cancel-btn"
            aria-label="Cancel editing and return to show list"
            @click="handleCancel"
          >
            Cancel
          </button>
          <button type="submit" class="save-btn" aria-label="Save show changes">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.show-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: calc(100vh - 200px);
}

.content-container {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
  width: 100%;
}

.header-section h2 {
  margin: 0;
  color: #fff;
  font-size: 2rem;
  font-weight: 600;
}

.loading,
.error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  width: 100%;
}

.loading-content,
.error-content {
  text-align: center;
  padding: 2rem;
  background-color: #1a1a1a;
  border-radius: 8px;
  max-width: 400px;
}

.loading-content h3,
.error-content h3 {
  margin: 0;
  color: #888;
}

.edit-form {
  background-color: #1a1a1a;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid #333;
}

.form-error {
  padding: 1rem;
  margin-bottom: 1.5rem;
  background-color: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: 6px;
  color: #ff4444;
  font-size: 0.9rem;
}

.buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #333;
}

.cancel-btn,
.save-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: white;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.3s ease;
  min-width: 100px;
}

.cancel-btn {
  background-color: #444;
}

.cancel-btn:hover {
  background-color: #555;
}

.save-btn {
  background-color: #646cff;
}

.save-btn:hover {
  background-color: #535bf2;
  transform: translateY(-1px);
}

/* Responsive design */
@media (max-width: 768px) {
  .show-detail {
    padding: 1rem;
  }

  .edit-form {
    padding: 1.5rem;
  }

  .buttons {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .show-detail {
    padding: 0.5rem;
  }

  .edit-form {
    padding: 1rem;
  }

  .header-section h2 {
    font-size: 1.5rem;
  }
}
</style>
