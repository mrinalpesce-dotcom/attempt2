import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { AlertTriangle, ShieldAlert, Skull, Radio, Bug, Globe, Zap, Lock } from 'lucide-react';

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function severityClass(s) {
  return (s || '').toLowerCase();
}

const typeIcons = {
  'Brute Force': Lock,
  'C2 Beacon': Radio,
  'Exfiltration': Globe,
  'Data Exfiltration': Globe,
  'Lateral Movement': Zap,
  'Ransomware': Skull,
  'Web Attack': Bug,
  'Social Engineering': AlertTriangle,
  'Reconnaissance': ShieldAlert,
  'Privilege Escalation': ShieldAlert,
};

export default function LiveAlertsFeed({ alerts = [] }) {
  const { liveAlerts } = useSocket();
  const feedRef = useRef(null);

  const allAlerts = [...liveAlerts, ...alerts].slice(0, 25);

  // Auto-scroll to top on new alerts
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [liveAlerts.length]);

  return (
    <div className="alerts-feed" ref={feedRef}>
      {allAlerts.length === 0 && (
        <div className="alerts-feed-empty">
          <Radio size={24} className="feed-pulse-icon" />
          <span>Monitoring for threats...</span>
        </div>
      )}
      {allAlerts.map((alert, i) => {
        const IconComp = typeIcons[alert.type] || ShieldAlert;
        const isNew = i < 3 && liveAlerts.includes(alert);
        return (
          <div
            key={alert._id || `alert-${i}`}
            className={`alert-item severity-${severityClass(alert.severity)} ${isNew ? 'alert-new' : ''}`}
          >
            <div className="alert-time">{formatTime(alert.timestamp)}</div>
            <div className="alert-title">
              <div className={`alert-type-icon severity-${severityClass(alert.severity)}`}>
                <IconComp size={13} />
              </div>
              <span>{alert.title}</span>
              <span className={`severity-badge ${severityClass(alert.severity)}`}>
                {alert.severity}
              </span>
            </div>
            <div className="alert-desc">
              {alert.sourceIP} • {alert.description || alert.type}
            </div>
            {alert.geo && (
              <div className="alert-geo">
                🌍 {alert.geo.country}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
