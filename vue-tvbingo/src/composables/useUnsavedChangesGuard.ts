import { computed, onBeforeUnmount, onMounted, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/**
 * Composable for tracking and warning about unsaved changes
 *
 * @param originalData - Ref containing the original/saved state
 * @param currentData - Ref containing the current/working state
 * @returns Object with hasUnsavedChanges computed property and markClean function
 */
export function useUnsavedChangesGuard<T>(
  originalData: Ref<T>,
  currentData: Ref<T>
) {
  // Check if there are unsaved changes by comparing JSON strings
  const hasUnsavedChanges = computed(() => {
    return JSON.stringify(currentData.value) !== JSON.stringify(originalData.value)
  })

  // Browser beforeunload handler
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges.value) {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  // Mark the current state as clean (typically after save)
  const markClean = () => {
    originalData.value = JSON.parse(JSON.stringify(currentData.value)) as T
  }

  // Setup guards
  const setupGuards = () => {
    // Add beforeunload handler for browser navigation
    onMounted(() => {
      window.addEventListener('beforeunload', handleBeforeUnload)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    })

    // Vue Router navigation guard
    onBeforeRouteLeave(() => {
      if (hasUnsavedChanges.value) {
        const answer = window.confirm('You have unsaved changes. Are you sure you want to leave?')
        if (!answer) return false
      }
    })
  }

  return {
    hasUnsavedChanges,
    markClean,
    setupGuards
  }
}
