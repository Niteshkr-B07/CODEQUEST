import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Swords,
  Trophy,
  BarChart3,
  History,
  User,
  Users,
  Settings,
  HelpCircle,
  FileCode,
  ShieldCheck,
  ShieldAlert,
  CheckSquare,
  Award,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const participantLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/rounds', label: 'Battle Rounds', icon: Swords },
    { path: '/leaderboard', label: 'Live Leaderboard', icon: Trophy },
    { path: '/performance', label: 'My Performance', icon: BarChart3 },
    { path: '/submissions', label: 'Submission History', icon: History },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/participants', label: 'Participants', icon: Users },
    { path: '/admin/rounds', label: 'Rounds Engine', icon: Swords },
    { path: '/admin/questions', label: 'Quiz MCQs', icon: HelpCircle },
    { path: '/admin/problems', label: 'Coding & Debugging', icon: FileCode },
    { path: '/admin/submissions', label: 'Submissions', icon: CheckSquare },
    { path: '/admin/proctoring', label: 'Proctoring & Anti-Cheat', icon: ShieldAlert },
    { path: '/admin/leaderboard', label: 'Leaderboard Audit', icon: Trophy },
    { path: '/admin/results', label: 'Results & Publish', icon: Award },
    { path: '/admin/settings', label: 'Competition Settings', icon: Settings },
  ];

  const links = isAdmin ? adminLinks : participantLinks;

  const handleNavClick = (path: string) => {
    onNavigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed lg:sticky top-[61px] left-0 h-[calc(100vh-61px)] w-64 bg-[#0A0F1D] border-r border-slate-800/80 p-4 flex flex-col justify-between z-30 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Role badge banner */}
          <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isAdmin ? 'bg-purple-400' : 'bg-cyan-400'
                } animate-pulse`}
              />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                {isAdmin ? 'Admin Console' : 'Participant Zone'}
              </span>
            </div>
            {isAdmin && (
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = currentPath === link.path;

              return (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => handleNavClick(link.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? isAdmin
                        ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40 shadow-sm'
                        : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? isAdmin
                          ? 'text-purple-400'
                          : 'text-cyan-400'
                        : 'text-slate-500'
                    }`}
                  />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px]">
            <span>System:</span>
            <span className="text-emerald-400 font-semibold">Online & Secure</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span>Sandboxed:</span>
            <span className="text-cyan-400">Isolated V2</span>
          </div>
        </div>
      </aside>
    </>
  );
};
