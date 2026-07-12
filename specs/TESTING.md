# TV Bingo Testing Strategy & Progress

This document tracks the testing plan for the TV Bingo monorepo: current coverage, gaps, and remaining work.

## Table of Contents
- [Overview](#overview)
- [Current Test Coverage](#current-test-coverage)
- [Testing Infrastructure](#testing-infrastructure)
- [Implementation Phases](#implementation-phases)
- [Running Tests](#running-tests)
- [Test File Organization](#test-file-organization)

---

## Overview

**Total Tests:** 379 unit/integration + Playwright e2e (verified 2026-07-12)
- **Backend:** 107 tests (JUnit 5 + Spring Boot Test)
- **Frontend unit/component:** 272 tests (Vitest + Vue Test Utils)
- **E2E:** Playwright (`@readonly` + `@destructive`); not wired into `./gradlew ci` yet

**Frontend coverage (v8):** ~83% statements / ~78% branches / ~79% functions / ~83% lines

**Testing Goal:** Achieve comprehensive coverage across all layers:
- Unit tests for business logic
- Integration tests for API endpoints
- Component tests for Vue UI
- End-to-end tests for critical user flows (still outstanding)

---

## Current Test Coverage

### Backend Tests ✅ WELL COVERED (107 tests)

#### ShowServiceTest.java (9 tests)
**Location:** `spring-tvbingo/src/test/java/org/bomartin/tvbingo/service/`

**Coverage:**
- ✅ createShow() - saves and returns show
- ✅ createShow() - rejects duplicate title
- ✅ getShow(id) - retrieves existing show
- ✅ getShow(id) - returns empty when not found
- ✅ getAllShows() - returns all shows
- ✅ updateShow() - updates and returns show
- ✅ updateShow() - throws for null ID / not found / duplicate title
- ✅ deleteShow() - deletes show

#### ShowRepositoryTest.java (7 tests)
**Location:** `spring-tvbingo/src/test/java/org/bomartin/tvbingo/repository/`

**Coverage:**
- ✅ Full CRUD operations
- ✅ Custom query methods (`existsByShowTitle`, `existsByShowTitleExceptId`)
- ✅ Database constraints

#### ShowControllerIntegrationTest.java (31 tests)
**Location:** `spring-tvbingo/src/test/java/org/bomartin/tvbingo/controller/`

**Coverage:**
- ✅ POST /api/shows - valid, minimal, validation errors, duplicates, malformed JSON
- ✅ GET /api/shows - list all (with data, empty)
- ✅ GET /api/shows/{id} - exists, not found
- ✅ PUT /api/shows/{id} - valid, validation, duplicates, same title
- ✅ DELETE /api/shows/{id} - success, not found, verification

#### Exception & Validation
- ✅ `GlobalExceptionHandlerTest.java` (9 tests)
- ✅ `UniqueShowTitleValidatorTest.java` (5 tests)
- ✅ `ValidPhrasesValidatorTest.java` (12 tests)

#### Configuration & Contract
- ✅ `WebConfigTest.java` (5 tests) — CORS
- ✅ `SpaWebConfigTest.java` (4 tests) — SPA forwarding
- ✅ `ApiContractTest.java` (8 tests) — response shape / OpenAPI alignment

#### Edge Cases, Concurrency & Performance
- ✅ `EdgeCaseTests.java` (9 tests) — long strings, large arrays, special chars, injection/XSS attempts
- ✅ `ConcurrentIntegrationTests.java` (1 test) — concurrent create race
- ✅ `PerformanceTests.java` (5 tests) — load, large dataset, query timing, memory

#### Smoke / Migration
- ✅ `TvbingoApplicationTests.java` (1 test) — context loads
- ✅ `ShowsIdSequenceMigrationTest.java` (1 test)

---

### Frontend Tests ✅ WELL COVERED (272 tests, 12 files)

All tests pass via Vitest (`npm run test:run` / `./gradlew frontendTest`).

#### Pages
| File | Tests | Coverage highlights |
|------|------:|---------------------|
| `BingoCard.spec.ts` | 30 | Loading/errors, 5×5 grid, shuffle, cell select, all 12 win lines, navigation |
| `BingoCard.edge-cases.spec.ts` | 20 | 24 / 1000+ phrases, timeouts, rapid clicks, storage, resize, touch/a11y |

#### Components
| File | Tests | Coverage highlights |
|------|------:|---------------------|
| `ShowsList.spec.ts` | 46 | Views, localStorage prefs, edit/delete, sort, search/filter, keyboard hints |
| `ShowDetail.spec.ts` | 21 | Load/error, save happy path, 400/409/404/generic errors, cancel + unsaved, phrases |
| `CreateShow.spec.ts` | 15 | Submit blocked/success, validation, cancel + unsaved, phrase list help |
| `PhraseListManager.spec.ts` | 44 | Render, add/delete/edit, sort, counts, bulk add |
| `FormFieldWithValidation.spec.ts` | 27 | Required/maxLength/custom validators, counters, blur behavior |

#### Services, Router, Composables, Bootstrap
| File | Tests | Coverage highlights |
|------|------:|---------------------|
| `apiClient.spec.ts` | 27 | ApiError, GET/POST/PUT/DELETE, HTTP + network errors, edge cases |
| `showService.spec.ts` | 16 | CRUD URLs/bodies, `searchShowsByTitle` filtering |
| `router/index.spec.ts` | 11 | Route defs, params, navigation, hash mode, unknown routes |
| `useUnsavedChangesGuard.spec.ts` | 13 | Dirty tracking, `markClean`, beforeunload, router confirm |
| `main.spec.ts` | 2 | Mount when `#app` exists; error when missing |

#### Frontend gaps (unit/component)
- ❌ Near-zero coverage: `Toast.vue`, `CreateShowPage.vue`
- ❌ Partial: some `ShowDetail` / `ShowsList` branches; `formValidation.ts` helpers
- ❌ No real-browser E2E (see Phase 4.2)

---

## Testing Infrastructure

### Backend
- **Framework:** JUnit 5
- **Spring Support:** Spring Boot Test, MockMvc, TestRestTemplate (concurrency)
- **Database:** Embedded Postgres (Zonky)
- **Mocking:** Mockito
- **Configuration:** `application-test.yml`
- **Run:** `./gradlew backendTest`

### Frontend
- **Framework:** Vitest 4.x
- **Vue Testing:** @vue/test-utils 2.x
- **Environment:** jsdom
- **Coverage:** `@vitest/coverage-v8` (text, json, html, lcov)
- **Reports:** JUnit XML → `vue-tvbingo/test-results/junit.xml`
- **Configuration:** `vue-tvbingo/vitest.config.ts`
- **Run:** `./gradlew frontendTest` or `npm run test:run`

### CI/CD
- `./gradlew ci` runs clean, build, backend + frontend tests, type-check, lint, coverage, Sonar
- GitHub Actions publishes JUnit results from `**/build/test-results/**/*.xml` and `vue-tvbingo/test-results/**/*.xml`
- Frontend coverage artifact: `vue-tvbingo/coverage/`

### Unified Commands
```bash
./gradlew test     # Run all tests (frontend + backend)
./gradlew check    # Run all verification tasks
./gradlew ci       # Full CI pipeline
```

---

## Implementation Phases

### ✅ Phase 1: Critical Foundation (COMPLETED)

**Status:** ✅ Complete (BingoCard + apiClient foundation; counts grew slightly since first landing)

1. ✅ Vitest infrastructure setup
2. ✅ BingoCard.vue tests (30) + edge cases (20)
3. ✅ apiClient.ts tests (27)
4. ✅ Gradle + CI integration

---

### ✅ Phase 2: Component & Service Tests (COMPLETED)

**Status:** ✅ Complete — frontend Phase 2 suites land well above the original ~60–80 estimate.

#### 2.1 Vue Component Tests ✅
- ✅ `ShowsList.spec.ts` (46) — includes search/filter/sort/view persistence
- ✅ `CreateShow.spec.ts` (15)
- ✅ `ShowDetail.spec.ts` (21) — under `components/__tests__/`, not `pages/`
- ✅ Shared UI: `PhraseListManager` (44), `FormFieldWithValidation` (27)

#### 2.2 Service Layer ✅
- ✅ `showService.spec.ts` (16)

#### 2.3 Backend Exception / Validation ✅
- ✅ `GlobalExceptionHandlerTest` (9)
- ✅ `UniqueShowTitleValidatorTest` (5)
- ✅ `ValidPhrasesValidatorTest` (12) — added after original Phase 2.3 plan

Also in place beyond the original Phase 2 list:
- ✅ `useUnsavedChangesGuard.spec.ts` (13)
- ✅ `main.spec.ts` (2)

---

### ✅ Phase 3: Configuration & Integration (COMPLETED)

**Status:** ✅ Complete

- ✅ WebConfig (5), SpaWebConfig (4), ApiContract (8)
- ✅ Vue Router (11)

---

### 🔄 Phase 4: Advanced & E2E (PARTIALLY COMPLETE)

**Priority:** LOWER for remaining polish / CI wiring  
**Status:** Phase 4.1 ✅, Phase 4.2 ✅ (tooling + suites), Phase 4.3 ✅

#### 4.1 Edge Case Tests ✅
- ✅ Backend `EdgeCaseTests` (9) + `ConcurrentIntegrationTests` (1)
- ✅ Frontend `BingoCard.edge-cases.spec.ts` (20)

#### 4.2 End-to-End Tests ✅ TOOLING + SUITES

**Runner:** Playwright (Chromium), config at `vue-tvbingo/playwright.config.ts`  
**Base URL:** `E2E_BASE_URL` (default `http://localhost:8080`) — app must already be running (`bootRun` / Docker)  
**API URL (destructive helpers):** `E2E_API_BASE_URL` (default `http://localhost:8080`) — required when the UI is served from Vite (`http://localhost:5173`) so setup/teardown does not hit the Vite server  
**Tags:** `@readonly` (non-destructive) vs `@destructive` (create/edit/delete with cleanup)

| Gradle task | npm script | Scope |
|-------------|------------|--------|
| **`./gradlew frontendE2eReadonly`** | `test:e2e:readonly` | Non-destructive only (safe default) |
| `./gradlew frontendE2eDestructive` | `test:e2e:destructive` | Mutating flows |
| `./gradlew frontendE2e` | `test:e2e` | All e2e |

**Read-only** (`vue-tvbingo/e2e/readonly/`) — uses Liquibase baseline shows; never mutates data:
- ✅ Shows list loads + view toggle
- ✅ Search / clear / no-results (phrase filters when `enablePhraseCountFilter` is on)
- ✅ Bingo card grid, regenerate, mark/reset, BINGO line
- ✅ Navigation: list ↔ card; edit cancel; create leave without submit

**Destructive** (`vue-tvbingo/e2e/destructive/`) — unique titles; API cleanup; never deletes baseline IDs 1–7:
- ✅ Create show via UI
- ✅ Edit title via UI
- ✅ Open bingo card for created show
- ✅ Delete with confirm / cancel delete

**Still nice-to-have (not implemented):**
- [ ] Error recovery (network failure → retry)
- [ ] Multiple browser tabs
- [ ] Mobile / multi-browser matrix
- [ ] Accessibility (axe / screen reader)
- [ ] CI job that boots the app then runs `frontendE2eReadonly`

**Browsers:** `npx playwright install chromium` (once per machine)

#### 4.3 Performance Tests ✅
- ✅ `PerformanceTests.java` (5) — concurrent load, large dataset, query timing, memory

**Test data strategy (backend performance / integration):**
- Programmatic setup per test; `@BeforeEach` clears data
- Large datasets only inside tests that need them
- Embedded Postgres isolates each run

---

## Shows List Search & Filter

Most search/filter behaviors are covered by `ShowsList.spec.ts` (automated). Remaining value of the checklist below is **manual / visual / device** verification.

### Manual / Device Checklist (supplemental)

1. **Search** — real-time filter, clear button focus, Ctrl/Cmd+K and `/` focus, Esc clears
2. **Filters** — `<10`, `10–24`, `25+`, All; active styling
3. **Combined** — search + filter AND logic; Clear All
4. **Views** — filters persist across grid ↔ list
5. **Mobile** — full-width search/filters, 48px touch targets
6. **A11y** — tab order, focus rings, screen reader smoke check

---

## Running Tests

### All Tests
```bash
./gradlew test          # Frontend + Backend tests
./gradlew check         # Full verification (tests + type checking + lint)
./gradlew ci            # Complete CI pipeline
```

### Backend Only
```bash
./gradlew backendTest
./gradlew :spring-tvbingo:test
./gradlew :spring-tvbingo:test --info
```

### Frontend Only
```bash
./gradlew frontendTest
./gradlew frontendCoverage
cd vue-tvbingo && npm run test:run
cd vue-tvbingo && npm run test        # watch mode
cd vue-tvbingo && npm run test:ui
cd vue-tvbingo && npm run test:coverage
```

### E2E (Playwright — app must be running)
```bash
# Safe / non-destructive (preferred)
./gradlew frontendE2eReadonly
# or: cd vue-tvbingo && npm run test:e2e:readonly

./gradlew frontendE2eDestructive   # mutating
./gradlew frontendE2e              # all

# Optional overrides:
#   E2E_BASE_URL=http://localhost:5173 E2E_API_BASE_URL=http://localhost:8080 ./gradlew frontendE2eReadonly
# Browsers (once): cd vue-tvbingo && npx playwright install chromium
```

### Specific Test Files
```bash
# Backend (from root)
./gradlew :spring-tvbingo:test --tests ShowControllerIntegrationTest

# Frontend (from vue-tvbingo)
npm run test:run -- BingoCard.spec.ts
npm run test:run -- apiClient.spec.ts
```

### Coverage Reports
```bash
# Backend (JaCoCo)
./gradlew :spring-tvbingo:jacocoTestReport
# Report: spring-tvbingo/build/reports/jacoco/test/html/index.html

# Frontend
cd vue-tvbingo && npm run test:coverage
# Report: vue-tvbingo/coverage/index.html

# Both
./gradlew coverage
```

---

## Test File Organization

### Backend Structure
```
spring-tvbingo/src/test/java/org/bomartin/tvbingo/
├── TvbingoApplicationTests.java              # 1 — context load
├── EdgeCaseTests.java                        # 9
├── ConcurrentIntegrationTests.java           # 1
├── ShowsIdSequenceMigrationTest.java         # 1
├── controller/
│   └── ShowControllerIntegrationTest.java    # 31
├── service/
│   └── ShowServiceTest.java                  # 9
├── repository/
│   └── ShowRepositoryTest.java               # 7
├── exception/
│   └── GlobalExceptionHandlerTest.java       # 9
├── validation/
│   ├── UniqueShowTitleValidatorTest.java     # 5
│   └── ValidPhrasesValidatorTest.java        # 12
├── config/
│   ├── WebConfigTest.java                    # 5
│   └── SpaWebConfigTest.java                 # 4
├── contract/
│   └── ApiContractTest.java                  # 8
└── performance/
    └── PerformanceTests.java                 # 5
```

### Frontend Structure
```
vue-tvbingo/src/
├── __tests__/
│   └── main.spec.ts                              # 2
├── pages/__tests__/
│   ├── BingoCard.spec.ts                         # 30
│   └── BingoCard.edge-cases.spec.ts              # 20
├── components/__tests__/
│   ├── ShowsList.spec.ts                         # 46
│   ├── ShowDetail.spec.ts                        # 21
│   └── CreateShow.spec.ts                        # 15
├── components/common/__tests__/
│   ├── PhraseListManager.spec.ts                 # 44
│   └── FormFieldWithValidation.spec.ts           # 27
├── services/__tests__/
│   ├── apiClient.spec.ts                         # 27
│   └── showService.spec.ts                       # 16
├── router/__tests__/
│   └── index.spec.ts                             # 11
└── composables/__tests__/
    └── useUnsavedChangesGuard.spec.ts            # 13
```

### E2E Structure
```
vue-tvbingo/
├── playwright.config.ts
└── e2e/
    ├── readonly/
    │   ├── shows-list.spec.ts
    │   ├── search-filter.spec.ts
    │   ├── bingo-card.spec.ts
    │   └── navigation.spec.ts
    ├── destructive/
    │   ├── create-show.spec.ts
    │   └── edit-delete-show.spec.ts
    ├── fixtures/
    │   └── baseline-shows.ts
    └── support/
        ├── selectors.ts
        └── cleanup.ts
```

---

## Testing Best Practices

### General Principles
1. **Arrange-Act-Assert:** Clear setup, execution, verification
2. **Test Isolation:** No dependence on other tests
3. **Mock External Dependencies:** API, DB, browser APIs as needed
4. **Descriptive Names:** Name the behavior under test
5. **One Assertion Focus:** Prefer one behavior per test

### Backend Testing
- Use `@SpringBootTest` for integration tests
- Use embedded Postgres for database tests
- Prefer `TestRestTemplate` for concurrent HTTP (MockMvc is not thread-safe for that)
- Clean data with `@BeforeEach` / `@Sql`
- Use `MockMvc` for typical HTTP request/response tests

### Frontend Testing
- Use `mount()` for full component testing
- Use `flushPromises()` for async work
- Mock Vue Router and services
- Stub children when focusing on the parent
- Prefer user interactions over implementation details

### CI/CD Integration
- All unit/integration tests must pass before merge
- Use `./gradlew ci` for full verification
- Coverage thresholds (future): 80% for critical paths
- Frontend suite typically finishes in ~2s locally

---

## Progress Tracking

### Phase 1: Critical Foundation ✅
- [x] Vitest setup
- [x] BingoCard.vue tests (+ edge cases)
- [x] apiClient.ts tests
- **Status:** COMPLETE

### Phase 2: Component & Service Tests ✅
- [x] ShowsList.vue tests (46)
- [x] CreateShow.vue tests (15)
- [x] ShowDetail.vue tests (21)
- [x] showService.ts tests (16)
- [x] PhraseListManager / FormFieldWithValidation / unsaved-changes / main
- [x] GlobalExceptionHandler tests (9)
- [x] UniqueShowTitleValidator tests (5)
- [x] ValidPhrasesValidator tests (12)
- **Status:** COMPLETE

### Phase 3: Configuration & Integration ✅
- [x] WebConfig tests (5)
- [x] SpaWebConfig tests (4)
- [x] Router tests (11)
- [x] API Contract tests (8)
- **Status:** COMPLETE

### Phase 4: Advanced & E2E ✅ (CI wiring optional)
- [x] Backend edge cases + concurrency
- [x] Frontend edge cases (20)
- [x] E2E Playwright (`@readonly` + `@destructive`) + Gradle tasks
- [ ] Wire `frontendE2eReadonly` into CI (needs app bootstrap)
- [x] Performance tests (5)
- **Status:** Suites complete; CI integration still open

---

## Next Steps

1. **CI:** Boot app/DB in Actions, then run `./gradlew frontendE2eReadonly`
2. **Coverage polish (optional):** `Toast.vue`, `CreateShowPage.vue`, remaining ShowDetail/ShowsList branches
3. Keep this doc in sync when adding suites or changing infrastructure

---

## Maintenance

Update this document when:
- New tests are added or counts change materially
- Test infrastructure changes
- Priorities shift
- A phase completes
- Gaps are discovered

**Last Updated:** 2026-07-12 (Playwright e2e: readonly + destructive; `frontendE2eReadonly` Gradle task)  
**Next Review:** After CI wires `frontendE2eReadonly`
