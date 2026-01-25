# Project Structure

This document outlines the organization of the Vue TV Bingo project's codebase.

## Root Directory Structure

```
vue-tv-bingo/
├── src/                    # Source code
├── public/                 # Static assets served directly
├── dist/                   # Build output directory
├── memory-bank/           # Project documentation
├── doc/                   # Additional documentation
└── node_modules/          # Dependencies
```

## Source Code Organization (`src/`)

The source code is organized into the following directories:

- `components/` - Reusable Vue components
- `services/` - Business logic and external service integrations
- `router/` - Vue Router configuration and route definitions
- `pages/` - Page-level components
- `assets/` - Static assets (images, styles, etc.)
- `types/` - TypeScript type definitions
- `App.vue` - Root component
- `main.ts` - Application entry point
- `style.css` - Global styles

## Key Files

- `package.json` - Project dependencies and scripts
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `index.html` - HTML entry point

## Build and Development

The project uses:
- Vite as the build tool
- TypeScript for type safety
- Vue 3 as the frontend framework
- Vue Router for routing

## Development Workflow

1. Development server: `npm run dev`
2. Build for production: `npm run build`
3. Preview production build: `npm run preview`

## Directory Purposes

### `components/`
Contains reusable Vue components that can be used across different pages. Each component should be self-contained and follow the single responsibility principle.

### `services/`
Houses business logic and external service integrations. This includes API calls, data transformations, and other service-related functionality.

### `router/`
Contains Vue Router configuration, including route definitions and navigation guards.

### `pages/`
Contains page-level components that represent different routes in the application.

### `assets/`
Stores static assets such as images, fonts, and other media files.

### `types/`
Contains TypeScript type definitions and interfaces used throughout the application. 