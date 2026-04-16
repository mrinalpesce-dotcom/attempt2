import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Globe2, Filter, MapPin, Crosshair, Activity, Shield, AlertTriangle, Eye } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { fetchThreats } from '../api';

// Detailed world map continent paths
const WORLD_MAP_PATHS = {
  northAmerica: "M 30,28 L 35,22 38,18 42,16 48,15 55,16 62,14 68,16 73,18 78,22 82,28 84,32 86,36 88,40 87,44 84,46 80,48 76,50 72,52 68,54 65,58 62,60 58,58 55,54 52,50 48,48 44,44 40,42 36,38 32,34 Z",
  southAmerica: "M 72,62 L 76,58 80,56 82,60 84,64 86,68 88,72 87,78 84,82 80,86 78,90 75,94 72,96 70,92 68,88 67,84 66,80 65,76 64,72 66,68 68,64 Z",
  europe: "M 130,20 L 135,18 140,16 146,17 150,19 155,18 160,20 162,24 158,26 154,28 150,30 146,28 142,26 138,28 134,25 131,22 Z",
  africa: "M 130,42 L 136,38 142,36 148,38 154,40 158,44 160,50 162,56 160,62 158,68 154,74 150,78 146,80 142,78 138,74 134,70 130,66 128,60 126,54 128,48 Z",
  asia: "M 158,14 L 164,12 170,10 178,12 186,14 194,12 200,14 208,16 216,18 224,16 232,18 238,20 240,24 236,28 232,30 228,34 224,36 220,38 216,36 210,34 204,36 200,40 196,38 190,36 184,38 178,36 172,34 166,30 162,26 160,22 Z M 210,40 L 216,42 220,46 224,50 220,54 214,52 210,48 208,44 Z M 232,38 L 238,36 244,38 248,42 246,46 240,48 236,44 234,40 Z",
  oceania: "M 236,62 L 242,58 250,56 258,58 264,62 268,66 266,72 262,76 256,78 250,76 244,72 240,68 238,64 Z M 270,56 L 274,54 278,56 276,60 272,58 Z",
};

const BREACH_LOCATIONS = [
  { id: 1, city: 'Moscow', country: 'Russia', code: 'RU', lat: 55.76, lng: 37.62, type: 'Brute Force', severity: 'CRITICAL', breachType: 'Credential Theft', dataLost: '2.3M records', ip: '45.12.73.201', timestamp: new Date(Date.now() - 120000).toISOString() },
  { id: 2, city: 'Beijing', country: 'China', code: 'CN', lat: 39.90, lng: 116.40, type: 'Data Exfiltration', severity: 'HIGH', breachType: 'Database Dump', dataLost: '5.1M records', ip: '103.224.182.250', timestamp: new Date(Date.now() - 300000).toISOString() },
  { id: 3, city: 'São Paulo', country: 'Brazil', code: 'BR', lat: -23.55, lng: -46.63, type: 'Ransomware', severity: 'CRITICAL', breachType: 'File Encryption', dataLost: '890 GB encrypted', ip: '177.54.23.89', timestamp: new Date(Date.now() - 60000).toISOString() },
  { id: 4, city: 'London', country: 'UK', code: 'GB', lat: 51.51, lng: -0.13, type: 'Phishing', severity: 'MEDIUM', breachType: 'Credential Harvest', dataLost: '12K accounts', ip: '81.2.69.142', timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 5, city: 'San Francisco', country: 'USA', code: 'US', lat: 37.77, lng: -122.42, type: 'SQL Injection', severity: 'HIGH', breachType: 'API Breach', dataLost: '1.7M records', ip: '104.28.16.5', timestamp: new Date(Date.now() - 180000).toISOString() },
  { id: 6, city: 'Pyongyang', country: 'N. Korea', code: 'KP', lat: 39.02, lng: 125.75, type: 'APT', severity: 'CRITICAL', breachType: 'State-Sponsored', dataLost: '3.8M records', ip: '175.45.176.3', timestamp: new Date(Date.now() - 45000).toISOString() },
  { id: 7, city: 'Lagos', country: 'Nigeria', code: 'NG', lat: 6.52, lng: 3.38, type: 'Social Engineering', severity: 'MEDIUM', breachType: 'BEC Fraud', dataLost: '$240K stolen', ip: '41.190.2.33', timestamp: new Date(Date.now() - 900000).toISOString() },
  { id: 8, city: 'Tehran', country: 'Iran', code: 'IR', lat: 35.69, lng: 51.39, type: 'DDoS', severity: 'HIGH', breachType: 'Service Disruption', dataLost: '6h downtime', ip: '5.160.136.27', timestamp: new Date(Date.now() - 420000).toISOString() },
  { id: 9, city: 'Berlin', country: 'Germany', code: 'DE', lat: 52.52, lng: 13.41, type: 'C2 Beacon', severity: 'MEDIUM', breachType: 'Botnet Control', dataLost: '340 endpoints', ip: '185.220.101.1', timestamp: new Date(Date.now() - 240000).toISOString() },
  { id: 10, city: 'Tokyo', country: 'Japan', code: 'JP', lat: 35.68, lng: 139.69, type: 'XSS', severity: 'LOW', breachType: 'Cookie Theft', dataLost: '8K sessions', ip: '133.242.16.4', timestamp: new Date(Date.now() - 780000).toISOString() },
  { id: 11, city: 'Sydney', country: 'Australia', code: 'AU', lat: -33.87, lng: 151.21, type: 'Lateral Movement', severity: 'HIGH', breachType: 'Network Pivot', dataLost: '23 systems', ip: '103.25.201.11', timestamp: new Date(Date.now() - 550000).toISOString() },
  { id: 12, city: 'Seoul', country: 'South Korea', code: 'KR', lat: 37.57, lng: 126.98, type: 'Zero-Day', severity: 'CRITICAL', breachType: 'Kernel Exploit', dataLost: '1.2M records', ip: '211.234.63.8', timestamp: new Date(Date.now() - 30000).toISOString() },
];

const TARGET = { lat: 28.61, lng: 77.21, city: 'Delhi', country: 'India' };

function latLngToXY(lat, lng, w, h) {
  const x = ((lng + 180) / 360) * w;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = h / 2 - (w * mercN) / (2 * Math.PI);
  return { x: Math.max(0, Math.min(w, x)), y: Math.max(0, Math.min(h, y)) };
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

export default function ThreatMapPage() {
  const { liveThreats, isConnected } = useSocket();
  const [selectedBreach, setSelectedBreach] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [activeAttacks, setActiveAttacks] = useState([]);
  const [breachList, setBreachList] = useState(BREACH_LOCATIONS);
  const attackIdRef = useRef(100);

  const W = 780;
  const H = 420;

  const targetXY = useMemo(() => latLngToXY(TARGET.lat, TARGET.lng, W, H), []);

  // Add WebSocket threats as breach entries
  useEffect(() => {
    if (liveThreats.length === 0) return;
    const latest = liveThreats[0];
    if (!latest) return;

    const countryNames = { US: 'USA', CN: 'China', RU: 'Russia', DE: 'Germany', FR: 'France', BR: 'Brazil', JP: 'Japan', GB: 'UK', SG: 'Singapore', AU: 'Australia' };
    const newBreach = {
      id: Date.now(),
      city: latest.country || 'Unknown',
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

    setBreachList((prev) => [newBreach, ...prev].slice(0, 20));
  }, [liveThreats]);

  // Animate attack arcs
  useEffect(() => {
    const spawn = () => {
      const breach = breachList[Math.floor(Math.random() * breachList.length)];
      const sourceXY = latLngToXY(breach.lat, breach.lng, W, H);
      attackIdRef.current += 1;

      setActiveAttacks((prev) => [...prev.slice(-8), {
        id: attackIdRef.current,
        sourceX: sourceXY.x,
        sourceY: sourceXY.y,
        targetX: targetXY.x,
        targetY: targetXY.y,
        severity: breach.severity,
        city: breach.city,
        progress: 0,
        startTime: Date.now(),
        duration: 3000 + Math.random() * 2000,
      }]);
    };
    spawn();
    const interval = setInterval(spawn, 2500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [breachList, targetXY]);

  // Animate
  useEffect(() => {
    let frameId;
    const animate = () => {
      const now = Date.now();
      setActiveAttacks((prev) =>
        prev
          .map((atk) => ({ ...atk, progress: Math.min((now - atk.startTime) / atk.duration, 1) }))
          .filter((atk) => atk.progress < 1)
      );
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const createArcPath = (sx, sy, tx, ty) => {
    const dx = tx - sx;
    const dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curveHeight = Math.min(dist * 0.3, 70);
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2 - curveHeight;
    return `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`;
  };

  const getPointOnCurve = (sx, sy, tx, ty, t) => {
    const dx = tx - sx; const dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curveHeight = Math.min(dist * 0.3, 70);
    const mx = (sx + tx) / 2; const my = (sy + ty) / 2 - curveHeight;
    return {
      x: (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * mx + t * t * tx,
      y: (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * my + t * t * ty,
    };
  };

  const filteredBreaches = filterSeverity === 'all'
    ? breachList
    : breachList.filter((b) => b.severity === filterSeverity);

  const breachStats = {
    total: breachList.length,
    critical: breachList.filter((b) => b.severity === 'CRITICAL').length,
    high: breachList.filter((b) => b.severity === 'HIGH').length,
    countries: [...new Set(breachList.map((b) => b.code))].length,
  };

  return (
    <>
      <div className="alerts-page-header">
        <h2>
          <Globe2 size={24} color="var(--accent-purple)" /> Global Threat & Breach Map
          <div className="live-dot-inline" />
          <span className="live-text-label">LIVE</span>
        </h2>
        <div className="filter-bar">
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} id="map-severity-filter">
            <option value="all">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Map Stats */}
      <div className="map-stats-bar">
        <div className="map-stats-item">
          <Crosshair size={14} color="var(--accent-red)" />
          <span className="map-stats-value">{breachStats.total}</span>
          <span className="map-stats-label">Active Breaches</span>
        </div>
        <div className="map-stats-item">
          <AlertTriangle size={14} color="var(--severity-critical)" />
          <span className="map-stats-value">{breachStats.critical}</span>
          <span className="map-stats-label">Critical</span>
        </div>
        <div className="map-stats-item">
          <Shield size={14} color="var(--severity-high)" />
          <span className="map-stats-value">{breachStats.high}</span>
          <span className="map-stats-label">High</span>
        </div>
        <div className="map-stats-item">
          <MapPin size={14} color="var(--accent-cyan)" />
          <span className="map-stats-value">{breachStats.countries}</span>
          <span className="map-stats-label">Countries</span>
        </div>
        <div className="map-stats-item">
          <Activity size={14} color="var(--accent-green)" />
          <span className="map-stats-value">{activeAttacks.length}</span>
          <span className="map-stats-label">Live Attacks</span>
        </div>
      </div>

      {/* Full-Page Map + Sidebar */}
      <div className="threat-map-layout">
        <div className="threat-map-main">
          <svg className="threat-map-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="mapGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <filter id="mapStrongGlow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <radialGradient id="mapTargetPulse" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="mapOceanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#060a14" />
                <stop offset="100%" stopColor="#0a0f1d" />
              </linearGradient>
            </defs>

            {/* Background */}
            <rect width={W} height={H} fill="url(#mapOceanGrad)" />

            {/* Grid lines */}
            {Array.from({ length: 19 }, (_, i) => (
              <line key={`gv${i}`} x1={i * W / 18} y1="0" x2={i * W / 18} y2={H} stroke="rgba(99,102,241,0.04)" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 11 }, (_, i) => (
              <line key={`gh${i}`} x1="0" y1={i * H / 10} x2={W} y2={i * H / 10} stroke="rgba(99,102,241,0.04)" strokeWidth="0.5" />
            ))}

            {/* Continents */}
            {Object.entries(WORLD_MAP_PATHS).map(([name, path]) => (
              <path key={name} d={path} fill="rgba(99,102,241,0.06)" stroke="rgba(99,102,241,0.15)" strokeWidth="0.7" />
            ))}

            {/* Attack arcs */}
            {activeAttacks.map((atk) => {
              const path = createArcPath(atk.sourceX, atk.sourceY, atk.targetX, atk.targetY);
              const color = severityColor(atk.severity);
              const pos = getPointOnCurve(atk.sourceX, atk.sourceY, atk.targetX, atk.targetY, atk.progress);
              return (
                <g key={atk.id}>
                  <path d={path} fill="none" stroke={color} strokeWidth="0.5" opacity={0.12} strokeDasharray="4,3" />
                  <circle cx={atk.sourceX} cy={atk.sourceY} r="2.5" fill={color} opacity={0.5}>
                    <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={pos.x} cy={pos.y} r="2" fill={color} filter="url(#mapGlow)">
                    <animate attributeName="r" values="1.5;3;1.5" dur="0.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={pos.x} cy={pos.y} r="0.8" fill="#fff" />
                  <text x={atk.sourceX} y={atk.sourceY - 6} fill={color} fontSize="4.5" fontWeight="600" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">{atk.city}</text>
                </g>
              );
            })}

            {/* Breach location markers */}
            {filteredBreaches.map((breach) => {
              const { x, y } = latLngToXY(breach.lat, breach.lng, W, H);
              const color = severityColor(breach.severity);
              const isSelected = selectedBreach?.id === breach.id;
              return (
                <g key={breach.id} onClick={() => setSelectedBreach(breach)} style={{ cursor: 'pointer' }}>
                  {/* Pulse ring */}
                  <circle cx={x} cy={y} r="6" fill="none" stroke={color} strokeWidth="0.5" opacity={0.3}>
                    <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                  </circle>
                  {/* Core dot */}
                  <circle cx={x} cy={y} r={isSelected ? 4 : 2.5} fill={color} filter="url(#mapGlow)" opacity={0.9} />
                  <circle cx={x} cy={y} r={isSelected ? 2 : 1.2} fill="#fff" />
                  {/* Label for selected / critical */}
                  {(isSelected || breach.severity === 'CRITICAL') && (
                    <text x={x} y={y - 8} fill={color} fontSize="4.5" fontWeight="700" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">
                      {breach.city}, {breach.code}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Target location - HQ */}
            <circle cx={targetXY.x} cy={targetXY.y} r="20" fill="url(#mapTargetPulse)">
              <animate attributeName="r" values="16;24;16" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx={targetXY.x} cy={targetXY.y} r="9" fill="none" stroke="#00d4ff" strokeWidth="0.8" opacity="0.4">
              <animate attributeName="r" values="7;14;7" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={targetXY.x} cy={targetXY.y} r="4" fill="#00d4ff" filter="url(#mapStrongGlow)" />
            <circle cx={targetXY.x} cy={targetXY.y} r="2" fill="#fff" />
            <text x={targetXY.x} y={targetXY.y + 14} fill="#00d4ff" fontSize="5.5" fontWeight="700" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" filter="url(#mapGlow)">
              SHIELD HQ
            </text>

            {/* Legend */}
            <g transform={`translate(10, ${H - 25})`}>
              <rect width="200" height="20" rx="4" fill="rgba(10,14,26,0.85)" />
              <circle cx="12" cy="10" r="3" fill="#ff1744" /><text x="20" y="13" fill="#94a3b8" fontSize="4">Critical</text>
              <circle cx="60" cy="10" r="3" fill="#ff5252" /><text x="68" y="13" fill="#94a3b8" fontSize="4">High</text>
              <circle cx="100" cy="10" r="3" fill="#ffab40" /><text x="108" y="13" fill="#94a3b8" fontSize="4">Medium</text>
              <circle cx="148" cy="10" r="3" fill="#69f0ae" /><text x="156" y="13" fill="#94a3b8" fontSize="4">Low</text>
            </g>
          </svg>
        </div>

        {/* Breach Details Sidebar */}
        <div className="threat-map-sidebar">
          <div className="tms-header">
            <h3><MapPin size={14} /> Breach Origins</h3>
            <span className="tms-count">{filteredBreaches.length} sources</span>
          </div>
          <div className="tms-list">
            {filteredBreaches.map((breach) => (
              <div
                key={breach.id}
                className={`tms-item ${selectedBreach?.id === breach.id ? 'active' : ''} ${breach.isLive ? 'tms-live' : ''}`}
                onClick={() => setSelectedBreach(breach)}
              >
                <div className="tms-sev-dot" style={{ background: severityColor(breach.severity) }} />
                <div className="tms-info">
                  <div className="tms-city">
                    {breach.city}, {breach.country}
                    {breach.isLive && <span className="tms-live-badge">LIVE</span>}
                  </div>
                  <div className="tms-type">{breach.type} • {breach.breachType}</div>
                  <div className="tms-data">
                    <span className="tms-ip">{breach.ip}</span>
                    <span className="tms-loss">{breach.dataLost}</span>
                  </div>
                </div>
                <span className={`severity-badge ${breach.severity.toLowerCase()}`}>{breach.severity}</span>
              </div>
            ))}
          </div>

          {/* Selected Breach Detail */}
          {selectedBreach && (
            <div className="tms-detail">
              <div className="tms-detail-header">
                <h4><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />{selectedBreach.city}, {selectedBreach.country}</h4>
                <span className={`severity-badge ${selectedBreach.severity.toLowerCase()}`}>{selectedBreach.severity}</span>
              </div>
              <div className="tms-detail-grid">
                <div className="tms-detail-item">
                  <span className="label">Attack Type</span>
                  <span className="val">{selectedBreach.type}</span>
                </div>
                <div className="tms-detail-item">
                  <span className="label">Breach Type</span>
                  <span className="val">{selectedBreach.breachType}</span>
                </div>
                <div className="tms-detail-item">
                  <span className="label">Source IP</span>
                  <span className="val mono">{selectedBreach.ip}</span>
                </div>
                <div className="tms-detail-item">
                  <span className="label">Data Impact</span>
                  <span className="val" style={{ color: 'var(--accent-red)' }}>{selectedBreach.dataLost}</span>
                </div>
                <div className="tms-detail-item">
                  <span className="label">Coordinates</span>
                  <span className="val mono">{selectedBreach.lat.toFixed(2)}°, {selectedBreach.lng.toFixed(2)}°</span>
                </div>
                <div className="tms-detail-item">
                  <span className="label">Detected</span>
                  <span className="val">{new Date(selectedBreach.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
