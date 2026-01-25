# TV Bingo - Vue.js Frontend

Interactive web interface for the TV Bingo application.

> **Note:** This is a subproject of the tv-bingo monorepo. Run commands from the repository root (preferred) or this directory.

## Features

- **Show Browser**: Browse and search TV shows
- **Show Management**: Create and edit shows with phrases
- **Bingo Cards**: Generate and play 5x5 bingo cards
- **Win Detection**: Automatic detection of rows, columns, and diagonals

## Quick Start

From the repository root:

```bash
# Start dev server (http://localhost:5173)
./gradlew frontendDev

# Build for production
./gradlew frontendBuild

# TypeScript type checking
./gradlew frontendTypeCheck
```

Or from this directory:

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env.local` for local development:

```
VITE_API_BASE_URL=http://localhost:8080
```

## Tech Stack

- Vue 3 (Composition API)
- TypeScript 5.x
- Vite 5.x
- Vue Router

## Project Structure

```
src/
├── components/      # Reusable components
│   ├── CreateShow.vue
│   ├── ShowDetail.vue
│   └── ShowsList.vue
├── pages/           # Page components
│   ├── BingoCard.vue
│   └── CreateShowPage.vue
├── services/        # API services
├── types/           # TypeScript types
├── router/          # Vue Router config
└── assets/          # Static assets
```

## Development

The frontend requires the Spring Boot backend running at `http://localhost:8080`.

```bash
# Terminal 1: Start backend
./gradlew bootRun

# Terminal 2: Start frontend
./gradlew frontendDev
```
