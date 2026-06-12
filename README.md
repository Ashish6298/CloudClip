<p align="center">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 350" width="100%" height="100%" style="background: #070a13; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
    <defs>
      <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366f1" />
        <stop offset="50%" stop-color="#a855f7" />
        <stop offset="100%" stop-color="#ec4899" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="10" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    
    <style>
      .bg { fill: #070a13; }
      .grid { stroke: rgba(99, 102, 241, 0.06); stroke-width: 1; }
      .floating-ring-1 {
        transform-origin: 400px 160px;
        animation: rotate3D1 18s infinite linear;
      }
      .floating-ring-2 {
        transform-origin: 400px 160px;
        animation: rotate3D2 12s infinite linear;
      }
      .logo-cloud {
        transform-origin: 400px 160px;
        animation: floatLogo 3.5s infinite ease-in-out;
      }
      .text-brand {
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
        font-weight: 800;
        fill: #ffffff;
        font-size: 44px;
        letter-spacing: 4px;
      }
      .text-sub {
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
        font-weight: 600;
        fill: #94a3b8;
        font-size: 14px;
        letter-spacing: 5px;
      }
      @keyframes rotate3D1 {
        0% { transform: rotateX(65deg) rotateY(15deg) rotateZ(0deg); }
        100% { transform: rotateX(65deg) rotateY(15deg) rotateZ(360deg); }
      }
      @keyframes rotate3D2 {
        0% { transform: rotateX(65deg) rotateY(-15deg) rotateZ(360deg); }
        100% { transform: rotateX(65deg) rotateY(-15deg) rotateZ(0deg); }
      }
      @keyframes floatLogo {
        0% { transform: translateY(0px) scale(1) rotateX(10deg); }
        50% { transform: translateY(-12px) scale(1.05) rotateX(0deg); }
        100% { transform: translateY(0px) scale(1) rotateX(10deg); }
      }
    </style>

    <rect width="800" height="350" class="bg" rx="16" />
    
    <!-- Perspective background grid lines -->
    <g class="grid">
      <line x1="50" y1="350" x2="400" y2="160" />
      <line x1="200" y1="350" x2="400" y2="160" />
      <line x1="350" y1="350" x2="400" y2="160" />
      <line x1="500" y1="350" x2="400" y2="160" />
      <line x1="650" y1="350" x2="400" y2="160" />
      <line x1="800" y1="350" x2="400" y2="160" />
      <circle cx="400" cy="160" r="60" fill="none" />
      <circle cx="400" cy="160" r="120" fill="none" />
      <circle cx="400" cy="160" r="180" fill="none" />
    </g>

    <!-- 3D Rotating Outer Ring -->
    <ellipse cx="400" cy="160" rx="170" ry="70" fill="none" stroke="url(#glowGrad)" stroke-width="3.5" stroke-dasharray="12, 18" class="floating-ring-1" filter="url(#glow)" />
    
    <!-- 3D Rotating Inner Ring -->
    <ellipse cx="400" cy="160" rx="110" ry="45" fill="none" stroke="#06b6d4" stroke-width="2.5" stroke-dasharray="6, 12" class="floating-ring-2" />

    <!-- Glowing core logo blob -->
    <g class="logo-cloud">
      <circle cx="400" cy="150" r="40" fill="url(#glowGrad)" opacity="0.8" filter="url(#glow)" />
      <!-- Cloud Outline -->
      <path d="M380 162 a17 17 0 0 1 12 -28 a25 25 0 0 1 22 -17 a22 22 0 0 1 20 17 a17 17 0 0 1 2 28 z" fill="#ffffff" />
      <!-- Down Arrow inside Cloud -->
      <path d="M410 142 l0 15 m-5 -5 l5 5 l5 -5" stroke="#6366f1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- Title Text -->
    <text x="400" y="275" text-anchor="middle" class="text-brand">CLOUDCLIP</text>
    <text x="400" y="305" text-anchor="middle" class="text-sub">HIGH-SPEED 3D MEDIA DOWNLOAD ENGINE</text>
  </svg>
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
