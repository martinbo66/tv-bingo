<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showService } from '../services/showService'
import type { Show } from '../types/Show'

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
    error.value = 'Failed to load shows'
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
      error.value = 'Failed to delete show'
      console.error(e)
    }
  }
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
            >
                <div class="show-content">
                    <h3>{{ show.showTitle }}</h3>
                    <div v-if="show.gameTitle" class="game-title">
                        {{ show.gameTitle }}
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
    background-color: #4CAF50;
    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
    transition: all 0.3s ease;
}

.add-show-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.shows-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
    padding: 0 10px;
}

.show-card {
    background: linear-gradient(135deg, #9c27b0, #673ab7);
    border-radius: 10px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(156, 39, 176, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    height: 75px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.show-content {
    flex: 1;
    overflow: hidden;
    margin-right: 8px;
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
    margin: 0 0 6px 0;
    color: #fff;
    font-size: 1em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.game-title {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8em;
    margin: 2px 0;
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
