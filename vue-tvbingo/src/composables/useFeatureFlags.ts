import { reactive, readonly } from 'vue'
import { featureFlags } from '../config/featureFlags'

/**
 * Composable for accessing feature flags throughout the app
 * Provides reactive access to feature flag state
 */

const flags = reactive(featureFlags)

export function useFeatureFlags() {
  return {
    flags: readonly(flags),
  }
}
