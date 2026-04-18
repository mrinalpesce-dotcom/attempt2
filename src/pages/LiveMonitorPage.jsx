import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import {
  Activity, Wifi, WifiOff, Radio, Shield, Zap, AlertTriangle,
  Skull, Eye, Globe, Lock, Server, Cpu, BarChart3, Clock,
  TrendingUp, ArrowUpRight, ArrowDownRight, Monitor, HardDrive
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import SecurityNews from '../components/SecurityNews';

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
  const {
    isConnected, liveAlerts, liveStats, clientCount,
    systemMetrics, networkActivity, emit
  } = useSocket();

  const [cpuHistory, setCpuHistory] = useState([]);
  const [uptime, setUptime] = useState(0);
  const feedRef = useRef(null);

  // Request initial metrics
  useEffect(() => {
    emit('requestSystemMetrics');
  }, [emit]);

  // Build CPU history from systemMetrics updates
  useEffect(() => {
    if (systemMetrics?.cpuUsage != null) {
      setCpuHistory((prev) => [...prev, systemMetrics.cpuUsage].slice(-40));
    }
  }, [systemMetrics]);

  // Uptime counter
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const metrics = systemMetrics || {
    cpuUsage: 0, memoryUsage: 0, packetsPerSec: 0,
    bandwidth: 0, latency: 0, droppedPackets: 0,
  };
  const stats = liveStats || { totalAlerts: 0, criticalThreats: 0, highSeverity: 0, threatsBlocked: 0 };
  const allAlerts = liveAlerts.slice(0, 30);

  const bandwidthIn = networkActivity.length > 0
    ? networkActivity[networkActivity.length - 1].inbound
    : (metrics.bandwidth * 0.6).toFixed(1);
  const bandwidthOut = networkActivity.length > 0
    ? networkActivity[networkActivity.length - 1].outbound
    : (metrics.bandwidth * 0.4).toFixed(1);
  const latency = networkActivity.length > 0
    ? networkActivity[networkActivity.length - 1].latency
    : metrics.latency;
  const dropped = networkActivity.length > 0
    ? networkActivity[networkActivity.length - 1].dropped
    : metrics.droppedPackets;

  const formatUptime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Use network activity bars from WebSocket
  const networkBars = networkActivity.map(n => n.bar);

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
            <span className="metric-value">{metrics.cpuUsage.toFixed(1)}%</span>
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
            <span className="metric-value">{metrics.memoryUsage.toFixed(1)}%</span>
          </div>
          <div className="metric-progress-ring">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--accent-purple)" strokeWidth="3"
                strokeDasharray={`${metrics.memoryUsage * 0.94} ${94 - metrics.memoryUsage * 0.94}`}
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
            <span className="metric-value">{Math.round(metrics.packetsPerSec).toLocaleString()}</span>
          </div>
          <div className="metric-trend up">
            <ArrowUpRight size={14} /> {((metrics.packetsPerSec / 5000) * 100).toFixed(0)}%
          </div>
        </div>

        <div className="monitor-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)' }}>
            <BarChart3 size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Bandwidth</span>
            <span className="metric-value">{metrics.bandwidth.toFixed(1)} <small>MB/s</small></span>
          </div>
          <div className="metric-trend down">
            <ArrowDownRight size={14} /> {metrics.errorRate?.toFixed(1) || 0}%
          </div>
        </div>

        <div className="monitor-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-orange)' }}>
            <Clock size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Session Uptime</span>
            <span className="metric-value mono">{systemMetrics?.formattedUptime || formatUptime(uptime)}</span>
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
          <div className="network-visualizer" style={{ height: '140px', width: '100%', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={networkActivity.slice(-30)} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="networkGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <YAxis domain={[0, 100]} hide={true} />
                <Area 
                  type="monotone" 
                  dataKey="bar" 
                  stroke="#0ea5e9" 
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#networkGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="network-stats-row">
            <div className="net-stat"><span className="label">Inbound</span><span className="val" style={{ color: 'var(--accent-cyan)' }}>{bandwidthIn} MB/s</span></div>
            <div className="net-stat"><span className="label">Outbound</span><span className="val" style={{ color: 'var(--accent-purple)' }}>{bandwidthOut} MB/s</span></div>
            <div className="net-stat"><span className="label">Latency</span><span className="val" style={{ color: 'var(--accent-green)' }}>{latency} ms</span></div>
            <div className="net-stat"><span className="label">Dropped</span><span className="val" style={{ color: 'var(--accent-red)' }}>{dropped}</span></div>
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

        {/* Global News Section */}
        <SecurityNews />
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
