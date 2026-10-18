import React from 'react';
import { Code2, Shield, Terminal, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#060912] border-t border-slate-900 py-10 px-4 lg:px-8 text-slate-500 font-sans text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono font-bold text-slate-300">CODEQUEST</div>
            <div className="text-[11px] text-slate-400">Think. Code. Debug. Conquer.</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sandboxed Judge0-Grade Sandbox</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Multi-Language Runner</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Real-Time Tie-Breaker Engine</span>
          </div>
        </div>

        <div className="text-center md:text-right text-[11px] text-slate-400 font-mono">
          &copy; 2026 CODEQUEST Competitive Coding Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
