<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { VALIDATION_LIMITS } from '../../constants/formValidation'

interface Props {
  phrases: string[]
  allowInlineEdit?: boolean
  showBulkAdd?: boolean
  autoSort?: boolean
  maxPhraseLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  allowInlineEdit: true,
  showBulkAdd: true,
  autoSort: true,
  maxPhraseLength: VALIDATION_LIMITS.PHRASE
})

const emit = defineEmits<{
  'update:phrases': [phrases: string[]]
  'phrases-changed': []
}>()

// Single phrase add
const newPhrase = ref('')
const newPhraseTouched = ref(false)
const newPhraseError = ref<string | undefined>(undefined)

// Bulk add
const bulkPhrases = ref('')
const showBulkAddInterface = ref(false)
const bulkAddErrors = ref<string[]>([])

// Inline editing
const editingIndex = ref<number | null>(null)
const editingValue = ref('')

// Highlight and scroll
const highlightedPhrase = ref<string | null>(null)
const phrasesListRef = ref<HTMLElement | null>(null)

// Bulk textarea refs
const bulkTextareaRef = ref<HTMLTextAreaElement | null>(null)
const lineNumbersRef = ref<HTMLDivElement | null>(null)

// Computed: phrase count
const phraseCount = computed(() => props.phrases.length)

// Computed: sorted phrases for display
const sortedPhrases = computed(() => {
  if (!props.autoSort) {
    return props.phrases.map((phrase, originalIndex) => ({ phrase, originalIndex }))
  }

  return [...props.phrases]
    .map((phrase, originalIndex) => ({ phrase, originalIndex }))
    .sort((a, b) => a.phrase.localeCompare(b.phrase, undefined, { sensitivity: 'base' }))
})

// Computed: character count for new phrase
const newPhraseLength = computed(() => newPhrase.value?.length || 0)

// Computed: bulk phrases line count
const bulkPhrasesLineCount = computed(() => {
  if (!bulkPhrases.value.trim()) return 0
  return bulkPhrases.value.trim().split('\n').filter(line => line.trim()).length
})

// Computed: line numbers for textarea
const textareaLineNumbers = computed(() => {
  const lines = bulkPhrases.value.split('\n')
  return lines.map((_, index) => index + 1)
})

// Validate new phrase
const validateNewPhrase = (): string | undefined => {
  if (newPhrase.value && newPhrase.value.length > props.maxPhraseLength) {
    return `Phrase must be ${props.maxPhraseLength} characters or less`
  }
  return undefined
}

// Add single phrase
const addPhrase = async () => {
  if (!newPhrase.value.trim()) return

  // Validate
  newPhraseTouched.value = true
  newPhraseError.value = validateNewPhrase()
  if (newPhraseError.value) return

  const trimmedPhrase = newPhrase.value.trim()
  const updatedPhrases = [...props.phrases, trimmedPhrase]
  emit('update:phrases', updatedPhrases)
  emit('phrases-changed')

  // Clear input
  newPhrase.value = ''
  newPhraseError.value = undefined
  newPhraseTouched.value = false

  // Highlight and scroll
  highlightedPhrase.value = trimmedPhrase
  await nextTick()
  scrollToPhrase(trimmedPhrase)

  setTimeout(() => {
    highlightedPhrase.value = null
  }, 2000)
}

// Add bulk phrases
const addBulkPhrases = async () => {
  if (!bulkPhrases.value.trim()) return

  bulkAddErrors.value = []
  const lines = bulkPhrases.value.split('\n')
  const addedPhrases: string[] = []
  const errors: string[] = []

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) return

    // Validate length
    if (trimmed.length > props.maxPhraseLength) {
      errors.push(
        `Line ${index + 1}: "${trimmed.substring(0, 30)}..." is too long (${trimmed.length}/${props.maxPhraseLength} chars)`
      )
      return
    }

    addedPhrases.push(trimmed)
  })

  // Add all valid phrases
  if (addedPhrases.length > 0) {
    const updatedPhrases = [...props.phrases, ...addedPhrases]
    emit('update:phrases', updatedPhrases)
    emit('phrases-changed')

    // Highlight first added phrase
    if (addedPhrases.length > 0) {
      highlightedPhrase.value = addedPhrases[0]
      await nextTick()
      scrollToPhrase(addedPhrases[0])

      setTimeout(() => {
        highlightedPhrase.value = null
      }, 2000)
    }
  }

  // Show errors or clear on success
  if (errors.length > 0) {
    bulkAddErrors.value = errors
  } else {
    bulkPhrases.value = ''
    showBulkAddInterface.value = false
  }
}

// Toggle bulk add
const toggleBulkAdd = () => {
  showBulkAddInterface.value = !showBulkAddInterface.value
  bulkAddErrors.value = []
  if (!showBulkAddInterface.value) {
    bulkPhrases.value = ''
  }
}

// Scroll to phrase
const scrollToPhrase = (phrase: string) => {
  if (!phrasesListRef.value) return

  const phraseElements = phrasesListRef.value.querySelectorAll('.phrase-item')
  const sortedIndex = sortedPhrases.value.findIndex(p => p.phrase === phrase)

  if (sortedIndex >= 0 && phraseElements[sortedIndex]) {
    phraseElements[sortedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

// Remove phrase
const removePhrase = (index: number) => {
  const phrase = props.phrases[index]
  const confirmed = window.confirm(`Remove phrase "${phrase}"?`)

  if (!confirmed) return

  // If editing this phrase, cancel edit first
  if (editingIndex.value === index) {
    cancelEdit()
  } else if (editingIndex.value !== null && editingIndex.value > index) {
    editingIndex.value--
  }

  const updatedPhrases = props.phrases.filter((_, i) => i !== index)
  emit('update:phrases', updatedPhrases)
  emit('phrases-changed')
}

// Inline editing functions
const startEdit = (index: number) => {
  if (!props.allowInlineEdit) return
  editingIndex.value = index
  editingValue.value = props.phrases[index]
}

const saveEdit = () => {
  if (editingIndex.value === null) return

  const trimmedValue = editingValue.value.trim()
  if (trimmedValue) {
    const updatedPhrases = [...props.phrases]
    updatedPhrases[editingIndex.value] = trimmedValue
    emit('update:phrases', updatedPhrases)
    emit('phrases-changed')
  }
  cancelEdit()
}

const cancelEdit = () => {
  editingIndex.value = null
  editingValue.value = ''
}

// Sync scroll between textarea and line numbers
const syncScroll = () => {
  if (bulkTextareaRef.value && lineNumbersRef.value) {
    lineNumbersRef.value.scrollTop = bulkTextareaRef.value.scrollTop
  }
}

// Handle input on new phrase
const onNewPhraseInput = () => {
  if (newPhraseTouched.value) {
    newPhraseError.value = validateNewPhrase()
  }
}
</script>

<template>
  <div class="phrase-list-manager">
    <!-- Add Single Phrase Section -->
    <div class="add-phrase-section">
      <div class="label-row">
        <label for="new-phrase-input">Add New Phrase:</label>
        <span class="char-counter" :class="{ 'over-limit': newPhraseLength > maxPhraseLength }">
          {{ newPhraseLength }} / {{ maxPhraseLength }}
        </span>
      </div>
      <div class="add-phrase">
        <input
          id="new-phrase-input"
          v-model="newPhrase"
          placeholder="New phrase"
          :class="{ 'has-error': newPhraseTouched && newPhraseError }"
          @keydown.enter.prevent="addPhrase"
          @blur="newPhraseTouched = true; onNewPhraseInput()"
          @input="onNewPhraseInput"
          :aria-invalid="newPhraseTouched && !!newPhraseError"
          :aria-describedby="newPhraseTouched && newPhraseError ? 'new-phrase-error' : undefined"
        />
        <button type="button" @click="addPhrase" aria-label="Add new phrase">Add</button>
      </div>
      <div
        v-if="newPhraseTouched && newPhraseError"
        id="new-phrase-error"
        class="field-error"
        role="alert"
      >
        {{ newPhraseError }}
      </div>

      <!-- Bulk Add Section -->
      <div v-if="showBulkAdd" class="bulk-add-section">
        <button
          type="button"
          @click="toggleBulkAdd"
          class="bulk-toggle-btn"
          aria-label="Toggle bulk add mode"
        >
          {{ showBulkAddInterface ? '− Hide Bulk Add' : '+ Bulk Add' }}
        </button>

        <div v-if="showBulkAddInterface" class="bulk-add-container">
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
            Paste or type multiple phrases, one per line. Empty lines will be skipped. Max
            {{ maxPhraseLength }} characters per phrase.
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
    <div class="phrases-list-section">
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
          <template v-if="allowInlineEdit && editingIndex === originalIndex">
            <input
              v-model="editingValue"
              class="edit-input"
              @keydown.enter="saveEdit"
              @keydown.escape="cancelEdit"
              @blur="saveEdit"
              autofocus
              :aria-label="`Edit phrase: ${phrases[originalIndex]}`"
            />
          </template>
          <!-- Display mode -->
          <template v-else>
            <span
              class="phrase-text"
              :class="{ 'editable': allowInlineEdit }"
              @click="startEdit(originalIndex)"
              :title="allowInlineEdit ? 'Click to edit' : ''"
            >
              {{ phrase }}
            </span>
            <button
              type="button"
              @click="removePhrase(originalIndex)"
              class="remove-btn"
              :aria-label="`Remove phrase: ${phrase}`"
            >
              ×
            </button>
          </template>
        </div>
        <div v-if="phraseCount === 0" class="empty-state">
          No phrases yet. Add some above!
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.phrase-list-manager {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Add Phrase Section */
.add-phrase-section {
  /* Inherits form-group styles */
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

.add-phrase {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.add-phrase input {
  flex: 1;
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

.add-phrase input:focus {
  outline: none;
  border-color: #646cff;
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.2);
}

.add-phrase input.has-error {
  border-color: #ff4444;
}

.add-phrase input.has-error:focus {
  border-color: #ff4444;
  box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.2);
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

/* Bulk Add Section */
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

/* Phrases List Section */
.phrases-list-section {
  /* Inherits form-group styles */
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
  0%,
  100% {
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
  padding: 0.25rem;
  margin: -0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.phrase-text.editable {
  cursor: pointer;
}

.phrase-text.editable:hover {
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

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #666;
  font-style: italic;
}

/* Responsive design */
@media (max-width: 768px) {
  .add-phrase {
    flex-direction: column;
  }

  .add-phrase button {
    width: 100%;
  }
}
</style>
