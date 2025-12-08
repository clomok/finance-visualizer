# AI Assistant Instructions & Context

## Project Overview

**Finance Visualizer (Homelab Edition)** is a self-hosted, offline-first Single Page Application (SPA) for visualizing personal finance export data from [Tiller](https://tiller.com/) (or any standard CSV).

- **Goal:** Visualize CSV exports from Tiller (or generic CSVs) without sending data to a server.
- **Key Philosophy:**
  1.  **Privacy-First:** Data lives in the browser (IndexedDB) or memory only.
  2.  **Security-First:** The Docker container is read-only and unprivileged. Dependencies are pinned to ensure reproducibility.
  3.  **Stability-First:** We prefer "Stable/LTS" versions over "Bleeding Edge" updates.

## Tech Stack (Pinned Versions)

_Current Status: **0 Vulnerabilities** (Dec 2025)_

- **Frontend:** React `18.3.1` + Vite `5.4.21` + TypeScript `5.6.3`
- **Styling:** Tailwind CSS `3.4.17` (Utility-first)
- **Charts:**
  - Nivo `0.87.0` (Sunburst/Drill-down)
  - Recharts `2.13.3` (Trends/Bar/Line)
- **State/Storage:** React State + IndexedDB (`idb` `8.0.0`)
- **Icons:** Lucide-React `0.460.0`
- **Build/Deploy:** Docker (Node 22 LTS Builder + Nginx Unprivileged 1.27 Alpine)

## Security & Maintenance Protocols

1.  **Pinning Strategy:** All dependencies in `package.json` are pinned to exact versions (no `^` or `~`). The `package-lock.json` is committed and treated as the source of truth.
2.  **Vulnerability Patching:**
    - We use `npm audit` to check for security flaws.
    - **Critical:** We currently use `overrides` in `package.json` to force `esbuild` to version `^0.25.0` to patch a moderate vulnerability in Vite 5. **Do not remove this override** without verifying Vite has released a native fix.
3.  **Docker Hardening:**
    - Base images are pinned (e.g., `node:22-alpine`, `nginxinc/nginx-unprivileged:1.27-alpine`).
    - Container runs as non-root.
    - Filesystem is read-only (except `/tmp`).

## Workflow Requirements (STRICT)

1.  **Wait for Instructions:** Do not initiate changes or assume intent. Wait for explicit instructions.
2.  **Complete Code Blocks:** When providing code, **ALWAYS** provide the **ENTIRE** file content.
    - _Reasoning:_ The user copies and pastes the entire block to overwrite the file locally.
    - _Do not_ use snippets like `// ... rest of code`.
3.  **Iteration Cycle:**
    - AI provides full file code.
    - User applies changes and commits to the repo.
    - User confirms success or asks for adjustments.

## CSV & Data Structure

- **Source:** Designed for "Tiller" exports but compatible with any CSV.
- **Required Columns:** `Date`, `Amount`, `Description`, `Category`, `Account`.
- **Optional Columns:** `Tags` (comma-separated).
- **Category Logic (Current):** Uses a 2-tier system separated by a hyphen (e.g., `Food - Groceries`).
  - _Goal:_ See Roadmap Phase 2 (Expand to infinite nesting).

## Code Style & Conventions

- **TypeScript:** Use strict typing. Avoid `any` unless absolutely necessary (and comment why).
- **Components:** Functional components with typed props.
- **Styling:** Use Tailwind utility classes. Avoid custom CSS files unless for global resets.
- **Icons:** Use `lucide-react`.
- **Formatting:** Prettier standard (2 spaces indent, single quotes, semicolons).

## Architecture & Implementation Notes

- **State Management in Charts:** When building interactive charts (e.g., `DrillDownChart`), store **IDs** (strings) in state rather than full objects. This prevents stale data issues when parent props (like `dateRange`) update and trigger a re-calculation of the dataset.
- **Responsive Tables:** Use `overflow-x-auto` on table containers to ensure wide content (like Tags) remains accessible on smaller screens.
- **UX Scrolling:** When user interaction changes the primary view focus (e.g., clicking a chart leaf node), programmatically scroll to the relevant detail section (e.g., `TransactionList`).

## Directory Structure

- `/src/components`: UI components (Dashboard, Charts, Lists).
- `/src/components/ui`: Reusable primitives (Buttons, Cards, Selects).
- `/src/utils`: Helper logic (CSV parsing, Date math, Storage).
- `/src/types.ts`: Centralized interfaces (`Transaction`, `FileRecord`).

## Roadmap & Status

### Phase 1: Security Hardening (✅ Completed)

- [x] Pin all dependencies.
- [x] Hardening Dockerfile (User/Groups/Read-only).
- [x] Commit lockfile.
- [x] Achieve 0 Vulnerabilities (via Overrides).

### Phase 2: Feature Development (🚧 In Progress)

- [x] **Drill-Down Chart Improvements:**
  - Fixed stale state issues when changing timeframes.
  - Added auto-scroll to transaction list on selection.
- [x] **Transaction List Improvements:**
  - Added horizontal scrolling for small screens.
  - Improved column spacing (Tags width).
- [ ] **Multi-tier Category Support:**
  - Expand parsing logic to support 5+ levels of nesting (e.g., `Discretionary - Food - Fast Food - Burgers`).
  - Update charts to cycle visualization 2 levels at a time (Parent/Child) regardless of depth.

### Phase 3: Modernization Watchlist (🛑 On Hold)

_detected via `npm outdated` - Dec 2025_
_Do not upgrade these without a dedicated migration project._

- **React 19:** Major update. Wait for ecosystem (Nivo/Recharts) to catch up.
- **Tailwind v4:** Major rewrite. Requires config migration.
- **Vite 7:** Major update. Breaking changes likely.
- **Recharts v3:** Breaking API changes.
- **Nivo 0.99+:** Significant version jump.
