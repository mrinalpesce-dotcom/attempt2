import { useState } from 'react';
import {
  Search, Bell, Wifi, WifiOff, ShieldHalf, User,
  Radar, ShieldAlert, Swords, BarChart3, Settings,
  Skull, AlertTriangle, AlertCircle, CheckCircle2, Scan
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', Icon: Radar },
  { id: 'alerts', label: 'Alerts', Icon: ShieldAlert },
  { id: 'simulation', label: 'Simulation', Icon: Swords },
  { id: 'reports', label: 'Reports', Icon: BarChart3 },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

function getSeverityIcon(severity) {
  switch (severity) {
    case 'CRITICAL': return <Skull size={14} color="var(--severity-critical)" />;
    case 'HIGH': return <AlertTriangle size={14} color="var(--severity-high)" />;
    case 'MEDIUM': return <AlertCircle size={14} color="var(--severity-medium)" />;
    case 'LOW': return <CheckCircle2 size={14} color="var(--severity-low)" />;
    default: return <AlertCircle size={14} color="var(--text-muted)" />;
  }
}

export default function Header({ activeTab, onTabClick }) {
  const { isConnected, liveAlerts, clientCount } = useSocket();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const recentAlerts = liveAlerts.slice(0, 5);

  return (
    <header className="header">
      <nav className="header-nav">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`header-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabClick(tab.id)}
          >
            <tab.Icon size={14} className="header-tab-icon" />
            {tab.label}
          </div>
        ))}
      </nav>

      <div className="header-search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search alerts, IPs, threats..."
          id="header-search-input"
        />
        <kbd className="search-shortcut">⌘K</kbd>
      </div>

      <div className="header-actions">
        {/* WebSocket Status */}
        <div className={`ws-status-chip ${isConnected ? 'connected' : 'disconnected'}`}>
          <div className="ws-status-dot" />
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{isConnected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Notifications */}
        <div className="notification-wrapper">
          <button
            className="header-icon-btn"
            id="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={19} />
            {liveAlerts.length > 0 && (
              <span className="badge">{Math.min(liveAlerts.length, 99)}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notif-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={14} /> Notifications
                </span>
                <span className="notif-count">{liveAlerts.length} new</span>
              </div>
              {recentAlerts.length === 0 ? (
                <div className="notif-empty">No new notifications</div>
              ) : (
                recentAlerts.map((alert, i) => (
                  <div key={alert._id || i} className={`notif-item severity-${(alert.severity || '').toLowerCase()}`}>
                    <div className="notif-icon-wrap">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="notif-content">
                      <div className="notif-title">{alert.title}</div>
                      <div className="notif-meta">{alert.sourceIP} • {new Date(alert.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <span className={`severity-badge ${(alert.severity || '').toLowerCase()}`}>{alert.severity}</span>
                  </div>
                ))
              )}
              <div className="notif-footer">View All Alerts →</div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="header-user">
          <div className="header-avatar" id="user-avatar">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{user?.name || 'Admin'}</span>
            <span className="header-user-role">
              <div className="header-role-dot" style={{
                background: isConnected ? 'var(--accent-green)' : 'var(--accent-red)',
              }} />
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
