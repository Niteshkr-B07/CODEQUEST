import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  X,
  Minimize2,
  Maximize2,
  Send,
  Lightbulb,
  ShieldAlert,
  GraduationCap,
  Compass,
  Code2,
  RefreshCw,
  Terminal,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface AIAssistantProps {
  currentContext?: {
    roundId?: string;
    roundName?: string;
    problemId?: string;
    problemTitle?: string;
    language?: string;
    code?: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  mode?: 'practice' | 'competition';
  suggestions?: string[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ currentContext }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mode, setMode] = useState<'practice' | 'competition'>('competition');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_msg',
      role: 'assistant',
      content: `👋 **Welcome to CODEQUEST AI Assistant!**\n\nI am your competitive programming co-pilot. In **Competition Mode**, I provide **Socratic hints**, time/space complexity analysis, and edge cases while keeping the competition fair.\n\nHow can I guide you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        '💡 Give me a conceptual hint',
        '🔍 What edge cases should I test?',
        '⏱️ What is the target time complexity?',
        '🗺️ Show my competition roadmap',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Load public AI configuration on mount
  useEffect(() => {
    api.getAIConfig()
      .then((cfg) => {
        setAiEnabled(cfg.enabled);
        if (cfg.defaultMode) {
          setMode(cfg.defaultMode);
        }
      })
      .catch(() => {
        // Fallback to active
        setAiEnabled(true);
      });
  }, []);

  if (!user || !aiEnabled) {
    return null;
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Special command for roadmap
      if (text.toLowerCase().includes('roadmap')) {
        const roadRes = await api.getAIRoadmap();
        if (roadRes.success && roadRes.roadmap) {
          const rm = roadRes.roadmap;
          let content = `### 🗺️ CODEQUEST Contest Roadmap for ${rm.participantName}\n**Current Status**: \`${rm.currentLevel}\`\n\n`;
          rm.milestones.forEach((m: any, i: number) => {
            const statusIcon = m.status === 'completed' ? '✅' : (m.status === 'active' ? '🔥' : '⏳');
            content += `#### ${statusIcon} ${m.title}\n- **Focus Areas**: ${m.focus.join(', ')}\n- **Strategy**: ${m.recommendedAction}\n\n`;
          });

          setMessages((prev) => [
            ...prev,
            {
              id: `msg_a_${Date.now()}`,
              role: 'assistant',
              content,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              suggestions: ['Give me a hint for this problem', 'How do I optimize space complexity?'],
            },
          ]);
          setLoading(false);
          return;
        }
      }

      // Special command for code analyze
      if (text.toLowerCase().includes('analyze code') || text.toLowerCase().includes('analyze my code')) {
        if (currentContext?.code) {
          const codeRes = await api.aiAnalyzeCode({
            code: currentContext.code,
            language: currentContext.language,
            problemTitle: currentContext.problemTitle,
          });

          if (codeRes.success && codeRes.analysis) {
            const a = codeRes.analysis;
            const content = `### 🔍 AI Code Review (${a.language.toUpperCase()})\n- **Estimated Time Complexity**: \`${a.metrics.estimatedTimeComplexity}\` (${a.metrics.timeExplanation})\n- **Estimated Space Complexity**: \`${a.metrics.estimatedSpaceComplexity}\` (${a.metrics.spaceExplanation})\n- **Loop Count**: ${a.metrics.loopCount} | **Lines**: ${a.metrics.lineCount}\n\n**Potential Pitfalls**:\n${a.potentialPitfalls.map((p: string) => `- ${p}`).join('\n')}\n\n**Recommendation**:\n${a.recommendation}`;

            setMessages((prev) => [
              ...prev,
              {
                id: `msg_a_${Date.now()}`,
                role: 'assistant',
                content,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                suggestions: ['What edge cases should I test?', 'Give me a hint'],
              },
            ]);
            setLoading(false);
            return;
          }
        }
      }

      // Normal chat request
      const res = await api.aiChat({
        message: text,
        mode,
        context: {
          roundId: currentContext?.roundId,
          problemTitle: currentContext?.problemTitle,
          language: currentContext?.language,
          code: currentContext?.code,
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_a_${Date.now()}`,
          role: 'assistant',
          content: res.reply || 'No response generated.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: res.suggestions || [],
          mode: res.mode,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Error**: ${err.message || 'Unable to connect to AI Assistant. Please try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `clear_${Date.now()}`,
        role: 'assistant',
        content: `🧹 **Chat conversation reset.** How can I assist you with your competitive programming tasks?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Give me a conceptual hint',
          'What edge cases should I test?',
          'What is the target time complexity?',
        ],
      },
    ]);
  };

  return (
    <>
      {/* Floating launcher trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs shadow-2xl shadow-cyan-500/30 hover:scale-105 transition-all cursor-pointer border border-cyan-300/40"
          title="Open CODEQUEST AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-slate-950 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-100"></span>
            </span>
          </div>
          <span className="tracking-wide">AI Assistant</span>
          {mode === 'competition' && (
            <span className="px-1.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-200 text-[10px] font-semibold border border-cyan-400/30">
              Socratic
            </span>
          )}
        </button>
      )}

      {/* Floating chat panel */}
      {isOpen && (
        <div
          className={`fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 flex flex-col bg-[#0A0F1D]/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 transition-all font-mono overflow-hidden ${
            isMinimized
              ? 'w-80 h-16'
              : 'w-[94vw] sm:w-[460px] h-[85vh] sm:h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm shadow-cyan-500/30">
                <Bot className="w-4 h-4 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-white tracking-tight">CODEQUEST AI</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    v2.5
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {currentContext?.problemTitle ? (
                    <span className="truncate max-w-[160px]">{currentContext.problemTitle}</span>
                  ) : (
                    'Algorithmic Co-Pilot'
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 hover:text-rose-400 transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Mode Bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[10px]">Mode:</span>
                  <button
                    onClick={() => setMode('competition')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                      mode === 'competition'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <ShieldAlert className="w-3 h-3 text-cyan-400" />
                    <span>Competition</span>
                  </button>
                  <button
                    onClick={() => setMode('practice')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                      mode === 'practice'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <GraduationCap className="w-3 h-3 text-purple-400" />
                    <span>Practice</span>
                  </button>
                </div>

                <button
                  onClick={handleClearHistory}
                  className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed selection:bg-cyan-500/30">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-md ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-slate-950 font-semibold'
                          : 'bg-slate-900/90 border border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans text-xs">{msg.content}</div>
                      <div
                        className={`text-[9px] mt-1.5 flex justify-end font-mono ${
                          msg.role === 'user' ? 'text-slate-950/70' : 'text-slate-500'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>

                    {/* Suggestions Chips */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                        {msg.suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(sug)}
                            className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-cyan-950/80 border border-slate-700/80 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-[10px] transition-all"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-cyan-400 text-xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing algorithmic logic...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Toolbar */}
              <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[10px]">
                <button
                  onClick={() => handleSendMessage('Give me a conceptual hint')}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
                >
                  <Lightbulb className="w-3 h-3 text-amber-400" />
                  <span>Hint</span>
                </button>
                <button
                  onClick={() => handleSendMessage('What edge cases should I test?')}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
                >
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  <span>Edge Cases</span>
                </button>
                <button
                  onClick={() => handleSendMessage('What is the ideal time and space complexity?')}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
                >
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>Complexity</span>
                </button>
                {currentContext?.code && (
                  <button
                    onClick={() => handleSendMessage('Analyze my code for potential bugs and complexity')}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
                  >
                    <Code2 className="w-3 h-3 text-purple-400" />
                    <span>Review Code</span>
                  </button>
                )}
                <button
                  onClick={() => handleSendMessage('Show my competition roadmap')}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
                >
                  <Compass className="w-3 h-3 text-blue-400" />
                  <span>Roadmap</span>
                </button>
              </div>

              {/* Input Area */}
              <div className="p-3 bg-slate-900/90 border-t border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      mode === 'competition'
                        ? 'Ask for hints, complexity, or edge cases...'
                        : 'Ask any algorithmic or coding question...'
                    }
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || loading}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
