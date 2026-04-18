import { Router } from 'express';
import Alert from '../models/Alert.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// MITRE ATT&CK technique definitions
const TECHNIQUES = [
  { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', description: 'Adversaries may use brute force techniques to gain access to accounts when passwords are unknown.' },
  { id: 'T1071', name: 'Application Layer Protocol', tactic: 'Command and Control', description: 'Adversaries may communicate using application layer protocols to avoid detection.' },
  { id: 'T1041', name: 'Exfiltration Over C2', tactic: 'Exfiltration', description: 'Adversaries may steal data by exfiltrating it over an existing C2 channel.' },
  { id: 'T1021', name: 'Remote Services', tactic: 'Lateral Movement', description: 'Adversaries may use valid accounts to log into remote services.' },
  { id: 'T1078', name: 'Valid Accounts', tactic: 'Defense Evasion', description: 'Adversaries may obtain and abuse credentials of existing accounts.' },
  { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', description: 'Adversaries may encrypt data on target systems to interrupt availability.' },
  { id: 'T1068', name: 'Exploitation for Privilege Escalation', tactic: 'Privilege Escalation', description: 'Adversaries may exploit software vulnerabilities to escalate privileges.' },
  { id: 'T1071.004', name: 'DNS', tactic: 'Command and Control', description: 'Adversaries may communicate using the DNS protocol to avoid detection.' },
  { id: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution', description: 'Adversaries may abuse command and script interpreters to execute commands.' },
  { id: 'T1003', name: 'OS Credential Dumping', tactic: 'Credential Access', description: 'Adversaries may attempt to dump credentials to obtain account login info.' },
  { id: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access', description: 'Adversaries may attempt to exploit vulnerabilities in internet-facing systems.' },
  { id: 'T1189', name: 'Drive-by Compromise', tactic: 'Initial Access', description: 'Adversaries may gain access through user visiting a compromised website.' },
  { id: 'T1046', name: 'Network Service Scanning', tactic: 'Discovery', description: 'Adversaries may scan for services running on remote hosts.' },
  { id: 'T1566', name: 'Phishing', tactic: 'Initial Access', description: 'Adversaries may send phishing messages to gain access to victim systems.' },
];

// ── GET /api/mitre ── (with real counts from alerts DB)
router.get('/', requireAuth, async (req, res) => {
  try {
    // Get real counts from alerts collection
    const mitreAgg = await Alert.aggregate([
      { $match: { mitreAttack: { $ne: null } } },
      { $group: { _id: '$mitreAttack', count: { $sum: 1 } } },
    ]);

    const countMap = mitreAgg.reduce((acc, m) => {
      acc[m._id] = m.count;
      return acc;
    }, {});

    const techniques = TECHNIQUES.map(t => ({
      ...t,
      count: countMap[t.id] || 0,
    }));

    res.json(techniques);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
