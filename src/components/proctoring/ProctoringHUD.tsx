import React, { useState } from 'react';
import {
  Camera,
  Mic,
  Maximize2,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp,
  Shield,
  ShieldAlert,
  Volume2,
  X,
  RefreshCw,
  AlertOctagon,
} from 'lucide-react';

interface ProctoringHUDProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraActive: boolean;
  micActive: boolean;
  fullscreenActive: boolean;
  audioLevel?: number;
  tabWarnings: number;
  maxWarnings: number;
  isLocked: boolean;
  lastWarningNotice: string | null;
  isSimulatedStream?: boolean;
  onClearWarning?: () => void;
  onRequestUnlock?: () => void;
  onReEnterFullscreen?: () => void;
}

export const ProctoringHUD: React.FC<ProctoringHUDProps> = ({
  videoRef,
  cameraActive,
  micActive,
  fullscreenActive,
  audioLevel = 0,
  tabWarnings,
  maxWarnings,
  isLocked,
  lastWarningNotice,
  isSimulatedStream,
  onClearWarning,
  onRequestUnlock,
  onReEnterFullscreen,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Ratio of warnings
  const warningRatio = tabWarnings / Math.max(1, maxWarnings);
  const warningColorClass =
    warningRatio >= 0.75
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
      : warningRatio > 0
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  return (
    <>
      {/* 1. Floating Proctor HUD Bar (Top Right) */}
      <div className="fixed top-16 right-4 z-40 transition-all duration-300">
        <div className="bg-[#0A0F1D]/90 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-2.5 shadow-2xl shadow-black/80 flex flex-col gap-2 w-64 max-w-[calc(100vw-32px)]">
          {/* Header row */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 px-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-200 tracking-wider flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                AI PROCTOR
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
              title={isCollapsed ? 'Expand Proctor Preview' : 'Collapse Proctor Preview'}
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Video Preview */}
          {!isCollapsed && (
            <div className="relative aspect-video rounded-xl bg-black border border-slate-800 overflow-hidden shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-rose-400 text-[10px] font-mono">
                  <Camera className="w-5 h-5 mb-1" />
                  Camera Offline
                </div>
              )}

              {/* Status pill on video */}
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-slate-800 text-[9px] font-mono text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isSimulatedStream ? 'REC • SIM' : 'REC • LIVE'}
              </div>

              {/* Mic audio level meter */}
              {micActive && (
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-slate-800/80">
                  <Volume2 className="w-3 h-3 text-cyan-400 shrink-0" />
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-75"
                      style={{ width: `${Math.max(10, audioLevel)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Pills */}
          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono font-bold">
            {/* Camera status */}
            <div
              className={`p-1.5 rounded-lg border flex flex-col items-center justify-center gap-0.5 ${
                cameraActive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <Camera className="w-3 h-3" />
              <span>{cameraActive ? 'Cam On' : 'Cam Lost'}</span>
            </div>

            {/* Mic status */}
            <div
              className={`p-1.5 rounded-lg border flex flex-col items-center justify-center gap-0.5 ${
                micActive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <Mic className="w-3 h-3" />
              <span>{micActive ? 'Mic On' : 'Mic Lost'}</span>
            </div>

            {/* Fullscreen status */}
            <div
              onClick={!fullscreenActive ? onReEnterFullscreen : undefined}
              className={`p-1.5 rounded-lg border flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                fullscreenActive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              }`}
              title={!fullscreenActive ? 'Click to re-enter fullscreen' : 'Fullscreen locked'}
            >
              <Maximize2 className="w-3 h-3" />
              <span>{fullscreenActive ? 'Locked' : 'Fix FS'}</span>
            </div>
          </div>

          {/* Warnings Counter Badge */}
          <div className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-xs font-mono ${warningColorClass}`}>
            <span className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              Tab Warnings:
            </span>
            <span className="font-bold">
              {tabWarnings} / {maxWarnings}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Warning Banner Alert (when a violation happens) */}
      {lastWarningNotice && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-bounce max-w-lg w-full px-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/90 text-slate-950 font-mono font-bold text-xs shadow-2xl flex items-center justify-between gap-3 border border-amber-300">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{lastWarningNotice}</span>
            </div>
            {onClearWarning && (
              <button
                type="button"
                onClick={onClearWarning}
                className="p-1 rounded-lg hover:bg-black/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Session Lock Overlay (when session is locked) */}
      {isLocked && (
        <div className="fixed inset-0 z-50 bg-[#050811]/95 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-[#0A0F1D] border border-rose-500/50 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl shadow-rose-500/10">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto animate-pulse">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                Session Temporarily Locked
              </h2>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                Your competition attempt has been temporarily locked due to repeated tab switching or proctoring policy violations.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 space-y-1 text-left">
              <div className="flex justify-between">
                <span>Total Violations:</span>
                <span className="text-rose-400 font-bold">{tabWarnings} warnings</span>
              </div>
              <div className="flex justify-between">
                <span>Threshold:</span>
                <span className="text-slate-200">{maxWarnings} max permitted</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {onRequestUnlock ? (
                <button
                  type="button"
                  onClick={onRequestUnlock}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-mono font-bold text-xs shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                >
                  Request Administrative Unlock
                </button>
              ) : (
                <p className="text-[11px] font-mono text-amber-400">
                  Please notify the contest admin to review your activity and unlock this session.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
