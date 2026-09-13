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

interface RadarScoreChartProps {
  analysis: FullAnalysis;
  height?: number;
}

export const RadarScoreChart: React.FC<RadarScoreChartProps> = ({ analysis, height = 300 }) => {
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
          <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            stroke="#cbd5e1"
          />
          <Tooltip
            formatter={(value: any) => [`${value}/100`, 'Validation Score']}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 500,
            }}
          />
          <Radar
            name="Startup Score"
            dataKey="score"
            stroke="#4f46e5"
            fill="#6366f1"
            fillOpacity={0.4}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
