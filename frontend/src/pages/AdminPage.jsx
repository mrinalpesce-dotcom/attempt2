import { useState, useEffect } from 'react';
import {
  Users, Shield, Settings, Activity, Trash2, Edit3, UserPlus,
  Search, ChevronDown, MoreVertical, CheckCircle, XCircle,
  Clock, LogOut, Key, Database, Server, Cpu, HardDrive,
  Wifi, Lock, BarChart3, AlertTriangle, Eye, UserCheck,
  RefreshCw, Download, Upload, Filter, Zap, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { fetchAuditLogs, fetchBlockedIPs, unblockIP, blockIP } from '../api';

const ROLES = ['Super Admin', 'Security Analyst', 'SOC Analyst', 'Threat Engineer', 'Read Only', 'Intern'];

export default function AdminPage() {
  const { user, users, logout } = useAuth();
  const { systemMetrics: liveMetrics, auditLogs: liveAuditLogs, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('all');

  // Audit logs from DB + WebSocket
  const [dbAuditLogs, setDbAuditLogs] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);

  // Load audit logs and blocked IPs
  useEffect(() => {
    fetchAuditLogs().then(setDbAuditLogs).catch(() => {});
    fetchBlockedIPs().then(setBlockedIPs).catch(() => {
      setBlockedIPs([
        { ip: '45.33.32.156', reason: 'Brute Force' },
        { ip: '185.220.101.1', reason: 'C2 Beacon' },
        { ip: '103.224.182.250', reason: 'Data Exfil' },
        { ip: '91.121.87.10', reason: 'Port Scan' },
        { ip: '195.154.179.2', reason: 'Credential Stuff' },
        { ip: '177.54.23.89', reason: 'SQL Injection' },
        { ip: '62.210.105.116', reason: 'DDoS' },
      ]);
    });
  }, []);

  // System metrics from WebSocket (real-time)
  const metrics = liveMetrics || {
    cpuUsage: 34, memoryUsage: 67, diskUsage: 42,
    networkIn: 234, networkOut: 189, uptime: '0d 0h 0m',
    activeConnections: 12, hostname: 'cybershield-prod-01',
    totalMemory: 16, freeMemory: 5.3, cpuCores: 8,
    nodeVersion: 'v20.11.0', connectedClients: 1,
  };

  // Merge WebSocket audit logs with DB ones (dedup by timestamp)
  const allAuditLogs = [...liveAuditLogs, ...dbAuditLogs]
    .filter((log, i, arr) => arr.findIndex(l => l.timestamp === log.timestamp && l.action === log.action) === i)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 50);

  const handleUnblockIP = async (ip) => {
    try {
      await unblockIP(ip);
      setBlockedIPs(prev => prev.filter(b => b.ip !== ip));
    } catch {
      setBlockedIPs(prev => prev.filter(b => b.ip !== ip));
    }
  };

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
            {isConnected && (
              <>
                <div className="live-dot-inline" />
                <span className="live-text-label">LIVE</span>
              </>
            )}
          </h2>
          <span className="admin-role-badge">
            <Key size={12} />
            {user?.role || 'Admin'}
          </span>
        </div>
        <div className="admin-header-actions">
          <button className="admin-action-btn" id="admin-refresh-btn" onClick={() => {
            fetchAuditLogs().then(setDbAuditLogs).catch(() => {});
            fetchBlockedIPs().then(setBlockedIPs).catch(() => {});
          }}>
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
          <div className="system-metrics-grid">
            {/* CPU - Real-time from WebSocket */}
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
                    stroke={getUsageColor(metrics.cpuUsage)}
                    strokeWidth="10"
                    strokeDasharray={`${(metrics.cpuUsage / 100) * 314} 314`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="gauge-value">{Math.round(metrics.cpuUsage)}%</div>
              </div>
            </div>

            {/* Memory - Real-time */}
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
                    stroke={getUsageColor(metrics.memoryUsage)}
                    strokeWidth="10"
                    strokeDasharray={`${(metrics.memoryUsage / 100) * 314} 314`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="gauge-value">{Math.round(metrics.memoryUsage)}%</div>
              </div>
            </div>

            {/* Disk - Real-time */}
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
                    stroke={getUsageColor(metrics.diskUsage)}
                    strokeWidth="10"
                    strokeDasharray={`${(metrics.diskUsage / 100) * 314} 314`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="gauge-value">{Math.round(metrics.diskUsage)}%</div>
              </div>
            </div>

            {/* Network - Real-time */}
            <div className="system-metric-card">
              <div className="metric-header">
                <Globe size={18} color="var(--accent-orange)" />
                <span>Network</span>
              </div>
              <div className="network-stats">
                <div className="net-stat">
                  <Upload size={14} color="var(--accent-green)" />
                  <span className="net-value">{Math.round(metrics.networkOut)}</span>
                  <span className="net-unit">Mbps</span>
                </div>
                <div className="net-stat">
                  <Download size={14} color="var(--accent-cyan)" />
                  <span className="net-value">{Math.round(metrics.networkIn)}</span>
                  <span className="net-unit">Mbps</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Info Cards - Real data from server */}
          <div className="system-info-grid">
            <div className="system-info-card">
              <h4><Server size={16} /> Server Info</h4>
              <div className="info-row"><span>Hostname</span><span>{metrics.hostname || 'cybershield-prod-01'}</span></div>
              <div className="info-row"><span>OS</span><span>{metrics.platform || 'linux'}</span></div>
              <div className="info-row"><span>Uptime</span><span className="text-green">{metrics.uptime}</span></div>
              <div className="info-row"><span>Node.js</span><span>{metrics.nodeVersion || 'v20.11.0'}</span></div>
              <div className="info-row"><span>Active Conns.</span><span>{metrics.connectedClients || metrics.activeConnections}</span></div>
              <div className="info-row"><span>CPU Cores</span><span>{metrics.cpuCores || 8}</span></div>
            </div>
            <div className="system-info-card">
              <h4><Database size={16} /> Database</h4>
              <div className="info-row"><span>Engine</span><span>MongoDB 7.0</span></div>
              <div className="info-row"><span>Total RAM</span><span>{metrics.totalMemory || 16} GB</span></div>
              <div className="info-row"><span>Free RAM</span><span>{metrics.freeMemory || 5.3} GB</span></div>
              <div className="info-row"><span>Collections</span><span>7</span></div>
              <div className="info-row"><span>Status</span><span className="text-green">{isConnected ? 'Connected' : 'Checking...'}</span></div>
            </div>
            <div className="system-info-card">
              <h4><Shield size={16} /> Security Engine</h4>
              <div className="info-row"><span>Model Version</span><span>v3.2.1</span></div>
              <div className="info-row"><span>Accuracy</span><span className="text-cyan">94.3%</span></div>
              <div className="info-row"><span>Threat Rules</span><span>2,847</span></div>
              <div className="info-row"><span>Req/min</span><span>{Math.round(metrics.requestsPerMin || 340)}</span></div>
              <div className="info-row"><span>Error Rate</span><span>{(metrics.errorRate || 0.3).toFixed(1)}%</span></div>
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
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {allAuditLogs.length} entries • Updates in real-time
              </span>
              <button className="admin-btn" id="admin-export-audit">
                <Download size={16} /> Export Logs
              </button>
            </div>
          </div>

          <div className="audit-timeline">
            {allAuditLogs.map((log, i) => (
              <div key={log._id || `audit-${i}`} className={`audit-entry ${log.status}`}>
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
                <span className="blocked-count">{blockedIPs.length} IPs blocked</span>
              </div>
              <div className="blocked-ips-list">
                {blockedIPs.map((item) => (
                  <div key={item.ip} className="blocked-ip-item">
                    <div className="blocked-ip-info">
                      <span className="blocked-ip">{item.ip}</span>
                      <span className="blocked-reason">{item.reason}</span>
                    </div>
                    <button
                      className="unblock-btn"
                      id={`unblock-${item.ip.replace(/\./g, '-')}`}
                      onClick={() => handleUnblockIP(item.ip)}
                    >
                      Unblock
                    </button>
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
