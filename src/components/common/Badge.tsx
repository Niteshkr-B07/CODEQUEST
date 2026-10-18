import React from 'react';

export type BadgeVariant =
  | 'UPCOMING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'QUALIFIED'
  | 'ELIMINATED'
  | 'LOCKED'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'PENDING'
  | 'WINNER'
  | 'easy'
  | 'medium'
  | 'hard';

interface BadgeProps {
  status: string;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, className = '', size = 'md' }) => {
  const normalizedKey = (variant || status).toUpperCase().replace(/\s+/g, '_');

  const variantStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    ACTIVE: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400 animate-pulse',
    },
    QUALIFIED: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      dot: 'bg-cyan-400',
    },
    WINNER: {
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
      border: 'border-amber-400/40',
      dot: 'bg-amber-400 animate-bounce',
    },
    ACCEPTED: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    COMPLETED: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      dot: 'bg-blue-400',
    },
    UPCOMING: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      dot: 'bg-slate-400',
    },
    LOCKED: {
      bg: 'bg-slate-800/40',
      text: 'text-slate-500',
      border: 'border-slate-700/50',
      dot: 'bg-slate-600',
    },
    ELIMINATED: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      dot: 'bg-rose-400',
    },
    WRONG_ANSWER: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      dot: 'bg-rose-400',
    },
    TIME_LIMIT_EXCEEDED: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
    },
    COMPILATION_ERROR: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      dot: 'bg-purple-400',
    },
    RUNTIME_ERROR: {
      bg: 'bg-rose-600/15',
      text: 'text-rose-400',
      border: 'border-rose-500/40',
      dot: 'bg-rose-500',
    },
    PENDING: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30',
      dot: 'bg-yellow-400',
    },
    EASY: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    MEDIUM: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
    },
    HARD: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      dot: 'bg-rose-400',
    },
  };

  const current = variantStyles[normalizedKey] || {
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
    dot: 'bg-slate-400',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  }[size];

  // User-friendly display text
  const labelMap: Record<string, string> = {
    WRONG_ANSWER: 'WRONG ANSWER',
    TIME_LIMIT_EXCEEDED: 'TIME LIMIT',
    COMPILATION_ERROR: 'COMPILE ERROR',
    RUNTIME_ERROR: 'RUNTIME ERROR',
  };

  const displayText = labelMap[normalizedKey] || status.toUpperCase();

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono tracking-wide ${current.bg} ${current.text} ${current.border} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {displayText}
    </span>
  );
};
