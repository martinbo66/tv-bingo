# CLAUDE.md

This file provides guidance to Claude Code when working with the TV Bingo monorepo.

**IMPORTANT:** Always read and follow the global rules at `~/.claude/claude.md` before taking any actions. These rules apply to ALL projects and must be followed without exception.

## Project Overview

TV Bingo is a web application for creating custom bingo cards for TV shows. Users define phrases and recurring moments for their favorite shows, then generate randomized 5x5 bingo cards to play while watching.

## Monorepo Structure

```
tv-bingo/
├── spring-tvbingo/     # Spring Boot backend (Java 21)
├── vue-tvbingo/        # Vue.js frontend (TypeScript + Vite)
├── specs/              # PRD and specifications
│   └── tv-bingo-prd.md # Complete product requirements
├── build.gradle        # Root Gradle orchestration
├── settings.gradle     # Multi-project configuration
├── Dockerfile          # Multi-stage Docker build
└── .dockerignore       # Docker build exclusions
```

## Deployment Architecture

For production, the app is deployed as a **single container**:
- The Vue frontend is built and copied into Spring Boot's `/static/` resources
- Spring Boot serves both the API (`/api/**`) and the frontend (all other routes)
- `SpaWebConfig.java` handles Vue Router's history mode by forwarding non-API routes to `index.html`

This eliminates the need for a separate web server or reverse proxy in simple deployments.

## Technology Stack

### Backend (spring-tvbingo)
- Java 21
- Spring Boot 3.5.x
- Spring Data JDBC
- PostgreSQL with Liquibase migrations
- SpringDoc OpenAPI for API documentation
- Embedded Postgres for tests

### Frontend (vue-tvbingo)
- Vue 3 (Composition API with `<script setup>`)
- TypeScript 5.x
- Vite 5.x
- Vue Router

## Common Development Commands

All commands run from the repository root:

```bash
# Show available tasks
./gradlew showTasks

# Build everything
./gradlew build

# Run all tests
./gradlew test

# Full CI pipeline
./gradlew ci

# Run backend
./gradlew bootRun

# Start frontend dev server
./gradlew frontendDev
```

### Backend-specific
```bash
./gradlew bootRun           # Run the Spring Boot application
./gradlew backendBuild      # Build backend only
./gradlew backendTest       # Run backend tests only
./gradlew :spring-tvbingo:test --info  # Verbose test output

# Note: Backend commands must be run from the repository root, not from spring-tvbingo/
```

### Frontend-specific
```bash
./gradlew frontendInstall   # Install npm dependencies
./gradlew frontendBuild     # Build for production
./gradlew frontendTypeCheck # TypeScript type checking
./gradlew frontendLint      # Run ESLint

# Or use npm directly from vue-tvbingo/:
cd vue-tvbingo
npm install
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run type-check   # TypeScript type checking
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check Prettier formatting
```

### Docker / Deployment
```bash
./gradlew buildUnifiedJar   # Build JAR with frontend embedded
./gradlew dockerBuild       # Build Docker image
./gradlew dockerRun         # Run Docker container

# Or use Docker directly:
docker build -t tv-bingo .
docker run -p 8080:8080 -e TVBINGO_DB_PASSWORD=xxx tv-bingo
```

## Semantic Versioning

The project uses Git tags for semantic versioning via the [axion-release-plugin](https://github.com/allegro/axion-release-plugin). Versions are automatically derived from Git tags and applied to:
- JAR artifacts (e.g., `spring-tvbingo-1.2.3.jar`)
- Docker images (e.g., `tv-bingo:1.2.3`, `tv-bingo:latest`)

### Version Format

- **Release builds** (tagged commits on main): `1.2.3`
- **Development builds** (untagged commits): `0.1.0-branch-name-SNAPSHOT`
- **Tags**: Use the `v` prefix (e.g., `v1.2.3`)

### Common Versioning Commands

```bash
# Check current version
./gradlew currentVersion

# Build with versioned artifacts
./gradlew buildUnifiedJar    # Creates spring-tvbingo-{version}.jar
./gradlew dockerBuild        # Creates tv-bingo:{version} and tv-bingo:latest
```

### Creating a Release

To create a new release version:

```bash
# 1. Ensure you're on the main branch with all changes committed
git checkout main
git pull origin main

# 2. Check current version
./gradlew currentVersion

# 3. Create an annotated tag (use semantic versioning: MAJOR.MINOR.PATCH)
git tag -a v1.0.0 -m "Release 1.0.0

Features:
- Feature 1
- Feature 2

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 4. Verify the version changed
./gradlew currentVersion    # Should show "1.0.0"

# 5. Build release artifacts
./gradlew build
./gradlew dockerBuild       # Creates tv-bingo:1.0.0 and tv-bingo:latest

# 6. Push the tag to GitHub
git push origin v1.0.0
```

### Semantic Versioning Guidelines

Follow [semver.org](https://semver.org/) principles:

- **MAJOR** (v2.0.0): Breaking changes to the API or database schema
- **MINOR** (v1.1.0): New features, backward-compatible
- **PATCH** (v1.0.1): Bug fixes, backward-compatible

Examples:
```bash
# Initial release
git tag -a v1.0.0 -m "Release 1.0.0: Initial public release"

# Adding new feature (backward-compatible)
git tag -a v1.1.0 -m "Release 1.1.0: Add show search feature"

# Bug fix
git tag -a v1.1.1 -m "Release 1.1.1: Fix bingo card generation bug"

# Breaking change (e.g., API changes)
git tag -a v2.0.0 -m "Release 2.0.0: Refactor API endpoints (breaking change)"
```

### Version in Development

On feature branches, the version automatically includes the branch name:
```bash
# On branch "bo/build-improvements"
./gradlew currentVersion
# Output: 0.1.0-bo-build-improvements-SNAPSHOT
```

This ensures development builds are clearly distinguished from releases.

### Docker Image Tagging Strategy

The `dockerBuild` task creates two tags:
1. **Version tag**: `tv-bingo:{version}` (e.g., `tv-bingo:1.2.3`)
2. **Latest tag**: `tv-bingo:latest`

This allows for:
- **Pinned deployments**: `docker run tv-bingo:1.2.3`
- **Rolling deployments**: `docker run tv-bingo:latest`

### CI/CD Integration

In CI/CD pipelines, versioning happens automatically:
```bash
# On main branch with tag v1.2.3
./gradlew currentVersion  # Returns: 1.2.3
./gradlew dockerBuild     # Creates: tv-bingo:1.2.3, tv-bingo:latest

# On feature branch without tag
./gradlew currentVersion  # Returns: 0.1.0-feature-name-SNAPSHOT
./gradlew dockerBuild     # Creates: tv-bingo:0.1.0-feature-name-SNAPSHOT, tv-bingo:latest
```

## Configuration

### Backend Database Configuration

The backend requires PostgreSQL with these environment variables:
- `TVBINGO_DB_URL` - Connection URL (e.g., `jdbc:postgresql://localhost:5432/tvbingo?currentSchema=tvbingo_schema`)
- `TVBINGO_DB_USERNAME` - Database username
- `TVBINGO_DB_PASSWORD` - Database password

Tests use embedded Postgres automatically.

### Frontend Environment Variables

The frontend uses Vite for environment variable management. Create `.env.local` in `vue-tvbingo/` for local development:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

In production builds, the frontend is bundled into Spring Boot's static resources and served from the same origin, so no separate API URL configuration is needed.

### SonarCloud Configuration

The project uses the Gradle SonarQube plugin for code quality analysis with SonarCloud.

**Required Environment Variable:**
- `SONAR_TOKEN` - SonarCloud authentication token (get from https://sonarcloud.io/account/security)

**Local Development with direnv:**

Create a `.envrc` file in the project root:
```bash
export SONAR_TOKEN=your_token_here
```

Then run `direnv allow` to enable the environment variable.

**Running SonarCloud Analysis:**

```bash
# Run SonarCloud analysis only
./gradlew sonar

# Run full CI pipeline (includes SonarCloud analysis)
./gradlew ci
```

**CI/CD Integration:**

The `ci` task runs the complete CI pipeline including SonarCloud analysis:
1. Clean
2. Build (frontend + backend)
3. Test (all tests)
4. Lint (Checkstyle + ESLint)
5. Coverage (JaCoCo report)
6. SonarCloud analysis

In GitHub Actions, set the `SONAR_TOKEN` as a repository secret and use:
```yaml
- name: Run CI with SonarCloud
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  run: ./gradlew ci
```

## API Documentation

When the backend is running: http://localhost:8080/swagger-ui.html

Key endpoints:
- `GET /api/shows` - List all shows
- `POST /api/shows` - Create a show
- `GET /api/shows/{id}` - Get show details
- `PUT /api/shows/{id}` - Update a show
- `DELETE /api/shows/{id}` - Delete a show

## Architecture

### Backend Package Structure
```
org.bomartin.tvbingo/
├── config/          # Spring configuration (CORS, SPA routing, etc.)
│   ├── WebConfig.java       # CORS configuration for development
│   └── SpaWebConfig.java    # Serves Vue SPA and handles client-side routing
├── controller/      # REST endpoints
│   └── ShowController.java  # REST API at /api/shows
├── dto/             # Data Transfer Objects
│   └── ShowRequest.java
├── exception/       # Global exception handling
│   └── GlobalExceptionHandler.java
├── model/           # Domain entities
│   └── Show.java            # Core domain entity
├── repository/      # Data access layer
│   └── ShowRepository.java  # Spring Data JDBC repository
├── service/         # Business logic
│   └── ShowService.java     # Show management business logic
├── validation/      # Custom validators
│   ├── UniqueShowTitle.java
│   └── UniqueShowTitleValidator.java
└── TvbingoApplication.java  # Main application class
```

Key components:
- **Show**: Core domain entity with title, phrases, and bingo card data
- **ShowController**: REST API endpoints for show CRUD operations
- **ShowService**: Business logic for show management
- **ShowRepository**: Spring Data JDBC repository interface
- **Liquibase**: Schema management in `src/main/resources/db/changelog/`
- **GlobalExceptionHandler**: Consistent error responses across the API

### Frontend Structure
```
vue-tvbingo/src/
├── components/      # Reusable Vue components
│   ├── CreateShow.vue
│   ├── ShowDetail.vue
│   └── ShowsList.vue
├── pages/           # Page-level components
│   ├── BingoCard.vue
│   └── CreateShowPage.vue
├── services/        # API client services
│   ├── apiClient.ts      # Base HTTP client
│   └── showService.ts    # Show-specific API methods
├── types/           # TypeScript type definitions
│   └── Show.ts
├── router/          # Vue Router configuration
├── assets/          # Static assets
├── App.vue          # Root component
└── main.ts          # Application entry point
```

## Development Standards

### Code Style
- **Java**:
  - Standard Java conventions
  - Lombok for boilerplate reduction (@Data, @RequiredArgsConstructor, etc.)
  - Jakarta Bean Validation annotations for input validation
  - Custom validators for business rules (e.g., @UniqueShowTitle)
  - Checkstyle for linting (configured in Spring Boot project)
- **TypeScript/Vue**:
  - ESLint with Vue, TypeScript, and Prettier plugins
  - Prettier for code formatting (no semicolons, single quotes, 100 char line width)
  - TypeScript strict mode enabled
  - Run `npm run lint` to check code style
  - Run `npm run lint:fix` to auto-fix issues
  - Run `npm run format` to format code with Prettier
- **Vue**: Composition API with `<script setup lang="ts">`
  - Use scoped CSS in components
  - Group imports as: Vue → external → local → types
  - Allow single-word component names (disabled multi-word rule)

### Naming Conventions
- Java classes: PascalCase
- Vue components: PascalCase files
- TypeScript interfaces: PascalCase
- Database tables: snake_case, plural
- API endpoints: kebab-case, plural nouns

### Testing
- Backend: JUnit 5, Embedded Postgres for integration tests
- Frontend: Vitest (planned), TypeScript type checking

## Git Commit Guidelines

### Commit Message Format

Follow conventional commit style:
- Start with a verb in imperative mood (e.g., "Add", "Fix", "Update", "Remove")
- Keep the first line under 72 characters
- Add a blank line, then detailed description if needed
- Always end with the co-authored-by line

### Creating Commits

**DO:**
```bash
git commit -m "Fix test configuration for CI environment

Add @ActiveProfiles(\"test\") annotation to ensure tests use
embedded Postgres instead of connecting to localhost database.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**DON'T:**
- ❌ Use heredoc syntax (`cat <<EOF`) inside git commit commands - this can capture ANSI escape sequences
- ❌ Use echo with special characters that might be interpreted
- ❌ Include unprintable characters or color codes in commit messages

### Example Workflow

```bash
# Stage changes
git add path/to/file

# Commit with clean message
git commit -m "Add feature X

Detailed description of the changes.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to remote
git push
```

### Fixing Bad Commits

If a commit contains escape sequences or unprintable characters:

```bash
# Amend the last commit with a clean message
git commit --amend -m "Clean commit message here"

# Force push (only if not yet merged to main)
git push --force-with-lease
```

## Product Requirements

See `specs/tv-bingo-prd.md` for:
- Complete feature specifications
- User stories with acceptance criteria
- API contracts
- Data models
