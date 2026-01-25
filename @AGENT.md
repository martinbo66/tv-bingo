# Agent Build Instructions

## Project Overview

TV Bingo is a monorepo with:
- **spring-tvbingo/** - Spring Boot backend (Java 21)
- **vue-tvbingo/** - Vue.js frontend (TypeScript + Vite)

All commands run from the repository root using the Gradle wrapper.

## Project Setup

```bash
# Install all dependencies (backend + frontend)
./gradlew frontendInstall

# Backend dependencies are handled automatically by Gradle
```

## Running Tests

```bash
# Run all tests (backend + frontend type checking)
./gradlew test

# Backend tests only (15 tests with embedded Postgres)
./gradlew backendTest

# Frontend TypeScript type checking
./gradlew frontendTypeCheck

# Verbose backend test output
./gradlew :spring-tvbingo:test --info
```

## Build Commands

```bash
# Build everything (backend JAR + frontend dist)
./gradlew build

# Backend only
./gradlew backendBuild

# Frontend only
./gradlew frontendBuild

# Clean all build artifacts
./gradlew clean

# Full CI pipeline (clean + build + test)
./gradlew ci
```

## Development Server

```bash
# Start Spring Boot backend (http://localhost:8080)
./gradlew bootRun

# Start Vue.js dev server (http://localhost:5173)
./gradlew frontendDev

# Or use npm directly for frontend
cd vue-tvbingo && npm run dev
```

## Environment Variables

Backend requires PostgreSQL:
```bash
export TVBINGO_DB_URL=jdbc:postgresql://localhost:5432/tvbingo?currentSchema=tvbingo_schema
export TVBINGO_DB_USERNAME=tvbingo_user
export TVBINGO_DB_PASSWORD=your_password
```

Frontend (optional):
```bash
export VITE_API_BASE_URL=http://localhost:8080
```

## Key Learnings

- Backend tests use embedded Postgres - no external database needed for testing
- Frontend currently has TypeScript checking but no unit tests (Vitest planned)
- The `idb` (IndexedDB) dependency was removed - frontend uses REST API
- Run `./gradlew showTasks` to see all available tasks with descriptions

## Feature Development Quality Standards

**CRITICAL**: All new features MUST meet the following mandatory requirements before being considered complete.

### Testing Requirements

- **Minimum Coverage**: 85% code coverage ratio required for all new code
- **Test Pass Rate**: 100% - all tests must pass, no exceptions
- **Test Types Required**:
  - Unit tests for all business logic and services
  - Integration tests for API endpoints or main functionality
  - End-to-end tests for critical user workflows
- **Coverage Validation**: Run coverage reports before marking features complete:
  ```bash
  # Backend (JaCoCo - add to build.gradle if not present)
  ./gradlew :spring-tvbingo:test :spring-tvbingo:jacocoTestReport

  # Frontend (when Vitest is configured)
  cd vue-tvbingo && npm run test:coverage
  ```
- **Test Quality**: Tests must validate behavior, not just achieve coverage metrics
- **Test Documentation**: Complex test scenarios must include comments explaining the test strategy

### Git Workflow Requirements

Before moving to the next feature, ALL changes must be:

1. **Committed with Clear Messages**:
   ```bash
   git add .
   git commit -m "feat(module): descriptive message following conventional commits"
   ```
   - Use conventional commit format: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, etc.
   - Include scope when applicable: `feat(api):`, `fix(ui):`, `test(auth):`
   - Write descriptive messages that explain WHAT changed and WHY

2. **Pushed to Remote Repository**:
   ```bash
   git push origin <branch-name>
   ```
   - Never leave completed features uncommitted
   - Push regularly to maintain backup and enable collaboration
   - Ensure CI/CD pipelines pass before considering feature complete

3. **Branch Hygiene**:
   - Work on feature branches, never directly on `main`
   - Branch naming convention: `feature/<feature-name>`, `fix/<issue-name>`, `docs/<doc-update>`
   - Create pull requests for all significant changes

4. **Ralph Integration**:
   - Update @fix_plan.md with new tasks before starting work
   - Mark items complete in @fix_plan.md upon completion
   - Update PROMPT.md if development patterns change
   - Test features work within Ralph's autonomous loop

### Documentation Requirements

**ALL implementation documentation MUST remain synchronized with the codebase**:

1. **Code Documentation**:
   - Java: Javadoc for public APIs
   - TypeScript: JSDoc for exported functions
   - Update inline comments when implementation changes
   - Remove outdated comments immediately

2. **Implementation Documentation**:
   - Update relevant sections in this AGENT.md file
   - Keep build and test commands current
   - Update configuration examples when defaults change
   - Document breaking changes prominently

3. **README Updates**:
   - Keep feature lists current
   - Update setup instructions when dependencies change
   - Maintain accurate command examples
   - Update version compatibility information

4. **AGENT.md Maintenance**:
   - Add new build patterns to relevant sections
   - Update "Key Learnings" with new insights
   - Keep command examples accurate and tested
   - Document new testing patterns or quality gates

### Feature Completion Checklist

Before marking ANY feature as complete, verify:

- [ ] All tests pass: `./gradlew test`
- [ ] Code coverage meets 85% minimum threshold
- [ ] Coverage report reviewed for meaningful test quality
- [ ] Backend compiles: `./gradlew backendBuild`
- [ ] Frontend type checks: `./gradlew frontendTypeCheck`
- [ ] All changes committed with conventional commit messages
- [ ] All commits pushed to remote repository
- [ ] @fix_plan.md task marked as complete
- [ ] Implementation documentation updated
- [ ] Inline code comments updated or added
- [ ] AGENT.md updated (if new patterns introduced)
- [ ] Breaking changes documented
- [ ] Features tested within Ralph loop (if applicable)
- [ ] CI/CD pipeline passes: `./gradlew ci`

### Rationale

These standards ensure:
- **Quality**: High test coverage and pass rates prevent regressions
- **Traceability**: Git commits and @fix_plan.md provide clear history of changes
- **Maintainability**: Current documentation reduces onboarding time and prevents knowledge loss
- **Collaboration**: Pushed changes enable team visibility and code review
- **Reliability**: Consistent quality gates maintain production stability
- **Automation**: Ralph integration ensures continuous development practices

**Enforcement**: AI agents should automatically apply these standards to all feature development tasks without requiring explicit instruction for each task.
