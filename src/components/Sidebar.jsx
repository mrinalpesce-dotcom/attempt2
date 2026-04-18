import { useState, useEffect } from 'react';
import { 
  ShieldHalf, Radar, Activity, Globe2, Swords, BookMarked, 
  FileBarChart, Fingerprint, Settings, Zap, Wifi, 
  ChevronRight, Cpu, BarChart3, Server, TerminalSquare, Skull, UserCog,
  ScanEye, BrainCircuit, Binary, ShieldCheck
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const navItems = [
  { id: 'overview', label: 'Command Center', icon: Radar, gradient: 'linear-gradient(135deg, #00d4ff, #3b82f6)', desc: 'Mission control' },
  { id: 'livemonitor', label: 'Live Recon', icon: ScanEye, gradient: 'linear-gradient(135deg, #10b981, #34d399)', desc: 'Real-time feed' },
  { id: 'threatmap', label: 'Threat Intel', icon: Globe2, gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)', desc: 'Global attack map' },
  { id: 'simulation', label: 'Red Team Ops', icon: Swords, gradient: 'linear-gradient(135deg, #ef4444, #f97316)', desc: 'Attack simulation' },
  { id: 'bruteforce', label: 'Brute Force', icon: Skull, gradient: 'linear-gradient(135deg, #ff1744, #d50000)', desc: 'Password cracking' },
  { id: 'playbooks', label: 'Playbooks', icon: BookMarked, gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', desc: 'Incident response' },
  { id: 'reports', label: 'Intel Reports', icon: FileBarChart, gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', desc: 'Threat analytics' },
  { id: 'mitre', label: 'MITRE ATT&CK', icon: Fingerprint, gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)', desc: 'TTPs framework' },
  { id: 'logs', label: 'Sys Logs', icon: TerminalSquare, gradient: 'linear-gradient(135deg, #10b981, #06d6a0)', desc: 'Event audit' },
  { id: 'prevention', label: 'Prevention', icon: ShieldCheck, gradient: 'linear-gradient(135deg, #00d4ff, #10b981)', desc: 'Data breach protection' },
  { id: 'admin', label: 'Admin Panel', icon: UserCog, gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', desc: 'User management' },
  { id: 'settings', label: 'Settings', icon: Settings, gradient: 'linear-gradient(135deg, #64748b, #94a3b8)', desc: 'Configuration' },
];

export default function Sidebar({ activePage, onNavClick }) {
  const { isConnected, liveAlerts, clientCount } = useSocket();
  const [time, setTime] = useState(new Date());
  const [eventsCount, setEventsCount] = useState(1247832);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setEventsCount(prev => prev + Math.floor(Math.random() * 50) + 10);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  return (
    <aside className="sidebar">
      {/* Logo with glitch effect */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShieldHalf size={22} strokeWidth={2.5} />
          <div className="logo-ring" />
          <div className="logo-pulse" />
        </div>
        <div className="sidebar-logo-text">
          <h1 className="glitch-text" data-text="CYBERSHIELD">CYBERSHIELD</h1>
          <p><Binary size={9} /> Threat Detection Engine v3.7</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavClick(item.id)}
              title={item.desc}
            >
              <div className="nav-icon-wrap" style={{ background: isActive ? item.gradient : 'transparent' }}>
                <item.icon size={17} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <div className="nav-label-group">
                <span>{item.label}</span>
                {item.id === 'livemonitor' && liveAlerts.length > 0 && (
                  <span className="nav-badge">{liveAlerts.length}</span>
                )}
              </div>
              {isActive && <ChevronRight size={14} className="nav-chevron" />}
            </div>
          );
        })}
      </nav>

      {/* System Status Panel */}
      <div className="sidebar-status">
        <div className="status-card">
          <h4>
            <BrainCircuit size={12} /> Neural Engine
          </h4>
          <div className="status-live">
            <div className={`status-dot ${isConnected ? '' : 'offline'}`} />
            <span style={{ color: isConnected ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {isConnected ? 'Active & Scanning' : 'Reconnecting...'}
            </span>
          </div>

          <div className="status-metric">
            <label><Cpu size={10} /> Events Analyzed</label>
            <div>
              <span className="value">{formatNumber(eventsCount)}</span>
              <span className="change"> ↑ 23%</span>
            </div>
          </div>

          <div className="status-metric">
            <label><BarChart3 size={10} /> AI Accuracy</label>
            <div>
              <span className="value">94.3<span className="unit">%</span></span>
              <span className="change"> ↑ 2.1%</span>
            </div>
          </div>

          <div className="status-metric">
            <label><Wifi size={10} /> Operatives</label>
            <div>
              <span className="value">{clientCount || 1}</span>
              <span className="change" style={{ color: 'var(--accent-cyan)' }}> online</span>
            </div>
          </div>

          <div className="last-updated">
            <Zap size={10} /> {time.toLocaleTimeString()} • Live
          </div>
        </div>
      </div>
    </aside>
  );
}
