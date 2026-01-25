# CLAUDE.md - Spring Boot Backend

This file provides guidance for working with the TV Bingo Spring Boot backend.

> **Note:** This is a subproject of the tv-bingo monorepo. See the root `CLAUDE.md` for full project context.

## Technology Stack

- **Spring Boot 3.5.x** with Java 21
- **Spring Data JDBC** for database operations
- **PostgreSQL** with Liquibase migrations
- **Gradle** build system (wrapper at root)
- **Lombok** for boilerplate reduction
- **SpringDoc OpenAPI** for API documentation
- **Embedded Postgres** for testing

## Development Commands

Run from the **repository root** (not this directory):

```bash
# Run the application
./gradlew bootRun

# Run tests
./gradlew backendTest

# Build only
./gradlew backendBuild

# Verbose test output
./gradlew :spring-tvbingo:test --info
```

## Database Configuration

Environment variables required:
- `TVBINGO_DB_URL` - Database connection URL
- `TVBINGO_DB_USERNAME` - Database username
- `TVBINGO_DB_PASSWORD` - Database password

Tests use embedded Postgres automatically.

## Package Structure

```
org.bomartin.tvbingo/
├── config/          # Spring configuration (CORS, etc.)
├── controller/      # REST endpoints
├── dto/             # Data Transfer Objects
├── exception/       # Global exception handling
├── model/           # Domain entities
├── repository/      # Data access layer
├── service/         # Business logic
└── validation/      # Custom validators
```

## Key Components

- **Show**: Core domain entity with title, phrases, and bingo card data
- **ShowController**: REST API at `/api/shows`
- **ShowService**: Business logic for show management
- **ShowRepository**: Spring Data JDBC repository
- **Liquibase**: Schema management in `src/main/resources/db/changelog/`

## API Documentation

Available at http://localhost:8080/swagger-ui.html when running.

## Validation

- Jakarta Bean Validation annotations
- Custom `@UniqueShowTitle` validator for business rules
- Global exception handler for consistent error responses

## Testing

- Embedded Postgres for database integration tests
- JUnit 5 test framework
- Separate test configuration in `application-test.yml`
