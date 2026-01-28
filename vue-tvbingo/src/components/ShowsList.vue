<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showService } from '../services/showService'
import type { Show } from '../types/Show'
import { ApiError } from '../services/apiClient'

const router = useRouter()
const shows = ref<Show[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const fetchShows = async () => {
  loading.value = true
  error.value = null
  try {
    shows.value = await showService.getShows()
  } catch (e) {
    if (e instanceof ApiError) {
      error.value = `Failed to load shows: ${e.message}`
    } else {
      error.value = 'Failed to load shows. Please try again.'
    }
    console.error(e)
  } finally {
    loading.value = false
  }
}

const navigateToShow = (showId: number) => {
  router.push(`/show/${showId}`)
}

const handleEdit = (event: Event, showId: number) => {
  event.stopPropagation()
  router.push(`/show/${showId}/edit`)
}

const handleDelete = async (event: Event, showId: number) => {
  event.stopPropagation()
  if (confirm('Are you sure you want to delete this show?')) {
    try {
      await showService.deleteShow(showId)
      await fetchShows()
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 404) {
          error.value = 'Show not found. It may have already been deleted.'
        } else {
          error.value = `Failed to delete show: ${e.message}`
        }
      } else {
        error.value = 'Failed to delete show. Please try again.'
      }
      console.error(e)
    }
  }
}

// Get phrase count category for color-coding
const getPhraseCountStatus = (phraseCount: number) => {
  if (phraseCount >= 25) return 'complete'
  if (phraseCount >= 10) return 'medium'
  return 'low'
}

// Check if show is complete (25+ phrases)
const isShowComplete = (show: Show) => {
  return show.phrases.length >= 25
}

onMounted(() => {
  fetchShows()
})
</script>

<template>
    <div class="shows-container">
        <div class="header">
            <h2>TV Shows</h2>
            <router-link to="/create" class="add-show-link">+ Add Show</router-link>
        </div>
        
        <div v-if="loading" class="loading">
            Loading shows...
        </div>
        
        <div v-else-if="error" class="error">
            {{ error }}
            <button @click="fetchShows" class="retry-button">Retry</button>
        </div>
        
        <div v-else class="shows-list">
            <div 
              v-for="show in shows" 
              :key="show.id" 
              class="show-card"
              @click="navigateToShow(show.id)"
              :title="`${show.showTitle}${show.gameTitle ? ' - ' + show.gameTitle : ''}`"
            >
                <div class="show-content">
                    <h3>{{ show.showTitle }}</h3>
                    <div v-if="show.gameTitle" class="game-title">
                        {{ show.gameTitle }}
                    </div>
                    <div 
                        class="phrase-count" 
                        :class="`status-${getPhraseCountStatus(show.phrases.length)}`"
                    >
                        {{ show.phrases.length }} phrase{{ show.phrases.length !== 1 ? 's' : '' }}
                        <span v-if="isShowComplete(show)" class="complete-indicator" title="Ready to play!">✓</span>
                    </div>
                </div>
                <div class="show-controls">
                    <button 
                        class="control-btn edit-btn" 
                        @click="(e) => handleEdit(e, show.id)"
                        title="Edit show"
                    >
                        ✏️
                    </button>
                    <button 
                        class="control-btn delete-btn" 
                        @click="(e) => handleDelete(e, show.id)"
                        title="Delete show"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.shows-container {
    padding: 20px;
    min-height: 100vh;
    color: #fff;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.header h2 {
    font-size: 2em;
    color: #fff;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

.add-show-link {
    text-decoration: none;
    color: #fff;
    font-weight: bold;
    padding: 10px 20px;
    border-radius: 25px;
    background: linear-gradient(90deg, #4caf50 0%, #81c784 100%);
    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
    transition: all 0.3s ease;
}

.add-show-link:hover {
    background: linear-gradient(90deg, #388e3c 0%, #66bb6a 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.shows-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
    padding: 0 10px;
}

.show-card {
    background: linear-gradient(135deg, #9c27b0, #673ab7);
    border-radius: 10px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(156, 39, 176, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    min-height: 110px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.show-content {
    flex: 1;
    margin-right: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.show-controls {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.control-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
    font-size: 0.9em;
}

.control-btn:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
}

.show-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.show-card h3 {
    margin: 0;
    color: #fff;
    font-size: 1.05em;
    font-weight: 600;
    line-height: 1.3;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    /* Support multi-line with max 3 lines */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
}

.game-title {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85em;
    font-style: italic;
    line-height: 1.2;
    /* Support multi-line with max 2 lines */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
}

.phrase-count {
    font-size: 0.8em;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: fit-content;
    margin-top: auto;
}

.phrase-count.status-low {
    background-color: rgba(255, 193, 7, 0.3);
    color: #ffd54f;
    border: 1px solid rgba(255, 193, 7, 0.5);
}

.phrase-count.status-medium {
    background-color: rgba(255, 152, 0, 0.3);
    color: #ffb74d;
    border: 1px solid rgba(255, 152, 0, 0.5);
}

.phrase-count.status-complete {
    background-color: rgba(76, 175, 80, 0.3);
    color: #81c784;
    border: 1px solid rgba(76, 175, 80, 0.5);
}

.complete-indicator {
    font-weight: bold;
    font-size: 1.1em;
    color: #81c784;
    text-shadow: 0 0 8px rgba(129, 199, 132, 0.6);
}

.loading {
    text-align: center;
    padding: 40px;
    color: #fff;
    font-size: 1.2em;
}

.error {
    text-align: center;
    padding: 40px;
    color: #ff4444;
    background: rgba(255, 68, 68, 0.1);
    border-radius: 10px;
    margin: 20px;
}

.retry-button {
    margin-top: 16px;
    padding: 10px 24px;
    background-color: #ff4444;
    color: white;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;
}

.retry-button:hover {
    background-color: #ff1111;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 68, 68, 0.4);
}
</style>

<style>
/* Global styles */
html, body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background-color: #2d1b3e;
}

#app {
    min-height: 100vh;
}
</style>
