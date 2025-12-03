# Finance Visualizer (Homelab Edition)

A self-hosted, offline-first Single Page Application (SPA) for visualizing personal finance export data.

**Key Features:**
* **Privacy First:** No data is sent to the server. All parsing happens in the browser; data is persisted in your browser's IndexedDB.
* **Ephemeral Server:** The Docker container is read-only and unprivileged. It serves static HTML/JS and nothing else.
* **Visualizations:** Multi-level Sunburst drill-down charts and trend analysis line/bar graphs.

## Prerequisites

* [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
* [Node.js](https://nodejs.org/) (Optional, but useful for managing lockfiles locally).

---

## 🚀 First Time Install

1.  **Clone the repository** (or download the folder):
    ```bash
    git clone <your-repo-url>
    cd finance-visualizer
    ```

2.  **Install Dependencies** (Creates the lockfile for security):
    ```bash
    npm install
    ```

3.  **Build & Run:**
    ```bash
    docker-compose up --build -d
    ```

4.  **Access:**
    Open your browser to [http://localhost:3050](http://localhost:3050).

---

## 🔄 How to Update

When you change code or pull the latest version from Git:

1.  **Get latest changes:**
    ```bash
    git pull
    ```

2.  **Rebuild the container:**
    ```bash
    docker-compose up --build -d
    ```
    *The `--build` flag forces Docker to recreate the image with your new code.*

---

## 🛠 Troubleshooting & Reinstalling

If the build fails or you want a completely clean slate (nuclear option):

**Windows (PowerShell):**
```powershell
# 1. Stop containers
docker-compose down

# 2. Delete local node_modules (fixes dependency caching issues)
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue

# 3. Delete package-lock (optional, only if dependencies are broken)
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue

# 4. Re-install and Re-build
npm install
docker-compose up --build

## Architecture

* **Frontend:** React + Vite + TypeScript
* **Styling:** Tailwind CSS
* **Charts:** Recharts (Trends) & Nivo (Drill-down)
* **Server:** Nginx Unprivileged (Alpine Linux)
* **Security:**
    * Container runs as non-root user.
    * Filesystem is Read-Only.
    * Strict Content Security Policy (CSP) headers enabled.