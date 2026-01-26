<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import type { Show } from '../types/Show'
import { showService } from '../services/showService'
import { ApiError } from '../services/apiClient'

const props = defineProps<{
  id: string
}>()

const router = useRouter()
const show = ref<Show | null>(null)
const originalShow = ref<string>('')  // JSON string for comparison
const loading = ref(true)
const error = ref<string | null>(null)

// Inline editing state
const editingIndex = ref<number | null>(null)
const editingValue = ref('')

// Highlight newly added phrase
const highlightedPhrase = ref<string | null>(null)
const phrasesListRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  try {
    const loadedShow = await showService.getShowById(parseInt(props.id))
    if (loadedShow) {
      show.value = { ...loadedShow }
      originalShow.value = JSON.stringify(loadedShow)
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

  // Add beforeunload handler for browser navigation
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// Check if there are unsaved changes
const hasUnsavedChanges = computed(() => {
  if (!show.value) return false
  return JSON.stringify(show.value) !== originalShow.value
})

// Browser beforeunload handler
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (hasUnsavedChanges.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

// Vue Router navigation guard
onBeforeRouteLeave(() => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm('You have unsaved changes. Are you sure you want to leave?')
    if (!answer) return false
  }
})

// Cancel with confirmation
const handleCancel = () => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm('You have unsaved changes. Are you sure you want to discard them?')
    if (!answer) return
  }
  router.push('/')
}

const newPhrase = ref('')

const phraseCount = computed(() => show.value?.phrases?.length || 0)

// Sorted phrases for display
const sortedPhrases = computed(() => {
  if (!show.value?.phrases) return []

  return [...show.value.phrases]
    .map((phrase, originalIndex) => ({ phrase, originalIndex }))
    .sort((a, b) => a.phrase.localeCompare(b.phrase, undefined, { sensitivity: 'base' }))
})

const addPhrase = async () => {
  if (!show.value || !newPhrase.value.trim()) return

  const trimmedPhrase = newPhrase.value.trim()
  show.value.phrases.push(trimmedPhrase)
  newPhrase.value = ''

  // Highlight the newly added phrase
  highlightedPhrase.value = trimmedPhrase

  // Scroll to the phrase in the sorted list
  await nextTick()
  scrollToPhrase(trimmedPhrase)

  // Remove highlight after animation
  setTimeout(() => {
    highlightedPhrase.value = null
  }, 2000)
}

const scrollToPhrase = (phrase: string) => {
  if (!phrasesListRef.value) return

  const phraseElements = phrasesListRef.value.querySelectorAll('.phrase-item')
  const sortedIndex = sortedPhrases.value.findIndex(p => p.phrase === phrase)

  if (sortedIndex >= 0 && phraseElements[sortedIndex]) {
    phraseElements[sortedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

const removePhrase = (index: number) => {
  if (!show.value) return

  const phrase = show.value.phrases[index]
  const confirmed = window.confirm(`Remove phrase "${phrase}"?`)

  if (!confirmed) return

  // If we're editing this phrase, cancel edit first
  if (editingIndex.value === index) {
    cancelEdit()
  } else if (editingIndex.value !== null && editingIndex.value > index) {
    // Adjust editing index if removing a phrase before it
    editingIndex.value--
  }

  show.value.phrases.splice(index, 1)
}

// Inline editing functions
const startEdit = (index: number) => {
  if (!show.value) return
  editingIndex.value = index
  editingValue.value = show.value.phrases[index]
}

const saveEdit = () => {
  if (!show.value || editingIndex.value === null) return

  const trimmedValue = editingValue.value.trim()
  if (trimmedValue) {
    show.value.phrases[editingIndex.value] = trimmedValue
  }
  cancelEdit()
}

const cancelEdit = () => {
  editingIndex.value = null
  editingValue.value = ''
}

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

const saveShow = async () => {
  if (!show.value) return
  
  error.value = null
  try {
    // Create a plain JavaScript object copy without reactive proxies
    const plainShow = JSON.parse(JSON.stringify(show.value))
    await showService.updateShow(plainShow)
    originalShow.value = JSON.stringify(show.value)  // Mark as clean after save
    router.push('/')
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 400) {
        // Validation errors - show field-specific messages
        error.value = formatValidationErrors(e.data)
      } else if (e.status === 409) {
        // Conflict - duplicate show title
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

    <div v-else-if="error" class="error">
      <div class="error-content">
        <h3>{{ error }}</h3>
      </div>
    </div>

    <div v-else class="content-container">
      <div class="header-section">
        <h2>Edit TV Show</h2>
      </div>
      
      <form v-if="show" @submit.prevent="saveShow" class="edit-form">
        <div class="form-group">
          <label>Show Title:</label>
          <input v-model="show.showTitle" required />
        </div>
        
        <div class="form-group">
          <label>Game Title:</label>
          <input v-model="show.gameTitle" />
        </div>
        
        <div class="form-group">
          <label>Center Square:</label>
          <input v-model="show.centerSquare" />
        </div>

        <div class="form-group">
          <label>Phrases ({{ phraseCount }}):</label>
          <div class="phrases-list" ref="phrasesListRef">
            <div
              v-for="({ phrase, originalIndex }, sortedIndex) in sortedPhrases"
              :key="originalIndex"
              class="phrase-item"
              :class="{ 'phrase-highlighted': phrase === highlightedPhrase }"
            >
              <span class="phrase-number">{{ sortedIndex + 1 }}.</span>
              <!-- Edit mode -->
              <template v-if="editingIndex === originalIndex">
                <input
                  v-model="editingValue"
                  class="edit-input"
                  @keydown.enter="saveEdit"
                  @keydown.escape="cancelEdit"
                  @blur="saveEdit"
                  ref="editInput"
                  autofocus
                />
              </template>
              <!-- Display mode -->
              <template v-else>
                <span class="phrase-text" @click="startEdit(originalIndex)" title="Click to edit">{{ phrase }}</span>
                <button type="button" @click="removePhrase(originalIndex)" class="remove-btn">×</button>
              </template>
            </div>
          </div>
          <div class="add-phrase">
            <input
              v-model="newPhrase"
              placeholder="New phrase"
              @keydown.enter.prevent="addPhrase"
            />
            <button type="button" @click="addPhrase">Add</button>
          </div>
        </div>

        <div class="buttons">
          <button type="button" @click="handleCancel" class="cancel-btn">Cancel</button>
          <button type="submit" class="save-btn">Save</button>
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

.loading, .error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  width: 100%;
}

.loading-content, .error-content {
  text-align: center;
  padding: 2rem;
  background-color: #1a1a1a;
  border-radius: 8px;
  max-width: 400px;
}

.loading-content h3, .error-content h3 {
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

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #888;
  font-weight: 500;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

input {
  width: 100%;
  padding: 0.75rem;
  background-color: #2c2c2c;
  border: 1px solid #444;
  border-radius: 6px;
  color: #fff;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #646cff;
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.2);
}

.phrases-list {
  margin: 1rem 0;
}

.phrase-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #2c2c2c;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  border: 1px solid #444;
  transition: background-color 0.3s ease;
}

.phrase-number {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
  min-width: 2rem;
  text-align: right;
  user-select: none;
}

.phrase-item:hover {
  background-color: #333;
}

.phrase-highlighted {
  animation: highlight-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {
  0%, 100% {
    background-color: #2c2c2c;
    border-color: #444;
  }
  50% {
    background-color: rgba(100, 108, 255, 0.2);
    border-color: #646cff;
  }
}

.phrase-text {
  flex: 1;
  color: #fff;
  cursor: pointer;
  padding: 0.25rem;
  margin: -0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.phrase-text:hover {
  background-color: rgba(100, 108, 255, 0.15);
}

.edit-input {
  flex: 1;
  padding: 0.25rem 0.5rem;
  background-color: #1a1a1a;
  border: 2px solid #646cff;
  border-radius: 4px;
  color: #fff;
  font-size: inherit;
  outline: none;
}

.remove-btn {
  background: none;
  border: none;
  color: #ff4444;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.remove-btn:hover {
  background-color: rgba(255, 68, 68, 0.1);
}

.add-phrase {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.add-phrase input {
  flex: 1;
}

.add-phrase button {
  padding: 0.75rem 1rem;
  background-color: #646cff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
  white-space: nowrap;
}

.add-phrase button:hover {
  background-color: #535bf2;
}

.buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #333;
}

.cancel-btn, .save-btn {
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
  
  .add-phrase {
    flex-direction: column;
  }
  
  .add-phrase button {
    width: 100%;
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