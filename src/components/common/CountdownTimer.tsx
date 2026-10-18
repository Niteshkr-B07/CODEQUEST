import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  startedAt: string; // ISO string from server
  durationMinutes: number;
  serverTime: string; // ISO string when loaded
  onExpire?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  startedAt,
  durationMinutes,
  serverTime,
  onExpire,
  className = '',
  size = 'md',
}) => {
  // Compute server offset so client clock skew doesn't affect countdown
  const serverOffset = new Date(serverTime).getTime() - Date.now();
  const startTimeMs = new Date(startedAt).getTime();
  const targetEndTimeMs = startTimeMs + durationMinutes * 60 * 1000;

  const calculateRemaining = () => {
    const adjustedNow = Date.now() + serverOffset;
    return Math.max(0, Math.floor((targetEndTimeMs - adjustedNow) / 1000));
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemaining);
  const [hasExpired, setHasExpired] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      if (remaining <= 0 && !hasExpired) {
        setHasExpired(true);
        clearInterval(interval);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMinutes, serverTime]);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const formattedTime =
    hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;

  const isUrgent = remainingSeconds < 120 && remainingSeconds > 0;
  const isCritical = remainingSeconds < 30 && remainingSeconds > 0;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2',
    lg: 'text-base px-4 py-2 gap-2.5 font-bold',
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-lg font-mono font-semibold tracking-wider transition-all duration-300 ${sizeClasses} ${
        isCritical
          ? 'bg-rose-950/80 border border-rose-500 text-rose-300 animate-pulse shadow-lg shadow-rose-950/50'
          : isUrgent
          ? 'bg-amber-950/80 border border-amber-500/70 text-amber-300'
          : 'bg-slate-900/90 border border-cyan-500/30 text-cyan-300 shadow-sm'
      } ${className}`}
    >
      {isCritical ? (
        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
      ) : (
        <Clock className={`w-4 h-4 shrink-0 ${isUrgent ? 'text-amber-400' : 'text-cyan-400'}`} />
      )}
      <span>{formattedTime}</span>
      {isUrgent && <span className="text-[10px] font-sans uppercase font-bold tracking-normal opacity-90">Time Low</span>}
    </div>
  );
};
