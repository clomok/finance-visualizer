# AI Assistant Instructions & Context

## Project Overview

**Finance Visualizer (Homelab Edition)** is a self-hosted, offline-first Single Page Application (SPA) for visualizing personal finance data.

- **Goal:** Visualize CSV exports from Tiller (or generic CSVs) without sending data to a server.
- **Key Philosophy:** Privacy-first. Data lives in the browser (IndexedDB) or memory only. The Docker container is read-only and unprivileged.

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS (Utility-first)
- **Charts:** Nivo (Sunburst/Drill-down), Recharts (Trends/Bar/Line)
- **State/Storage:** React State + IndexedDB (idb package)
- **Icons:** Lucide-React
- **Build/Deploy:** Docker (Nginx Unprivileged Alpine)

## Workflow Requirements (STRICT)

1.  **Wait for Instructions:** Do not initiate changes or assume intent. Wait for explicit instructions.
2.  **Complete Code Blocks:** When providing code, **ALWAYS** provide the **ENTIRE** file content.
    - _Reasoning:_ The user copies and pastes the entire block to overwrite the file locally.
    - _Do not_ use snippets like `// ... rest of code`.
3.  **Iteration Cycle:**
    - AI provides full file code.
    - User applies changes and commits to the repo.
    - User confirms success or asks for adjustments.
    - Repeat.

## CSV & Data Structure

- **Source:** Designed for "Tiller" exports but compatible with any CSV.
- **Required Columns:** `Date`, `Amount`, `Description`, `Category`, `Account`.
- **Optional Columns:** `Tags` (comma-separated).
- **Category Logic:** Uses a 2-tier system separated by a hyphen (e.g., `Food - Groceries`).
  - Parent: `Food`
  - Child: `Groceries`

## Code Style & Conventions

- **TypeScript:** Use strict typing. Avoid `any` unless absolutely necessary (and comment why).
- **Components:** Functional components with typed props.
- **Styling:** Use Tailwind utility classes. Avoid custom CSS files unless for global resets.
- **Icons:** Use `lucide-react`.
- **Formatting:** Prettier standard (2 spaces indent, single quotes, semicolons).

## Directory Structure

- `/src/components`: UI components (Dashboard, Charts, Lists).
- `/src/components/ui`: Reusable primitives (Buttons, Cards, Selects).
- `/src/utils`: Helper logic (CSV parsing, Date math, Storage).
- `/src/types.ts`: Centralized interfaces (`Transaction`, `FileRecord`).
