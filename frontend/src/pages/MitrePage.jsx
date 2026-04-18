import { useState, useEffect } from 'react';
import { Grid3x3, TrendingUp } from 'lucide-react';
import { fetchMitre } from '../api';
import { useSocket } from '../context/SocketContext';

export default function MitrePage() {
  const { mitreCounts, isConnected } = useSocket();
  const [techniques, setTechniques] = useState([]);

  useEffect(() => {
    fetchMitre().then(setTechniques).catch(() => {
      setTechniques([
        { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', count: 12, description: 'Adversaries may use brute force techniques to gain access.' },
        { id: 'T1071', name: 'Application Layer Protocol', tactic: 'Command and Control', count: 8, description: 'Adversaries may communicate using application layer protocols.' },
        { id: 'T1041', name: 'Exfiltration Over C2', tactic: 'Exfiltration', count: 6, description: 'Adversaries may steal data by exfiltrating over C2.' },
        { id: 'T1021', name: 'Remote Services', tactic: 'Lateral Movement', count: 3, description: 'Adversaries may use valid accounts to log into remote services.' },
        { id: 'T1078', name: 'Valid Accounts', tactic: 'Defense Evasion', count: 5, description: 'Adversaries may obtain and abuse credentials.' },
        { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', count: 2, description: 'Adversaries may encrypt data on target systems.' },
        { id: 'T1068', name: 'Privilege Escalation', tactic: 'Privilege Escalation', count: 4, description: 'Adversaries may exploit vulnerabilities to escalate privileges.' },
        { id: 'T1071.004', name: 'DNS', tactic: 'Command and Control', count: 7, description: 'Adversaries may communicate using DNS protocol.' },
        { id: 'T1059', name: 'Command Interpreter', tactic: 'Execution', count: 9, description: 'Adversaries may abuse command and script interpreters.' },
        { id: 'T1003', name: 'OS Credential Dumping', tactic: 'Credential Access', count: 3, description: 'Adversaries may attempt to dump credentials.' },
      ]);
    });
  }, []);

  // Update technique counts in real-time from WebSocket
  useEffect(() => {
    if (!mitreCounts || techniques.length === 0) return;
    setTechniques((prev) =>
      prev.map((tech) => ({
        ...tech,
        count: mitreCounts[tech.id] !== undefined ? mitreCounts[tech.id] : tech.count,
      }))
    );
  }, [mitreCounts]);

  const maxCount = Math.max(...techniques.map((t) => t.count), 1);

  return (
    <>
      <div className="alerts-page-header">
        <h2>
          <Grid3x3 size={24} color="var(--accent-purple)" /> MITRE ATT&CK Framework
          {isConnected && (
            <>
              <div className="live-dot-inline" />
              <span className="live-text-label">LIVE</span>
            </>
          )}
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          <TrendingUp size={12} style={{ verticalAlign: 'middle' }} /> Detection counts update in real-time
        </span>
      </div>

      <div className="mitre-grid">
        {techniques.map((tech) => (
          <div key={tech.id} className="mitre-card">
            <div className="mitre-id">{tech.id}</div>
            <div className="mitre-name">{tech.name}</div>
            <div className="mitre-tactic">{tech.tactic}</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
              {tech.description}
            </p>
            <div className="mitre-bar">
              <div
                className="mitre-bar-fill"
                style={{ width: `${(tech.count / maxCount) * 100}%`, transition: 'width 0.8s ease' }}
              />
            </div>
            <div className="mitre-count">{tech.count} detections this week</div>
          </div>
        ))}
      </div>
    </>
  );
}
