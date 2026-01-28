# Show List UX Improvements

## Status Update

**Phase 1 (Card View Enhancements): ✅ COMPLETED - January 28, 2026**

All critical card view improvements have been implemented:
- ✅ Multi-line title support (3 lines for titles, 2 for game titles)
- ✅ Hover tooltips showing full text
- ✅ Phrase count badges with color-coding (yellow <10, orange 10-24, green 25+)
- ✅ Checkmark indicators for complete shows (25+ phrases)
- ✅ Improved card sizing (min-height: 110px) and spacing

## Executive Summary

This document outlines UX improvements for the TV Show Bingo application's show list page, based on evaluation of the current implementation. The primary issues identified are truncated show names in card view and lack of viewing flexibility.

## Current State Assessment

### What Works Well
- ✅ Visually appealing card-based layout with purple gradient theme
- ✅ Clear visual hierarchy with show title and game title
- ✅ Easy access to edit and delete actions via emoji buttons
- ✅ Prominent "+ Add Show" button with good color contrast
- ✅ Consistent spacing and card sizing
- ✅ Bingo card interface is clean and functional with good visual feedback

### Critical Issues

#### 1. Truncated Show Names (HIGH PRIORITY)
**Problem**: Long show names like "Toddlers and Tiaras" are truncated to "Toddlers and Ti..." making identification difficult.

**Impact**: 
- Users cannot see full show names without clicking
- Reduces scannability and quick identification
- Poor information scent for navigation

**Affected Shows in Current Data**:
- "Toddlers and Tiaras" → "Toddlers and Ti..."
- Any future shows with names >17-18 characters will have this issue

#### 2. Lack of View Options (MEDIUM PRIORITY)
**Problem**: Only card view is available. No alternative layout for different user preferences or use cases.

**Impact**:
- Users who prefer density cannot see more items at once
- No accommodation for different browsing patterns (scanning vs. exploring)
- Limited accessibility options for users with different visual preferences

#### 3. Limited Information Density (MEDIUM PRIORITY)
**Problem**: Cards only show title and game title, not phrase count or last modified date.

**Impact**:
- Cannot quickly assess which shows need more phrases
- Cannot identify recently worked-on shows
- No visual indicator of show "completeness"

## Proposed Solution

### Implementation Plan

#### Phase 1: Card View Enhancements (MUST HAVE)
**Goal**: Fix truncation issues and improve information display in existing card view

##### 1.1 Full Title Display
- [x] **Task 1.1.1**: Implement multi-line title support in card view ✅ COMPLETED
  - Allow titles to wrap to 2-3 lines maximum
  - Add `text-overflow` handling for extremely long titles (>50 chars)
  - Ensure cards maintain consistent height or use flexible heights
  - **Acceptance**: "Toddlers and Tiaras" displays fully without truncation
  - **Implementation**: Used `-webkit-line-clamp: 3` with flexbox for show titles and 2 lines for game titles

- [x] **Task 1.1.2**: Add tooltip on hover for full text ✅ COMPLETED
  - Display full show title and game title in tooltip
  - Implement with 300ms delay
  - Style consistently with app theme
  - **Acceptance**: Hovering any show card shows complete information
  - **Implementation**: Added `title` attribute to card with full show and game title

##### 1.2 Enhanced Card Metadata
- [x] **Task 1.2.1**: Add phrase count badge to cards ✅ COMPLETED
  - Display "X phrases" in subtitle area or badge
  - Use visual indicator (e.g., "25 phrases" in light text)
  - Color-code based on completeness: <10 phrases (yellow), 10-24 (orange), 25+ (green)
  - **Acceptance**: Each card shows phrase count with color coding
  - **Implementation**: Added styled phrase count badge with three status levels (low/medium/complete) using background colors and borders

- [x] **Task 1.2.2**: Add visual "complete" indicator ✅ COMPLETED
  - Show checkmark or badge for shows with 25+ phrases
  - Subtle visual differentiation for "ready to play" shows
  - **Acceptance**: Shows with 25+ phrases have visible indicator
  - **Implementation**: Added green checkmark (✓) with glow effect for shows with 25+ phrases

#### Phase 2: List View Implementation (SHOULD HAVE)
**Goal**: Provide alternative high-density view option

##### 2.1 List View Component
- [ ] **Task 2.1.1**: Create list view component
  - Table or list layout with columns: Title, Game Title, Phrase Count, Actions
  - Sortable columns (title, phrase count)
  - Full text display for all fields
  - Consistent action buttons (edit/delete) aligned right
  - **Acceptance**: List view shows all shows with complete information visible

- [ ] **Task 2.1.2**: Implement responsive list design
  - Stack columns on mobile (title + actions visible, metadata as subtitle)
  - Full table on tablet/desktop
  - Touch-friendly row heights on mobile (min 48px)
  - **Acceptance**: List view is usable on all screen sizes

##### 2.2 View Toggle Control
- [ ] **Task 2.2.1**: Add view toggle buttons
  - Icon toggle between grid/list views (cards icon vs. list icon)
  - Position in header next to "TV Shows" title or near "+ Add Show"
  - Persist user preference in localStorage
  - Smooth transition between views (no flash)
  - **Acceptance**: Users can switch views, preference is remembered

- [ ] **Task 2.2.2**: Keyboard accessibility for view toggle
  - Tab-accessible toggle button
  - Keyboard shortcut (e.g., Ctrl/Cmd + Shift + V)
  - Screen reader announces current view
  - **Acceptance**: Toggle is fully keyboard accessible with ARIA labels

#### Phase 3: Enhanced Features (NICE TO HAVE)
**Goal**: Additional improvements for power users

##### 3.1 Search and Filter
- [ ] **Task 3.1.1**: Add search bar
  - Real-time search by show title or game title
  - Clear/reset button
  - Keyboard shortcut to focus (Ctrl/Cmd + K or /)
  - Show "No results" state with clear button
  - **Acceptance**: Can find shows by typing partial names

- [ ] **Task 3.1.2**: Add filter options
  - Filter by phrase count ranges (<10, 10-24, 25+)
  - Filter by recently modified (if timestamp added)
  - Combine with search (AND logic)
  - Visual indicators for active filters
  - **Acceptance**: Can filter shows by completeness status

##### 3.2 Sorting Controls
- [ ] **Task 3.2.1**: Add sort dropdown or buttons
  - Sort by: Name (A-Z, Z-A), Phrase Count (high-low, low-high), Date Added
  - Default: Name (A-Z)
  - Persist sort preference
  - Clear visual indication of active sort
  - **Acceptance**: Shows can be sorted by multiple criteria

##### 3.3 Bulk Actions
- [ ] **Task 3.3.1**: Add multi-select capability
  - Checkbox selection mode toggle
  - Select all / deselect all controls
  - Bulk delete action with confirmation
  - Visual feedback for selected items
  - **Acceptance**: Can select and delete multiple shows at once

## Design Specifications

### Card View (Enhanced)

```
┌─────────────────────────────────┐
│ Show Title (Full, 2-3 lines)   │ ← Multi-line with wrapping
│ Game Title Subtitle             │
│ 25 phrases ✓                    │ ← New: phrase count + indicator
│                        [✏️] [🗑️] │
└─────────────────────────────────┘
```

### List View (New)

```
┌──────────────────────────────────────────────────────────────┐
│ Show Title          │ Game Title      │ Phrases │ Actions    │
├──────────────────────────────────────────────────────────────┤
│ Toddlers and Tiaras │ Blingo          │ 25 ✓    │ [✏️] [🗑️] │
│ North Woods Law     │ On Patrol       │ 25 ✓    │ [✏️] [🗑️] │
│ The Office          │ That's What...  │ 15 ⚠    │ [✏️] [🗑️] │
└──────────────────────────────────────────────────────────────┘
```

### View Toggle Location

**Option A**: Header with Title (Recommended)
```
TV Shows                                    [🔲 Grid] [☰ List]  [+ Add Show]
```

**Option B**: Floating Control
```
                                                      ┌─────────┐
TV Shows                                    [+ Add Show] │ [🔲] [☰] │
                                                      └─────────┘
```

### Mobile Responsiveness

#### Card View Mobile
- 1 column layout (full width cards)
- Maintain multi-line titles
- Slightly reduce padding for more content visibility

#### List View Mobile
- Compact rows (title + phrase count + actions)
- Game title moves to subtitle under main title
- Swipe gesture for delete (optional enhancement)

## Technical Implementation Notes

### Component Structure

```
ShowsList.vue
├── ViewToggle.vue (new)
├── SearchBar.vue (new, Phase 3)
├── FilterControls.vue (new, Phase 3)
├── ShowsGridView.vue (enhanced existing)
│   └── ShowCard.vue (enhanced)
└── ShowsListView.vue (new)
    └── ShowListItem.vue (new)
```

### Data Requirements

**Existing Data** (Available):
- `id`: Show ID
- `title`: Show title
- `gameTitle`: Game title
- `phrases`: Array of phrase objects
- `centerSquare`: Center square text

**Needed Additions**:
- `phrases.length` (computed from existing data)
- `createdAt` (optional, for sorting) - would require backend change
- `updatedAt` (optional, for "recently modified") - would require backend change

### State Management

```typescript
interface ViewPreferences {
  viewMode: 'grid' | 'list';
  sortBy: 'title' | 'phraseCount' | 'dateAdded';
  sortDirection: 'asc' | 'desc';
  filters: {
    phraseCountRange?: 'low' | 'medium' | 'high';
    searchQuery?: string;
  };
}
```

Store in `localStorage` as `tvBingo.viewPreferences`.

### CSS Considerations

- Use CSS Grid for both layouts (easier responsive transitions)
- Card view: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- List view: `grid-template-columns: 2fr 1fr auto auto` (desktop)
- Transition: `opacity` fade when switching views
- Use `line-clamp` for title truncation with ellipsis after max lines

### Accessibility

- View toggle: ARIA role="group" with label "View options"
- Each toggle button: `aria-pressed` state
- Card titles: Full text in `aria-label` even if visually truncated
- List view: `role="table"` with proper headers
- Keyboard navigation: Arrow keys in list view, Tab in grid view
- Screen reader announces: "Showing X shows in [grid/list] view"

## Testing Criteria

### Unit Tests
- [ ] ShowCard renders multi-line titles correctly
- [ ] Phrase count calculation is accurate
- [ ] ViewToggle emits correct events
- [ ] ShowsListView sorts correctly
- [ ] localStorage persistence works

### Integration Tests
- [ ] Switching views maintains data state
- [ ] Search filters shows correctly
- [ ] Sorting persists across page reloads
- [ ] Edit/Delete work in both views

### Visual Regression Tests
- [ ] Card view with long titles
- [ ] Card view with short titles
- [ ] List view desktop layout
- [ ] List view mobile layout
- [ ] View transition animation

### Manual Testing Checklist
- [ ] Test with show names of varying lengths (5-50 chars)
- [ ] Verify phrase count badges show correct colors
- [ ] Test view toggle on different screen sizes
- [ ] Verify localStorage persistence
- [ ] Test keyboard navigation in both views
- [ ] Test with screen reader
- [ ] Test with 1, 5, 10, 50 shows
- [ ] Verify hover states and tooltips
- [ ] Test edit/delete in both views

## Success Metrics

### User Experience
- **Primary**: Users can see full show titles without clicking
- **Primary**: Users can switch between grid and list views
- Users can quickly identify shows needing more phrases
- Reduced clicks to find a specific show (via search/sort)

### Technical
- View switching completes in <100ms
- No layout shift when toggling views
- Lighthouse accessibility score remains 95+
- No console errors or warnings

### Performance
- List view renders 100+ shows without lag
- Search filtering responds in <50ms
- localStorage operations don't block UI
- Smooth transitions (60fps) between views

## Implementation Priority

### P0 (Critical - Do First)
1. Task 1.1.1: Multi-line title support in cards
2. Task 1.2.1: Phrase count badge

### P1 (High - Phase 2)
3. Task 2.1.1: List view component
4. Task 2.2.1: View toggle implementation

### P2 (Medium - Phase 3)
5. Task 3.1.1: Search functionality
6. Task 3.2.1: Sorting controls

### P3 (Nice to Have)
7. Task 1.1.2: Hover tooltips
8. Task 3.1.2: Filter options
9. Task 3.3.1: Bulk actions

## Timeline Estimate

- **Phase 1** (Card Enhancements): 1-2 days
  - Multi-line titles: 3-4 hours
  - Phrase count badges: 2-3 hours
  - Testing and polish: 2-3 hours

- **Phase 2** (List View): 2-3 days
  - List view component: 4-6 hours
  - View toggle: 2-3 hours
  - Responsive design: 3-4 hours
  - Testing: 2-3 hours

- **Phase 3** (Enhanced Features): 3-4 days
  - Search: 3-4 hours
  - Filters: 3-4 hours
  - Sorting: 2-3 hours
  - Bulk actions: 4-5 hours
  - Testing and polish: 4-5 hours

**Total Estimated Effort**: 6-9 days for all phases

## Open Questions

1. Should we limit title display to a max character count (e.g., 100 chars) even with wrapping?
2. Do we need to add `createdAt`/`updatedAt` timestamps to the backend schema?
3. Should list view be the default for desktop users (higher information density)?
4. Do we want to persist the last viewed show when returning to the list?
5. Should we add a "favorites" or "recently played" feature?
6. Do we need export functionality (CSV/PDF of show list)?

## References

- Current Implementation: `/vue-tvbingo/src/components/ShowsList.vue`
- API: `/spring-tvbingo/src/main/java/org/bomartin/tvbingo/controller/ShowController.java`
- Design System: App uses purple gradient theme (#4a148c to #7b1fa2 range)
- Testing Spec: `/specs/TESTING.md`

## Revision History

| Date       | Version | Author         | Changes                    |
|------------|---------|----------------|----------------------------|
| 2026-01-28 | 1.0     | UX Evaluation  | Initial requirements draft |
