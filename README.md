# Task Manager — Frontend

React + TypeScript UI. Task list with status controls and a per-task audit log modal.

---

## Stack

- **Framework:** React 18
- **Language:** TypeScript 4.9
- **Bundler:** Create React App (`react-scripts`)
- **Styling:** Plain CSS with CSS variables

---

## Setup

```bash
npm install --legacy-peer-deps
npm start
```

Runs on **http://localhost:3000** — proxies `/api` to `http://localhost:3001`.  
Backend must be running first.

> **Note:** `--legacy-peer-deps` is needed because `react-scripts@5` expects TypeScript `^3 || ^4`.

---

## Features

- Create and delete tasks
- Advance task status one step at a time (`to_do → pending → in_progress → done`)
- Select the actor making each change from a dropdown
- View the full audit log for any task in a modal
- Filter task list by status

---

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── App.tsx       — Task grid, create form, status controls, audit modal
│   ├── App.css       — Component styles
│   ├── api.ts        — Typed fetch wrapper for all API calls
│   ├── types.ts      — Shared types + status display labels
│   ├── index.tsx     — React entry point
│   └── index.css     — Global styles + CSS variables
├── package.json
└── tsconfig.json
```

---

## Key Design Decisions

**No client-side transition validation** — the backend enforces all rules. The UI only shows the next valid status; invalid transitions are impossible from the UI but still rejected at the API if called directly.

**All API calls go through `api.ts`** — one place to change the base URL, add headers, or swap the fetch implementation.

**`react-scripts` over Vite** — works out of the box with zero config but is largely unmaintained. The peer dep issue on install is a known consequence. Migrating to Vite is straightforward if needed.