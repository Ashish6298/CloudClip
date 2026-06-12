const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:5000/api' 
  : '/api';

/**
 * Handle API responses and throw parsed errors.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: `HTTP Error ${response.status}: ${response.statusText}` };
    }
    const err = new Error(errorData.message || 'API request failed');
    err.code = errorData.code || 'API_ERROR';
    throw err;
  }
  return response.json();
}

/**
 * Fetch media metadata from URL.
 */
export async function getMetadata(url) {
  const response = await fetch(`${API_BASE}/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return handleResponse(response);
}

/**
 * Start download job.
 */
export async function prepareDownload(url, formatId, type, title) {
  const response = await fetch(`${API_BASE}/download/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formatId, type, title })
  });
  return handleResponse(response);
}

/**
 * Check job status.
 */
export async function getJobStatus(jobId) {
  const response = await fetch(`${API_BASE}/download/status/${jobId}`);
  return handleResponse(response);
}

/**
 * Cancel a download job.
 */
export async function cancelDownload(jobId) {
  const response = await fetch(`${API_BASE}/download/cancel/${jobId}`, {
    method: 'POST'
  });
  return handleResponse(response);
}

/**
 * Get the direct download URL for a completed job.
 */
export function getDownloadFileUrl(jobId) {
  return `${API_BASE}/download/file/${jobId}`;
}
