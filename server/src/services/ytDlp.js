const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const sanitize = require('sanitize-filename');
const config = require('../config/config');
const { JOB_STATUS, ERROR_CODES } = require('../../../shared/constants/constants.json');
const jobsService = require('./jobs');

// Prepend local bin to PATH if it exists (e.g., on Render deployment)
const binPath = path.resolve(__dirname, '../../bin');
if (fs.existsSync(binPath)) {
  process.env.PATH = `${binPath}${path.delimiter}${process.env.PATH}`;
  console.log('Prepended local bin to PATH:', binPath);
}

// Path to cookies file (written from YOUTUBE_COOKIES env var at server startup)
const cookiesPath = path.resolve(__dirname, '../../cookies.txt');
const cookiesFlag = fs.existsSync(cookiesPath) ? `--cookies "${cookiesPath}"` : '';

/**
 * Fetch media metadata using yt-dlp -J.
 */
function getMetadata(url) {
  return new Promise((resolve, reject) => {
    // Check url validity
    if (!url) {
      return reject({ code: ERROR_CODES.INVALID_URL, message: 'URL is required' });
    }

    // Run yt-dlp --dump-json --no-playlist
    // android+mweb clients use the internal Google API path which doesn't require cookies.
    // Passing stale/rotated cookies makes bot detection WORSE, so we omit them entirely.
    const cmd = `yt-dlp --js-runtimes node --extractor-args "youtube:player_client=android,mweb" --dump-json --no-playlist "${url.replace(/"/g, '\\"')}"`;
    
    // Increase maxBuffer to 15MB to handle very large metadata JSONs
    exec(cmd, { maxBuffer: 15 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error('yt-dlp metadata error:', stderr || error.message);
        
        let errorCode = ERROR_CODES.METADATA_FAILED;
        let errorMessage = 'Failed to extract metadata from the provided URL';
        
        if (stderr && (stderr.includes('Unsupported URL') || stderr.includes('not a valid URL'))) {
          errorCode = ERROR_CODES.UNSUPPORTED_SITE;
          errorMessage = 'The provided website or URL is not supported by the downloader';
        } else if (stderr && stderr.includes('Sign in to confirm your age')) {
          errorMessage = 'This video is age-restricted and requires authentication';
        }
        
        return reject({ code: errorCode, message: errorMessage, details: stderr });
      }

      try {
        const data = JSON.parse(stdout);
        const parsed = parseMetadata(data, url);
        resolve(parsed);
      } catch (e) {
        console.error('Failed to parse metadata JSON:', e);
        reject({ code: ERROR_CODES.SERVER_ERROR, message: 'Failed to process metadata response' });
      }
    });
  });
}

/**
 * Parse yt-dlp raw JSON into standardized frontend structures.
 */
function parseMetadata(data, url) {
  const duration = data.duration || 0;
  const rawFormats = data.formats || [];
  
  const videoFormats = [];
  const audioFormats = [];

  rawFormats.forEach(f => {
    const isVideo = f.vcodec && f.vcodec !== 'none';
    const isAudio = f.acodec && f.acodec !== 'none';
    
    // Estimate size if missing
    let size = f.filesize || f.filesize_approx || null;
    if (!size && f.tbr && duration) {
      // tbr is in kbps. size = tbr * 1000 * duration / 8
      size = Math.round((f.tbr * 1000 * duration) / 8);
    }

    const note = f.format_note || f.format || '';
    
    if (isVideo) {
      // Video format
      const resolution = f.height ? `${f.height}p` : 'Unknown';
      const fps = f.fps ? `${f.fps}fps` : '';
      
      videoFormats.push({
        formatId: f.format_id,
        resolution,
        height: f.height || 0,
        fps: f.fps || null,
        ext: f.ext,
        vcodec: f.vcodec,
        acodec: f.acodec,
        size,
        hasAudio: isAudio,
        note: `${resolution}${fps ? ` ${fps}` : ''} (${f.ext}) ${note}`.trim()
      });
    } else if (isAudio) {
      // Audio-only format
      const bitrate = f.abr ? `${Math.round(f.abr)}kbps` : (f.tbr ? `${Math.round(f.tbr)}kbps` : 'Unknown');
      
      audioFormats.push({
        formatId: f.format_id,
        ext: f.ext,
        acodec: f.acodec,
        bitrate,
        size,
        note: `${f.ext.toUpperCase()} (${bitrate}) ${note}`.trim()
      });
    }
  });

  // Sort video formats: height (descending), fps (descending), size (descending)
  videoFormats.sort((a, b) => {
    if (b.height !== a.height) return b.height - a.height;
    if (b.fps !== a.fps) return (b.fps || 0) - (a.fps || 0);
    return (b.size || 0) - (a.size || 0);
  });

  // Sort audio formats: size / bitrate (descending)
  audioFormats.sort((a, b) => (b.size || 0) - (a.size || 0));

  // Add virtual audio options for MP3 conversion (since ffmpeg is installed)
  audioFormats.unshift(
    {
      formatId: 'mp3-320k',
      ext: 'mp3',
      acodec: 'mp3',
      bitrate: '320kbps',
      size: duration ? Math.round((320 * 1000 * duration) / 8) : null,
      note: 'MP3 (High Quality 320kbps) - Conversion'
    },
    {
      formatId: 'mp3-192k',
      ext: 'mp3',
      acodec: 'mp3',
      bitrate: '192kbps',
      size: duration ? Math.round((192 * 1000 * duration) / 8) : null,
      note: 'MP3 (Standard Quality 192kbps) - Conversion'
    }
  );

  // Get best available thumbnail
  let thumbnail = data.thumbnail || '';
  if (data.thumbnails && data.thumbnails.length > 0) {
    // Find thumbnail with highest height/width or just the last one
    const sortedThumbnails = [...data.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
    thumbnail = sortedThumbnails[0].url || thumbnail;
  }

  return {
    title: data.title || 'Unknown Title',
    description: data.description || '',
    thumbnail,
    duration,
    uploader: data.uploader || 'Unknown Creator',
    url,
    formats: {
      video: videoFormats,
      audio: audioFormats
    }
  };
}

/**
 * Start download job. Spawns yt-dlp.
 */
function startDownload(jobId, url, formatId, type) {
  // Ensure temp dir exists
  if (!fs.existsSync(config.DOWNLOAD_DIR)) {
    fs.mkdirSync(config.DOWNLOAD_DIR, { recursive: true });
  }

  const job = jobsService.getJob(jobId);
  if (!job) return;

  const outputTemplate = path.join(config.DOWNLOAD_DIR, `${jobId}.%(ext)s`);
  const args = [];

  // android+mweb: internal Google API, no cookies needed.
  // Passing stale cookies triggers more YouTube suspicion than no cookies.
  args.push('--js-runtimes', 'node');
  args.push('--extractor-args', 'youtube:player_client=android,mweb');

  // Construct arguments
  if (type === 'audio') {
    if (formatId.startsWith('mp3-')) {
      const bitrate = formatId.split('-')[1]; // '320k' or '192k'
      args.push(
        '-f', 'bestaudio',
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', bitrate,
        '-o', outputTemplate,
        url
      );
    } else {
      args.push(
        '-f', formatId,
        '-o', outputTemplate,
        url
      );
    }
  } else {
    // Video type.
    // If format is a standard ID, check if it has audio.
    // High-resolution formats (e.g. YouTube 1080p/4K) require merging.
    // We specify: format_id+bestaudio. yt-dlp will automatically merge them using ffmpeg.
    args.push(
      '-f', `${formatId}+bestaudio/best`,
      '--merge-output-format', 'mp4',
      '-o', outputTemplate,
      url
    );
  }

  // Spawn yt-dlp process
  console.log(`Spawning yt-dlp with args: ${args.join(' ')}`);
  const child = spawn('yt-dlp', args);

  // Update job process reference
  const rawJob = jobsService.jobs.get(jobId);
  if (rawJob) {
    rawJob.process = child;
    rawJob.status = JOB_STATUS.DOWNLOADING;
  }

  // Parse progress output
  // Example stdout line: [download]  12.5% of  10.00MiB at  1.50MiB/s ETA 00:05
  // Example merging line: [Merger] Merging formats into "..."
  const progressRegex = /\[download\]\s+([0-9.]+)%\s+of\s+(?:~)?([0-9.a-zA-Z]+)\s+at\s+([0-9.a-zA-Z/]+)\s+ETA\s+([0-9:]+)/;
  
  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      // Check for merger
      if (line.includes('[Merger]') || line.includes('[ffmpeg]')) {
        jobsService.updateJob(jobId, {
          status: JOB_STATUS.MERGING,
          progress: 99,
          speed: '0 B/s',
          eta: '--:--'
        });
        continue;
      }

      // Check for standard download progress
      const match = line.match(progressRegex);
      if (match) {
        const progress = parseFloat(match[1]);
        const totalSize = match[2];
        const speed = match[3];
        const eta = match[4];

        jobsService.updateJob(jobId, {
          status: JOB_STATUS.DOWNLOADING,
          progress,
          totalSize,
          speed,
          eta
        });
      }
    }
  });

  child.stderr.on('data', (data) => {
    const line = data.toString();
    console.warn(`yt-dlp stderr [${jobId}]:`, line);
    // Some warnings are non-fatal, but we can log them
  });

  child.on('close', (code) => {
    console.log(`yt-dlp process for job ${jobId} exited with code ${code}`);
    
    const currentJob = jobsService.jobs.get(jobId);
    if (!currentJob) return;

    if (currentJob.status === JOB_STATUS.CANCELLED) {
      console.log(`Job ${jobId} was already cancelled.`);
      return;
    }

    if (code === 0) {
      // Find the completed file in the temp directory (starts with jobId)
      try {
        const files = fs.readdirSync(config.DOWNLOAD_DIR);
        const matchFile = files.find(f => f.startsWith(jobId));

        if (matchFile) {
          const finalFilePath = path.join(config.DOWNLOAD_DIR, matchFile);
          
          // Generate a user-friendly name using the video title and extension
          const ext = path.extname(matchFile);
          const cleanTitle = sanitize(currentJob.fileName) || 'download';
          const downloadName = `${cleanTitle}${ext}`;

          jobsService.updateJob(jobId, {
            status: JOB_STATUS.COMPLETED,
            progress: 100,
            speed: '0 B/s',
            eta: '00:00',
            filePath: finalFilePath,
            fileName: downloadName,
            process: null
          });
          console.log(`Job ${jobId} completed successfully. Saved to ${finalFilePath}`);
        } else {
          throw new Error('Downloaded file not found in temp directory');
        }
      } catch (e) {
        console.error(`Error completing job ${jobId}:`, e);
        jobsService.updateJob(jobId, {
          status: JOB_STATUS.FAILED,
          error: 'Downloaded file could not be finalized.',
          process: null
        });
      }
    } else {
      jobsService.updateJob(jobId, {
        status: JOB_STATUS.FAILED,
        error: `yt-dlp exited with error code ${code}. Check the logs or try another quality option.`,
        process: null
      });
    }
  });
}

module.exports = {
  getMetadata,
  startDownload
};
