import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Badge } from '../components/common/Badge.tsx';
import { User, Mail, Building, Phone, Calendar, ShieldCheck, Award } from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-800 text-center sm:text-left">
          <img
            src={user.avatarUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'}
            alt={user.fullName}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-xl"
          />

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-black font-mono text-white">
                {user.fullName}
              </h1>
              <Badge status={user.role.toUpperCase()} size="sm" />
            </div>

            <p className="text-sm font-mono text-cyan-400">
              {user.organization}
            </p>

            <div className="text-xs font-mono text-slate-400 flex items-center justify-center sm:justify-start gap-2 pt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Registered on {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'October 2026'}</span>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>EMAIL ADDRESS</span>
            </span>
            <span className="text-sm font-semibold text-slate-200 block truncate">{user.email}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>COLLEGE / INSTITUTION</span>
            </span>
            <span className="text-sm font-semibold text-slate-200 block truncate">{user.organization}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>PHONE NUMBER</span>
            </span>
            <span className="text-sm font-semibold text-slate-200 block">{user.phoneNumber || 'Not provided'}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SECURITY STATUS</span>
            </span>
            <span className="text-sm font-semibold text-emerald-400 block">Verified &amp; Authenticated</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold"
          >
            Return to Dashboard
          </button>
          <button
            onClick={() => onNavigate('/performance')}
            className="px-5 py-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold"
          >
            View Performance Metrics
          </button>
        </div>
      </div>
    </div>
  );
};
