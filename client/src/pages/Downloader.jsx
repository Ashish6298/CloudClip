import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Film, Music, Download, AlertTriangle, 
  RefreshCw, CheckCircle, Play, Info, XCircle,
  Shield, Globe
} from 'lucide-react';
import * as api from '../services/api';
import constants from '../../../shared/constants/constants.json';
const { JOB_STATUS } = constants;

// Format duration from seconds (e.g. 135 -> 2:15)
const formatDuration = (sec) => {
  if (!sec) return '0:00';
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = Math.floor(sec % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format file size (e.g. 1048576 -> 1.00 MB)
const formatSize = (bytes) => {
  if (!bytes) return 'Unknown Size';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function Downloader({ addHistory, showNotification, preferences }) {
  const [url, setUrl] = useState('');
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [metadata, setMetadata] = useState(null);
  
  // Tabs: 'video' | 'audio'
  const [activeTab, setActiveTab] = useState('video');
  const [selectedFormat, setSelectedFormat] = useState(null);

  // Active Download Jobs State
  const [activeJob, setActiveJob] = useState(null);
  const pollingRef = useRef(null);

  // Clean polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Handle URL Form Submission
  const handleFetchMetadata = async (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoadingMetadata(true);
    setMetadata(null);
    setSelectedFormat(null);

    try {
      const data = await api.getMetadata(url);
      setMetadata(data);
      
      // Auto-select best format based on preferences or default to first
      const defaultType = preferences.defaultFormat || 'video';
      setActiveTab(defaultType);
      
      const formatsList = defaultType === 'video' ? data.formats.video : data.formats.audio;
      if (formatsList && formatsList.length > 0) {
        // Find best match matching defaultQuality preference if video
        let selected = formatsList[0];
        if (defaultType === 'video' && preferences.defaultQuality) {
          const match = formatsList.find(f => f.resolution.includes(preferences.defaultQuality));
          if (match) selected = match;
        }
        setSelectedFormat(selected);
      }
      
      showNotification('Link analyzed successfully!', 'success');
    } catch (err) {
      console.error(err);
      showNotification(err.message || 'Failed to analyze link', 'error');
    } finally {
      setLoadingMetadata(false);
    }
  };

  // Start the download preparation job
  const handleStartDownload = async () => {
    if (!metadata || !selectedFormat) return;

    try {
      showNotification('Preparing your file on the server...', 'info');
      
      const jobData = await api.prepareDownload(
        metadata.url,
        selectedFormat.formatId,
        activeTab,
        metadata.title
      );

      // Initialize active job representation
      const initialJobState = {
        jobId: jobData.jobId,
        status: jobData.status || JOB_STATUS.PENDING,
        progress: 0,
        speed: '0 B/s',
        eta: '--:--',
        totalSize: selectedFormat.size ? formatSize(selectedFormat.size) : 'Unknown',
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        formatNote: selectedFormat.note,
        ext: selectedFormat.ext
      };

      setActiveJob(initialJobState);
      startPolling(jobData.jobId);
    } catch (err) {
      console.error(err);
      showNotification(err.message || 'Failed to start download process', 'error');
    }
  };

  // Poll Job Status from Backend
  const startPolling = (jobId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const statusData = await api.getJobStatus(jobId);
        
        setActiveJob(prev => ({
          ...prev,
          status: statusData.status,
          progress: statusData.progress,
          speed: statusData.speed,
          eta: statusData.eta,
          // If size was unknown, update it if server extracted it
          totalSize: statusData.totalSize !== 'Unknown' ? statusData.totalSize : prev.totalSize,
          // Carry file name once completed
          fileName: statusData.fileName || prev.fileName
        }));

        if (statusData.status === JOB_STATUS.COMPLETED) {
          clearInterval(pollingRef.current);
          showNotification('Media download ready!', 'success');
          
          // Log to download history
          addHistory({
            title: statusData.fileName || activeJob?.title || metadata?.title,
            url: metadata?.url,
            type: activeTab,
            format: selectedFormat?.note || activeJob?.formatNote,
            size: statusData.totalSize !== 'Unknown' ? statusData.totalSize : formatSize(selectedFormat?.size)
          });
        } else if (statusData.status === JOB_STATUS.FAILED) {
          clearInterval(pollingRef.current);
          showNotification(statusData.error || 'Server processing failed', 'error');
        }
      } catch (err) {
        console.error('Polling error:', err);
        // Do not fail immediately on a simple network cut, but keep polling
      }
    }, 1000); // Poll every second for super snappy updates
  };

  // Cancel Current Download
  const handleCancelDownload = async () => {
    if (!activeJob) return;
    
    try {
      if (pollingRef.current) clearInterval(pollingRef.current);
      await api.cancelDownload(activeJob.jobId);
      
      setActiveJob(null);
      showNotification('Download cancelled', 'info');
    } catch (err) {
      console.error(err);
      showNotification('Could not cancel download on server', 'error');
    }
  };

  // Trigger Local browser download & Reset State
  const triggerFileDownload = () => {
    if (!activeJob || activeJob.status !== JOB_STATUS.COMPLETED) return;
    
    // Point browser window to download endpoint
    const downloadUrl = api.getDownloadFileUrl(activeJob.jobId);
    window.location.href = downloadUrl;
    
    // Clear active card after short delay
    setTimeout(() => {
      setActiveJob(null);
    }, 2000);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const formatsList = tab === 'video' ? metadata.formats.video : metadata.formats.audio;
    if (formatsList && formatsList.length > 0) {
      setSelectedFormat(formatsList[0]);
    } else {
      setSelectedFormat(null);
    }
  };

  return (
    <div className="downloader-page">
      {/* Search Header */}
      <div className="hero">
        <h1>CloudClip <span>Media Downloader</span></h1>
        <p>Convert and download videos or audios from YouTube, Vimeo, SoundCloud, TikTok, and more instantly.</p>
      </div>

      {/* Input Panel */}
      <div className="search-card">
        <form onSubmit={handleFetchMetadata} className="search-form">
          <div className="input-container">
            <input 
              type="text" 
              placeholder="Paste media link here (e.g. https://www.youtube.com/watch?...)" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loadingMetadata || (activeJob && activeJob.status === JOB_STATUS.DOWNLOADING)}
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loadingMetadata || !url.trim() || (activeJob && (activeJob.status === JOB_STATUS.DOWNLOADING || activeJob.status === JOB_STATUS.MERGING))}
          >
            {loadingMetadata ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <Search size={18} />
            )}
            <span>{loadingMetadata ? 'Analyzing...' : 'Analyze'}</span>
          </button>
        </form>
      </div>

      {/* Information Cards (Only shown on landing state) */}
      {!metadata && !loadingMetadata && !activeJob && (
        <div className="info-section-grid" style={{ marginTop: '1.5rem' }}>
          <div className="info-card">
            <div className="info-card-icon"><Shield size={20} color="var(--input-focus-border)" /></div>
            <h3>Privacy & Security First</h3>
            <p>Your media downloads are secure. Files are automatically and permanently deleted from our server immediately after download, or after 10 minutes of inactivity.</p>
          </div>
          <div className="info-card">
            <div className="info-card-icon"><Film size={20} color="var(--accent-cyan)" /></div>
            <h3>High-Definition Support</h3>
            <p>Supports video downloads up to 4K resolution and high-bitrate audio. Streams are merged dynamically on our server for premium quality playback.</p>
          </div>
          <div className="info-card">
            <div className="info-card-icon"><Globe size={20} color="var(--accent-pink)" /></div>
            <h3>Supported Sites</h3>
            <div className="supported-badges">
              <span className="badge">YouTube</span>
              <span className="badge">SoundCloud</span>
              <span className="badge">Vimeo</span>
              <span className="badge">TikTok</span>
              <span className="badge">Twitter/X</span>
              <span className="badge">Instagram</span>
            </div>
          </div>
        </div>
      )}

      {/* active download task details panel */}
      {activeJob && (
        <div style={{ marginTop: '2rem' }}>
          <div className="download-status-card">
            <div className="status-header">
              <h3 style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                {activeJob.title}
              </h3>
              <span className={`status-badge ${activeJob.status}`}>
                {activeJob.status === JOB_STATUS.PENDING && 'Preparing'}
                {activeJob.status === JOB_STATUS.DOWNLOADING && 'Downloading'}
                {activeJob.status === JOB_STATUS.MERGING && 'Merging (FFmpeg)'}
                {activeJob.status === JOB_STATUS.COMPLETED && 'Completed'}
                {activeJob.status === JOB_STATUS.FAILED && 'Failed'}
                {activeJob.status === JOB_STATUS.CANCELLED && 'Cancelled'}
              </span>
            </div>

            {/* Progress line */}
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${activeJob.progress}%`,
                  background: activeJob.status === JOB_STATUS.MERGING ? 'var(--warning)' : 'var(--primary-gradient)'
                }}
              />
            </div>

            {/* Speeds & ETAs */}
            <div className="progress-metrics">
              <span>{activeJob.progress}% finished</span>
              {activeJob.status === JOB_STATUS.DOWNLOADING && (
                <span>{activeJob.speed} • ETA: {activeJob.eta}</span>
              )}
              {activeJob.status === JOB_STATUS.MERGING && (
                <span>Encoding streams...</span>
              )}
              {activeJob.status === JOB_STATUS.COMPLETED && (
                <span>Ready for local download ({activeJob.totalSize})</span>
              )}
            </div>

            {/* Actions */}
            <div className="status-actions">
              {activeJob.status === JOB_STATUS.COMPLETED ? (
                <button className="btn-primary" onClick={triggerFileDownload}>
                  <Download size={16} />
                  Save to Device
                </button>
              ) : activeJob.status === JOB_STATUS.FAILED ? (
                <button className="btn-secondary" onClick={() => setActiveJob(null)}>
                  <RefreshCw size={16} />
                  Dismiss
                </button>
              ) : (
                <button className="btn-secondary" style={{ borderColor: 'var(--error)' }} onClick={handleCancelDownload}>
                  <XCircle size={16} color="var(--error)" />
                  Cancel Download
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Skeletons */}
      {loadingMetadata && (
        <div style={{ marginTop: '2rem' }} className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-thumb"></div>
            <div className="skeleton-details">
              <div className="skeleton-line title"></div>
              <div className="skeleton-line meta"></div>
            </div>
          </div>
          <div className="skeleton-line" style={{ width: '40%' }}></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
        </div>
      )}

      {/* Metadata Formats Picker */}
      {metadata && !loadingMetadata && (
        <div style={{ marginTop: '2rem' }}>
          <div className="result-card">
            {/* Header info */}
            <div className="media-info">
              <div className="media-thumbnail-container">
                <img 
                  src={metadata.thumbnail || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=300&auto=format&fit=crop'} 
                  alt={metadata.title} 
                  className="media-thumbnail" 
                />
                <span className="media-duration">{formatDuration(metadata.duration)}</span>
              </div>
              <div className="media-meta">
                <h2 className="media-title" title={metadata.title}>{metadata.title}</h2>
                <p className="media-creator">{metadata.uploader}</p>
                {metadata.description && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {metadata.description}
                  </p>
                )}
              </div>
            </div>

            {/* Tabs selector */}
            <div className="tabs">
              <button 
                className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
                onClick={() => handleTabChange('video')}
              >
                <Film size={18} />
                Video Formats
              </button>
              <button 
                className={`tab-btn ${activeTab === 'audio' ? 'active' : ''}`}
                onClick={() => handleTabChange('audio')}
              >
                <Music size={18} />
                Audio Formats
              </button>
            </div>

            {/* Formats Grid */}
            <div className="format-grid">
              {activeTab === 'video' ? (
                metadata.formats.video.length > 0 ? (
                  metadata.formats.video.map((f, i) => (
                    <div 
                      key={i} 
                      className={`format-item ${selectedFormat?.formatId === f.formatId ? 'selected' : ''}`}
                      onClick={() => setSelectedFormat(f)}
                    >
                      <div className="format-details-left">
                        <span className="format-spec">{f.resolution} {f.fps ? `(${f.fps}fps)` : ''}</span>
                        <span className="format-subtext">
                          Codec: {f.vcodec} • {f.ext.toUpperCase()} {f.hasAudio ? '• Merged' : '• Requires merging'}
                        </span>
                      </div>
                      <div className="format-right">
                        <span className="format-size">{formatSize(f.size)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No video formats detected.
                  </div>
                )
              ) : (
                metadata.formats.audio.length > 0 ? (
                  metadata.formats.audio.map((f, i) => (
                    <div 
                      key={i} 
                      className={`format-item ${selectedFormat?.formatId === f.formatId ? 'selected' : ''}`}
                      onClick={() => setSelectedFormat(f)}
                    >
                      <div className="format-details-left">
                        <span className="format-spec">{f.note}</span>
                        <span className="format-subtext">Bitrate: {f.bitrate} • Codec: {f.acodec}</span>
                      </div>
                      <div className="format-right">
                        <span className="format-size">{formatSize(f.size)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No audio formats detected.
                  </div>
                )
              )}
            </div>

            {/* Start Download Button */}
            {selectedFormat && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--panel-border)', paddingTop: '1rem' }}>
                <button 
                  className="btn-primary" 
                  onClick={handleStartDownload}
                  disabled={activeJob && (activeJob.status === JOB_STATUS.DOWNLOADING || activeJob.status === JOB_STATUS.MERGING)}
                >
                  <Download size={18} />
                  Download Selected ({formatSize(selectedFormat.size)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
