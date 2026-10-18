import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Footer } from './components/layout/Footer.tsx';

// Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { ParticipantDashboard } from './pages/ParticipantDashboard.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { RoundsOverviewPage } from './pages/RoundsOverviewPage.tsx';
import { QuizBattlePage } from './pages/QuizBattlePage.tsx';
import { CodingBattlePage } from './pages/CodingBattlePage.tsx';
import { DebuggingBattlePage } from './pages/DebuggingBattlePage.tsx';
import { FinalBattlePage } from './pages/FinalBattlePage.tsx';
import { LeaderboardPage } from './pages/LeaderboardPage.tsx';
import { PerformanceAnalyticsPage } from './pages/PerformanceAnalyticsPage.tsx';
import { SubmissionsHistoryPage } from './pages/SubmissionsHistoryPage.tsx';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminParticipants } from './pages/admin/AdminParticipants.tsx';
import { AdminRounds } from './pages/admin/AdminRounds.tsx';
import { AdminQuestions } from './pages/admin/AdminQuestions.tsx';
import { AdminProblems } from './pages/admin/AdminProblems.tsx';
import { AdminSubmissions } from './pages/admin/AdminSubmissions.tsx';
import { AdminResults } from './pages/admin/AdminResults.tsx';
import { AdminSettings } from './pages/admin/AdminSettings.tsx';
import { AdminProctoring } from './pages/admin/AdminProctoring.tsx';

import { AIAssistant } from './components/ai/AIAssistant.tsx';

function MainRouter() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname === '/' ? '/landing' : window.location.pathname;
  });
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Sync with browser history
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname === '/' ? '/landing' : window.location.pathname;
      setCurrentPath(p);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route parser helper
  const renderRoute = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-[500px]">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        </div>
      );
    }

    // Public / Landing
    if (currentPath === '/landing' || currentPath === '/') {
      return <LandingPage onNavigate={navigate} />;
    }
    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigate} />;
    }
    if (currentPath === '/register') {
      return <RegisterPage onNavigate={navigate} />;
    }

    // Public / Shared Leaderboard
    if (currentPath === '/leaderboard' || currentPath === '/admin/leaderboard') {
      return <LeaderboardPage onNavigate={navigate} />;
    }

    // Auth gate for protected participant and admin routes
    if (!user) {
      return <LoginPage onNavigate={navigate} />;
    }

    // Admin Routes Gate
    if (currentPath.startsWith('/admin')) {
      if (user.role !== 'admin') {
        return (
          <div className="p-8 text-center text-rose-400 font-mono text-xs">
            Access denied: Administrative privileges required.
          </div>
        );
      }

      if (currentPath === '/admin/dashboard') return <AdminDashboard onNavigate={navigate} />;
      if (currentPath === '/admin/participants') return <AdminParticipants />;
      if (currentPath === '/admin/rounds') return <AdminRounds />;
      if (currentPath === '/admin/questions') return <AdminQuestions />;
      if (currentPath === '/admin/problems') return <AdminProblems />;
      if (currentPath === '/admin/submissions') return <AdminSubmissions />;
      if (currentPath === '/admin/results') return <AdminResults />;
      if (currentPath === '/admin/settings') return <AdminSettings />;
      if (currentPath === '/admin/proctoring') return <AdminProctoring />;
    }

    // Dynamic Battle Arena Routes
    if (currentPath.startsWith('/quiz/')) {
      const roundId = currentPath.split('/')[2];
      return <QuizBattlePage roundId={roundId} onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/coding/')) {
      const roundId = currentPath.split('/')[2];
      return <CodingBattlePage roundId={roundId} onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/debugging/')) {
      const roundId = currentPath.split('/')[2];
      return <DebuggingBattlePage roundId={roundId} onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/final/')) {
      const roundId = currentPath.split('/')[2];
      return <FinalBattlePage roundId={roundId} onNavigate={navigate} />;
    }

    // Participant Routes
    if (currentPath === '/dashboard') return <ParticipantDashboard onNavigate={navigate} />;
    if (currentPath === '/rounds') return <RoundsOverviewPage onNavigate={navigate} />;
    if (currentPath === '/performance') return <PerformanceAnalyticsPage onNavigate={navigate} />;
    if (currentPath === '/submissions') return <SubmissionsHistoryPage onNavigate={navigate} />;
    if (currentPath === '/profile') return <ProfilePage onNavigate={navigate} />;

    // Fallback
    return <LandingPage onNavigate={navigate} />;
  };

  const isPublicPage = currentPath === '/landing' || currentPath === '/' || currentPath === '/login' || currentPath === '/register';

  return (
    <div className="min-h-screen bg-[#080C16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
      />

      <div className="flex-1 flex">
        {user && !isPublicPage && (
          <Sidebar
            currentPath={currentPath}
            onNavigate={navigate}
            isOpenMobile={isSidebarOpenMobile}
            onCloseMobile={() => setIsSidebarOpenMobile(false)}
          />
        )}

        <main className="flex-1 flex flex-col justify-between overflow-x-hidden min-h-[calc(100vh-61px)]">
          <div className="flex-1">{renderRoute()}</div>
          <Footer />
        </main>
      </div>

      {/* Floating AI Assistant for authenticated users */}
      {user && <AIAssistant />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainRouter />
      </NotificationProvider>
    </AuthProvider>
  );
}
