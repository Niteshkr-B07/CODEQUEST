import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Code2,
  Trophy,
  ShieldAlert,
  UserCheck,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onToggleSidebar }) => {
  const { user, logout, demoLogin } = useAuth();
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleDemoSwitch = async (role: 'participant' | 'admin', email?: string) => {
    setShowDemoMenu(false);
    await demoLogin(role, email);
    if (role === 'admin') {
      onNavigate('/admin/dashboard');
    } else {
      onNavigate('/dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#080C16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 select-none">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Brand Logo & Sidebar toggle */}
        <div className="flex items-center gap-3">
          {user && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => onNavigate(user ? (user.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight font-mono text-slate-100 group-hover:text-cyan-400 transition-colors">
                CODE<span className="text-cyan-400">QUEST</span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-semibold -mt-1">
                Competitive Coding Platform
              </span>
            </div>
          </div>
        </div>

        {/* Global Live Competition Ticker */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-slate-400">CODEQUEST Arena:</span>
          <span className="text-emerald-400 font-semibold">ALL 4 ROUNDS LIVE</span>
        </div>

        {/* Right Nav: Instant Demo Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {/* Quick 1-Click Demo Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold transition-all shadow-sm"
              title="Instant switch demo accounts"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Role Switcher</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs font-mono animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 text-[10px] uppercase text-slate-400 tracking-wider font-semibold border-b border-slate-800">
                  Switch Active Persona
                </div>
                <button
                  onClick={() => handleDemoSwitch('admin')}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-bold text-purple-300">Master Admin</div>
                      <div className="text-[10px] text-slate-400">admin@codequest.dev</div>
                    </div>
                  </div>
                  {user?.role === 'admin' && <span className="text-[10px] text-emerald-400">Active</span>}
                </button>

                <button
                  onClick={() => handleDemoSwitch('participant', 'alex@codequest.dev')}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center justify-between border-t border-slate-800/60"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-bold text-cyan-300">Alex Chen (Demo)</div>
                      <div className="text-[10px] text-slate-400">Ready for Round 1 Quiz</div>
                    </div>
                  </div>
                  {user?.email === 'alex@codequest.dev' && <span className="text-[10px] text-emerald-400">Active</span>}
                </button>

                <button
                  onClick={() => handleDemoSwitch('participant', 'rahul@codequest.dev')}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-bold text-amber-300">Rahul Sharma (#1 Rank)</div>
                      <div className="text-[10px] text-slate-400">842 pts • All 4 rounds solved</div>
                    </div>
                  </div>
                  {user?.email === 'rahul@codequest.dev' && <span className="text-[10px] text-emerald-400">Active</span>}
                </button>
              </div>
            )}
          </div>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1 rounded-full bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 transition-colors"
              >
                <img
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'}
                  alt={user.fullName}
                  className="w-7 h-7 rounded-full object-cover bg-slate-800"
                />
                <span className="hidden md:inline text-xs font-semibold font-mono text-slate-200 pr-2">
                  {user.fullName.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden md:inline pr-1" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs font-sans">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="font-bold text-slate-200">{user.fullName}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate(user.role === 'admin' ? '/admin/dashboard' : '/profile');
                    }}
                    className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
                  >
                    {user.role === 'admin' ? 'Admin Portal' : 'My Profile & Account'}
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      onNavigate('/landing');
                    }}
                    className="w-full text-left px-4 py-2 text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 border-t border-slate-800 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('/login')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => onNavigate('/register')}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-mono font-bold transition-all shadow-md hover:shadow-cyan-500/20"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
