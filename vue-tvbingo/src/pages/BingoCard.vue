<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showService } from '../services/showService'
import type { Show } from '../types/Show'
import type { Ref } from 'vue'

const route = useRoute()
const router = useRouter()
const show = ref<Show | null>(null)
const bingoGrid = ref<string[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const selectedCells = ref<Set<number>>(new Set())
const winningLines: Ref<number[][]> = ref([])
const showBingoAlert = ref(false)

const generateBingoGrid = (phrases: string[], centerSquare?: string) => {
  // Create a copy of phrases array to shuffle
  const shuffledPhrases = [...phrases]

  // Fisher-Yates shuffle algorithm
  for (let i = shuffledPhrases.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[shuffledPhrases[i], shuffledPhrases[j]] = [shuffledPhrases[j], shuffledPhrases[i]]
  }

  // Take first 24 phrases (for a 5x5 grid minus the center)
  const result = shuffledPhrases.slice(0, 24)

  // Insert the center square at the middle position (index 12)
  // The center is the 13th element (index 12) in a 5x5 grid (row 3, column 3)
  result.splice(12, 0, centerSquare || 'FREE SPACE')

  // Automatically select the center square
  selectedCells.value.add(12)

  return result
}

const checkWinningCombinations = () => {
  const possibleWins: Array<Array<number>> = [
    // Rows
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    // Columns
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    // Diagonals
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20]
  ]

  const previousWinCount = winningLines.value.length
  winningLines.value = possibleWins.filter((line: Array<number>) =>
    line.every(cell => selectedCells.value.has(cell))
  )

  // Show alert when a new bingo is achieved
  if (winningLines.value.length > previousWinCount) {
    showBingoAlert.value = true
  }
}

const dismissBingoAlert = () => {
  showBingoAlert.value = false
}

const toggleCell = (index: number) => {
  if (selectedCells.value.has(index)) {
    selectedCells.value.delete(index)
  } else {
    selectedCells.value.add(index)
  }
  checkWinningCombinations()
}

const navigateToShowDetail = () => {
  if (show.value) {
    router.push(`/show/${show.value.id}/edit`)
  }
}

const regenerateBingoCard = () => {
  if (show.value) {
    selectedCells.value.clear()
    showBingoAlert.value = false
    bingoGrid.value = generateBingoGrid(show.value.phrases, show.value.centerSquare)
    checkWinningCombinations()
  }
}

const resetMarks = () => {
  selectedCells.value.clear()
  // Re-select the center square (free space)
  selectedCells.value.add(12)
  showBingoAlert.value = false
  checkWinningCombinations()
}

const loadShow = async () => {
  const showId = parseInt(route.params.id as string)
  if (isNaN(showId)) {
    error.value = 'Invalid show ID'
    loading.value = false
    return
  }

  try {
    const fetchedShow = await showService.getShowById(showId)
    if (!fetchedShow) {
      error.value = 'Show not found'
      return
    }

    // Check if there are at least 24 phrases
    if (!fetchedShow.phrases || fetchedShow.phrases.length < 24) {
      error.value = 'This show needs at least 24 phrases to create a bingo card'
      show.value = fetchedShow // Still set the show so we can navigate to edit
      return
    }

    show.value = fetchedShow
    bingoGrid.value = generateBingoGrid(fetchedShow.phrases, fetchedShow.centerSquare)
  } catch (e) {
    error.value = 'Failed to load show'
    console.error(e)
  } finally {
    loading.value = false
  }
}

const isWinningCell = computed(() => (index: number) =>
  winningLines.value.some(line => line.includes(index))
)

const hasBingo = computed(() => winningLines.value.length > 0)

onMounted(() => {
  loadShow()
})
</script>

<template>
  <div class="bingo-bg">
    <div class="bingo-card-page fade-in">
      <div v-if="loading" class="loading">
        Loading bingo card...
      </div>

      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <div v-if="show && error.includes('24 phrases')" class="error-actions">
          <button @click="navigateToShowDetail" class="edit-button">Edit Show</button>
        </div>
      </div>

      <div v-else-if="show" class="bingo-card-container">
        <div class="header-vertical">
          <router-link to="/" class="back-link">
            <span class="back-icon">←</span> Back to Shows
          </router-link>
          <h2 @click="navigateToShowDetail" class="show-title">{{ show.showTitle }}</h2>
          <div class="button-row">
            <button @click="regenerateBingoCard" class="regenerate-button">
              <span class="regen-icon">🔄</span> Regenerate
            </button>
            <button @click="resetMarks" class="reset-button">
              <span class="reset-icon">🧹</span> Reset Marks
            </button>
          </div>
        </div>
        <div style="height: 2.2rem;"></div>
        <div class="bingo-grid card-shadow">
          <div v-for="(phrase, index) in bingoGrid" :key="index" class="bingo-cell" :class="{
            'selected': selectedCells.has(index),
            'center-square': index === 12,
            'winning': isWinningCell(index)
            }" @click="toggleCell(index)">
            {{ phrase }}
          </div>
        </div>

        <div v-if="showBingoAlert" class="bingo-alert" @click="dismissBingoAlert">
          <button class="bingo-close" @click.stop="dismissBingoAlert" aria-label="Close">&times;</button>
          <div class="bingo-text">BINGO!</div>
          <div class="bingo-dismiss-hint">Click anywhere to dismiss</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bingo-bg {
  min-height: 100%;
  width: 100%;
  background: linear-gradient(135deg, #2d183a 0%, #1a1024 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.bingo-card-page {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
}

.bingo-card-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
}

.header-vertical {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
  margin-bottom: 0;
  position: relative;
}

.show-title {
  font-family: 'Inter', 'Roboto', 'Open Sans', sans-serif;
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.04em;
  margin: 0.2em 0 0.1em 0;
  text-align: center;
  text-shadow: 0 2px 12px #a084ca55;
  cursor: pointer;
  transition: color 0.2s;
}

.show-title:hover {
  color: #ffd700;
  text-decoration: underline;
}

.button-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.regenerate-button {
  background: linear-gradient(90deg, #4caf50 0%, #81c784 100%);
  color: #fff;
  border: none;
  border-radius: 24px;
  padding: 0.75em 1.5em;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  gap: 0.5em;
  cursor: pointer;
}

.regenerate-button:hover {
  background: linear-gradient(90deg, #388e3c 0%, #66bb6a 100%);
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.25);
  transform: translateY(-2px) scale(1.04);
}

.regen-icon {
  font-size: 1.1em;
}

.reset-button {
  background: linear-gradient(90deg, #f57c00 0%, #ffb74d 100%);
  color: #fff;
  border: none;
  border-radius: 24px;
  padding: 0.75em 1.5em;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(245, 124, 0, 0.15);
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  gap: 0.5em;
  cursor: pointer;
}

.reset-button:hover {
  background: linear-gradient(90deg, #e65100 0%, #ffa726 100%);
  box-shadow: 0 4px 16px rgba(245, 124, 0, 0.25);
  transform: translateY(-2px) scale(1.04);
}

.reset-icon {
  font-size: 1.1em;
}

.back-link {
  background: rgba(160, 132, 202, 0.18);
  color: #fff;
  border-radius: 20px;
  padding: 0.4em 1.2em 0.4em 1.8em;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  box-shadow: 0 2px 8px #a084ca22;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-bottom: 0.2rem;
}

.back-link:hover {
  background: #a084ca;
  color: #ffd700;
  box-shadow: 0 4px 16px #a084ca55;
}

.back-icon {
  font-size: 1.2em;
  margin-right: 0.5em;
}

.bingo-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  background: none;
  padding: 18px;
  border-radius: 24px;
  box-shadow: 0 6px 32px #a084ca33, 0 1.5px 8px #0002;
  margin-bottom: 2.5rem;
  width: 100%;
  aspect-ratio: 1;
  min-width: 320px;
  max-width: 520px;
  min-height: 320px;
  max-height: 520px;
  align-items: center;
  justify-items: center;
  animation: fadeIn 0.7s;
}

.card-shadow {
  box-shadow: 0 6px 32px #a084ca33, 0 1.5px 8px #0002;
}

.bingo-cell {
  aspect-ratio: 1;
  width: 100%;
  min-width: 48px;
  min-height: 48px;
  max-width: 90px;
  max-height: 90px;
  background: #e0ffe0;
  border-radius: 18px;
  box-shadow: 0 2px 8px #a084ca22;
  border: 2.5px solid #c0ffc0;
  padding: 0.5em;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: 'Inter', 'Roboto', 'Open Sans', sans-serif;
  font-size: 1.08rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #222;
  cursor: pointer;
  user-select: none;
  transition: all 0.18s cubic-bezier(.4, 2, .6, 1), box-shadow 0.2s;
  position: relative;
  overflow-wrap: break-word;
  word-break: break-word;
  opacity: 0.98;
}

.bingo-cell:hover {
  background: #c0ffc0;
  transform: scale(1.06);
  box-shadow: 0 4px 16px #a084ca44;
  z-index: 2;
}

.bingo-cell.selected {
  background: #222;
  color: #fff;
  border-color: #6f42c1;
  box-shadow: 0 4px 16px #6f42c1aa;
  z-index: 3;
}

.bingo-cell.center-square {
  font-weight: 900;
  background: #f0eaff;
  color: #6f42c1;
  border: 2.5px solid #a084ca;
  box-shadow: 0 2px 8px #a084ca33;
}

.bingo-cell.center-square.selected {
  background: #6f42c1;
  color: #fff;
  border-color: #ffd700;
}

.bingo-cell.winning {
  background: linear-gradient(90deg, #ffd700 60%, #fffbe0 100%);
  color: #222;
  border-color: #ffd700;
  box-shadow: 0 0 24px #ffd70099, 0 2px 8px #a084ca33;
  animation: pulse 1.2s infinite;
  z-index: 4;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  color: #fff;
  font-size: 1.2em;
}

.error {
  color: #ff4444;
  background: rgba(255, 68, 68, 0.08);
  border-radius: 10px;
  margin: 20px;
}

.error-actions {
  margin-top: 1rem;
}

.edit-button {
  background-color: #4a6cf7;
  color: white;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 24px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: background-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px #4a6cf733;
}
.edit-button:hover {
  background-color: #3a5ce5;
  box-shadow: 0 4px 16px #4a6cf755;
}

.bingo-alert {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.88);
  padding: 2rem 4rem;
  border-radius: 1.5rem;
  z-index: 100;
  animation: fadeIn 0.5s ease-out;
  box-shadow: 0 8px 32px #ffd70055;
}

.bingo-text {
  font-size: 4rem;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 10px #ffd70099, 0 2px 12px #fffbe0;
  animation: bounce 1.2s infinite;
  letter-spacing: 0.08em;
}

.bingo-close {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  line-height: 1;
}

.bingo-close:hover {
  opacity: 1;
}

.bingo-dismiss-hint {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #aaa;
  font-weight: 400;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.fade-in {
  animation: fadeIn 0.7s;
}

/* Large desktop screens - ensure proper centering */
@media (min-width: 1440px) {
  .bingo-card-page {
    max-width: 1000px;
  }
  
  .bingo-card-container {
    max-width: 700px;
  }
  
  .bingo-grid {
    max-width: 600px;
    max-height: 600px;
  }
}

/* Standard desktop screens */
@media (min-width: 1024px) and (max-width: 1439px) {
  .bingo-card-page {
    max-width: 900px;
  }
  
  .bingo-card-container {
    max-width: 650px;
  }
}

/* Tablet and mobile */
@media (max-width: 700px) {
  .bingo-card-container {
    max-width: 98vw;
    padding: 0.5rem 0 0 0;
  }
  .bingo-grid {
    min-width: 220px;
    max-width: 99vw;
    min-height: 220px;
    max-height: 99vw;
    gap: 6px;
    padding: 6px;
  }
  .bingo-cell {
    min-width: 32px;
    min-height: 32px;
    max-width: 70px;
    max-height: 70px;
    font-size: 0.75rem;
    padding: 0.15em;
    border-radius: 12px;
    border-width: 2px;
  }
  .bingo-logo {
    width: 80px;
    height: 80px;
  }
  .show-title {
    font-size: 1.3rem;
  }
  .button-row {
    gap: 0.5rem;
  }
  .regenerate-button,
  .reset-button {
    font-size: 0.9rem;
    padding: 0.5em 1em;
  }
  .back-link {
    font-size: 0.95rem;
    padding: 0.3em 0.8em 0.3em 1.2em;
  }
}

/* Small phones (iPhone SE, etc.) */
@media (max-width: 400px) {
  .bingo-card-page {
    padding: 0.5rem;
  }
  .bingo-grid {
    gap: 4px;
    padding: 4px;
    border-radius: 16px;
  }
  .bingo-cell {
    font-size: 0.65rem;
    padding: 0.1em;
    border-radius: 8px;
    border-width: 1.5px;
    line-height: 1.2;
  }
  .show-title {
    font-size: 1.1rem;
  }
  .button-row {
    gap: 0.4rem;
  }
  .regenerate-button,
  .reset-button {
    font-size: 0.8rem;
    padding: 0.4em 0.8em;
  }
  .regen-icon,
  .reset-icon {
    font-size: 1em;
  }
  .back-link {
    font-size: 0.85rem;
    padding: 0.25em 0.6em 0.25em 1em;
  }
  .bingo-alert {
    padding: 1.5rem 2rem;
  }
  .bingo-text {
    font-size: 2.5rem;
  }
}
</style>
