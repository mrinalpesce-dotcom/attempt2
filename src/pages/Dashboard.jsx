import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, ShieldAlert, Skull, AlertTriangle,
  ShieldCheck, Play, Shield, Zap, Eye, Lock, Radio, Globe,
  Activity, BarChart3, Target, Flame, Bug, Server
} from 'lucide-react';
import AttackMap from '../components/AttackMap';
import ThreatChart from '../components/ThreatChart';
import LiveAlertsFeed from '../components/LiveAlertsFeed';
import SecurityNews from '../components/SecurityNews';
import { useSocket } from '../context/SocketContext';
import { fetchDashboardStats, fetchAlerts, fetchThreats, fetchTimeline } from '../api';

export default function Dashboard() {
  const { isConnected, liveStats, liveAlerts } = useSocket();
  const [stats, setStats] = useState({ totalAlerts: 127, criticalThreats: 8, highSeverity: 23, threatsBlocked: 96 });
  const [alerts, setAlerts] = useState([]);
  const [threats, setThreats] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [playbookRunning, setPlaybookRunning] = useState(false);
  const [playbookComplete, setPlaybookComplete] = useState(false);

  useEffect(() => {
    fetchDashboardStats().then(setStats).catch(() => {});
    fetchAlerts().then((data) => { setAlerts(data); setSelectedAlert(data[0] || null); }).catch(() => {});
    fetchThreats().then(setThreats).catch(() => {});
    fetchTimeline().then(setTimeline).catch(() => {});
  }, []);

  useEffect(() => {
    if (liveStats) setStats(liveStats);
  }, [liveStats]);

  const handleExecutePlaybook = () => {
    setPlaybookRunning(true);
    setPlaybookComplete(false);
    setTimeout(() => {
      setPlaybookRunning(false);
      setPlaybookComplete(true);
    }, 3000);
  };

  const displayAlert = selectedAlert || alerts[0] || {
    title: 'BRUTE FORCE ATTACK',
    timestamp: new Date().toISOString(),
    sourceIP: '192.168.1.45',
    targetIP: '10.0.0.1',
    type: 'Brute Force',
    confidence: 94.2,
    mitreAttack: 'T1110',
    description: 'Multiple failed SSH login attempts detected',
  };

  const statCards = [
    { 
      key: 'alerts', cls: 'alerts', 
      icon: ShieldAlert, iconColor: '#00d4ff',
      label: 'Total Alerts', value: stats.totalAlerts, 
      change: '↑ 23%', changeDir: 'up', changeSub: 'vs last hour'
    },
    {
      key: 'critical', cls: 'critical',
      icon: Flame, iconColor: '#ff1744',
      label: 'Critical Threats', value: stats.criticalThreats,
      change: '↑ 60%', changeDir: 'up', changeSub: 'vs last hour'
    },
    {
      key: 'high', cls: 'high',
      icon: AlertTriangle, iconColor: '#ff5252',
      label: 'High Severity', value: stats.highSeverity,
      change: '↑ 15%', changeDir: 'up', changeSub: 'vs last hour'
    },
    {
      key: 'blocked', cls: 'blocked',
      icon: ShieldCheck, iconColor: '#10b981',
      label: 'Threats Blocked', value: stats.threatsBlocked,
      change: '↑ 31%', changeDir: 'down', changeSub: 'vs last hour'
    },
  ];

  return (
    <>
      {/* Stats Row */}
      <div className="stats-row">
        {statCards.map((card, i) => (
          <div key={card.key} className={`stat-card ${card.cls} animate-fadeIn animate-delay-${i + 1}`}>
            <div className="stat-card-top">
              <div className="stat-icon-wrap" style={{ color: card.iconColor, background: `${card.iconColor}15` }}>
                <card.icon size={20} />
              </div>
              <div className="label">{card.label}</div>
            </div>
            <div className="value">{card.value}</div>
            <div className={`stat-change ${card.changeDir}`}>
              {card.changeDir === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {card.change} <span>{card.changeSub}</span>
            </div>
          </div>
        ))}

        <div className="live-mode-card animate-fadeIn">
          <div className="live-badge">
            <div className="dot" />
            <span>Live Mode</span>
          </div>
          <p>{isConnected ? 'Connected via WebSocket' : 'Connecting...'}</p>
          <div className="live-pulse-bar">
            <div className="live-pulse-fill" />
          </div>
        </div>
      </div>

      {/* Global Attack Map — Full Width */}
      <div className="card attack-map-card">
        <div className="card-header">
          <h3>
            <Globe size={16} style={{ color: 'var(--accent-cyan)' }} />
            Global Attack Map
            <div className="live-dot" />
            <span style={{ color: 'var(--accent-green)', fontSize: '11px', fontWeight: 700 }}>LIVE</span>
          </h3>
          <div className="card-header-actions">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              <Activity size={12} style={{ verticalAlign: 'middle' }} /> Real-time threat visualization
            </span>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <AttackMap />
        </div>
      </div>

      {/* Charts + Alerts row */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 320px' }}>
        {/* Threat Chart */}
        <div className="card">
          <div className="card-header">
            <h3>
              <BarChart3 size={16} style={{ color: 'var(--accent-purple)' }} />
              Threats Over Time (24h)
            </h3>
            <select defaultValue="24h">
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          <div className="card-body">
            <ThreatChart data={timeline} />
          </div>
        </div>
      </div>

      {/* News + Feed row */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 340px' }}>
        {/* Security News */}
        <div className="card">
          <SecurityNews />
        </div>

        {/* Live Alerts Feed */}
        <div className="card">
          <div className="card-header">
            <h3>
              <Radio size={16} style={{ color: 'var(--accent-red)' }} />
              Live Alerts Feed
            </h3>
            <span className="badge-count">{liveAlerts.length + alerts.length} alerts</span>
          </div>
          <div className="card-body">
            <LiveAlertsFeed alerts={alerts} />
          </div>
        </div>
      </div>

      {/* Alert Details Section */}
      <div className="section-header">
        <h2>
          <Target size={20} style={{ color: 'var(--accent-red)' }} />
          Alert Details & Analysis
          <span className={`severity-badge ${(displayAlert.severity || 'high').toLowerCase()}`}>
            {displayAlert.severity || 'HIGH'} SEVERITY
          </span>
        </h2>
      </div>

      <div className="alert-details-section">
        {/* Alert Info */}
        <div className="detail-card">
          <div className="detail-header">
            <div className="icon-wrap danger">
              <Skull size={20} />
            </div>
            <div>
              <h3>{displayAlert.title || 'Brute Force Attack Detected'}</h3>
              <span className="time">
                {new Date(displayAlert.timestamp).toLocaleTimeString()} • Today
              </span>
            </div>
            <span className={`section-badge severity-badge ${(displayAlert.severity || 'high').toLowerCase()}`}>
              {displayAlert.severity || 'HIGH'} SEVERITY
            </span>
          </div>

          <table className="detail-table">
            <tbody>
              <tr><td><Lock size={12} /> Source IP</td><td>{displayAlert.sourceIP}</td></tr>
              <tr><td><Server size={12} /> Target Service</td><td>SSH (Port 22)</td></tr>
              <tr><td><Activity size={12} /> Attempts</td><td><span className="failed">120 failed logins</span></td></tr>
              <tr><td><Eye size={12} /> Confidence Score</td><td>{displayAlert.confidence}%</td></tr>
              <tr><td><ShieldCheck size={12} /> False Positive Prob.</td><td><span className="low-risk">8.1% (Low)</span></td></tr>
            </tbody>
          </table>

          <div className="why-flagged">
            <h4>
              <AlertTriangle size={13} style={{ color: 'var(--accent-orange)' }} /> Why This Was Flagged:
            </h4>
            <ul>
              <li>Unusual number of failed authentication attempts</li>
              <li>Single IP targeting multiple accounts</li>
              <li>Pattern matches brute force signature T1110</li>
              <li>Rate exceeded threshold of 50 attempts/minute</li>
            </ul>
          </div>

          <div className="mitre-section">
            <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bug size={12} /> MITRE ATT&CK
            </h4>
            <span className="mitre-tag">{displayAlert.mitreAttack} Brute Force</span>
          </div>
        </div>

        {/* AI Playbook */}
        <div className="detail-card">
          <div className="detail-header">
            <div className="icon-wrap info">
              <Zap size={20} />
            </div>
            <div>
              <h3>AI-Generated Response Playbook</h3>
              <span className="time">Auto-generated by threat engine</span>
            </div>
          </div>

          <div className="playbook-steps">
            {[
              { step: 1, text: `Immediately block ${displayAlert.sourceIP} at firewall`, icon: Shield },
              { step: 2, text: 'Check if any accounts were successfully compromised', icon: Eye },
              { step: 3, text: 'Force password reset for affected users', icon: Lock },
              { step: 4, text: 'Review authentication logs for lateral movement', icon: Activity },
              { step: 5, text: 'Monitor for continued attack from other IPs', icon: Radio },
            ].map(({ step, text, icon: StepIcon }) => (
              <div key={step} className="playbook-step">
                <div className="step-num">{step}</div>
                <div className="step-icon-small"><StepIcon size={12} /></div>
                <p>{text}</p>
              </div>
            ))}
          </div>

          <button
            className={`execute-btn ${playbookRunning ? 'running' : ''} ${playbookComplete ? 'complete' : ''}`}
            id="execute-playbook-btn"
            onClick={handleExecutePlaybook}
            disabled={playbookRunning}
          >
            {playbookRunning ? (
              <><div className="spinner" /> Executing Playbook...</>
            ) : playbookComplete ? (
              <><ShieldCheck size={18} /> Playbook Executed Successfully</>
            ) : (
              <><Play size={18} /> Execute Playbook</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
