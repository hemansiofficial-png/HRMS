'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const data = [
  { name: 'Employees', value: 142 },
  { name: 'Present', value: 126 },
  { name: 'On Leave', value: 8 },
  { name: 'Open Roles', value: 11 }
];

const COLORS = ['#6b4c9a', '#10b981', '#f59e0b', '#4080ff'];

export function OverviewChart() {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6b4c9a" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6b4c9a" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
              padding: '12px',
              fontSize: '13px'
            }}
            cursor={{ fill: '#f5f3fa' }}
          />
          <Bar 
            dataKey="value" 
            radius={[6, 6, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
