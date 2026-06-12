import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext, ThemeProvider } from './context/ThemeContext';
import Downloader from './pages/Downloader';
import { 
  Sun, Moon, Settings, History, Info, X, 
  Trash2, Sliders, Shield, Volume2, Globe, Heart,
  CheckCircle, AlertTriangle
} from 'lucide-react';

function AppContent() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  
  // Settings Modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDevInfoOpen, setIsDevInfoOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);

  // Preferences (persisted in localstorage)
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('preferences');
    return saved ? JSON.parse(saved) : {
      defaultFormat: 'video',
      defaultQuality: '1080p',
      keepHistory: true,
      language: 'en'
    };
  });

  // History state (persisted in localstorage)
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('download_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('download_history', JSON.stringify(history));
  }, [history]);

  // Display Toast Notification
  const showNotification = (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 4.5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4500);
  };

  // Add to History logs
  const addHistory = (item) => {
    if (!preferences.keepHistory) return;
    const log = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      date: Date.now()
    };
    setHistory(prev => [log, ...prev].slice(0, 50)); // Cap history at 50 logs
  };

  const clearHistory = () => {
    setHistory([]);
    showNotification('Download history cleared', 'success');
  };

  const deleteHistoryItem = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    showNotification('Item removed from history', 'info');
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="app-container">
      {/* 3D Floating Glowing Auras */}
      <div className="aura-blob-container">
        <div className="aura-blob aura-blob-1"></div>
        <div className="aura-blob aura-blob-2"></div>
        <div className="aura-blob aura-blob-3"></div>
      </div>

      {/* Header Panel */}
      <header className="header">
        <a href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/logo.png" 
            alt="CloudClip Logo" 
            style={{ 
              height: '48px', 
              width: 'auto', 
              objectFit: 'contain', 
              WebkitTextFillColor: 'initial' 
            }} 
          />
          CloudClip
        </a>
        <div className="header-actions">
          <button 
            className="icon-btn" 
            onClick={() => setIsHistoryOpen(true)}
            title="Download History"
            aria-label="Toggle Download History"
          >
            <History />
          </button>
          <button 
            className="icon-btn" 
            onClick={() => setIsSettingsOpen(true)}
            title="Preferences"
            aria-label="Toggle Preferences"
          >
            <Settings />
          </button>
          <button 
            className="icon-btn" 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
          <button 
            className="icon-btn" 
            onClick={() => setIsDevInfoOpen(true)}
            title="About Developer"
            aria-label="Toggle Developer Information"
          >
            <Info />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        <Downloader 
          addHistory={addHistory}
          showNotification={showNotification}
          preferences={preferences}
        />

        {/* History Panel Side-Draw */}
        {isHistoryOpen && (
          <div className="modal-overlay" onClick={() => setIsHistoryOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={22} /> Download History
                </h2>
                <button className="icon-btn" onClick={() => setIsHistoryOpen(false)}>
                  <X />
                </button>
              </div>
              <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {history.length === 0 ? (
                  <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No download history yet. Completed downloads will appear here.
                  </div>
                ) : (
                  <div className="history-list">
                    {history.map((item) => (
                      <div key={item.id} className="history-item">
                        <div className="history-details">
                          <div className="history-title">{item.title}</div>
                          <div className="history-time">
                            {item.format} • {item.size} • {new Date(item.date).toLocaleString()}
                          </div>
                        </div>
                        <button 
                          className="icon-btn" 
                          style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
                          onClick={() => deleteHistoryItem(item.id)}
                          title="Remove item"
                        >
                          <Trash2 size={16} color="var(--text-muted)" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {history.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--panel-border)', paddingTop: '1rem' }}>
                  <button className="btn-secondary" onClick={clearHistory}>
                    <Trash2 size={16} />
                    Clear All Logs
                  </button>
                  <button className="btn-primary" onClick={() => setIsHistoryOpen(false)}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Dialog Modal */}
        {isSettingsOpen && (
          <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sliders size={22} /> App Settings
                </h2>
                <button className="icon-btn" onClick={() => setIsSettingsOpen(false)}>
                  <X />
                </button>
              </div>
              <div className="modal-body">
                {/* Default format setting */}
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-title">Default Tab</span>
                    <span className="setting-desc">Preferred output format selection on load</span>
                  </div>
                  <div className="setting-control">
                    <select 
                      value={preferences.defaultFormat}
                      onChange={(e) => updatePreference('defaultFormat', e.target.value)}
                    >
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                    </select>
                  </div>
                </div>

                {/* Default quality setting */}
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-title">Preferred Video Resolution</span>
                    <span className="setting-desc">Tries to auto-select this resolution if available</span>
                  </div>
                  <div className="setting-control">
                    <select 
                      value={preferences.defaultQuality}
                      onChange={(e) => updatePreference('defaultQuality', e.target.value)}
                    >
                      <option value="2160p">4K (2160p)</option>
                      <option value="1440p">2K (1440p)</option>
                      <option value="1080p">Full HD (1080p)</option>
                      <option value="720p">HD (720p)</option>
                      <option value="480p">Standard (480p)</option>
                    </select>
                  </div>
                </div>

                {/* Keep history setting */}
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-title">Enable Download Log</span>
                    <span className="setting-desc">Keep track of downloaded items locally</span>
                  </div>
                  <div className="setting-control">
                    <select 
                      value={preferences.keepHistory ? 'yes' : 'no'}
                      onChange={(e) => updatePreference('keepHistory', e.target.value === 'yes')}
                    >
                      <option value="yes">Enabled</option>
                      <option value="no">Disabled</option>
                    </select>
                  </div>
                </div>

                {/* Language setting */}
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-title">Language</span>
                    <span className="setting-desc">Configure interface localization</span>
                  </div>
                  <div className="setting-control">
                    <select 
                      value={preferences.language}
                      onChange={(e) => updatePreference('language', e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--panel-border)', paddingTop: '1rem' }}>
                <button className="btn-primary" onClick={() => setIsSettingsOpen(false)}>
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Developer Info Dialog Modal */}
        {isDevInfoOpen && (
          <div className="modal-overlay" onClick={() => setIsDevInfoOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={22} /> About Developer
                </h2>
                <button className="icon-btn" onClick={() => setIsDevInfoOpen(false)}>
                  <X />
                </button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '1rem 0' }}>
                <div className="dev-avatar" style={{
                  background: 'var(--primary-gradient)',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '2rem',
                  fontWeight: '800',
                  boxShadow: 'var(--shadow-md)',
                  fontFamily: 'var(--font-display)'
                }}>
                  AG
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>Ashish Goswami</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Flutter Developer & FullStack Developer
                  </p>
                </div>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Name</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700 }}>Ashish Goswami</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Gmail / Email</span>
                    <a href="mailto:ashishgoswami6298@gmail.com" style={{ fontSize: '0.85rem', color: 'var(--input-focus-border)', textDecoration: 'none', fontWeight: 700 }}>
                      ashishgoswami6298@gmail.com
                    </a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>LinkedIn</span>
                    <a href="https://www.linkedin.com/in/ashish-goswami-58797a24a/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--input-focus-border)', textDecoration: 'none', fontWeight: 700 }}>
                      ashish-goswami
                    </a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>GitHub</span>
                    <a href="https://github.com/Ashish6298" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--input-focus-border)', textDecoration: 'none', fontWeight: 700 }}>
                      Ashish6298
                    </a>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--panel-border)', paddingTop: '1rem' }}>
                <button className="btn-primary" onClick={() => setIsDevInfoOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Notifications container (toasts) */}
      <div className="notification-container">
        {notifications.map(n => (
          <div key={n.id} className={`notification ${n.type}`}>
            {n.type === 'success' && <CheckCircle size={18} color="var(--success)" />}
            {n.type === 'error' && <X size={18} color="var(--error)" />}
            {n.type === 'warning' && <AlertTriangle size={18} color="var(--warning)" />}
            {n.type === 'info' && <Info size={18} color="var(--accent-cyan)" />}
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{n.message}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>
          Made with <Heart size={12} fill="var(--accent-pink)" color="var(--accent-pink)" />. 
          Please respect copyright laws and platform terms of service.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
