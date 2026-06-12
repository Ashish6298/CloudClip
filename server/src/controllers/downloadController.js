const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { JOB_STATUS, ERROR_CODES } = require('../../../shared/constants/constants.json');
const ytDlpService = require('../services/ytDlp');
const jobsService = require('../services/jobs');

/**
 * Extract metadata for a URL.
 */
async function getMetadata(req, res) {
  const { url } = req.body;
  try {
    const metadata = await ytDlpService.getMetadata(url);
    return res.json(metadata);
  } catch (error) {
    console.error('Metadata retrieval error:', error);
    const status = error.code === ERROR_CODES.UNSUPPORTED_SITE || error.code === ERROR_CODES.INVALID_URL ? 400 : 500;
    return res.status(status).json({
      code: error.code || ERROR_CODES.METADATA_FAILED,
      message: error.message || 'Failed to fetch metadata'
    });
  }
}

/**
 * Start a download job in the background.
 */
async function prepareDownload(req, res) {
  const { url, formatId, type, title } = req.body;
  
  if (!url || !formatId || !type) {
    return res.status(400).json({
      code: ERROR_CODES.INVALID_URL,
      message: 'URL, formatId, and download type are required'
    });
  }

  // Check concurrency limit
  const activeJobs = jobsService.getActiveJobsCount();
  if (activeJobs >= config.MAX_CONCURRENT_DOWNLOADS) {
    return res.status(429).json({
      code: ERROR_CODES.CONCURRENCY_LIMIT,
      message: `The server is at max capacity (${config.MAX_CONCURRENT_DOWNLOADS} active downloads). Please try again shortly.`
    });
  }

  const jobId = uuidv4();
  const fileName = title || 'download';
  
  // Register job
  const job = jobsService.createJob(jobId, url, fileName);

  // Trigger download asynchronously
  ytDlpService.startDownload(jobId, url, formatId, type);

  return res.status(202).json({
    jobId,
    status: job.status
  });
}

/**
 * Get the status of an active job.
 */
function getJobStatus(req, res) {
  const { jobId } = req.params;
  const job = jobsService.getJob(jobId);
  
  if (!job) {
    return res.status(404).json({
      code: ERROR_CODES.JOB_NOT_FOUND,
      message: 'Download job not found'
    });
  }

  return res.json(job);
}

/**
 * Deliver completed download file and clean it up immediately.
 */
function downloadFile(req, res) {
  const { jobId } = req.params;
  const rawJob = jobsService.jobs.get(jobId);

  if (!rawJob) {
    return res.status(404).json({
      code: ERROR_CODES.JOB_NOT_FOUND,
      message: 'Download job not found'
    });
  }

  if (rawJob.status !== JOB_STATUS.COMPLETED || !rawJob.filePath || !fs.existsSync(rawJob.filePath)) {
    return res.status(400).json({
      code: ERROR_CODES.DOWNLOAD_FAILED,
      message: 'The requested file is not prepared or has expired'
    });
  }

  const filePath = rawJob.filePath;
  const downloadName = rawJob.fileName;

  // Serve file and clean up once finished
  res.download(filePath, downloadName, (err) => {
    if (err) {
      console.error(`File transfer error for job ${jobId}:`, err);
    }
    
    // Cleanup temporary files
    try {
      jobsService.cleanupJobFiles(jobId, filePath);
      // Clear filePath so it cannot be downloaded again
      const jobCopy = jobsService.jobs.get(jobId);
      if (jobCopy) {
        jobCopy.filePath = null;
      }
      console.log(`Cleaned up temp files for job ${jobId} after transfer`);
    } catch (e) {
      console.error(`Error unlinking file for job ${jobId}:`, e);
    }
  });
}

/**
 * Cancel an active download job.
 */
function cancelDownload(req, res) {
  const { jobId } = req.params;
  const success = jobsService.cancelJob(jobId);
  
  if (!success) {
    return res.status(404).json({
      code: ERROR_CODES.JOB_NOT_FOUND,
      message: 'Download job not found'
    });
  }

  return res.json({ success: true, message: 'Job cancelled successfully' });
}

module.exports = {
  getMetadata,
  prepareDownload,
  getJobStatus,
  downloadFile,
  cancelDownload
};
