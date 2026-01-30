/**
 * Feature flags configuration
 * Toggle features on/off without removing code
 */

export interface FeatureFlags {
  enablePhraseCountFilter: boolean
  // Add more feature flags here as needed
}

/**
 * Feature flags configuration
 * Change these values to enable/disable features
 */
export const featureFlags: FeatureFlags = {
  // Enable/disable the phrase count filter in the shows list
  enablePhraseCountFilter: false,
}
