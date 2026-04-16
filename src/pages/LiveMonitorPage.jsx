import { useState, useEffect, useRef } from 'react';
import {
  Activity, Wifi, WifiOff, Radio, Shield, Zap, AlertTriangle,
  Skull, Eye, Globe, Lock, Server, Cpu, BarChart3, Clock,
  TrendingUp, ArrowUpRight, ArrowDownRight, Monitor, HardDrive
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function severityColor(s) {
  switch (s) {
    case 'CRITICAL': return '#ff1744';
    case 'HIGH': return '#ff5252';
    case 'MEDIUM': return '#ffab40';
    case 'LOW': return '#69f0ae';
    default: return '#00d4ff';
  }
}

export default function LiveMonitorPage() {
  const { isConnected, liveAlerts, liveThreats, liveStats, clientCount } = useSocket();
  const [networkBars, setNetworkBars] = useState([]);
  const [cpuHistory, setCpuHistory] = useState([]);
  const [memUsage, setMemUsage] = useState(67.3);
  const [packetsPerSec, setPacketsPerSec] = useState(2453);
  const [bandwidth, setBandwidth] = useState(124.7);
  const [uptime, setUptime] = useState(0);
  const feedRef = useRef(null);

  // Simulated real-time network activity bars
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkBars((prev) => {
        const next = [...prev, Math.random() * 100];
        return next.slice(-60);
      });
      setCpuHistory((prev) => {
        const next = [...prev, 20 + Math.random() * 60];
        return next.slice(-40);
      });
      setMemUsage((prev) => Math.max(40, Math.min(95, prev + (Math.random() - 0.5) * 3)));
      setPacketsPerSec((prev) => Math.max(800, Math.min(8000, prev + Math.floor((Math.random() - 0.5) * 400))));
      setBandwidth((prev) => Math.max(30, Math.min(300, prev + (Math.random() - 0.5) * 20)));
      setUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const stats = liveStats || { totalAlerts: 127, criticalThreats: 8, highSeverity: 23, threatsBlocked: 96 };

  const allAlerts = liveAlerts.slice(0, 30);

  const formatUptime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="alerts-page-header">
        <h2>
          <Activity size={24} color="var(--accent-green)" /> Live Monitor
          <div className="live-dot-inline" />
          <span className="live-text-label">REAL-TIME</span>
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={`ws-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            <div className="ws-dot" />
            <span>{isConnected ? 'WebSocket Live' : 'Offline'}</span>
          </div>
          <div className="ws-clients-badge">
            <Monitor size={12} />
            <span>{clientCount || 1} client{clientCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* System Metrics Row */}
      <div className="monitor-metrics-row">
        <div className="monitor-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(0, 212, 255, 0.1)', color: 'var(--accent-cyan)' }}>
            <Cpu size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">CPU Usage</span>
            <span className="metric-value">{cpuHistory.length > 0 ? cpuHistory[cpuHistory.length - 1].toFixed(1) : '0.0'}%</span>
          </div>
          <div className="mini-sparkline">
            {cpuHistory.slice(-20).map((v, i) => (
              <div key={i} className="spark-bar" style={{ height: `${v}%`, background: v > 80 ? 'var(--accent-red)' : v > 50 ? 'var(--accent-orange)' : 'var(--accent-cyan)' }} />
            ))}
          </div>
        </div>

        <div className="monitor-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)' }}>
            <HardDrive size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Memory</span>
            <span className="metric-value">{memUsage.toFixed(1)}%</span>
          </div>
          <div className="metric-progress-ring">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--accent-purple)" strokeWidth="3"
                strokeDasharray={`${memUsage * 0.94} ${94 - memUsage * 0.94}`}
                strokeDashoffset="23.5" strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
          </div>
        </div>

        <div className="monitor-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)' }}>
            <Zap size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Packets/sec</span>
            <span className="metric-value">{packetsPerSec.toLocaleString()}</span>
          </div>
          <div className="metric-trend up">
            <ArrowUpRight size={14} /> 12%
          </div>
        </div>

        <div className="monitor-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)' }}>
            <BarChart3 size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Bandwidth</span>
            <span className="metric-value">{bandwidth.toFixed(1)} <small>MB/s</small></span>
          </div>
          <div className="metric-trend down">
            <ArrowDownRight size={14} /> 3%
          </div>
        </div>

        <div className="monitor-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-orange)' }}>
            <Clock size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Session Uptime</span>
            <span className="metric-value mono">{formatUptime(uptime)}</span>
          </div>
        </div>
      </div>

      {/* Main Monitor Grid */}
      <div className="monitor-grid">
        {/* Network Activity Visualizer */}
        <div className="monitor-panel network-panel">
          <div className="monitor-panel-header">
            <h3><Activity size={14} style={{ color: 'var(--accent-cyan)' }} /> Network Activity</h3>
            <span className="monitor-live-badge">● LIVE</span>
          </div>
          <div className="network-visualizer">
            {networkBars.map((val, i) => (
              <div key={i} className="net-bar"
                style={{
                  height: `${val}%`,
                  background: val > 80 ? 'var(--accent-red)' : val > 50 ? 'var(--accent-orange)' : 'var(--accent-cyan)',
                  opacity: 0.3 + (i / networkBars.length) * 0.7,
                }}
              />
            ))}
          </div>
          <div className="network-stats-row">
            <div className="net-stat"><span className="label">Inbound</span><span className="val" style={{ color: 'var(--accent-cyan)' }}>{(bandwidth * 0.6).toFixed(1)} MB/s</span></div>
            <div className="net-stat"><span className="label">Outbound</span><span className="val" style={{ color: 'var(--accent-purple)' }}>{(bandwidth * 0.4).toFixed(1)} MB/s</span></div>
            <div className="net-stat"><span className="label">Latency</span><span className="val" style={{ color: 'var(--accent-green)' }}>{(12 + Math.random() * 8).toFixed(0)} ms</span></div>
            <div className="net-stat"><span className="label">Dropped</span><span className="val" style={{ color: 'var(--accent-red)' }}>{Math.floor(Math.random() * 5)}</span></div>
          </div>
        </div>

        {/* Live Threat Feed */}
        <div className="monitor-panel feed-panel">
          <div className="monitor-panel-header">
            <h3><Radio size={14} style={{ color: 'var(--accent-red)' }} /> Live Threat Feed</h3>
            <span className="feed-count">{allAlerts.length} events</span>
          </div>
          <div className="live-feed-list" ref={feedRef}>
            {allAlerts.length === 0 && (
              <div className="feed-empty">
                <Radio size={20} className="feed-pulse-icon" />
                <span>Monitoring network traffic...</span>
              </div>
            )}
            {allAlerts.map((alert, i) => (
              <div key={alert._id || `la-${i}`} className={`feed-entry severity-border-${(alert.severity || '').toLowerCase()}`}>
                <div className="feed-severity-dot" style={{ background: severityColor(alert.severity) }} />
                <div className="feed-content">
                  <div className="feed-title">
                    {alert.title}
                    <span className={`severity-badge ${(alert.severity || '').toLowerCase()}`}>{alert.severity}</span>
                  </div>
                  <div className="feed-meta">
                    <span className="feed-ip">{alert.sourceIP}</span>
                    <span>→</span>
                    <span className="feed-ip">{alert.targetIP}</span>
                    <span className="feed-time">{formatTime(alert.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Threat Summary Cards */}
      <div className="monitor-summary-row">
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'rgba(255, 23, 68, 0.1)' }}>
            <Skull size={20} color="var(--severity-critical)" />
          </div>
          <div className="summary-info">
            <span className="summary-value">{stats.criticalThreats}</span>
            <span className="summary-label">Critical Active</span>
          </div>
          <div className="summary-meter">
            <div className="meter-fill critical" style={{ width: `${Math.min(stats.criticalThreats * 10, 100)}%` }} />
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'rgba(255, 82, 82, 0.1)' }}>
            <AlertTriangle size={20} color="var(--severity-high)" />
          </div>
          <div className="summary-info">
            <span className="summary-value">{stats.highSeverity}</span>
            <span className="summary-label">High Severity</span>
          </div>
          <div className="summary-meter">
            <div className="meter-fill high" style={{ width: `${Math.min(stats.highSeverity * 4, 100)}%` }} />
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <Shield size={20} color="var(--accent-green)" />
          </div>
          <div className="summary-info">
            <span className="summary-value">{stats.threatsBlocked}</span>
            <span className="summary-label">Blocked</span>
          </div>
          <div className="summary-meter">
            <div className="meter-fill blocked" style={{ width: `${Math.min(stats.threatsBlocked, 100)}%` }} />
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'rgba(0, 212, 255, 0.1)' }}>
            <Eye size={20} color="var(--accent-cyan)" />
          </div>
          <div className="summary-info">
            <span className="summary-value">{stats.totalAlerts}</span>
            <span className="summary-label">Total Alerts</span>
          </div>
          <div className="summary-meter">
            <div className="meter-fill alerts" style={{ width: `${Math.min(stats.totalAlerts / 2, 100)}%` }} />
          </div>
        </div>
      </div>
    </>
  );
}
