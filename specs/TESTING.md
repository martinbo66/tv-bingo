# TV Bingo Testing Strategy & Progress

This document tracks the comprehensive testing plan for the TV Bingo monorepo, including current coverage, gaps, and implementation roadmap.

## Table of Contents
- [Overview](#overview)
- [Current Test Coverage](#current-test-coverage)
- [Testing Infrastructure](#testing-infrastructure)
- [Implementation Phases](#implementation-phases)
- [Running Tests](#running-tests)
- [Test File Organization](#test-file-organization)

---

## Overview

**Total Tests:** 129 (as of Phase 2.3 Backend + Phase 3 Frontend)
- **Backend:** 63 tests (JUnit 5 + Spring Boot Test)
- **Frontend:** 66 tests (Vitest + Vue Test Utils)

**Testing Goal:** Achieve comprehensive coverage across all layers:
- Unit tests for business logic
- Integration tests for API endpoints
- Component tests for Vue UI
- End-to-end tests for critical user flows

---

## Current Test Coverage

### Backend Tests ✅ WELL COVERED

#### ShowServiceTest.java (Unit Tests - 7 tests)
**Location:** `spring-tvbingo/src/test/java/org/bomartin/tvbingo/service/`

**Coverage:**
- ✅ createShow() - saves and returns show
- ✅ getShow(id) - retrieves existing show
- ✅ getShow(id) - returns empty when not found
- ✅ getAllShows() - returns all shows
- ✅ updateShow() - updates and returns show
- ✅ updateShow() - throws exception for null ID
- ✅ deleteShow() - deletes show

**Gaps:**
- ❌ No tests for duplicate title validation logic
- ❌ No tests for repository failure scenarios
- ❌ No tests for empty phrases list edge cases

#### ShowRepositoryTest.java (Integration Tests - 7 tests)
**Location:** `spring-tvbingo/src/test/java/org/bomartin/tvbingo/repository/`

**Coverage:**
- ✅ Full CRUD operations
- ✅ Custom query methods (existsByShowTitle, existsByShowTitleExceptId)
- ✅ Database constraints

**Gaps:**
- ❌ Concurrent access scenarios
- ❌ Transaction rollback testing
- ❌ Data integrity violations

#### ShowControllerIntegrationTest.java (REST API Tests - 18 tests)
**Location:** `spring-tvbingo/src/test/java/org/bomartin/tvbingo/controller/`

**Coverage:**
- ✅ POST /api/shows - all scenarios (valid, minimal, validation errors, duplicates, malformed JSON)
- ✅ GET /api/shows - list all (with data, empty)
- ✅ GET /api/shows/{id} - get one (exists, not found)
- ✅ PUT /api/shows/{id} - update (valid, validation, duplicates, same title)
- ✅ DELETE /api/shows/{id} - delete (success, not found, verification)

**Gaps:**
- ❌ Concurrent request handling
- ❌ Large payload testing
- ❌ Special characters in phrases
- ❌ Extremely long strings
- ❌ Very large phrase counts (>100)

#### TvbingoApplicationTests.java (Smoke Test - 1 test)
**Location:** `spring-tvbingo/src/test/java/org/bomartin/tvbingo/`

**Coverage:**
- ✅ Application context loads

---

### Frontend Tests ✅ PHASE 1 COMPLETE

#### BingoCard.spec.ts (Component Tests - 28 tests)
**Location:** `vue-tvbingo/src/pages/__tests__/`

**Coverage:**
- ✅ Loading and error states (loading, invalid ID, not found, insufficient phrases, navigation)
- ✅ Grid generation (5x5 grid, center square, FREE SPACE, regeneration)
- ✅ Fisher-Yates shuffle algorithm verification
- ✅ Cell selection (toggle, auto-select center, deselect, reset)
- ✅ Win detection - all 12 combinations (5 rows, 5 columns, 2 diagonals)
- ✅ Multiple winning lines, incomplete rows
- ✅ Navigation (back to list, edit on click)

#### apiClient.spec.ts (API Client Tests - 27 tests)
**Location:** `vue-tvbingo/src/services/__tests__/`

**Coverage:**
- ✅ ApiError class (constructor, properties, error data)
- ✅ HTTP methods (GET, POST, PUT, DELETE)
- ✅ Success cases (JSON parsing, empty responses, header merging)
- ✅ HTTP errors (400, 401, 404, 409, 500 with error data)
- ✅ Network errors (failures, timeouts, DNS errors)
- ✅ Edge cases (invalid JSON, empty base URL, TypeScript generics)

---

## Testing Infrastructure

### Backend
- **Framework:** JUnit 5
- **Spring Support:** Spring Boot Test, MockMvc
- **Database:** Embedded Postgres (Zonky)
- **Mocking:** Mockito
- **Configuration:** `application-test.yml`
- **Run:** `./gradlew backendTest`

### Frontend
- **Framework:** Vitest 4.x
- **Vue Testing:** @vue/test-utils 2.x
- **Environment:** jsdom (for DOM simulation)
- **Coverage:** v8 provider
- **Configuration:** `vue-tvbingo/vitest.config.ts`
- **Run:** `./gradlew frontendTest` or `npm run test`

### Unified Commands
```bash
./gradlew test     # Run all tests (frontend + backend)
./gradlew check    # Run all verification tasks
./gradlew ci       # Full CI pipeline (clean + build + test)
```

---

## Implementation Phases

### ✅ Phase 1: Critical Foundation (COMPLETED)

**Status:** ✅ 100% Complete (55 tests)

**Completed:**
1. ✅ Vitest infrastructure setup
2. ✅ BingoCard.vue tests (28 tests) - Most complex component
3. ✅ apiClient.ts tests (27 tests) - Foundation for all API calls

**Results:**
- All 55 frontend tests passing
- Integrated with Gradle build
- CI pipeline includes frontend tests

---

### 🔄 Phase 2: Component & Service Tests (SHORT-TERM)

**Priority:** HIGH
**Estimated Tests:** ~60-80 tests
**Status:** Backend Phase 2.3 Complete (13/13 tests) ✅

#### 2.1 Vue Component Tests

**ShowsList.vue** (~12 tests)
- `vue-tvbingo/src/components/__tests__/ShowsList.spec.ts`
  - [ ] Fetch and display shows on mount
  - [ ] Loading state display
  - [ ] Error state with retry button
  - [ ] Navigate to show details on click
  - [ ] Edit button navigation
  - [ ] Delete with confirmation dialog
  - [ ] Delete API call and list refresh
  - [ ] Empty state display ("No shows yet")
  - [ ] Show count display
  - [ ] Error message display
  - [ ] Retry after error
  - [ ] List updates after delete

**CreateShow.vue** (~10 tests)
- `vue-tvbingo/src/components/__tests__/CreateShow.spec.ts`
  - [ ] Form input binding (showTitle, gameTitle, centerSquare)
  - [ ] Phrase array management (add phrase)
  - [ ] Remove phrase functionality
  - [ ] Form submission
  - [ ] Event emission with form data
  - [ ] Form reset after submission
  - [ ] Remove button disabled when only 1 phrase
  - [ ] Required field validation
  - [ ] Empty phrase prevention
  - [ ] Form state management

**ShowDetail.vue** (~15 tests)
- `vue-tvbingo/src/pages/__tests__/ShowDetail.spec.ts`
  - [ ] Load show on mount using route params
  - [ ] Display show data in form
  - [ ] Edit form fields (all inputs)
  - [ ] Add phrase to existing list
  - [ ] Remove phrase from list
  - [ ] Save button triggers API call
  - [ ] Error handling and display
  - [ ] Field-specific error messages (400 responses)
  - [ ] Duplicate title conflict handling (409)
  - [ ] Navigation after successful save
  - [ ] Cancel button navigation
  - [ ] Loading state during save
  - [ ] Validation errors display
  - [ ] Success message after save
  - [ ] Navigate to bingo card after save

#### 2.2 Service Layer Tests

**showService.ts** (~10 tests)
- `vue-tvbingo/src/services/__tests__/showService.spec.ts`
  - [ ] getShows() returns array of shows
  - [ ] getShowById() fetches single show
  - [ ] addShow() creates new show
  - [ ] updateShow() updates existing show
  - [ ] deleteShow() removes show
  - [ ] searchShowsByTitle() filters by query (case-insensitive)
  - [ ] API error handling (all methods)
  - [ ] Network error handling
  - [ ] Empty results handling
  - [ ] API URL construction (env var)

#### 2.3 Backend Exception Handling Tests ✅

**GlobalExceptionHandler.java** (8 tests) ✅
- `spring-tvbingo/src/test/java/org/bomartin/tvbingo/exception/GlobalExceptionHandlerTest.java`
  - ✅ handleValidationExceptions() formats errors to map
  - ✅ Validation exception returns 400 status
  - ✅ Multiple validation errors in response
  - ✅ handleIllegalArgumentException() returns proper error
  - ✅ IllegalArgumentException returns 400 status
  - ✅ handleDataIntegrityViolation() handles DB constraints
  - ✅ DataIntegrityViolation returns 409 status
  - ✅ Error response format consistency

**UniqueShowTitleValidator.java** (5 tests) ✅
- `spring-tvbingo/src/test/java/org/bomartin/tvbingo/validation/UniqueShowTitleValidatorTest.java`
  - ✅ isValid() returns true for unique title
  - ✅ isValid() returns false for duplicate title
  - ✅ isValid() returns true for null title (handled by @NotBlank)
  - ✅ Validator uses repository to check existence
  - ✅ Validator handles database errors gracefully

---

### ✅ Phase 3: Configuration & Integration Tests (COMPLETED)

**Priority:** MEDIUM
**Estimated Tests:** ~20-30 tests
**Status:** ✅ 100% Complete (28 tests - 17 backend + 11 frontend)

#### 3.1 Backend Configuration Tests

**WebConfig.java** (5 tests) ✅
- `spring-tvbingo/src/test/java/org/bomartin/tvbingo/config/WebConfigTest.java`
  - ✅ CORS headers set correctly for allowed origins
  - ✅ CORS allows credentials
  - ✅ CORS allows specified HTTP methods
  - ✅ CORS configuration applied to /api/** paths
  - ✅ CORS preflight requests handled (OPTIONS)

**SpaWebConfig.java** (4 tests) ✅
- `spring-tvbingo/src/test/java/org/bomartin/tvbingo/config/SpaWebConfigTest.java`
  - ✅ Non-API routes forward to index.html
  - ✅ API routes are not affected (/api/**)
  - ✅ Static resources served correctly
  - ✅ Vue Router history mode works

#### 3.2 Router Tests

**Vue Router** (11 tests) ✅
- `vue-tvbingo/src/router/__tests__/index.spec.ts`
  - ✅ Route definitions exist for all pages (home, show details, edit, create)
  - ✅ Route parameters work (id)
  - ✅ Navigation between routes (programmatic)
  - ✅ Hash history mode configured
  - ✅ Navigation guard executes
  - ✅ Unknown routes handled

#### 3.3 API Contract Tests

**API Contract Validation** (8 tests) ✅
- `spring-tvbingo/src/test/java/org/bomartin/tvbingo/contract/ApiContractTest.java`
  - ✅ Response format validation (JSON structure)
  - ✅ Error response structure consistent
  - ✅ Field type validation matches OpenAPI spec
  - ✅ Required fields present in responses
  - ✅ List response structure
  - ✅ Empty list response structure
  - ✅ Content-Type headers correct
  - ✅ Not found (404) response structure

**Results:**
- All 28 tests passing
- Integrated with Gradle build
- CI pipeline includes Phase 3 tests
- Backend: 17 tests (WebConfig: 5, SpaWebConfig: 4, ApiContract: 8)
- Frontend: 11 tests (Router)

---

### 🔄 Phase 4: Advanced & E2E Tests (NICE TO HAVE)

**Priority:** LOWER
**Estimated Tests:** ~20-40 tests

#### 4.1 Edge Case Tests

**Backend Edge Cases** (~10 tests)
- `spring-tvbingo/src/test/java/org/bomartin/tvbingo/EdgeCaseTests.java`
  - [ ] Very long show titles (>255 chars)
  - [ ] Very long phrases (>1000 chars)
  - [ ] Large phrase arrays (100+ items)
  - [ ] Special characters in titles (emoji, unicode)
  - [ ] SQL injection attempts in inputs
  - [ ] XSS attempts in phrase content
  - [ ] Null vs empty string handling
  - [ ] Whitespace-only titles
  - [ ] Concurrent duplicate title checks
  - [ ] Race condition in phrase updates

**Frontend Edge Cases** (~8 tests)
- Various spec files
  - [ ] Bingo card with exactly 24 phrases
  - [ ] Bingo card with 1000+ phrases
  - [ ] Network timeout handling
  - [ ] Rapid button clicking (debounce)
  - [ ] Browser back button behavior
  - [ ] LocalStorage/SessionStorage handling
  - [ ] Window resize on bingo grid
  - [ ] Touch events on mobile

#### 4.2 End-to-End Tests

**User Workflows** (~10-15 tests)
- `e2e/specs/` (using Playwright - available via MCP)
  - [ ] Complete flow: Create show → Add phrases → Generate card → Win
  - [ ] Edit existing show and verify changes
  - [ ] Delete show workflow with confirmation
  - [ ] Search and filter shows
  - [ ] Error recovery (network failure → retry)
  - [ ] Multiple browser tabs
  - [ ] Mobile responsive behavior
  - [ ] Accessibility (keyboard navigation, screen reader)
  - [ ] Performance (large datasets)
  - [ ] Session persistence

#### 4.3 Performance Tests

**Load & Performance** (~5 tests)
- `spring-tvbingo/src/test/java/org/bomartin/tvbingo/performance/`
  - [ ] Load test: 100 concurrent requests
  - [ ] Large dataset: 1000+ shows
  - [ ] Database query performance
  - [ ] Response time benchmarks
  - [ ] Memory usage under load

---

## Running Tests

### All Tests
```bash
./gradlew test          # Frontend + Backend tests
./gradlew check         # Full verification (tests + type checking)
./gradlew ci            # Complete CI pipeline
```

### Backend Only
```bash
./gradlew backendTest                    # All backend tests
./gradlew :spring-tvbingo:test          # Same
./gradlew :spring-tvbingo:test --info   # Verbose output
```

### Frontend Only
```bash
./gradlew frontendTest              # Via Gradle
cd vue-tvbingo && npm run test      # Direct npm
cd vue-tvbingo && npm run test:ui   # Interactive UI
cd vue-tvbingo && npm run test:coverage  # With coverage report
```

### Specific Test Files
```bash
# Backend (from root)
./gradlew :spring-tvbingo:test --tests ShowControllerIntegrationTest

# Frontend (from vue-tvbingo directory)
npm run test -- BingoCard.spec.ts
npm run test -- apiClient.spec.ts
```

### Watch Mode (Frontend)
```bash
cd vue-tvbingo
npm run test          # Runs in watch mode by default
```

### Coverage Reports
```bash
# Backend coverage (via JaCoCo)
./gradlew :spring-tvbingo:jacocoTestReport
# Report: spring-tvbingo/build/reports/jacoco/test/html/index.html

# Frontend coverage
cd vue-tvbingo && npm run test:coverage
# Report: vue-tvbingo/coverage/index.html
```

---

## Test File Organization

### Backend Structure
```
spring-tvbingo/src/test/java/org/bomartin/tvbingo/
├── TvbingoApplicationTests.java         # Context load test
├── controller/
│   └── ShowControllerIntegrationTest.java  # ✅ REST API tests
├── service/
│   └── ShowServiceTest.java             # ✅ Unit tests
├── repository/
│   └── ShowRepositoryTest.java          # ✅ Integration tests
├── exception/                            # ✅ CREATED (Phase 2.3)
│   └── GlobalExceptionHandlerTest.java
├── validation/                           # ✅ CREATED (Phase 2.3)
│   └── UniqueShowTitleValidatorTest.java
├── config/                               # ✅ CREATED (Phase 3)
│   ├── WebConfigTest.java
│   └── SpaWebConfigTest.java
└── contract/                             # ✅ CREATED (Phase 3)
    └── ApiContractTest.java
```

### Frontend Structure
```
vue-tvbingo/src/
├── pages/__tests__/
│   ├── BingoCard.spec.ts                # ✅ 28 tests (Phase 1)
│   └── ShowDetail.spec.ts               # ❌ TO CREATE (Phase 2)
├── components/__tests__/
│   ├── ShowsList.spec.ts                # ❌ TO CREATE (Phase 2)
│   └── CreateShow.spec.ts               # ❌ TO CREATE (Phase 2)
├── services/__tests__/
│   ├── apiClient.spec.ts                # ✅ 27 tests (Phase 1)
│   └── showService.spec.ts              # ❌ TO CREATE (Phase 2)
└── router/__tests__/
    └── index.spec.ts                     # ✅ 11 tests (Phase 3)
```

### E2E Tests Structure (Future)
```
e2e/
├── specs/
│   ├── create-show.spec.ts
│   ├── play-bingo.spec.ts
│   └── edit-delete-show.spec.ts
└── fixtures/
    └── test-data.json
```

---

## Testing Best Practices

### General Principles
1. **Arrange-Act-Assert:** Structure all tests with clear setup, execution, and verification
2. **Test Isolation:** Each test should be independent and not rely on other tests
3. **Mock External Dependencies:** Use mocks for API calls, database, and external services
4. **Descriptive Names:** Test names should clearly describe what is being tested
5. **One Assertion Focus:** Each test should verify one specific behavior

### Backend Testing
- Use `@SpringBootTest` for integration tests
- Use `@WebMvcTest` for controller-only tests
- Use embedded Postgres for database tests
- Clean up test data with `@BeforeEach` or `@Sql` scripts
- Use `MockMvc` for HTTP request/response testing

### Frontend Testing
- Use `mount()` for full component testing
- Use `flushPromises()` for async operations
- Mock Vue Router and external services
- Stub child components when testing parent components
- Test user interactions, not implementation details

### CI/CD Integration
- All tests must pass before merge
- Use `./gradlew ci` for full verification
- Coverage thresholds (future): 80% for critical paths
- Fast feedback: Unit tests < 5s, Integration < 30s

---

## Progress Tracking

### Phase 1: Critical Foundation ✅
- [x] Vitest setup
- [x] BingoCard.vue tests (28)
- [x] apiClient.ts tests (27)
- **Status:** COMPLETE (55 tests)

### Phase 2: Component & Service Tests 🔄
- [ ] ShowsList.vue tests (~12)
- [ ] CreateShow.vue tests (~10)
- [ ] ShowDetail.vue tests (~15)
- [ ] showService.ts tests (~10)
- [x] GlobalExceptionHandler tests (8) ✅
- [x] UniqueShowTitleValidator tests (5) ✅
- **Status:** Backend Phase 2.3 COMPLETE (13/60 tests)

### Phase 3: Configuration & Integration ✅
- [x] WebConfig tests (5)
- [x] SpaWebConfig tests (4)
- [x] Router tests (11)
- [x] API Contract tests (8)
- **Status:** COMPLETE (28/28 tests)

### Phase 4: Advanced & E2E 🔄
- [ ] Backend edge cases (~10)
- [ ] Frontend edge cases (~8)
- [ ] E2E workflows (~10-15)
- [ ] Performance tests (~5)
- **Status:** NOT STARTED (0/33 tests)

---

## Next Steps

**Immediate (Phase 2):**
1. Create ShowsList.vue tests
2. Create CreateShow.vue tests
3. Create ShowDetail.vue tests
4. Create showService.ts tests

**Short-term:**
5. Add exception handler tests
6. Add validator tests

**Medium-term:**
7. Configuration tests
8. API contract tests

**Long-term:**
9. E2E tests with Playwright
10. Performance benchmarking

---

## Maintenance

This document should be updated:
- When new tests are added
- When test infrastructure changes
- When priorities shift
- After each phase completion
- When gaps are discovered

**Last Updated:** 2026-01-27 (Phase 2.3 Backend Complete, Phase 3 Complete)
**Next Review:** After Phase 2 Frontend completion (2.1, 2.2)
