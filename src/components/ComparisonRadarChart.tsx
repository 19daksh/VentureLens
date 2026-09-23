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
import { useTheme } from '../context/ThemeContext';
import { calculateRiskResilienceScore } from './Comparison/SideBySideRadarComparison';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const subjects = [
    { key: 'market_score', label: 'Market Opportunity' },
    { key: 'risk_resilience', label: 'Risk Resilience' },
    { key: 'technical_score', label: 'Tech Feasibility' },
    { key: 'problem_score', label: 'Problem Strength' },
    { key: 'revenue_score', label: 'Revenue Potential' },
    { key: 'competition_score', label: 'Moat/Defensibility' },
  ];

  const data = subjects.map(sub => {
    const row: any = { subject: sub.label, fullMark: 100 };
    ideas.forEach((idea, idx) => {
      let score = 50;
      if (sub.key === 'risk_resilience') {
        score = calculateRiskResilienceScore(idea.analysis?.risks).score;
      } else {
        score = (idea.analysis as any)?.[sub.key] ?? 50;
      }
      row[`idea_${idx}`] = score;
    });
    return row;
  });

  return (
    <div className="w-full h-full min-h-[340px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="68%" data={data}>
          <PolarGrid stroke={isDark ? '#334155' : '#e2e8f0'} strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: isDark ? '#cbd5e1' : '#334155', fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
            stroke={isDark ? '#475569' : '#cbd5e1'}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: isDark ? '1px solid #334155' : 'none',
              color: '#fff',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value: string) => {
              const idx = parseInt(value.replace('idea_', ''), 10);
              const name = ideas[idx]?.title || `Idea ${idx + 1}`;
              return <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{name}</span>;
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
