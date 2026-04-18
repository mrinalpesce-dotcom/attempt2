import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ThreatChart({ data = [] }) {
  return (
    <div className="chart-container" style={{ width: '100%', height: '100%', padding: '10px 0' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
          {/* Soft, minimalist horizontal grids only */}
          <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" strokeOpacity={0.06} vertical={false} />
          
          <XAxis
            dataKey="hour"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={12}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={12}
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              color: '#f8fafc',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
            }}
            itemStyle={{ fontWeight: 500, padding: '2px 0' }}
            cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          
          <Legend
            wrapperStyle={{ fontSize: '13px', paddingTop: '15px' }}
            iconType="circle"
          />
          
          <Line 
            type="monotone" 
            dataKey="bruteForce" 
            name="Brute Force" 
            stroke="#ef4444" 
            strokeWidth={2.5} 
            dot={false}
            activeDot={{ r: 5, fill: '#ef4444', stroke: '#0f172a', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="c2Beacon" 
            name="C2 Beacon" 
            stroke="#f59e0b" 
            strokeWidth={2.5} 
            dot={false}
            activeDot={{ r: 5, fill: '#f59e0b', stroke: '#0f172a', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="lateralMovement" 
            name="Lateral Move" 
            stroke="#8b5cf6" 
            strokeWidth={2.5} 
            dot={false}
            activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#0f172a', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="exfiltration" 
            name="Exfiltration" 
            stroke="#0ea5e9" 
            strokeWidth={2.5} 
            dot={false}
            activeDot={{ r: 5, fill: '#0ea5e9', stroke: '#0f172a', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
