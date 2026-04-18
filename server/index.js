import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import os from 'os';
import WebSocket from 'ws';
import si from 'systeminformation';
import Parser from 'rss-parser';

dotenv.config();

const rssParser = new Parser();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cybershield';

app.use(cors());
app.use(express.json());

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MongoDB Models
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const alertSchema = new mongoose.Schema({
  title: String,
  severity: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW', 'CRITICAL'] },
  sourceIP: String,
  targetIP: String,
  description: String,
  type: String,
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'active' },
  confidence: Number,
  mitreAttack: String,
});

const threatSchema = new mongoose.Schema({
  type: String,
  sourceIP: String,
  targetIP: String,
  sourceLat: Number,
  sourceLng: Number,
  targetLat: Number,
  targetLng: Number,
  country: String,
  severity: String,
  timestamp: { type: Date, default: Date.now },
});

const simulationSchema = new mongoose.Schema({
  name: String,
  type: String,
  status: { type: String, default: 'pending' },
  results: Object,
  createdAt: { type: Date, default: Date.now },
});

const logSchema = new mongoose.Schema({
  event: String,
  source: String,
  details: String,
  level: { type: String, enum: ['info', 'warning', 'error', 'critical'] },
  timestamp: { type: Date, default: Date.now },
});

const playbookSchema = new mongoose.Schema({
  playbookId: String,
  title: String,
  status: { type: String, default: 'idle' },
  triggeredBy: String,
  alertId: String,
  steps: [{
    text: String,
    status: { type: String, default: 'pending' },
    completedAt: Date,
  }],
  startedAt: Date,
  completedAt: Date,
  result: Object,
});

const auditLogSchema = new mongoose.Schema({
  action: String,
  user: String,
  target: String,
  status: { type: String, enum: ['success', 'failed'] },
  ip: String,
  details: String,
  timestamp: { type: Date, default: Date.now },
});

const blockedIPSchema = new mongoose.Schema({
  ip: String,
  reason: String,
  blockedAt: { type: Date, default: Date.now },
  blockedBy: String,
  autoBlocked: { type: Boolean, default: false },
});

const Alert = mongoose.model('Alert', alertSchema);
const Threat = mongoose.model('Threat', threatSchema);
const Simulation = mongoose.model('Simulation', simulationSchema);
const Log = mongoose.model('Log', logSchema);
const Playbook = mongoose.model('Playbook', playbookSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);
const BlockedIP = mongoose.model('BlockedIP', blockedIPSchema);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  In-Memory State (for real-time metrics)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let connectedClients = 0;
const serverStartTime = Date.now();

// Running system metrics state
const systemState = {
  cpuUsage: 28,
  memoryUsage: 62,
  diskUsage: 42,
  networkIn: 234,
  networkOut: 189,
  packetsPerSec: 2400,
  bandwidth: 124.7,
  latency: 14,
  droppedPackets: 0,
  activeConnections: 12,
  requestsPerMin: 340,
  errorRate: 0.3,
};

// Running counters for dashboard
const dashboardCounters = {
  totalAlerts: 127,
  criticalThreats: 8,
  highSeverity: 23,
  threatsBlocked: 96,
  alertsTrend: 23,
  criticalTrend: 60,
  highTrend: 15,
  blockedTrend: 31,
};

// MITRE technique detection counts (live)
const mitreCounts = {
  'T1110': 12, 'T1071': 8, 'T1041': 6, 'T1021': 3,
  'T1078': 5, 'T1486': 2, 'T1068': 4, 'T1071.004': 7,
  'T1059': 9, 'T1003': 3, 'T1190': 5, 'T1189': 3,
  'T1046': 6, 'T1566': 4,
};

// Report data (updated in real-time)
const reportState = {
  severityCounts: { CRITICAL: 8, HIGH: 23, MEDIUM: 15, LOW: 12 },
  attackTypeCounts: {
    'Brute Force': 42, 'C2 Beacon': 28, 'Exfiltration': 18,
    'Ransomware': 12, 'Phishing': 22, 'XSS': 8,
    'SQL Injection': 6, 'Port Scan': 14, 'Lateral Movement': 9,
  },
  weeklyData: [
    { day: 'Mon', alerts: 45, blocked: 38 },
    { day: 'Tue', alerts: 52, blocked: 44 },
    { day: 'Wed', alerts: 38, blocked: 35 },
    { day: 'Thu', alerts: 65, blocked: 55 },
    { day: 'Fri', alerts: 48, blocked: 42 },
    { day: 'Sat', alerts: 28, blocked: 26 },
    { day: 'Sun', alerts: 32, blocked: 30 },
  ],
  performance: {
    detectionRate: 94, responseTime: 87, falsePositive: 92,
    coverage: 88, accuracy: 96, uptime: 99,
  },
  hourlyTimeline: [],
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Seed Data
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function seedDatabase() {
  const alertCount = await Alert.countDocuments();
  if (alertCount > 0) return;

  const alerts = [
    { title: 'BRUTE FORCE ATTACK', severity: 'HIGH', sourceIP: '192.168.1.45', targetIP: '10.0.0.1', description: 'Multiple failed SSH login attempts detected', type: 'Brute Force', confidence: 94.2, mitreAttack: 'T1110', status: 'active' },
    { title: 'C2 BEACONING DETECTED', severity: 'MEDIUM', sourceIP: '8.8.3.8', targetIP: '10.0.0.15', description: 'Regular ping pattern matching C2 beacon signature', type: 'C2 Beacon', confidence: 87.5, mitreAttack: 'T1071', status: 'active' },
    { title: 'DATA EXFILTRATION', severity: 'HIGH', sourceIP: '10.0.0.23', targetIP: '185.234.72.1', description: '2.4GB outbound data transfer to unknown IP', type: 'Exfiltration', confidence: 91.8, mitreAttack: 'T1041', status: 'investigating' },
    { title: 'LATERAL MOVEMENT', severity: 'MEDIUM', sourceIP: '192.168.1.100', targetIP: '192.168.1.200', description: 'Internal network scanning and SMB exploitation', type: 'Lateral Movement', confidence: 78.3, mitreAttack: 'T1021', status: 'active' },
    { title: 'SUSPICIOUS LOGIN', severity: 'LOW', sourceIP: '203.45.67.89', targetIP: '10.0.0.5', description: 'Login from unusual geographic location', type: 'Brute Force', confidence: 65.1, mitreAttack: 'T1078', status: 'resolved' },
    { title: 'RANSOMWARE DETECTED', severity: 'CRITICAL', sourceIP: '10.0.0.50', targetIP: '10.0.0.0/24', description: 'File encryption activity detected on multiple endpoints', type: 'Ransomware', confidence: 98.7, mitreAttack: 'T1486', status: 'active' },
    { title: 'DNS TUNNELING', severity: 'HIGH', sourceIP: '10.0.0.33', targetIP: '1.2.3.4', description: 'Anomalous DNS query patterns indicating data exfiltration', type: 'Exfiltration', confidence: 88.9, mitreAttack: 'T1071.004', status: 'investigating' },
    { title: 'PRIVILEGE ESCALATION', severity: 'HIGH', sourceIP: '10.0.0.12', targetIP: '10.0.0.12', description: 'Unauthorized privilege escalation via kernel exploit', type: 'Privilege Escalation', confidence: 96.1, mitreAttack: 'T1068', status: 'active' },
  ];

  const threats = [
    { type: 'Brute Force', sourceIP: '45.33.32.156', sourceLat: 37.77, sourceLng: -122.41, targetLat: 28.61, targetLng: 77.20, country: 'US', severity: 'HIGH' },
    { type: 'C2 Beacon', sourceIP: '185.220.101.1', sourceLat: 52.52, sourceLng: 13.40, targetLat: 28.61, targetLng: 77.20, country: 'DE', severity: 'MEDIUM' },
    { type: 'Exfiltration', sourceIP: '103.224.182.250', sourceLat: 39.90, sourceLng: 116.40, targetLat: 28.61, targetLng: 77.20, country: 'CN', severity: 'HIGH' },
    { type: 'Lateral Movement', sourceIP: '91.121.87.10', sourceLat: 48.85, sourceLng: 2.35, targetLat: 28.61, targetLng: 77.20, country: 'FR', severity: 'MEDIUM' },
    { type: 'Brute Force', sourceIP: '195.154.179.2', sourceLat: 55.75, sourceLng: 37.61, targetLat: 28.61, targetLng: 77.20, country: 'RU', severity: 'CRITICAL' },
    { type: 'Ransomware', sourceIP: '177.54.23.89', sourceLat: -23.55, sourceLng: -46.63, targetLat: 28.61, targetLng: 77.20, country: 'BR', severity: 'HIGH' },
  ];

  const logs = [
    { event: 'System Boot', source: 'kernel', details: 'CyberShield engine initialized', level: 'info' },
    { event: 'Model Loaded', source: 'ai-engine', details: 'Threat detection model v3.2 loaded', level: 'info' },
    { event: 'Connection Spike', source: 'network', details: '450 connections/sec detected on port 443', level: 'warning' },
    { event: 'Failed Auth', source: 'auth', details: 'Multiple failed login attempts from 192.168.1.45', level: 'critical' },
    { event: 'Firewall Update', source: 'firewall', details: 'Rules updated - 23 new entries', level: 'info' },
  ];

  const auditLogs = [
    { action: 'System Boot', user: 'system', target: 'CyberShield Engine', status: 'success', ip: '127.0.0.1', details: 'Server initialized successfully' },
    { action: 'User Login', user: 'admin', target: 'System', status: 'success', ip: '192.168.1.10', details: 'Admin login from local network' },
    { action: 'Model Loaded', user: 'system', target: 'AI Engine', status: 'success', ip: '127.0.0.1', details: 'Threat detection model v3.2 loaded' },
    { action: 'Failed Login', user: 'unknown', target: 'System', status: 'failed', ip: '45.33.32.156', details: 'Multiple failed login attempts' },
    { action: 'Firewall Update', user: 'admin', target: 'Firewall Rules', status: 'success', ip: '192.168.1.10', details: 'Updated 23 firewall rules' },
  ];

  const blockedIPs = [
    { ip: '45.33.32.156', reason: 'Brute Force', blockedBy: 'auto', autoBlocked: true },
    { ip: '185.220.101.1', reason: 'C2 Beacon', blockedBy: 'auto', autoBlocked: true },
    { ip: '103.224.182.250', reason: 'Data Exfil', blockedBy: 'admin', autoBlocked: false },
    { ip: '91.121.87.10', reason: 'Port Scan', blockedBy: 'auto', autoBlocked: true },
    { ip: '195.154.179.2', reason: 'Credential Stuff', blockedBy: 'auto', autoBlocked: true },
    { ip: '177.54.23.89', reason: 'SQL Injection', blockedBy: 'admin', autoBlocked: false },
    { ip: '62.210.105.116', reason: 'DDoS', blockedBy: 'auto', autoBlocked: true },
  ];

  await Alert.insertMany(alerts);
  await Threat.insertMany(threats);
  await Log.insertMany(logs);
  await AuditLog.insertMany(auditLogs);
  await BlockedIP.insertMany(blockedIPs);
  console.log('✅ Database seeded with sample data');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Utility Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function randomIP() {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jitter(base, range) {
  return Math.max(0, base + (Math.random() - 0.5) * range);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Data Generators
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const attackTypes = [
  { title: 'BRUTE FORCE ATTACK', type: 'Brute Force', severity: 'HIGH', mitreAttack: 'T1110' },
  { title: 'C2 BEACONING DETECTED', type: 'C2 Beacon', severity: 'MEDIUM', mitreAttack: 'T1071' },
  { title: 'DATA EXFILTRATION', type: 'Exfiltration', severity: 'HIGH', mitreAttack: 'T1041' },
  { title: 'LATERAL MOVEMENT', type: 'Lateral Movement', severity: 'MEDIUM', mitreAttack: 'T1021' },
  { title: 'SUSPICIOUS LOGIN', type: 'Brute Force', severity: 'LOW', mitreAttack: 'T1078' },
  { title: 'SQL INJECTION', type: 'Web Attack', severity: 'HIGH', mitreAttack: 'T1190' },
  { title: 'XSS ATTEMPT', type: 'Web Attack', severity: 'MEDIUM', mitreAttack: 'T1189' },
  { title: 'PORT SCANNING', type: 'Reconnaissance', severity: 'LOW', mitreAttack: 'T1046' },
  { title: 'RANSOMWARE DETECTED', type: 'Ransomware', severity: 'CRITICAL', mitreAttack: 'T1486' },
  { title: 'PHISHING ATTEMPT', type: 'Social Engineering', severity: 'MEDIUM', mitreAttack: 'T1566' },
  { title: 'PRIVILEGE ESCALATION', type: 'Privilege Escalation', severity: 'HIGH', mitreAttack: 'T1068' },
  { title: 'DNS TUNNELING', type: 'Exfiltration', severity: 'HIGH', mitreAttack: 'T1071.004' },
  { title: 'CREDENTIAL DUMPING', type: 'Credential Access', severity: 'CRITICAL', mitreAttack: 'T1003' },
  { title: 'COMMAND INJECTION', type: 'Execution', severity: 'HIGH', mitreAttack: 'T1059' },
];

const geoLocations = [
  { lat: 37.77, lng: -122.41, country: 'US', city: 'San Francisco' },
  { lat: 52.52, lng: 13.40, country: 'DE', city: 'Berlin' },
  { lat: 39.90, lng: 116.40, country: 'CN', city: 'Beijing' },
  { lat: 48.85, lng: 2.35, country: 'FR', city: 'Paris' },
  { lat: 55.75, lng: 37.61, country: 'RU', city: 'Moscow' },
  { lat: -23.55, lng: -46.63, country: 'BR', city: 'São Paulo' },
  { lat: 35.68, lng: 139.69, country: 'JP', city: 'Tokyo' },
  { lat: 51.50, lng: -0.12, country: 'GB', city: 'London' },
  { lat: 1.35, lng: 103.82, country: 'SG', city: 'Singapore' },
  { lat: -33.86, lng: 151.20, country: 'AU', city: 'Sydney' },
  { lat: 37.57, lng: 126.98, country: 'KR', city: 'Seoul' },
  { lat: 39.02, lng: 125.75, country: 'KP', city: 'Pyongyang' },
  { lat: 35.69, lng: 51.39, country: 'IR', city: 'Tehran' },
  { lat: 6.52, lng: 3.38, country: 'NG', city: 'Lagos' },
  { lat: 19.43, lng: -99.13, country: 'MX', city: 'Mexico City' },
  { lat: 28.61, lng: 77.21, country: 'IN', city: 'Delhi' },
];

const logSources = ['DPI Engine', 'Firewall', 'IDS', 'ML Model', 'Auth Service', 'API Gateway', 'Socket.IO', 'MongoDB', 'System', 'TLS Manager', 'Backup Agent', 'DNS Resolver', 'WAF', 'SIEM'];

const logEvents = [
  { event: 'Connection Accepted', level: 'info', detail: 'New TCP connection established from' },
  { event: 'Signature Match', level: 'warning', detail: 'YARA rule match on traffic from' },
  { event: 'Packet Dropped', level: 'error', detail: 'Malformed packet dropped from' },
  { event: 'Session Timeout', level: 'info', detail: 'Idle session expired for client' },
  { event: 'Threat Intel Update', level: 'info', detail: 'IOC database updated with feeds from' },
  { event: 'Rate Exceeded', level: 'warning', detail: 'Rate limit breached by client' },
  { event: 'Exploit Blocked', level: 'critical', detail: 'Exploit attempt blocked from' },
  { event: 'Certificate Check', level: 'info', detail: 'TLS certificate validated for' },
  { event: 'Rule Triggered', level: 'warning', detail: 'Firewall rule triggered by' },
  { event: 'Packet Inspection', level: 'info', detail: 'Deep packet inspection completed for' },
  { event: 'Anomaly Score', level: 'warning', detail: 'High anomaly score (0.87) from subnet' },
  { event: 'Query Slow', level: 'error', detail: 'Slow database query (>2s) on collection' },
  { event: 'Backup Started', level: 'info', detail: 'Incremental backup initiated for' },
  { event: 'Auth Success', level: 'info', detail: 'Successful authentication from' },
  { event: 'GeoIP Block', level: 'critical', detail: 'Blocked connection from restricted country -' },
  { event: 'Memory Warning', level: 'error', detail: 'Heap usage exceeded 85% threshold on' },
  { event: 'DNS Query Anomaly', level: 'warning', detail: 'Unusual DNS query pattern from' },
  { event: 'Port Scan Blocked', level: 'critical', detail: 'SYN scan blocked from' },
];

function generateLiveAlert() {
  const attack = randomElement(attackTypes);
  const geo = randomElement(geoLocations);
  return {
    _id: new mongoose.Types.ObjectId().toString(),
    ...attack,
    sourceIP: randomIP(),
    targetIP: `10.0.0.${Math.floor(Math.random() * 254) + 1}`,
    description: `${attack.type} detected from ${geo.city}, ${geo.country}`,
    confidence: +(Math.random() * 40 + 60).toFixed(1),
    status: 'active',
    timestamp: new Date().toISOString(),
    geo,
  };
}

function generateLiveThreat() {
  const attack = randomElement(attackTypes);
  const source = randomElement(geoLocations.filter(g => g.country !== 'IN'));
  return {
    _id: new mongoose.Types.ObjectId().toString(),
    type: attack.type,
    sourceIP: randomIP(),
    sourceLat: source.lat + (Math.random() - 0.5) * 5,
    sourceLng: source.lng + (Math.random() - 0.5) * 5,
    targetLat: 28.61,
    targetLng: 77.20,
    country: source.country,
    city: source.city,
    severity: attack.severity,
    timestamp: new Date().toISOString(),
  };
}

function generateLiveLog() {
  const ev = randomElement(logEvents);
  const src = randomElement(logSources);
  const ip = randomIP();
  return {
    _id: new mongoose.Types.ObjectId().toString(),
    event: ev.event,
    source: src,
    details: `${ev.detail} ${ip}`,
    level: ev.level,
    timestamp: new Date().toISOString(),
  };
}

async function getSystemMetrics() {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const network = await si.networkStats();
    const uptimeSeconds = os.uptime();
    
    // Update our internal state with real data
    systemState.cpuUsage = cpu.currentLoad;
    systemState.memoryUsage = (mem.active / mem.total) * 100;
    
    if (network && network.length > 0) {
      // Aggregate stats across all interfaces
      const totalRx = network.reduce((acc, curr) => acc + (curr.rx_sec || 0), 0) / (1024 * 1024); // MB/s
      const totalTx = network.reduce((acc, curr) => acc + (curr.tx_sec || 0), 0) / (1024 * 1024); // MB/s
      systemState.bandwidth = totalRx + totalTx;
      systemState.networkIn = totalRx;
      systemState.networkOut = totalTx;
    }

    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const secs = Math.floor(uptimeSeconds % 60);

    return {
      ...systemState,
      uptime: `${Math.floor(uptimeSeconds / 86400)}d ${hours}h ${minutes}m`,
      uptimeSeconds,
      formattedUptime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      connectedClients,
      serverTime: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      totalMemory: Math.round(mem.total / (1024 * 1024 * 1024) * 10) / 10,
      freeMemory: Math.round(mem.free / (1024 * 1024 * 1024) * 10) / 10,
      cpuCores: os.cpus().length,
      hostname: os.hostname(),
    };
  } catch (err) {
    console.error('Error fetching real system metrics:', err);
    return { ...systemState, formattedUptime: '00:00:00' };
  }
}

function updateDashboardCounters() {
  dashboardCounters.totalAlerts = clamp(Math.floor(jitter(dashboardCounters.totalAlerts, 8)), 80, 300);
  dashboardCounters.criticalThreats = clamp(Math.floor(jitter(dashboardCounters.criticalThreats, 3)), 2, 20);
  dashboardCounters.highSeverity = clamp(Math.floor(jitter(dashboardCounters.highSeverity, 5)), 10, 50);
  dashboardCounters.threatsBlocked = clamp(Math.floor(jitter(dashboardCounters.threatsBlocked, 6)), 60, 150);
  return { ...dashboardCounters };
}

function updateReportData() {
  // Slightly fluctuate report values
  const types = Object.keys(reportState.attackTypeCounts);
  const randomType = randomElement(types);
  reportState.attackTypeCounts[randomType] = clamp(
    reportState.attackTypeCounts[randomType] + Math.floor((Math.random() - 0.3) * 3),
    0, 100
  );

  const severities = Object.keys(reportState.severityCounts);
  const randomSev = randomElement(severities);
  reportState.severityCounts[randomSev] = clamp(
    reportState.severityCounts[randomSev] + Math.floor((Math.random() - 0.3) * 2),
    0, 50
  );

  // Update performance metrics slightly
  Object.keys(reportState.performance).forEach(key => {
    reportState.performance[key] = clamp(
      reportState.performance[key] + (Math.random() - 0.5) * 2,
      70, 100
    );
  });

  // Update today's weekly entry
  const todayIdx = new Date().getDay();
  const dayMap = [6, 0, 1, 2, 3, 4, 5]; // Sun=6, Mon=0...
  const idx = dayMap[todayIdx];
  if (reportState.weeklyData[idx]) {
    reportState.weeklyData[idx].alerts = clamp(
      reportState.weeklyData[idx].alerts + Math.floor((Math.random() - 0.3) * 3), 10, 100
    );
    reportState.weeklyData[idx].blocked = clamp(
      reportState.weeklyData[idx].blocked + Math.floor((Math.random() - 0.3) * 2), 10, 100
    );
  }

  return {
    severityData: Object.entries(reportState.severityCounts).map(([name, value]) => ({
      name, value,
      color: { CRITICAL: '#ff1744', HIGH: '#ff5252', MEDIUM: '#ffab40', LOW: '#69f0ae' }[name],
    })),
    attackTypeData: Object.entries(reportState.attackTypeCounts).map(([type, count]) => ({ type, count })),
    weeklyData: reportState.weeklyData,
    performanceData: Object.entries(reportState.performance).map(([metric, value]) => ({
      metric: metric.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
      value: Math.round(value),
    })),
  };
}

function updateMitreCounts() {
  // Randomly increment a technique count
  const techniques = Object.keys(mitreCounts);
  const tech = randomElement(techniques);
  if (Math.random() > 0.5) {
    mitreCounts[tech] += 1;
  }
  return { ...mitreCounts };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  API Routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Dashboard Stats ──
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalAlerts = await Alert.countDocuments();
    const criticalThreats = await Alert.countDocuments({ severity: 'CRITICAL' });
    const highSeverity = await Alert.countDocuments({ severity: 'HIGH' });
    const blocked = await Alert.countDocuments({ status: 'resolved' });
    res.json({
      totalAlerts: totalAlerts || dashboardCounters.totalAlerts,
      criticalThreats: criticalThreats || dashboardCounters.criticalThreats,
      highSeverity: highSeverity || dashboardCounters.highSeverity,
      threatsBlocked: blocked + Math.floor(Math.random() * 90),
    });
  } catch (err) {
    res.json(dashboardCounters);
  }
});

// ── Alerts CRUD ──
app.get('/api/alerts', async (req, res) => {
  try {
    const { severity, status, search } = req.query;
    const filter = {};
    if (severity && severity !== 'all') filter.severity = severity;
    if (status && status !== 'all') filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const alerts = await Alert.find(filter).sort({ timestamp: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alerts', async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();
    io.emit('newAlert', alert);
    io.emit('liveAlert', alert);
    // Update dashboard counters
    dashboardCounters.totalAlerts++;
    if (alert.severity === 'CRITICAL') dashboardCounters.criticalThreats++;
    if (alert.severity === 'HIGH') dashboardCounters.highSeverity++;
    io.emit('statsUpdate', { ...dashboardCounters });
    // Log the event
    const log = { event: 'Alert Created', source: 'API', details: `New ${alert.severity} alert: ${alert.title}`, level: 'info' };
    io.emit('liveLog', { _id: new mongoose.Types.ObjectId().toString(), ...log, timestamp: new Date().toISOString() });
    // Audit
    io.emit('auditLog', { action: 'Alert Created', user: 'api', target: alert.title, status: 'success', ip: req.ip, timestamp: new Date().toISOString() });
    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/alerts/:id', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true });
    io.emit('alertUpdated', alert);
    if (req.body.status === 'resolved') {
      dashboardCounters.threatsBlocked++;
      io.emit('statsUpdate', { ...dashboardCounters });
    }
    io.emit('auditLog', { action: 'Alert Updated', user: 'admin', target: alert?.title || req.params.id, status: 'success', ip: req.ip, timestamp: new Date().toISOString() });
    res.json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/alerts/:id', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    io.emit('alertDeleted', req.params.id);
    dashboardCounters.totalAlerts = Math.max(0, dashboardCounters.totalAlerts - 1);
    io.emit('statsUpdate', { ...dashboardCounters });
    io.emit('auditLog', { action: 'Alert Deleted', user: 'admin', target: alert?.title || req.params.id, status: 'success', ip: req.ip, timestamp: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Threats (for map) ──
app.get('/api/threats', async (req, res) => {
  try {
    const threats = await Threat.find().sort({ timestamp: -1 });
    res.json(threats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Threats Timeline ──
app.get('/api/threats/timeline', async (req, res) => {
  try {
    const timeline = [];
    for (let i = 0; i < 24; i++) {
      timeline.push({
        hour: `${i.toString().padStart(2, '0')}:00`,
        bruteForce: Math.floor(Math.random() * 15) + 2,
        c2Beacon: Math.floor(Math.random() * 10) + 1,
        exfiltration: Math.floor(Math.random() * 8),
        lateralMovement: Math.floor(Math.random() * 5),
      });
    }
    reportState.hourlyTimeline = timeline;
    res.json(timeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Simulations ──
app.get('/api/simulations', async (req, res) => {
  try {
    const sims = await Simulation.find().sort({ createdAt: -1 });
    res.json(sims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/simulations', async (req, res) => {
  try {
    const sim = new Simulation(req.body);
    sim.status = 'running';
    await sim.save();
    io.emit('simulationStarted', sim);
    io.emit('auditLog', { action: 'Simulation Run', user: 'admin', target: sim.name, status: 'success', ip: req.ip, timestamp: new Date().toISOString() });

    // Emit progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) progress = 100;
      io.emit('simulationProgress', {
        id: sim._id,
        name: sim.name,
        progress,
        phase: progress < 30 ? 'Scanning...' : progress < 60 ? 'Analyzing...' : progress < 90 ? 'Testing exploits...' : 'Generating report...',
      });
      if (progress >= 100) clearInterval(progressInterval);
    }, 800);

    setTimeout(async () => {
      sim.status = 'completed';
      sim.results = {
        vulnerabilitiesFound: Math.floor(Math.random() * 10) + 1,
        exploitsSuccessful: Math.floor(Math.random() * 5),
        riskScore: (Math.random() * 100).toFixed(1),
        duration: `${(Math.random() * 30 + 5).toFixed(1)}s`,
        packetsAnalyzed: Math.floor(Math.random() * 50000) + 10000,
      };
      await sim.save();
      io.emit('simulationCompleted', sim);
    }, 5000);

    res.status(201).json(sim);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── MITRE ATT&CK Framework ──
app.get('/api/mitre', async (req, res) => {
  const techniques = [
    { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', count: mitreCounts['T1110'], description: 'Adversaries may use brute force techniques to gain access to accounts when passwords are unknown.' },
    { id: 'T1071', name: 'Application Layer Protocol', tactic: 'Command and Control', count: mitreCounts['T1071'], description: 'Adversaries may communicate using application layer protocols to avoid detection.' },
    { id: 'T1041', name: 'Exfiltration Over C2', tactic: 'Exfiltration', count: mitreCounts['T1041'], description: 'Adversaries may steal data by exfiltrating it over an existing C2 channel.' },
    { id: 'T1021', name: 'Remote Services', tactic: 'Lateral Movement', count: mitreCounts['T1021'], description: 'Adversaries may use valid accounts to log into remote services.' },
    { id: 'T1078', name: 'Valid Accounts', tactic: 'Defense Evasion', count: mitreCounts['T1078'], description: 'Adversaries may obtain and abuse credentials of existing accounts.' },
    { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', count: mitreCounts['T1486'], description: 'Adversaries may encrypt data on target systems to interrupt availability.' },
    { id: 'T1068', name: 'Exploitation for Privilege Escalation', tactic: 'Privilege Escalation', count: mitreCounts['T1068'], description: 'Adversaries may exploit software vulnerabilities to escalate privileges.' },
    { id: 'T1071.004', name: 'DNS', tactic: 'Command and Control', count: mitreCounts['T1071.004'], description: 'Adversaries may communicate using the DNS protocol to avoid detection.' },
    { id: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution', count: mitreCounts['T1059'], description: 'Adversaries may abuse command and script interpreters to execute commands.' },
    { id: 'T1003', name: 'OS Credential Dumping', tactic: 'Credential Access', count: mitreCounts['T1003'], description: 'Adversaries may attempt to dump credentials to obtain account login info.' },
    { id: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access', count: mitreCounts['T1190'] || 5, description: 'Adversaries may attempt to exploit vulnerabilities in internet-facing systems.' },
    { id: 'T1189', name: 'Drive-by Compromise', tactic: 'Initial Access', count: mitreCounts['T1189'] || 3, description: 'Adversaries may gain access through user visiting a compromised website.' },
    { id: 'T1046', name: 'Network Service Scanning', tactic: 'Discovery', count: mitreCounts['T1046'] || 6, description: 'Adversaries may scan for services running on remote hosts.' },
    { id: 'T1566', name: 'Phishing', tactic: 'Initial Access', count: mitreCounts['T1566'] || 4, description: 'Adversaries may send phishing messages to gain access to victim systems.' },
  ];
  res.json(techniques);
});

// ── Logs ──
app.get('/api/logs', async (req, res) => {
  try {
    const { level, search, limit } = req.query;
    const filter = {};
    if (level && level !== 'all') filter.level = level;
    if (search) {
      filter.$or = [
        { event: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
      ];
    }
    const logs = await Log.find(filter).sort({ timestamp: -1 }).limit(parseInt(limit) || 100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const log = new Log(req.body);
    await log.save();
    io.emit('liveLog', { ...log.toObject(), _id: log._id.toString() });
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Reports ──
app.get('/api/reports/data', (req, res) => {
  res.json(updateReportData());
});

app.get('/api/reports/summary', async (req, res) => {
  try {
    const totalAlerts = await Alert.countDocuments();
    const criticalCount = await Alert.countDocuments({ severity: 'CRITICAL' });
    const resolvedCount = await Alert.countDocuments({ status: 'resolved' });
    const activeCount = await Alert.countDocuments({ status: 'active' });

    res.json({
      totalAlerts,
      criticalCount,
      resolvedCount,
      activeCount,
      resolutionRate: totalAlerts > 0 ? ((resolvedCount / totalAlerts) * 100).toFixed(1) : 0,
      avgResponseTime: `${(Math.random() * 10 + 2).toFixed(1)}s`,
      threatLevel: criticalCount > 5 ? 'SEVERE' : criticalCount > 2 ? 'HIGH' : 'MODERATE',
    });
  } catch (err) {
    res.json({
      totalAlerts: dashboardCounters.totalAlerts,
      criticalCount: dashboardCounters.criticalThreats,
      resolvedCount: dashboardCounters.threatsBlocked,
      activeCount: dashboardCounters.totalAlerts - dashboardCounters.threatsBlocked,
      resolutionRate: '75.6',
      avgResponseTime: '4.2s',
      threatLevel: 'HIGH',
    });
  }
});

// ── System Metrics ──
app.get('/api/system/metrics', async (req, res) => {
  const metrics = await getSystemMetrics();
  res.json(metrics);
});

// ── Live Cyber Security News ──
app.get('/api/news', async (req, res) => {
  try {
    const feed = await rssParser.parseURL('https://thehackernews.com/feeds/posts/default');
    const items = feed.items.map(item => ({
      title: item.title,
      link: item.link,
      content: item.contentSnippet,
      date: item.pubDate,
      author: item.creator
    })).slice(0, 10);
    res.json(items);
  } catch (err) {
    console.error('RSS Feed error:', err);
    res.json([
      { title: 'CyberShield News Feed Offline', link: '#', content: 'Unable to fetch real-time news at this moment.', date: new Date().toISOString() }
    ]);
  }
});

// ── Admin: Audit Logs ──
app.get('/api/admin/audit', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/audit', async (req, res) => {
  try {
    const log = new AuditLog(req.body);
    await log.save();
    io.emit('auditLog', log);
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Admin: Blocked IPs ──
app.get('/api/admin/blocked-ips', async (req, res) => {
  try {
    const ips = await BlockedIP.find().sort({ blockedAt: -1 });
    res.json(ips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/blocked-ips', async (req, res) => {
  try {
    const blocked = new BlockedIP(req.body);
    await blocked.save();
    io.emit('ipBlocked', blocked);
    io.emit('auditLog', { action: 'IP Blocked', user: req.body.blockedBy || 'admin', target: req.body.ip, status: 'success', ip: req.ip, timestamp: new Date().toISOString() });
    res.status(201).json(blocked);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/blocked-ips/:ip', async (req, res) => {
  try {
    await BlockedIP.findOneAndDelete({ ip: req.params.ip });
    io.emit('ipUnblocked', req.params.ip);
    io.emit('auditLog', { action: 'IP Unblocked', user: 'admin', target: req.params.ip, status: 'success', ip: req.ip, timestamp: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Playbooks ──
app.get('/api/playbooks', async (req, res) => {
  try {
    const playbooks = await Playbook.find().sort({ startedAt: -1 }).limit(20);
    res.json(playbooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/playbooks/execute', async (req, res) => {
  try {
    const { playbookId, title, steps, triggeredBy, alertId } = req.body;

    const playbook = new Playbook({
      playbookId,
      title,
      status: 'running',
      triggeredBy: triggeredBy || 'admin',
      alertId,
      steps: steps.map(s => ({ text: s.text || s, status: 'pending' })),
      startedAt: new Date(),
    });
    await playbook.save();
    io.emit('playbookStarted', { _id: playbook._id, playbookId, title, status: 'running' });
    io.emit('auditLog', { action: 'Playbook Executed', user: triggeredBy || 'admin', target: title, status: 'success', ip: '127.0.0.1', timestamp: new Date().toISOString() });

    // Execute steps one by one with delays
    for (let i = 0; i < playbook.steps.length; i++) {
      setTimeout(() => {
        playbook.steps[i].status = 'completed';
        playbook.steps[i].completedAt = new Date();
        io.emit('playbookStepComplete', {
          _id: playbook._id,
          playbookId,
          stepIndex: i,
          stepText: playbook.steps[i].text,
          totalSteps: playbook.steps.length,
          progress: Math.round(((i + 1) / playbook.steps.length) * 100),
        });

        // If last step, mark complete
        if (i === playbook.steps.length - 1) {
          playbook.status = 'completed';
          playbook.completedAt = new Date();
          playbook.result = {
            success: true,
            stepsCompleted: playbook.steps.length,
            duration: `${((Date.now() - playbook.startedAt.getTime()) / 1000).toFixed(1)}s`,
            threatsNeutralized: Math.floor(Math.random() * 3) + 1,
          };
          playbook.save();
          io.emit('playbookCompleted', {
            _id: playbook._id,
            playbookId,
            title,
            status: 'completed',
            result: playbook.result,
          });
        }
      }, (i + 1) * 1200);
    }

    res.status(201).json(playbook);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Brute Force Simulation (server-side) ──
app.post('/api/bruteforce/start', (req, res) => {
  const { targetIP, targetUser, service, delay, wordlist } = req.body;

  const words = wordlist || [
    'password', '123456', 'admin', 'letmein', 'welcome', 'monkey', 'dragon',
    'master', 'qwerty', 'login', 'abc123', 'root', 'pass', 'test', 'guest',
    'shadow', 'sunshine', 'superman', 'hunter2', 'CyberShield@2026',
  ];

  const sessionId = new mongoose.Types.ObjectId().toString();

  io.emit('bruteForceStarted', {
    sessionId,
    targetIP,
    targetUser,
    service,
    wordlistSize: words.length,
    timestamp: new Date().toISOString(),
  });

  io.emit('auditLog', {
    action: 'Brute Force Sim',
    user: 'admin',
    target: `${targetIP}:${service}`,
    status: 'success',
    ip: '127.0.0.1',
    timestamp: new Date().toISOString(),
  });

  let index = 0;
  const interval = setInterval(() => {
    if (index >= words.length) {
      clearInterval(interval);
      io.emit('bruteForceComplete', {
        sessionId,
        found: false,
        totalAttempts: words.length,
      });
      return;
    }

    const pw = words[index];
    const isCorrect = pw === 'CyberShield@2026' && targetUser === 'admin';

    io.emit('bruteForceAttempt', {
      sessionId,
      attempt: index + 1,
      total: words.length,
      password: pw,
      success: isCorrect,
      progress: ((index + 1) / words.length * 100).toFixed(1),
    });

    if (isCorrect) {
      clearInterval(interval);
      io.emit('bruteForceComplete', {
        sessionId,
        found: true,
        password: pw,
        totalAttempts: index + 1,
      });
    }

    index++;
  }, delay || 200);

  res.json({ sessionId, status: 'started', wordlistSize: words.length });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Prevention Engine (ported from HACKMANDU/prevention_engine.py)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const preventionState = {
  strategies: [
    { id: 1, name: 'Database Encryption', description: 'End-to-end encryption for sensitive database records', status: 'active', riskLevel: 'critical', coverage: 98.5, lastScanned: '2 minutes ago', affectedAssets: 342, protectedRecords: 15847329, implementation: 'AES-256-GCM with key rotation' },
    { id: 2, name: 'Access Control Management', description: 'Role-based access control (RBAC) with MFA enforcement', status: 'active', riskLevel: 'high', coverage: 92.3, lastScanned: '5 minutes ago', affectedAssets: 156, protectedRecords: 8234567, implementation: 'OAuth 2.0 + MFA via TOTP/U2F' },
    { id: 3, name: 'Data Loss Prevention (DLP)', description: 'Monitor and prevent unauthorized data transfers', status: 'active', riskLevel: 'high', coverage: 87.4, lastScanned: '1 minute ago', affectedAssets: 289, protectedRecords: 12456789, implementation: 'Pattern matching + ML-based anomaly detection' },
    { id: 4, name: 'Network Segmentation', description: 'Isolate critical systems with firewall rules', status: 'active', riskLevel: 'medium', coverage: 95.2, lastScanned: '3 minutes ago', affectedAssets: 78, protectedRecords: 3456789, implementation: 'Zero-trust network architecture' },
    { id: 5, name: 'API Security', description: 'Rate limiting, input validation, and OAuth 2.0', status: 'active', riskLevel: 'medium', coverage: 88.7, lastScanned: '4 minutes ago', affectedAssets: 45, protectedRecords: 2345678, implementation: 'OAuth 2.0, JWT validation, rate limiting' },
    { id: 6, name: 'Backup & Recovery', description: 'Automated backup with encryption and air-gapped storage', status: 'active', riskLevel: 'critical', coverage: 100, lastScanned: '7 minutes ago', affectedAssets: 512, protectedRecords: 28934562, implementation: 'Daily encrypted backups + 3-2-1 strategy' },
  ],
  dlpRules: [
    { id: 1, name: 'Credit Card Detection', pattern: '4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}', severity: 'critical', matches: 156, blocked: 142, falsePositives: 3 },
    { id: 2, name: 'PII Detection', pattern: '\\d{3}-\\d{2}-\\d{4}', severity: 'critical', matches: 892, blocked: 834, falsePositives: 12 },
    { id: 3, name: 'API Key Detection', pattern: '(?:api[_-]?key|apikey|auth[_-]?token|secret[_-]?key)\\s*[=:]\\s*[a-zA-Z0-9\\-_]{20,}', severity: 'critical', matches: 234, blocked: 228, falsePositives: 1 },
  ],
  encryptionStatus: {
    encryptedData: '94.8%', algorithm: 'AES-256-GCM', keyRotation: 'Every 90 days', lastRotation: '12 days ago', status: 'active',
    algorithmsInUse: [
      { name: 'AES', keySize: '256-bit', mode: 'GCM', systems: 847, status: 'active' },
      { name: 'RSA', keySize: '2048-bit', mode: 'OAEP', systems: 523, status: 'active' },
      { name: 'TLS', keySize: '256-bit', version: '1.3', systems: 1247, status: 'active' },
      { name: 'SHA-256', keySize: '256-bit', mode: 'Hashing', systems: 2843, status: 'active' },
    ],
  },
  vulnerabilities: [
    { id: 1, type: 'Weak Password Policy', severity: 'high', status: 'open', affectedCount: 23, recommendation: 'Enforce minimum 12-character passwords with complexity rules', remediationTime: '2 hours' },
    { id: 2, type: 'Unencrypted API Endpoints', severity: 'critical', status: 'open', affectedCount: 4, recommendation: 'Implement HTTPS/TLS 1.3 on all API endpoints', remediationTime: '6 hours' },
    { id: 3, type: 'Missing MFA on Admin Accounts', severity: 'critical', status: 'open', affectedCount: 8, recommendation: 'Mandate MFA for all administrative accounts', remediationTime: '1 hour' },
    { id: 4, type: 'Excessive Database Privileges', severity: 'high', status: 'in_progress', affectedCount: 34, recommendation: 'Apply principle of least privilege (PoLP)', remediationTime: '4 hours' },
  ],
  lastScan: null,
};

// Overview
app.get('/api/prevention/overview', (req, res) => {
  const activeStrategies = preventionState.strategies.filter(s => s.status === 'active').length;
  const totalProtected = preventionState.strategies.reduce((sum, s) => sum + s.protectedRecords, 0);
  const overallCoverage = +(preventionState.strategies.reduce((sum, s) => sum + s.coverage, 0) / preventionState.strategies.length).toFixed(1);
  res.json({
    activeProtections: activeStrategies,
    totalStrategies: preventionState.strategies.length,
    totalProtectedRecords: totalProtected,
    overallCoverage,
    securityScore: 91,
    threatsBlockedToday: 1247 + Math.floor(Math.random() * 100),
  });
});

// Strategies
app.get('/api/prevention/strategies', (req, res) => {
  res.json({ strategies: preventionState.strategies, total: preventionState.strategies.length, active: preventionState.strategies.filter(s => s.status === 'active').length });
});

app.get('/api/prevention/strategies/:id', (req, res) => {
  const strategy = preventionState.strategies.find(s => s.id === parseInt(req.params.id));
  if (!strategy) return res.status(404).json({ error: 'Strategy not found' });
  res.json(strategy);
});

// Vulnerabilities
app.get('/api/prevention/vulnerabilities', (req, res) => {
  if (!preventionState.lastScan) {
    preventionState.lastScan = new Date().toISOString();
  }
  res.json({
    vulnerabilities: preventionState.vulnerabilities,
    total: preventionState.vulnerabilities.length,
    critical: preventionState.vulnerabilities.filter(v => v.severity === 'critical').length,
    lastScan: preventionState.lastScan,
  });
});

app.post('/api/prevention/scan', (req, res) => {
  preventionState.lastScan = new Date().toISOString();
  preventionState.vulnerabilities = preventionState.vulnerabilities.map(v => ({
    ...v,
    affectedCount: Math.max(0, v.affectedCount + Math.floor((Math.random() - 0.5) * 4)),
  }));
  io.emit('auditLog', { action: 'Vulnerability Scan', user: 'admin', target: 'Prevention Engine', status: 'success', ip: '127.0.0.1', timestamp: new Date().toISOString() });
  res.json({ scanStatus: 'completed', vulnerabilitiesFound: preventionState.vulnerabilities.length, scanTime: preventionState.lastScan });
});

app.post('/api/prevention/remediate/:vulnId', (req, res) => {
  const vulnId = parseInt(req.params.vulnId);
  const vuln = preventionState.vulnerabilities.find(v => v.id === vulnId);
  if (!vuln) return res.status(404).json({ success: false, message: 'Vulnerability not found' });
  vuln.status = 'remediated';
  io.emit('auditLog', { action: 'Vulnerability Remediated', user: 'admin', target: vuln.type, status: 'success', ip: req.ip, timestamp: new Date().toISOString() });
  res.json({ success: true, vulnerabilityId: vulnId, result: `${vuln.type} has been remediated`, completedAt: new Date().toISOString() });
});

// DLP
app.get('/api/prevention/dlp', (req, res) => {
  res.json({
    status: 'active',
    blockedAttempts: 1247,
    suspiciousActivity: 38,
    filesMonitored: 2847394,
    rules: preventionState.dlpRules,
    lastUpdated: new Date().toISOString(),
  });
});

app.post('/api/prevention/check-data', (req, res) => {
  const content = req.body.content || '';
  const findings = [];
  for (const rule of preventionState.dlpRules) {
    try {
      if (new RegExp(rule.pattern).test(content)) {
        findings.push({ rule: rule.name, severity: rule.severity, matched: true });
      }
    } catch (e) { /* skip invalid regex */ }
  }
  res.json({
    sensitiveDataFound: findings.length > 0,
    findings,
    shouldBlock: findings.some(f => f.severity === 'critical'),
  });
});

// Encryption
app.get('/api/prevention/encryption', (req, res) => {
  res.json(preventionState.encryptionStatus);
});

app.post('/api/prevention/validate-encryption', (req, res) => {
  const { algorithm, keySize } = req.body;
  const validConfigs = { AES: [128, 192, 256], RSA: [2048, 3072, 4096], ChaCha20: [256], TLS: [256] };
  const isValid = validConfigs[algorithm] && validConfigs[algorithm].includes(keySize);
  res.json({ algorithm, keySize, valid: isValid, recommendation: `${algorithm}-${keySize} is ${isValid ? 'secure' : 'not recommended'}` });
});

// Compliance
app.get('/api/prevention/compliance', (req, res) => {
  res.json({
    gdpr: { compliant: true, score: 92.5, lastAudit: new Date(Date.now() - 30 * 86400000).toISOString() },
    hipaa: { compliant: true, score: 94.0, lastAudit: new Date(Date.now() - 45 * 86400000).toISOString() },
    pciDss: { compliant: true, score: 91.5, lastAudit: new Date(Date.now() - 60 * 86400000).toISOString() },
    soc2: { compliant: true, score: 93.0, lastAudit: new Date(Date.now() - 90 * 86400000).toISOString() },
  });
});

// Prevention report
app.get('/api/prevention/report', (req, res) => {
  const activeStrategies = preventionState.strategies.filter(s => s.status === 'active').length;
  const totalProtected = preventionState.strategies.reduce((sum, s) => sum + s.protectedRecords, 0);
  res.json({
    reportType: req.query.type || 'full',
    generatedAt: new Date().toISOString(),
    overview: { activeProtections: activeStrategies, totalProtectedRecords: totalProtected, securityScore: 91 },
    strategies: preventionState.strategies,
    vulnerabilities: preventionState.vulnerabilities,
    dlpStatus: { blockedAttempts: 1247, rulesActive: preventionState.dlpRules.length },
    encryptionStatus: preventionState.encryptionStatus,
  });
});

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    connectedClients,
    serverTime: new Date().toISOString(),
    version: '2.0.0',
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  WebSocket Events
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

io.on('connection', (socket) => {
  connectedClients++;
  console.log(`[WS] Client connected (${connectedClients} total)`);

  // Send initial connection payload with full state
  socket.emit('connected', {
    message: 'Connected to CyberShield WebSocket v2.0',
    connectedClients,
    serverTime: new Date().toISOString(),
  });

  io.emit('clientCount', connectedClients);

  // Send initial data burst
  socket.emit('statsUpdate', { ...dashboardCounters });
  getSystemMetrics().then(metrics => socket.emit('systemMetrics', metrics));
  socket.emit('reportData', updateReportData());
  socket.emit('mitreCounts', { ...mitreCounts });

  // Handle requests from client
  socket.on('requestStats', async () => {
    try {
      const totalAlerts = await Alert.countDocuments();
      const criticalThreats = await Alert.countDocuments({ severity: 'CRITICAL' });
      const highSeverity = await Alert.countDocuments({ severity: 'HIGH' });
      const blocked = await Alert.countDocuments({ status: 'resolved' });
      socket.emit('statsUpdate', {
        totalAlerts: totalAlerts || dashboardCounters.totalAlerts,
        criticalThreats: criticalThreats || dashboardCounters.criticalThreats,
        highSeverity: highSeverity || dashboardCounters.highSeverity,
        threatsBlocked: blocked + Math.floor(Math.random() * 90),
      });
    } catch (err) {
      socket.emit('statsUpdate', { ...dashboardCounters });
    }
  });

  socket.on('requestSystemMetrics', async () => {
    const metrics = await getSystemMetrics();
    socket.emit('systemMetrics', metrics);
  });

  socket.on('requestReportData', () => {
    socket.emit('reportData', updateReportData());
  });

  socket.on('requestMitreCounts', () => {
    socket.emit('mitreCounts', { ...mitreCounts });
  });

  socket.on('requestLogs', async () => {
    try {
      const logs = await Log.find().sort({ timestamp: -1 }).limit(50);
      socket.emit('initialLogs', logs);
    } catch (err) {
      socket.emit('initialLogs', []);
    }
  });

  socket.on('requestAlerts', async () => {
    try {
      const alerts = await Alert.find().sort({ timestamp: -1 }).limit(20);
      socket.emit('initialAlerts', alerts);
    } catch {
      socket.emit('initialAlerts', []);
    }
  });

  socket.on('requestThreats', async () => {
    try {
      const threats = await Threat.find().sort({ timestamp: -1 }).limit(20);
      socket.emit('initialThreats', threats);
    } catch {
      socket.emit('initialThreats', []);
    }
  });

  // Playbook execution via WebSocket
  socket.on('executePlaybook', (data) => {
    const { playbookId, title, steps } = data;
    io.emit('playbookStarted', { playbookId, title, status: 'running' });

    steps.forEach((step, i) => {
      setTimeout(() => {
        io.emit('playbookStepComplete', {
          playbookId,
          stepIndex: i,
          stepText: step.text || step,
          totalSteps: steps.length,
          progress: Math.round(((i + 1) / steps.length) * 100),
        });
        if (i === steps.length - 1) {
          io.emit('playbookCompleted', {
            playbookId,
            title,
            status: 'completed',
            result: { success: true, stepsCompleted: steps.length },
          });
        }
      }, (i + 1) * 1200);
    });
  });

  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`[WS] Client disconnected (${connectedClients} total)`);
    io.emit('clientCount', connectedClients);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Real-Time Event Emitters (Heart of the system)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Live Alerts & Threats (Bridged directly from Python AI Backend) ──
let pythonWs = null;

function connectToPythonBackend() {
  pythonWs = new WebSocket('ws://localhost:8000/ws');

  pythonWs.on('open', () => {
    console.log('[+] Connected to SentinelAI Python Backend');
  });

  pythonWs.on('message', async (message) => {
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'alert' && msg.alert) {
        const rawAlert = msg.alert;
        
        // Map Python alert structure to Node.js format
        const mappedAlert = {
          _id: rawAlert.alert_id,
          title: `[${rawAlert.threat_type}] Potential Attack`,
          severity: rawAlert.severity.toUpperCase(),
          sourceIP: rawAlert.source_ip,
          targetIP: rawAlert.target_ip || 'Internal System',
          description: `Detected signature for ${rawAlert.threat_type}. Confidence: ${rawAlert.confidence}%`,
          type: rawAlert.threat_type,
          status: 'active',
          mitreAttack: 'T1110', // Default fallback
          timestamp: new Date().toISOString()
        };

        const threat = {
          type: rawAlert.threat_type,
          sourceIP: rawAlert.source_ip,
          sourceLat: rawAlert.source_lat || (Math.random() * 180 - 90),
          sourceLng: rawAlert.source_lng || (Math.random() * 360 - 180),
          targetLat: 38.8951,
          targetLng: -77.0364,
          country: 'Unknown',
          severity: rawAlert.severity.toLowerCase(),
        };

        // Broadcast to clients
        io.emit('liveAlert', mappedAlert);
        io.emit('newAlert', mappedAlert);
        io.emit('liveThreat', threat);

        // Update MITRE
        if (mitreCounts['T1110'] !== undefined) mitreCounts['T1110']++;

        // Persist real alerts to MongoDB
        if (mongoose.connection.readyState === 1) {
          try {
            await new Alert(mappedAlert).save();
            await new Threat(threat).save();
          } catch (e) { /* ignore duplication/validation errs in real-time stream */ }
        }
      }
    } catch (e) {
      console.log('Error processing Python alert', e);
    }
  });

  pythonWs.on('close', () => {
    console.log('[!] Lost connection to SentinelAI Python Backend. Retrying in 5s...');
    setTimeout(connectToPythonBackend, 5000);
  });

  pythonWs.on('error', () => { /* Suppress error to avoid spam */ });
}

function startAlertEmitter() {
  // Start the bridge instead of creating fake data
  connectToPythonBackend();
}

// ── Dashboard Stats (every 5 seconds) ──
function startStatsEmitter() {
  setInterval(() => {
    if (connectedClients === 0) return;
    io.emit('statsUpdate', updateDashboardCounters());
  }, 5000);
}

// ── System Metrics (high-speed real-time updates) ──
function startMetricsEmitter() {
  setInterval(async () => {
    if (connectedClients === 0) return;
    const metrics = await getSystemMetrics();
    io.emit('systemMetrics', metrics);
  }, 1000); // 1s for real data to avoid overhead
}

// ── Network Activity Bars (real-time stream) ──
function startNetworkEmitter() {
  // Relaxed interval so the graph isn't wildly fluctuating
  setInterval(() => {
    if (connectedClients === 0) return;
    // Calculate a realistic looking bar based on bandwidth rather than pure random
    const baseBar = (systemState.bandwidth / 350) * 100;
    const realisticBar = Math.min(100, Math.max(0, baseBar + (Math.random() - 0.5) * 10));
    
    io.emit('networkActivity', {
      bar: realisticBar,
      inbound: +(systemState.bandwidth * 0.6 + (Math.random() * 5)).toFixed(1),
      outbound: +(systemState.bandwidth * 0.4 + (Math.random() * 5)).toFixed(1),
      latency: Math.max(1, Math.floor(systemState.latency + (Math.random() - 0.5) * 4)),
      dropped: systemState.droppedPackets,
      timestamp: new Date().toISOString(),
    });
  }, 1200); // Back to 1.2s for smoother, readable graph updates
}

// ── Live Logs (every 2-4 seconds) ──
function startLogEmitter() {
  setInterval(() => {
    if (connectedClients === 0) return;
    const log = generateLiveLog();
    io.emit('liveLog', log);

    // Persist occasionally
    if (Math.random() > 0.8) {
      new Log({
        event: log.event,
        source: log.source,
        details: log.details,
        level: log.level,
      }).save().catch(() => {});
    }
  }, Math.floor(Math.random() * 2000) + 2000);
}

// ── Report Data (every 10 seconds) ──
function startReportEmitter() {
  setInterval(() => {
    if (connectedClients === 0) return;
    io.emit('reportData', updateReportData());
  }, 10000);
}

// ── MITRE Counts (every 15 seconds) ──
function startMitreEmitter() {
  setInterval(() => {
    if (connectedClients === 0) return;
    io.emit('mitreCounts', updateMitreCounts());
  }, 15000);
}

// ── Audit trail events (every 20-30 seconds) ──
function startAuditEmitter() {
  const auditEvents = [
    { action: 'Config Check', target: 'Firewall Rules' },
    { action: 'Health Check', target: 'API Gateway' },
    { action: 'DB Maintenance', target: 'MongoDB' },
    { action: 'Rule Updated', target: 'IDS Signatures' },
    { action: 'Cert Rotation', target: 'TLS Certificates' },
    { action: 'Backup Run', target: 'Database Backup' },
    { action: 'Log Rotation', target: 'System Logs' },
    { action: 'Model Refresh', target: 'ML Detection Model' },
    { action: 'Cache Clear', target: 'Redis Cache' },
    { action: 'Sync Complete', target: 'Threat Intel Feed' },
  ];

  setInterval(() => {
    if (connectedClients === 0) return;
    const event = randomElement(auditEvents);
    const auditEntry = {
      _id: new mongoose.Types.ObjectId().toString(),
      ...event,
      user: randomElement(['system', 'admin', 'scheduler', 'auto-pilot']),
      status: Math.random() > 0.1 ? 'success' : 'failed',
      ip: '127.0.0.1',
      timestamp: new Date().toISOString(),
    };
    io.emit('auditLog', auditEntry);

    // Persist
    new AuditLog(auditEntry).save().catch(() => {});
  }, Math.floor(Math.random() * 10000) + 20000);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Start Server
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[+] Connected to MongoDB Backend');
    await seedDatabase();
  } catch (err) {
    console.log('[!] MongoDB not available yet. Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
}

async function startServer() {
  connectDB();

  httpServer.listen(PORT, () => {
    console.log(`\n${'='.repeat(52)}`);
    console.log(`[*] CyberShield Backend v2.0`);
    console.log(`${'='.repeat(52)}`);
    console.log(`[+] REST API:     http://localhost:${PORT}/api`);
    console.log(`[+] WebSocket:    ws://localhost:${PORT}`);
    console.log(`[+] Health:       http://localhost:${PORT}/api/health`);
    console.log(`${'='.repeat(52)}`);
    console.log(`\n[+] Starting real-time emitters...`);

    startAlertEmitter();
    startStatsEmitter();
    startMetricsEmitter();
    startNetworkEmitter();
    startLogEmitter();
    startReportEmitter();
    startMitreEmitter();
    startAuditEmitter();

    console.log(`[+] All 8 real-time emitters active`);
    console.log(`[+] Server ready for connections\n`);
  });
}

startServer();
