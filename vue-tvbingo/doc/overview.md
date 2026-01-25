## TV Bingo Application Overview

The TV Bingo application is a Vue.js-based web application that allows users to create and manage bingo cards for TV shows. The application enables users to define common phrases or events from TV shows and generate playable bingo cards with these phrases randomly distributed.

### Application Architecture

The diagram below illustrates the high-level architecture of the application, showing how components interact with each other and with the data layer:

```mermaid
graph TD
    subgraph Frontend["Frontend (Vue.js)"]
        App["App.vue"]
        Router["Router"]
        
        subgraph Components["Components"]
            ShowsList["ShowsList.vue"]
            ShowDetail["ShowDetail.vue"]
            CreateShow["CreateShow.vue"]
        end
        
        subgraph Pages["Pages"]
            BingoCard["BingoCard.vue"]
            CreateShowPage["CreateShowPage.vue"]
        end
    end
    
    subgraph Services["Services"]
        ShowService["showService.ts"]
        ApiClient["apiClient.ts"]
    end
    
    subgraph API["REST API"]
        Backend["Spring Boot Backend"]
    end
    
    subgraph Database["PostgreSQL"]
        DB["TV-Bingo Database"]
    end
    
    subgraph DataModel["Data Model"]
        Show["Show Interface"]
    end
    
    App --> Router
    Router --> ShowsList
    Router --> ShowDetail
    Router --> BingoCard
    Router --> CreateShowPage
    
    ShowsList --> ShowService
    ShowDetail --> ShowService
    BingoCard --> ShowService
    CreateShowPage --> CreateShow
    CreateShow --> ShowService
    
    ShowService --> ApiClient
    ApiClient --> Backend
    Backend --> DB
    ShowService -.-> Show
```

The application follows a typical Vue.js architecture with:
- A main App component
- Vue Router for navigation
- Components for UI elements
- Pages for full screen views
- Services for data access
- REST API for backend communication
- PostgreSQL database for data persistence

### Page Flow

The application consists of four main pages:

1. **Home Page (Shows List)** - Displays all saved TV shows
2. **Create Show Page** - Form to create a new TV show and add phrases
3. **Edit Show Page** - Form to edit an existing TV show
4. **Bingo Card Page** - Interactive bingo card for gameplay

```mermaid
flowchart TD
    HomePage["Home Page (Shows List)"]
    CreatePage["Create Show Page"]
    EditPage["Edit Show Page"]
    BingoCardPage["Bingo Card Page"]
    
    HomePage -- "Click '+ Add Show'" --> CreatePage
    HomePage -- "Click on Show Card" --> BingoCardPage
    HomePage -- "Click Edit Button" --> EditPage
    
    CreatePage -- "Submit new show" --> HomePage
    CreatePage -- "Cancel" --> HomePage
    
    EditPage -- "Save changes" --> HomePage
    EditPage -- "Cancel" --> HomePage
    
    BingoCardPage -- "Click Show Title" --> EditPage
    BingoCardPage -- "Click '← Back to Shows'" --> HomePage
    
    style HomePage fill:#9c27b0,color:#fff
    style CreatePage fill:#4CAF50,color:#fff
    style EditPage fill:#2196F3,color:#fff
    style BingoCardPage fill:#FFC107,color:#000
```

Users can navigate between these pages as shown in the page flow diagram above. The home page serves as the central hub, with navigation paths to and from all other pages.

### Data Flow

The data flow diagram illustrates how data moves through the application during key user interactions:

```mermaid
sequenceDiagram
    participant User
    participant UI as User Interface
    participant Service as Show Service
    participant API as REST API
    participant DB as PostgreSQL
    
    %% Load Shows List
    User->>UI: Visit Home Page
    UI->>Service: getShows()
    Service->>API: GET /api/shows
    API->>DB: SELECT * FROM shows
    DB-->>API: ResultSet
    API-->>Service: JSON Array
    Service-->>UI: Show[]
    UI-->>User: Display shows list
    
    %% Create Show
    User->>UI: Fill create show form
    User->>UI: Submit form
    UI->>Service: addShow(showInput)
    Service->>API: POST /api/shows
    API->>API: Validate request
    API->>DB: INSERT INTO shows
    DB-->>API: New show with ID
    API-->>Service: 201 Created + JSON
    Service-->>UI: Show with ID
    UI-->>User: Navigate to home page
    
    %% Edit Show
    User->>UI: Click edit button
    UI->>Service: getShowById(id)
    Service->>API: GET /api/shows/{id}
    API->>DB: SELECT * FROM shows WHERE id = ?
    DB-->>API: ResultSet
    API-->>Service: JSON Object
    Service-->>UI: Show object
    UI-->>User: Display edit form
    User->>UI: Edit show details
    User->>UI: Save changes
    UI->>Service: updateShow(show)
    Service->>API: PUT /api/shows/{id}
    API->>DB: UPDATE shows SET ...
    DB-->>API: Updated show
    API-->>Service: 200 OK + JSON
    Service-->>UI: Updated Show
    UI-->>User: Navigate to home page
    
    %% Play Bingo
    User->>UI: Click on show card
    UI->>Service: getShowById(id)
    Service->>API: GET /api/shows/{id}
    API->>DB: SELECT * FROM shows WHERE id = ?
    DB-->>API: ResultSet
    API-->>Service: JSON Object
    Service-->>UI: Show object
    UI->>UI: Generate bingo grid
    UI-->>User: Display bingo card
    User->>UI: Mark bingo squares
    UI->>UI: Check for winning combinations
    UI-->>User: Display "BINGO!" if won
```

### Component Interaction

The component diagram shows the structure of each component and how they interact:

```mermaid
classDiagram
    class App {
        +RouterView
    }
    
    class Router {
        +routes
        +beforeEach()
    }
    
    class ShowsList {
        -shows: Show[]
        -loading: boolean
        -error: string
        +fetchShows()
        +navigateToShow()
        +handleEdit()
        +handleDelete()
    }
    
    class ShowDetail {
        -show: Show
        -loading: boolean
        -error: string
        -newPhrase: string
        +addPhrase()
        +removePhrase()
        +saveShow()
    }
    
    class CreateShowPage {
        -error: string
        +onShowCreated()
    }
    
    class CreateShow {
        -showTitle: string
        -gameTitle: string
        -centerSquare: string
        -phrases: string[]
        +addPhrase()
        +removePhrase()
        +createShow()
        +emit: showCreated
    }
    
    class BingoCard {
        -show: Show
        -bingoGrid: string[]
        -loading: boolean
        -error: string
        -selectedCells: Set~number~
        -winningLines: number[][]
        +generateBingoGrid()
        +checkWinningCombinations()
        +toggleCell()
        +regenerateBingoCard()
    }
    
    class ShowService {
        +getShows()
        +getShowById()
        +addShow()
        +updateShow()
        +deleteShow()
        +searchShowsByTitle()
    }
    
    class Show {
        +id: number
        +showTitle: string
        +gameTitle?: string
        +centerSquare?: string
        +phrases: string[]
    }
    
    App --> Router
    Router --> ShowsList
    Router --> ShowDetail
    Router --> CreateShowPage
    Router --> BingoCard
    
    ShowsList --> ShowService
    ShowDetail --> ShowService
    CreateShowPage --> CreateShow
    CreateShow --> ShowService
    BingoCard --> ShowService
    
    ShowService ..> Show
```

Each component has specific responsibilities and communicates with other components through props, events, and the router.

### Database Schema

The application uses PostgreSQL for data persistence with the following schema:

```mermaid
erDiagram
    SHOWS {
        bigint id PK
        varchar show_title UK
        varchar game_title
        varchar center_square
        text_array phrases
    }
    
    SHOWS {
        idx_shows_show_title "Index on show_title"
        uk_shows_show_title "Unique constraint on show_title"
    }
```

This schema allows for efficient storage and retrieval of show data, including titles, phrases, and other metadata. The backend API handles all database operations.

### Bingo Card Generation Process

The bingo card generation process follows these steps:

```mermaid
flowchart TD
    A[Load Show Data] --> B{Has at least 24 phrases?}
    B -->|No| C[Display Error]
    B -->|Yes| D[Copy Phrases Array]
    D --> E[Shuffle Phrases]
    E --> F[Take first 24 phrases]
    F --> G[Insert center square at position 12]
    G --> H[Auto-select center square]
    H --> I[Render 5x5 Bingo Grid]
    I --> J[User clicks on cells]
    J --> K[Toggle cell selection]
    K --> L{Check for winning combinations}
    L -->|Win Found| M[Display BINGO! message]
    L -->|No Win| J
    
    style A fill:#4CAF50,color:#fff
    style B fill:#FFC107,color:#000
    style E fill:#2196F3,color:#fff
    style G fill:#FF5722,color:#fff
    style L fill:#9C27B0,color:#fff
    style M fill:#F44336,color:#fff
```

Users can then click on cells to mark phrases they've heard/seen, and the application checks for winning combinations (rows, columns, or diagonals).

## Conclusion

The TV Bingo application demonstrates a well-structured Vue.js application with clear separation of concerns, efficient data management, and an intuitive user interface. The application communicates with a Spring Boot REST API backend, which handles all data persistence in a PostgreSQL database. This architecture provides centralized data management, validation, and scalability.