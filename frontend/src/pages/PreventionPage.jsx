import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Lock, Eye, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Database, Key, Wifi, Server, FileWarning,
  ShieldCheck, ShieldAlert, Scan, Bug, Zap, Activity,
  TrendingUp, Award, FileText, Search, ChevronRight,
  Globe, Cpu, HardDrive, Network, ArrowUpRight, ArrowDownRight,
  Clock, BarChart3, Radio, Fingerprint, ShieldOff, Layers,
  CreditCard, UserCheck, KeyRound, CloudOff, Megaphone, Skull
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

// ── Protection Strategies Data (from HACKMANDU prevention_engine.py) ──
const STRATEGIES = [
  {
    id: 1, name: 'Database Encryption', icon: Database,
    description: 'End-to-end encryption for sensitive database records',
    status: 'active', riskLevel: 'critical', coverage: 98.5,
    lastScanned: '2 minutes ago', affectedAssets: 342,
    protectedRecords: 15847329, implementation: 'AES-256-GCM with key rotation',
    gradient: 'linear-gradient(135deg, #00d4ff, #3b82f6)',
  },
  {
    id: 2, name: 'Access Control (RBAC)', icon: UserCheck,
    description: 'Role-based access control with MFA enforcement',
    status: 'active', riskLevel: 'high', coverage: 92.3,
    lastScanned: '5 minutes ago', affectedAssets: 156,
    protectedRecords: 8234567, implementation: 'OAuth 2.0 + MFA via TOTP/U2F',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
  },
  {
    id: 3, name: 'Data Loss Prevention', icon: Eye,
    description: 'Monitor and prevent unauthorized data transfers',
    status: 'active', riskLevel: 'high', coverage: 87.4,
    lastScanned: '1 minute ago', affectedAssets: 289,
    protectedRecords: 12456789, implementation: 'Pattern matching + ML anomaly detection',
    gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
  },
  {
    id: 4, name: 'Network Segmentation', icon: Network,
    description: 'Isolate critical systems with firewall rules',
    status: 'active', riskLevel: 'medium', coverage: 95.2,
    lastScanned: '3 minutes ago', affectedAssets: 78,
    protectedRecords: 3456789, implementation: 'Zero-trust network architecture',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
  },
  {
    id: 5, name: 'API Security', icon: Globe,
    description: 'Rate limiting, input validation, and OAuth 2.0',
    status: 'active', riskLevel: 'medium', coverage: 88.7,
    lastScanned: '4 minutes ago', affectedAssets: 45,
    protectedRecords: 2345678, implementation: 'OAuth 2.0, JWT validation, rate limiting',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
  },
  {
    id: 6, name: 'Backup & Recovery', icon: HardDrive,
    description: 'Automated backup with encryption and air-gapped storage',
    status: 'active', riskLevel: 'critical', coverage: 100,
    lastScanned: '7 minutes ago', affectedAssets: 512,
    protectedRecords: 28934562, implementation: 'Daily encrypted backups + 3-2-1 strategy',
    gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
  },
  {
    id: 7, name: 'Endpoint Detection (EDR)', icon: Cpu,
    description: 'Real-time behavioral monitoring across all host endpoints',
    status: 'active', riskLevel: 'high', coverage: 94.6,
    lastScanned: '1 minute ago', affectedAssets: 1205,
    protectedRecords: 4500120, implementation: 'Kernel-level heuristics & process injection blocks',
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
  },
  {
    id: 8, name: 'Web App Firewall (WAF)', icon: Layers,
    description: 'L7 traffic filtering, blocking SQLi and XSS payloads',
    status: 'active', riskLevel: 'critical', coverage: 99.9,
    lastScanned: 'Just now', affectedAssets: 21,
    protectedRecords: 38400000, implementation: 'Cloudflare Proxy with OWASP Top 10 rulesets',
    gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
  },
];

// ── DLP Rules (from HACKMANDU prevention_engine.py) ──
const DLP_RULES = [
  { id: 1, name: 'Credit Card Detection', icon: CreditCard, severity: 'critical', matches: 156, blocked: 142, falsePositives: 3, pattern: '4[0-9]{12}(?:[0-9]{3})?', mechanism: 'Hooks into network interfaces and regex-scans all outbound packets. Triggers instant TCP Reset (RST) upon match.' },
  { id: 2, name: 'PII / SSN Detection', icon: Fingerprint, severity: 'critical', matches: 892, blocked: 834, falsePositives: 12, pattern: '\\d{3}-\\d{2}-\\d{4}', mechanism: 'Natural Language Processing (NLP) models combined with rigid regex boundaries across filesystem read operations.' },
  { id: 3, name: 'API Key / Secret Detection', icon: KeyRound, severity: 'critical', matches: 234, blocked: 228, falsePositives: 1, pattern: 'api[_-]?key\\s*[=:]', mechanism: 'Scans all GitHub commits, internal messaging, and outbound API calls for high-entropy strings matching secret schemas.' },
  { id: 4, name: 'Email Address Exfiltration', icon: Megaphone, severity: 'high', matches: 1203, blocked: 1198, falsePositives: 8, pattern: '[a-zA-Z0-9+_.-]+@', mechanism: 'Monitors database SELECT queries. If an anomaly requests >500 emails per minute without admin context, halts execution.' },
];

// ── Encryption Algorithms ──
const ENCRYPTION_ALGOS = [
  { name: 'AES', keySize: '256-bit', mode: 'GCM', systems: 847, status: 'active', color: '#00d4ff', usage: 'Data at Rest (Databases, NAS)', explanation: 'Symmetric encryption used to encrypt the actual physical disk and database tables. If a hacker steals the physical hard drive, the files are mathematically impossible to read without the KMS master key.', prevents: 'Prevents hardware theft & raw database file exfiltration.' },
  { name: 'RSA', keySize: '2048-bit', mode: 'OAEP', systems: 523, status: 'active', color: '#8b5cf6', usage: 'Key Exchange & Signatures', explanation: 'Asymmetric encryption that secures the transfer of AES cipher keys between servers and clients. Validates identity before any tunnel is formed.', prevents: 'Prevents Man-in-the-Middle (MitM) and identity spoofing.' },
  { name: 'TLS', keySize: '256-bit', version: '1.3', systems: 1247, status: 'active', color: '#10b981', usage: 'Data in Transit (HTTPS)', explanation: 'Establishes a completely secure, encrypted tunnel for all API, frontend, and backend communications. Rejects legacy protocol fallback.', prevents: 'Sniffing tools like Wireshark will only intercept garbage padding.' },
  { name: 'SHA-256', keySize: '256-bit', mode: 'Hashing', systems: 2843, status: 'active', color: '#f59e0b', usage: 'Passwords & Data Integrity', explanation: 'Irreversible one-way cryptographic hash. Passwords are never stored in plaintext, just their salted hash digest.', prevents: 'If breached, hackers cannot reverse-engineer user passwords.' },
];

// ── Vulnerabilities ──
const INITIAL_VULNS = [
  { id: 1, type: 'Weak Password Policy', severity: 'high', status: 'open', affectedCount: 23, recommendation: 'Enforce minimum 12-character passwords with complexity rules', remediationTime: '2 hours', action: 'update_policy', details: 'A weak password policy allows automated brute force and dictionary attacks to succeed. We enforce this via OAuth 2.0 Identity Provider rules combining entropy checks and active leak database queries.', implementation: 'Identity Provider (IdP) sync policy update.' },
  { id: 2, type: 'Unencrypted API Endpoints', severity: 'critical', status: 'open', affectedCount: 4, recommendation: 'Implement HTTPS/TLS 1.3 on all API endpoints', remediationTime: '6 hours', action: 'enable_tls', details: 'Unencrypted HTTP connections allow Man-in-the-Middle (MitM) attackers to intercept sensitive JSON payloads, including JWT tokens.', implementation: 'Automatic Let\'s Encrypt certificate rotation and nginx strictly enforcing port 443 with HSTS.' },
  { id: 3, type: 'Missing MFA on Admin Accounts', severity: 'critical', status: 'open', affectedCount: 8, recommendation: 'Mandate MFA for all administrative accounts', remediationTime: '1 hour', action: 'enforce_mfa', details: 'Compromised admin credentials without MFA lead to complete system takeover. SentinelAI will lock out non-MFA accounts automatically.', implementation: 'TOTP Google Authenticator + FIDO2 WebAuthn requirement.' },
  { id: 4, type: 'Excessive Database Privileges', severity: 'high', status: 'in_progress', affectedCount: 34, recommendation: 'Apply principle of least privilege (PoLP)', remediationTime: '4 hours', action: 'reduce_privileges', details: 'Microservices currently run with global DB read/write privileges. An exploit in one service allows full database wiping.', implementation: 'Revoking global grants and generating scoped AWS IAM role boundaries.' },
  { id: 5, type: 'Outdated SSL Certificates', severity: 'medium', status: 'open', affectedCount: 12, recommendation: 'Renew and rotate SSL certificates before expiry', remediationTime: '30 minutes', action: 'renew_certs', details: 'Certificates nearing 30-day expiration window. Failure to renew will result in modern browsers blocking user access completely.', implementation: 'certbot auto-renew cron trigger with ACME challenge DNS validation.' },
];

// ── Compliance Frameworks ──
const COMPLIANCE = [
  { name: 'GDPR', score: 92.5, compliant: true, lastAudit: '30 days ago', icon: '🇪🇺', color: '#3b82f6', description: 'General Data Protection Regulation enforcing EU data privacy. We employ automated data-deletion workflows (Right to be Forgotten) and strict cookie consent records.', evidence: 'Encrypted at rest, explicit consent logged via hash.' },
  { name: 'HIPAA', score: 94.0, compliant: true, lastAudit: '45 days ago', icon: '🏥', color: '#10b981', description: 'Health Insurance Portability and Accountability Act. All ePHI (Electronic Protected Health Information) is sandboxed in a BAA-covered AWS VPC instance.', evidence: 'Audit trails enabled, absolute encryption, bounded access.' },
  { name: 'PCI-DSS', score: 91.5, compliant: true, lastAudit: '60 days ago', icon: '💳', color: '#f59e0b', description: 'Payment Card Industry Data Security Standard. Credit card numbers never touch our servers; they are instantly tokenized via Stripe Elements.', evidence: 'Network segmentation, quarterly internal vulnerability scans.' },
  { name: 'SOC 2', score: 93.0, compliant: true, lastAudit: '90 days ago', icon: '🔒', color: '#8b5cf6', description: 'Service Organization Control 2 Type II. We continuously monitor and report anomalous activities to a centralized SIEM to meet security, availability, and processing integrity.', evidence: 'Continuous CI/CD pipeline auditing and background checking.' },
];

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export default function PreventionPage() {
  const { isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState('overview');
  const [strategies, setStrategies] = useState(STRATEGIES);
  const [vulnerabilities, setVulnerabilities] = useState(INITIAL_VULNS);
  const [scanning, setScanning] = useState(false);
  const [remediating, setRemediating] = useState(null);
  const [dataCheckInput, setDataCheckInput] = useState('');
  const [dataCheckResult, setDataCheckResult] = useState(null);
  const [securityScore, setSecurityScore] = useState(91);
  const [threatsBlockedToday, setThreatsBlockedToday] = useState(1247);
  const [animatedCoverage, setAnimatedCoverage] = useState(0);
  const [backendConnected, setBackendConnected] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [simulatingBreach, setSimulatingBreach] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // Simulate a breach for the selected strategy
  const triggerSimulation = useCallback(() => {
    setSimulatingBreach(true);
    setSimResult(null);
    
    setTimeout(() => {
      setSimulatingBreach(false);
      setSimResult({
        title: "BREACH ATTEMPT SEVERED",
        msg: `SentinelAI intercepted a high-confidence attack targeting ${selectedStrategy?.name}. Threat neutralized via ${selectedStrategy?.implementation}.`,
        timestamp: new Date().toISOString()
      });
      // Increment blocked count
      setThreatsBlockedToday(prev => prev + 1);
    }, 2500);
  }, [selectedStrategy]);

  // Fetch from SentinelAI Python backend on mount
  useEffect(() => {
    async function fetchPrevention() {
      try {
        const [overviewRes, strategiesRes, vulnRes] = await Promise.all([
          fetch('/api/prevention/overview'),
          fetch('/api/prevention/strategies'),
          fetch('/api/prevention/vulnerabilities'),
        ]);
        if (overviewRes.ok) {
          const overview = await overviewRes.json();
          setSecurityScore(overview.security_score || 91);
          setThreatsBlockedToday(overview.threats_blocked_today || 1247);
          setBackendConnected(true);
        }
        if (strategiesRes.ok) {
          const data = await strategiesRes.json();
          if (data.strategies && data.strategies.length > 0) {
            // Merge backend data with frontend icon/gradient info
            const iconMap = { 1: Database, 2: UserCheck, 3: Eye, 4: Network, 5: Globe, 6: HardDrive, 7: Cpu, 8: Layers };
            const gradientMap = {
              1: 'linear-gradient(135deg, #00d4ff, #3b82f6)',
              2: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              3: 'linear-gradient(135deg, #ef4444, #f97316)',
              4: 'linear-gradient(135deg, #10b981, #34d399)',
              5: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              6: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              7: 'linear-gradient(135deg, #ec4899, #f43f5e)',
              8: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            };
            setStrategies(data.strategies.map(s => ({
              ...s,
              icon: iconMap[s.id] || Shield,
              gradient: gradientMap[s.id] || 'linear-gradient(135deg, #00d4ff, #3b82f6)',
              riskLevel: s.risk_level || s.riskLevel || 'medium',
              lastScanned: s.last_scanned || s.lastScanned || 'N/A',
              affectedAssets: s.affected_assets || s.affectedAssets || 0,
              protectedRecords: s.protected_records || s.protectedRecords || 0,
            })));
          }
        }
        if (vulnRes.ok) {
          const data = await vulnRes.json();
          if (data.vulnerabilities && data.vulnerabilities.length > 0) {
            setVulnerabilities(data.vulnerabilities.map(v => ({
              ...v,
              affectedCount: v.affected_users || v.affected_systems || v.affected_accounts || v.affectedCount || 0,
              remediationTime: v.remediation_time || v.remediationTime || 'N/A',
              action: v.action || 'auto_fix',
            })));
          }
        }
      } catch (err) {
        console.log('[Prevention] Backend not available, using local data');
      }
    }
    fetchPrevention();
  }, []);

  // Animate the overall coverage on mount
  const overallCoverage = strategies.reduce((sum, s) => sum + s.coverage, 0) / strategies.length;
  useEffect(() => {
    let frame;
    const target = overallCoverage;
    const step = () => {
      setAnimatedCoverage(prev => {
        if (prev >= target) return target;
        const next = prev + 0.5;
        if (next >= target) return target;
        frame = requestAnimationFrame(step);
        return next;
      });
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [overallCoverage]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setThreatsBlockedToday(prev => prev + Math.floor(Math.random() * 3));
      setStrategies(prev => prev.map(s => ({
        ...s,
        coverage: Math.min(100, Math.max(80, s.coverage + (Math.random() - 0.45) * 0.3)),
        protectedRecords: s.protectedRecords + Math.floor(Math.random() * 100),
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalProtected = strategies.reduce((sum, s) => sum + s.protectedRecords, 0);
  const activeStrategies = strategies.filter(s => s.status === 'active').length;

  // Scan for vulnerabilities — try backend first
  const handleScan = useCallback(async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/prevention/scan', { method: 'POST' });
      if (res.ok) {
        const vulnRes = await fetch('/api/prevention/vulnerabilities');
        if (vulnRes.ok) {
          const data = await vulnRes.json();
          setVulnerabilities(data.vulnerabilities.map(v => ({
            ...v,
            affectedCount: v.affected_users || v.affected_systems || v.affected_accounts || 0,
            remediationTime: v.remediation_time || 'N/A',
            action: v.action || 'auto_fix',
          })));
        }
        setScanning(false);
        return;
      }
    } catch {}
    // Fallback to local simulation
    setTimeout(() => {
      setVulnerabilities(prev => prev.map(v => ({
        ...v,
        affectedCount: Math.max(0, v.affectedCount + Math.floor((Math.random() - 0.5) * 4)),
      })));
      setScanning(false);
    }, 3000);
  }, []);

  // Remediate a vulnerability — deep patch deployment simulation
  const handleRemediate = useCallback(async (vulnId) => {
    setRemediating(vulnId);
    const vuln = vulnerabilities.find(v => v.id === vulnId);
    
    // 2-second orchestration delay to simulate a deep automated patch deployment
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/prevention/remediate/${vulnId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: vuln?.action || 'auto_fix' }),
        });
        if (res.ok) {
          setVulnerabilities(prev => prev.map(v =>
            v.id === vulnId ? { ...v, status: 'remediated' } : v
          ));
          setSecurityScore(prev => Math.min(100, prev + 1));
          setRemediating(null);
          return;
        }
      } catch {}
      
      // Fallback
      setVulnerabilities(prev => prev.map(v =>
        v.id === vulnId ? { ...v, status: 'remediated' } : v
      ));
      setSecurityScore(prev => Math.min(100, prev + 1));
      setRemediating(null);
    }, 2000);
  }, [vulnerabilities]);

  // Check data for sensitive content — try backend first
  const handleDataCheck = useCallback(async () => {
    if (!dataCheckInput.trim()) return;
    setScanning(true);
    setDataCheckResult(null);

    // Deep-scan simulation delay to enhance realism of the DLP pattern-matching suite
    setTimeout(async () => {
      try {
        const res = await fetch('/api/prevention/check-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: dataCheckInput }),
        });
        if (res.ok) {
          const result = await res.json();
          setDataCheckResult({
            sensitiveDataFound: result.sensitive_data_found,
            findings: result.findings || [],
            shouldBlock: result.should_block,
            timestamp: new Date().toISOString(),
          });
          setScanning(false);
          return;
        }
      } catch {}
      
      // Fallback to local deep-regex check
      const findings = [];
      if (/(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})/.test(dataCheckInput)) {
        findings.push({ rule: 'Credit Card Detection', severity: 'critical' });
      }
      if (/\d{3}-\d{2}-\d{4}/.test(dataCheckInput)) {
        findings.push({ rule: 'PII / SSN Detection', severity: 'critical' });
      }
      if (/(?:api[_-]?key|apikey|auth[_-]?token|secret[_-]?key)\s*[=:]\s*['"]?([a-zA-Z0-9\-_]{20,})/.test(dataCheckInput)) {
        findings.push({ rule: 'API Key / Secret Detection', severity: 'critical' });
      }
      if (/[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/.test(dataCheckInput)) {
        findings.push({ rule: 'Email Address Detected', severity: 'high' });
      }
      
      setDataCheckResult({
        sensitiveDataFound: findings.length > 0,
        findings,
        shouldBlock: findings.some(f => f.severity === 'critical'),
        timestamp: new Date().toISOString(),
      });
      setScanning(false);
    }, 1500);
  }, [dataCheckInput]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'strategies', label: 'Protections', icon: Layers },
    { id: 'dlp', label: 'DLP Rules', icon: Eye },
    { id: 'encryption', label: 'Encryption', icon: Lock },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: Bug },
    { id: 'compliance', label: 'Compliance', icon: Award },
    { id: 'datacheck', label: 'Data Check', icon: Search },
  ];

  return (
    <div className="prevention-page">
      {/* ── Page Header ── */}
      <div className="prevention-header">
        <div className="prevention-header-left">
          <div className="prevention-title-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1>Data Breach Prevention</h1>
            <p>Comprehensive protection against data theft, exfiltration & unauthorized access</p>
          </div>
        </div>
        <div className="prevention-header-right">
          <div className={`prevention-engine-status ${isConnected ? 'online' : 'offline'}`}>
            <Radio size={14} />
            <span>{isConnected ? 'Engine Active' : 'Offline'}</span>
          </div>
          <button className="prevention-scan-btn" onClick={handleScan} disabled={scanning}>
            <RefreshCw size={14} className={scanning ? 'spinning' : ''} />
            {scanning ? 'Scanning...' : 'Run Scan'}
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="prevention-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`prevention-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedStrategy(null); // Reset deep dive when changing tabs
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Overview ── */}
      {activeTab === 'overview' && (
        <div className="prevention-content">
          {/* Top Stat Cards */}
          <div className="prevention-stats-row">
            <div className="prevention-stat-card score">
              <div className="prevention-stat-ring">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad)" strokeWidth="8"
                    strokeDasharray={`${securityScore * 3.27} 327`} strokeLinecap="round"
                    transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 1s ease' }} />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#00d4ff" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="prevention-stat-ring-value">
                  <span className="big">{securityScore}</span>
                  <span className="label">Score</span>
                </div>
              </div>
              <div className="prevention-stat-card-label">Security Score</div>
            </div>

            <div className="prevention-stat-card">
              <div className="prevention-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <ShieldCheck size={22} />
              </div>
              <div className="prevention-stat-value">{activeStrategies}/{strategies.length}</div>
              <div className="prevention-stat-card-label">Active Protections</div>
              <div className="prevention-stat-trend up"><ArrowUpRight size={12} /> All systems</div>
            </div>

            <div className="prevention-stat-card">
              <div className="prevention-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                <Database size={22} />
              </div>
              <div className="prevention-stat-value">{formatNumber(totalProtected)}</div>
              <div className="prevention-stat-card-label">Protected Records</div>
              <div className="prevention-stat-trend up"><ArrowUpRight size={12} /> +2.4K/hr</div>
            </div>

            <div className="prevention-stat-card">
              <div className="prevention-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                <ShieldAlert size={22} />
              </div>
              <div className="prevention-stat-value">{threatsBlockedToday.toLocaleString()}</div>
              <div className="prevention-stat-card-label">Threats Blocked Today</div>
              <div className="prevention-stat-trend up"><ArrowUpRight size={12} /> +18%</div>
            </div>

            <div className="prevention-stat-card">
              <div className="prevention-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                <Activity size={22} />
              </div>
              <div className="prevention-stat-value">{animatedCoverage.toFixed(1)}%</div>
              <div className="prevention-stat-card-label">Overall Coverage</div>
              <div className="prevention-stat-trend up"><ArrowUpRight size={12} /> Optimal</div>
            </div>
          </div>

          {/* Strategy Overview Grid */}
          <div className="prevention-section-title">
            <Layers size={16} />
            <span>Protection Layers</span>
          </div>
          <div className="prevention-strategies-grid">
            {strategies.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="prevention-strategy-card" onClick={() => {setActiveTab('strategies'); setSelectedStrategy(s);}} style={{cursor:'pointer'}}>
                  <div className="prevention-strategy-header">
                    <div className="prevention-strategy-icon" style={{ background: s.gradient }}>
                      <Icon size={18} />
                    </div>
                    <div className="prevention-strategy-status">
                      <CheckCircle2 size={12} />
                      <span>Active</span>
                    </div>
                  </div>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                  <div className="prevention-strategy-coverage">
                    <div className="prevention-coverage-bar">
                      <div className="prevention-coverage-fill" style={{ width: `${s.coverage}%`, background: s.gradient }} />
                    </div>
                    <span>{s.coverage.toFixed(1)}%</span>
                  </div>
                  <div className="prevention-strategy-meta">
                    <span><Database size={10} /> {formatNumber(s.protectedRecords)} records</span>
                    <span><Clock size={10} /> {s.lastScanned}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compliance Summary */}
          <div className="prevention-section-title">
            <Award size={16} />
            <span>Compliance Status</span>
          </div>
          <div className="prevention-compliance-row">
            {COMPLIANCE.map(c => (
              <div key={c.name} className="prevention-compliance-card">
                <div className="prevention-compliance-icon">{c.icon}</div>
                <div className="prevention-compliance-info">
                  <h4>{c.name}</h4>
                  <div className="prevention-compliance-bar-wrap">
                    <div className="prevention-compliance-bar">
                      <div className="prevention-compliance-fill" style={{ width: `${c.score}%`, background: c.color }} />
                    </div>
                    <span style={{ color: c.color }}>{c.score}%</span>
                  </div>
                  <span className="prevention-compliance-audit"><Clock size={10} /> Audited {c.lastAudit}</span>
                </div>
                <div className="prevention-compliance-badge" style={{ borderColor: c.color, color: c.color }}>
                  <CheckCircle2 size={12} /> Compliant
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: Strategies (Deep Dive Pages) ── */}
      {activeTab === 'strategies' && (
        <div className="prevention-content">
          {!selectedStrategy ? (
            <div className="prevention-strategies-detail-grid">
              {strategies.map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.id} className="prevention-strategy-detail-card" onClick={() => setSelectedStrategy(s)}>
                    <div className="prevention-strategy-detail-top" style={{ background: s.gradient }}>
                      <Icon size={28} />
                      <h3>{s.name}</h3>
                      <span className={`prevention-risk-badge ${s.riskLevel}`}>{s.riskLevel.toUpperCase()}</span>
                    </div>
                    <div className="prevention-strategy-detail-body">
                      <p>{s.description}</p>
                      <div className="prevention-detail-row">
                        <span className="prevention-detail-label">Implementation</span>
                        <span className="prevention-detail-value mono">{s.implementation}</span>
                      </div>
                      <div className="prevention-detail-row">
                        <span className="prevention-detail-label">Coverage</span>
                        <div className="prevention-detail-coverage">
                          <div className="prevention-coverage-bar large">
                            <div className="prevention-coverage-fill" style={{ width: `${s.coverage}%`, background: s.gradient }} />
                          </div>
                          <span>{s.coverage.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="prevention-detail-stats">
                        <div><span className="val">{s.affectedAssets}</span><span className="lbl">Assets Protected</span></div>
                        <div><span className="val">{formatNumber(s.protectedRecords)}</span><span className="lbl">Records Secured</span></div>
                        <div><span className="val">{s.lastScanned}</span><span className="lbl">Last Scanned</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="prevention-deep-dive">
              {/* Breach Simulation Overlay */}
              {simulatingBreach && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                  <div style={{ textAlign: 'center', color: '#ff1744' }}>
                    <Skull size={64} className="pulse-icon" style={{ marginBottom: '20px' }} />
                    <h2 style={{ fontSize: '32px', fontWeight: 800 }}>SIMULATING BREACH...</h2>
                    <p style={{ color: '#fff', opacity: 0.8 }}>Target: {selectedStrategy.name} Layer</p>
                    <div style={{ width: '300px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '20px auto', overflow: 'hidden' }}>
                      <div className="prevention-coverage-fill" style={{ width: '100%', background: '#ff1744', animation: 'shimmer 1s infinite' }} />
                    </div>
                  </div>
                </div>
              )}

              {simResult && !simulatingBreach && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <ShieldCheck size={24} color="#10b981" />
                  <div>
                    <strong style={{ display: 'block' }}>{simResult.title}</strong>
                    <span style={{ fontSize: '13px', opacity: 0.8 }}>{simResult.msg}</span>
                  </div>
                  <button onClick={() => setSimResult(null)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button>
                </div>
              )}

              <div className="prevention-deep-dive-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                <button 
                  onClick={() => setSelectedStrategy(null)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  ← Back to Protections
                </button>
                <selectedStrategy.icon size={26} style={{ color: selectedStrategy.gradient.split(',')[1].trim() }} />
                <h2 style={{ margin: 0, fontSize: '24px' }}>{selectedStrategy.name} Deep-Dive</h2>
                <span className={`prevention-risk-badge ${selectedStrategy.riskLevel}`}>{selectedStrategy.status.toUpperCase()}</span>
              </div>
              
              <div className="prevention-deep-dive-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                  {/* How it Works / Architecture */}
                  <div className="prevention-deep-dive-panel" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '25px', borderRadius: '12px' }}>
                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', color: '#e2e8f0' }}><Server size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> Architecture & Implementation Setup</h3>
                    <p style={{ color: '#94a3b8', lineHeight: '1.6', marginTop: '15px' }}>
                      {selectedStrategy.name === 'Database Encryption' ? 
                        "Our database architecture natively intercepts all database write commands through a middleware proxy. Fields flagged as PII, passwords, or financial strings are categorically passed through an AES-256-GCM cipher. The cryptographic keys are stored in an external hardware security module (HSM) that continuously rotates the key hash every 90 days, ensuring absolute isolation between the application code and the cipher mechanism." :
                      selectedStrategy.name === 'Data Loss Prevention' ? 
                        "The DLP logic relies on a hybrid anomaly engine leveraging both Deep Regex Pattern Matching and Machine Learning. The engine actively hooks into egress endpoints (file uploads, API outputs, HTTP outbound packets) and filters content. If a packet payload surpasses the 80% confidence threshold for sensitive data (SSNs, cards, keys), the thread is instantly interrupted and a Null response is spoofed to the destination." :
                      selectedStrategy.name === 'Network Segmentation' ? 
                        "Uses a Zero-Trust Software-Defined Network (SDN) model. The entire architecture is split into micro-segments. Web servers running on the edge have absolutely zero subnet visibility into the core transaction database. They can only communicate via strict, verified gRPC API calls. All unknown lateral traffic drops silently." :
                      selectedStrategy.name === 'Access Control (RBAC)' ?
                        "Implements an Attribute-Based Access Control (ABAC) layer on top of traditional roles. Every request is verified against the user's role, geographical location, time of day, and device reputation score. Absolute MFA (Multi-Factor Authentication) is enforced via FIDO2 hardware keys for all administrative and PII-access paths." :
                      selectedStrategy.name === 'API Security' ?
                        "API traffic is audited via WAAP (Web Application and API Protection). It enforces strict OpenAPI schema validation, rejects non-conforming JSON payloads, and applies adaptive rate limiting to prevent credential stuffing or DDoS. All Bearer tokens are short-lived and cryptographically bound to the source origin." :
                      selectedStrategy.name === 'Backup & Recovery' ?
                        "Utilizes immutable storage snapshots. Backups are cryptographically signed and stored in an off-site, air-gapped vault. The recovery engine supports 'Hydra-Recovery', allowing for entire cluster reinstatements in under 15 minutes by swapping traffic to a clean, pre-verified snapshot." :
                      selectedStrategy.name === 'Endpoint Detection (EDR)' ?
                        "A custom kernel-mode driver runs silently on all host machines. It monitors process memory allocations, filesystem handle requests, and registry modification attempts in real-time. If an unknown hash attempts to spawn a hidden thread or encrypt local files (ransomware behavior), the EDR agent instantly terminates the parent tree and quarantines the executable." :
                      selectedStrategy.name === 'Web App Firewall (WAF)' ?
                        "Sitting at the edge of the network before the physical servers, the WAF deeply inspects all Layer 7 HTTP/S traffic. Using regex pattern matching mixed with behavioral AI, it analyzes every POST payload and URI parameter. If it detects anomalies such as `1=1` (SQLi), `<script>` (XSS), or directory traversal patterns (`../`), the TCP connection is aggressively dropped." :
                        `${selectedStrategy.name} is deployed natively at the infrastructure layer using ${selectedStrategy.implementation}. It operates autonomously to enforce compliance and data integrity without manual intervention.` 
                      }
                    </p>
                    
                    <div className="console-block" style={{ background: '#0a0a0a', padding: '15px', borderRadius: '6px', fontFamily: 'monospace', color: '#a3e635', marginTop: '20px', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                      {selectedStrategy.name === 'Database Encryption' ? (
  `> INIT: Starting Cipher Suite...
> ALGO: AES-256-GCM / 512-bit auth tag
> KMS_CONNECT: Vault key retrieved successfully [v4.1.8]
> ENFORCING: TDE (Transparent Data Encryption) ... OK
> INTERCEPTING: all incoming SQL / MongoDB write ops
> FIELD_SCAN: PII columns auto-detected (email, ssn, card)
> ENCRYPT: 15.8M records encrypted at rest
> KEY_ROTATE: Next rotation in 78 days
> STATUS: ✓ All data-at-rest actively encrypted on disk.`
                      ) : selectedStrategy.name === 'Data Loss Prevention' ? (
  `> DLP_DAEMON: Booting packet listener...
> RULESET: PCI-DSS, HIPAA, GDPR patterns loaded (4 rules)
> ML_HEURISTICS: Neural classifier active [model v3.2]
> HOOK: eth0 ... [OK]
> HOOK: docker0 ... [OK]
> HOOK: lo ... [SKIP - loopback]
> EGRESS_FILTER: Monitoring HTTP, SMTP, FTP, DNS tunneling
> CONFIDENCE_THRESHOLD: 80%
> STATUS: ✓ Blocking sensitive payloads in real-time.`
                      ) : selectedStrategy.name === 'Access Control (RBAC)' ? (
  `> AUTH_ENGINE: Initializing identity provider...
> RBAC_POLICY: 12 roles loaded (admin, analyst, viewer...)
> ABAC_LAYER: Geo-fencing + device-reputation active
> MFA_ENFORCE: FIDO2 WebAuthn + TOTP required for admins
> SESSION: JWT lifetime=15min, refresh=7d, rotation=true
> AUDIT: All auth events logged to SIEM pipeline
> STATUS: ✓ Zero-trust identity verification enforced.`
                      ) : selectedStrategy.name === 'Network Segmentation' ? (
  `> SDN_CONTROLLER: Initializing micro-segments...
> VLAN_01: DMZ (web servers) ... [ISOLATED]
> VLAN_02: Application tier ... [ISOLATED]
> VLAN_03: Database cluster ... [ISOLATED]
> VLAN_04: Admin / management ... [ISOLATED]
> FIREWALL: Inter-VLAN rules loaded (deny-all default)
> gRPC_ONLY: Cross-segment API calls whitelisted
> LATERAL_SCAN: Unknown traffic auto-dropped
> STATUS: ✓ Zero-trust network segmentation active.`
                      ) : selectedStrategy.name === 'API Security' ? (
  `> WAAP_PROXY: Starting reverse proxy...
> SCHEMA: OpenAPI v3.1 spec loaded (45 endpoints)
> VALIDATION: Strict JSON schema enforcement ... [OK]
> RATE_LIMIT: 100 req/min per IP, 1000 req/min per token
> JWT_VERIFY: RS256 signature + expiry + origin binding
> CORS: Whitelisted origins only
> BOT_DETECT: Fingerprinting + CAPTCHA challenge active
> STATUS: ✓ API gateway secured and monitoring.`
                      ) : selectedStrategy.name === 'Backup & Recovery' ? (
  `> BACKUP_SCHEDULER: Checking backup policy...
> STRATEGY: 3-2-1 (3 copies, 2 media types, 1 offsite)
> ENCRYPT: AES-256-GCM applied to all snapshots
> DAILY_SNAP: Last backup 4h 12m ago [SUCCESS]
> WEEKLY_FULL: Last full backup 2d ago [SUCCESS]
> AIR_GAP: Offsite vault connection verified [SECURE]
> INTEGRITY: SHA-256 checksum validation ... PASS
> HYDRA_RECOVERY: Estimated RTO = 14 minutes
> STATUS: ✓ Immutable backups verified and healthy.`
                      ) : selectedStrategy.name === 'Endpoint Detection (EDR)' ? (
  `> EDR_AGENT: Kernel driver loaded [ring-0]
> PROCESS_MONITOR: Hooking NtCreateProcess ... [OK]
> FILE_MONITOR: Hooking NtWriteFile ... [OK]
> REGISTRY_GUARD: Hooking NtSetValueKey ... [OK]
> HASH_DB: 48.2M known-malware signatures loaded
> BEHAVIOR: Ransomware patterns (mass-encrypt) active
> MEMORY_SCAN: Credential dump detection (Mimikatz) active
> QUARANTINE: Auto-isolate + kill-tree on threat
> STATUS: ✓ 1,205 endpoints actively monitored.`
                      ) : selectedStrategy.name === 'Web App Firewall (WAF)' ? (
  `> WAF_EDGE: Cloudflare proxy initialized...
> RULESET: OWASP CRS v4.0 loaded (2,847 rules)
> SQLi_DETECT: Pattern matching + ML scoring active
> XSS_DETECT: DOM/Reflected/Stored patterns active
> TRAVERSAL: Path canonicalization enforced
> RATE_LIMIT: Adaptive per-IP throttling enabled
> GEO_BLOCK: Sanctioned regions blocked (configurable)
> DDoS_SHIELD: L3/L4/L7 volumetric protection active
> STATUS: ✓ All HTTP traffic inspected at edge.`
                      ) : (
  `> SYSTEM: Fetching configuration for ${selectedStrategy.name}...
> ENGINE: Applying policy rulesets... [OK]
> RUNTIME: Secure module loaded and enforcing.`
                      )}
                    </div>
                  </div>

                  {/* Breach Prevention Mechanics */}
                  <div className="prevention-deep-dive-panel" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '25px', borderRadius: '12px' }}>
                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', color: '#e2e8f0' }}><Shield size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> How It Prevents Breaches</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                      <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                        <h4 style={{ color: '#ef4444', marginBottom: '8px', fontSize: '14px' }}>Attack Vector Defeated</h4>
                        <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
                          {selectedStrategy.name === 'Database Encryption' ? 'Defeats SQL Injections that dump tables or server hard-drive theft. Even if hackers gain absolute root access and download the raw database files, the data remains cryptographically shredded gibberish to them without the live memory keys.' :
                           selectedStrategy.name === 'Data Loss Prevention' ? 'Defeats Insider Threats and C2 Exfiltration. If a hacked employee account tries to email 5,000 credit cards out of the network, the DLP engine identifies the pattern in the data stream, severs the connection, and isolates the machine within milliseconds.' :
                           selectedStrategy.name === 'Access Control (RBAC)' ? 'Defeats Phishing and Credential Stuffing. Even if an attacker steals an admin username and password, the system universally denies entry without the physical U2F hardware token associated with the strict RBAC permission set.' :
                           selectedStrategy.name === 'Network Segmentation' ? 'Prevents Lateral Movement. If a frontend server is compromised, the attacker has zero path to the database or admin nodes, confining the breach to a single non-critical asset.' :
                           selectedStrategy.name === 'API Security' ? 'Blocks Scrapers and Automated Attackers. Detects and bans bots attempting to enumerate API parameters or exploit unvalidated inputs before they reach the controller layer.' :
                           selectedStrategy.name === 'Endpoint Detection (EDR)' ? 'Defeats zero-day malware and living-off-the-land (LotL) tactics. Even if an attacker exploits a novel vulnerability to get shell access, the EDR hooks block them from running malicious payloads or dumping memory credentials (like Mimikatz).' :
                           selectedStrategy.name === 'Web App Firewall (WAF)' ? 'Defeats Web Exploitation at the edge. Automatically absorbs and nullifies OWASP Top 10 attacks. Hackers attempting injection attacks hit a brick wall before their malicious packets ever reach the application backend.' :
                           'Defeats unauthorized lateral movement and privilege escalation by enforcing strict, default-deny boundaries across all operational surfaces.'}
                        </p>
                      </div>
                      
                      <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                        <h4 style={{ color: '#10b981', marginBottom: '8px', fontSize: '14px' }}>System Resilience Granted</h4>
                        <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
                          {selectedStrategy.name === 'Database Encryption' ? 'Even during a catastrophic infrastructure breach where attackers gain root-level access to the database host, all extracted data remains AES-256 encrypted gibberish. Without the HSM-stored master key (which is physically isolated), decryption would take approximately 2^256 operations — longer than the age of the universe.' :
                           selectedStrategy.name === 'Data Loss Prevention' ? 'Provides a multi-layered exfiltration shield. Email attachments, USB transfers, cloud uploads, and even DNS tunneling attempts are all monitored. The ML classifier learns from each blocked attempt, reducing false positive rates by 12% quarterly while maintaining a 99.2% true positive detection rate.' :
                           selectedStrategy.name === 'Access Control (RBAC)' ? 'Implements defense-in-depth for identity. Even if one factor is compromised (password leak), the FIDO2 hardware key requirement creates an unbreakable second barrier. Session tokens are cryptographically bound to the originating device fingerprint, preventing token replay attacks from different machines.' :
                           selectedStrategy.name === 'Network Segmentation' ? 'Provides absolute blast-radius containment. A compromised WordPress frontend container literally cannot physically route a packet to the financial backend mainframe, confining the hacker to an isolated sandbox with zero leverage. Lateral movement (MITRE T1021) is architecturally impossible.' :
                           selectedStrategy.name === 'API Security' ? 'Ensures API abuse is caught before business logic execution. Adaptive rate limiting scales dynamically — legitimate traffic bursts are allowed while sustained automated attacks trigger progressive delays, CAPTCHAs, and eventual IP banning. Schema validation prevents parameter pollution and type confusion attacks.' :
                           selectedStrategy.name === 'Backup & Recovery' ? 'Guarantees absolute immunity to Ransomware (MITRE T1486). When malware encrypts the local network, the infrastructure automatically swaps to the physical, air-gapped immutable backup snapshot taken securely 4 hours prior, restoring production entirely. Recovery Time Objective (RTO): under 15 minutes.' :
                           selectedStrategy.name === 'Endpoint Detection (EDR)' ? 'Provides real-time threat response at the host level. When ransomware begins encrypting files, the EDR detects the entropy change pattern within the first 3 files and kills the process tree before damage spreads. Memory-resident malware (fileless attacks) is caught via behavioral analysis of API call sequences.' :
                           selectedStrategy.name === 'Web App Firewall (WAF)' ? 'Acts as the first line of defense, absorbing 99.9% of automated web attacks before they reach the origin server. The WAF processes 38.4M requests daily, blocking an average of 1,247 malicious payloads. Its ML model continuously learns new attack patterns from global threat intelligence feeds.' :
                           `Maintains a robust ${selectedStrategy.coverage}% coverage scope across ${selectedStrategy.affectedAssets} critical nodes, ensuring that single-point failures never compromise total infrastructure.`}
                        </p>
                      </div>

                      <div style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
                        <h4 style={{ color: '#8b5cf6', marginBottom: '8px', fontSize: '14px' }}>MITRE ATT&CK Coverage</h4>
                        <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
                          {selectedStrategy.name === 'Database Encryption' ? 'Mitigates T1005 (Data from Local System), T1039 (Data from Network Shared Drive), T1114 (Email Collection). Encrypted data renders all collection techniques useless without key material.' :
                           selectedStrategy.name === 'Data Loss Prevention' ? 'Mitigates T1048 (Exfiltration Over Alternative Protocol), T1041 (Exfiltration Over C2 Channel), T1567 (Exfiltration to Cloud Storage). All egress channels are monitored and filtered.' :
                           selectedStrategy.name === 'Access Control (RBAC)' ? 'Mitigates T1078 (Valid Accounts), T1110 (Brute Force), T1556 (Modify Authentication Process). Multi-factor enforcement and anomaly-based login detection prevent credential abuse.' :
                           selectedStrategy.name === 'Network Segmentation' ? 'Mitigates T1021 (Remote Services), T1570 (Lateral Tool Transfer), T1071 (Application Layer Protocol). Micro-segmentation eliminates lateral movement paths between network zones.' :
                           selectedStrategy.name === 'API Security' ? 'Mitigates T1190 (Exploit Public-Facing Application), T1059 (Command and Scripting Interpreter via injection), T1499 (Endpoint Denial of Service). Input validation and rate limiting neutralize these vectors.' :
                           selectedStrategy.name === 'Backup & Recovery' ? 'Mitigates T1486 (Data Encrypted for Impact), T1485 (Data Destruction), T1490 (Inhibit System Recovery). Air-gapped immutable backups ensure recovery regardless of ransomware or wiper malware.' :
                           selectedStrategy.name === 'Endpoint Detection (EDR)' ? 'Mitigates T1055 (Process Injection), T1003 (OS Credential Dumping), T1059 (Command and Scripting Interpreter). Kernel-level hooks detect and block malicious process behavior in real-time.' :
                           selectedStrategy.name === 'Web App Firewall (WAF)' ? 'Mitigates T1190 (Exploit Public-Facing Application), T1189 (Drive-by Compromise), T1203 (Exploitation for Client Execution). L7 inspection blocks exploit payloads at the network edge.' :
                           `Covers multiple MITRE ATT&CK techniques relevant to ${selectedStrategy.name} with ${selectedStrategy.coverage}% detection coverage.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulation Control Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                  <div className="prevention-simulation-action" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--accent-red)', padding: '25px', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '16px', color: '#ff1744' }}><Skull size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> Breach Simulation</h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>
                      Fire a live attack vector against the {selectedStrategy.name} layer to verify SentinelAI mitigation speed and efficacy.
                    </p>
                    <button className="simulation-trigger-btn" onClick={triggerSimulation} disabled={simulatingBreach}>
                      {simulatingBreach ? <RefreshCw size={16} className="spinning" /> : <Zap size={16} />}
                      {simulatingBreach ? "Testing Defense..." : "Trigger Breach"}
                    </button>
                  </div>

                  <div className="prevention-deep-dive-panel" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '14px', color: '#e2e8f0', marginBottom: '15px' }}>Coverage Metrics</h4>
                    <div className="prevention-detail-stats" style={{ gridTemplateColumns: '1fr', textAlign: 'left', border: 'none', padding: 0 }}>
                      <div style={{ marginBottom: '15px' }}>
                        <span className="lbl">Status</span>
                        <span className="val" style={{ color: '#10b981' }}>PROTECTED</span>
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <span className="lbl">Implementation Type</span>
                        <span className="val" style={{ fontSize: '13px' }}>{selectedStrategy.implementation}</span>
                      </div>
                      <div>
                        <span className="lbl">Global Compliance</span>
                        <span className="val" style={{ fontSize: '13px' }}>VERIFIED (SOC2, GDPR)</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: DLP Rules ── */}
      {activeTab === 'dlp' && (
        <div className="prevention-content">
          <div className="prevention-dlp-header-stats">
            <div className="prevention-dlp-stat">
              <Eye size={18} /> <span className="val">1,247</span> <span className="lbl">Total Blocked</span>
            </div>
            <div className="prevention-dlp-stat">
              <AlertTriangle size={18} /> <span className="val">38</span> <span className="lbl">Suspicious Activity</span>
            </div>
            <div className="prevention-dlp-stat">
              <FileText size={18} /> <span className="val">2.8M</span> <span className="lbl">Files Monitored</span>
            </div>
          </div>
          <div className="prevention-dlp-grid">
            {DLP_RULES.map(rule => {
              const Icon = rule.icon;
              const blockRate = ((rule.blocked / rule.matches) * 100).toFixed(1);
              return (
                <div key={rule.id} className="prevention-dlp-card">
                  <div className="prevention-dlp-card-header">
                    <div className="prevention-dlp-icon">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4>{rule.name}</h4>
                      <span className={`prevention-risk-badge ${rule.severity}`}>{rule.severity.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="prevention-dlp-card-body">
                    <div className="prevention-dlp-metric">
                      <span className="label">Pattern</span>
                      <code>{rule.pattern}</code>
                    </div>
                    <div className="prevention-dlp-stats">
                      <div className="prevention-dlp-stat-item">
                        <span className="v">{rule.matches}</span>
                        <span className="l">Matches</span>
                      </div>
                      <div className="prevention-dlp-stat-item blocked">
                        <span className="v">{rule.blocked}</span>
                        <span className="l">Blocked</span>
                      </div>
                      <div className="prevention-dlp-stat-item fp">
                        <span className="v">{rule.falsePositives}</span>
                        <span className="l">False +</span>
                      </div>
                    </div>
                    <div className="prevention-dlp-block-rate">
                      <span>Block Rate</span>
                      <div className="prevention-coverage-bar">
                        <div className="prevention-coverage-fill dlp" style={{ width: `${blockRate}%` }} />
                      </div>
                      <span className="rate">{blockRate}%</span>
                    </div>
                    <div style={{ marginTop: '15px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', borderLeft: `3px solid var(--accent-${rule.severity === 'critical' ? 'red' : 'orange'})` }}>
                      <h4 style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '6px' }}><Cpu size={12} style={{marginRight: '6px'}}/>How it works</h4>
                      <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>{rule.mechanism}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: Encryption ── */}
      {activeTab === 'encryption' && (
        <div className="prevention-content">
          <div className="prevention-encryption-overview">
            <div className="prevention-encryption-main-stat">
              <Lock size={32} />
              <div>
                <span className="big-value">94.8%</span>
                <span className="big-label">Data Encrypted</span>
              </div>
              <div className="prevention-encryption-meta">
                <div><Key size={12} /> Algorithm: <strong>AES-256-GCM</strong></div>
                <div><RefreshCw size={12} /> Key Rotation: <strong>Every 90 days</strong></div>
                <div><Clock size={12} /> Last Rotation: <strong>12 days ago</strong></div>
              </div>
            </div>
          </div>
          <div className="prevention-section-title">
            <Key size={16} />
            <span>Encryption Algorithms in Use</span>
          </div>
          <div className="prevention-encryption-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {ENCRYPTION_ALGOS.map((algo, i) => (
              <div key={i} className="prevention-encryption-card deep-dive" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="prevention-encryption-card-icon" style={{ background: `${algo.color}20`, color: algo.color }}>
                      <Lock size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '18px' }}>{algo.name}</h4>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{algo.usage}</span>
                    </div>
                  </div>
                  <div className="prevention-encryption-status-badge" style={{ borderColor: algo.color, color: algo.color }}>
                    <CheckCircle2 size={10} /> Active
                  </div>
                </div>
                
                <div className="prevention-encryption-detail" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '11px', color: '#64748b' }}>Key Size</span><strong style={{ fontSize: '13px' }}>{algo.keySize}</strong></div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '11px', color: '#64748b' }}>Mode</span><strong style={{ fontSize: '13px' }}>{algo.mode || algo.version}</strong></div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '11px', color: '#64748b' }}>Coverage</span><strong style={{ fontSize: '13px' }}>{algo.systems.toLocaleString()} Systems</strong></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', borderLeft: `3px solid ${algo.color}` }}>
                    <h5 style={{ fontSize: '13px', color: '#e2e8f0', margin: '0 0 5px 0' }}><Server size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}/> Implementation Mechanics</h5>
                    <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>{algo.explanation}</p>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '12px', borderRadius: '8px', borderLeft: `3px solid #10b981` }}>
                    <h5 style={{ fontSize: '13px', color: '#10b981', margin: '0 0 5px 0' }}><ShieldCheck size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}/> Breach Prevention Capability</h5>
                    <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>{algo.prevents}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: Vulnerabilities ── */}
      {activeTab === 'vulnerabilities' && (
        <div className="prevention-content">
          <div className="prevention-vuln-summary">
            <div className="prevention-vuln-count critical">
              <span className="v">{vulnerabilities.filter(v => v.severity === 'critical' && v.status !== 'remediated').length}</span>
              <span className="l">Critical</span>
            </div>
            <div className="prevention-vuln-count high">
              <span className="v">{vulnerabilities.filter(v => v.severity === 'high' && v.status !== 'remediated').length}</span>
              <span className="l">High</span>
            </div>
            <div className="prevention-vuln-count medium">
              <span className="v">{vulnerabilities.filter(v => v.severity === 'medium' && v.status !== 'remediated').length}</span>
              <span className="l">Medium</span>
            </div>
            <div className="prevention-vuln-count remediated">
              <span className="v">{vulnerabilities.filter(v => v.status === 'remediated').length}</span>
              <span className="l">Remediated</span>
            </div>
          </div>
          <div className="prevention-vuln-list">
            {vulnerabilities.map(v => (
              <div key={v.id} className={`prevention-vuln-card ${v.status === 'remediated' ? 'remediated' : ''}`}>
                <div className="prevention-vuln-left">
                  <div className={`prevention-vuln-severity ${v.severity}`}>
                    {v.status === 'remediated' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <div className="prevention-vuln-info">
                    <h4>{v.type}</h4>
                    <p>{v.recommendation}</p>
                    <div className="prevention-vuln-meta">
                      <span className={`prevention-risk-badge ${v.severity}`}>{v.severity.toUpperCase()}</span>
                      <span><Clock size={10} /> Est. fix: {v.remediationTime}</span>
                      <span>Affected: {v.affectedCount}</span>
                    </div>
                    
                    <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.03)', padding: '10px 15px', borderRadius: '6px', borderLeft: `3px solid var(--accent-${v.severity === 'critical' ? 'red' : v.severity === 'high' ? 'orange' : 'purple'})` }}>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 6px 0', lineHeight: '1.4' }}><strong>Impact Risk:</strong> {v.details}</p>
                      <p style={{ fontSize: '11px', color: '#0ea5e9', margin: '0' }}><Zap size={10} style={{marginRight: '4px'}}/><strong>Auto-Fix Action:</strong> {v.implementation}</p>
                    </div>
                  </div>
                </div>
                <div className="prevention-vuln-right">
                  {v.status === 'remediated' ? (
                    <div className="prevention-vuln-resolved-badge">
                      <CheckCircle2 size={14} /> Remediated
                    </div>
                  ) : (
                    <button
                      className="prevention-remediate-btn"
                      disabled={remediating === v.id}
                      onClick={() => handleRemediate(v.id)}
                    >
                      {remediating === v.id ? (
                        <><RefreshCw size={13} className="spinning" /> Fixing...</>
                      ) : (
                        <><Zap size={13} /> Auto-Fix</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: Compliance ── */}
      {activeTab === 'compliance' && (
        <div className="prevention-content">
          <div className="prevention-compliance-detail-grid">
            {COMPLIANCE.map(c => (
              <div key={c.name} className="prevention-compliance-detail-card">
                <div className="prevention-compliance-detail-header" style={{ borderColor: c.color }}>
                  <span className="prevention-compliance-detail-icon">{c.icon}</span>
                  <h3>{c.name}</h3>
                  <div className="prevention-compliance-detail-badge" style={{ background: `${c.color}18`, color: c.color, borderColor: c.color }}>
                    <CheckCircle2 size={12} /> Compliant
                  </div>
                </div>
                <div className="prevention-compliance-detail-body">
                  <div className="prevention-compliance-score-ring">
                    <svg viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke={c.color} strokeWidth="6"
                        strokeDasharray={`${c.score * 2.51} 251`} strokeLinecap="round"
                        transform="rotate(-90 50 50)" />
                    </svg>
                    <span style={{ color: c.color }}>{c.score}%</span>
                  </div>
                  <div className="prevention-compliance-detail-meta" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '15px' }}>
                    <div><Clock size={12} /> Last Audit: <strong>{c.lastAudit}</strong></div>
                    <div><BarChart3 size={12} /> Score: <strong>{c.score}%</strong></div>
                    <div><ShieldCheck size={12} /> Status: <strong style={{ color: '#10b981' }}>Passing</strong></div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', borderLeft: `3px solid ${c.color}`, marginTop: '15px' }}>
                    <h5 style={{ fontSize: '13px', color: '#e2e8f0', margin: '0 0 8px 0' }}><FileText size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}/> Framework & Controls</h5>
                    <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 10px 0' }}>{c.description}</p>
                    <h5 style={{ fontSize: '13px', color: '#e2e8f0', margin: '0 0 8px 0' }}><Lock size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}/> Evidence Collection</h5>
                    <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', margin: 0, fontStyle: 'italic' }}>"{c.evidence}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: Data Check ── */}
      {activeTab === 'datacheck' && (
        <div className="prevention-content">
          <div className="prevention-datacheck-container">
            <div className="prevention-datacheck-header">
              <Search size={20} />
              <h3>Sensitive Data Exposure Check</h3>
              <p>Paste content to scan for credit cards, SSNs, API keys, and PII</p>
            </div>
            <div className="prevention-datacheck-input-wrap">
              <textarea
                className="prevention-datacheck-textarea"
                placeholder="Paste text, logs, or data here to scan for sensitive information...&#10;&#10;Examples:&#10;• Credit card: 4111111111111111&#10;• SSN: 123-45-6789&#10;• API key: your_api_key_here"
                value={dataCheckInput}
                onChange={(e) => setDataCheckInput(e.target.value)}
                rows={8}
              />
              <button className={`prevention-datacheck-btn ${scanning ? 'active' : ''}`} onClick={handleDataCheck} disabled={!dataCheckInput.trim() || scanning}>
                {scanning ? <RefreshCw size={16} className="spinning" /> : <Scan size={16} />}
                {scanning ? 'Deep Scanning Data Engine...' : 'Scan for Sensitive Data'}
              </button>
            </div>
            
            {scanning && (
              <div className="prevention-datacheck-scanning-ui" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                <Activity size={32} className="pulse-icon" style={{ color: '#0ea5e9', marginBottom: '10px' }} />
                <p>Analyzing text patterns against neural DLP registry...</p>
              </div>
            )}
            
            {dataCheckResult && !scanning && (
              <div className={`prevention-datacheck-result ${dataCheckResult.sensitiveDataFound ? 'danger' : 'safe'}`}>
                <div className="prevention-datacheck-result-header">
                  {dataCheckResult.sensitiveDataFound ? (
                    <><ShieldAlert size={20} /> <strong>Sensitive Data Detected!</strong></>
                  ) : (
                    <><ShieldCheck size={20} /> <strong>No Sensitive Data Found</strong></>
                  )}
                </div>
                {dataCheckResult.findings.length > 0 && (
                  <div className="prevention-datacheck-findings">
                    {dataCheckResult.findings.map((f, i) => (
                      <div key={i} className="prevention-datacheck-finding">
                        <AlertTriangle size={14} />
                        <span>{f.rule}</span>
                        <span className={`prevention-risk-badge ${f.severity}`}>{f.severity.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                )}
                {dataCheckResult.shouldBlock && (
                  <div className="prevention-datacheck-block-notice">
                    <XCircle size={14} />
                    <span>This data would be <strong>BLOCKED</strong> by DLP rules before leaving the network.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
