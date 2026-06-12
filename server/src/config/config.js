const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rootDir = path.resolve(__dirname, '../../');
const downloadDir = path.resolve(rootDir, process.env.DOWNLOAD_DIR || 'downloads/temp');

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DOWNLOAD_DIR: downloadDir,
  CLEANUP_INTERVAL_MS: parseInt(process.env.CLEANUP_INTERVAL_MS, 10) || 300000, // 5 min
  FILE_LIFETIME_MS: parseInt(process.env.FILE_LIFETIME_MS, 10) || 600000, // 10 min
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 min
  MAX_CONCURRENT_DOWNLOADS: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS, 10) || 3
};
