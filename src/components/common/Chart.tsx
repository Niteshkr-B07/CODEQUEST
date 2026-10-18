import React from 'react';

interface BarData {
  label: string;
  value: number;
  max: number;
  color?: string;
  subtext?: string;
}

export const SimpleBarChart: React.FC<{
  data: BarData[];
  height?: number;
  showValues?: boolean;
}> = ({ data, height = 180, showValues = true }) => {
  return (
    <div className="w-full flex flex-col gap-3 font-mono">
      <div className="flex items-end justify-between gap-3 px-2" style={{ height: `${height}px` }}>
        {data.map((item, idx) => {
          const percentage = item.max > 0 ? Math.min(100, Math.round((item.value / item.max) * 100)) : 0;
          const barColor = item.color || 'from-cyan-500 to-blue-600';

          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] text-cyan-300 pointer-events-none whitespace-nowrap shadow-xl z-20">
                {item.value} / {item.max} ({percentage}%)
              </div>

              {/* Bar */}
              <div className="w-full max-w-[48px] bg-slate-900/80 rounded-t-lg overflow-hidden flex flex-col justify-end p-0.5 border border-slate-800">
                <div
                  className={`w-full bg-gradient-to-t ${barColor} rounded-t transition-all duration-700 shadow-lg group-hover:brightness-110`}
                  style={{ height: `${Math.max(6, percentage)}%` }}
                />
              </div>

              {showValues && (
                <span className="text-[11px] font-bold text-slate-300 mt-2 font-mono">
                  {item.value}
                </span>
              )}
              <span className="text-[11px] text-slate-400 font-sans text-center truncate max-w-[80px] mt-0.5">
                {item.label}
              </span>
              {item.subtext && (
                <span className="text-[9px] text-slate-500 font-mono">{item.subtext}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DonutChart: React.FC<{
  percentage: number;
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}> = ({
  percentage,
  label,
  sublabel,
  size = 140,
  strokeWidth = 12,
  color = '#06B6D4',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1E293B"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold font-mono text-slate-100">{percentage}%</span>
          {sublabel && <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider">{sublabel}</span>}
        </div>
      </div>
      <span className="mt-2 text-xs font-medium text-slate-300 font-mono">{label}</span>
    </div>
  );
};

export const Sparkline: React.FC<{
  points: number[];
  color?: string;
  height?: number;
}> = ({ points, color = '#38BDF8', height = 48 }) => {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;

  const width = 160;
  const step = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });

  const pathD = `M ${coords.join(' L ')}`;

  return (
    <div className="overflow-hidden">
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => {
          const [x, y] = coords[i].split(',').map(Number);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="#0F172A"
              stroke={color}
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
};
