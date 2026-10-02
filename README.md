# DayFlow

DayFlow is a modern, responsive personal productivity dashboard designed to help you structure daily habits, manage tasks with precision, plan ahead using an interactive visual calendar, and gain actionable focus analytics.

---

## Features

- **Daily Task Management**: Full task lifecycle (create, edit, delete, complete, undo) with category, priority, and date scheduling.
- **Today's Top Focus**: Pin a primary milestone for single-task clarity and immediate visual tracking.
- **Recurring Daily Routines**: Recurring morning, deep work, afternoon, and evening rituals with weekday filters and date-isolated completion records.
- **Visual Calendar Planning**: Interactive monthly schedule with date inspector, daily progress indicators, and instant pre-filled task creation.
- **Productivity Analytics**: Weekly completion charts, task distribution donut graph, 12-week routine consistency heatmap, and metrics export.
- **Local Persistence**: Centralized `localStorage` management with seamless demo initialization that never overwrites user progress.
- **Responsive UI**: Tailored desktop dashboard with collapsible navigation, mobile bottom-bar access, and keyboard shortcuts (`Ctrl+K` / `⌘K`).

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Feedback & Micro-interactions**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)

---

## How to Run Locally

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18+ recommended) installed.

### Installation

```bash
npm install
```

### Development Server

Start the local development server at `http://localhost:3000`:

```bash
npm run dev
```

### Production Build

Compile TypeScript and build the optimized production bundle:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## Project Structure Summary

```text
DayFlow/
├── index.html              # HTML entry point with metadata & favicon
├── package.json            # Scripts and dependencies
├── vite.config.ts          # Vite configuration with aliases & Tailwind plugin
├── public/
│   └── favicon.svg         # DayFlow brand SVG icon
└── src/
    ├── main.tsx            # React application root
    ├── App.tsx             # Route definitions and responsive layout shell
    ├── index.css           # Global typography, color tokens, and base styles
    ├── types/              # TypeScript models (Task, Routine, Settings, Stats)
    ├── context/            # DayFlowContext state management and localStorage sync
    ├── data/               # Default sample tasks and routines
    ├── utils/
    │   ├── dateHelpers.ts  # Timezone-safe local date formatting and calendar grid
    │   ├── storage.ts      # LocalStorage persistence and reset handlers
    │   └── categoryColors.ts # Category and priority styling tokens
    ├── components/         # Reusable UI components (Modals, Cards, Sidebar, Header)
    └── pages/              # Primary route views
        ├── Dashboard.tsx   # Command center, focus task, and daily overview
        ├── Tasks.tsx       # Filterable and searchable task lists
        ├── Routine.tsx     # Recurring habit sections and streak calculations
        ├── Calendar.tsx    # Monthly view and date-specific schedule inspector
        ├── Progress.tsx    # Weekly charts, category donut, and 12-week heatmap
        └── Settings.tsx    # Profile configuration and storage controls
```

---

## Current Limitation

Data is currently persisted on the client using browser `localStorage`. Changes are tied to the local browser profile and do not automatically sync across multiple devices.

---

## Future Improvements

- **Authentication**: User accounts with multi-tenant workspace separation.
- **Cloud Synchronization**: Real-time cloud database backup (Supabase / Firebase).
- **Notifications**: Scheduled browser push notifications for time-sensitive tasks.
- **Import / Export Backup**: Full workspace backup and restore via JSON archive.
