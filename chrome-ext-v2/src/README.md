## Technical Architecture

### 1. **Background Script** (`src/background.ts`)

- **Service Worker** that runs in the background
- **Data Management**: Caches professor data from Cattlelog API
- **Storage**: Manages schedule data, filter preferences, and professor cache
- **Cache Strategy**: 24-hour TTL for professor data to reduce API calls
- **Message Handling**: Processes requests from content script and popup

### 2. **Content Script** (`src/content/main.tsx`)

- **DOM Injection**: Injects styles, professor ratings, filters, and Cattlelog links into Schedule Builder
- **Data Extraction**: Extracts course information in real-time as users add/remove courses from their schedule

### 3. **Popup Interface** (`src/popup/App.tsx`)

- **Schedule Display**: Displays user's saved schedule and workload overview
- **Calendar Export**: Generates ICS files for Google Calendar, Apple Calendar, etc.
- **Course Filtering**: Filter between "All" classes or only "Registered" classes

## Tech Stack

- React + TypeScript
- CRXJS: Vite plugin for Chrome extension development ([View docs](https://crxjs.dev))
- Tailwind CSS
- Vite

## File Structure

```
src/
├── background.ts          # Service worker for data management
├── content/main.tsx       # DOM injection and enhancement
├── popup/                 # Extension popup interface
├── components/            # Reusable UI components
└── lib/                   # Utilities and constants
```

## Extension Permissions

- **Storage**: Persist user data and cache
- **Active Tab**: Access current Schedule Builder page
- **Host Permissions**: Fetch data from Cattlelog API

## Development Workflow

```bash
npm install          # Install dependencies
npm run build        # Production build
npm run format       # Code formatting with Prettier (or npx prettier --write .)
```
