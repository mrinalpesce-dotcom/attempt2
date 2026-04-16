import { useState, useEffect, useRef } from 'react';
import {
  Lock, Play, Square, Terminal, Shield, AlertTriangle, CheckCircle,
  XCircle, Clock, Zap, Target, Key, Skull, BarChart3, RefreshCw,
  ChevronRight, Crosshair, Eye, EyeOff
} from 'lucide-react';

// Common password wordlist for demonstration
const WORDLIST = [
  'password', '123456', 'admin', 'letmein', 'welcome', 'monkey', 'dragon',
  'master', 'qwerty', 'login', 'abc123', 'starwars', 'trustno1', '654321',
  'root', 'pass', 'test', 'guest', 'shadow', 'sunshine', 'superman',
  'michael', 'access', 'thunder', 'batman', 'football', 'jennifer',
  'hunter2', 'ranger', 'buster', 'soccer', 'charlie', 'robert',
  'thomas', 'hockey', 'tigger', 'andrew', 'harley', 'joshua',
  'pepper', 'maggie', 'dallas', 'austin', 'CyberShield@2026',
  'iloveyou', 'princess', 'nicole', 'ashley', 'diamond', 'cookie',
];

const TARGET_SERVICES = [
  { id: 'ssh', name: 'SSH (Port 22)', icon: Terminal, desc: 'Secure Shell brute force attack' },
  { id: 'rdp', name: 'RDP (Port 3389)', icon: Target, desc: 'Remote Desktop Protocol attack' },
  { id: 'ftp', name: 'FTP (Port 21)', icon: Key, desc: 'File Transfer Protocol attack' },
  { id: 'web', name: 'HTTP Login (Port 80)', icon: Lock, desc: 'Web application login attack' },
];

export default function BruteForcePage() {
  const [targetIP, setTargetIP] = useState('192.168.1.100');
  const [targetUser, setTargetUser] = useState('admin');
  const [selectedService, setSelectedService] = useState('ssh');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [logs, setLogs] = useState([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [found, setFound] = useState(false);
  const [foundPassword, setFoundPassword] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [customWordlist, setCustomWordlist] = useState('');
  const [delay, setDelay] = useState(200);
  const terminalRef = useRef(null);
  const intervalRef = useRef(null);
  const wordIndexRef = useRef(0);
  const isPausedRef = useRef(false);

  // Elapsed timer
  useEffect(() => {
    let timer;
    if (isRunning && startTime && !found) {
      timer = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, startTime, found]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { message, type, timestamp, id: Date.now() + Math.random() }]);
  };

  const getWordlist = () => {
    if (customWordlist.trim()) {
      return customWordlist.split('\n').map(w => w.trim()).filter(Boolean);
    }
    return WORDLIST;
  };

  const startAttack = () => {
    const wordlist = getWordlist();
    setIsRunning(true);
    setIsPaused(false);
    isPausedRef.current = false;
    setFound(false);
    setFoundPassword('');
    setAttemptCount(0);
    setLogs([]);
    setStartTime(Date.now());
    setElapsed(0);
    wordIndexRef.current = 0;

    addLog(`[*] CyberShield Brute Force Module v3.2`, 'system');
    addLog(`[*] Target: ${targetIP}:${selectedService === 'ssh' ? '22' : selectedService === 'rdp' ? '3389' : selectedService === 'ftp' ? '21' : '80'}`, 'system');
    addLog(`[*] Username: ${targetUser}`, 'system');
    addLog(`[*] Service: ${TARGET_SERVICES.find(s => s.id === selectedService)?.name}`, 'system');
    addLog(`[*] Wordlist size: ${wordlist.length} passwords`, 'system');
    addLog(`[*] Delay: ${delay}ms between attempts`, 'system');
    addLog(`[*] Starting attack...`, 'warning');
    addLog(`─`.repeat(50), 'divider');

    const run = () => {
      intervalRef.current = setInterval(() => {
        if (isPausedRef.current) return;

        const idx = wordIndexRef.current;
        if (idx >= wordlist.length) {
          clearInterval(intervalRef.current);
          addLog(`─`.repeat(50), 'divider');
          addLog(`[!] Wordlist exhausted. No valid password found.`, 'error');
          addLog(`[*] Total attempts: ${wordlist.length}`, 'system');
          setIsRunning(false);
          return;
        }

        const pw = wordlist[idx];
        wordIndexRef.current = idx + 1;
        setCurrentPassword(pw);
        setAttemptCount(idx + 1);
        setSpeed(Math.round(1000 / delay));

        // Check if this is the "correct" password
        if (pw === 'CyberShield@2026' && targetUser === 'admin') {
          addLog(`[+] Trying: ${targetUser}:${pw}`, 'success');
          setTimeout(() => {
            clearInterval(intervalRef.current);
            addLog(`─`.repeat(50), 'divider');
            addLog(`[✓] PASSWORD FOUND!`, 'success');
            addLog(`[✓] Username: ${targetUser}`, 'success');
            addLog(`[✓] Password: ${pw}`, 'success');
            addLog(`[✓] Service: ${TARGET_SERVICES.find(s => s.id === selectedService)?.name}`, 'success');
            addLog(`[*] Total attempts: ${idx + 1}/${wordlist.length}`, 'system');
            addLog(`[*] Attack completed successfully`, 'success');
            setFound(true);
            setFoundPassword(pw);
            setIsRunning(false);
          }, 300);
        } else {
          addLog(`[-] Trying: ${targetUser}:${pw} → ACCESS DENIED`, 'error');
        }
      }, delay);
    };

    setTimeout(run, 1000);
  };

  const stopAttack = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsPaused(false);
    isPausedRef.current = false;
    addLog(`─`.repeat(50), 'divider');
    addLog(`[!] Attack manually stopped by operator`, 'warning');
    addLog(`[*] Total attempts: ${attemptCount}`, 'system');
  };

  const togglePause = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    isPausedRef.current = newPaused;
    if (newPaused) {
      addLog(`[!] Attack paused`, 'warning');
    } else {
      addLog(`[*] Attack resumed`, 'system');
    }
  };

  const resetAttack = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setFound(false);
    setFoundPassword('');
    setAttemptCount(0);
    setLogs([]);
    setElapsed(0);
    setCurrentPassword('');
    setSpeed(0);
    wordIndexRef.current = 0;
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getProgressPercent = () => {
    const wordlist = getWordlist();
    return wordlist.length > 0 ? (attemptCount / wordlist.length) * 100 : 0;
  };

  return (
    <>
      {/* Page Header */}
      <div className="alerts-page-header">
        <h2>
          <Skull size={24} color="var(--accent-red)" />
          Brute Force Attack Module
        </h2>
        <div className="bf-header-pills">
          <span className={`bf-status-pill ${isRunning ? (isPaused ? 'paused' : 'running') : found ? 'found' : 'idle'}`}>
            <div className={`bf-status-dot ${isRunning ? (isPaused ? 'paused' : 'running') : ''}`} />
            {isRunning ? (isPaused ? 'Paused' : 'Running') : found ? 'Cracked!' : 'Idle'}
          </span>
        </div>
      </div>

      <div className="bf-layout">
        {/* Left panel - Configuration */}
        <div className="bf-config-panel">
          <div className="bf-config-card">
            <h3><Target size={16} /> Attack Configuration</h3>

            {/* Target Service */}
            <div className="bf-service-grid">
              {TARGET_SERVICES.map(svc => (
                <button
                  key={svc.id}
                  className={`bf-service-btn ${selectedService === svc.id ? 'active' : ''}`}
                  onClick={() => setSelectedService(svc.id)}
                  disabled={isRunning}
                  id={`bf-service-${svc.id}`}
                >
                  <svc.icon size={18} />
                  <span>{svc.name}</span>
                </button>
              ))}
            </div>

            {/* Target IP */}
            <div className="bf-field">
              <label><Target size={13} /> Target IP</label>
              <input
                type="text"
                value={targetIP}
                onChange={(e) => setTargetIP(e.target.value)}
                disabled={isRunning}
                placeholder="e.g. 192.168.1.100"
                id="bf-target-ip"
              />
            </div>

            {/* Username */}
            <div className="bf-field">
              <label><Key size={13} /> Username</label>
              <input
                type="text"
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                disabled={isRunning}
                placeholder="e.g. admin"
                id="bf-target-user"
              />
            </div>

            {/* Delay */}
            <div className="bf-field">
              <label><Clock size={13} /> Delay (ms)</label>
              <div className="bf-delay-control">
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  disabled={isRunning}
                  id="bf-delay-slider"
                />
                <span className="bf-delay-value">{delay}ms</span>
              </div>
            </div>

            {/* Custom Wordlist */}
            <div className="bf-field">
              <label><Terminal size={13} /> Custom Wordlist (optional)</label>
              <textarea
                value={customWordlist}
                onChange={(e) => setCustomWordlist(e.target.value)}
                disabled={isRunning}
                placeholder="One password per line...&#10;Leave empty to use default wordlist"
                rows={4}
                id="bf-custom-wordlist"
              />
            </div>

            {/* Action Buttons */}
            <div className="bf-actions">
              {!isRunning ? (
                <button className="bf-start-btn" onClick={startAttack} id="bf-start-btn">
                  <Play size={18} /> Launch Attack
                </button>
              ) : (
                <div className="bf-running-actions">
                  <button className="bf-pause-btn" onClick={togglePause} id="bf-pause-btn">
                    {isPaused ? <Play size={16} /> : <Square size={16} />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button className="bf-stop-btn" onClick={stopAttack} id="bf-stop-btn">
                    <XCircle size={16} /> Stop
                  </button>
                </div>
              )}
              <button className="bf-reset-btn" onClick={resetAttack} disabled={isRunning} id="bf-reset-btn">
                <RefreshCw size={16} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Right panel - Terminal & Results */}
        <div className="bf-output-panel">
          {/* Stats Row */}
          <div className="bf-stats-row">
            <div className="bf-stat">
              <BarChart3 size={14} color="var(--accent-cyan)" />
              <div>
                <span className="bf-stat-value">{attemptCount}</span>
                <span className="bf-stat-label">Attempts</span>
              </div>
            </div>
            <div className="bf-stat">
              <Clock size={14} color="var(--accent-purple)" />
              <div>
                <span className="bf-stat-value">{formatTime(elapsed)}</span>
                <span className="bf-stat-label">Elapsed</span>
              </div>
            </div>
            <div className="bf-stat">
              <Zap size={14} color="var(--accent-orange)" />
              <div>
                <span className="bf-stat-value">{speed}/s</span>
                <span className="bf-stat-label">Speed</span>
              </div>
            </div>
            <div className="bf-stat">
              <Target size={14} color="var(--accent-green)" />
              <div>
                <span className="bf-stat-value">{getProgressPercent().toFixed(1)}%</span>
                <span className="bf-stat-label">Progress</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bf-progress">
            <div
              className={`bf-progress-fill ${found ? 'found' : ''}`}
              style={{ width: `${getProgressPercent()}%` }}
            />
            {currentPassword && isRunning && (
              <span className="bf-current-pw">
                Trying: <code>{currentPassword}</code>
              </span>
            )}
          </div>

          {/* Found Banner */}
          {found && (
            <div className="bf-found-banner animate-fadeIn">
              <div className="bf-found-icon">
                <Skull size={28} />
              </div>
              <div className="bf-found-info">
                <h3>🔓 Password Cracked!</h3>
                <div className="bf-found-details">
                  <span><Key size={12} /> Username: <strong>{targetUser}</strong></span>
                  <span>
                    <Lock size={12} /> Password:{' '}
                    <strong className="bf-password-reveal">
                      {showPassword ? foundPassword : '•'.repeat(foundPassword.length)}
                    </strong>
                    <button className="bf-reveal-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </span>
                  <span><Target size={12} /> Target: <strong>{targetIP}</strong></span>
                  <span><Clock size={12} /> Time: <strong>{formatTime(elapsed)}</strong></span>
                  <span><BarChart3 size={12} /> Attempts: <strong>{attemptCount}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Terminal */}
          <div className="bf-terminal">
            <div className="bf-terminal-header">
              <div className="terminal-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <span className="terminal-title">
                <Terminal size={12} /> CyberShield — Brute Force Module
              </span>
              <span className="terminal-badge">
                {logs.length} lines
              </span>
            </div>
            <div className="bf-terminal-body" ref={terminalRef} id="bf-terminal-output">
              {logs.length === 0 ? (
                <div className="terminal-placeholder">
                  <Shield size={32} />
                  <p>Configure attack parameters and click "Launch Attack" to begin.</p>
                  <p className="terminal-hint">This is a controlled simulation for security testing purposes only.</p>
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className={`terminal-line ${log.type}`}>
                    <span className="terminal-time">{log.timestamp}</span>
                    <span className="terminal-msg">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
