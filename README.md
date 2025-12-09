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

## 🚀 Easiest Way to Install (Seriously, it's Super Easy)

**You do not need to download anything or use the command line. You can install this entire app directly inside GitHub.**

### 1. Get your own copy

1.  Make sure you are logged into GitHub.
2.  Click the **Fork** button at the top right of this page.
3.  Click **Create Fork** (leave the name as `finance-visualizer` so the code works automatically).

### 2. Give it permission to build

_GitHub is secure by default, so we need to give the "builder" permission to publish your site._

1.  In your new repository, click the **Settings** tab (top right).
2.  On the left sidebar, click **Actions** -> **General**.
3.  Scroll down to the bottom section called **Workflow permissions**.
4.  Select **Read and write permissions**.
5.  Click **Save**.

### 3. Turn on the Website

1.  Stay in the **Settings** tab.
2.  On the left sidebar, click **Pages**.
3.  Under the **Build and deployment** section, look for **Source**.
4.  Change the dropdown from "Deploy from a branch" to **GitHub Actions**.

### 4. Launch the App

1.  Click the **Actions** tab at the top of the page.
2.  If you see a warning button that says _"I understand my workflows, go ahead and enable them"_, click it.
3.  Click **Deploy to GitHub Pages** on the left sidebar.
4.  Click the **Run workflow** button on the right side.
5.  Wait for the spinning yellow circle to turn into a **Green Checkmark** ✅.

### 5. Visit your site

1.  Go back to **Settings** -> **Pages**.
2.  Click the link displayed at the top (e.g., `https://your-username.github.io/finance-visualizer/`).
3.  **Done!** Your personal version of the app is now running 100% in the browser and hosted by Github.

---

## Install on Your Hardware (Still Pretty Easy)

1.  **Open your Terminal** (Command Prompt on Windows, Terminal on Mac/Linux).

2.  **Download the code:**
    Clone the repository (or extract the ZIP file and navigate into the folder):

    ```bash
    git clone https://github.com/clomok/finance-visualizer
    cd finance-visualizer
    ```

3.  **Install System Dependencies:**
    This downloads the necessary libraries to build the app securely.

    ```bash
    npm install
    ```

    **Security Check:** It is recommended to run a vulnerability audit before proceeding:

    ```bash
    npm audit
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

## How to Update

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

## Troubleshooting & Resetting

If the app isn't loading, the build fails, or you just want to completely reset the installation to a clean state (the "Nuclear Option"), follow the instructions for your operating system below.

### For Windows Users (PowerShell)

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

### For Mac & Linux Users

1.  Open your **Terminal**.
2.  Navigate to your `finance-visualizer` folder.
3.  Copy and paste this entire block:

Bash

```
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
  - Dependencies and Base Images are pinned to specific versions for supply-chain security.
