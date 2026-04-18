import { useState, useEffect, useMemo } from 'react';
import {
  FileText, TrendingUp, Shield, AlertTriangle, Clock, Target,
  Activity, Zap, BarChart3, PieChart as PieIcon, Radio, ChevronRight,
  ArrowUpRight, ArrowDownRight, Eye, CheckCircle2
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { fetchReportData, fetchReportSummary } from '../api';
import { useSocket } from '../context/SocketContext';

const SEVERITY_COLORS = { Critical: '#ff1744', High: '#ff5252', Medium: '#ffab40', Low: '#69f0ae' };

const ATTACK_BAR_COLORS = [
  '#ff1744', '#ff5252', '#ff7043', '#ffab40', '#ffd740',
  '#69f0ae', '#00d4ff', '#448aff', '#7c4dff', '#e040fb',
];

const TOOLTIP_STYLE = {
  background: 'rgba(15, 20, 37, 0.95)',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#e2e8f0',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  padding: '8px 12px',
};

export default function ReportsPage() {
  const { reportData: liveReport, isConnected } = useSocket();

  const [severityData, setSeverityData] = useState([
    { name: 'Critical', value: 8, color: '#ff1744' },
    { name: 'High', value: 23, color: '#ff5252' },
    { name: 'Medium', value: 15, color: '#ffab40' },
    { name: 'Low', value: 12, color: '#69f0ae' },
  ]);
  const [attackTypeData, setAttackTypeData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [summary, setSummary] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchReportData().then(data => {
      if (data.severityData) setSeverityData(data.severityData);
      if (data.attackTypeData) setAttackTypeData(data.attackTypeData);
      if (data.weeklyData) setWeeklyData(data.weeklyData);
      if (data.performanceData) setPerformanceData(data.performanceData);
    }).catch(() => {});
    fetchReportSummary().then(setSummary).catch(() => {});
  }, []);

  // Update from live WebSocket data
  useEffect(() => {
    if (!liveReport) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (liveReport.severityData) setSeverityData(liveReport.severityData);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (liveReport.attackTypeData) setAttackTypeData(liveReport.attackTypeData);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (liveReport.weeklyData) setWeeklyData(liveReport.weeklyData);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (liveReport.performanceData) setPerformanceData(liveReport.performanceData);
  }, [liveReport]);

  // Derived stats
  const totalAlerts = useMemo(() => severityData.reduce((s, d) => s + d.value, 0), [severityData]);
  const criticalCount = useMemo(() => severityData.find(d => d.name === 'Critical')?.value || 0, [severityData]);
  const topAttack = useMemo(() => {
    if (!attackTypeData.length) return { type: 'N/A', count: 0 };
    return attackTypeData.reduce((a, b) => a.count > b.count ? a : b, attackTypeData[0]);
  }, [attackTypeData]);
  const avgPerf = useMemo(() => {
    if (!performanceData.length) return 0;
    return Math.round(performanceData.reduce((s, d) => s + d.value, 0) / performanceData.length);
  }, [performanceData]);

  const threatLevel = summary?.threatLevel || (criticalCount > 5 ? 'SEVERE' : criticalCount > 2 ? 'HIGH' : 'MODERATE');
  const threatColor = threatLevel === 'SEVERE' ? '#ff1744' : threatLevel === 'HIGH' ? '#ff5252' : '#ffab40';

  return (
    <div className="rp-page">
      {/* ── Header ── */}
      <div className="rp-header">
        <div className="rp-header-left">
          <div className="rp-title-icon"><FileText size={22} /></div>
          <div>
            <h1>Intelligence Reports</h1>
            <p>Security analytics, threat distribution & system performance</p>
          </div>
        </div>
        <div className="rp-header-right">
          <div className={`rp-status ${isConnected ? 'online' : 'offline'}`}>
            <Radio size={12} />
            <span>{isConnected ? 'LIVE DATA' : 'OFFLINE'}</span>
          </div>
          <div className="rp-threat-level" style={{ '--threat-color': threatColor }}>
            <AlertTriangle size={14} />
            <span>Threat Level: <strong>{threatLevel}</strong></span>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="rp-summary-row">
        <div className="rp-summary-card">
          <div className="rp-summary-icon" style={{ background: 'rgba(255,23,68,0.1)', color: '#ff1744' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="rp-summary-content">
            <span className="rp-summary-value">{totalAlerts}</span>
            <span className="rp-summary-label">Total Alerts</span>
          </div>
          <div className="rp-summary-trend up">
            <ArrowUpRight size={14} />
            <span>+{summary?.alertsTrend || 23}%</span>
          </div>
        </div>

        <div className="rp-summary-card">
          <div className="rp-summary-icon" style={{ background: 'rgba(255,82,82,0.1)', color: '#ff5252' }}>
            <Zap size={20} />
          </div>
          <div className="rp-summary-content">
            <span className="rp-summary-value">{criticalCount}</span>
            <span className="rp-summary-label">Critical Threats</span>
          </div>
          <div className="rp-summary-trend up">
            <ArrowUpRight size={14} />
            <span>+{summary?.criticalTrend || 12}%</span>
          </div>
        </div>

        <div className="rp-summary-card">
          <div className="rp-summary-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="rp-summary-content">
            <span className="rp-summary-value">{summary?.resolutionRate || '78.4'}%</span>
            <span className="rp-summary-label">Resolution Rate</span>
          </div>
          <div className="rp-summary-trend down">
            <ArrowDownRight size={14} />
            <span>-2.1%</span>
          </div>
        </div>

        <div className="rp-summary-card">
          <div className="rp-summary-icon" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>
            <Clock size={20} />
          </div>
          <div className="rp-summary-content">
            <span className="rp-summary-value">{summary?.avgResponseTime || '4.2s'}</span>
            <span className="rp-summary-label">Avg Response</span>
          </div>
          <div className="rp-summary-trend down">
            <ArrowDownRight size={14} />
            <span>-15%</span>
          </div>
        </div>

        <div className="rp-summary-card">
          <div className="rp-summary-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <Target size={20} />
          </div>
          <div className="rp-summary-content">
            <span className="rp-summary-value">{avgPerf}%</span>
            <span className="rp-summary-label">System Score</span>
          </div>
          <div className="rp-summary-trend up">
            <ArrowUpRight size={14} />
            <span>+3.2%</span>
          </div>
        </div>
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="rp-charts-row">
        {/* Severity Donut */}
        <div className="rp-chart-card">
          <div className="rp-chart-header">
            <PieIcon size={16} color="#ff5252" />
            <h3>Severity Distribution</h3>
          </div>
          <div className="rp-chart-body" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color || SEVERITY_COLORS[entry.name] || '#00d4ff'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="rp-donut-center">
              <span className="rp-donut-value">{totalAlerts}</span>
              <span className="rp-donut-label">Total</span>
            </div>
          </div>
          {/* Legend */}
          <div className="rp-severity-legend">
            {severityData.map((d, i) => (
              <div key={i} className="rp-legend-item">
                <div className="rp-legend-dot" style={{ background: d.color }} />
                <span className="rp-legend-name">{d.name}</span>
                <span className="rp-legend-value">{d.value}</span>
                <span className="rp-legend-pct">{totalAlerts > 0 ? Math.round((d.value / totalAlerts) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attack Types Bar */}
        <div className="rp-chart-card rp-chart-wide">
          <div className="rp-chart-header">
            <BarChart3 size={16} color="#00d4ff" />
            <h3>Attack Vector Analysis</h3>
            {topAttack.type !== 'N/A' && (
              <span className="rp-chart-highlight">
                Top: <strong>{topAttack.type}</strong> ({topAttack.count})
              </span>
            )}
          </div>
          <div className="rp-chart-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attackTypeData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="type" stroke="#475569" fontSize={10} tickLine={false} angle={-30} textAnchor="end" height={50} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {attackTypeData.map((_, i) => (
                    <Cell key={i} fill={ATTACK_BAR_COLORS[i % ATTACK_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="rp-charts-row">
        {/* Weekly Trend */}
        <div className="rp-chart-card rp-chart-wide">
          <div className="rp-chart-header">
            <TrendingUp size={16} color="#ff5252" />
            <h3>Weekly Alert Trend</h3>
            <span className="rp-chart-subtitle">Alerts vs Blocked</span>
          </div>
          <div className="rp-chart-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="rpAlertGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff5252" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#ff5252" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rpBlockedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                />
                <Area type="monotone" dataKey="alerts" stroke="#ff5252" fill="url(#rpAlertGrad)" strokeWidth={2.5} dot={{ r: 3, fill: '#ff5252' }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="blocked" stroke="#10b981" fill="url(#rpBlockedGrad)" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Performance Radar */}
        <div className="rp-chart-card">
          <div className="rp-chart-header">
            <Activity size={16} color="#8b5cf6" />
            <h3>System Performance</h3>
          </div>
          <div className="rp-chart-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={performanceData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="metric" stroke="#64748b" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.06)" fontSize={9} tick={false} />
                <Radar name="Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.12} strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* Performance score items */}
          <div className="rp-perf-list">
            {performanceData.slice(0, 4).map((d, i) => (
              <div key={i} className="rp-perf-item">
                <span className="rp-perf-name">{d.metric}</span>
                <div className="rp-perf-bar-track">
                  <div className="rp-perf-bar-fill" style={{ width: `${d.value}%`, background: d.value >= 90 ? '#10b981' : d.value >= 75 ? '#00d4ff' : '#ffab40' }} />
                </div>
                <span className="rp-perf-value" style={{ color: d.value >= 90 ? '#10b981' : d.value >= 75 ? '#00d4ff' : '#ffab40' }}>{Math.round(d.value)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
