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

// Validation state
interface FieldError {
  showTitle?: string
  gameTitle?: string
  centerSquare?: string
  newPhrase?: string
}
const fieldErrors = ref<FieldError>({})
const touched = ref<Record<string, boolean>>({})

// Character limits
const MAX_TITLE_LENGTH = 100
const MAX_GAME_TITLE_LENGTH = 100
const MAX_CENTER_SQUARE_LENGTH = 50
const MAX_PHRASE_LENGTH = 100

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
const bulkPhrases = ref('')
const showBulkAdd = ref(false)
const bulkAddErrors = ref<string[]>([])

const phraseCount = computed(() => show.value?.phrases?.length || 0)

// Sorted phrases for display
const sortedPhrases = computed(() => {
  if (!show.value?.phrases) return []

  return [...show.value.phrases]
    .map((phrase, originalIndex) => ({ phrase, originalIndex }))
    .sort((a, b) => a.phrase.localeCompare(b.phrase, undefined, { sensitivity: 'base' }))
})

// Computed character counts
const showTitleLength = computed(() => show.value?.showTitle?.length || 0)
const gameTitleLength = computed(() => show.value?.gameTitle?.length || 0)
const centerSquareLength = computed(() => show.value?.centerSquare?.length || 0)
const newPhraseLength = computed(() => newPhrase.value?.length || 0)
const bulkPhrasesLineCount = computed(() => {
  if (!bulkPhrases.value.trim()) return 0
  return bulkPhrases.value.trim().split('\n').filter(line => line.trim()).length
})

// Compute line numbers for textarea
const textareaLineNumbers = computed(() => {
  const lines = bulkPhrases.value.split('\n')
  return lines.map((_, index) => index + 1)
})

// Ref for syncing scroll between line numbers and textarea
const bulkTextareaRef = ref<HTMLTextAreaElement | null>(null)
const lineNumbersRef = ref<HTMLDivElement | null>(null)

// Sync scroll between textarea and line numbers
const syncScroll = () => {
  if (bulkTextareaRef.value && lineNumbersRef.value) {
    lineNumbersRef.value.scrollTop = bulkTextareaRef.value.scrollTop
  }
}

// Mark field as touched
const markTouched = (field: string) => {
  touched.value[field] = true
}

// Validate individual field
const validateField = (field: keyof FieldError): string | undefined => {
  if (!show.value) return undefined

  switch (field) {
    case 'showTitle':
      if (!show.value.showTitle?.trim()) {
        return 'Show title is required'
      }
      if (show.value.showTitle.length > MAX_TITLE_LENGTH) {
        return `Show title must be ${MAX_TITLE_LENGTH} characters or less`
      }
      break
    case 'gameTitle':
      if (show.value.gameTitle && show.value.gameTitle.length > MAX_GAME_TITLE_LENGTH) {
        return `Game title must be ${MAX_GAME_TITLE_LENGTH} characters or less`
      }
      break
    case 'centerSquare':
      if (show.value.centerSquare && show.value.centerSquare.length > MAX_CENTER_SQUARE_LENGTH) {
        return `Center square must be ${MAX_CENTER_SQUARE_LENGTH} characters or less`
      }
      break
    case 'newPhrase':
      if (newPhrase.value && newPhrase.value.length > MAX_PHRASE_LENGTH) {
        return `Phrase must be ${MAX_PHRASE_LENGTH} characters or less`
      }
      break
  }
  return undefined
}

// Validate all fields
const validateForm = (): boolean => {
  fieldErrors.value = {}

  // Validate each field
  const showTitleError = validateField('showTitle')
  const gameTitleError = validateField('gameTitle')
  const centerSquareError = validateField('centerSquare')

  if (showTitleError) fieldErrors.value.showTitle = showTitleError
  if (gameTitleError) fieldErrors.value.gameTitle = gameTitleError
  if (centerSquareError) fieldErrors.value.centerSquare = centerSquareError

  return Object.keys(fieldErrors.value).length === 0
}

// Update field errors on input
const onFieldInput = (field: keyof FieldError) => {
  if (touched.value[field]) {
    const error = validateField(field)
    if (error) {
      fieldErrors.value[field] = error
    } else {
      delete fieldErrors.value[field]
    }
  }
}

const addPhrase = async () => {
  if (!show.value || !newPhrase.value.trim()) return

  // Validate the new phrase
  markTouched('newPhrase')
  const error = validateField('newPhrase')
  if (error) {
    fieldErrors.value.newPhrase = error
    return
  }

  const trimmedPhrase = newPhrase.value.trim()
  show.value.phrases.push(trimmedPhrase)
  newPhrase.value = ''
  delete fieldErrors.value.newPhrase
  touched.value.newPhrase = false

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

const addBulkPhrases = async () => {
  if (!show.value || !bulkPhrases.value.trim()) return

  bulkAddErrors.value = []
  const lines = bulkPhrases.value.split('\n')
  const addedPhrases: string[] = []
  const errors: string[] = []

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) return

    // Validate length
    if (trimmed.length > MAX_PHRASE_LENGTH) {
      errors.push(`Line ${index + 1}: "${trimmed.substring(0, 30)}..." is too long (${trimmed.length}/${MAX_PHRASE_LENGTH} chars)`)
      return
    }

    // Add valid phrases
    addedPhrases.push(trimmed)
  })

  // Add all valid phrases
  if (addedPhrases.length > 0) {
    show.value.phrases.push(...addedPhrases)

    // Highlight the first added phrase and scroll to it
    if (addedPhrases.length > 0) {
      highlightedPhrase.value = addedPhrases[0]
      await nextTick()
      scrollToPhrase(addedPhrases[0])

      setTimeout(() => {
        highlightedPhrase.value = null
      }, 2000)
    }
  }

  // Show errors if any
  if (errors.length > 0) {
    bulkAddErrors.value = errors
  } else {
    // Clear textarea on success
    bulkPhrases.value = ''
    showBulkAdd.value = false
  }
}

const toggleBulkAdd = () => {
  showBulkAdd.value = !showBulkAdd.value
  bulkAddErrors.value = []
  if (!showBulkAdd.value) {
    bulkPhrases.value = ''
  }
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

  // Mark all fields as touched
  touched.value = {
    showTitle: true,
    gameTitle: true,
    centerSquare: true
  }

  // Validate form
  if (!validateForm()) {
    error.value = 'Please fix the validation errors before saving'
    return
  }

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
        // Validation errors - try to extract field-specific errors
        if (e.data && typeof e.data === 'object') {
          Object.keys(e.data).forEach(field => {
            if (field in fieldErrors.value) {
              (fieldErrors.value as any)[field] = e.data[field]
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
          <div class="label-row">
            <label for="show-title-input">
              Show Title:
              <span class="required-indicator">*</span>
            </label>
            <span class="char-counter" :class="{ 'over-limit': showTitleLength > MAX_TITLE_LENGTH }">
              {{ showTitleLength }} / {{ MAX_TITLE_LENGTH }}
            </span>
          </div>
          <input
            id="show-title-input"
            v-model="show.showTitle"
            required
            :class="{ 'has-error': touched.showTitle && fieldErrors.showTitle }"
            @blur="markTouched('showTitle'); onFieldInput('showTitle')"
            @input="onFieldInput('showTitle')"
            aria-required="true"
            :aria-invalid="touched.showTitle && !!fieldErrors.showTitle"
            aria-describedby="show-title-error"
          />
          <div v-if="touched.showTitle && fieldErrors.showTitle" id="show-title-error" class="field-error" role="alert">
            {{ fieldErrors.showTitle }}
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label for="game-title-input">Game Title:</label>
            <span class="char-counter" :class="{ 'over-limit': gameTitleLength > MAX_GAME_TITLE_LENGTH }">
              {{ gameTitleLength }} / {{ MAX_GAME_TITLE_LENGTH }}
            </span>
          </div>
          <input
            id="game-title-input"
            v-model="show.gameTitle"
            :class="{ 'has-error': touched.gameTitle && fieldErrors.gameTitle }"
            @blur="markTouched('gameTitle'); onFieldInput('gameTitle')"
            @input="onFieldInput('gameTitle')"
            :aria-invalid="touched.gameTitle && !!fieldErrors.gameTitle"
            aria-describedby="game-title-error"
          />
          <div v-if="touched.gameTitle && fieldErrors.gameTitle" id="game-title-error" class="field-error" role="alert">
            {{ fieldErrors.gameTitle }}
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label for="center-square-input">Center Square:</label>
            <span class="char-counter" :class="{ 'over-limit': centerSquareLength > MAX_CENTER_SQUARE_LENGTH }">
              {{ centerSquareLength }} / {{ MAX_CENTER_SQUARE_LENGTH }}
            </span>
          </div>
          <input
            id="center-square-input"
            v-model="show.centerSquare"
            :class="{ 'has-error': touched.centerSquare && fieldErrors.centerSquare }"
            @blur="markTouched('centerSquare'); onFieldInput('centerSquare')"
            @input="onFieldInput('centerSquare')"
            :aria-invalid="touched.centerSquare && !!fieldErrors.centerSquare"
            aria-describedby="center-square-error"
          />
          <div v-if="touched.centerSquare && fieldErrors.centerSquare" id="center-square-error" class="field-error" role="alert">
            {{ fieldErrors.centerSquare }}
          </div>
        </div>

        <!-- Add Phrase Section -->
        <div class="form-group add-phrase-section">
            <div class="label-row">
              <label for="new-phrase-input">Add New Phrase:</label>
              <span class="char-counter" :class="{ 'over-limit': newPhraseLength > MAX_PHRASE_LENGTH }">
                {{ newPhraseLength }} / {{ MAX_PHRASE_LENGTH }}
              </span>
            </div>
            <div class="add-phrase">
              <input
                id="new-phrase-input"
                v-model="newPhrase"
                placeholder="New phrase"
                :class="{ 'has-error': touched.newPhrase && fieldErrors.newPhrase }"
                @keydown.enter.prevent="addPhrase"
                @blur="markTouched('newPhrase'); onFieldInput('newPhrase')"
                @input="onFieldInput('newPhrase')"
                :aria-invalid="touched.newPhrase && !!fieldErrors.newPhrase"
                aria-describedby="new-phrase-error"
              />
              <button type="button" @click="addPhrase" aria-label="Add new phrase">Add</button>
            </div>
            <div v-if="touched.newPhrase && fieldErrors.newPhrase" id="new-phrase-error" class="field-error" role="alert">
              {{ fieldErrors.newPhrase }}
            </div>

            <!-- Bulk Add Section -->
            <div class="bulk-add-section">
              <button
                type="button"
                @click="toggleBulkAdd"
                class="bulk-toggle-btn"
                aria-label="Toggle bulk add mode"
              >
                {{ showBulkAdd ? '− Hide Bulk Add' : '+ Bulk Add' }}
              </button>

              <div v-if="showBulkAdd" class="bulk-add-container">
                <div class="label-row">
                  <label for="bulk-phrases-input">Paste Phrases (one per line):</label>
                  <span class="char-counter">
                    {{ bulkPhrasesLineCount }} {{ bulkPhrasesLineCount === 1 ? 'phrase' : 'phrases' }}
                  </span>
                </div>
                <div class="textarea-with-lines">
                  <div class="line-numbers" ref="lineNumbersRef" aria-hidden="true">
                    <div v-for="lineNum in textareaLineNumbers" :key="lineNum" class="line-number">
                      {{ lineNum }}
                    </div>
                  </div>
                  <textarea
                    id="bulk-phrases-input"
                    ref="bulkTextareaRef"
                    v-model="bulkPhrases"
                    placeholder="Paste multiple phrases here, one per line..."
                    rows="8"
                    aria-describedby="bulk-add-help"
                    @scroll="syncScroll"
                  ></textarea>
                </div>
                <div id="bulk-add-help" class="help-text">
                  Paste or type multiple phrases, one per line. Empty lines will be skipped. Max {{ MAX_PHRASE_LENGTH }} characters per phrase.
                </div>
                <div v-if="bulkAddErrors.length > 0" class="bulk-errors">
                  <div class="field-error" role="alert" v-for="(error, index) in bulkAddErrors" :key="index">
                    {{ error }}
                  </div>
                </div>
                <div class="bulk-actions">
                  <button
                    type="button"
                    @click="toggleBulkAdd"
                    class="cancel-bulk-btn"
                    aria-label="Cancel bulk add"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    @click="addBulkPhrases"
                    class="add-bulk-btn"
                    :disabled="!bulkPhrases.trim()"
                    aria-label="Add all phrases"
                  >
                    Add All ({{ bulkPhrasesLineCount }})
                  </button>
                </div>
              </div>
            </div>
        </div>

        <!-- Phrases List Section -->
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
                  :aria-label="`Edit phrase: ${show.phrases[originalIndex]}`"
                />
              </template>
              <!-- Display mode -->
              <template v-else>
                <span class="phrase-text" @click="startEdit(originalIndex)" title="Click to edit">{{ phrase }}</span>
                <button
                  type="button"
                  @click="removePhrase(originalIndex)"
                  class="remove-btn"
                  :aria-label="`Remove phrase: ${phrase}`"
                >×</button>
              </template>
            </div>
          </div>
        </div>

        <div class="buttons">
          <button type="button" @click="handleCancel" class="cancel-btn" aria-label="Cancel editing and return to show list">Cancel</button>
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

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

label {
  color: #888;
  font-weight: 500;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.required-indicator {
  color: #ff4444;
  margin-left: 0.25rem;
  font-weight: bold;
}

.char-counter {
  color: #666;
  font-size: 0.85rem;
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
}

.char-counter.over-limit {
  color: #ff4444;
  font-weight: 600;
}

.field-error {
  color: #ff4444;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.field-error::before {
  content: '⚠';
  font-size: 1rem;
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

input.has-error {
  border-color: #ff4444;
}

input.has-error:focus {
  border-color: #ff4444;
  box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.2);
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

.add-phrase-section {
  /* No special styling needed - uses standard form-group styles */
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

.bulk-add-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #333;
}

.bulk-toggle-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #2c2c2c;
  color: #888;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  text-align: center;
}

.bulk-toggle-btn:hover {
  background-color: #333;
  color: #aaa;
  border-color: #555;
}

.bulk-add-container {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #222;
  border-radius: 6px;
  border: 1px solid #444;
}

.textarea-with-lines {
  display: flex;
  border: 1px solid #444;
  border-radius: 6px;
  background-color: #2c2c2c;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.textarea-with-lines:focus-within {
  border-color: #646cff;
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.2);
}

.line-numbers {
  padding: 0.75rem 0.5rem 0.75rem 0.75rem;
  background-color: #222;
  color: #666;
  font-size: 0.95rem;
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.5;
  text-align: right;
  user-select: none;
  overflow: hidden;
  border-right: 1px solid #444;
  min-width: 2.5rem;
}

.line-number {
  height: 1.5em;
  white-space: nowrap;
}

textarea {
  flex: 1;
  width: 100%;
  padding: 0.75rem;
  background-color: transparent;
  border: none;
  color: #fff;
  font-size: 0.95rem;
  font-family: 'Courier New', Courier, monospace;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.5;
  outline: none;
}

textarea::placeholder {
  font-family: inherit;
}

.help-text {
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  line-height: 1.4;
}

.bulk-errors {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: rgba(255, 68, 68, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(255, 68, 68, 0.3);
}

.bulk-errors .field-error {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

.bulk-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  justify-content: flex-end;
}

.cancel-bulk-btn,
.add-bulk-btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel-bulk-btn {
  background-color: #444;
  color: white;
}

.cancel-bulk-btn:hover {
  background-color: #555;
}

.add-bulk-btn {
  background-color: #646cff;
  color: white;
}

.add-bulk-btn:hover:not(:disabled) {
  background-color: #535bf2;
}

.add-bulk-btn:disabled {
  background-color: #333;
  color: #666;
  cursor: not-allowed;
  opacity: 0.6;
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