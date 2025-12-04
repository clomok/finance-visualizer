# Finance Visualizer (Homelab Edition)

A self-hosted, offline-first Single Page Application (SPA) for visualizing personal finance export data from [Tiller](https://tiller.com/) (or any standard CSV).

**Key Features:**

- **Privacy First:** No data is sent to the server. All parsing happens in your browser; data is saved in your browser's local storage (IndexedDB).
- **Ephemeral Server:** The Docker container is secure, read-only, and unprivileged. It serves the website files and nothing else.
- **Visualizations:** Interactive Sunburst drill-down charts and trend analysis line/bar graphs.

## Prerequisites

Before starting, ensure you have these installed:

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/):** Required to run the application container.
- **[Node.js](https://nodejs.org/):** Required to install the code dependencies.

---

## 🚀 First Time Install

1.  **Open your Terminal** (Command Prompt on Windows, Terminal on Mac/Linux).

2.  **Download the code:**
    Clone the repository (or extract the ZIP file and navigate into the folder):

    ```bash
    git clone [https://github.com/clomok/finance-visualizer](https://github.com/clomok/finance-visualizer)
    cd finance-visualizer
    ```

3.  **Install System Dependencies:**
    This downloads the necessary libraries to build the app securely.

    ```bash
    npm install
    ```

4.  **Build & Run:**
    This tells Docker to build the app and run it in the background.

    ```bash
    docker-compose up --build -d
    ```

5.  **Access the App:**
    Open your web browser and go to:
    [http://localhost:3050](http://localhost:3050)

---

## 🔄 How to Update

When you want to update the app with the latest features:

1.  **Get the latest code:**

    ```bash
    git pull
    ```

2.  **Rebuild the container:**
    This updates the running application with the new code.

    ```bash
    docker-compose up --build -d
    ```

---

## 🛠 Troubleshooting & Resetting

If the app isn't loading, the build fails, or you just want to completely reset the installation to a clean state (the "Nuclear Option"), follow the instructions for your operating system below.

### 🪟 For Windows Users (PowerShell)

1.  Open **PowerShell**.
2.  Navigate to your `finance-visualizer` folder.
3.  Copy and paste this entire block:

```powershell
# 1. Stop the running app
docker-compose down

# 2. Delete old dependency folders (Force delete)
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue

# 3. Re-install fresh dependencies
npm install

# 4. Re-build and start the app
docker-compose up --build -d
```

### 🍎 For Mac & 🐧 Linux Users

1.  Open your **Terminal**.
2.  Navigate to your `finance-visualizer` folder.
3.  Copy and paste this entire block:

```bash
# 1. Stop the running app
docker-compose down

# 2. Delete old dependency folders (Force delete)
rm -rf node_modules
rm package-lock.json

# 3. Re-install fresh dependencies
npm install

# 4. Re-build and start the app
docker-compose up --build -d
```

---

## Architecture (For Developers)

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts (Trends) & Nivo (Drill-down)
- **Server:** Nginx Unprivileged (Alpine Linux)
- **Security:**
  - Container runs as a non-root user.
  - Filesystem is Read-Only.
  - Strict Content Security Policy (CSP) headers enabled.
