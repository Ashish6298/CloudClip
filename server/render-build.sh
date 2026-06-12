#!/usr/bin/env bash
set -e

echo "=== Starting Render Server Build ==="

# 1. Set up local bin directory inside server
echo "Creating local bin directory..."
mkdir -p bin

# 2. Download yt-dlp binary
echo "Downloading yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o bin/yt-dlp
chmod +x bin/yt-dlp

# 3. Download static ffmpeg / ffprobe binaries
echo "Downloading static ffmpeg..."
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz
echo "Extracting ffmpeg..."
tar -xf ffmpeg.tar.xz

# Move binaries to bin
cp ffmpeg-*-amd64-static/ffmpeg bin/
cp ffmpeg-*-amd64-static/ffprobe bin/
chmod +x bin/ffmpeg bin/ffprobe

# Clean up
echo "Cleaning up temporary files..."
rm -rf ffmpeg.tar.xz ffmpeg-*-amd64-static

echo "=== Render Server Build Complete ==="
