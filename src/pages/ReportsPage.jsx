import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const severityData = [
  { name: 'Critical', value: 8, color: '#ff1744' },
  { name: 'High', value: 23, color: '#ff5252' },
  { name: 'Medium', value: 15, color: '#ffab40' },
  { name: 'Low', value: 12, color: '#69f0ae' },
];

const attackTypeData = [
  { type: 'Brute Force', count: 42 },
  { type: 'C2 Beacon', count: 28 },
  { type: 'Exfiltration', count: 18 },
  { type: 'Ransomware', count: 12 },
  { type: 'Phishing', count: 22 },
  { type: 'XSS', count: 8 },
];

const weeklyData = [
  { day: 'Mon', alerts: 45, blocked: 38 },
  { day: 'Tue', alerts: 52, blocked: 44 },
  { day: 'Wed', alerts: 38, blocked: 35 },
  { day: 'Thu', alerts: 65, blocked: 55 },
  { day: 'Fri', alerts: 48, blocked: 42 },
  { day: 'Sat', alerts: 28, blocked: 26 },
  { day: 'Sun', alerts: 32, blocked: 30 },
];

const performanceData = [
  { metric: 'Detection Rate', value: 94 },
  { metric: 'Response Time', value: 87 },
  { metric: 'False Positive', value: 92 },
  { metric: 'Coverage', value: 88 },
  { metric: 'Accuracy', value: 96 },
  { metric: 'Uptime', value: 99 },
];

export default function ReportsPage() {
  return (
    <>
      <div className="alerts-page-header">
        <h2>
          <FileText size={24} color="var(--accent-blue)" /> Security Reports
        </h2>
      </div>

      <div className="reports-grid">
        {/* Severity Distribution */}
        <div className="report-chart-card card">
          <div className="card-header">
            <h3>Severity Distribution</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1a2035',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attack Types */}
        <div className="report-chart-card card">
          <div className="card-header">
            <h3>Attack Types</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attackTypeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="type" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1a2035',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                  }}
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="report-chart-card card">
          <div className="card-header">
            <h3>Weekly Alert Trend</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff5252" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ff5252" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1a2035',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="alerts" stroke="#ff5252" fill="url(#alertGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="blocked" stroke="#10b981" fill="url(#blockedGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Performance */}
        <div className="report-chart-card card">
          <div className="card-header">
            <h3>System Performance</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={performanceData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="metric" stroke="#64748b" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.08)" fontSize={10} />
                <Radar name="Performance" dataKey="value" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip
                  contentStyle={{
                    background: '#1a2035',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
