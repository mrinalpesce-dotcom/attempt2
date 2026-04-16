import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

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

// ─── MongoDB Models ────────────────────────────────────────────
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

const Alert = mongoose.model('Alert', alertSchema);
const Threat = mongoose.model('Threat', threatSchema);
const Simulation = mongoose.model('Simulation', simulationSchema);
const Log = mongoose.model('Log', logSchema);

// ─── Seed Data ─────────────────────────────────────────────────
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

  await Alert.insertMany(alerts);
  await Threat.insertMany(threats);
  await Log.insertMany(logs);
  console.log('✅ Database seeded with sample data');
}

// ─── API Routes ────────────────────────────────────────────────

// Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalAlerts = await Alert.countDocuments();
    const criticalThreats = await Alert.countDocuments({ severity: 'CRITICAL' });
    const highSeverity = await Alert.countDocuments({ severity: 'HIGH' });
    const blocked = await Alert.countDocuments({ status: 'resolved' });
    res.json({
      totalAlerts,
      criticalThreats,
      highSeverity,
      threatsBlocked: blocked + Math.floor(Math.random() * 90),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alerts CRUD
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
    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/alerts/:id', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true });
    io.emit('alertUpdated', alert);
    res.json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/alerts/:id', async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    io.emit('alertDeleted', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Threats (for map)
app.get('/api/threats', async (req, res) => {
  try {
    const threats = await Threat.find().sort({ timestamp: -1 });
    res.json(threats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Threats Over Time
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
    res.json(timeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simulations
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

// MITRE ATT&CK Framework data
app.get('/api/mitre', async (req, res) => {
  const techniques = [
    { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', count: 12, description: 'Adversaries may use brute force techniques to gain access to accounts when passwords are unknown.' },
    { id: 'T1071', name: 'Application Layer Protocol', tactic: 'Command and Control', count: 8, description: 'Adversaries may communicate using application layer protocols to avoid detection.' },
    { id: 'T1041', name: 'Exfiltration Over C2', tactic: 'Exfiltration', count: 6, description: 'Adversaries may steal data by exfiltrating it over an existing C2 channel.' },
    { id: 'T1021', name: 'Remote Services', tactic: 'Lateral Movement', count: 3, description: 'Adversaries may use valid accounts to log into remote services.' },
    { id: 'T1078', name: 'Valid Accounts', tactic: 'Defense Evasion', count: 5, description: 'Adversaries may obtain and abuse credentials of existing accounts.' },
    { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', count: 2, description: 'Adversaries may encrypt data on target systems to interrupt availability.' },
    { id: 'T1068', name: 'Exploitation for Privilege Escalation', tactic: 'Privilege Escalation', count: 4, description: 'Adversaries may exploit software vulnerabilities to escalate privileges.' },
    { id: 'T1071.004', name: 'DNS', tactic: 'Command and Control', count: 7, description: 'Adversaries may communicate using the DNS protocol to avoid detection.' },
    { id: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution', count: 9, description: 'Adversaries may abuse command and script interpreters to execute commands.' },
    { id: 'T1003', name: 'OS Credential Dumping', tactic: 'Credential Access', count: 3, description: 'Adversaries may attempt to dump credentials to obtain account login info.' },
  ];
  res.json(techniques);
});

// Logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', uptime: process.uptime(), connectedClients: io.engine.clientsCount });
});

// ─── WebSocket Events ──────────────────────────────────────────
let connectedClients = 0;

io.on('connection', (socket) => {
  connectedClients++;
  console.log(`🔌 Client connected (${connectedClients} total)`);

  // Send initial connection info
  socket.emit('connected', {
    message: 'Connected to CyberShield WebSocket',
    connectedClients,
    serverTime: new Date().toISOString(),
  });

  io.emit('clientCount', connectedClients);

  // Handle client requesting live stats
  socket.on('requestStats', async () => {
    try {
      const totalAlerts = await Alert.countDocuments();
      const criticalThreats = await Alert.countDocuments({ severity: 'CRITICAL' });
      const highSeverity = await Alert.countDocuments({ severity: 'HIGH' });
      const blocked = await Alert.countDocuments({ status: 'resolved' });
      socket.emit('statsUpdate', {
        totalAlerts,
        criticalThreats,
        highSeverity,
        threatsBlocked: blocked + Math.floor(Math.random() * 90),
      });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`🔌 Client disconnected (${connectedClients} total)`);
    io.emit('clientCount', connectedClients);
  });
});

// ─── Live Threat Simulation (generates new events periodically) ──
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
];

const geoLocations = [
  { lat: 37.77, lng: -122.41, country: 'US' },
  { lat: 52.52, lng: 13.40, country: 'DE' },
  { lat: 39.90, lng: 116.40, country: 'CN' },
  { lat: 48.85, lng: 2.35, country: 'FR' },
  { lat: 55.75, lng: 37.61, country: 'RU' },
  { lat: -23.55, lng: -46.63, country: 'BR' },
  { lat: 35.68, lng: 139.69, country: 'JP' },
  { lat: 51.50, lng: -0.12, country: 'GB' },
  { lat: 1.35, lng: 103.82, country: 'SG' },
  { lat: -33.86, lng: 151.20, country: 'AU' },
];

function randomIP() {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function generateLiveAlert() {
  const attack = attackTypes[Math.floor(Math.random() * attackTypes.length)];
  const geo = geoLocations[Math.floor(Math.random() * geoLocations.length)];
  return {
    _id: new mongoose.Types.ObjectId().toString(),
    ...attack,
    sourceIP: randomIP(),
    targetIP: `10.0.0.${Math.floor(Math.random() * 254) + 1}`,
    description: `${attack.type} detected from ${geo.country}`,
    confidence: +(Math.random() * 40 + 60).toFixed(1),
    status: 'active',
    timestamp: new Date().toISOString(),
    geo,
  };
}

function generateLiveThreat() {
  const attack = attackTypes[Math.floor(Math.random() * attackTypes.length)];
  const source = geoLocations[Math.floor(Math.random() * geoLocations.length)];
  return {
    _id: new mongoose.Types.ObjectId().toString(),
    type: attack.type,
    sourceIP: randomIP(),
    sourceLat: source.lat + (Math.random() - 0.5) * 5,
    sourceLng: source.lng + (Math.random() - 0.5) * 5,
    targetLat: 28.61,
    targetLng: 77.20,
    country: source.country,
    severity: attack.severity,
    timestamp: new Date().toISOString(),
  };
}

// Emit live events every 4-8 seconds
let liveInterval;
function startLiveEmitter() {
  liveInterval = setInterval(() => {
    if (connectedClients > 0) {
      const alert = generateLiveAlert();
      const threat = generateLiveThreat();
      io.emit('liveAlert', alert);
      io.emit('liveThreat', threat);

      // Occasionally emit stats update
      if (Math.random() > 0.5) {
        io.emit('statsUpdate', {
          totalAlerts: Math.floor(Math.random() * 50) + 100,
          criticalThreats: Math.floor(Math.random() * 5) + 5,
          highSeverity: Math.floor(Math.random() * 15) + 15,
          threatsBlocked: Math.floor(Math.random() * 40) + 80,
        });
      }
    }
  }, Math.floor(Math.random() * 4000) + 4000);
}

// ─── Start Server ──────────────────────────────────────────────
async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    await seedDatabase();
  } catch (err) {
    console.log('⚠️  MongoDB not available, running with in-memory mock data');
  }

  httpServer.listen(PORT, () => {
    console.log(`🛡️  CyberShield API running on port ${PORT}`);
    console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
    startLiveEmitter();
  });
}

startServer();
