# Antigravity Downloader

A production-ready full-stack web application designed for fast, high-quality media downloads and conversions. Built with React (Vite) on the frontend, Node.js & Express on the backend, and powered by `yt-dlp` & `ffmpeg`.

## Features
- **Clean, Responsive UI**: A premium user interface supporting both light and dark modes with glassmorphism effects and smooth micro-animations.
- **Robust Media Pipeline**: Analyzes URLs to fetch metadata, extracts formats dynamically, and enables download options for both video and audio.
- **Job-based Streaming & Merging**: High-resolution video formats (e.g. 1080p, 4K) are downloaded and merged (video + audio) in the background on the server, tracking percentage, download speed, and ETA.
- **Security-First Design**: Implements request validation, sanitization of titles, CORS origin whitelist, HTTP security headers (`helmet`), and IP-based rate limiting.
- **Automated Sweepers**: Automatically scans and cleans up temporary downloads and files from the server after a configurable lifespan (default: 10 minutes) or immediately after browser download.
- **Local Persistence**: Restores user preferences (default quality, format tab, history log setting, language) and past download history from `localStorage`.

---

## Technical Stack
- **Frontend**: React (v19), Vite, Vanilla CSS, Lucide React (for icons)
- **Backend**: Node.js, Express, `yt-dlp` (cli integration), `ffmpeg` (cli integration)
---

## Folder Structure
```
media-downloader/
│
├── client/                 # React frontend (Vite)
│   ├── public/
│   └── src/
│       ├── components/     # Reusable layout UI
│       ├── context/        # ThemeContext provider
│       ├── pages/          # Downloader page
│       ├── services/       # Client API requester
│       └── index.css       # Design tokens & styles
│
├── server/                 # Express backend
│   └── src/
│       ├── config/         # Environment variables configuration
│       ├── controllers/    # Express controllers
│       ├── middleware/     # Security and validator middleware
│       ├── routes/         # Express API routes
│       └── services/       # ytDlp CLI wrapper and background jobs manager
│
├── shared/                 # Shared data models/enums
│   └── constants/          # Status codes, error definitions
│
├── tests/                  # Test suites
│   └── backend/            # Jest unit & integration tests
│
```

---

## Setup & Running

### Prerequisites
1. **Node.js**: v18.0.0 or higher.
2. **FFmpeg**: Must be installed and registered in your system's PATH.
3. **yt-dlp**: Must be installed and registered in your system's PATH.

### Local Development Setup

1. **Clone and Setup Dependencies**:
   From the root folder, run:
   ```bash
   npm run setup
   ```
   This will install all root devDependencies, client dependencies, and server dependencies.

2. **Configure Environment Variables**:
   Create a `.env` file in the `server` directory (or modify the default one created):
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   DOWNLOAD_DIR=downloads/temp
   CLEANUP_INTERVAL_MS=300000
   FILE_LIFETIME_MS=600000
   ```

3. **Start Development Servers**:
   Run both frontend and backend concurrently:
   ```bash
   npm run dev
   ```
   - Frontend runs on: [http://localhost:5173](http://localhost:5173)
   - Backend API runs on: [http://localhost:5000](http://localhost:5000)

### Running Automated Tests
To execute backend test suites:
```bash
npm run test:server
```

---

## API Specifications

All endpoints are prefixed with `/api`.

### 1. Extract Metadata
- **URL**: `/metadata`
- **Method**: `POST`
- **Body**: `{ "url": "https://www.youtube.com/watch?v=..." }`
- **Response**: Standardized metadata object including formats, durations, descriptions, and thumbnail.

### 2. Initiate Background Download
- **URL**: `/download/prepare`
- **Method**: `POST`
- **Body**: `{ "url": "...", "formatId": "...", "type": "video|audio", "title": "..." }`
- **Response**: Returns `{ "jobId": "...", "status": "pending" }`. Starts downloading in the background.

### 3. Poll Download Status
- **URL**: `/download/status/:jobId`
- **Method**: `GET`
- **Response**: Active job status details (e.g. status: downloading/merging/completed/failed, progress: 0-100, speed, ETA, etc.).

### 4. Fetch Completed File
- **URL**: `/download/file/:jobId`
- **Method**: `GET`
- **Response**: Serves the completed media file as an attachment. The temporary file is purged from the server immediately after download completion.

### 5. Cancel Job
- **URL**: `/download/cancel/:jobId`
- **Method**: `POST`
- **Response**: Terminates active downloads, kills corresponding child processes, and cleans up partial disk writes.
