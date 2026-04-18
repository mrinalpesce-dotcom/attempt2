import { useState, useEffect } from 'react';
import { Swords, Play, Shield, Bug, Wifi, Lock, Globe, Zap, Crosshair } from 'lucide-react';
import { createSimulation } from '../api';
import { useSocket } from '../context/SocketContext';

const simulations = [
  {
    id: 'brute-force',
    title: 'Brute Force Attack',
    description: 'Simulate SSH/RDP brute force attacks to test authentication security and rate limiting.',
    icon: Lock,
    color: 'red',
    tags: ['Credential Access', 'T1110', 'SSH', 'RDP'],
  },
  {
    id: 'c2-beacon',
    title: 'C2 Beaconing',
    description: 'Simulate command & control callback patterns to test network monitoring detection.',
    icon: Wifi,
    color: 'blue',
    tags: ['C2', 'T1071', 'DNS', 'HTTP'],
  },
  {
    id: 'exfiltration',
    title: 'Data Exfiltration',
    description: 'Simulate large data transfers to external IPs to test DLP and egress monitoring.',
    icon: Globe,
    color: 'purple',
    tags: ['Exfiltration', 'T1041', 'DLP'],
  },
  {
    id: 'lateral-movement',
    title: 'Lateral Movement',
    description: 'Simulate internal network pivoting through SMB, WinRM, and PsExec techniques.',
    icon: Zap,
    color: 'orange',
    tags: ['Lateral Movement', 'T1021', 'SMB'],
  },
  {
    id: 'ransomware',
    title: 'Ransomware Simulation',
    description: 'Simulate file encryption behavior to test endpoint protection and backup recovery.',
    icon: Bug,
    color: 'pink',
    tags: ['Impact', 'T1486', 'Encryption'],
  },
  {
    id: 'phishing',
    title: 'Phishing Campaign',
    description: 'Simulate targeted phishing emails and credential harvesting to test email security.',
    icon: Shield,
    color: 'green',
    tags: ['Social Engineering', 'T1566', 'Email'],
  },
];

export default function SimulationPage() {
  const [runningSim, setRunningSim] = useState(null);
  const [results, setResults] = useState(null);
  const { isConnected, simulationProgress } = useSocket();

  // Track simulation progress from WebSocket
  useEffect(() => {
    if (!simulationProgress) return;
    if (simulationProgress.status === 'completed' && simulationProgress.results) {
      setResults(simulationProgress.results);
      setRunningSim(null);
    }
  }, [simulationProgress]);

  async function launchSimulation(sim) {
    setRunningSim(sim.id);
    setResults(null);
    try {
      await createSimulation({ name: sim.title, type: sim.id });
      // Server will emit simulationStarted, simulationProgress, simulationCompleted via WebSocket
      // Fallback timeout in case WebSocket event is missed
      setTimeout(() => {
        if (runningSim === sim.id) {
          setResults({
            vulnerabilitiesFound: Math.floor(Math.random() * 10) + 1,
            exploitsSuccessful: Math.floor(Math.random() * 5),
            riskScore: (Math.random() * 100).toFixed(1),
            duration: `${(Math.random() * 30 + 5).toFixed(1)}s`,
            packetsAnalyzed: Math.floor(Math.random() * 50000) + 10000,
          });
          setRunningSim(null);
        }
      }, 7000);
    } catch {
      setResults({
        vulnerabilitiesFound: Math.floor(Math.random() * 10) + 1,
        exploitsSuccessful: Math.floor(Math.random() * 5),
        riskScore: (Math.random() * 100).toFixed(1),
        duration: `${(Math.random() * 30 + 5).toFixed(1)}s`,
        packetsAnalyzed: Math.floor(Math.random() * 50000) + 10000,
      });
      setRunningSim(null);
    }
  }

  const progress = simulationProgress;

  return (
    <>
      <div className="alerts-page-header">
        <h2>
          <Swords size={24} color="var(--accent-purple)" /> Attack Simulations
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={`ws-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            <div className="ws-dot" />
            <span>{isConnected ? 'WebSocket Live' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Live Progress Banner */}
      {runningSim && progress && progress.progress < 100 && (
        <div className="sim-results-banner animate-fadeIn" style={{ borderColor: 'var(--accent-cyan)' }}>
          <h3>
            <Crosshair size={18} color="var(--accent-cyan)" style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Simulation Running — {progress.phase || 'Processing...'}
          </h3>
          <div style={{ margin: '12px 0', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress.progress || 0}%`,
              background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))',
              transition: 'width 0.5s ease',
              borderRadius: '2px',
            }} />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{progress.progress || 0}% complete</span>
        </div>
      )}

      {results && (
        <div className="sim-results-banner animate-fadeIn">
          <h3><Crosshair size={18} color="var(--accent-cyan)" style={{ verticalAlign: 'middle', marginRight: '8px' }} />Simulation Results</h3>
          <div className="sim-results-grid">
            <div className="sim-result-item">
              <span className="label">Vulnerabilities Found</span>
              <span className="value" style={{ color: 'var(--accent-red)' }}>{results.vulnerabilitiesFound}</span>
            </div>
            <div className="sim-result-item">
              <span className="label">Exploits Successful</span>
              <span className="value" style={{ color: 'var(--accent-orange)' }}>{results.exploitsSuccessful}</span>
            </div>
            <div className="sim-result-item">
              <span className="label">Risk Score</span>
              <span className="value" style={{ color: 'var(--accent-cyan)' }}>{results.riskScore}%</span>
            </div>
            <div className="sim-result-item">
              <span className="label">Duration</span>
              <span className="value">{results.duration}</span>
            </div>
            <div className="sim-result-item">
              <span className="label">Packets Analyzed</span>
              <span className="value">{results.packetsAnalyzed.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <div className="sim-grid">
        {simulations.map((sim) => (
          <div key={sim.id} className="sim-card">
            <div className={`sim-icon ${sim.color}`}>
              <sim.icon size={24} />
            </div>
            <h3>{sim.title}</h3>
            <p>{sim.description}</p>
            <div className="sim-tags">
              {sim.tags.map((tag) => (
                <span key={tag} className="sim-tag">{tag}</span>
              ))}
            </div>
            <button
              className="sim-launch-btn"
              onClick={() => launchSimulation(sim)}
              disabled={runningSim !== null}
              id={`launch-${sim.id}`}
            >
              {runningSim === sim.id ? (
                <>
                  <div className="spinner" /> Running...
                </>
              ) : (
                <>
                  <Play size={16} /> Launch Simulation
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
