import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';
import { StartupIdea } from '../types/analysis';

interface ComparisonRadarChartProps {
  ideas: StartupIdea[];
  height?: number;
}

const COLORS = [
  { stroke: '#4f46e5', fill: '#6366f1' }, // Indigo
  { stroke: '#059669', fill: '#10b981' }, // Emerald
  { stroke: '#d97706', fill: '#f59e0b' }, // Amber
];

export const ComparisonRadarChart: React.FC<ComparisonRadarChartProps> = ({ ideas, height = 360 }) => {
  const subjects = [
    { key: 'problem_score', label: 'Problem Strength' },
    { key: 'market_score', label: 'Market Opportunity' },
    { key: 'competition_score', label: 'Moat/Competition' },
    { key: 'revenue_score', label: 'Revenue Potential' },
    { key: 'technical_score', label: 'Tech Feasibility' },
  ];

  const data = subjects.map(sub => {
    const row: any = { subject: sub.label, fullMark: 100 };
    ideas.forEach((idea, idx) => {
      const score = (idea.analysis as any)?.[sub.key] ?? 50;
      row[`idea_${idx}`] = score;
    });
    return row;
  });

  return (
    <div className="w-full h-full min-h-[340px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="68%" data={data}>
          <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            stroke="#cbd5e1"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value: string) => {
              const idx = parseInt(value.replace('idea_', ''), 10);
              const name = ideas[idx]?.title || `Idea ${idx + 1}`;
              return <span className="text-xs font-semibold text-slate-700">{name}</span>;
            }}
          />
          {ideas.map((_, idx) => (
            <Radar
              key={`radar-${idx}`}
              name={`idea_${idx}`}
              dataKey={`idea_${idx}`}
              stroke={COLORS[idx % COLORS.length].stroke}
              fill={COLORS[idx % COLORS.length].fill}
              fillOpacity={0.25}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
