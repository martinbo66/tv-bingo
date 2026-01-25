<script setup lang="ts">
import { ref } from 'vue'
import type { CreateShowInput } from '../types/Show'

const emit = defineEmits<{
  (e: 'showCreated', show: CreateShowInput): void
}>()

const showTitle = ref('')
const gameTitle = ref('')
const centerSquare = ref('')
const phrases = ref<string[]>([''])

const addPhrase = () => {
  phrases.value.push('')
}

const removePhrase = (index: number) => {
  phrases.value.splice(index, 1)
}

const createShow = () => {
  if (!showTitle.value || phrases.value.length === 0) return

  const newShow: CreateShowInput = {
    showTitle: showTitle.value,
    phrases: phrases.value.filter(phrase => phrase.trim() !== '')
  }

  if (gameTitle.value) {
    newShow.gameTitle = gameTitle.value
  }

  if (centerSquare.value) {
    newShow.centerSquare = centerSquare.value
  }

  emit('showCreated', newShow)
  
  // Reset form
  showTitle.value = ''
  gameTitle.value = ''
  centerSquare.value = ''
  phrases.value = ['']
}
</script>

<template>
  <div class="create-show-form">
    <h3>Add New TV Show</h3>
    <form @submit.prevent="createShow">
      <div class="form-group">
        <label for="showTitle">Show Title*</label>
        <input 
          id="showTitle"
          v-model="showTitle"
          type="text"
          required
          placeholder="Enter show title"
        >
      </div>

      <div class="form-group">
        <label for="gameTitle">Game Title (Optional)</label>
        <input 
          id="gameTitle"
          v-model="gameTitle"
          type="text"
          placeholder="Enter alternate game title"
        >
      </div>

      <div class="form-group">
        <label for="centerSquare">Center Square (Optional)</label>
        <input 
          id="centerSquare"
          v-model="centerSquare"
          type="text"
          placeholder="Enter center square personality"
        >
      </div>

      <div class="form-group">
        <label>Phrases*</label>
        <div 
          v-for="index in phrases.length" 
          :key="index-1"
          class="phrase-input"
        >
          <input 
            v-model="phrases[index-1]"
            type="text"
            required
            placeholder="Enter a phrase"
          >
          <button 
            type="button" 
            class="remove-phrase"
            @click="removePhrase(index-1)"
            :disabled="phrases.length === 1"
          >
            Remove
          </button>
        </div>
        <button type="button" class="add-phrase" @click="addPhrase">
          Add Phrase
        </button>
      </div>

      <button type="submit" class="submit-button">Create Show</button>
    </form>
  </div>
</template>

<style scoped>
.create-show-form {
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #888;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #333;
  border-radius: 4px;
  background-color: #242424;
  color: white;
  margin-bottom: 0.5rem;
}

.phrase-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.phrase-input input {
  flex: 1;
  margin-bottom: 0;
}

button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: border-color 0.25s;
}

.remove-phrase {
  background-color: #ff4444;
  color: white;
}

.remove-phrase:disabled {
  background-color: #666;
  cursor: not-allowed;
}

.add-phrase {
  background-color: #42b883;
  color: white;
  margin-top: 0.5rem;
}

.submit-button {
  background-color: #646cff;
  color: white;
  width: 100%;
  margin-top: 1rem;
}

button:hover:not(:disabled) {
  border-color: #646cff;
}
</style>
