import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ThreatChart({ data = [] }) {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="hour"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
          />
          <Tooltip
            contentStyle={{
              background: '#1a2035',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e2e8f0',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
          <Line
            type="monotone"
            dataKey="bruteForce"
            name="Brute Force"
            stroke="#ff5252"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#ff5252' }}
          />
          <Line
            type="monotone"
            dataKey="c2Beacon"
            name="C2 Beacon"
            stroke="#ffab40"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#ffab40' }}
          />
          <Line
            type="monotone"
            dataKey="exfiltration"
            name="Exfiltration"
            stroke="#00d4ff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#00d4ff' }}
          />
          <Line
            type="monotone"
            dataKey="lateralMovement"
            name="Lateral Movement"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#8b5cf6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
