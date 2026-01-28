<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CreateShowInput } from '../types/Show'
import { useUnsavedChangesGuard } from '../composables/useUnsavedChangesGuard'
import FormFieldWithValidation from './common/FormFieldWithValidation.vue'
import PhraseListManager from './common/PhraseListManager.vue'
import { VALIDATION_LIMITS } from '../constants/formValidation'

const emit = defineEmits<{
  (e: 'showCreated', show: CreateShowInput): void
}>()

// Form data
const showTitle = ref('')
const gameTitle = ref('')
const centerSquare = ref('')
const phrases = ref<string[]>([])

// Original data for tracking changes
const originalData = ref({
  showTitle: '',
  gameTitle: '',
  centerSquare: '',
  phrases: [] as string[]
})

// Current data computed
const currentData = computed(() => ({
  showTitle: showTitle.value,
  gameTitle: gameTitle.value,
  centerSquare: centerSquare.value,
  phrases: phrases.value
}))

// Unsaved changes guard
const { hasUnsavedChanges, setupGuards } = useUnsavedChangesGuard(
  originalData,
  currentData
)

setupGuards()

// Handle phrases update from PhraseListManager
const handlePhrasesUpdate = (updatedPhrases: string[]) => {
  phrases.value = updatedPhrases
}

// Validation state
const showTitleError = ref<string | undefined>(undefined)

// Custom validator for show title
const validateShowTitle = (value: string): string | undefined => {
  if (!value.trim()) {
    return 'Show title is required'
  }
  return undefined
}

// Create show
const createShow = () => {
  // Validate show title
  showTitleError.value = validateShowTitle(showTitle.value)
  if (showTitleError.value) {
    return
  }

  // Validate that we have at least one phrase
  if (phrases.value.length === 0) {
    return
  }

  const newShow: CreateShowInput = {
    showTitle: showTitle.value,
    phrases: phrases.value
  }

  if (gameTitle.value) {
    newShow.gameTitle = gameTitle.value
  }

  if (centerSquare.value) {
    newShow.centerSquare = centerSquare.value
  }

  emit('showCreated', newShow)

  // Note: We don't reset the form here - the parent will navigate away on success
}

// Cancel and go back
const handleCancel = () => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm('You have unsaved changes. Are you sure you want to discard them?')
    if (!answer) return
  }
  // Navigate back by emitting an event or using router directly
  window.history.back()
}
</script>

<template>
  <div class="create-show-container">
    <form @submit.prevent="createShow" class="create-form">
      <!-- Show Title -->
      <FormFieldWithValidation
        v-model="showTitle"
        id="show-title-input"
        label="Show Title"
        :required="true"
        :max-length="VALIDATION_LIMITS.SHOW_TITLE"
        placeholder="Enter show title"
        :validator="validateShowTitle"
      />

      <!-- Game Title -->
      <FormFieldWithValidation
        v-model="gameTitle"
        id="game-title-input"
        label="Game Title"
        :max-length="VALIDATION_LIMITS.GAME_TITLE"
        placeholder="Enter game title (optional)"
      />

      <!-- Center Square -->
      <FormFieldWithValidation
        v-model="centerSquare"
        id="center-square-input"
        label="Center Square"
        :max-length="VALIDATION_LIMITS.CENTER_SQUARE"
        placeholder="Enter center square text (optional)"
      />

      <!-- Phrases -->
      <PhraseListManager
        :phrases="phrases"
        @update:phrases="handlePhrasesUpdate"
        :allow-inline-edit="true"
        :show-bulk-add="true"
        :auto-sort="true"
        :max-phrase-length="VALIDATION_LIMITS.PHRASE"
      />

      <!-- Validation message for phrases -->
      <div v-if="phrases.length === 0" class="phrases-help">
        Add at least one phrase to create the show.
      </div>

      <!-- Action Buttons -->
      <div class="buttons">
        <button type="button" @click="handleCancel" class="cancel-btn" aria-label="Cancel and return">
          Cancel
        </button>
        <button
          type="submit"
          class="submit-btn"
          :disabled="!showTitle.trim() || phrases.length === 0"
          aria-label="Create show"
        >
          Create Show
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.create-show-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.create-form {
  background-color: #1a1a1a;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid #333;
}

.phrases-help {
  color: #888;
  font-size: 0.9rem;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  font-style: italic;
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
.submit-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: white;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.3s ease;
  min-width: 120px;
}

.cancel-btn {
  background-color: #444;
}

.cancel-btn:hover {
  background-color: #555;
}

.submit-btn {
  background-color: #646cff;
}

.submit-btn:hover:not(:disabled) {
  background-color: #535bf2;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background-color: #333;
  color: #666;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Responsive design */
@media (max-width: 768px) {
  .create-form {
    padding: 1.5rem;
  }

  .buttons {
    flex-direction: column;
  }

  .cancel-btn,
  .submit-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .create-form {
    padding: 1rem;
  }
}
</style>
