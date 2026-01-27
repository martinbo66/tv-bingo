# Bingo Card Page Improvements

Tracking progress on bingo card UX improvements.

## High Priority Changes

| Change | Status |
|--------|--------|
| Mobile responsiveness | Complete |
| Dismiss BINGO alert | Complete |
| Reset Marks button | Complete |

---

## 1. Mobile Responsiveness

**Goal:** Make the bingo card usable on mobile devices (phones and small tablets).

**Current Problem:**
- Cells are too small on narrow screens (375px width)
- Text wraps badly making phrases unreadable
- Grid doesn't adapt well to portrait orientation

**Implementation:**
- [x] Improve CSS grid to scale cells appropriately on mobile
- [x] Reduce font size and padding proportionally
- [x] Smaller gaps on narrow screens (6px tablet, 4px phone)
- [x] Test at 375px (iPhone SE) and 390px (iPhone 14) widths
- [x] Tap targets remain accessible (min 32px cells)

---

## 2. Dismiss BINGO Alert

**Goal:** Allow users to dismiss the BINGO celebration overlay.

**Current Problem:**
- BINGO alert appears when a line is completed
- No way to dismiss it - blocks interaction with the card
- Users can't continue playing or see their winning line clearly

**Implementation:**
- [x] Add click-to-dismiss on the overlay
- [x] Add a close button (X) for clarity
- [x] Added "Click anywhere to dismiss" hint text
- [x] Keep winning cells highlighted after dismissal

---

## 3. Reset Marks Button

**Goal:** Allow users to clear all marked cells without regenerating a new card.

**Current Problem:**
- To start fresh, users must regenerate which shuffles all phrases
- Sometimes you want to replay the same card layout

**Implementation:**
- [x] Add "Reset Marks" button near "Regenerate" button
- [x] Clear all selected cells except center square (free space)
- [x] Style consistently with existing buttons (orange gradient)
- [x] No confirmation needed (easy to re-mark)

---

## Medium Priority Changes

| Change | Status |
|--------|--------|
| Confirm regenerate when marks exist | Pending |
| Marked cell counter | Pending |
| Better text overflow handling | Pending |

### 4. Confirm Regenerate When Marks Exist

**Goal:** Prevent accidental loss of game progress.

**Implementation:**
- [ ] Show confirmation dialog if any cells are marked (beyond center)
- [ ] "Are you sure? This will shuffle all phrases and clear your progress."
- [ ] Skip confirmation if no cells marked

### 5. Marked Cell Counter

**Goal:** Show progress toward bingo.

**Implementation:**
- [ ] Display "X/25 marked" or "X marked" somewhere on the page
- [ ] Update in real-time as cells are toggled

### 6. Better Text Overflow Handling

**Goal:** Handle long phrases gracefully without breaking layout.

**Implementation:**
- [ ] Truncate very long text with ellipsis
- [ ] Show full text on hover (tooltip)
- [ ] Consider smaller font for longer phrases

---

## Lower Priority Changes

| Change | Status |
|--------|--------|
| Accessibility improvements | Pending |
| Click animation feedback | Pending |
| Print functionality | Pending |

### 7. Accessibility Improvements

**Goal:** Make the bingo card usable with screen readers.

**Implementation:**
- [ ] Add aria-label to each cell with phrase and state
- [ ] Add aria-pressed for toggle state
- [ ] Announce bingo win to screen readers
- [ ] Keyboard navigation support

### 8. Click Animation Feedback

**Goal:** Provide satisfying visual feedback when marking cells.

**Implementation:**
- [ ] Brief scale or ripple animation on click
- [ ] Subtle color transition

### 9. Print Functionality

**Goal:** Allow users to print bingo cards for offline play.

**Implementation:**
- [ ] Add print button
- [ ] Print-friendly CSS (hide buttons, white background)

---

## Progress Log

- **2026-01-27:** Created tracking document, starting implementation
- **2026-01-27:** Completed all three high priority changes:
  - Mobile responsiveness: Improved CSS for 375px-400px screens with smaller fonts/gaps
  - Dismiss BINGO alert: Added close button (X) and click-anywhere-to-dismiss
  - Reset Marks button: Added orange button to clear marks without regenerating card

## Files Modified

- `vue-tvbingo/src/pages/BingoCard.vue` - Main implementation
