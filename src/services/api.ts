const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('cb_token') || sessionStorage.getItem('cb_token');
}

export function setAuthToken(token: string, remember: boolean = true) {
  if (remember) {
    localStorage.setItem('cb_token', token);
  } else {
    sessionStorage.setItem('cb_token', token);
  }
}

export function clearAuthToken() {
  localStorage.removeItem('cb_token');
  sessionStorage.removeItem('cb_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Health
  getHealth: () => request<any>('/health'),

  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  demoLogin: (role: 'participant' | 'admin', userEmail?: string) =>
    request<any>('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role, userEmail }) }),
  getMe: () => request<any>('/auth/me'),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  // Rounds
  getRounds: () => request<{ rounds: any[]; serverTime: string; isFinalResultsPublished: boolean }>('/rounds'),
  getRoundById: (id: string) => request<any>(`/rounds/${id}`),
  startRound: (id: string) => request<any>(`/rounds/${id}/start`, { method: 'POST' }),

  // Quiz Battle
  getQuizQuestions: (roundId: string) => request<any>(`/quiz/${roundId}/questions`),
  saveQuizAnswer: (roundId: string, questionId: string, selectedOptionKey: string | null) =>
    request<any>(`/quiz/${roundId}/answer`, { method: 'POST', body: JSON.stringify({ questionId, selectedOptionKey }) }),
  submitQuiz: (roundId: string, answers: Record<string, any>) =>
    request<any>(`/quiz/${roundId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),

  // Coding & Debugging & Final
  getProblemsForRound: (roundId: string) => request<any>(`/coding/round/${roundId}`),
  runCode: (body: { problemId: string; roundId: string; language: string; code: string; customInput?: string }) =>
    request<any>('/coding/run', { method: 'POST', body: JSON.stringify(body) }),
  submitCode: (body: { problemId: string; roundId: string; language: string; code: string }) =>
    request<any>('/coding/submit', { method: 'POST', body: JSON.stringify(body) }),
  getSubmissions: (params?: { roundId?: string; problemId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any>(`/coding/submissions${query ? `?${query}` : ''}`);
  },

  // Leaderboard
  getLeaderboard: () => request<any>('/leaderboard'),

  // Analytics
  getMyPerformance: () => request<any>('/analytics/me'),
  getParticipantPerformance: (id: string) => request<any>(`/analytics/participant/${id}`),
  getAnnouncements: () => request<any>('/analytics/announcements'),

  // Admin
  getAdminDashboard: () => request<any>('/admin/dashboard'),
  getAdminParticipants: () => request<any>('/admin/participants'),
  toggleDisqualify: (id: string) => request<any>(`/admin/participants/${id}/toggle-disqualify`, { method: 'POST' }),
  getAdminRounds: () => request<any>('/admin/rounds'),
  createRound: (body: any) => request<any>('/admin/rounds', { method: 'POST', body: JSON.stringify(body) }),
  updateRound: (id: string, body: any) => request<any>(`/admin/rounds/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  changeRoundStatus: (id: string, status: string) =>
    request<any>(`/admin/rounds/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  deleteRound: (id: string) => request<any>(`/admin/rounds/${id}`, { method: 'DELETE' }),
  evaluateRoundQualifications: (id: string) => request<any>(`/admin/rounds/${id}/evaluate-qualifications`, { method: 'POST' }),
  getAdminQuestions: (roundId?: string) => request<any>(`/admin/questions${roundId ? `?roundId=${roundId}` : ''}`),
  createQuizQuestion: (body: any) => request<any>('/admin/questions', { method: 'POST', body: JSON.stringify(body) }),
  updateQuizQuestion: (id: string, body: any) => request<any>(`/admin/questions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteQuizQuestion: (id: string) => request<any>(`/admin/questions/${id}`, { method: 'DELETE' }),
  getAdminProblems: () => request<any>('/admin/problems'),
  createProblem: (body: any) => request<any>('/admin/problems', { method: 'POST', body: JSON.stringify(body) }),
  updateProblem: (id: string, body: any) => request<any>(`/admin/problems/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  getAdminSubmissions: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request<any>(`/admin/submissions${query ? `?${query}` : ''}`);
  },
  reEvaluateSubmission: (id: string) => request<any>(`/admin/submissions/${id}/re-evaluate`, { method: 'POST' }),
  calculateFinalResults: () => request<any>('/admin/calculate-final-results', { method: 'POST' }),
  publishFinalResults: (publish: boolean) => request<any>('/admin/publish-final-results', { method: 'POST', body: JSON.stringify({ publish }) }),
  createAnnouncement: (body: any) => request<any>('/admin/announcements', { method: 'POST', body: JSON.stringify(body) }),
  getAuditLogs: () => request<any>('/admin/audit-logs'),
  getSettings: () => request<any>('/admin/settings'),
  updateSettings: (body: any) => request<any>('/admin/settings', { method: 'PUT', body: JSON.stringify(body) }),
  resetDatabase: () => request<any>('/admin/reset-database', { method: 'POST' }),

  // Proctoring & Anti-Cheat
  getProctoringSession: (roundId: string) => request<any>(`/proctoring/session/${roundId}`),
  submitProctoringConsent: (body: { roundId: string; cameraGranted: boolean; micGranted: boolean; fullscreenGranted: boolean }) =>
    request<any>('/proctoring/consent', { method: 'POST', body: JSON.stringify(body) }),
  submitSystemCheck: (body: { roundId: string; checkDetails?: any }) =>
    request<any>('/proctoring/system-check', { method: 'POST', body: JSON.stringify(body) }),
  sendProctoringEvent: (body: { roundId: string; eventType: string; severity?: string; metadata?: any }) =>
    request<any>('/proctoring/events', { method: 'POST', body: JSON.stringify(body) }),
  uploadProctoringSnapshot: (body: { roundId: string; imageUrl: string; metadata?: any }) =>
    request<any>('/proctoring/snapshot', { method: 'POST', body: JSON.stringify(body) }),
  getProctoringSnapshots: (roundId: string, participantId?: string) =>
    request<any>(`/proctoring/snapshots/${roundId}${participantId ? `?participantId=${participantId}` : ''}`),
  getAdminProctoringSessions: (roundId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (roundId) params.append('roundId', roundId);
    if (status) params.append('status', status);
    return request<any>(`/proctoring/admin/sessions${params.toString() ? `?${params.toString()}` : ''}`);
  },
  getAdminAuditEvents: (params?: { roundId?: string; participantId?: string; eventType?: string; severity?: string; limit?: number }) => {
    const query = new URLSearchParams((params as any) || {}).toString();
    return request<any>(`/proctoring/admin/audit-events${query ? `?${query}` : ''}`);
  },
  adminProctoringAction: (action: string, sessionId: string, notes?: string) =>
    request<any>('/proctoring/admin/action', { method: 'POST', body: JSON.stringify({ action, sessionId, notes }) }),
  getPlagiarismResults: (roundId: string) =>
    request<any>(`/proctoring/admin/similarity/${roundId}`),
  runPlagiarismScan: (roundId: string) =>
    request<any>(`/proctoring/admin/similarity/scan/${roundId}`, { method: 'POST' }),
  updateRoundProctoringSettings: (roundId: string, settings: any) =>
    request<any>(`/proctoring/admin/round-settings/${roundId}`, { method: 'PUT', body: JSON.stringify(settings) }),

  // AI CODEQUEST Assistant
  getAIConfig: () => request<any>('/ai/config'),
  updateAIConfig: (body: any) => request<any>('/ai/config', { method: 'POST', body: JSON.stringify(body) }),
  aiChat: (body: { message: string; mode?: 'practice' | 'competition'; context?: any }) =>
    request<any>('/ai/chat', { method: 'POST', body: JSON.stringify(body) }),
  aiAnalyzeCode: (body: { code: string; language?: string; problemTitle?: string }) =>
    request<any>('/ai/analyze-code', { method: 'POST', body: JSON.stringify(body) }),
  getAIRoadmap: () => request<any>('/ai/roadmap', { method: 'POST' }),
};
