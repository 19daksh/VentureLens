import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
  onClick?: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({
  to,
  label = 'Back',
  className = '',
  onClick,
}) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    } else if (!to) {
      e.preventDefault();
      navigate(-1);
    }
  };

  const baseStyles =
    'inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700 active:scale-98 focus:outline-none focus:ring-2 focus:ring-indigo-500/40';

  if (to) {
    return (
      <Link
        to={to}
        aria-label={label}
        className={`${baseStyles} ${className}`}
      >
        <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 transition-colors" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={`${baseStyles} ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 transition-colors" />
      <span>{label}</span>
    </button>
  );
};
