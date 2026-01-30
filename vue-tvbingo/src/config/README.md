# Feature Flags Configuration

This directory contains configuration for feature flags that control optional functionality in the TV Bingo application.

## Usage

Feature flags allow you to enable or disable features without removing code. This is useful for:
- Gradually rolling out new features
- A/B testing
- Disabling problematic features quickly
- Development and testing

## How to Use

1. **Check the current flags**: Open `featureFlags.ts` to see all available feature flags
2. **Toggle a feature**: Change the boolean value for the feature you want to enable/disable
3. **Rebuild the app**: The changes take effect after rebuilding the frontend

## Available Feature Flags

### `enablePhraseCountFilter`
- **Location**: Shows list page
- **Description**: Enables filtering shows by phrase count (<10, 10-24, 25+)
- **Default**: `true`
- **Impact**: When disabled, the phrase count filter UI is hidden and filtering logic is bypassed

## Adding New Feature Flags

To add a new feature flag:

1. Add the flag to the `FeatureFlags` interface in `featureFlags.ts`
2. Set the default value in the `featureFlags` object
3. Use the `useFeatureFlags()` composable in your component:
   ```typescript
   import { useFeatureFlags } from '@/composables/useFeatureFlags'

   const { flags } = useFeatureFlags()

   // Use in template or logic
   if (flags.myNewFeature) {
     // Feature-specific code
   }
   ```
4. Conditionally render UI elements with `v-if`:
   ```vue
   <div v-if="flags.myNewFeature">
     <!-- Feature content -->
   </div>
   ```

## Example: Disabling Phrase Count Filter

In `featureFlags.ts`:
```typescript
export const featureFlags: FeatureFlags = {
  enablePhraseCountFilter: false, // Changed from true to false
}
```

After rebuilding, the phrase count filter will be hidden and inactive.
