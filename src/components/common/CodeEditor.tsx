import React, { useState } from 'react';
import { Play, Send, RotateCcw, Copy, Check, Terminal, Maximize2, Minimize2 } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  language: string;
  onLanguageChange?: (lang: string) => void;
  availableLanguages?: { id: string; label: string }[];
  onRun?: () => void;
  onSubmit?: () => void;
  isRunning?: boolean;
  isSubmitting?: boolean;
  onResetStarter?: () => void;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  language,
  onLanguageChange,
  availableLanguages = [
    { id: 'python', label: 'Python 3' },
    { id: 'javascript', label: 'JavaScript (Node)' },
    { id: 'cpp', label: 'C++ (G++ 17)' },
  ],
  onRun,
  onSubmit,
  isRunning = false,
  isSubmitting = false,
  onResetStarter,
  readOnly = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'text-xs' | 'text-sm' | 'text-base'>('text-sm');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const lines = code.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle tab key in code editor
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      onChange(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  return (
    <div
      className={`flex flex-col bg-[#0B1120] border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl border-cyan-500/40 shadow-2xl backdrop-blur-xl' : 'h-full min-h-[460px]'
      }`}
    >
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#0F172A] border-b border-slate-800 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 rounded-md border border-slate-700/60 text-slate-300 text-xs font-mono">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Editor</span>
          </div>

          {onLanguageChange && (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              disabled={isRunning || isSubmitting}
              className="bg-slate-900 text-cyan-300 text-xs font-mono rounded-md px-3 py-1.5 border border-cyan-500/30 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {availableLanguages.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-slate-900 text-slate-200">
                  {lang.label}
                </option>
              ))}
            </select>
          )}

          <div className="hidden sm:flex items-center gap-1 bg-slate-900/60 p-0.5 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
            <button
              onClick={() => setFontSize('text-xs')}
              className={`px-1.5 py-0.5 rounded ${fontSize === 'text-xs' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-slate-200'}`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('text-sm')}
              className={`px-1.5 py-0.5 rounded ${fontSize === 'text-sm' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-slate-200'}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('text-base')}
              className={`px-1.5 py-0.5 rounded ${fontSize === 'text-base' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-slate-200'}`}
            >
              A+
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onResetStarter && !readOnly && (
            <button
              type="button"
              onClick={onResetStarter}
              title="Reset to starter code"
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded transition-colors text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded transition-colors text-xs flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded transition-colors text-xs"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Code Input Area with line numbers */}
      <div className="relative flex-1 flex overflow-hidden bg-[#070B14]">
        {/* Line numbers gutter */}
        <div className="select-none py-3 px-3 text-right bg-[#090E1A] border-r border-slate-800/80 text-slate-600 font-mono text-xs leading-6 min-w-[42px]">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className={`flex-1 p-3 bg-transparent text-slate-100 font-mono ${fontSize} leading-6 resize-none focus:outline-none focus:ring-0 selection:bg-cyan-600/30 overflow-y-auto whitespace-pre`}
          placeholder="# Write your competitive solution here..."
        />
      </div>

      {/* Editor Action Buttons Footer */}
      {(onRun || onSubmit) && !readOnly && (
        <div className="flex items-center justify-between px-4 py-3 bg-[#0F172A] border-t border-slate-800">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Sandbox Mode: Isolated Environment</span>
          </div>

          <div className="flex items-center gap-3">
            {onRun && (
              <button
                type="button"
                onClick={onRun}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold font-mono tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
              >
                <Play className={`w-3.5 h-3.5 text-cyan-400 ${isRunning ? 'animate-spin' : ''}`} />
                <span>{isRunning ? 'Running Sample Tests...' : 'Run Code'}</span>
              </button>
            )}

            {onSubmit && (
              <button
                type="button"
                onClick={onSubmit}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold font-mono tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-cyan-500/25 active:scale-95"
              >
                <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-bounce' : ''}`} />
                <span>{isSubmitting ? 'Evaluating Hidden Tests...' : 'Submit Code'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
