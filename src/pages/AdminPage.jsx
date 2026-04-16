import { useState, useEffect } from 'react';
import {
  Users, Shield, Settings, Activity, Trash2, Edit3, UserPlus,
  Search, ChevronDown, MoreVertical, CheckCircle, XCircle,
  Clock, LogOut, Key, Database, Server, Cpu, HardDrive,
  Wifi, Lock, BarChart3, AlertTriangle, Eye, UserCheck,
  RefreshCw, Download, Upload, Filter, Zap, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLES = ['Super Admin', 'Security Analyst', 'SOC Analyst', 'Threat Engineer', 'Read Only', 'Intern'];

const AUDIT_LOG = [
  { id: 1, action: 'User Login', user: 'admin', target: 'System', timestamp: '2026-04-16T01:45:00Z', status: 'success', ip: '192.168.1.10' },
  { id: 2, action: 'Alert Dismissed', user: 'analyst1', target: 'Alert #4521', timestamp: '2026-04-15T23:30:00Z', status: 'success', ip: '192.168.1.22' },
  { id: 3, action: 'Failed Login', user: 'unknown', target: 'System', timestamp: '2026-04-15T22:15:00Z', status: 'failed', ip: '45.33.32.156' },
  { id: 4, action: 'Simulation Run', user: 'engineer1', target: 'Brute Force Sim', timestamp: '2026-04-15T21:00:00Z', status: 'success', ip: '192.168.1.35' },
  { id: 5, action: 'Config Changed', user: 'admin', target: 'Firewall Rules', timestamp: '2026-04-15T20:45:00Z', status: 'success', ip: '192.168.1.10' },
  { id: 6, action: 'User Suspended', user: 'admin', target: 'viewer', timestamp: '2026-04-15T19:30:00Z', status: 'success', ip: '192.168.1.10' },
  { id: 7, action: 'Failed Login', user: 'brute_attempt', target: 'System', timestamp: '2026-04-15T18:00:00Z', status: 'failed', ip: '103.224.182.250' },
  { id: 8, action: 'Report Generated', user: 'analyst2', target: 'Weekly Report', timestamp: '2026-04-15T17:15:00Z', status: 'success', ip: '192.168.1.28' },
];

export default function AdminPage() {
  const { user, users, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('all');

  // System metrics (simulated)
  const [systemMetrics, setSystemMetrics] = useState({
    cpuUsage: 34,
    memoryUsage: 67,
    diskUsage: 42,
    networkIn: 234,
    networkOut: 189,
    uptime: '14d 7h 23m',
    activeConnections: 12,
    dbSize: '2.4 GB',
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        cpuUsage: Math.min(100, Math.max(10, prev.cpuUsage + (Math.random() - 0.5) * 8)),
        memoryUsage: Math.min(100, Math.max(30, prev.memoryUsage + (Math.random() - 0.5) * 4)),
        networkIn: Math.floor(Math.random() * 100) + 180,
        networkOut: Math.floor(Math.random() * 80) + 150,
        activeConnections: Math.floor(Math.random() * 5) + 10,
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'system', label: 'System Health', icon: Server },
    { id: 'audit', label: 'Audit Log', icon: Activity },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const getStatusColor = (status) => {
    return status === 'active' ? 'var(--accent-green)' : 'var(--accent-red)';
  };

  const getUsageColor = (value) => {
    if (value < 50) return 'var(--accent-green)';
    if (value < 80) return 'var(--accent-orange)';
    return 'var(--accent-red)';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <>
      {/* Admin Page Header */}
      <div className="admin-page-header">
        <div className="admin-title-section">
          <h2>
            <Shield size={24} color="var(--accent-cyan)" />
            Admin Control Panel
          </h2>
          <span className="admin-role-badge">
            <Key size={12} />
            {user?.role || 'Admin'}
          </span>
        </div>
        <div className="admin-header-actions">
          <button className="admin-action-btn" id="admin-refresh-btn">
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="admin-action-btn danger" onClick={logout} id="admin-logout-btn">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            id={`admin-tab-${tab.id}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div className="admin-section animate-fadeIn">
          {/* User Management Toolbar */}
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="admin-search-input"
              />
            </div>
            <div className="admin-filters">
              <div className="admin-select-wrap">
                <Filter size={14} />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  id="admin-role-filter"
                >
                  <option value="all">All Roles</option>
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <button className="admin-btn primary" onClick={() => setShowAddUser(true)} id="admin-add-user-btn">
                <UserPlus size={16} /> Add User
              </button>
            </div>
          </div>

          {/* User Stats */}
          <div className="admin-user-stats">
            <div className="admin-stat-card">
              <div className="admin-stat-icon cyan"><Users size={20} /></div>
              <div className="admin-stat-info">
                <span className="admin-stat-value">{users.length}</span>
                <span className="admin-stat-label">Total Users</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon green"><UserCheck size={20} /></div>
              <div className="admin-stat-info">
                <span className="admin-stat-value">{users.filter(u => u.status === 'active').length}</span>
                <span className="admin-stat-label">Active Users</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon red"><XCircle size={20} /></div>
              <div className="admin-stat-info">
                <span className="admin-stat-value">{users.filter(u => u.status === 'suspended').length}</span>
                <span className="admin-stat-label">Suspended</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon purple"><Activity size={20} /></div>
              <div className="admin-stat-info">
                <span className="admin-stat-value">{users.reduce((acc, u) => acc + u.loginCount, 0)}</span>
                <span className="admin-stat-label">Total Logins</span>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="admin-table-container">
            <table className="admin-table" id="admin-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Sessions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className={u.status === 'suspended' ? 'row-suspended' : ''}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-sm" style={{
                          background: u.role === 'Super Admin'
                            ? 'var(--gradient-cyber)'
                            : u.status === 'active'
                              ? 'var(--gradient-primary)'
                              : 'linear-gradient(135deg, #64748b, #475569)',
                        }}>
                          {u.name.charAt(0)}
                        </div>
                        <div className="user-info">
                          <span className="user-name">{u.name}</span>
                          <span className="user-email">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${u.role.toLowerCase().replace(/\s/g, '-')}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className="status-indicator" style={{ color: getStatusColor(u.status) }}>
                        {u.status === 'active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <div className="last-login-cell">
                        <Clock size={12} />
                        {formatDate(u.lastLogin)}
                      </div>
                    </td>
                    <td>
                      <span className="session-count">{u.loginCount}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-icon-btn" title="View" id={`view-user-${u.id}`}>
                          <Eye size={14} />
                        </button>
                        <button className="action-icon-btn" title="Edit" id={`edit-user-${u.id}`}>
                          <Edit3 size={14} />
                        </button>
                        {u.role !== 'Super Admin' && (
                          <button className="action-icon-btn danger" title="Delete" id={`delete-user-${u.id}`}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="admin-section animate-fadeIn">
          {/* System Health Metrics */}
          <div className="system-metrics-grid">
            {/* CPU */}
            <div className="system-metric-card">
              <div className="metric-header">
                <Cpu size={18} color="var(--accent-cyan)" />
                <span>CPU Usage</span>
              </div>
              <div className="metric-gauge">
                <svg viewBox="0 0 120 120" className="gauge-svg">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={getUsageColor(systemMetrics.cpuUsage)}
                    strokeWidth="10"
                    strokeDasharray={`${(systemMetrics.cpuUsage / 100) * 314} 314`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="gauge-value">{Math.round(systemMetrics.cpuUsage)}%</div>
              </div>
            </div>

            {/* Memory */}
            <div className="system-metric-card">
              <div className="metric-header">
                <HardDrive size={18} color="var(--accent-purple)" />
                <span>Memory</span>
              </div>
              <div className="metric-gauge">
                <svg viewBox="0 0 120 120" className="gauge-svg">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={getUsageColor(systemMetrics.memoryUsage)}
                    strokeWidth="10"
                    strokeDasharray={`${(systemMetrics.memoryUsage / 100) * 314} 314`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="gauge-value">{Math.round(systemMetrics.memoryUsage)}%</div>
              </div>
            </div>

            {/* Disk */}
            <div className="system-metric-card">
              <div className="metric-header">
                <Database size={18} color="var(--accent-green)" />
                <span>Disk Usage</span>
              </div>
              <div className="metric-gauge">
                <svg viewBox="0 0 120 120" className="gauge-svg">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={getUsageColor(systemMetrics.diskUsage)}
                    strokeWidth="10"
                    strokeDasharray={`${(systemMetrics.diskUsage / 100) * 314} 314`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="gauge-value">{Math.round(systemMetrics.diskUsage)}%</div>
              </div>
            </div>

            {/* Network */}
            <div className="system-metric-card">
              <div className="metric-header">
                <Globe size={18} color="var(--accent-orange)" />
                <span>Network</span>
              </div>
              <div className="network-stats">
                <div className="net-stat">
                  <Upload size={14} color="var(--accent-green)" />
                  <span className="net-value">{systemMetrics.networkOut}</span>
                  <span className="net-unit">Mbps</span>
                </div>
                <div className="net-stat">
                  <Download size={14} color="var(--accent-cyan)" />
                  <span className="net-value">{systemMetrics.networkIn}</span>
                  <span className="net-unit">Mbps</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Info Cards */}
          <div className="system-info-grid">
            <div className="system-info-card">
              <h4><Server size={16} /> Server Info</h4>
              <div className="info-row"><span>Hostname</span><span>cybershield-prod-01</span></div>
              <div className="info-row"><span>OS</span><span>Ubuntu 22.04 LTS</span></div>
              <div className="info-row"><span>Uptime</span><span className="text-green">{systemMetrics.uptime}</span></div>
              <div className="info-row"><span>Node.js</span><span>v20.11.0</span></div>
              <div className="info-row"><span>Active Conns.</span><span>{systemMetrics.activeConnections}</span></div>
            </div>
            <div className="system-info-card">
              <h4><Database size={16} /> Database</h4>
              <div className="info-row"><span>Engine</span><span>MongoDB 7.0</span></div>
              <div className="info-row"><span>Size</span><span>{systemMetrics.dbSize}</span></div>
              <div className="info-row"><span>Collections</span><span>4</span></div>
              <div className="info-row"><span>Documents</span><span>1,247</span></div>
              <div className="info-row"><span>Status</span><span className="text-green">Connected</span></div>
            </div>
            <div className="system-info-card">
              <h4><Shield size={16} /> Security Engine</h4>
              <div className="info-row"><span>Model Version</span><span>v3.2.1</span></div>
              <div className="info-row"><span>Accuracy</span><span className="text-cyan">94.3%</span></div>
              <div className="info-row"><span>Threat Rules</span><span>2,847</span></div>
              <div className="info-row"><span>Last Update</span><span>2h ago</span></div>
              <div className="info-row"><span>Status</span><span className="text-green">Active</span></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="admin-section animate-fadeIn">
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={16} />
              <input type="text" placeholder="Search audit logs..." id="admin-audit-search" />
            </div>
            <div className="admin-filters">
              <button className="admin-btn" id="admin-export-audit">
                <Download size={16} /> Export Logs
              </button>
            </div>
          </div>

          <div className="audit-timeline">
            {AUDIT_LOG.map(log => (
              <div key={log.id} className={`audit-entry ${log.status}`}>
                <div className="audit-dot" />
                <div className="audit-line" />
                <div className="audit-content">
                  <div className="audit-header">
                    <span className="audit-action">{log.action}</span>
                    <span className={`audit-status ${log.status}`}>
                      {log.status === 'success' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {log.status}
                    </span>
                  </div>
                  <div className="audit-details">
                    <span><Users size={11} /> {log.user}</span>
                    <span><Zap size={11} /> {log.target}</span>
                    <span><Globe size={11} /> {log.ip}</span>
                    <span><Clock size={11} /> {formatDate(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="admin-section animate-fadeIn">
          <div className="security-settings-grid">
            <div className="security-card">
              <div className="security-card-header">
                <Lock size={20} color="var(--accent-cyan)" />
                <h3>Authentication</h3>
              </div>
              <div className="security-setting">
                <div className="setting-info">
                  <span className="setting-name">Two-Factor Authentication</span>
                  <span className="setting-desc">Require 2FA for all admin accounts</span>
                </div>
                <label className="toggle-switch" id="toggle-2fa">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="security-setting">
                <div className="setting-info">
                  <span className="setting-name">Session Timeout</span>
                  <span className="setting-desc">Auto-logout after inactivity</span>
                </div>
                <select className="security-select" id="session-timeout-select">
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option selected>1 hour</option>
                  <option>4 hours</option>
                </select>
              </div>
              <div className="security-setting">
                <div className="setting-info">
                  <span className="setting-name">Max Login Attempts</span>
                  <span className="setting-desc">Lock account after failed attempts</span>
                </div>
                <select className="security-select" id="max-attempts-select">
                  <option>3</option>
                  <option selected>5</option>
                  <option>10</option>
                </select>
              </div>
            </div>

            <div className="security-card">
              <div className="security-card-header">
                <Shield size={20} color="var(--accent-purple)" />
                <h3>Firewall & Rate Limiting</h3>
              </div>
              <div className="security-setting">
                <div className="setting-info">
                  <span className="setting-name">API Rate Limiting</span>
                  <span className="setting-desc">Limit API requests per minute</span>
                </div>
                <label className="toggle-switch" id="toggle-rate-limit">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="security-setting">
                <div className="setting-info">
                  <span className="setting-name">IP Whitelist Mode</span>
                  <span className="setting-desc">Only allow known IP addresses</span>
                </div>
                <label className="toggle-switch" id="toggle-ip-whitelist">
                  <input type="checkbox" />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="security-setting">
                <div className="setting-info">
                  <span className="setting-name">Auto-Block Suspicious IPs</span>
                  <span className="setting-desc">Automatically block detected threats</span>
                </div>
                <label className="toggle-switch" id="toggle-auto-block">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="security-card full-width">
              <div className="security-card-header">
                <AlertTriangle size={20} color="var(--accent-orange)" />
                <h3>Blocked IPs</h3>
                <span className="blocked-count">7 IPs blocked</span>
              </div>
              <div className="blocked-ips-list">
                {['45.33.32.156', '185.220.101.1', '103.224.182.250', '91.121.87.10', '195.154.179.2', '177.54.23.89', '62.210.105.116'].map((ip, i) => (
                  <div key={ip} className="blocked-ip-item">
                    <div className="blocked-ip-info">
                      <span className="blocked-ip">{ip}</span>
                      <span className="blocked-reason">{['Brute Force', 'C2 Beacon', 'Data Exfil', 'Port Scan', 'Credential Stuff', 'SQL Injection', 'DDoS'][i]}</span>
                    </div>
                    <button className="unblock-btn" id={`unblock-${ip.replace(/\./g, '-')}`}>Unblock</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
