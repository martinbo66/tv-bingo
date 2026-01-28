# Component Reuse Plan: Show Add/Edit UX Improvements

## Executive Summary

The show editing page (ShowDetail.vue) has received significant UX improvements including bulk add, inline editing, validation feedback, and keyboard shortcuts. The show creation page (CreateShow.vue) is still using a basic one-field-per-phrase approach. This plan outlines how to extract reusable components and apply similar improvements to both pages for a consistent user experience.

## Current State Analysis

### ShowDetail.vue (Editing) - 1,115 lines
**Has:**
- ✅ Inline phrase editing (click to edit)
- ✅ Unsaved changes warning (browser & Vue Router)
- ✅ Keyboard support (Enter to add phrases)
- ✅ Delete confirmation dialogs
- ✅ Alphabetical phrase sorting
- ✅ Scroll to newly added phrase with highlight animation
- ✅ Bulk add via textarea with line numbers
- ✅ Form validation feedback with character counters
- ✅ Proper labels and ARIA attributes
- ✅ Real-time validation with inline error messages

### CreateShow.vue (Adding) - 193 lines
**Has:**
- ❌ One-field-per-phrase approach (cumbersome for many phrases)
- ❌ No validation feedback or character limits
- ❌ No bulk add capability
- ❌ No alphabetical sorting
- ❌ No keyboard shortcuts
- ❌ No unsaved changes warning
- ❌ Basic styling inconsistent with ShowDetail

**Issue:** Different UX patterns create confusion and inefficiency.

## Goals

1. **Extract reusable components** from ShowDetail.vue for use in both pages
2. **Apply improvements** to CreateShow.vue for consistency
3. **Maintain separation of concerns** - keep create vs. edit logic separate
4. **Reduce code duplication** - DRY principle
5. **Consistent styling** - same look and feel across both pages

## Proposed Component Architecture

### Reusable Components to Extract

#### 1. **PhraseListManager.vue** (NEW)
**Purpose:** Manages the list of phrases with add, edit, delete, and bulk operations

**Props:**
```typescript
{
  phrases: string[]           // Array of phrases
  allowInlineEdit: boolean    // Enable click-to-edit (default: true)
  showBulkAdd: boolean        // Show bulk add toggle (default: true)
  autoSort: boolean          // Auto-sort alphabetically (default: true)
  maxPhraseLength: number    // Max chars per phrase (default: 100)
}
```

**Events:**
```typescript
{
  'update:phrases': string[]  // Emit updated phrases array
  'phrases-changed': void     // Signal that phrases have changed
}
```

**Features:**
- Single phrase add input with Enter key support
- Bulk add via textarea with line numbers
- Alphabetical sorting display
- Inline editing (if enabled)
- Delete confirmation
- Scroll to and highlight newly added phrases
- Character counter and validation
- Proper ARIA attributes

#### 2. **FormFieldWithValidation.vue** (NEW)
**Purpose:** Reusable form field with validation, character counter, and error display

**Props:**
```typescript
{
  modelValue: string
  label: string
  id: string
  required: boolean
  maxLength: number
  placeholder: string
  type: 'text' | 'textarea'
  helpText?: string
  validator?: (value: string) => string | undefined
}
```

**Events:**
```typescript
{
  'update:modelValue': string
  'validation-error': string | undefined
}
```

**Features:**
- Label with required indicator
- Character counter (current/max)
- Real-time validation on input/blur
- Error message display with warning icon
- ARIA attributes for accessibility
- Consistent styling

#### 3. **UnsavedChangesGuard** (Composable)
**Purpose:** Reusable logic for detecting and warning about unsaved changes

**Usage:**
```typescript
const {
  hasUnsavedChanges,
  markClean,
  setupGuards
} = useUnsavedChangesGuard(originalData, currentData)
```

**Features:**
- Tracks dirty state via JSON comparison
- Browser beforeunload handler
- Vue Router navigation guard
- Cancel button with confirmation

## Implementation Plan

### Phase 1: Extract Reusable Components (2-3 sessions)

#### Task 1.1: Create PhraseListManager.vue
- Extract phrase management logic from ShowDetail.vue
- Accept phrases as v-model
- Emit changes rather than mutating parent state
- Include all features: single/bulk add, edit, delete, sort, highlight
- Self-contained validation and error handling

#### Task 1.2: Create FormFieldWithValidation.vue
- Extract form field pattern from ShowDetail.vue
- Configurable label, validation, character limits
- Consistent error display
- ARIA attributes

#### Task 1.3: Create useUnsavedChangesGuard composable
- Extract unsaved changes logic from ShowDetail.vue
- Reusable across create/edit pages
- Browser and router guard support

#### Task 1.4: Extract shared constants
Create `constants/formValidation.ts`:
```typescript
export const VALIDATION_LIMITS = {
  SHOW_TITLE: 100,
  GAME_TITLE: 100,
  CENTER_SQUARE: 50,
  PHRASE: 50
}

export const ERROR_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required`,
  TOO_LONG: (field: string, max: number) =>
    `${field} must be ${max} characters or less`
}
```

### Phase 2: Update ShowDetail.vue (1 session)

#### Task 2.1: Refactor to use new components
- Replace inline phrase management with `<PhraseListManager>`
- Replace form fields with `<FormFieldWithValidation>`
- Use `useUnsavedChangesGuard` composable
- Remove now-redundant code
- Ensure all existing features still work

**Expected outcome:** ShowDetail.vue reduced from ~1,115 lines to ~400-500 lines

### Phase 3: Upgrade CreateShow.vue (1-2 sessions)

#### Task 3.1: Modernize CreateShow.vue
- Replace one-field-per-phrase with `<PhraseListManager>`
- Use `<FormFieldWithValidation>` for show title, game title, center square
- Add `useUnsavedChangesGuard` (optional for create page)
- Apply consistent styling from ShowDetail
- Add validation before submission

#### Task 3.2: Update CreateShowPage.vue
- Handle validation errors from API
- Display field-specific errors
- Match ShowDetail error handling patterns

**Expected outcome:** CreateShow.vue grows from ~193 lines to ~350-400 lines but with much better UX

### Phase 4: Styling Consistency (1 session)

#### Task 4.1: Extract shared styles
Create `styles/form-theme.css`:
```css
/* Shared form styling variables and classes */
/* Used by FormFieldWithValidation and PhraseListManager */
```

#### Task 4.2: Ensure visual consistency
- Both pages use same colors, spacing, typography
- Same button styles
- Same animation patterns (highlight pulse)
- Same responsive breakpoints

## File Structure

```
vue-tvbingo/src/
├── components/
│   ├── CreateShow.vue              # Updated with new components
│   ├── ShowDetail.vue              # Refactored with new components
│   ├── common/                     # NEW: Shared form components
│   │   ├── FormFieldWithValidation.vue
│   │   └── PhraseListManager.vue
├── composables/                    # NEW: Shared logic
│   └── useUnsavedChangesGuard.ts
├── constants/                      # NEW: Shared constants
│   └── formValidation.ts
└── styles/                         # NEW: Shared styles
    └── form-theme.css
```

## Benefits

### For Users
- **Consistent experience** - Same UX whether creating or editing
- **Faster phrase entry** - Bulk add, keyboard shortcuts
- **Fewer mistakes** - Validation, character limits, confirmation dialogs
- **Better visibility** - Sorted lists, highlight animations
- **Accessibility** - Proper ARIA labels, screen reader support

### For Developers
- **Less duplication** - Shared components and logic
- **Easier maintenance** - Fix once, applies everywhere
- **Better testability** - Small, focused components
- **Consistent patterns** - Same validation and error handling

## Testing Strategy

### Unit Tests
- PhraseListManager: add, edit, delete, bulk add, sorting
- FormFieldWithValidation: validation, character limits, error display
- useUnsavedChangesGuard: dirty state detection, guard behavior

### Integration Tests
- CreateShow with new components
- ShowDetail with refactored components
- Form submission with validation

### Manual Testing Checklist
- [ ] Create new show with single phrases
- [ ] Create new show with bulk add
- [ ] Edit existing show
- [ ] Inline edit phrases
- [ ] Delete phrases with confirmation
- [ ] Navigate away with unsaved changes
- [ ] Validation errors display correctly
- [ ] Character counters accurate
- [ ] Keyboard shortcuts work (Enter to add)
- [ ] Alphabetical sorting works
- [ ] Highlight animation on new phrases
- [ ] Responsive on mobile
- [ ] Screen reader compatibility

## Migration Path

1. **Start with Phase 1** - Build components in isolation without breaking existing pages
2. **Phase 2** - Refactor ShowDetail.vue (low risk since it's already working)
3. **Phase 3** - Upgrade CreateShow.vue (can be tested side-by-side with old version)
4. **Phase 4** - Polish and consistency pass

Each phase can be completed and tested independently.

## Risks and Mitigations

### Risk: Breaking existing ShowDetail functionality
**Mitigation:** Refactor incrementally, test thoroughly before moving to next component

### Risk: Props interface becomes too complex
**Mitigation:** Start simple, add props as needed, document with TypeScript types

### Risk: Components too coupled to specific use cases
**Mitigation:** Design components to be generic, use props for customization

### Risk: Styling conflicts between components
**Mitigation:** Use scoped styles, CSS variables for theming

## Future Enhancements (Not in Scope)

These could be added later but are not part of this plan:
- Drag-and-drop phrase reordering
- Duplicate phrase detection
- Import/export phrases as CSV
- Phrase templates or suggestions
- Undo/redo for phrase operations

## Open Questions

1. **Should CreateShow have unsaved changes warning?**
   - Pro: Consistent behavior, prevents data loss
   - Con: Less critical since user hasn't saved anything yet
   - **Recommendation:** Add it, but make it a configurable prop on the composable

2. **Should phrases be editable in CreateShow?**
   - Pro: Same UX as edit page
   - Con: Less critical since show isn't saved yet, could encourage more editing after save
   - **Recommendation:** Yes, include inline editing for consistency

3. **Should CreateShow start with an empty phrase list or one empty field?**
   - Current: One empty field (old pattern)
   - New option: Empty list, user adds phrases as needed
   - **Recommendation:** Empty list - cleaner, bulk add makes it easy to add many at once

## Success Criteria

- [ ] CreateShow.vue has same features as ShowDetail.vue for phrase management
- [ ] Both pages use shared components
- [ ] Code duplication reduced by >50%
- [ ] Visual consistency between create and edit pages
- [ ] All existing features continue to work
- [ ] No regressions in functionality
- [ ] Improved user experience based on manual testing
- [ ] Proper accessibility (ARIA attributes, keyboard navigation)

## Timeline Estimate

- **Phase 1:** 3 sessions (extract components)
- **Phase 2:** 1 session (refactor ShowDetail)
- **Phase 3:** 2 sessions (upgrade CreateShow)
- **Phase 4:** 1 session (styling consistency)

**Total:** 7 development sessions

## Next Steps

1. Review this plan for feedback
2. Start with Phase 1, Task 1.1 (PhraseListManager)
3. Implement incrementally with testing at each step
4. Get user feedback after Phase 3 completion

---

## Implementation Progress

### Phase 1: Extract Reusable Components ✅ COMPLETE

**Date:** 2026-01-28

**Tasks Completed:**
- [x] Task 1.1: Created PhraseListManager.vue
  - Extracted phrase management logic from ShowDetail.vue
  - Supports single/bulk add, inline edit, delete, sorting
  - Self-contained validation and error handling
  - Scroll-to and highlight animations
  - ~450 lines, fully styled and accessible
- [x] Task 1.2: Created FormFieldWithValidation.vue
  - Reusable form field with validation
  - Character counter with over-limit warning
  - Error message display with ARIA attributes
  - Consistent styling
  - ~155 lines
- [x] Task 1.3: Created useUnsavedChangesGuard composable
  - Tracks dirty state via JSON comparison
  - Browser beforeunload handler
  - Vue Router navigation guard
  - Generic TypeScript implementation
  - ~50 lines
- [x] Task 1.4: Created formValidation.ts constants
  - VALIDATION_LIMITS for all field types
  - ERROR_MESSAGES helper functions
  - Shared across all components

**Files Created:**
- `vue-tvbingo/src/components/common/PhraseListManager.vue`
- `vue-tvbingo/src/components/common/FormFieldWithValidation.vue`
- `vue-tvbingo/src/composables/useUnsavedChangesGuard.ts`
- `vue-tvbingo/src/constants/formValidation.ts`

**Status:** ✅ All Phase 1 tasks complete, ready for Phase 2

### Phase 2: Update ShowDetail.vue ✅ COMPLETE

**Date:** 2026-01-28

**Tasks Completed:**
- [x] Task 2.1: Refactored ShowDetail.vue to use new components
  - Replaced inline phrase management with `<PhraseListManager>`
  - Replaced three form fields with `<FormFieldWithValidation>`
  - Integrated `useUnsavedChangesGuard` composable
  - Removed all redundant code (phrase add/edit/delete, validation, etc.)
  - All existing features preserved

**Results:**
- ShowDetail.vue reduced from 1,115 lines to 353 lines (68% reduction)
- Code is now cleaner, more maintainable, and easier to understand
- All functionality preserved (inline edit, bulk add, validation, unsaved changes warning, etc.)
- TypeScript compilation successful
- All tests passing (132 passed)

**Files Modified:**
- `vue-tvbingo/src/components/ShowDetail.vue` - Major refactoring

**Status:** ✅ Phase 2 complete, ready for Phase 3

### Phase 3: Upgrade CreateShow.vue ✅ COMPLETE

**Date:** 2026-01-28

**Tasks Completed:**
- [x] Task 3.1: Modernized CreateShow.vue
  - Replaced one-field-per-phrase with `<PhraseListManager>`
  - Used `<FormFieldWithValidation>` for all three text fields
  - Added `useUnsavedChangesGuard` for unsaved changes warning
  - Applied consistent styling matching ShowDetail
  - Added validation before submission
  - Disabled submit button when form is invalid
- [x] Task 3.2: Updated CreateShowPage.vue
  - Improved error handling to match ShowDetail patterns
  - Added field-specific error display
  - Enhanced styling consistency

**Results:**
- CreateShow.vue grew from 193 lines to 256 lines (+33%)
- BUT gained all modern features:
  - ✅ Bulk add via textarea
  - ✅ Inline phrase editing
  - ✅ Alphabetical sorting
  - ✅ Character counters and validation
  - ✅ Scroll to and highlight new phrases
  - ✅ Keyboard shortcuts (Enter to add)
  - ✅ Unsaved changes warning
  - ✅ Delete confirmations
  - ✅ ARIA attributes for accessibility
- CreateShowPage.vue updated with consistent styling
- TypeScript compilation successful
- All tests passing (132 passed)

**Files Modified:**
- `vue-tvbingo/src/components/CreateShow.vue` - Complete rewrite with modern UX
- `vue-tvbingo/src/pages/CreateShowPage.vue` - Improved error handling and styling

**Status:** ✅ Phase 3 complete, ready for Phase 4
