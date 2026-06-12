<p align="center">
  <img src="./banner.svg" alt="CloudClip Banner" width="100%">
</p>

<div align="center">

  [![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](https://opensource.org/licenses/MIT)

  <p>A production-ready, full-stack media extraction platform designed for fast, high-quality downloads and stream conversions. Powered by <code>yt-dlp</code> with JavaScript signature solvings and <code>ffmpeg</code> stream muxers.</p>
</div>

---

## 🚀 Key Features

*   **💎 Premium UI & Design**: Built with a curating Light Theme as default, featuring smooth 3D parallax hover cards, high-contrast layouts, and floating background composition auras.
*   **⚡ Node-Powered YouTube Signature Bypass**: Integrated with specific `node` JS-runtimes and remote components directly solving complex YouTube challenge checks.
*   **🛠️ Background Stream Merging (Muxer)**: Initiates separate high-definition video and audio streaming queues, merging them on-the-fly using background child processes.
*   **🔒 Security & Privacy-First**: Includes automatic backend temp folder sweepers running every 10 minutes, rate limiting, and parameter verification.
*   **⚙️ Custom User Configs**: Retains default download parameters, history logs, and language selections inside the local storage cache.

---

## 📂 Project Structure

```
CloudClip/
├── client/                 # React frontend (Vite environment)
│   ├── src/
│   │   ├── components/     # Layout buttons & components
│   │   ├── context/        # ThemeContext controller
│   │   ├── pages/          # Downloader core rendering
│   │   └── index.css       # Layout styles & 3D variables
│
├── server/                 # Express API backend
│   ├── src/
│   │   ├── config/         # Environment variables loaders
│   │   ├── middleware/     # Rate limiter & security hooks
│   │   ├── routes/         # Express endpoint maps
│   │   └── services/       # ytDlp wrappers & jobs controllers
│
├── shared/                 # Config constants shared between modules
└── tests/                  # Backend unit & integration test coverage
```

---

## 🛠️ Installation & Setup

### Prerequisites
1.  **Node.js** (v18.0.0 or higher)
2.  **FFmpeg** (registered in system environment PATH variables)
3.  **yt-dlp** (registered in system environment PATH variables)

### Launch Steps
1.  **Install dependencies**:
    ```bash
    npm run setup
    ```
2.  **Add Configuration**:
    Create a local environment file at `server/.env`:
    ```env
    PORT=5000
    NODE_ENV=development
    CLIENT_URL=http://localhost:5173
    DOWNLOAD_DIR=downloads/temp
    CLEANUP_INTERVAL_MS=300000
    FILE_LIFETIME_MS=600000
    RATE_LIMIT_MAX=100
    ```
3.  **Run Dev Servers**:
    ```bash
    npm run dev
    ```
    - Access Frontend at: [http://localhost:5173](http://localhost:5173)
    - Access Backend API at: [http://localhost:5000](http://localhost:5000)

---

## 📡 API Reference

| Endpoint | Method | Payload | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/metadata` | `POST` | `{ "url": "..." }` | Extracts links, formats, and thumbnails |
| `/api/download/prepare` | `POST` | `{ "url": "...", "formatId": "...", "type": "video\|audio", "title": "..." }` | Registers a background download job |
| `/api/download/status/:jobId` | `GET` | *None* | Polls active download and merge progress |
| `/api/download/file/:jobId` | `GET` | *None* | Downloads completed file and triggers automated server cleanup |
| `/api/download/cancel/:jobId` | `POST` | *None* | Kills active processes and sweeps temporary chunks |
