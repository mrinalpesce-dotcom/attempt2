import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Globe2, Filter, MapPin, Crosshair, Activity, Shield, AlertTriangle, Eye, Zap, Radio, Target, ChevronRight, Clock, Wifi } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  30+ Global Breach Locations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BREACH_LOCATIONS = [
  { id: 1, city: 'Moscow', country: 'Russia', code: 'RU', lat: 55.76, lng: 37.62, type: 'Brute Force', severity: 'CRITICAL', breachType: 'Credential Theft', dataLost: '2.3M records', ip: '45.12.73.201' },
  { id: 2, city: 'Beijing', country: 'China', code: 'CN', lat: 39.90, lng: 116.40, type: 'Data Exfiltration', severity: 'HIGH', breachType: 'Database Dump', dataLost: '5.1M records', ip: '103.224.182.250' },
  { id: 3, city: 'São Paulo', country: 'Brazil', code: 'BR', lat: -23.55, lng: -46.63, type: 'Ransomware', severity: 'CRITICAL', breachType: 'File Encryption', dataLost: '890 GB encrypted', ip: '177.54.23.89' },
  { id: 4, city: 'London', country: 'UK', code: 'GB', lat: 51.51, lng: -0.13, type: 'Phishing', severity: 'MEDIUM', breachType: 'Credential Harvest', dataLost: '12K accounts', ip: '81.2.69.142' },
  { id: 5, city: 'San Francisco', country: 'USA', code: 'US', lat: 37.77, lng: -122.42, type: 'SQL Injection', severity: 'HIGH', breachType: 'API Breach', dataLost: '1.7M records', ip: '104.28.16.5' },
  { id: 6, city: 'Pyongyang', country: 'N. Korea', code: 'KP', lat: 39.02, lng: 125.75, type: 'APT', severity: 'CRITICAL', breachType: 'State-Sponsored', dataLost: '3.8M records', ip: '175.45.176.3' },
  { id: 7, city: 'Lagos', country: 'Nigeria', code: 'NG', lat: 6.52, lng: 3.38, type: 'Social Engineering', severity: 'MEDIUM', breachType: 'BEC Fraud', dataLost: '$240K stolen', ip: '41.190.2.33' },
  { id: 8, city: 'Tehran', country: 'Iran', code: 'IR', lat: 35.69, lng: 51.39, type: 'DDoS', severity: 'HIGH', breachType: 'Service Disruption', dataLost: '6h downtime', ip: '5.160.136.27' },
  { id: 9, city: 'Berlin', country: 'Germany', code: 'DE', lat: 52.52, lng: 13.41, type: 'C2 Beacon', severity: 'MEDIUM', breachType: 'Botnet Control', dataLost: '340 endpoints', ip: '185.220.101.1' },
  { id: 10, city: 'Tokyo', country: 'Japan', code: 'JP', lat: 35.68, lng: 139.69, type: 'XSS', severity: 'LOW', breachType: 'Cookie Theft', dataLost: '8K sessions', ip: '133.242.16.4' },
  { id: 11, city: 'Sydney', country: 'Australia', code: 'AU', lat: -33.87, lng: 151.21, type: 'Lateral Movement', severity: 'HIGH', breachType: 'Network Pivot', dataLost: '23 systems', ip: '103.25.201.11' },
  { id: 12, city: 'Seoul', country: 'S. Korea', code: 'KR', lat: 37.57, lng: 126.98, type: 'Zero-Day', severity: 'CRITICAL', breachType: 'Kernel Exploit', dataLost: '1.2M records', ip: '211.234.63.8' },
  { id: 13, city: 'Mumbai', country: 'India', code: 'IN', lat: 19.08, lng: 72.88, type: 'Insider Threat', severity: 'HIGH', breachType: 'Data Leak', dataLost: '450K records', ip: '103.76.41.12' },
  { id: 14, city: 'Paris', country: 'France', code: 'FR', lat: 48.86, lng: 2.35, type: 'Ransomware', severity: 'CRITICAL', breachType: 'Double Extortion', dataLost: '2.1 TB locked', ip: '62.210.105.116' },
  { id: 15, city: 'Toronto', country: 'Canada', code: 'CA', lat: 43.65, lng: -79.38, type: 'Credential Stuffing', severity: 'MEDIUM', breachType: 'Account Takeover', dataLost: '67K accounts', ip: '24.48.0.1' },
  { id: 16, city: 'Singapore', country: 'Singapore', code: 'SG', lat: 1.35, lng: 103.82, type: 'Supply Chain', severity: 'CRITICAL', breachType: 'Package Hijack', dataLost: '12K dev machines', ip: '103.6.84.7' },
  { id: 17, city: 'Mexico City', country: 'Mexico', code: 'MX', lat: 19.43, lng: -99.13, type: 'Phishing', severity: 'MEDIUM', breachType: 'Spear-Phishing', dataLost: '34K emails', ip: '189.203.0.1' },
  { id: 18, city: 'Istanbul', country: 'Turkey', code: 'TR', lat: 41.01, lng: 28.98, type: 'DNS Hijacking', severity: 'HIGH', breachType: 'MitM', dataLost: '890 domains', ip: '31.13.64.51' },
  { id: 19, city: 'Johannesburg', country: 'S. Africa', code: 'ZA', lat: -26.20, lng: 28.04, type: 'Brute Force', severity: 'MEDIUM', breachType: 'SSH Bruteforce', dataLost: '15 servers', ip: '41.191.63.10' },
  { id: 20, city: 'Buenos Aires', country: 'Argentina', code: 'AR', lat: -34.60, lng: -58.38, type: 'Malware', severity: 'HIGH', breachType: 'Trojan Dropper', dataLost: '120 endpoints', ip: '181.46.0.8' },
  { id: 21, city: 'Bangkok', country: 'Thailand', code: 'TH', lat: 13.76, lng: 100.50, type: 'Cryptojacking', severity: 'LOW', breachType: 'Mining Malware', dataLost: '400 CPUs hijacked', ip: '171.96.0.5' },
  { id: 22, city: 'Jakarta', country: 'Indonesia', code: 'ID', lat: -6.21, lng: 106.85, type: 'DDoS', severity: 'MEDIUM', breachType: 'Volumetric Flood', dataLost: '2h downtime', ip: '114.4.0.1' },
  { id: 23, city: 'Bogotá', country: 'Colombia', code: 'CO', lat: 4.71, lng: -74.07, type: 'Ransomware', severity: 'HIGH', breachType: 'LockBit 3.0', dataLost: '560 GB locked', ip: '190.25.0.12' },
  { id: 24, city: 'Cairo', country: 'Egypt', code: 'EG', lat: 30.04, lng: 31.24, type: 'Watering Hole', severity: 'MEDIUM', breachType: 'Drive-by Download', dataLost: '2.3K infections', ip: '41.33.0.8' },
  { id: 25, city: 'Riyadh', country: 'Saudi Arabia', code: 'SA', lat: 24.71, lng: 46.67, type: 'APT', severity: 'CRITICAL', breachType: 'Shamoon Variant', dataLost: '14K workstations', ip: '91.186.0.3' },
  { id: 26, city: 'Kyiv', country: 'Ukraine', code: 'UA', lat: 50.45, lng: 30.52, type: 'Wiper Malware', severity: 'CRITICAL', breachType: 'HermeticWiper', dataLost: '5K systems wiped', ip: '37.73.0.14' },
  { id: 27, city: 'Warsaw', country: 'Poland', code: 'PL', lat: 52.23, lng: 21.01, type: 'C2 Beacon', severity: 'MEDIUM', breachType: 'CobaltStrike', dataLost: '78 beacons', ip: '185.191.0.9' },
  { id: 28, city: 'Hanoi', country: 'Vietnam', code: 'VN', lat: 21.03, lng: 105.85, type: 'Supply Chain', severity: 'HIGH', breachType: 'Firmware Backdoor', dataLost: '45K IoT devices', ip: '14.225.0.6' },
  { id: 29, city: 'Lima', country: 'Peru', code: 'PE', lat: -12.05, lng: -77.04, type: 'Phishing', severity: 'LOW', breachType: 'Fake Invoice', dataLost: '$18K stolen', ip: '190.42.0.11' },
  { id: 30, city: 'Bucharest', country: 'Romania', code: 'RO', lat: 44.43, lng: 26.10, type: 'Brute Force', severity: 'MEDIUM', breachType: 'RDP Brute Force', dataLost: '34 servers', ip: '89.38.0.7' },
  { id: 31, city: 'Nairobi', country: 'Kenya', code: 'KE', lat: -1.29, lng: 36.82, type: 'Social Engineering', severity: 'LOW', breachType: 'SIM Swap', dataLost: '$85K stolen', ip: '41.89.0.3' },
  { id: 32, city: 'Manila', country: 'Philippines', code: 'PH', lat: 14.60, lng: 120.98, type: 'SQL Injection', severity: 'HIGH', breachType: 'Union-based SQLi', dataLost: '780K records', ip: '120.28.0.4' },
];

const TARGET = { lat: 28.61, lng: 77.21, city: 'Delhi', country: 'India' };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Detailed GeoJSON-quality SVG country outlines
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const COUNTRY_PATHS = [
  // North America
  "M 55,90 60,75 65,60 72,50 80,42 95,35 108,30 122,28 135,30 140,35 145,42 148,55 145,65 140,75 135,80 130,88 125,92 120,98 115,105 110,110 106,112 100,108 95,102 90,100 85,95 78,92 72,90 65,88 Z",
  // Central America
  "M 78,125 82,120 88,118 92,122 96,128 100,135 98,140 94,142 90,138 85,132 80,128 Z",
  // South America
  "M 115,150 120,142 128,138 135,140 140,145 145,155 148,168 152,180 150,195 146,210 140,225 134,232 128,236 122,230 118,220 115,208 112,195 110,182 108,170 110,158 Z",
  // Europe
  "M 248,42 255,38 262,35 270,34 278,36 285,38 292,36 298,38 305,42 310,48 308,55 302,58 296,60 290,58 284,56 278,58 272,55 268,52 262,50 255,48 250,45 Z",
  // UK/Ireland
  "M 240,40 244,36 248,34 252,36 254,40 252,44 248,46 244,44 Z",
  // Scandinavia  
  "M 270,22 275,18 282,16 290,18 295,22 298,28 296,34 290,32 285,28 278,26 Z",
  // Africa
  "M 258,82 268,78 278,75 288,78 298,82 305,90 310,100 315,112 312,125 308,138 302,148 296,155 290,158 285,155 278,148 272,140 265,130 260,120 255,108 252,96 255,88 Z",
  // Middle East
  "M 305,58 312,55 320,56 328,60 332,66 330,72 325,76 318,78 310,76 306,70 305,64 Z",
  // Russia/Central Asia
  "M 298,18 310,14 325,12 342,14 360,16 378,14 395,16 408,18 418,22 425,28 420,34 412,38 402,40 390,38 378,36 365,38 352,36 340,34 330,36 320,40 312,38 305,34 300,28 298,22 Z",
  // East Asia (China/Mongolia)
  "M 375,38 385,36 395,38 405,42 412,48 418,55 415,62 408,65 400,68 392,66 385,62 378,58 372,52 370,46 Z",
  // Southeast Asia
  "M 398,72 405,68 412,70 418,75 422,82 420,88 415,92 408,90 402,85 400,78 Z",
  // Japan
  "M 425,40 428,36 432,38 434,42 432,48 429,52 426,50 424,46 Z",
  // Indonesia/Oceania
  "M 395,98 402,95 410,96 418,100 425,105 420,110 412,112 405,108 398,104 Z",
  // Australia
  "M 408,125 418,118 430,115 442,118 452,125 458,135 455,148 448,158 438,162 428,158 418,150 412,140 408,132 Z",
  // New Zealand
  "M 465,155 468,150 472,152 470,158 466,160 Z",
  // India subcontinent
  "M 338,62 345,58 352,60 358,65 355,72 350,80 345,85 340,82 335,76 333,70 335,65 Z",
  // Korea
  "M 418,38 421,35 424,36 425,40 423,44 420,42 Z",
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
//  Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const W = 500; // viewBox width
const H = 280; // viewBox height

function latLngToXY(lat, lng) {
  const x = ((lng + 180) / 360) * W;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = H / 2 - (W * mercN) / (2 * Math.PI);
  return { x: Math.max(5, Math.min(W - 5, x)), y: Math.max(5, Math.min(H - 5, y)) };
}

function severityColor(s) {
  switch (s) {
    case 'CRITICAL': return '#ff1744';
    case 'HIGH': return '#ff5252';
    case 'MEDIUM': return '#ffab40';
    case 'LOW': return '#69f0ae';
    default: return '#00d4ff';
  }
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function ThreatMapPage() {
  const { liveThreats, isConnected } = useSocket();
  const [selectedBreach, setSelectedBreach] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [breachList, setBreachList] = useState(() =>
    BREACH_LOCATIONS.map(b => ({ ...b, timestamp: new Date(Date.now() - Math.random() * 900000).toISOString() }))
  );
  const [activeAttacks, setActiveAttacks] = useState([]);
  const [attackLog, setAttackLog] = useState([]);
  const [totalBlocked, setTotalBlocked] = useState(1247);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });
  const attackIdRef = useRef(100);

  const targetXY = useMemo(() => latLngToXY(TARGET.lat, TARGET.lng), []);

  // ── WebSocket live threats → breach entries ──
  useEffect(() => {
    if (liveThreats.length === 0) return;
    const latest = liveThreats[0];
    if (!latest) return;
    const countryNames = { US: 'USA', CN: 'China', RU: 'Russia', DE: 'Germany', FR: 'France', BR: 'Brazil', JP: 'Japan', GB: 'UK', SG: 'Singapore', AU: 'Australia', KR: 'S. Korea', IN: 'India' };
    const newBreach = {
      id: Date.now(),
      city: latest.city || latest.country || 'Unknown',
      country: countryNames[latest.country] || latest.country || 'Unknown',
      code: latest.country || '??',
      lat: latest.sourceLat || 0,
      lng: latest.sourceLng || 0,
      type: latest.type || 'Unknown',
      severity: latest.severity || 'MEDIUM',
      breachType: 'Live Detection',
      dataLost: 'Analyzing...',
      ip: latest.sourceIP || '0.0.0.0',
      timestamp: latest.timestamp || new Date().toISOString(),
      isLive: true,
    };
    setBreachList(prev => [newBreach, ...prev].slice(0, 40));
  }, [liveThreats]);

  // ── Spawn attack arcs FAST (every 800ms–1.5s) ──
  useEffect(() => {
    const spawn = () => {
      const breach = breachList[Math.floor(Math.random() * breachList.length)];
      const sourceXY = latLngToXY(breach.lat, breach.lng);
      attackIdRef.current += 1;
      const id = attackIdRef.current;

      const newAttack = {
        id,
        sourceX: sourceXY.x, sourceY: sourceXY.y,
        targetX: targetXY.x, targetY: targetXY.y,
        severity: breach.severity,
        city: breach.city, code: breach.code,
        type: breach.type,
        progress: 0,
        startTime: Date.now(),
        duration: 1500 + Math.random() * 1500, // FAST: 1.5s–3s
        particles: [],
      };

      setActiveAttacks(prev => [...prev.slice(-15), newAttack]);
      setAttackLog(prev => [{
        id, city: breach.city, code: breach.code, type: breach.type,
        severity: breach.severity, ip: breach.ip,
        timestamp: new Date().toISOString(),
      }, ...prev].slice(0, 30));
      setTotalBlocked(prev => prev + 1);
    };

    spawn();
    const iv = setInterval(spawn, 800 + Math.random() * 700);
    return () => clearInterval(iv);
  }, [breachList, targetXY]);

  // ── Animate attacks w/ requestAnimationFrame ──
  useEffect(() => {
    let frameId;
    const animate = () => {
      const now = Date.now();
      setActiveAttacks(prev =>
        prev.map(atk => ({ ...atk, progress: Math.min((now - atk.startTime) / atk.duration, 1) }))
            .filter(atk => atk.progress < 1)
      );
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // ── Arc helpers ──
  const createArcPath = useCallback((sx, sy, tx, ty) => {
    const dx = tx - sx, dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curveHeight = Math.min(dist * 0.35, 50);
    const mx = (sx + tx) / 2, my = (sy + ty) / 2 - curveHeight;
    return `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`;
  }, []);

  const getPointOnCurve = useCallback((sx, sy, tx, ty, t) => {
    const dx = tx - sx, dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curveHeight = Math.min(dist * 0.35, 50);
    const mx = (sx + tx) / 2, my = (sy + ty) / 2 - curveHeight;
    return {
      x: (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * mx + t * t * tx,
      y: (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * my + t * t * ty,
    };
  }, []);

  // ── Pan / Zoom handlers ──
  const handleWheel = useCallback(e => {
    e.preventDefault();
    setZoom(prev => Math.max(1, Math.min(5, prev + (e.deltaY > 0 ? -0.3 : 0.3))));
  }, []);

  const handleMouseDown = useCallback(e => {
    if (zoom <= 1) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [zoom, pan]);

  const handleMouseMove = useCallback(e => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  // ── Filtered breaches ──
  const filteredBreaches = filterSeverity === 'all' ? breachList : breachList.filter(b => b.severity === filterSeverity);

  const breachStats = useMemo(() => ({
    total: breachList.length,
    critical: breachList.filter(b => b.severity === 'CRITICAL').length,
    high: breachList.filter(b => b.severity === 'HIGH').length,
    countries: [...new Set(breachList.map(b => b.code))].length,
    liveAttacks: activeAttacks.length,
  }), [breachList, activeAttacks]);

  return (
    <div className="threat-intel-page">
      {/* ── Header ── */}
      <div className="ti-header">
        <div className="ti-header-left">
          <div className="ti-title-icon"><Globe2 size={22} /></div>
          <div>
            <h1>Global Threat Intelligence</h1>
            <p>Real-time attack surface monitoring across {breachStats.countries}+ countries</p>
          </div>
        </div>
        <div className="ti-header-right">
          <div className={`ti-status ${isConnected ? 'online' : 'offline'}`}>
            <Radio size={14} />
            <span>{isConnected ? 'LIVE FEED' : 'OFFLINE'}</span>
          </div>
          <select className="ti-severity-filter" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
            <option value="all">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="ti-stats-bar">
        <div className="ti-stat">
          <Crosshair size={16} color="#ff1744" />
          <div className="ti-stat-content">
            <span className="ti-stat-value">{breachStats.total}</span>
            <span className="ti-stat-label">Active Sources</span>
          </div>
        </div>
        <div className="ti-stat">
          <AlertTriangle size={16} color="#ff1744" />
          <div className="ti-stat-content">
            <span className="ti-stat-value">{breachStats.critical}</span>
            <span className="ti-stat-label">Critical</span>
          </div>
        </div>
        <div className="ti-stat">
          <Shield size={16} color="#ff5252" />
          <div className="ti-stat-content">
            <span className="ti-stat-value">{breachStats.high}</span>
            <span className="ti-stat-label">High</span>
          </div>
        </div>
        <div className="ti-stat">
          <MapPin size={16} color="#00d4ff" />
          <div className="ti-stat-content">
            <span className="ti-stat-value">{breachStats.countries}</span>
            <span className="ti-stat-label">Countries</span>
          </div>
        </div>
        <div className="ti-stat">
          <Zap size={16} color="#a3e635" />
          <div className="ti-stat-content">
            <span className="ti-stat-value">{activeAttacks.length}</span>
            <span className="ti-stat-label">In-Flight</span>
          </div>
        </div>
        <div className="ti-stat">
          <Target size={16} color="#10b981" />
          <div className="ti-stat-content">
            <span className="ti-stat-value">{totalBlocked.toLocaleString()}</span>
            <span className="ti-stat-label">Blocked Today</span>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Map + Sidebar ── */}
      <div className="ti-main-layout">
        {/* ── Map Container ── */}
        <div className="ti-map-container"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Zoom Controls */}
          <div className="ti-zoom-controls">
            <button onClick={() => setZoom(prev => Math.min(5, prev + 0.5))} title="Zoom In">+</button>
            <span>{zoom.toFixed(1)}x</span>
            <button onClick={() => setZoom(prev => Math.max(1, prev - 0.5))} title="Zoom Out">−</button>
            <button onClick={resetView} title="Reset View" className="ti-zoom-reset">⌂</button>
          </div>

          <svg
            className="ti-world-map-svg"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
              transition: isPanning ? 'none' : 'transform 0.3s ease',
            }}
          >
            <defs>
              <filter id="glowSm"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <filter id="glowLg"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <filter id="glowXl"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <radialGradient id="targetPulse" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="oceanBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#030712" />
                <stop offset="100%" stopColor="#0a0f1d" />
              </linearGradient>
            </defs>

            {/* Ocean */}
            <rect width={W} height={H} fill="url(#oceanBg)" />

            {/* Grid */}
            {Array.from({ length: 37 }, (_, i) => (
              <line key={`gv${i}`} x1={i * W / 36} y1="0" x2={i * W / 36} y2={H} stroke="rgba(99,102,241,0.03)" strokeWidth="0.3" />
            ))}
            {Array.from({ length: 19 }, (_, i) => (
              <line key={`gh${i}`} x1="0" y1={i * H / 18} x2={W} y2={i * H / 18} stroke="rgba(99,102,241,0.03)" strokeWidth="0.3" />
            ))}

            {/* Country outlines */}
            {COUNTRY_PATHS.map((path, i) => (
              <path key={i} d={path} fill="rgba(99,102,241,0.05)" stroke="rgba(99,102,241,0.12)" strokeWidth="0.4" />
            ))}

            {/* ── Active Attack Arcs ── */}
            {activeAttacks.map(atk => {
              const path = createArcPath(atk.sourceX, atk.sourceY, atk.targetX, atk.targetY);
              const color = severityColor(atk.severity);
              const pos = getPointOnCurve(atk.sourceX, atk.sourceY, atk.targetX, atk.targetY, atk.progress);
              // Trail dots
              const trailDots = [];
              for (let t = Math.max(0, atk.progress - 0.15); t < atk.progress; t += 0.03) {
                const tp = getPointOnCurve(atk.sourceX, atk.sourceY, atk.targetX, atk.targetY, t);
                trailDots.push(tp);
              }
              return (
                <g key={atk.id}>
                  {/* Dashed guideline */}
                  <path d={path} fill="none" stroke={color} strokeWidth="0.3" opacity={0.08} strokeDasharray="3,2" />
                  {/* Drawn arc up to progress */}
                  <path d={path} fill="none" stroke={color} strokeWidth="0.6" opacity={0.3}
                    strokeDasharray={`${atk.progress * 300} 300`} />
                  {/* Source pulse */}
                  <circle cx={atk.sourceX} cy={atk.sourceY} r="2" fill={color} opacity={0.4}>
                    <animate attributeName="r" values="1.5;3.5;1.5" dur="1s" repeatCount="indefinite" />
                  </circle>
                  {/* Trail particles */}
                  {trailDots.map((td, idx) => (
                    <circle key={idx} cx={td.x} cy={td.y} r={0.4 + idx * 0.15} fill={color} opacity={0.15 + idx * 0.08} />
                  ))}
                  {/* Main projectile */}
                  <circle cx={pos.x} cy={pos.y} r="1.8" fill={color} filter="url(#glowSm)">
                    <animate attributeName="r" values="1;2.5;1" dur="0.4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={pos.x} cy={pos.y} r="0.6" fill="#fff" />
                  {/* City label */}
                  <text x={atk.sourceX} y={atk.sourceY - 5} fill={color} fontSize="3.2" fontWeight="700" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" opacity="0.7">
                    {atk.city}
                  </text>
                </g>
              );
            })}

            {/* ── Breach Points ── */}
            {filteredBreaches.map(breach => {
              const { x, y } = latLngToXY(breach.lat, breach.lng);
              const color = severityColor(breach.severity);
              const isSelected = selectedBreach?.id === breach.id;
              return (
                <g key={breach.id} onClick={() => setSelectedBreach(breach)} style={{ cursor: 'pointer' }}>
                  <circle cx={x} cy={y} r="4" fill="none" stroke={color} strokeWidth="0.3" opacity={0.25}>
                    <animate attributeName="r" values="3;7;3" dur={`${1.5 + Math.random()}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.25;0;0.25" dur={`${1.5 + Math.random()}s`} repeatCount="indefinite" />
                  </circle>
                  <circle cx={x} cy={y} r={isSelected ? 3 : 1.8} fill={color} filter="url(#glowSm)" opacity={0.85} />
                  <circle cx={x} cy={y} r={isSelected ? 1.5 : 0.8} fill="#fff" />
                  {(isSelected || breach.severity === 'CRITICAL') && (
                    <text x={x} y={y - 6} fill={color} fontSize="3" fontWeight="700" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">
                      {breach.city}, {breach.code}
                    </text>
                  )}
                </g>
              );
            })}

            {/* ── Target HQ ── */}
            <circle cx={targetXY.x} cy={targetXY.y} r="16" fill="url(#targetPulse)">
              <animate attributeName="r" values="12;20;12" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={targetXY.x} cy={targetXY.y} r="7" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3">
              <animate attributeName="r" values="5;12;5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={targetXY.x} cy={targetXY.y} r="3" fill="#00d4ff" filter="url(#glowLg)" />
            <circle cx={targetXY.x} cy={targetXY.y} r="1.2" fill="#fff" />
            <text x={targetXY.x} y={targetXY.y + 10} fill="#00d4ff" fontSize="3.5" fontWeight="800" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" filter="url(#glowSm)">
              SHIELD HQ
            </text>

            {/* Legend */}
            <g transform={`translate(6, ${H - 18})`}>
              <rect width="140" height="14" rx="3" fill="rgba(3,7,18,0.85)" stroke="rgba(99,102,241,0.1)" strokeWidth="0.3" />
              <circle cx="10" cy="7" r="2.5" fill="#ff1744" /><text x="16" y="9.5" fill="#94a3b8" fontSize="3" fontFamily="monospace">Critical</text>
              <circle cx="42" cy="7" r="2.5" fill="#ff5252" /><text x="48" y="9.5" fill="#94a3b8" fontSize="3" fontFamily="monospace">High</text>
              <circle cx="68" cy="7" r="2.5" fill="#ffab40" /><text x="74" y="9.5" fill="#94a3b8" fontSize="3" fontFamily="monospace">Medium</text>
              <circle cx="100" cy="7" r="2.5" fill="#69f0ae" /><text x="106" y="9.5" fill="#94a3b8" fontSize="3" fontFamily="monospace">Low</text>
            </g>
          </svg>
        </div>

        {/* ── Sidebar ── */}
        <div className="ti-sidebar">
          {/* Live Attack Feed */}
          <div className="ti-sidebar-section">
            <div className="ti-sidebar-header">
              <Activity size={14} color="#ff1744" />
              <h3>Live Attack Feed</h3>
              <span className="ti-sidebar-count">{attackLog.length}</span>
            </div>
            <div className="ti-attack-feed">
              {attackLog.slice(0, 12).map((atk, i) => (
                <div key={atk.id} className={`ti-feed-item ${i === 0 ? 'ti-feed-new' : ''}`}>
                  <div className="ti-feed-dot" style={{ background: severityColor(atk.severity) }} />
                  <div className="ti-feed-info">
                    <span className="ti-feed-city">{atk.city}, {atk.code}</span>
                    <span className="ti-feed-type">{atk.type}</span>
                  </div>
                  <div className="ti-feed-meta">
                    <span className={`ti-sev-badge ${atk.severity.toLowerCase()}`}>{atk.severity}</span>
                    <span className="ti-feed-time">{timeAgo(atk.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Breach Origins List */}
          <div className="ti-sidebar-section">
            <div className="ti-sidebar-header">
              <MapPin size={14} color="#00d4ff" />
              <h3>Breach Origins</h3>
              <span className="ti-sidebar-count">{filteredBreaches.length}</span>
            </div>
            <div className="ti-breach-list">
              {filteredBreaches.slice(0, 10).map(breach => (
                <div
                  key={breach.id}
                  className={`ti-breach-item ${selectedBreach?.id === breach.id ? 'selected' : ''} ${breach.isLive ? 'live' : ''}`}
                  onClick={() => setSelectedBreach(breach)}
                >
                  <div className="ti-breach-dot" style={{ background: severityColor(breach.severity) }} />
                  <div className="ti-breach-info">
                    <span className="ti-breach-city">
                      {breach.city}, {breach.country}
                      {breach.isLive && <span className="ti-live-badge">LIVE</span>}
                    </span>
                    <span className="ti-breach-type">{breach.type} • {breach.breachType}</span>
                    <span className="ti-breach-ip">{breach.ip} • {breach.dataLost}</span>
                  </div>
                  <span className={`ti-sev-badge ${breach.severity.toLowerCase()}`}>{breach.severity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Detail */}
          {selectedBreach && (
            <div className="ti-detail-panel">
              <div className="ti-detail-header">
                <div>
                  <h4><MapPin size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />{selectedBreach.city}, {selectedBreach.country}</h4>
                  <span className={`ti-sev-badge ${selectedBreach.severity.toLowerCase()}`}>{selectedBreach.severity}</span>
                </div>
              </div>
              <div className="ti-detail-grid">
                <div className="ti-detail-item"><span className="lbl">Attack Type</span><span className="val">{selectedBreach.type}</span></div>
                <div className="ti-detail-item"><span className="lbl">Breach Type</span><span className="val">{selectedBreach.breachType}</span></div>
                <div className="ti-detail-item"><span className="lbl">Source IP</span><span className="val mono">{selectedBreach.ip}</span></div>
                <div className="ti-detail-item"><span className="lbl">Data Impact</span><span className="val" style={{ color: '#ff1744' }}>{selectedBreach.dataLost}</span></div>
                <div className="ti-detail-item"><span className="lbl">Coordinates</span><span className="val mono">{selectedBreach.lat.toFixed(2)}°, {selectedBreach.lng.toFixed(2)}°</span></div>
                <div className="ti-detail-item"><span className="lbl">Detected</span><span className="val">{timeAgo(selectedBreach.timestamp)}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
