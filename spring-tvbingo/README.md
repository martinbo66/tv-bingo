# TV Bingo - Spring Boot Backend

REST API backend for the TV Bingo application.

> **Note:** This is a subproject of the tv-bingo monorepo. Run commands from the repository root.

## Features

- **Show Management**: CRUD operations for TV show bingo games
- **Dynamic Bingo Cards**: Generates 5x5 bingo cards with randomized phrases
- **Validation**: Unique show titles, field validation
- **Database Migrations**: Liquibase for schema management
- **API Documentation**: OpenAPI/Swagger UI

## Quick Start

From the repository root:

```bash
# Run the application
./gradlew bootRun

# Run tests
./gradlew backendTest

# Build
./gradlew backendBuild
```

## Environment Variables

```bash
export TVBINGO_DB_URL=jdbc:postgresql://localhost:5432/tvbingo?currentSchema=tvbingo_schema
export TVBINGO_DB_USERNAME=tvbingo_user
export TVBINGO_DB_PASSWORD=your_password
```

## API Endpoints

Base path: `/api/shows`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shows` | List all shows |
| POST | `/api/shows` | Create a show |
| GET | `/api/shows/{id}` | Get show details |
| PUT | `/api/shows/{id}` | Update a show |
| DELETE | `/api/shows/{id}` | Delete a show |

API documentation: http://localhost:8080/swagger-ui.html

## Tech Stack

- Java 21
- Spring Boot 3.5.x
- Spring Data JDBC
- PostgreSQL
- Liquibase
- SpringDoc OpenAPI
- Lombok
- Embedded Postgres (tests)

## Project Structure

```
src/main/java/org/bomartin/tvbingo/
├── config/          # Spring configuration
├── controller/      # REST endpoints
├── dto/             # Data Transfer Objects
├── exception/       # Exception handling
├── model/           # Domain entities
├── repository/      # Data access
├── service/         # Business logic
└── validation/      # Custom validators
```

## Testing

Tests use embedded Postgres:

```bash
./gradlew backendTest
```
