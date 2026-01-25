# TV Bingo

A web application for creating custom bingo cards for TV shows. Users can define common phrases, catchphrases, and recurring moments for their favorite shows, then generate randomized 5x5 bingo cards to play while watching.

## Project Structure

```
tv-bingo/
├── spring-tvbingo/     # Spring Boot backend (Java 21)
├── vue-tvbingo/        # Vue.js frontend (TypeScript + Vite)
├── specs/              # Product requirements and specifications
├── build.gradle        # Root Gradle build (orchestrates both projects)
└── settings.gradle     # Gradle settings with subprojects
```

## Prerequisites

- **Java 21** (for backend)
- **Node.js 18+** and npm (for frontend)
- **PostgreSQL 15+** (for production database)
- **Gradle 8.x** (wrapper included)

## Quick Start

```bash
# Show available Gradle tasks
./gradlew showTasks

# Build everything
./gradlew build

# Run all tests
./gradlew test

# Full CI pipeline (clean + build + test)
./gradlew ci
```

## Development

### Backend (Spring Boot)

```bash
# Run the Spring Boot application
./gradlew bootRun

# Build backend only
./gradlew backendBuild

# Run backend tests only
./gradlew backendTest
```

The backend requires PostgreSQL. Set these environment variables:
- `TVBINGO_DB_URL` - Database connection URL
- `TVBINGO_DB_USERNAME` - Database username
- `TVBINGO_DB_PASSWORD` - Database password

API documentation available at `http://localhost:8080/swagger-ui.html` when running.

### Frontend (Vue.js)

```bash
# Start Vite dev server (http://localhost:5173)
./gradlew frontendDev

# Build frontend for production
./gradlew frontendBuild

# Run TypeScript type checking
./gradlew frontendTypeCheck

# Install npm dependencies
./gradlew frontendInstall
```

Or use npm directly:
```bash
cd vue-tvbingo
npm install
npm run dev
```

## CI/CD

The root Gradle build provides unified tasks for CI/CD:

| Task | Description |
|------|-------------|
| `./gradlew ci` | Full CI pipeline (clean + build + test) |
| `./gradlew ciBackend` | CI for backend only |
| `./gradlew ciFrontend` | CI for frontend only |
| `./gradlew build` | Build both projects |
| `./gradlew test` | Run all tests |
| `./gradlew clean` | Clean all build artifacts |

## Tech Stack

### Backend
- Java 21
- Spring Boot 3.5.x
- Spring Data JDBC
- PostgreSQL with Liquibase migrations
- SpringDoc OpenAPI

### Frontend
- Vue 3 (Composition API)
- TypeScript 5.x
- Vite 5.x
- Vue Router

## Documentation

See `specs/tv-bingo-prd.md` for the complete product requirements document.
