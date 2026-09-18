import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { FullAnalysis } from '../types/analysis';
import { useTheme } from '../context/ThemeContext';

interface RadarScoreChartProps {
  analysis: FullAnalysis;
  height?: number;
}

export const RadarScoreChart: React.FC<RadarScoreChartProps> = ({ analysis, height = 300 }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const data = [
    { subject: 'Problem Strength', score: analysis.problem_score, fullMark: 100 },
    { subject: 'Market TAM/SAM', score: analysis.market_score, fullMark: 100 },
    { subject: 'Moat & Defensibility', score: analysis.competition_score, fullMark: 100 },
    { subject: 'Revenue & Economics', score: analysis.revenue_score, fullMark: 100 },
    { subject: 'Tech Feasibility', score: analysis.technical_score, fullMark: 100 },
  ];

  return (
    <div className="w-full h-full min-h-[280px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
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
            formatter={(value: any) => [`${value}/100`, 'Validation Score']}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: isDark ? '1px solid #334155' : 'none',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 500,
            }}
          />
          <Radar
            name="Startup Score"
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={isDark ? 0.45 : 0.35}
            strokeWidth={2.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
