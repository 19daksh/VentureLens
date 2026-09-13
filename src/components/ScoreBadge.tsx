import React from 'react';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, size = 'md', showLabel = false }) => {
  const getTheme = (val: number) => {
    if (val >= 80) {
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        ring: 'text-emerald-600',
        label: 'Strong Signal',
        color: 'text-emerald-700',
      };
    }
    if (val >= 65) {
      return {
        bg: 'bg-blue-50 border-blue-200 text-blue-700',
        ring: 'text-blue-600',
        label: 'Promising',
        color: 'text-blue-700',
      };
    }
    if (val >= 50) {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-700',
        ring: 'text-amber-600',
        label: 'Needs Refinement',
        color: 'text-amber-700',
      };
    }
    return {
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      ring: 'text-rose-600',
      label: 'High Friction',
      color: 'text-rose-700',
    };
  };

  const theme = getTheme(score);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-bold',
    md: 'text-sm px-2.5 py-1 font-bold',
    lg: 'text-base px-3.5 py-1.5 font-extrabold',
    xl: 'text-2xl px-5 py-3 font-extrabold tracking-tight',
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span
        id={`score-badge-${score}`}
        className={`inline-flex items-center rounded-lg border shadow-xs ${theme.bg} ${sizeClasses[size]}`}
      >
        <span>{score}</span>
        <span className="text-[0.7em] opacity-70 font-semibold ml-0.5">/100</span>
      </span>
      {showLabel && (
        <span className={`text-xs font-semibold ${theme.color}`}>
          {theme.label}
        </span>
      )}
    </div>
  );
};
