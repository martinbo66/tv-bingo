# CLAUDE.md - Vue.js Frontend

This file provides guidance for working with the TV Bingo Vue.js frontend.

> **Note:** This is a subproject of the tv-bingo monorepo. See the root `CLAUDE.md` for full project context.

## Technology Stack

- **Vue 3** with Composition API
- **TypeScript 5.x** (strict mode)
- **Vite 5.x** for dev server and builds
- **Vue Router** for navigation

## Development Commands

Run from the **repository root** (preferred):

```bash
# Start dev server (http://localhost:5173)
./gradlew frontendDev

# Build for production
./gradlew frontendBuild

# TypeScript type checking
./gradlew frontendTypeCheck

# Install dependencies
./gradlew frontendInstall
```

Or from this directory:
```bash
npm install
npm run dev
npm run build
```

## Project Structure

```
src/
├── components/      # Reusable Vue components
│   ├── CreateShow.vue
│   ├── ShowDetail.vue
│   └── ShowsList.vue
├── pages/           # Page-level components
│   ├── BingoCard.vue
│   └── CreateShowPage.vue
├── services/        # API client services
│   ├── apiClient.ts
│   └── showService.ts
├── types/           # TypeScript type definitions
│   └── Show.ts
├── router/          # Vue Router configuration
├── assets/          # Static assets
├── App.vue          # Root component
└── main.ts          # Application entry point
```

## Code Style Guidelines

- **Components**: Use Composition API with `<script setup lang="ts">`
- **Types**: Define interfaces in `src/types/`
- **Naming**:
  - Components: PascalCase (CreateShow.vue)
  - Variables/functions: camelCase
  - Types/interfaces: PascalCase
- **Imports**: Group as Vue → external → local → types
- **Services**: Business logic in `src/services/`
- **Styling**: Use scoped CSS in components

## API Integration

The frontend communicates with the Spring Boot backend via REST API:

```typescript
// src/services/showService.ts
const apiClient = new ApiClient('http://localhost:8080');
```

Configure the API URL via environment variable:
```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Environment Variables

Create `.env.local` for local development:
```
VITE_API_BASE_URL=http://localhost:8080
```
