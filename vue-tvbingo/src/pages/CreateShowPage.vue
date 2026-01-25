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
import type { Show, CreateShowInput } from '../types/Show'
import { showService } from '../services/showService'

const router = useRouter()
const error = ref<string | null>(null)

const onShowCreated = async (showInput: CreateShowInput) => {
  try {
    // Get all shows to determine the next ID
    const shows = await showService.getShows()
    const maxId = shows.reduce((max, s) => Math.max(max, s.id), 0)
    const newShow: Show = { ...showInput, id: maxId + 1 }
    
    await showService.addShow(newShow)
    router.push('/')
  } catch (e) {
    error.value = 'Failed to create show'
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
