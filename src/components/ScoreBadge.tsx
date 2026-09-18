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
        bg: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
        ring: 'text-emerald-600 dark:text-emerald-400',
        label: 'Strong Signal',
        color: 'text-emerald-700 dark:text-emerald-300',
      };
    }
    if (val >= 65) {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
        ring: 'text-blue-600 dark:text-blue-400',
        label: 'Promising',
        color: 'text-blue-700 dark:text-blue-300',
      };
    }
    if (val >= 50) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
        ring: 'text-amber-600 dark:text-amber-400',
        label: 'Needs Refinement',
        color: 'text-amber-700 dark:text-amber-300',
      };
    }
    return {
      bg: 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
      ring: 'text-rose-600 dark:text-rose-400',
      label: 'High Friction',
      color: 'text-rose-700 dark:text-rose-300',
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
