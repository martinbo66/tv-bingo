# Edit Page Improvements

Tracking progress on show editing UX improvements focused on the phrase list.

## High Priority Changes

| Change | Status |
|--------|--------|
| Inline phrase editing | Complete |
| Unsaved changes warning | Complete |
| Keyboard support (Enter to add) | Complete |

---

## 1. Inline Phrase Editing

**Goal:** Clicking a phrase should allow editing it in place instead of requiring delete + re-add.

**Implementation:**
- [x] Add click handler to phrase text
- [x] Toggle phrase between display mode and edit mode
- [x] Show input field with current text when editing
- [x] Save on blur or Enter, cancel on Escape
- [x] Visual indicator that phrases are editable (cursor, hover state)

---

## 2. Unsaved Changes Warning

**Goal:** Prevent accidental loss of edits when navigating away.

**Implementation:**
- [x] Track dirty state (compare current form to original data)
- [x] Show confirmation dialog when clicking Cancel with unsaved changes
- [x] Handle browser back button / navigation with beforeunload
- [x] Handle Vue Router navigation with onBeforeRouteLeave

---

## 3. Keyboard Support for Adding Phrases

**Goal:** Press Enter in the "New phrase" input to add without clicking the button.

**Implementation:**
- [x] Add keydown handler for Enter key on input
- [x] Trigger same add logic as button click

---

## Medium Priority Changes

| Change | Status |
|--------|--------|
| Delete confirmation | Pending |
| Drag-and-drop reordering | Pending |
| Scroll to newly added phrase | Pending |
| Better phrase list display | Pending |

### 4. Delete Confirmation

**Goal:** Clicking × should confirm before removing, or provide an undo toast notification.

### 5. Drag-and-Drop Reordering

**Goal:** Allow users to reorder phrases by dragging them.

### 6. Scroll to Newly Added Phrase

**Goal:** After adding a phrase, scroll the list to show the new phrase and briefly highlight it.

### 7. Better Phrase List Display

**Goal:** Improve scanning of large phrase lists. Options:
- Show all phrases without scroll (let page scroll naturally)
- Multi-column layout for better scanning
- Alphabetical sorting option

---

## Lower Priority Changes

| Change | Status |
|--------|--------|
| Bulk phrase operations | Pending |
| Bulk add via textarea | Pending |
| Form validation feedback | Pending |
| Proper label elements | Pending |

### 8. Bulk Phrase Operations

**Goal:** Add "Select all" / "Delete selected" for managing many phrases at once.

### 9. Bulk Add via Textarea

**Goal:** Allow pasting multiple phrases (one per line) to add many at once.

### 10. Form Validation Feedback

**Goal:** Show required field indicators, character limits, and validation errors inline.

### 11. Proper Label Elements

**Goal:** Associate `<label>` elements with inputs for better accessibility.

---

## Progress Log

- **2026-01-26:** Created tracking document, starting implementation
- **2026-01-26:** Implemented all three high priority changes in ShowDetail.vue
- **2026-01-26:** All features tested and verified working:
  - Inline editing: Click phrase → edit in place → Enter saves, Escape cancels
  - Unsaved changes: Cancel button shows confirmation dialog when changes exist
  - Enter to add: Pressing Enter in new phrase input adds the phrase

## Files Modified

- `vue-tvbingo/src/components/ShowDetail.vue` - Main implementation
- `spring-tvbingo/src/main/java/org/bomartin/tvbingo/config/WebConfig.java` - CORS fix for dev
