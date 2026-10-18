import React from 'react';

export default function RiskBadge({ category, score, size = 'md' }) {
  const cat = (category || 'low').toLowerCase();

  const styles = {
    high: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60',
      dot: 'bg-rose-500 animate-pulse',
      label: 'High Risk'
    },
    medium: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60',
      dot: 'bg-amber-500',
      label: 'Medium Risk'
    },
    low: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60',
      dot: 'bg-emerald-500',
      label: 'Low Risk'
    }
  }[cat] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
    label: cat
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3.5 py-1.5 font-semibold'
  }[size] || 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${styles.bg} ${sizeClasses}`}>
      <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
      <span>{styles.label}</span>
      {score !== undefined && (
        <span className="font-mono font-bold ml-0.5">({score})</span>
      )}
    </span>
  );
}
