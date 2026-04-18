import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Terminal, Filter, Search, Pause, Play, Trash2,
  AlertTriangle, Info, XCircle, Zap, Clock, Activity,
  ChevronDown, ChevronRight, Radio, Shield, Server,
  Database, Wifi, Lock, Globe, Cpu, HardDrive, Eye
} from 'lucide-react';
import { fetchLogs } from '../api';
import { useSocket } from '../context/SocketContext';

// ── Level Config ──
const LEVEL_CONFIG = {
  info:     { color: '#00d4ff', bg: 'rgba(0,212,255,0.08)',  icon: Info,          label: 'INFO' },
  warning:  { color: '#ffab40', bg: 'rgba(255,171,64,0.08)', icon: AlertTriangle, label: 'WARN' },
  error:    { color: '#ff5252', bg: 'rgba(255,82,82,0.08)',  icon: XCircle,       label: 'ERROR' },
  critical: { color: '#ff1744', bg: 'rgba(255,23,68,0.08)',  icon: Zap,           label: 'CRIT' },
};

// ── Source → Icon mapping ──
const SOURCE_ICONS = {
  'DPI Engine': Eye, 'Firewall': Shield, 'IDS': Activity, 'ML Model': Cpu,
  'Auth Service': Lock, 'API Gateway': Globe, 'Socket.IO': Wifi, 'MongoDB': Database,
  'System': Server, 'TLS Manager': Lock, 'Backup Agent': HardDrive, 'DNS Resolver': Globe,
  'WAF': Shield, 'SIEM': Activity,
};

function timeFormat(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function relativeTime(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 5000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export default function LogsPage() {
  const { liveLogs, emit, isConnected } = useSocket();
  const [dbLogs, setDbLogs] = useState([]);
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [pausedSnapshot, setPausedSnapshot] = useState([]);
  const [expandedLog, setExpandedLog] = useState(null);
  const [viewMode, setViewMode] = useState('stream'); // 'stream' | 'table'
  const listRef = useRef(null);

  // Fetch initial DB logs
  useEffect(() => {
    emit('requestLogs');
    fetchLogs().then(data => { if (data.length > 0) setDbLogs(data); }).catch(() => {});
  }, [emit]);

  // Snapshot on pause
  useEffect(() => {
    if (isPaused) setPausedSnapshot([...liveLogs, ...dbLogs]);
  }, [isPaused]);

  // Auto-scroll
  useEffect(() => {
    if (!isPaused && listRef.current) listRef.current.scrollTop = 0;
  }, [liveLogs, isPaused]);

  const allLogs = isPaused ? pausedSnapshot : [...liveLogs, ...dbLogs];

  const filteredLogs = useMemo(() => allLogs.filter(log => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (log.event || '').toLowerCase().includes(q) ||
             (log.source || '').toLowerCase().includes(q) ||
             (log.details || '').toLowerCase().includes(q);
    }
    return true;
  }), [allLogs, filterLevel, searchQuery]);

  const levelCounts = useMemo(() => ({
    info: allLogs.filter(l => l.level === 'info').length,
    warning: allLogs.filter(l => l.level === 'warning').length,
    error: allLogs.filter(l => l.level === 'error').length,
    critical: allLogs.filter(l => l.level === 'critical').length,
  }), [allLogs]);

  // Rate: logs per minute estimate
  const logsPerMin = useMemo(() => {
    if (allLogs.length < 2) return 0;
    const newest = new Date(allLogs[0]?.timestamp).getTime();
    const oldest = new Date(allLogs[Math.min(allLogs.length - 1, 19)]?.timestamp).getTime();
    const spanMin = Math.max(1, (newest - oldest) / 60000);
    return Math.round(Math.min(allLogs.length, 20) / spanMin);
  }, [allLogs]);

  const handleClear = () => { setDbLogs([]); setPausedSnapshot([]); };

  return (
    <div className="logs-page">
      {/* ── Header ── */}
      <div className="logs-header">
        <div className="logs-header-left">
          <div className="logs-title-icon"><Terminal size={22} /></div>
          <div>
            <h1>System Logs</h1>
            <p>Real-time event stream from all CyberShield subsystems</p>
          </div>
        </div>
        <div className="logs-header-right">
          <div className={`logs-connection ${isConnected ? 'online' : 'offline'}`}>
            <Radio size={12} />
            <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
          <div className="logs-view-toggle">
            <button className={viewMode === 'stream' ? 'active' : ''} onClick={() => setViewMode('stream')} title="Stream View">
              <Terminal size={14} />
            </button>
            <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')} title="Table View">
              <Database size={14} />
            </button>
          </div>
          <button className={`logs-control-btn ${isPaused ? 'paused' : ''}`} onClick={() => setIsPaused(!isPaused)} title={isPaused ? 'Resume' : 'Pause'}>
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button className="logs-control-btn danger" onClick={handleClear} title="Clear Logs">
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="logs-stats-bar">
        {Object.entries(LEVEL_CONFIG).map(([level, cfg]) => {
          const Icon = cfg.icon;
          const count = levelCounts[level];
          const isActive = filterLevel === level;
          return (
            <button
              key={level}
              className={`logs-stat-card ${isActive ? 'active' : ''}`}
              onClick={() => setFilterLevel(filterLevel === level ? 'all' : level)}
              style={{ '--stat-color': cfg.color, '--stat-bg': cfg.bg }}
            >
              <Icon size={18} color={cfg.color} />
              <div className="logs-stat-content">
                <span className="logs-stat-value">{count}</span>
                <span className="logs-stat-label">{cfg.label}</span>
              </div>
              {isActive && <div className="logs-stat-active-dot" />}
            </button>
          );
        })}

        <div className="logs-stat-card meta">
          <Activity size={18} color="#8b5cf6" />
          <div className="logs-stat-content">
            <span className="logs-stat-value">{allLogs.length}</span>
            <span className="logs-stat-label">TOTAL</span>
          </div>
        </div>

        <div className="logs-stat-card meta">
          <Clock size={18} color="#10b981" />
          <div className="logs-stat-content">
            <span className="logs-stat-value">{logsPerMin}/m</span>
            <span className="logs-stat-label">RATE</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="logs-filter-bar">
        <div className="logs-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search events, sources, details..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            id="logs-search-input"
          />
          {searchQuery && (
            <button className="logs-search-clear" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
        <div className="logs-filter-info">
          <span>{filteredLogs.length} of {allLogs.length} entries</span>
          {filterLevel !== 'all' && (
            <button className="logs-filter-tag" onClick={() => setFilterLevel('all')}>
              {filterLevel.toUpperCase()} × 
            </button>
          )}
          {isPaused && <span className="logs-paused-indicator">⏸ PAUSED</span>}
        </div>
      </div>

      {/* ── Log Stream / Table ── */}
      <div className={`logs-terminal ${viewMode}`} ref={listRef}>
        {filteredLogs.length === 0 && (
          <div className="logs-empty">
            <Terminal size={40} />
            <h3>No logs match your filters</h3>
            <p>Try adjusting your search or level filters</p>
          </div>
        )}

        {viewMode === 'stream' ? (
          // ── Stream View ──
          filteredLogs.map((log, i) => {
            const cfg = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.info;
            const LevelIcon = cfg.icon;
            const SourceIcon = SOURCE_ICONS[log.source] || Server;
            const isExpanded = expandedLog === (log._id || `log-${i}`);
            const isNew = i === 0 && !isPaused;

            return (
              <div
                key={log._id || `log-${i}`}
                className={`logs-entry ${log.level} ${isExpanded ? 'expanded' : ''} ${isNew ? 'logs-entry-new' : ''}`}
                onClick={() => setExpandedLog(isExpanded ? null : (log._id || `log-${i}`))}
              >
                <div className="logs-entry-main">
                  {/* Level indicator */}
                  <div className="logs-entry-level" style={{ background: cfg.bg, color: cfg.color }}>
                    <LevelIcon size={12} />
                  </div>

                  {/* Timestamp */}
                  <span className="logs-entry-time">{timeFormat(log.timestamp)}</span>

                  {/* Level badge */}
                  <span className="logs-entry-badge" style={{ color: cfg.color, borderColor: `${cfg.color}30`, background: cfg.bg }}>
                    {cfg.label}
                  </span>

                  {/* Source */}
                  <span className="logs-entry-source">
                    <SourceIcon size={10} />
                    {log.source}
                  </span>

                  {/* Event */}
                  <span className="logs-entry-event">{log.event}</span>

                  {/* Details preview */}
                  <span className="logs-entry-details">{log.details}</span>

                  {/* Relative time */}
                  <span className="logs-entry-ago">{relativeTime(log.timestamp)}</span>

                  {/* Expand chevron */}
                  <span className="logs-entry-expand">
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </span>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="logs-entry-detail">
                    <div className="logs-detail-grid">
                      <div className="logs-detail-item">
                        <span className="logs-detail-label">Event</span>
                        <span className="logs-detail-value">{log.event}</span>
                      </div>
                      <div className="logs-detail-item">
                        <span className="logs-detail-label">Source</span>
                        <span className="logs-detail-value">{log.source}</span>
                      </div>
                      <div className="logs-detail-item">
                        <span className="logs-detail-label">Level</span>
                        <span className="logs-detail-value" style={{ color: cfg.color }}>{log.level?.toUpperCase()}</span>
                      </div>
                      <div className="logs-detail-item">
                        <span className="logs-detail-label">Timestamp</span>
                        <span className="logs-detail-value mono">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="logs-detail-full">
                      <span className="logs-detail-label">Full Details</span>
                      <div className="logs-detail-message">{log.details}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // ── Table View ──
          <table className="logs-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Level</th>
                <th>Source</th>
                <th>Event</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => {
                const cfg = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.info;
                return (
                  <tr key={log._id || `log-${i}`} className={`logs-table-row ${log.level}`}>
                    <td className="logs-table-time">{timeFormat(log.timestamp)}</td>
                    <td>
                      <span className="logs-table-badge" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                    </td>
                    <td className="logs-table-source">{log.source}</td>
                    <td className="logs-table-event">{log.event}</td>
                    <td className="logs-table-details">{log.details}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
