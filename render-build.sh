#!/usr/bin/env bash
set -e

echo "=== Starting Render Build ==="

# 1. Install dependencies
echo "Installing project dependencies..."
npm install --legacy-peer-deps
npm run install:client
npm run install:server

# 2. Set up local bin directory
echo "Creating local bin directory..."
mkdir -p server/bin

# 3. Download yt-dlp binary
echo "Downloading yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o server/bin/yt-dlp
chmod +x server/bin/yt-dlp

# 4. Download static ffmpeg / ffprobe binaries
echo "Downloading static ffmpeg..."
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz
echo "Extracting ffmpeg..."
tar -xf ffmpeg.tar.xz

# Move binaries to server/bin
cp ffmpeg-*-amd64-static/ffmpeg server/bin/
cp ffmpeg-*-amd64-static/ffprobe server/bin/
chmod +x server/bin/ffmpeg server/bin/ffprobe

# Clean up
echo "Cleaning up temporary files..."
rm -rf ffmpeg.tar.xz ffmpeg-*-amd64-static

echo "=== Render Build Complete ==="
