import { useState, useEffect, useRef } from 'react';
import {
  Settings, Bell, Shield, Database, Globe, Key,
  Sun, Moon, Terminal, Monitor, Download, Upload,
  Trash2, Eye, EyeOff, Copy, Check, RefreshCw,
  Zap, Cpu, HardDrive, Wifi, Lock, Unlock,
  AlertTriangle, CheckCircle, XCircle, Clock,
  Code, Fingerprint, Palette, Volume2, VolumeX,
  RotateCcw, Save, ChevronRight, Activity, Skull
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const settingsNav = [
  { id: 'general', label: 'General', icon: Settings, desc: 'Theme, display & preferences' },
  { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Alerts & notification channels' },
  { id: 'security', label: 'Security', icon: Shield, desc: 'Auth, encryption & access' },
  { id: 'database', label: 'Database', icon: Database, desc: 'DB connections & WebSocket' },
  { id: 'integrations', label: 'Integrations', icon: Globe, desc: 'Third-party services' },
  { id: 'api', label: 'API Keys', icon: Key, desc: 'API management & tokens' },
  { id: 'terminal', label: 'Console', icon: Terminal, desc: 'System diagnostics' },
  { id: 'export', label: 'Data Export', icon: Download, desc: 'Export & backup data' },
];

// Fake hacker-style terminal lines
const TERMINAL_BOOT = [
  { type: 'system', msg: '[BOOT] CyberShield v3.7.2 — Kernel Init...' },
  { type: 'success', msg: '[OK] Neural threat engine loaded (94.3% accuracy)' },
  { type: 'success', msg: '[OK] WebSocket server listening on ws://0.0.0.0:5000' },
  { type: 'system', msg: '[SCAN] Running full system diagnostics...' },
  { type: 'success', msg: '[OK] MongoDB connection pool: 12 active, 0 idle' },
  { type: 'success', msg: '[OK] SSL/TLS certificates: valid (expires 2027-03-15)' },
  { type: 'warning', msg: '[WARN] CPU temp: 67°C — within operational limits' },
  { type: 'success', msg: '[OK] Firewall rules: 847 active, 12 pending review' },
  { type: 'system', msg: '[SCAN] Threat signature database: 2,847,392 signatures loaded' },
  { type: 'success', msg: '[OK] All 14 microservices operational' },
  { type: 'system', msg: '[READY] System fully operational. Awaiting commands...' },
];

// Generate fake API keys
const generateApiKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'csk_';
  for (let i = 0; i < 40; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
  return key;
};

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const { theme, setTheme, themes } = useTheme();
  const { isConnected } = useSocket();
  const { user, logout } = useAuth();
  const [saved, setSaved] = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  const terminalRef = useRef(null);

  const [settings, setSettings] = useState({
    orgName: 'CyberShield HQ',
    adminEmail: user?.email || 'admin@cybershield.io',
    autoRefresh: true,
    refreshInterval: '30',
    language: 'en',
    dateFormat: '24h',
    soundEnabled: true,
    matrixRain: true,
    animationsEnabled: true,
    compactMode: false,
    // Notifications
    emailAlerts: true,
    slackAlerts: false,
    smsAlerts: false,
    discordAlerts: false,
    webhookAlerts: true,
    criticalOnly: false,
    desktopNotify: true,
    alertSound: true,
    emailDigest: 'realtime',
    slackWebhook: 'https://hooks.slack.com/services/T00/B00/xxxx',
    discordWebhook: '',
    webhookUrl: 'https://api.cybershield.io/webhooks/alerts',
    // Security
    twoFactor: true,
    sessionTimeout: '30',
    ipWhitelist: true,
    bruteForceProtection: true,
    encryptionLevel: 'aes256',
    passwordPolicy: 'strong',
    auditLogging: true,
    autoLockout: true,
    lockoutThreshold: '5',
    rateLimiting: true,
    maxRequests: '1000',
    corsEnabled: true,
    // Database
    mongoUri: 'mongodb://127.0.0.1:27017/cybershield',
    wsEnabled: true,
    backupSchedule: 'daily',
    retentionDays: '90',
    compressionEnabled: true,
    replicaSet: false,
    // Integrations
    splunkEnabled: false,
    elasticEnabled: true,
    pagerDutyEnabled: false,
    jiraEnabled: false,
    virustotalEnabled: true,
    shodanEnabled: false,
    // API
    apiKeys: [
      { id: 1, name: 'Production API', key: 'csk_prod_a8f2e9d1c4b7...', created: '2026-03-01', lastUsed: '2026-04-16', status: 'active', requests: 45231 },
      { id: 2, name: 'Development API', key: 'csk_dev_7b3f1a9e5c2d...', created: '2026-02-15', lastUsed: '2026-04-15', status: 'active', requests: 12847 },
      { id: 3, name: 'Webhook Token', key: 'csk_whk_2d8c4f6a1e3b...', created: '2026-01-20', lastUsed: '2026-04-10', status: 'active', requests: 8934 },
    ],
  });

  // Terminal boot sequence
  useEffect(() => {
    if (activeSection === 'terminal') {
      setTerminalLines([]);
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < TERMINAL_BOOT.length) {
          setTerminalLines((prev) => [...prev, { ...TERMINAL_BOOT[idx], time: new Date().toLocaleTimeString() }]);
          idx++;
        } else {
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [activeSection]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const [copiedKey, setCopiedKey] = useState(null);
  const copyToClipboard = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const [visibleKeys, setVisibleKeys] = useState({});
  const toggleKeyVisibility = (id) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // System diagnostics data
  const [diagnostics, setDiagnostics] = useState({
    cpu: 34,
    memory: 62,
    disk: 45,
    network: 89,
    uptime: '14d 7h 23m',
    processes: 847,
    threads: 2341,
    openFiles: 1247,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setDiagnostics((prev) => ({
        ...prev,
        cpu: Math.min(100, Math.max(10, prev.cpu + (Math.random() * 10 - 5))),
        memory: Math.min(100, Math.max(30, prev.memory + (Math.random() * 4 - 2))),
        network: Math.min(100, Math.max(60, prev.network + (Math.random() * 6 - 3))),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // ──────────────────────────────── RENDER SECTIONS ────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="stg-section animate-stg-in">
            <div className="stg-section-header">
              <div>
                <h3><Palette size={20} /> Appearance & Preferences</h3>
                <p className="stg-section-desc">Customize how CyberShield looks and behaves</p>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="stg-group-title"><Palette size={14} /> Theme Selection</div>
            <div className="stg-theme-grid">
              {Object.entries(themes).map(([key, t]) => (
                <div
                  key={key}
                  className={`stg-theme-card ${theme === key ? 'active' : ''}`}
                  onClick={() => setTheme(key)}
                  id={`theme-btn-${key}`}
                >
                  <div className="stg-theme-preview" data-theme={key}>
                    <div className="stg-preview-sidebar" />
                    <div className="stg-preview-main">
                      <div className="stg-preview-header" />
                      <div className="stg-preview-content">
                        <div className="stg-preview-card" />
                        <div className="stg-preview-card" />
                      </div>
                    </div>
                  </div>
                  <div className="stg-theme-info">
                    <span className="stg-theme-name">
                      {key === 'dark' && <Moon size={14} />}
                      {key === 'light' && <Sun size={14} />}
                      {key === 'hacker' && <Terminal size={14} />}
                      {t.label}
                    </span>
                    {theme === key && <CheckCircle size={14} className="stg-theme-check" />}
                  </div>
                </div>
              ))}
            </div>

            {/* General Settings */}
            <div className="stg-group-title"><Settings size={14} /> General</div>
            <div className="stg-card">
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Organization Name</label>
                  <span className="stg-field-desc">Display name across the dashboard</span>
                </div>
                <input
                  type="text"
                  className="stg-input"
                  value={settings.orgName}
                  onChange={(e) => updateSetting('orgName', e.target.value)}
                  id="org-name-input"
                />
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Admin Email</label>
                  <span className="stg-field-desc">Primary contact for system alerts</span>
                </div>
                <input
                  type="email"
                  className="stg-input"
                  value={settings.adminEmail}
                  onChange={(e) => updateSetting('adminEmail', e.target.value)}
                  id="admin-email-input"
                />
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Language</label>
                  <span className="stg-field-desc">Interface display language</span>
                </div>
                <select
                  className="stg-select"
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Time Format</label>
                  <span className="stg-field-desc">Clock display format</span>
                </div>
                <select
                  className="stg-select"
                  value={settings.dateFormat}
                  onChange={(e) => updateSetting('dateFormat', e.target.value)}
                >
                  <option value="24h">24 Hour</option>
                  <option value="12h">12 Hour</option>
                </select>
              </div>
            </div>

            {/* Display Options */}
            <div className="stg-group-title"><Monitor size={14} /> Display</div>
            <div className="stg-card">
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Auto Refresh Dashboard</label>
                  <span className="stg-field-desc">Automatically update data feeds</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('autoRefresh')} id="toggle-auto-refresh">
                  <div className={`stg-toggle-track ${settings.autoRefresh ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
              {settings.autoRefresh && (
                <>
                  <div className="stg-divider" />
                  <div className="stg-field">
                    <div className="stg-field-info">
                      <label>Refresh Interval</label>
                      <span className="stg-field-desc">Seconds between data updates</span>
                    </div>
                    <div className="stg-input-group">
                      <input
                        type="number"
                        className="stg-input stg-input-sm"
                        value={settings.refreshInterval}
                        onChange={(e) => updateSetting('refreshInterval', e.target.value)}
                        min="5"
                        max="300"
                      />
                      <span className="stg-input-suffix">sec</span>
                    </div>
                  </div>
                </>
              )}
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Sound Effects</label>
                  <span className="stg-field-desc">Alert sounds and UI feedback</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('soundEnabled')}>
                  <div className={`stg-toggle-track ${settings.soundEnabled ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                  <span className="stg-toggle-label">
                    {settings.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </span>
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Animations</label>
                  <span className="stg-field-desc">Smooth transitions & micro-animations</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('animationsEnabled')}>
                  <div className={`stg-toggle-track ${settings.animationsEnabled ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Compact Mode</label>
                  <span className="stg-field-desc">Reduce spacing for more data density</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('compactMode')}>
                  <div className={`stg-toggle-track ${settings.compactMode ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="stg-section animate-stg-in">
            <div className="stg-section-header">
              <div>
                <h3><Bell size={20} /> Notification Channels</h3>
                <p className="stg-section-desc">Configure how and where you receive alerts</p>
              </div>
            </div>

            <div className="stg-group-title"><Zap size={14} /> Alert Channels</div>
            <div className="stg-card">
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Email Alerts</label>
                  <span className="stg-field-desc">Receive alerts via email</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('emailAlerts')}>
                  <div className={`stg-toggle-track ${settings.emailAlerts ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
              {settings.emailAlerts && (
                <>
                  <div className="stg-divider" />
                  <div className="stg-field">
                    <div className="stg-field-info">
                      <label>Email Digest Frequency</label>
                      <span className="stg-field-desc">How often to bundle email alerts</span>
                    </div>
                    <select className="stg-select" value={settings.emailDigest} onChange={(e) => updateSetting('emailDigest', e.target.value)}>
                      <option value="realtime">Real-time</option>
                      <option value="hourly">Hourly Digest</option>
                      <option value="daily">Daily Digest</option>
                    </select>
                  </div>
                </>
              )}
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Slack Integration</label>
                  <span className="stg-field-desc">Push alerts to Slack channel</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('slackAlerts')}>
                  <div className={`stg-toggle-track ${settings.slackAlerts ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
              {settings.slackAlerts && (
                <>
                  <div className="stg-divider" />
                  <div className="stg-field">
                    <div className="stg-field-info">
                      <label>Slack Webhook URL</label>
                      <span className="stg-field-desc">Your Slack incoming webhook</span>
                    </div>
                    <input type="text" className="stg-input" value={settings.slackWebhook} onChange={(e) => updateSetting('slackWebhook', e.target.value)} />
                  </div>
                </>
              )}
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Discord Alerts</label>
                  <span className="stg-field-desc">Push alerts to Discord</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('discordAlerts')}>
                  <div className={`stg-toggle-track ${settings.discordAlerts ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>SMS Alerts</label>
                  <span className="stg-field-desc">Text message notifications</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('smsAlerts')}>
                  <div className={`stg-toggle-track ${settings.smsAlerts ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Webhook Endpoint</label>
                  <span className="stg-field-desc">Custom HTTP webhook for alerts</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('webhookAlerts')}>
                  <div className={`stg-toggle-track ${settings.webhookAlerts ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
            </div>

            <div className="stg-group-title"><AlertTriangle size={14} /> Filtering</div>
            <div className="stg-card">
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Critical Alerts Only</label>
                  <span className="stg-field-desc">Only receive critical & high severity</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('criticalOnly')}>
                  <div className={`stg-toggle-track ${settings.criticalOnly ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Desktop Notifications</label>
                  <span className="stg-field-desc">Browser push notifications</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('desktopNotify')}>
                  <div className={`stg-toggle-track ${settings.desktopNotify ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Alert Sound</label>
                  <span className="stg-field-desc">Play audio on new alerts</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('alertSound')}>
                  <div className={`stg-toggle-track ${settings.alertSound ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="stg-section animate-stg-in">
            <div className="stg-section-header">
              <div>
                <h3><Shield size={20} /> Security & Access Control</h3>
                <p className="stg-section-desc">Harden your instance against unauthorized access</p>
              </div>
              <div className="stg-security-score">
                <div className="stg-score-ring">
                  <svg viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="var(--accent-green)" strokeWidth="3"
                      strokeDasharray="87, 100" strokeLinecap="round" />
                  </svg>
                  <span className="stg-score-value">87</span>
                </div>
                <div className="stg-score-label">Security Score</div>
              </div>
            </div>

            <div className="stg-group-title"><Lock size={14} /> Authentication</div>
            <div className="stg-card">
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Two-Factor Authentication</label>
                  <span className="stg-field-desc">TOTP-based second factor</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('twoFactor')}>
                  <div className={`stg-toggle-track ${settings.twoFactor ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Session Timeout</label>
                  <span className="stg-field-desc">Auto-logout after inactivity</span>
                </div>
                <div className="stg-input-group">
                  <input type="number" className="stg-input stg-input-sm" value={settings.sessionTimeout}
                    onChange={(e) => updateSetting('sessionTimeout', e.target.value)} />
                  <span className="stg-input-suffix">min</span>
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Password Policy</label>
                  <span className="stg-field-desc">Minimum password requirements</span>
                </div>
                <select className="stg-select" value={settings.passwordPolicy} onChange={(e) => updateSetting('passwordPolicy', e.target.value)}>
                  <option value="basic">Basic (8+ chars)</option>
                  <option value="strong">Strong (12+ mixed)</option>
                  <option value="extreme">Extreme (16+ mixed + special)</option>
                </select>
              </div>
            </div>

            <div className="stg-group-title"><Shield size={14} /> Protection</div>
            <div className="stg-card">
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>IP Whitelist</label>
                  <span className="stg-field-desc">Restrict access to trusted IPs</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('ipWhitelist')}>
                  <div className={`stg-toggle-track ${settings.ipWhitelist ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Brute Force Protection</label>
                  <span className="stg-field-desc">Auto-block after failed login attempts</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('bruteForceProtection')}>
                  <div className={`stg-toggle-track ${settings.bruteForceProtection ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
              {settings.bruteForceProtection && (
                <>
                  <div className="stg-divider" />
                  <div className="stg-field">
                    <div className="stg-field-info">
                      <label>Lockout Threshold</label>
                      <span className="stg-field-desc">Failed attempts before lockout</span>
                    </div>
                    <div className="stg-input-group">
                      <input type="number" className="stg-input stg-input-sm" value={settings.lockoutThreshold}
                        onChange={(e) => updateSetting('lockoutThreshold', e.target.value)} />
                      <span className="stg-input-suffix">attempts</span>
                    </div>
                  </div>
                </>
              )}
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Rate Limiting</label>
                  <span className="stg-field-desc">Limit API requests per minute</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('rateLimiting')}>
                  <div className={`stg-toggle-track ${settings.rateLimiting ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Encryption Level</label>
                  <span className="stg-field-desc">Data-at-rest encryption standard</span>
                </div>
                <select className="stg-select" value={settings.encryptionLevel} onChange={(e) => updateSetting('encryptionLevel', e.target.value)}>
                  <option value="aes128">AES-128</option>
                  <option value="aes256">AES-256 (Recommended)</option>
                  <option value="chacha20">ChaCha20-Poly1305</option>
                </select>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Audit Logging</label>
                  <span className="stg-field-desc">Log all admin actions</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('auditLogging')}>
                  <div className={`stg-toggle-track ${settings.auditLogging ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>CORS Enabled</label>
                  <span className="stg-field-desc">Cross-Origin Resource Sharing</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('corsEnabled')}>
                  <div className={`stg-toggle-track ${settings.corsEnabled ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'database':
        return (
          <div className="stg-section animate-stg-in">
            <div className="stg-section-header">
              <div>
                <h3><Database size={20} /> Database & Connections</h3>
                <p className="stg-section-desc">Manage database, WebSocket, and data retention</p>
              </div>
            </div>

            <div className="stg-group-title"><Database size={14} /> MongoDB</div>
            <div className="stg-card">
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Connection URI</label>
                  <span className="stg-field-desc">MongoDB connection string</span>
                </div>
                <div className="stg-input-with-icon">
                  <Lock size={14} className="stg-input-icon" />
                  <input type="text" className="stg-input stg-input-mono" value={settings.mongoUri} readOnly />
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Connection Status</label>
                  <span className="stg-field-desc">Current database health</span>
                </div>
                <div className="stg-status-badge connected">
                  <div className="stg-status-dot" />
                  <span>Connected — 12 active pools</span>
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Replica Set</label>
                  <span className="stg-field-desc">MongoDB replication</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('replicaSet')}>
                  <div className={`stg-toggle-track ${settings.replicaSet ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
            </div>

            <div className="stg-group-title"><Wifi size={14} /> WebSocket</div>
            <div className="stg-card">
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>WebSocket Server</label>
                  <span className="stg-field-desc">Real-time data streaming</span>
                </div>
                <div className={`stg-status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                  <div className="stg-status-dot" />
                  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                  <code className="stg-mono-badge">ws://localhost:5000</code>
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Enable WebSocket</label>
                  <span className="stg-field-desc">Toggle real-time features</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('wsEnabled')}>
                  <div className={`stg-toggle-track ${settings.wsEnabled ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Compression</label>
                  <span className="stg-field-desc">Compress WebSocket payloads</span>
                </div>
                <div className="stg-toggle" onClick={() => toggleSetting('compressionEnabled')}>
                  <div className={`stg-toggle-track ${settings.compressionEnabled ? 'active' : ''}`}>
                    <div className="stg-toggle-thumb" />
                  </div>
                </div>
              </div>
            </div>

            <div className="stg-group-title"><HardDrive size={14} /> Data Retention</div>
            <div className="stg-card">
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Backup Schedule</label>
                  <span className="stg-field-desc">Automated database backups</span>
                </div>
                <select className="stg-select" value={settings.backupSchedule} onChange={(e) => updateSetting('backupSchedule', e.target.value)}>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="stg-divider" />
              <div className="stg-field">
                <div className="stg-field-info">
                  <label>Retention Period</label>
                  <span className="stg-field-desc">How long to keep log data</span>
                </div>
                <div className="stg-input-group">
                  <input type="number" className="stg-input stg-input-sm" value={settings.retentionDays}
                    onChange={(e) => updateSetting('retentionDays', e.target.value)} />
                  <span className="stg-input-suffix">days</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="stg-section animate-stg-in">
            <div className="stg-section-header">
              <div>
                <h3><Globe size={20} /> Third-Party Integrations</h3>
                <p className="stg-section-desc">Connect CyberShield with external security tools</p>
              </div>
            </div>

            <div className="stg-integrations-grid">
              {[
                { id: 'splunkEnabled', name: 'Splunk', desc: 'SIEM & Log Analytics', color: '#65a637', status: settings.splunkEnabled },
                { id: 'elasticEnabled', name: 'Elasticsearch', desc: 'Search & Analytics Engine', color: '#00bfb3', status: settings.elasticEnabled },
                { id: 'pagerDutyEnabled', name: 'PagerDuty', desc: 'Incident Response', color: '#06ac38', status: settings.pagerDutyEnabled },
                { id: 'jiraEnabled', name: 'Jira', desc: 'Issue Tracking', color: '#0052cc', status: settings.jiraEnabled },
                { id: 'virustotalEnabled', name: 'VirusTotal', desc: 'Threat Intelligence', color: '#394eff', status: settings.virustotalEnabled },
                { id: 'shodanEnabled', name: 'Shodan', desc: 'Network Intelligence', color: '#c6232a', status: settings.shodanEnabled },
              ].map((integ) => (
                <div key={integ.id} className={`stg-integration-card ${integ.status ? 'active' : ''}`}>
                  <div className="stg-integ-header">
                    <div className="stg-integ-icon" style={{ background: integ.status ? integ.color : 'var(--bg-tertiary)' }}>
                      <Globe size={18} />
                    </div>
                    <div className="stg-integ-info">
                      <h4>{integ.name}</h4>
                      <span>{integ.desc}</span>
                    </div>
                  </div>
                  <div className="stg-integ-footer">
                    <span className={`stg-integ-status ${integ.status ? 'active' : ''}`}>
                      {integ.status ? <><CheckCircle size={12} /> Active</> : <><XCircle size={12} /> Inactive</>}
                    </span>
                    <div className="stg-toggle" onClick={() => toggleSetting(integ.id)}>
                      <div className={`stg-toggle-track ${integ.status ? 'active' : ''}`}>
                        <div className="stg-toggle-thumb" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="stg-section animate-stg-in">
            <div className="stg-section-header">
              <div>
                <h3><Key size={20} /> API Key Management</h3>
                <p className="stg-section-desc">Create and manage API access tokens</p>
              </div>
              <button className="stg-btn stg-btn-primary" onClick={() => {
                const newKey = {
                  id: Date.now(),
                  name: `New Key ${settings.apiKeys.length + 1}`,
                  key: generateApiKey(),
                  created: new Date().toISOString().split('T')[0],
                  lastUsed: 'Never',
                  status: 'active',
                  requests: 0,
                };
                updateSetting('apiKeys', [...settings.apiKeys, newKey]);
              }}>
                <Key size={14} /> Generate New Key
              </button>
            </div>

            <div className="stg-api-keys">
              {settings.apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="stg-api-key-card">
                  <div className="stg-api-key-header">
                    <div className="stg-api-key-name">
                      <Key size={16} />
                      <div>
                        <h4>{apiKey.name}</h4>
                        <span className="stg-api-key-date">Created: {apiKey.created}</span>
                      </div>
                    </div>
                    <span className={`stg-api-key-status ${apiKey.status}`}>{apiKey.status}</span>
                  </div>
                  <div className="stg-api-key-value">
                    <code>{visibleKeys[apiKey.id] ? apiKey.key : '•'.repeat(40)}</code>
                    <div className="stg-api-key-actions">
                      <button className="stg-icon-btn" onClick={() => toggleKeyVisibility(apiKey.id)} title={visibleKeys[apiKey.id] ? 'Hide' : 'Show'}>
                        {visibleKeys[apiKey.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button className="stg-icon-btn" onClick={() => copyToClipboard(apiKey.key, apiKey.id)} title="Copy">
                        {copiedKey === apiKey.id ? <Check size={14} className="stg-copied" /> : <Copy size={14} />}
                      </button>
                      <button className="stg-icon-btn stg-danger" onClick={() => {
                        updateSetting('apiKeys', settings.apiKeys.filter((k) => k.id !== apiKey.id));
                      }} title="Revoke">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="stg-api-key-stats">
                    <span><Activity size={12} /> {apiKey.requests.toLocaleString()} requests</span>
                    <span><Clock size={12} /> Last used: {apiKey.lastUsed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'terminal':
        return (
          <div className="stg-section animate-stg-in">
            <div className="stg-section-header">
              <div>
                <h3><Terminal size={20} /> System Console</h3>
                <p className="stg-section-desc">Live system diagnostics & monitoring</p>
              </div>
            </div>

            {/* System Metrics */}
            <div className="stg-diag-grid">
              {[
                { label: 'CPU Usage', value: diagnostics.cpu, icon: Cpu, color: diagnostics.cpu > 80 ? 'var(--accent-red)' : 'var(--accent-cyan)' },
                { label: 'Memory', value: diagnostics.memory, icon: HardDrive, color: diagnostics.memory > 80 ? 'var(--accent-red)' : 'var(--accent-purple)' },
                { label: 'Disk I/O', value: diagnostics.disk, icon: Database, color: 'var(--accent-green)' },
                { label: 'Network', value: diagnostics.network, icon: Wifi, color: diagnostics.network > 90 ? 'var(--accent-orange)' : 'var(--accent-blue)' },
              ].map((metric) => (
                <div key={metric.label} className="stg-diag-card">
                  <div className="stg-diag-header">
                    <metric.icon size={16} />
                    <span>{metric.label}</span>
                  </div>
                  <div className="stg-diag-value" style={{ color: metric.color }}>
                    {Math.round(metric.value)}%
                  </div>
                  <div className="stg-diag-bar">
                    <div className="stg-diag-bar-fill" style={{ width: `${metric.value}%`, background: metric.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* System Info */}
            <div className="stg-sys-info-row">
              <div className="stg-sys-info-item"><span className="stg-sys-label">Uptime</span><span className="stg-sys-val">{diagnostics.uptime}</span></div>
              <div className="stg-sys-info-item"><span className="stg-sys-label">Processes</span><span className="stg-sys-val">{diagnostics.processes}</span></div>
              <div className="stg-sys-info-item"><span className="stg-sys-label">Threads</span><span className="stg-sys-val">{diagnostics.threads}</span></div>
              <div className="stg-sys-info-item"><span className="stg-sys-label">Open Files</span><span className="stg-sys-val">{diagnostics.openFiles}</span></div>
            </div>

            {/* Terminal */}
            <div className="stg-terminal">
              <div className="stg-terminal-header">
                <div className="stg-terminal-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="stg-terminal-title">cybershield@soc-001 ~ /diagnostics</span>
              </div>
              <div className="stg-terminal-body" ref={terminalRef}>
                {terminalLines.map((line, i) => (
                  <div key={i} className={`stg-term-line ${line.type}`}>
                    <span className="stg-term-time">{line.time}</span>
                    <span className="stg-term-msg">{line.msg}</span>
                  </div>
                ))}
                <div className="stg-term-cursor">
                  <span className="stg-term-prompt">root@cybershield:~$ </span>
                  <span className="stg-blink">█</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'export':
        return (
          <div className="stg-section animate-stg-in">
            <div className="stg-section-header">
              <div>
                <h3><Download size={20} /> Data Export & Backup</h3>
                <p className="stg-section-desc">Export your data or create system backups</p>
              </div>
            </div>

            <div className="stg-export-grid">
              {[
                { title: 'Threat Intelligence', desc: 'Export all threat data, IOCs, and signatures', icon: Shield, format: 'JSON / CSV', size: '~24 MB', color: 'var(--accent-red)' },
                { title: 'Alert History', desc: 'Complete alert log with timestamps', icon: Bell, format: 'JSON / CSV', size: '~18 MB', color: 'var(--accent-orange)' },
                { title: 'System Logs', desc: 'All system events and audit trail', icon: Terminal, format: 'JSON / LOG', size: '~45 MB', color: 'var(--accent-green)' },
                { title: 'Attack Simulations', desc: 'Simulation results and reports', icon: Skull, format: 'JSON / PDF', size: '~8 MB', color: 'var(--accent-purple)' },
                { title: 'User Activity', desc: 'User login history and actions', icon: Fingerprint, format: 'JSON / CSV', size: '~12 MB', color: 'var(--accent-cyan)' },
                { title: 'Full Backup', desc: 'Complete system backup archive', icon: HardDrive, format: 'ZIP', size: '~156 MB', color: 'var(--accent-blue)' },
              ].map((exp, i) => (
                <div key={i} className="stg-export-card">
                  <div className="stg-export-icon" style={{ color: exp.color, borderColor: exp.color }}>
                    <exp.icon size={22} />
                  </div>
                  <h4>{exp.title}</h4>
                  <p>{exp.desc}</p>
                  <div className="stg-export-meta">
                    <span><Code size={12} /> {exp.format}</span>
                    <span><HardDrive size={12} /> {exp.size}</span>
                  </div>
                  <button className="stg-btn stg-btn-ghost">
                    <Download size={14} /> Export
                  </button>
                </div>
              ))}
            </div>

            {/* Danger Zone */}
            <div className="stg-danger-zone">
              <div className="stg-danger-header">
                <AlertTriangle size={18} />
                <div>
                  <h4>Danger Zone</h4>
                  <p>Irreversible and destructive actions</p>
                </div>
              </div>
              <div className="stg-danger-actions">
                <div className="stg-danger-item">
                  <div className="stg-danger-info">
                    <strong>Reset All Settings</strong>
                    <span>Restore all settings to factory defaults</span>
                  </div>
                  <button className="stg-btn stg-btn-danger"><RotateCcw size={14} /> Reset</button>
                </div>
                <div className="stg-danger-item">
                  <div className="stg-danger-info">
                    <strong>Purge All Data</strong>
                    <span>Permanently delete all stored data</span>
                  </div>
                  <button className="stg-btn stg-btn-danger"><Trash2 size={14} /> Purge</button>
                </div>
                <div className="stg-danger-item">
                  <div className="stg-danger-info">
                    <strong>Deactivate Account</strong>
                    <span>Disable this CyberShield instance</span>
                  </div>
                  <button className="stg-btn stg-btn-danger"><XCircle size={14} /> Deactivate</button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="alerts-page-header">
        <h2>
          <Settings size={24} color="var(--accent-cyan)" /> Settings
        </h2>
        <div className="stg-header-actions">
          <button className={`stg-btn stg-btn-save ${saved ? 'saved' : ''}`} onClick={handleSave} id="save-settings-btn">
            {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
          </button>
        </div>
      </div>

      <div className="stg-layout">
        {/* Sidebar Navigation */}
        <div className="stg-sidebar">
          <div className="stg-sidebar-section">
            {settingsNav.map((item) => (
              <div
                key={item.id}
                className={`stg-nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
                id={`stg-nav-${item.id}`}
              >
                <div className="stg-nav-icon">
                  <item.icon size={18} />
                </div>
                <div className="stg-nav-text">
                  <span className="stg-nav-label">{item.label}</span>
                  <span className="stg-nav-desc">{item.desc}</span>
                </div>
                <ChevronRight size={14} className="stg-nav-arrow" />
              </div>
            ))}
          </div>

          {/* User Card */}
          <div className="stg-user-card">
            <div className="stg-user-avatar">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="stg-user-info">
              <span className="stg-user-name">{user?.name || 'Admin'}</span>
              <span className="stg-user-role">{user?.role || 'Super Admin'}</span>
            </div>
            <button className="stg-icon-btn" onClick={logout} title="Sign Out">
              <Lock size={14} />
            </button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="stg-content">
          {renderSection()}
        </div>
      </div>
    </>
  );
}
