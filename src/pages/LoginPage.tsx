import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { Code2, Lock, Mail, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, demoLogin } = useAuth();
  const { showToast } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      showToast('Welcome back to CODEQUEST!', 'success');
      onNavigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: 'participant' | 'admin', demoEmail?: string) => {
    setLoading(true);
    try {
      await demoLogin(role, demoEmail);
      showToast(`Logged in as demo ${role}`, 'success');
      if (role === 'admin') {
        onNavigate('/admin/dashboard');
      } else {
        onNavigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 font-sans selection:bg-cyan-500/30">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 items-center justify-center shadow-lg shadow-cyan-500/20">
          <Code2 className="w-6 h-6 text-slate-950 font-bold" />
        </div>
        <h2 className="text-3xl font-extrabold font-mono tracking-tight text-white">
          Sign In to <span className="text-cyan-400">CODEQUEST</span>
        </h2>
        <p className="text-xs font-mono text-slate-400">
          Enter your credentials or use 1-click demo access below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0F172A] py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@codequest.dev"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Demo Buttons */}
          <div className="pt-4 border-t border-slate-800 space-y-3 font-mono">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider text-center font-semibold">
              ⚡ Instant Evaluation Accounts
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('participant', 'alex@codequest.dev')}
                className="p-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 text-left transition-colors"
              >
                <div className="font-bold text-[11px]">Participant</div>
                <div className="text-[9px] text-slate-400">Alex Chen (Demo)</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('admin')}
                className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/30 text-purple-300 text-left transition-colors"
              >
                <div className="font-bold text-[11px]">Administrator</div>
                <div className="text-[9px] text-slate-400">admin@codequest.dev</div>
              </button>
            </div>
          </div>

          <div className="text-center text-xs font-mono text-slate-400 pt-2">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className="text-cyan-400 hover:underline font-bold"
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
