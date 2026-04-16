import { useState } from 'react';
import {
  BookOpen, Play, Shield, Eye, Lock, Activity, Radio,
  AlertTriangle, Zap, ShieldCheck, Server as ServerIcon, Globe,
  CheckCircle2, Clock, ArrowRight
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const playbooks = [
  {
    id: 'brute-force',
    title: 'Brute Force Response',
    description: 'Automated response to password brute force attacks targeting SSH, RDP, or web portals.',
    icon: Lock,
    color: '#ff5252',
    severity: 'HIGH',
    mitre: 'T1110',
    avgTime: '45s',
    successRate: '97%',
    steps: [
      { text: 'Block attacking IP at firewall', icon: Shield },
      { text: 'Check for successful authentications', icon: Eye },
      { text: 'Force password reset on targeted accounts', icon: Lock },
      { text: 'Review auth logs for lateral movement', icon: Activity },
      { text: 'Add IP to threat intelligence blocklist', icon: Globe },
    ],
  },
  {
    id: 'ransomware',
    title: 'Ransomware Containment',
    description: 'Isolate infected systems, stop encryption spread, and initiate backup recovery procedures.',
    icon: AlertTriangle,
    color: '#ff1744',
    severity: 'CRITICAL',
    mitre: 'T1486',
    avgTime: '2m 30s',
    successRate: '91%',
    steps: [
      { text: 'Isolate infected endpoints from network', icon: ServerIcon },
      { text: 'Kill malicious processes and services', icon: Zap },
      { text: 'Scan for lateral spread indicators', icon: Eye },
      { text: 'Verify backup integrity', icon: Shield },
      { text: 'Initiate system restoration', icon: CheckCircle2 },
    ],
  },
  {
    id: 'exfiltration',
    title: 'Data Exfiltration Response',
    description: 'Detect and block unauthorized data transfers, analyze scope of data loss, and contain breach.',
    icon: Globe,
    color: '#8b5cf6',
    severity: 'HIGH',
    mitre: 'T1041',
    avgTime: '1m 15s',
    successRate: '94%',
    steps: [
      { text: 'Block destination IP and domain', icon: Shield },
      { text: 'Terminate active data transfer sessions', icon: Zap },
      { text: 'Identify data types and volume transferred', icon: Eye },
      { text: 'Scan for DLP policy violations', icon: Activity },
      { text: 'Generate compliance incident report', icon: CheckCircle2 },
    ],
  },
  {
    id: 'c2-beacon',
    title: 'C2 Beacon Neutralization',
    description: 'Identify and neutralize command & control beacons, clean infected hosts, and block C2 infrastructure.',
    icon: Radio,
    color: '#ffab40',
    severity: 'MEDIUM',
    mitre: 'T1071',
    avgTime: '55s',
    successRate: '96%',
    steps: [
      { text: 'Identify beacon callback patterns', icon: Eye },
      { text: 'Block C2 domains and IPs at DNS/firewall', icon: Shield },
      { text: 'Isolate beaconing endpoint', icon: ServerIcon },
      { text: 'Run forensic analysis on infected host', icon: Activity },
      { text: 'Update YARA rules and IOC database', icon: CheckCircle2 },
    ],
  },
  {
    id: 'phishing',
    title: 'Phishing Incident Response',
    description: 'Respond to successful phishing attacks by securing compromised accounts and analyzing email campaigns.',
    icon: AlertTriangle,
    color: '#3b82f6',
    severity: 'MEDIUM',
    mitre: 'T1566',
    avgTime: '1m 40s',
    successRate: '93%',
    steps: [
      { text: 'Disable compromised user accounts', icon: Lock },
      { text: 'Purge phishing emails from all mailboxes', icon: Zap },
      { text: 'Block sender domain and URLs', icon: Shield },
      { text: 'Reset credentials and enable MFA', icon: Lock },
      { text: 'Brief users with awareness alert', icon: CheckCircle2 },
    ],
  },
  {
    id: 'privilege-escalation',
    title: 'Privilege Escalation Response',
    description: 'Contain and remediate unauthorized privilege escalation through kernel or service exploits.',
    icon: Zap,
    color: '#10b981',
    severity: 'HIGH',
    mitre: 'T1068',
    avgTime: '1m 05s',
    successRate: '95%',
    steps: [
      { text: 'Revoke escalated privileges immediately', icon: Lock },
      { text: 'Isolate compromised system', icon: ServerIcon },
      { text: 'Analyze exploit vector and patch', icon: Eye },
      { text: 'Audit recent actions by escalated account', icon: Activity },
      { text: 'Deploy emergency security patch', icon: Shield },
    ],
  },
];

export default function PlaybooksPage() {
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);
  const [runningPlaybook, setRunningPlaybook] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const { isConnected } = useSocket();

  const handleExecute = (playbook) => {
    setSelectedPlaybook(playbook);
    setRunningPlaybook(playbook.id);
    setCompletedSteps([]);
    setCurrentStep(0);

    playbook.steps.forEach((_, i) => {
      setTimeout(() => {
        setCurrentStep(i);
        setCompletedSteps((prev) => [...prev, i]);
        if (i === playbook.steps.length - 1) {
          setTimeout(() => setRunningPlaybook(null), 800);
        }
      }, (i + 1) * 1200);
    });
  };

  return (
    <>
      <div className="alerts-page-header">
        <h2>
          <BookOpen size={24} color="var(--accent-orange)" /> Response Playbooks
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={`ws-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            <div className="ws-dot" />
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {playbooks.length} playbooks available
          </span>
        </div>
      </div>

      <div className="playbook-layout">
        {/* Playbook Cards Grid */}
        <div className="playbook-grid">
          {playbooks.map((pb) => {
            const Icon = pb.icon;
            const isRunning = runningPlaybook === pb.id;
            const isComplete = selectedPlaybook?.id === pb.id && !runningPlaybook && completedSteps.length > 0;

            return (
              <div key={pb.id} className={`playbook-card ${isRunning ? 'running' : ''} ${isComplete ? 'complete' : ''}`}>
                <div className="pb-header">
                  <div className="pb-icon" style={{ background: `${pb.color}15`, color: pb.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="pb-header-info">
                    <h3>{pb.title}</h3>
                    <div className="pb-meta">
                      <span className={`severity-badge ${pb.severity.toLowerCase()}`}>{pb.severity}</span>
                      <span className="pb-mitre">{pb.mitre}</span>
                    </div>
                  </div>
                </div>

                <p className="pb-desc">{pb.description}</p>

                <div className="pb-stats">
                  <div className="pb-stat">
                    <Clock size={12} />
                    <span>{pb.avgTime}</span>
                  </div>
                  <div className="pb-stat">
                    <CheckCircle2 size={12} />
                    <span>{pb.successRate}</span>
                  </div>
                  <div className="pb-stat">
                    <ArrowRight size={12} />
                    <span>{pb.steps.length} steps</span>
                  </div>
                </div>

                {/* Steps Preview */}
                <div className="pb-steps-preview">
                  {pb.steps.map((step, i) => {
                    const StepIcon = step.icon;
                    const isStepComplete = selectedPlaybook?.id === pb.id && completedSteps.includes(i);
                    const isStepCurrent = selectedPlaybook?.id === pb.id && currentStep === i && isRunning;

                    return (
                      <div key={i} className={`pb-step ${isStepComplete ? 'done' : ''} ${isStepCurrent ? 'current' : ''}`}>
                        <div className="pb-step-num">
                          {isStepComplete ? <CheckCircle2 size={14} /> : (i + 1)}
                        </div>
                        <StepIcon size={12} className="pb-step-icon" />
                        <span>{step.text}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  className={`pb-execute-btn ${isRunning ? 'running' : ''} ${isComplete ? 'complete' : ''}`}
                  onClick={() => handleExecute(pb)}
                  disabled={runningPlaybook !== null}
                >
                  {isRunning ? (
                    <><div className="spinner" /> Executing...</>
                  ) : isComplete ? (
                    <><ShieldCheck size={16} /> Completed</>
                  ) : (
                    <><Play size={16} /> Execute Playbook</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
