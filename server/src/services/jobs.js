const fs = require('fs');
const path = require('path');
const { JOB_STATUS } = require('../../../shared/constants/constants.json');

// In-memory store for jobs
const jobs = new Map();

/**
 * Create a new download job.
 */
function createJob(jobId, url, fileName) {
  const job = {
    jobId,
    url,
    status: JOB_STATUS.PENDING,
    progress: 0,
    speed: '0 B/s',
    eta: '--:--',
    totalSize: 'Unknown',
    filePath: null,
    fileName: fileName,
    error: null,
    process: null,
    createdAt: Date.now()
  };
  jobs.set(jobId, job);
  return job;
}

/**
 * Get job details. Excluding the process reference for safety when sending to client.
 */
function getJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return null;
  
  // Return a copy without the child process reference
  const { process, ...jobData } = job;
  return jobData;
}

/**
 * Update job details.
 */
function updateJob(jobId, updates) {
  const job = jobs.get(jobId);
  if (job) {
    Object.assign(job, updates);
    return job;
  }
  return null;
}

/**
 * Cancel a job and clean up its files.
 */
function cancelJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return false;

  // Kill the process if running
  if (job.process) {
    try {
      job.process.kill('SIGTERM');
    } catch (e) {
      console.error(`Failed to kill process for job ${jobId}:`, e);
    }
  }

  job.status = JOB_STATUS.CANCELLED;
  job.progress = 0;
  job.speed = '0 B/s';
  job.eta = '--:--';

  // Clean up any files associated with this job
  cleanupJobFiles(jobId, job.filePath);
  return true;
}

/**
 * Get count of currently active downloads.
 */
function getActiveJobsCount() {
  let count = 0;
  for (const job of jobs.values()) {
    if (job.status === JOB_STATUS.DOWNLOADING || job.status === JOB_STATUS.MERGING) {
      count++;
    }
  }
  return count;
}

/**
 * Clean up files matching jobId in temp directory.
 */
function cleanupJobFiles(jobId, specificPath = null) {
  // If we have a specific completed path, try to delete it
  if (specificPath && fs.existsSync(specificPath)) {
    try {
      fs.unlinkSync(specificPath);
    } catch (e) {
      console.error(`Failed to delete completed file ${specificPath}:`, e);
    }
  }

  // Also clean up any partial download files (.part, .temp, etc) in target temp dir
  const config = require('../config/config');
  const tempDir = config.DOWNLOAD_DIR;
  if (fs.existsSync(tempDir)) {
    try {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        if (file.startsWith(jobId)) {
          const filePath = path.join(tempDir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (e) {
      console.error(`Error cleaning up files for job ${jobId}:`, e);
    }
  }
}

/**
 * Clean up old jobs and files that have expired.
 */
function cleanOldJobs(lifetimeMs) {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [jobId, job] of jobs.entries()) {
    const age = now - job.createdAt;
    
    // Clean completed, failed, or cancelled jobs older than lifetimeMs
    // Also clean active jobs that are stuck (e.g. older than 1 hour)
    const isStale = (
      [JOB_STATUS.COMPLETED, JOB_STATUS.FAILED, JOB_STATUS.CANCELLED].includes(job.status) && age > lifetimeMs
    ) || (
      [JOB_STATUS.DOWNLOADING, JOB_STATUS.MERGING, JOB_STATUS.PENDING].includes(job.status) && age > 3600000 // 1 hour
    );

    if (isStale) {
      if (job.process) {
        try { job.process.kill('SIGTERM'); } catch(e){}
      }
      cleanupJobFiles(jobId, job.filePath);
      jobs.delete(jobId);
      cleanedCount++;
    }
  }
  return cleanedCount;
}

module.exports = {
  createJob,
  getJob,
  updateJob,
  cancelJob,
  getActiveJobsCount,
  cleanupJobFiles,
  cleanOldJobs,
  jobs // Exposing the raw map for testing
};
