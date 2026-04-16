import { useState, useEffect, useRef } from 'react';
import { Terminal, Filter, Download, Pause, Play, Trash2, Search } from 'lucide-react';
import { fetchLogs } from '../api';
import { useSocket } from '../context/SocketContext';

const LEVEL_COLORS = {
  info: '#00d4ff',
  warning: '#ffab40',
  error: '#ff5252',
  critical: '#ff1744',
};

const SIMULATED_LOGS = [
  { event: 'Packet Inspection', source: 'DPI Engine', details: 'Deep packet inspection completed - 45,892 packets analyzed', level: 'info', timestamp: new Date(Date.now() - 2000).toISOString() },
  { event: 'Anomaly Detected', source: 'ML Model', details: 'Unusual traffic pattern from subnet 192.168.1.0/24 — anomaly score 0.87', level: 'warning', timestamp: new Date(Date.now() - 5000).toISOString() },
  { event: 'Firewall Rule Hit', source: 'Firewall', details: 'Blocked inbound connection from 45.33.32.156:4444 (T1071 signature match)', level: 'critical', timestamp: new Date(Date.now() - 8000).toISOString() },
  { event: 'Certificate Renewed', source: 'TLS Manager', details: 'SSL certificate for api.cybershield.io renewed successfully', level: 'info', timestamp: new Date(Date.now() - 12000).toISOString() },
  { event: 'DB Query Slow', source: 'MongoDB', details: 'Query on alerts collection took 2.3s — consider indexing', level: 'warning', timestamp: new Date(Date.now() - 15000).toISOString() },
  { event: 'Auth Success', source: 'Auth Service', details: 'Admin login from 10.0.0.5 — session ID: a8f3b2d1', level: 'info', timestamp: new Date(Date.now() - 18000).toISOString() },
  { event: 'Memory Spike', source: 'System', details: 'Node.js heap usage at 89% — triggered garbage collection', level: 'error', timestamp: new Date(Date.now() - 22000).toISOString() },
  { event: 'Model Retrained', source: 'AI Engine', details: 'Threat detection model retrained with 12,450 new samples — accuracy 94.7%', level: 'info', timestamp: new Date(Date.now() - 25000).toISOString() },
  { event: 'Port Scan Block', source: 'IDS', details: 'Blocked SYN scan from 185.220.101.1 targeting ports 22,80,443,3389', level: 'critical', timestamp: new Date(Date.now() - 30000).toISOString() },
  { event: 'Backup Complete', source: 'Backup Agent', details: 'Full database backup completed — 2.4 GB compressed', level: 'info', timestamp: new Date(Date.now() - 35000).toISOString() },
  { event: 'Rate Limit Hit', source: 'API Gateway', details: 'Client 10.0.0.23 exceeded 100 req/min limit on /api/alerts', level: 'warning', timestamp: new Date(Date.now() - 40000).toISOString() },
  { event: 'WebSocket Spike', source: 'Socket.IO', details: '12 new WebSocket connections in last 5 seconds', level: 'info', timestamp: new Date(Date.now() - 45000).toISOString() },
];

export default function LogsPage() {
  const [logs, setLogs] = useState(SIMULATED_LOGS);
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const { liveAlerts } = useSocket();
  const listRef = useRef(null);

  // Try to fetch real logs
  useEffect(() => {
    fetchLogs()
      .then((data) => {
        if (data.length > 0) {
          setLogs([...data, ...SIMULATED_LOGS]);
        }
      })
      .catch(() => {});
  }, []);

  // Generate new simulated log entries
  useEffect(() => {
    if (isPaused) return;
    const sources = ['DPI Engine', 'Firewall', 'IDS', 'ML Model', 'Auth Service', 'API Gateway', 'Socket.IO', 'MongoDB', 'System'];
    const events = [
      { event: 'Connection Accepted', level: 'info', detail: 'New TCP connection' },
      { event: 'Signature Match', level: 'warning', detail: 'Rule match on' },
      { event: 'Packet Dropped', level: 'error', detail: 'Malformed packet from' },
      { event: 'Session Timeout', level: 'info', detail: 'Idle session expired for' },
      { event: 'Threat Intel Update', level: 'info', detail: 'Updated IOC database with' },
      { event: 'Rate Exceeded', level: 'warning', detail: 'Rate limit breach by' },
      { event: 'Exploit Blocked', level: 'critical', detail: 'Exploit attempt blocked from' },
    ];

    const interval = setInterval(() => {
      const ev = events[Math.floor(Math.random() * events.length)];
      const src = sources[Math.floor(Math.random() * sources.length)];
      const ip = `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

      setLogs((prev) => [{
        _id: Date.now().toString(),
        event: ev.event,
        source: src,
        details: `${ev.detail} ${ip}`,
        level: ev.level,
        timestamp: new Date().toISOString(),
      }, ...prev].slice(0, 200));
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Auto scroll
  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (log.event || '').toLowerCase().includes(q) ||
        (log.source || '').toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const levelCounts = {
    info: logs.filter(l => l.level === 'info').length,
    warning: logs.filter(l => l.level === 'warning').length,
    error: logs.filter(l => l.level === 'error').length,
    critical: logs.filter(l => l.level === 'critical').length,
  };

  return (
    <>
      <div className="alerts-page-header">
        <h2>
          <Terminal size={24} color="var(--accent-green)" /> System Logs
        </h2>
        <div className="filter-bar">
          <div className="header-search" style={{ maxWidth: '200px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="logs-search-input"
            />
          </div>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} id="logs-level-filter">
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
          <button className="log-control-btn" onClick={() => setIsPaused(!isPaused)} title={isPaused ? 'Resume' : 'Pause'}>
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button className="log-control-btn" onClick={() => setLogs([])} title="Clear">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Level Counts */}
      <div className="log-level-bar">
        {Object.entries(levelCounts).map(([level, count]) => (
          <div
            key={level}
            className={`log-level-chip ${filterLevel === level ? 'active' : ''}`}
            onClick={() => setFilterLevel(filterLevel === level ? 'all' : level)}
            style={{ '--chip-color': LEVEL_COLORS[level] }}
          >
            <div className="log-level-dot" style={{ background: LEVEL_COLORS[level] }} />
            <span className="log-level-name">{level}</span>
            <span className="log-level-count">{count}</span>
          </div>
        ))}
        <span className="log-total">Total: {logs.length} entries</span>
        {isPaused && <span className="log-paused-badge">⏸ PAUSED</span>}
      </div>

      {/* Log Entries */}
      <div className="log-terminal" ref={listRef}>
        {filteredLogs.length === 0 && (
          <div className="log-empty">No log entries match your filters</div>
        )}
        {filteredLogs.map((log, i) => (
          <div key={log._id || `log-${i}`} className={`log-entry level-${log.level}`}>
            <span className="log-timestamp">
              {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
            <span className="log-level-tag" style={{ color: LEVEL_COLORS[log.level], borderColor: `${LEVEL_COLORS[log.level]}40` }}>
              {log.level?.toUpperCase()}
            </span>
            <span className="log-source">[{log.source}]</span>
            <span className="log-event">{log.event}</span>
            <span className="log-details">{log.details}</span>
          </div>
        ))}
      </div>
    </>
  );
}
