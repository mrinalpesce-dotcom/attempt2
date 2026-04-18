import { useState, useEffect } from 'react';
import { ShieldAlert, Search, Trash2 } from 'lucide-react';
import { fetchAlerts, updateAlert, deleteAlert } from '../api';
import { useSocket } from '../context/SocketContext';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { liveAlerts } = useSocket();

  useEffect(() => {
    loadAlerts();
  }, [filterSeverity, filterStatus]);

  async function loadAlerts() {
    try {
      const data = await fetchAlerts({ severity: filterSeverity, status: filterStatus, search: searchQuery });
      setAlerts(data);
    } catch {
      // Use fallback data
      setAlerts([
        { _id: '1', title: 'BRUTE FORCE ATTACK', severity: 'HIGH', sourceIP: '192.168.1.45', targetIP: '10.0.0.1', type: 'Brute Force', status: 'active', confidence: 94.2, timestamp: new Date().toISOString() },
        { _id: '2', title: 'C2 BEACONING DETECTED', severity: 'MEDIUM', sourceIP: '8.8.3.8', targetIP: '10.0.0.15', type: 'C2 Beacon', status: 'active', confidence: 87.5, timestamp: new Date().toISOString() },
        { _id: '3', title: 'DATA EXFILTRATION', severity: 'HIGH', sourceIP: '10.0.0.23', targetIP: '185.234.72.1', type: 'Exfiltration', status: 'investigating', confidence: 91.8, timestamp: new Date().toISOString() },
        { _id: '4', title: 'RANSOMWARE DETECTED', severity: 'CRITICAL', sourceIP: '10.0.0.50', targetIP: '10.0.0.0/24', type: 'Ransomware', status: 'active', confidence: 98.7, timestamp: new Date().toISOString() },
        { _id: '5', title: 'SUSPICIOUS LOGIN', severity: 'LOW', sourceIP: '203.45.67.89', targetIP: '10.0.0.5', type: 'Brute Force', status: 'resolved', confidence: 65.1, timestamp: new Date().toISOString() },
        { _id: '6', title: 'PRIVILEGE ESCALATION', severity: 'HIGH', sourceIP: '10.0.0.12', targetIP: '10.0.0.12', type: 'Privilege Escalation', status: 'active', confidence: 96.1, timestamp: new Date().toISOString() },
      ]);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await updateAlert(id, { status: newStatus });
      loadAlerts();
    } catch {
      setAlerts((prev) => prev.map((a) => a._id === id ? { ...a, status: newStatus } : a));
    }
  }

  async function handleDelete(id) {
    try {
      await deleteAlert(id);
      loadAlerts();
    } catch {
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    }
  }

  // Include live alerts at top
  const allAlerts = [...liveAlerts.slice(0, 5), ...alerts];

  return (
    <>
      <div className="alerts-page-header">
        <h2>
          <ShieldAlert size={24} color="var(--accent-red)" /> Threat Alerts
        </h2>
        <div className="filter-bar">
          <div className="header-search" style={{ maxWidth: '200px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadAlerts()}
              id="alerts-search-input"
            />
          </div>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} id="severity-filter">
            <option value="all">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} id="status-filter">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <table className="alerts-table">
        <thead>
          <tr>
            <th>Alert</th>
            <th>Severity</th>
            <th>Source IP</th>
            <th>Target IP</th>
            <th>Type</th>
            <th>Confidence</th>
            <th>Status</th>
            <th>Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allAlerts.map((alert, i) => (
            <tr key={alert._id || i}>
              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{alert.title}</td>
              <td>
                <span className={`severity-badge ${(alert.severity || '').toLowerCase()}`}>
                  {alert.severity}
                </span>
              </td>
              <td className="ip-cell">{alert.sourceIP}</td>
              <td className="ip-cell">{alert.targetIP}</td>
              <td>{alert.type}</td>
              <td>{alert.confidence}%</td>
              <td>
                <select
                  className={`status-tag ${alert.status}`}
                  value={alert.status}
                  onChange={(e) => handleStatusChange(alert._id, e.target.value)}
                  style={{ cursor: 'pointer', border: 'none', background: 'transparent', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit' }}
                >
                  <option value="active">Active</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
              </td>
              <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-muted)' }}>
                {new Date(alert.timestamp).toLocaleTimeString()}
              </td>
              <td>
                <button
                  onClick={() => handleDelete(alert._id)}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', padding: '4px', borderRadius: '4px',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--accent-red)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
