# Frontend Coverage Improvements

**Baseline (as of 2026-03-07):** 40% statements / 36% branches / 40% functions
**Target:** ~72% statements / ~68% branches / ~74% functions
**Tooling:** Vitest + @vue/test-utils + @vitest/coverage-v8
**Test pattern reference:** `src/components/__tests__/ShowsList.spec.ts`

---

## Status Legend

- [ ] Not started
- [x] Complete

---

## Task 1 — `showService.ts` tests

**File to create:** `src/services/__tests__/showService.spec.ts`
**Status:** [ ]
**Estimated coverage gain:** ~2–3% overall, 20% → ~100% for this file

### What to test

Mock `ApiClient.prototype.request` (or mock the `apiClient` instance) and verify each method calls the right URL, HTTP method, and request body:

| Method | URL | HTTP | Body |
|---|---|---|---|
| `getShows()` | `/api/shows` | GET | — |
| `getShowById(id)` | `/api/shows/${id}` | GET | — |
| `addShow(show)` | `/api/shows` | POST | `JSON.stringify(show)` |
| `updateShow(show)` | `/api/shows/${show.id}` | PUT | `JSON.stringify(show)` |
| `deleteShow(id)` | `/api/shows/${id}` | DELETE | — |
| `searchShowsByTitle(query)` | `/api/shows` (then filters) | GET | — |

Also test `searchShowsByTitle` filtering logic:
- Returns matching shows (case-insensitive)
- Returns empty array when no matches
- Partial match works (e.g., `"the"` matches `"The Office"`)

### Notes

- No DOM, no component mounting — pure unit tests
- Import `showService` from `../../services/showService`
- Use `vi.mock` or `vi.spyOn` on `ApiClient.prototype.request`

---

## Task 2 — `FormFieldWithValidation.vue` tests

**File to create:** `src/components/common/__tests__/FormFieldWithValidation.spec.ts`
**Status:** [ ]
**Estimated coverage gain:** ~3–4% overall, 9% → ~85% for this file

### What to test

Mount the component with `@vue/test-utils`. Props: `modelValue`, `label`, `id`, `required`, `maxLength`, `placeholder`, `helpText`, `validator`.

**Validation behavior (triggered on blur):**
- Required field with empty value → shows `"${label} is required"` error after blur
- Required field with whitespace-only value → same error
- Required field with valid value → no error
- `maxLength` exceeded → shows `"${label} must be ${maxLength} characters or less"`
- `maxLength` not exceeded → no error
- Custom `validator` prop is called and its return value is shown as the error

**Character counter:**
- `charCount` reflects `modelValue.length`
- Counter element visible only when `maxLength > 0`
- `over-limit` CSS class applied when `charCount > maxLength`

**Touch/dirty behavior:**
- Error NOT shown before blur (field not yet touched)
- Error shown after blur if invalid
- `validation-error` event emitted with the error string (or `undefined`)

**Aria attributes:**
- `aria-required` matches `required` prop
- `aria-invalid` is `true` only when touched + error
- `aria-describedby` points to error element when in error state, help element otherwise

**Input event:**
- `update:modelValue` emitted with new value on input

---

## Task 3 — `ShowDetail.vue` tests

**File to create:** `src/components/__tests__/ShowDetail.spec.ts`
**Status:** [ ]
**Estimated coverage gain:** ~10–12% overall, 3% → ~70% for this file

### Setup pattern

```ts
vi.mock('vue-router', () => ({ useRouter: vi.fn(() => ({ push: mockPush })) }))
vi.mock('../services/showService', () => ({ showService: { getShowById: vi.fn(), updateShow: vi.fn() } }))
vi.mock('../composables/useUnsavedChangesGuard', () => ({
  useUnsavedChangesGuard: vi.fn(() => ({ hasUnsavedChanges: ref(false), markClean: vi.fn(), setupGuards: vi.fn() }))
}))
```

Mount with `mount(ShowDetail, { props: { id: '1' } })` then `await flushPromises()`.

### Scenarios

**Loading state:**
- Shows loading spinner/text before `getShowById` resolves
- Loading state removed after promise resolves

**Fetch success:**
- Form renders with show data populated
- Optional fields (`gameTitle`, `centerSquare`) default to `''` when `undefined`/missing from API response

**Fetch error:**
- Shows error message when `getShowById` throws
- Does not render the form

**Save — happy path:**
- Calls `showService.updateShow` with a plain (non-reactive) copy of the show
- Calls `markClean()` after successful save
- Navigates to `'/'` via `router.push`

**Save — 400 validation error:**
- Sets `error.value` with formatted validation message
- Field-specific errors extracted into `fieldErrors` when field key matches

**Save — 409 conflict (duplicate title):**
- Sets `fieldErrors.showTitle = 'Show title must be unique'`
- Error message shown in the form

**Save — 404 not found:**
- Shows `'Show not found. It may have been deleted.'`

**Save — generic error:**
- Shows fallback error message

**Cancel — no unsaved changes:**
- `hasUnsavedChanges = false` → navigates to `'/'` immediately, no confirm dialog

**Cancel — unsaved changes:**
- `hasUnsavedChanges = true` → calls `window.confirm`
- User confirms → navigates to `'/'`
- User declines → stays on page

**Phrase update:**
- `handlePhrasesUpdate` updates `show.phrases` when `PhraseListManager` emits `update:phrases`

### Notes

- Stub child components (`FormFieldWithValidation`, `PhraseListManager`) to keep tests focused
- Use `vi.spyOn(window, 'confirm')` for the cancel-with-changes scenarios

---

## Task 4 — `CreateShow.vue` tests

**File to create:** `src/components/__tests__/CreateShow.spec.ts`
**Status:** [ ]
**Estimated coverage gain:** ~6–8% overall, 7% → ~75% for this file

### Setup pattern

```ts
vi.mock('../composables/useUnsavedChangesGuard', () => ({
  useUnsavedChangesGuard: vi.fn(() => ({ hasUnsavedChanges: ref(false), setupGuards: vi.fn() }))
}))
```

Mount with `mount(CreateShow)`. No router mock needed (uses `window.history.back()`).

### Scenarios

**Form submission — blocked cases:**
- Empty `showTitle` → `showCreated` not emitted
- Valid title but zero phrases → `showCreated` not emitted

**Form submission — success:**
- Valid title + at least one phrase → emits `showCreated` with `{ showTitle, phrases }`
- `gameTitle` included in payload only when non-empty
- `centerSquare` included in payload only when non-empty
- Payload with neither optional field → only `showTitle` and `phrases`

**Validation display:**
- `showTitleError` shown after attempted submit with empty title
- `validateShowTitle` returns `undefined` for valid non-empty string

**Cancel — no unsaved changes:**
- `hasUnsavedChanges = false` → calls `window.history.back()` immediately

**Cancel — unsaved changes:**
- `hasUnsavedChanges = true` → calls `window.confirm`
- User confirms → calls `window.history.back()`
- User declines → does nothing

**Phrase list:**
- `handlePhrasesUpdate` updates internal `phrases` ref when `PhraseListManager` emits

### Notes

- Stub `FormFieldWithValidation` and `PhraseListManager`
- Set phrases by directly emitting `update:phrases` on the stubbed `PhraseListManager`
- Check `wrapper.emitted('showCreated')` for emit assertions

---

## Task 5 — `useUnsavedChangesGuard.ts` tests

**File to create:** `src/composables/__tests__/useUnsavedChangesGuard.spec.ts`
**Status:** [ ]
**Estimated coverage gain:** ~2–3% overall, 0% → ~75% for this file

### What to test

Most logic can be tested by calling the composable directly inside a `withSetup` helper that runs inside a mounted component so Vue lifecycle hooks fire:

```ts
function withSetup<T>(composable: () => T): [T, ReturnType<typeof mount>] {
  let result!: T
  const app = mount({ setup() { result = composable(); return () => {} } })
  return [result, app]
}
```

**`hasUnsavedChanges` computed:**
- `false` when `currentData` equals `originalData`
- `true` when `currentData` differs from `originalData`
- Reactive: updates when refs change

**`markClean()`:**
- Sets `originalData.value` to a deep copy of `currentData.value`
- After calling, `hasUnsavedChanges` becomes `false`
- Subsequent changes to `currentData` make it `true` again (confirming deep copy, not reference)

**`handleBeforeUnload` (via `setupGuards`):**
- Does NOT call `e.preventDefault()` when `hasUnsavedChanges = false`
- Calls `e.preventDefault()` and sets `e.returnValue = ''` when `hasUnsavedChanges = true`
- Use `vi.spyOn(window, 'addEventListener')` to capture the handler, then call it manually

**`setupGuards` — router guard:**
- Mock `onBeforeRouteLeave` from `vue-router`
- Capture the registered callback
- Callback returns `false` (blocks navigation) when dirty and user cancels confirm
- Callback returns `undefined` (allows navigation) when dirty and user confirms
- Callback returns `undefined` when clean (no confirm shown)

---

## Task 6 — `PhraseListManager.vue` tests (secondary priority)

**File to create:** `src/components/common/__tests__/PhraseListManager.spec.ts`
**Status:** [ ]
**Estimated coverage gain:** ~5–7% overall, 7% → ~60% for this file

### What to test

Mount with a `phrases` prop array and verify `update:phrases` emissions.

**Add phrase (single):**
- Type into input, submit → emits updated array with new phrase appended
- Duplicate phrase → not added (or deduplication logic per component behavior)
- Empty/whitespace input → not added
- Phrase exceeding `maxPhraseLength` → shows validation error, not added

**Delete phrase:**
- Delete button on existing phrase → emits array without that phrase

**Inline edit (when `allowInlineEdit = true`):**
- Click phrase → enters edit mode
- Submit edit → emits updated array with phrase replaced
- Cancel edit → phrase unchanged

**Bulk add (when `showBulkAdd = true`):**
- Multi-line textarea → each non-empty line becomes a phrase
- Duplicates within bulk input → deduplicated
- Phrases already in list → skipped

**Sort behavior:**
- `autoSort = true` → `sortedPhrases` is alphabetically sorted regardless of insertion order
- `autoSort = false` → phrases displayed in insertion order

**Phrase count:**
- `phraseCount` computed reflects `props.phrases.length`

### Notes

- This is the largest and most complex component to test
- Consider splitting into multiple `describe` blocks matching feature areas
- Can defer bulk-add and inline-edit tests to a later pass; prioritize add/delete/sort

---

## Overall Expected Coverage After All Tasks

| Metric | Baseline | After Tasks 1–5 | After Task 6 |
|---|---|---|---|
| Statements | 40% | ~72% | ~77% |
| Branches | 36% | ~68% | ~73% |
| Functions | 40% | ~74% | ~79% |
