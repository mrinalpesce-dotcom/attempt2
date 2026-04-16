import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

// ═══════════════════════════════════════════════════════════════════
// DETAILED WORLD MAP — Realistic continent outlines (GeoJSON-derived paths)
// ═══════════════════════════════════════════════════════════════════
const WORLD_PATHS = [
  // North America
  "M 48,36 L 50,32 54,28 58,24 62,22 66,20 72,18 78,17 84,18 90,17 94,18 96,20 100,22 104,24 106,28 108,30 110,34 108,38 106,42 104,46 102,48 98,50 96,52 94,56 90,58 86,56 84,54 80,52 76,54 72,56 70,58 68,62 66,58 64,56 60,52 58,48 56,46 52,44 50,42 48,40 Z",
  // Greenland
  "M 92,10 L 96,8 102,7 108,8 112,10 114,14 112,18 108,20 104,19 100,18 96,16 94,13 Z",
  // South America
  "M 86,64 L 90,60 94,58 96,62 98,66 100,70 102,74 102,80 100,84 98,88 96,92 94,96 92,100 90,102 88,100 86,96 84,92 82,88 80,84 78,80 78,76 78,72 80,68 82,66 Z",
  // Europe
  "M 140,20 L 144,18 148,16 154,17 158,18 162,16 166,18 170,20 172,22 174,24 172,28 168,30 166,32 162,34 158,32 154,30 150,28 148,30 146,32 142,30 140,28 138,24 Z",
  // UK/Ireland
  "M 136,22 L 138,20 140,18 142,20 141,23 139,24 137,23 Z",
  // Scandinavia
  "M 150,12 L 154,10 158,11 160,14 158,18 155,16 152,14 Z",
  // Africa
  "M 142,38 L 148,36 154,34 160,36 166,38 170,42 172,48 174,54 172,60 170,66 168,72 164,78 160,82 156,84 152,82 148,78 144,74 140,70 138,64 136,58 134,52 136,46 138,42 Z",
  // Middle East
  "M 172,30 L 178,28 184,30 188,32 192,34 190,38 186,40 182,38 178,36 174,34 Z",
  // Russia/Central Asia
  "M 170,12 L 178,10 186,8 196,10 206,8 216,10 226,8 236,10 244,12 252,14 258,16 260,20 256,22 250,24 244,22 238,24 232,22 226,24 220,22 214,24 208,22 202,24 196,26 192,28 186,26 180,24 176,22 172,18 Z",
  // India
  "M 196,34 L 200,32 204,34 208,38 210,42 208,48 206,52 202,56 198,54 196,50 194,46 192,42 194,38 Z",
  // China/East Asia
  "M 218,22 L 224,20 232,22 240,24 248,26 254,28 258,30 256,34 252,36 248,38 244,40 240,38 236,36 232,38 228,36 224,34 220,32 218,28 Z",
  // Southeast Asia
  "M 232,42 L 238,40 244,42 248,44 252,46 250,50 246,52 242,50 240,48 236,46 234,44 Z",
  // Japan
  "M 260,26 L 264,24 266,26 268,30 266,34 264,32 262,30 260,28 Z",
  // Korea
  "M 254,28 L 256,26 258,28 258,32 256,30 Z",
  // Indonesia
  "M 238,54 L 244,52 250,54 256,52 262,54 264,56 260,58 254,58 248,58 242,56 Z",
  // Australia
  "M 248,66 L 254,62 262,60 270,62 278,64 282,68 280,74 276,78 270,82 264,80 258,78 252,76 248,72 246,68 Z",
  // New Zealand
  "M 286,76 L 290,74 292,78 290,82 288,80 286,78 Z",
  // Taiwan
  "M 252,38 L 254,36 256,38 254,40 Z",
];

// ═══════════════════════════════════════════════════════════════════
// 40+ CITY NODES — Major global cyber targets & threat origins
// ═══════════════════════════════════════════════════════════════════
const CITY_DATA = [
  { id: 'nyc', city: 'New York', country: 'US', lat: 40.71, lng: -74.01, threat: 3 },
  { id: 'sf', city: 'San Francisco', country: 'US', lat: 37.77, lng: -122.42, threat: 2 },
  { id: 'dc', city: 'Washington DC', country: 'US', lat: 38.90, lng: -77.04, threat: 4 },
  { id: 'chi', city: 'Chicago', country: 'US', lat: 41.88, lng: -87.63, threat: 2 },
  { id: 'la', city: 'Los Angeles', country: 'US', lat: 34.05, lng: -118.24, threat: 2 },
  { id: 'tor', city: 'Toronto', country: 'CA', lat: 43.65, lng: -79.38, threat: 1 },
  { id: 'mex', city: 'Mexico City', country: 'MX', lat: 19.43, lng: -99.13, threat: 1 },
  { id: 'spo', city: 'São Paulo', country: 'BR', lat: -23.55, lng: -46.63, threat: 2 },
  { id: 'rio', city: 'Rio de Janeiro', country: 'BR', lat: -22.91, lng: -43.17, threat: 1 },
  { id: 'bog', city: 'Bogotá', country: 'CO', lat: 4.71, lng: -74.07, threat: 1 },
  { id: 'lon', city: 'London', country: 'GB', lat: 51.51, lng: -0.13, threat: 4 },
  { id: 'par', city: 'Paris', country: 'FR', lat: 48.86, lng: 2.35, threat: 2 },
  { id: 'ber', city: 'Berlin', country: 'DE', lat: 52.52, lng: 13.41, threat: 3 },
  { id: 'ams', city: 'Amsterdam', country: 'NL', lat: 52.37, lng: 4.90, threat: 2 },
  { id: 'sto', city: 'Stockholm', country: 'SE', lat: 59.33, lng: 18.07, threat: 1 },
  { id: 'rom', city: 'Rome', country: 'IT', lat: 41.90, lng: 12.50, threat: 1 },
  { id: 'kyv', city: 'Kyiv', country: 'UA', lat: 50.45, lng: 30.52, threat: 3 },
  { id: 'mos', city: 'Moscow', country: 'RU', lat: 55.76, lng: 37.62, threat: 5 },
  { id: 'stp', city: 'St. Petersburg', country: 'RU', lat: 59.93, lng: 30.32, threat: 4 },
  { id: 'teh', city: 'Tehran', country: 'IR', lat: 35.69, lng: 51.39, threat: 4 },
  { id: 'dub', city: 'Dubai', country: 'AE', lat: 25.20, lng: 55.27, threat: 1 },
  { id: 'lag', city: 'Lagos', country: 'NG', lat: 6.52, lng: 3.38, threat: 3 },
  { id: 'nai', city: 'Nairobi', country: 'KE', lat: -1.29, lng: 36.82, threat: 1 },
  { id: 'joh', city: 'Johannesburg', country: 'ZA', lat: -26.20, lng: 28.04, threat: 2 },
  { id: 'cai', city: 'Cairo', country: 'EG', lat: 30.04, lng: 31.24, threat: 2 },
  { id: 'del', city: 'Delhi', country: 'IN', lat: 28.61, lng: 77.21, threat: 3 },
  { id: 'mum', city: 'Mumbai', country: 'IN', lat: 19.08, lng: 72.88, threat: 2 },
  { id: 'ban', city: 'Bangalore', country: 'IN', lat: 12.97, lng: 77.59, threat: 2 },
  { id: 'isa', city: 'Islamabad', country: 'PK', lat: 33.69, lng: 73.04, threat: 2 },
  { id: 'bei', city: 'Beijing', country: 'CN', lat: 39.90, lng: 116.40, threat: 5 },
  { id: 'sha', city: 'Shanghai', country: 'CN', lat: 31.23, lng: 121.47, threat: 4 },
  { id: 'she', city: 'Shenzhen', country: 'CN', lat: 22.54, lng: 114.06, threat: 3 },
  { id: 'tok', city: 'Tokyo', country: 'JP', lat: 35.68, lng: 139.69, threat: 2 },
  { id: 'seo', city: 'Seoul', country: 'KR', lat: 37.57, lng: 126.98, threat: 3 },
  { id: 'pyo', city: 'Pyongyang', country: 'KP', lat: 39.02, lng: 125.75, threat: 5 },
  { id: 'tai', city: 'Taipei', country: 'TW', lat: 25.03, lng: 121.57, threat: 2 },
  { id: 'sgp', city: 'Singapore', country: 'SG', lat: 1.35, lng: 103.82, threat: 2 },
  { id: 'hcm', city: 'Ho Chi Minh', country: 'VN', lat: 10.82, lng: 106.63, threat: 2 },
  { id: 'bkk', city: 'Bangkok', country: 'TH', lat: 13.76, lng: 100.50, threat: 1 },
  { id: 'syd', city: 'Sydney', country: 'AU', lat: -33.87, lng: 151.21, threat: 2 },
];

// ═══════════════════════════════════════════════════════════════════
// ATTACK TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════
const ATTACK_TYPES = [
  { type: 'Data Exfiltration', severity: 'CRITICAL', color: '#ff1744', protocol: 'TCP/443' },
  { type: 'Ransomware', severity: 'CRITICAL', color: '#ff1744', protocol: 'SMB/445' },
  { type: 'APT Intrusion', severity: 'CRITICAL', color: '#d50000', protocol: 'TCP/8443' },
  { type: 'Brute Force SSH', severity: 'HIGH', color: '#ff5252', protocol: 'SSH/22' },
  { type: 'SQL Injection', severity: 'HIGH', color: '#ff6e40', protocol: 'HTTP/80' },
  { type: 'Zero-Day Exploit', severity: 'CRITICAL', color: '#ff1744', protocol: 'TCP/0' },
  { type: 'DDoS Flood', severity: 'HIGH', color: '#ff5252', protocol: 'UDP/*' },
  { type: 'C2 Beacon', severity: 'MEDIUM', color: '#ffab40', protocol: 'DNS/53' },
  { type: 'Credential Stuffing', severity: 'HIGH', color: '#ff5252', protocol: 'HTTPS/443' },
  { type: 'Phishing Campaign', severity: 'MEDIUM', color: '#ffab40', protocol: 'SMTP/25' },
  { type: 'Malware Delivery', severity: 'HIGH', color: '#ff5252', protocol: 'HTTP/80' },
  { type: 'Port Scan', severity: 'LOW', color: '#69f0ae', protocol: 'TCP/*' },
  { type: 'Lateral Movement', severity: 'HIGH', color: '#ff5252', protocol: 'RDP/3389' },
  { type: 'Supply Chain', severity: 'CRITICAL', color: '#ff1744', protocol: 'HTTPS/443' },
];

const TARGET_HQ = { lat: 28.61, lng: 77.21, city: 'Delhi', country: 'SHIELD HQ' };

// ═══════════════════════════════════════════════════════════════════
// CANVAS-BASED RENDERER — 60fps smooth animations
// ═══════════════════════════════════════════════════════════════════
const W = 600;
const H = 340;

function latLngToXY(lat, lng) {
  const x = ((lng + 180) / 360) * W;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = H / 2 - (W * mercN) / (2 * Math.PI);
  return { x: Math.max(4, Math.min(W - 4, x)), y: Math.max(4, Math.min(H - 4, y)) };
}

function randomIP() {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function formatRecords(n) {
  if (n === 0) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toString();
}

function randomHex(len) {
  const chars = '0123456789ABCDEF';
  let r = '';
  for (let i = 0; i < len; i++) r += chars[Math.floor(Math.random() * 16)];
  return r;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function AttackMap() {
  const { liveThreats } = useSocket();
  const canvasRef = useRef(null);
  const stateRef = useRef({
    attacks: [],
    recentHits: [],
    scanAngle: 0,
    time: 0,
    particles: [],
  });
  const attackIdRef = useRef(0);

  const [attackLog, setAttackLog] = useState([]);
  const [totalAttacks, setTotalAttacks] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [totalDataBreached, setTotalDataBreached] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [countryStats, setCountryStats] = useState({});
  const [hexStream, setHexStream] = useState([]);
  const [threatLevel, setThreatLevel] = useState('ELEVATED');
  const [hoveredAttack, setHoveredAttack] = useState(null);

  const targetXY = useMemo(() => latLngToXY(TARGET_HQ.lat, TARGET_HQ.lng), []);
  const cityPositions = useMemo(() =>
    CITY_DATA.map(c => ({ ...c, ...latLngToXY(c.lat, c.lng) })),
  []);

  // Parse SVG path to canvas path
  const parseSVGPath = useCallback((pathStr) => {
    const commands = pathStr.match(/[MLQCZ][^MLQCZ]*/g) || [];
    return commands.map(cmd => {
      const type = cmd[0];
      const nums = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
      return { type, nums };
    });
  }, []);

  const worldPathsParsed = useMemo(() => WORLD_PATHS.map(p => parseSVGPath(p)), [parseSVGPath]);

  // Generate attack
  const generateAttack = useCallback(() => {
    const source = cityPositions[Math.floor(Math.random() * cityPositions.length)];
    const atkDef = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
    attackIdRef.current += 1;

    const toHQ = Math.random() > 0.2;
    let dest;
    if (toHQ) {
      dest = { x: targetXY.x, y: targetXY.y, city: 'SHIELD HQ', country: 'IN' };
    } else {
      const destCity = cityPositions[Math.floor(Math.random() * cityPositions.length)];
      dest = { x: destCity.x, y: destCity.y, city: destCity.city, country: destCity.country };
    }

    const dataSize = (() => {
      if (atkDef.severity === 'CRITICAL') return `${(Math.random() * 4 + 0.5).toFixed(1)} TB`;
      if (atkDef.severity === 'HIGH') return `${(Math.random() * 500 + 50).toFixed(0)} GB`;
      return `${(Math.random() * 100 + 10).toFixed(0)} MB`;
    })();

    const records = atkDef.severity === 'CRITICAL' 
      ? Math.floor(Math.random() * 50000000) + 1000000
      : atkDef.severity === 'HIGH'
      ? Math.floor(Math.random() * 5000000) + 100000
      : Math.floor(Math.random() * 100000) + 1000;

    return {
      id: attackIdRef.current,
      sx: source.x, sy: source.y,
      tx: dest.x, ty: dest.y,
      sourceCity: source.city, sourceCountry: source.country,
      targetCity: dest.city, targetCountry: dest.country,
      type: atkDef.type, severity: atkDef.severity,
      color: atkDef.color, protocol: atkDef.protocol,
      ip: randomIP(),
      dataSize, records,
      progress: 0,
      startTime: Date.now(),
      duration: 1600 + Math.random() * 2200,
      trailLength: 8 + Math.floor(Math.random() * 6),
    };
  }, [targetXY, cityPositions]);

  // Hex stream generator
  useEffect(() => {
    const interval = setInterval(() => {
      setHexStream(prev => {
        const newLine = `0x${randomHex(8)} ${randomHex(4)} ${randomHex(4)} ${randomHex(4)} ${randomHex(12)}`;
        return [newLine, ...prev].slice(0, 8);
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Threat level cycling
  useEffect(() => {
    const interval = setInterval(() => {
      const levels = ['ELEVATED', 'HIGH', 'SEVERE', 'CRITICAL'];
      setThreatLevel(levels[Math.floor(Math.random() * levels.length)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Spawn new attacks
  useEffect(() => {
    const spawn = () => {
      const count = Math.random() > 0.4 ? 2 : 1;
      const state = stateRef.current;
      const newAtks = Array.from({ length: count }, () => generateAttack());
      state.attacks = [...state.attacks.slice(-18), ...newAtks];
    };
    spawn();
    const interval = setInterval(spawn, 700 + Math.random() * 1000);
    return () => clearInterval(interval);
  }, [generateAttack]);

  // Live WebSocket threats
  useEffect(() => {
    if (liveThreats.length === 0) return;
    const latest = liveThreats[0];
    if (!latest) return;
    const src = latLngToXY(latest.sourceLat || 0, latest.sourceLng || 0);
    attackIdRef.current += 1;
    const wsAttack = {
      id: attackIdRef.current, sx: src.x, sy: src.y,
      tx: targetXY.x, ty: targetXY.y,
      sourceCity: latest.country || 'Unknown', sourceCountry: latest.country || '??',
      targetCity: 'SHIELD HQ', targetCountry: 'IN',
      type: latest.type || 'Unknown', severity: latest.severity || 'HIGH',
      color: '#ff1744', protocol: 'TCP/*',
      ip: latest.sourceIP || randomIP(),
      dataSize: '???', records: 0, progress: 0,
      startTime: Date.now(), duration: 2500, trailLength: 10,
    };
    stateRef.current.attacks = [...stateRef.current.attacks.slice(-18), wsAttack];
  }, [liveThreats, targetXY]);

  // Canvas drawing functions
  const drawPath = useCallback((ctx, parsed, fillColor, strokeColor, strokeWidth) => {
    ctx.beginPath();
    for (const cmd of parsed) {
      switch (cmd.type) {
        case 'M': ctx.moveTo(cmd.nums[0], cmd.nums[1]); break;
        case 'L': {
          for (let i = 0; i < cmd.nums.length; i += 2) {
            ctx.lineTo(cmd.nums[i], cmd.nums[i + 1]);
          }
          break;
        }
        case 'Z': ctx.closePath(); break;
      }
    }
    if (fillColor) { ctx.fillStyle = fillColor; ctx.fill(); }
    if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeWidth || 0.7; ctx.stroke(); }
  }, []);

  const getPointOnCurve = useCallback((sx, sy, tx, ty, t) => {
    const dx = tx - sx, dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curve = Math.min(dist * 0.4, 90);
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2 - curve;
    const x = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * mx + t * t * tx;
    const y = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * my + t * t * ty;
    return { x, y };
  }, []);

  const drawCurvedLine = useCallback((ctx, sx, sy, tx, ty, color, width, opacity, dash) => {
    const dx = tx - sx, dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curve = Math.min(dist * 0.4, 90);
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2 - curve;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(mx, my, tx, ty);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = opacity;
    if (dash) ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // MAIN ANIMATION LOOP — Canvas 60fps
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameId;
    let lastSpawnParticle = 0;

    const animate = (timestamp) => {
      const state = stateRef.current;
      const now = Date.now();
      state.time = timestamp;
      state.scanAngle = (state.scanAngle + 0.8) % 360;

      // Canvas sizing
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cw = rect.width;
      const ch = rect.height;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const scaleX = cw / W;
      const scaleY = ch / H;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (cw - W * scale) / 2;
      const offsetY = (ch - H * scale) / 2;

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // ─── Background ───
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#060810');
      bgGrad.addColorStop(0.5, '#0a0e1a');
      bgGrad.addColorStop(1, '#060810');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // ─── Animated scan line (horizontal) ───
      const scanY = (timestamp * 0.02) % H;
      const scanGrad = ctx.createLinearGradient(0, scanY - 6, 0, scanY + 6);
      scanGrad.addColorStop(0, 'rgba(0,212,255,0)');
      scanGrad.addColorStop(0.5, 'rgba(0,212,255,0.03)');
      scanGrad.addColorStop(1, 'rgba(0,212,255,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 6, W, 12);

      // ─── Grid lines ───
      ctx.globalAlpha = 0.04;
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 0.3;
      for (let i = 0; i <= 24; i++) {
        ctx.beginPath();
        ctx.moveTo(i * W / 24, 0);
        ctx.lineTo(i * W / 24, H);
        ctx.stroke();
      }
      for (let i = 0; i <= 12; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * H / 12);
        ctx.lineTo(W, i * H / 12);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ─── Continent outlines ───
      for (const parsed of worldPathsParsed) {
        drawPath(ctx, parsed, 'rgba(25,35,70,0.5)', 'rgba(80,110,220,0.15)', 0.7);
      }

      // ─── Connection lines between high-threat cities (subtle mesh) ───
      const highCities = cityPositions.filter(c => c.threat >= 4);
      ctx.globalAlpha = 0.03;
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 0.3;
      for (let i = 0; i < highCities.length; i++) {
        for (let j = i + 1; j < highCities.length; j++) {
          ctx.beginPath();
          ctx.moveTo(highCities[i].x, highCities[i].y);
          ctx.lineTo(highCities[j].x, highCities[j].y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // ─── City nodes ───
      for (const c of cityPositions) {
        const r = 1 + c.threat * 0.4;
        const isHigh = c.threat >= 4;
        const pulse = Math.sin(timestamp * 0.003 + c.x) * 0.5 + 0.5;

        if (isHigh) {
          // Pulsing outer ring
          const outerR = r * 2 + pulse * r * 2;
          ctx.beginPath();
          ctx.arc(c.x, c.y, outerR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,23,68,${0.04 + pulse * 0.04})`;
          ctx.fill();
        }

        // Outer glow
        ctx.beginPath();
        ctx.arc(c.x, c.y, r * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = isHigh ? `rgba(255,82,82,${0.1 + pulse * 0.1})` : `rgba(74,108,247,${0.06 + pulse * 0.04})`;
        ctx.fill();

        // Main dot
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isHigh ? '#ff5252' : '#4a6cf7';
        ctx.globalAlpha = 0.4 + c.threat * 0.12;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Bright core
        ctx.beginPath();
        ctx.arc(c.x, c.y, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = isHigh ? '#ff8a80' : '#7c9bff';
        ctx.fill();
      }

      // ─── Update attacks ───
      const completed = [];
      state.attacks = state.attacks.filter(atk => {
        const elapsed = now - atk.startTime;
        atk.progress = Math.min(elapsed / atk.duration, 1);
        if (atk.progress >= 1) {
          completed.push(atk);
          return false;
        }
        return true;
      });

      // Process completed attacks
      if (completed.length > 0) {
        state.recentHits = [
          ...completed.map(c => ({ ...c, hitTime: now })),
          ...state.recentHits,
        ].slice(0, 10);

        setAttackLog(log => [
          ...completed.map(c => ({
            id: c.id, sourceCity: c.sourceCity, sourceCountry: c.sourceCountry,
            targetCity: c.targetCity, targetCountry: c.targetCountry,
            type: c.type, severity: c.severity, color: c.color,
            ip: c.ip, dataSize: c.dataSize, records: c.records,
            protocol: c.protocol,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
          })),
          ...log,
        ].slice(0, 14));

        setTotalAttacks(t => t + completed.length);
        for (const c of completed) {
          const sizeNum = parseFloat(c.dataSize);
          if (c.dataSize.includes('TB')) setTotalDataBreached(d => d + sizeNum * 1000);
          else if (c.dataSize.includes('GB')) setTotalDataBreached(d => d + sizeNum);
          else setTotalDataBreached(d => d + sizeNum / 1000);
          setTotalRecords(r => r + c.records);
          setCountryStats(cs => ({ ...cs, [c.sourceCountry]: (cs[c.sourceCountry] || 0) + 1 }));
        }

        // Spawn impact particles
        for (const c of completed) {
          for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
            const speed = 0.3 + Math.random() * 0.8;
            state.particles.push({
              x: c.tx, y: c.ty,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
              decay: 0.015 + Math.random() * 0.01,
              color: c.color,
              size: 0.5 + Math.random() * 1,
            });
          }
        }
      }

      setActiveCount(state.attacks.length);

      // ─── Draw attack arcs ───
      for (const atk of state.attacks) {
        // Dashed background arc
        drawCurvedLine(ctx, atk.sx, atk.sy, atk.tx, atk.ty, atk.color, 0.4, 0.08, [3, 5]);

        // Trail particles behind projectile
        for (let i = 1; i <= atk.trailLength; i++) {
          const t = Math.max(0, atk.progress - i * 0.02);
          if (t > 0) {
            const pp = getPointOnCurve(atk.sx, atk.sy, atk.tx, atk.ty, t);
            const fade = 1 - i / atk.trailLength;
            ctx.beginPath();
            ctx.arc(pp.x, pp.y, Math.max(0.3, 1.5 * fade), 0, Math.PI * 2);
            ctx.fillStyle = atk.color;
            ctx.globalAlpha = fade * 0.5;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        // Source node pulse
        const sourcePulse = Math.sin(timestamp * 0.005) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(atk.sx, atk.sy, 2 + sourcePulse * 3, 0, Math.PI * 2);
        ctx.fillStyle = atk.color;
        ctx.globalAlpha = 0.1 + sourcePulse * 0.15;
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(atk.sx, atk.sy, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = atk.color;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Moving projectile
        const pos = getPointOnCurve(atk.sx, atk.sy, atk.tx, atk.ty, atk.progress);

        // 1) Outer glow
        const glowGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 6);
        glowGrad.addColorStop(0, atk.color + '40');
        glowGrad.addColorStop(1, atk.color + '00');
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // 2) Core
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = atk.color;
        ctx.fill();

        // 3) White-hot center
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Source city label
        ctx.fillStyle = atk.color;
        ctx.globalAlpha = 0.8;
        ctx.font = "bold 3.5px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.fillText(atk.sourceCity, atk.sx, atk.sy - 5);
        ctx.globalAlpha = 1;
      }

      // ─── Impact particles ───
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });

      // ─── Impact flashes at target ───
      state.recentHits = state.recentHits.filter(hit => {
        const age = (now - hit.hitTime) / 2000;
        if (age > 1) return false;
        const op = 1 - age;

        // Expanding rings
        for (let ring = 0; ring < 3; ring++) {
          const r = (6 + age * 25) * (1 + ring * 0.3);
          ctx.beginPath();
          ctx.arc(hit.tx, hit.ty, r, 0, Math.PI * 2);
          ctx.strokeStyle = ring === 0 ? '#ffffff' : hit.color;
          ctx.lineWidth = ring === 0 ? 0.6 : 0.3;
          ctx.globalAlpha = op * (0.4 - ring * 0.12);
          ctx.stroke();
        }

        // Flash fill
        const flashGrad = ctx.createRadialGradient(hit.tx, hit.ty, 0, hit.tx, hit.ty, 8 + age * 20);
        flashGrad.addColorStop(0, `rgba(255,255,255,${op * 0.3})`);
        flashGrad.addColorStop(0.3, hit.color + Math.floor(op * 80).toString(16).padStart(2, '0'));
        flashGrad.addColorStop(1, hit.color + '00');
        ctx.beginPath();
        ctx.arc(hit.tx, hit.ty, 8 + age * 20, 0, Math.PI * 2);
        ctx.fillStyle = flashGrad;
        ctx.fill();

        ctx.globalAlpha = 1;
        return true;
      });

      // ─── SHIELD HQ — Radar ───
      const tx = targetXY.x;
      const ty = targetXY.y;
      const sa = state.scanAngle;

      // Outer radar rings
      for (let r = 8; r <= 22; r += 7) {
        ctx.beginPath();
        ctx.arc(tx, ty, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,212,255,0.08)';
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }

      // Radar sweep cone
      const sweepAngle = sa * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.arc(tx, ty, 22, sweepAngle - 0.5, sweepAngle, false);
      ctx.closePath();
      const sweepGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 22);
      sweepGrad.addColorStop(0, 'rgba(0,212,255,0.12)');
      sweepGrad.addColorStop(1, 'rgba(0,212,255,0)');
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + Math.cos(sweepAngle) * 22, ty + Math.sin(sweepAngle) * 22);
      ctx.strokeStyle = 'rgba(0,212,255,0.4)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Pulsing rings
      const hqPulse = Math.sin(timestamp * 0.003) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(tx, ty, 10 + hqPulse * 10, 0, Math.PI * 2);
      const pulseGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 10 + hqPulse * 10);
      pulseGrad.addColorStop(0, 'rgba(0,212,255,0.2)');
      pulseGrad.addColorStop(0.5, 'rgba(0,212,255,0.05)');
      pulseGrad.addColorStop(1, 'rgba(0,212,255,0)');
      ctx.fillStyle = pulseGrad;
      ctx.fill();

      // Core
      const coreGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 4);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, '#00d4ff');
      coreGrad.addColorStop(1, 'rgba(0,212,255,0.3)');
      ctx.beginPath();
      ctx.arc(tx, ty, 4, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // White center
      ctx.beginPath();
      ctx.arc(tx, ty, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Crosshair
      ctx.strokeStyle = 'rgba(0,212,255,0.5)';
      ctx.lineWidth = 0.5;
      const chLen = 8;
      const chGap = 4;
      ctx.beginPath(); ctx.moveTo(tx - chLen, ty); ctx.lineTo(tx - chGap, ty); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx + chGap, ty); ctx.lineTo(tx + chLen, ty); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx, ty - chLen); ctx.lineTo(tx, ty - chGap); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx, ty + chGap); ctx.lineTo(tx, ty + chLen); ctx.stroke();

      // HQ Label
      ctx.fillStyle = '#00d4ff';
      ctx.font = "800 5px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.9;
      ctx.fillText('SHIELD HQ', tx, ty + 15);
      ctx.globalAlpha = 1;

      // Coordinate readout
      ctx.fillStyle = 'rgba(0,212,255,0.4)';
      ctx.font = "400 3px 'JetBrains Mono', monospace";
      ctx.fillText(`${TARGET_HQ.lat.toFixed(2)}°N ${TARGET_HQ.lng.toFixed(2)}°E`, tx, ty + 20);

      ctx.restore();

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [worldPathsParsed, cityPositions, targetXY, drawPath, getPointOnCurve, drawCurvedLine]);

  // Top attacking countries
  const topCountries = useMemo(() =>
    Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 6),
  [countryStats]);

  const threatLevelColor = {
    ELEVATED: '#ffab40',
    HIGH: '#ff5252',
    SEVERE: '#ff1744',
    CRITICAL: '#d50000',
  };

  return (
    <div className="atk-map-root">
      {/* ═══ Main Map Area ═══ */}
      <div className="atk-map-main">
        <canvas ref={canvasRef} className="atk-map-canvas" />

        {/* ═══ Overlay HUD — Top Left ═══ */}
        <div className="atk-hud atk-hud-tl">
          <div className="atk-hud-title">
            <span className="atk-hud-dot pulse-red" />
            GLOBAL THREAT OPERATIONS CENTER
          </div>
          <div className="atk-hud-row">
            <div className="atk-hud-metric">
              <span className="atk-hud-val red">{totalAttacks + activeCount}</span>
              <span className="atk-hud-label">TOTAL INTRUSIONS</span>
            </div>
            <div className="atk-hud-metric">
              <span className="atk-hud-val cyan">{activeCount}</span>
              <span className="atk-hud-label">ACTIVE NOW</span>
            </div>
          </div>
        </div>

        {/* ═══ Overlay HUD — Top Right ═══ */}
        <div className="atk-hud atk-hud-tr">
          <div className="atk-hud-title">
            <span className="atk-hud-dot pulse-orange" />
            BREACH TELEMETRY
          </div>
          <div className="atk-hud-row">
            <div className="atk-hud-metric">
              <span className="atk-hud-val orange">{totalDataBreached.toFixed(1)} GB</span>
              <span className="atk-hud-label">DATA EXFILTRATED</span>
            </div>
            <div className="atk-hud-metric">
              <span className="atk-hud-val purple">{formatRecords(totalRecords)}</span>
              <span className="atk-hud-label">RECORDS COMPROMISED</span>
            </div>
          </div>
        </div>

        {/* ═══ Threat Level Badge ═══ */}
        <div className="atk-threat-level" style={{ '--tl-color': threatLevelColor[threatLevel] }}>
          <div className="atk-tl-dot" />
          <span className="atk-tl-text">THREAT LEVEL:</span>
          <span className="atk-tl-value">{threatLevel}</span>
        </div>

        {/* ═══ Hex Data Stream — Bottom Left ═══ */}
        <div className="atk-hex-stream">
          {hexStream.map((line, i) => (
            <div key={i} className="atk-hex-line" style={{ opacity: 1 - i * 0.12 }}>
              {line}
            </div>
          ))}
        </div>

        {/* ═══ Legend ═══ */}
        <div className="atk-legend">
          <div className="atk-legend-item"><span className="atk-ldot" style={{ background: '#ff1744', boxShadow: '0 0 6px #ff1744' }} /> CRITICAL</div>
          <div className="atk-legend-item"><span className="atk-ldot" style={{ background: '#ff5252', boxShadow: '0 0 6px #ff5252' }} /> HIGH</div>
          <div className="atk-legend-item"><span className="atk-ldot" style={{ background: '#ffab40', boxShadow: '0 0 6px #ffab40' }} /> MEDIUM</div>
          <div className="atk-legend-item"><span className="atk-ldot" style={{ background: '#69f0ae', boxShadow: '0 0 6px #69f0ae' }} /> LOW</div>
        </div>
      </div>

      {/* ═══ Live Breach Feed ═══ */}
      <div className="atk-feed">
        <div className="atk-feed-head">
          <div className="atk-feed-title">
            <span className="atk-feed-dot" />
            LIVE BREACH FEED
          </div>
          <span className="atk-feed-count">{attackLog.length} events</span>
        </div>

        {/* Top attacking origins */}
        {topCountries.length > 0 && (
          <div className="atk-origins">
            <div className="atk-origins-label">TOP THREAT ORIGINS</div>
            <div className="atk-origins-list">
              {topCountries.map(([country, count]) => (
                <div key={country} className="atk-origin-item">
                  <span className="atk-origin-code">{country}</span>
                  <div className="atk-origin-bar">
                    <div className="atk-origin-fill" style={{ width: `${Math.min(100, (count / (topCountries[0]?.[1] || 1)) * 100)}%` }} />
                  </div>
                  <span className="atk-origin-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="atk-feed-list">
          {attackLog.length === 0 && (
            <div className="atk-feed-empty">
              <span className="atk-feed-empty-icon">◉</span>
              Scanning network traffic...
            </div>
          )}
          {attackLog.map(entry => (
            <div key={entry.id} className="atk-feed-entry">
              <div className="atk-feed-sev-bar" style={{ background: entry.color }} />
              <div className="atk-feed-body">
                <div className="atk-feed-type">
                  <span className="atk-feed-type-name">{entry.type}</span>
                  <span className="atk-feed-sev" style={{ color: entry.color, borderColor: entry.color + '44' }}>{entry.severity}</span>
                </div>
                <div className="atk-feed-route">
                  <span className="atk-feed-city">{entry.sourceCity}</span>
                  <span className="atk-feed-arrow">→</span>
                  <span className="atk-feed-city">{entry.targetCity}</span>
                </div>
                <div className="atk-feed-details">
                  <span className="atk-feed-ip">{entry.ip}</span>
                  <span className="atk-feed-proto">{entry.protocol}</span>
                  {entry.records > 0 && <span className="atk-feed-data">{formatRecords(entry.records)} rec</span>}
                  <span className="atk-feed-time">{entry.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
