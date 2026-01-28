<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showService } from '../services/showService'
import type { Show } from '../types/Show'
import { ApiError } from '../services/apiClient'

const router = useRouter()
const shows = ref<Show[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// View mode state with localStorage persistence
type ViewMode = 'grid' | 'list'
const STORAGE_KEY = 'tvBingo.viewPreferences'

const loadViewPreference = (): ViewMode => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const prefs = JSON.parse(stored)
      return prefs.viewMode === 'list' ? 'list' : 'grid'
    }
  } catch (e) {
    console.warn('Failed to load view preference:', e)
  }
  return 'grid'
}

const saveViewPreference = (mode: ViewMode) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ viewMode: mode }))
  } catch (e) {
    console.warn('Failed to save view preference:', e)
  }
}

const viewMode = ref<ViewMode>(loadViewPreference())

const toggleView = (mode: ViewMode) => {
  viewMode.value = mode
  saveViewPreference(mode)
}

// Sort shows alphabetically by title
const sortedShows = computed(() => {
  return [...shows.value].sort((a, b) => 
    a.showTitle.localeCompare(b.showTitle)
  )
})

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

// Keyboard shortcut handler
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl/Cmd + Shift + V to toggle view
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'V') {
    event.preventDefault()
    toggleView(viewMode.value === 'grid' ? 'list' : 'grid')
  }
}

onMounted(() => {
  fetchShows()
  window.addEventListener('keydown', handleKeydown)
})

// Clean up event listener
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
    <div class="shows-container">
        <div class="header">
            <h2>TV Shows</h2>
            <div class="header-controls">
                <div 
                    class="view-toggle" 
                    role="group" 
                    aria-label="View options"
                >
                    <button 
                        class="view-toggle-btn"
                        :class="{ active: viewMode === 'grid' }"
                        @click="toggleView('grid')"
                        :aria-pressed="viewMode === 'grid'"
                        title="Grid view (Ctrl/Cmd + Shift + V to toggle)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </button>
                    <button 
                        class="view-toggle-btn"
                        :class="{ active: viewMode === 'list' }"
                        @click="toggleView('list')"
                        :aria-pressed="viewMode === 'list'"
                        title="List view (Ctrl/Cmd + Shift + V to toggle)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <router-link to="/create" class="add-show-link">+ Add Show</router-link>
            </div>
        </div>
        
        <div v-if="loading" class="loading">
            Loading shows...
        </div>
        
        <div v-else-if="error" class="error">
            {{ error }}
            <button @click="fetchShows" class="retry-button">Retry</button>
        </div>
        
        <!-- Grid View -->
        <div v-else-if="viewMode === 'grid'" class="shows-grid">
            <div 
              v-for="show in sortedShows" 
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
                        aria-label="Edit show"
                    >
                        ✏️
                    </button>
                    <button 
                        class="control-btn delete-btn" 
                        @click="(e) => handleDelete(e, show.id)"
                        title="Delete show"
                        aria-label="Delete show"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
        
        <!-- List View -->
        <div v-else class="shows-list-view" role="table" aria-label="Shows list">
            <div class="list-header" role="row">
                <div class="list-cell header-cell title-cell" role="columnheader">Show Title</div>
                <div class="list-cell header-cell game-title-cell" role="columnheader">Game Title</div>
                <div class="list-cell header-cell phrase-count-cell" role="columnheader">Phrases</div>
                <div class="list-cell header-cell actions-cell" role="columnheader">Actions</div>
            </div>
            <div 
                v-for="show in sortedShows" 
                :key="show.id" 
                class="list-row"
                role="row"
                @click="navigateToShow(show.id)"
                :aria-label="`${show.showTitle}${show.gameTitle ? ' - ' + show.gameTitle : ''}, ${show.phrases.length} phrases`"
            >
                <div class="list-cell title-cell" role="cell">
                    <span class="show-title-text">{{ show.showTitle }}</span>
                </div>
                <div class="list-cell game-title-cell" role="cell">
                    <span class="game-title-text">{{ show.gameTitle || '—' }}</span>
                </div>
                <div class="list-cell phrase-count-cell" role="cell">
                    <span 
                        class="phrase-count-badge" 
                        :class="`status-${getPhraseCountStatus(show.phrases.length)}`"
                    >
                        {{ show.phrases.length }}
                        <span v-if="isShowComplete(show)" class="complete-indicator-list" title="Ready to play!">✓</span>
                    </span>
                </div>
                <div class="list-cell actions-cell" role="cell">
                    <button 
                        class="control-btn edit-btn" 
                        @click="(e) => handleEdit(e, show.id)"
                        title="Edit show"
                        aria-label="Edit show"
                    >
                        ✏️
                    </button>
                    <button 
                        class="control-btn delete-btn" 
                        @click="(e) => handleDelete(e, show.id)"
                        title="Delete show"
                        aria-label="Delete show"
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
    flex-wrap: wrap;
    gap: 16px;
}

.header h2 {
    font-size: 2em;
    color: #fff;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

.header-controls {
    display: flex;
    align-items: center;
    gap: 12px;
}

.view-toggle {
    display: flex;
    gap: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 4px;
}

.view-toggle-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 6px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.view-toggle-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.9);
}

.view-toggle-btn.active {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.view-toggle-btn:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
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

/* Grid View Styles */
.shows-grid {
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

/* List View Styles */
.shows-list-view {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.list-header {
    display: grid;
    grid-template-columns: 2fr 1.5fr 120px 120px;
    gap: 16px;
    padding: 16px 20px;
    background: rgba(156, 39, 176, 0.3);
    border-bottom: 2px solid rgba(156, 39, 176, 0.5);
    font-weight: 600;
    font-size: 0.9em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.list-row {
    display: grid;
    grid-template-columns: 2fr 1.5fr 120px 120px;
    gap: 16px;
    padding: 16px 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    min-height: 60px;
    align-items: center;
}

.list-row:hover {
    background: rgba(156, 39, 176, 0.2);
    border-left: 3px solid rgba(156, 39, 176, 0.8);
    padding-left: 17px;
}

.list-row:last-child {
    border-bottom: none;
}

.list-cell {
    display: flex;
    align-items: center;
}

.header-cell {
    color: rgba(255, 255, 255, 0.9);
}

.title-cell {
    font-weight: 600;
    font-size: 1.05em;
}

.show-title-text {
    color: #fff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.game-title-cell {
    color: rgba(255, 255, 255, 0.7);
    font-style: italic;
    font-size: 0.95em;
}

.game-title-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
}

.phrase-count-cell {
    justify-content: center;
}

.phrase-count-badge {
    font-size: 0.9em;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.phrase-count-badge.status-low {
    background-color: rgba(255, 193, 7, 0.3);
    color: #ffd54f;
    border: 1px solid rgba(255, 193, 7, 0.5);
}

.phrase-count-badge.status-medium {
    background-color: rgba(255, 152, 0, 0.3);
    color: #ffb74d;
    border: 1px solid rgba(255, 152, 0, 0.5);
}

.phrase-count-badge.status-complete {
    background-color: rgba(76, 175, 80, 0.3);
    color: #81c784;
    border: 1px solid rgba(76, 175, 80, 0.5);
}

.complete-indicator-list {
    font-weight: bold;
    font-size: 1.1em;
    color: #81c784;
    text-shadow: 0 0 8px rgba(129, 199, 132, 0.6);
}

.actions-cell {
    gap: 8px;
    justify-content: flex-end;
}

.actions-cell .control-btn {
    flex-shrink: 0;
}

/* Mobile Responsive Design */
@media (max-width: 768px) {
    .header {
        flex-direction: column;
        align-items: stretch;
    }

    .header h2 {
        font-size: 1.5em;
        text-align: center;
    }

    .header-controls {
        justify-content: space-between;
    }

    /* Grid view mobile */
    .shows-grid {
        grid-template-columns: 1fr;
        padding: 0;
    }

    /* List view mobile - stack columns */
    .list-header {
        display: none; /* Hide header on mobile */
    }

    .list-row {
        grid-template-columns: 1fr;
        grid-template-areas:
            "title"
            "meta"
            "actions";
        gap: 8px;
        padding: 16px;
        min-height: auto;
    }

    .title-cell {
        grid-area: title;
        font-size: 1.1em;
    }

    .game-title-cell {
        grid-area: meta;
        font-size: 0.85em;
    }

    .phrase-count-cell {
        display: none; /* Show in meta area instead */
    }

    .actions-cell {
        grid-area: actions;
        justify-content: flex-end;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 12px;
        margin-top: 4px;
    }

    /* Show phrase count with game title on mobile */
    .game-title-cell::after {
        content: attr(data-phrases);
        margin-left: 8px;
        font-style: normal;
    }
}

/* Tablet adjustments */
@media (min-width: 769px) and (max-width: 1024px) {
    .list-header,
    .list-row {
        grid-template-columns: 2fr 1fr 100px 100px;
        gap: 12px;
    }

    .shows-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
}

/* Touch-friendly sizing on mobile */
@media (max-width: 768px) {
    .list-row {
        min-height: 48px;
    }

    .control-btn {
        padding: 8px;
        font-size: 1.1em;
    }

    .view-toggle-btn {
        padding: 10px 14px;
    }
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
