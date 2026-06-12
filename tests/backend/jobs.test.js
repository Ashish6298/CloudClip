const fs = require('fs');
const path = require('path');
const jobsService = require('../../server/src/services/jobs');
const { JOB_STATUS } = require('../../shared/constants/constants.json');

describe('Jobs Service', () => {
  beforeEach(() => {
    // Clear jobs store map
    jobsService.jobs.clear();
  });

  test('should create and get jobs correctly', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const title = 'Never Gonna Give You Up';
    const jobId = 'test-job-uuid-1';

    const created = jobsService.createJob(jobId, url, title);
    expect(created.jobId).toBe(jobId);
    expect(created.status).toBe(JOB_STATUS.PENDING);
    expect(created.url).toBe(url);

    const retrieved = jobsService.getJob(jobId);
    expect(retrieved).not.toBeNull();
    expect(retrieved.jobId).toBe(jobId);
    expect(retrieved.status).toBe(JOB_STATUS.PENDING);
  });

  test('should update job status and progress', () => {
    const jobId = 'test-job-uuid-2';
    jobsService.createJob(jobId, 'http://youtube.com', 'test');
    
    const updated = jobsService.updateJob(jobId, {
      status: JOB_STATUS.DOWNLOADING,
      progress: 45,
      speed: '5.2 MiB/s',
      eta: '00:12'
    });

    expect(updated.status).toBe(JOB_STATUS.DOWNLOADING);
    expect(updated.progress).toBe(45);
    expect(updated.speed).toBe('5.2 MiB/s');
    expect(updated.eta).toBe('00:12');

    const retrieved = jobsService.getJob(jobId);
    expect(retrieved.progress).toBe(45);
  });

  test('should calculate active jobs count correctly', () => {
    jobsService.createJob('job1', 'http://y.com', 'test1');
    jobsService.createJob('job2', 'http://y.com', 'test2');
    jobsService.createJob('job3', 'http://y.com', 'test3');

    jobsService.updateJob('job1', { status: JOB_STATUS.DOWNLOADING });
    jobsService.updateJob('job2', { status: JOB_STATUS.MERGING });
    jobsService.updateJob('job3', { status: JOB_STATUS.COMPLETED });

    expect(jobsService.getActiveJobsCount()).toBe(2);
  });

  test('should terminate active jobs and update status on cancel', () => {
    const jobId = 'job-cancel';
    const mockKill = jest.fn();
    
    // Register job with a mocked child process
    const job = jobsService.createJob(jobId, 'http://y.com', 'test');
    jobsService.jobs.get(jobId).process = { kill: mockKill };
    
    const success = jobsService.cancelJob(jobId);
    expect(success).toBe(true);
    expect(mockKill).toHaveBeenCalledWith('SIGTERM');
    
    const updated = jobsService.getJob(jobId);
    expect(updated.status).toBe(JOB_STATUS.CANCELLED);
  });

  test('should clean stale completed/failed/cancelled jobs', () => {
    const now = Date.now();
    
    // Create an old completed job (older than 10 minutes)
    const oldJob = jobsService.createJob('old-completed', 'http://y.com', 'old');
    jobsService.jobs.get('old-completed').createdAt = now - 700000; // 11.6 min ago
    jobsService.updateJob('old-completed', { status: JOB_STATUS.COMPLETED });

    // Create a new completed job (1 minute ago)
    const newJob = jobsService.createJob('new-completed', 'http://y.com', 'new');
    jobsService.jobs.get('new-completed').createdAt = now - 60000; // 1 min ago
    jobsService.updateJob('new-completed', { status: JOB_STATUS.COMPLETED });

    // Clean files older than 10 minutes (600,000 ms)
    const cleaned = jobsService.cleanOldJobs(600000);

    expect(cleaned).toBe(1);
    expect(jobsService.getJob('old-completed')).toBeNull();
    expect(jobsService.getJob('new-completed')).not.toBeNull();
  });
});
