import React from 'react';
import {
  Code2,
  Terminal,
  Bug,
  Crown,
  CheckCircle2,
  Trophy,
  Zap,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user, demoLogin } = useAuth();

  const handleQuickDemo = async (role: 'participant' | 'admin', email?: string) => {
    await demoLogin(role, email);
    if (role === 'admin') {
      onNavigate('/admin/dashboard');
    } else {
      onNavigate('/dashboard');
    }
  };

  const stages = [
    {
      step: '01',
      title: 'Quiz Battle',
      badge: 'MCQ Elimination',
      description:
        'Rapid-fire technical evaluation testing algorithms, computational complexity, memory layouts, and systems internals under strict countdown timers with negative marking.',
      icon: Terminal,
      color: 'from-blue-500/20 to-cyan-500/20 border-cyan-500/30 text-cyan-400',
    },
    {
      step: '02',
      title: 'Coding Battle',
      badge: 'Algorithmic Problem Solving',
      description:
        'Hands-on coding arena in Python, JavaScript, and C++. Solutions are executed in isolated sandboxes against public samples and rigorous hidden test cases.',
      icon: Code2,
      color: 'from-cyan-500/20 to-emerald-500/20 border-emerald-500/30 text-emerald-400',
    },
    {
      step: '03',
      title: 'Debugging Battle',
      badge: 'Defect Hunting & Repair',
      description:
        'Inspect legacy broken code with off-by-one errors, infinite loops, and race condition flaws. Pinpoint edge case defects and submit verified fixes.',
      icon: Bug,
      color: 'from-amber-500/20 to-rose-500/20 border-amber-500/30 text-amber-400',
    },
    {
      step: '04',
      title: 'Final Battle',
      badge: 'Championship Showdown',
      description:
        'Reserved exclusively for Round 3 qualifiers. Solve complex graph optimizations, dynamic programming, and high-stakes competitive challenges.',
      icon: Crown,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
    },
  ];

  const features = [
    {
      title: 'Automated Evaluation',
      description:
        'Process-isolated execution sandboxes evaluate participant code in milliseconds with strict memory and CPU boundaries.',
      icon: Zap,
    },
    {
      title: 'Real-Time Leaderboard',
      description:
        'Instant live ranking with server-enforced tie-breaking: higher total score, higher final-round score, and earlier submission timestamps.',
      icon: Trophy,
    },
    {
      title: 'Round-Based Qualification',
      description:
        'Configurable progression engine (Top N, minimum score, or percentage cutoff) locks or unlocks access to subsequent battle stages.',
      icon: ShieldCheck,
    },
    {
      title: 'Performance Analytics',
      description:
        'Deep post-competition metrics: accuracy rings, round-by-round point breakdown, submission acceptance rate, and runtime benchmarking.',
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4 lg:px-8 border-b border-slate-900">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium shadow-lg shadow-cyan-950/40 animate-in fade-in slide-in-from-top-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>2026 Competitive Hackathon Championship</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-semibold">Live Sandbox Engine</span>
          </div>

          {/* Master Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black font-mono tracking-tight text-white drop-shadow-xl">
              CODE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400">BATTLE</span>
            </h1>
            <p className="text-xl sm:text-2xl font-mono text-cyan-300 font-semibold tracking-widest uppercase">
              &ldquo;Think. Code. Debug. Win.&rdquo;
            </p>
          </div>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            An online multi-round competitive platform where participants test their technical knowledge, coding speed, debugging accuracy, and advanced algorithmic problem-solving skills.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {user ? (
              <button
                onClick={() => onNavigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard')}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-sm tracking-wide transition-all shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95"
              >
                <span>Enter Battle Arena</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('/register')}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-sm tracking-wide transition-all shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95"
                >
                  <span>Register Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('/login')}
                  className="px-8 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-mono font-semibold text-sm tracking-wide transition-all hover:border-slate-600"
                >
                  <span>Login</span>
                </button>
              </>
            )}
          </div>

          {/* 1-Click Instant Evaluation Buttons for Hackathon Evaluators */}
          <div className="pt-6 border-t border-slate-900/80 max-w-xl mx-auto">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
              ⚡ Instant Demo Evaluation Logins:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('participant', 'alex@codequest.dev')}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium transition-all"
              >
                👤 Login as Participant (Alex Chen)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('participant', 'rahul@codequest.dev')}
                className="px-3.5 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 text-xs font-mono font-medium transition-all"
              >
                🏆 Login as #1 Rank (Rahul Sharma)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="px-3.5 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 text-xs font-mono font-medium transition-all"
              >
                🛡️ Login as Master Admin
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Four Competition Stages Section */}
      <section className="py-20 px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-14">
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
            Four Sequential Competition Rounds
          </div>
          <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
            The Battle Progression Lifecycle
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Only top performers qualify from one battle to the next. Can you reach the Final Battle and claim the championship?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.step}
                className={`relative rounded-2xl bg-gradient-to-b ${stage.color} p-6 border backdrop-blur-sm flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 shadow-xl`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-3xl font-black text-slate-500 group-hover:text-cyan-400 transition-colors">
                      {stage.step}
                    </span>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 shadow">
                      <Icon className="w-5 h-5 text-slate-200" />
                    </div>
                  </div>

                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900/70 text-slate-300 border border-slate-700/60 mb-2">
                    {stage.badge}
                  </span>

                  <h3 className="text-xl font-bold font-mono text-white mb-2">
                    {stage.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {stage.description}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Server-Timed</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* System Core Features Section */}
      <section className="py-20 px-4 lg:px-8 bg-[#090E1B] border-y border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-14">
            <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
              Production Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
              Built for Scale, Speed, and Integrity
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">
              Automated scoring, server-authoritative timers, and zero-compromise sandboxed code execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold font-mono text-white mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 px-4 lg:px-8 max-w-5xl mx-auto text-center w-full">
        <div className="rounded-3xl p-10 sm:p-14 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/30 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
              Ready to Prove Your Problem-Solving Mastery?
            </h2>
            <p className="text-slate-300 max-w-xl mx-auto text-sm">
              Register now, climb the provisional leaderboard, defeat bugs in the debugging battle, and battle the finest coders in the finals.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('/register')}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all"
              >
                Register for CODEQUEST
              </button>
              <button
                onClick={() => onNavigate('/leaderboard')}
                className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-sm font-semibold transition-colors"
              >
                View Live Leaderboard
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
