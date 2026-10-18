import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useNotification } from '../../context/NotificationContext.tsx';
import type { QuizQuestion } from '../../types/index.ts';
import { Badge } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const AdminQuestions: React.FC = () => {
  const { showToast } = useNotification();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  // Form states
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState('Algorithms');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [points, setPoints] = useState(10);
  const [negativeMarking, setNegativeMarking] = useState(2);
  const [correctOptionKey, setCorrectOptionKey] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [explanation, setExplanation] = useState('');

  const loadQuestions = async () => {
    try {
      const res = await api.getAdminQuestions();
      setQuestions(res.questions || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const openCreateModal = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setCategory('Algorithms');
    setDifficulty('medium');
    setPoints(10);
    setNegativeMarking(2);
    setCorrectOptionKey('A');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setExplanation('');
    setIsModalOpen(true);
  };

  const openEditModal = (q: any) => {
    setEditingQuestion(q);
    setQuestionText(q.questionText);
    setCategory(q.category || 'Algorithms');
    setDifficulty(q.difficulty);
    setPoints(q.points);
    setNegativeMarking(q.negativeMarking);
    setCorrectOptionKey(q.correctOptionKey);
    setOptA(q.options.find((o: any) => o.optionKey === 'A')?.optionText || '');
    setOptB(q.options.find((o: any) => o.optionKey === 'B')?.optionText || '');
    setOptC(q.options.find((o: any) => o.optionKey === 'C')?.optionText || '');
    setOptD(q.options.find((o: any) => o.optionKey === 'D')?.optionText || '');
    setExplanation(q.explanation || '');
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        roundId: 'round_01_quiz',
        questionText,
        category,
        difficulty,
        points: Number(points),
        negativeMarking: Number(negativeMarking),
        correctOptionKey,
        explanation,
        options: [
          { optionKey: 'A', optionText: optA },
          { optionKey: 'B', optionText: optB },
          { optionKey: 'C', optionText: optC },
          { optionKey: 'D', optionText: optD },
        ],
      };

      if (editingQuestion) {
        await api.updateQuizQuestion(editingQuestion.id, payload);
        showToast('Quiz question updated successfully!', 'success');
      } else {
        await api.createQuizQuestion(payload);
        showToast('New Quiz question created!', 'success');
      }

      setIsModalOpen(false);
      loadQuestions();
    } catch (err: any) {
      showToast(err.message || 'Failed to save question', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this quiz question?')) return;
    try {
      await api.deleteQuizQuestion(id);
      showToast('Question deleted', 'success');
      loadQuestions();
    } catch (err: any) {
      showToast(err.message || 'Deletion failed', 'error');
    }
  };

  const filtered = questions.filter((q) => {
    const term = search.toLowerCase();
    return (
      q.questionText.toLowerCase().includes(term) ||
      (q.category && q.category.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0F172A] to-[#0A0F1D] border border-purple-500/40 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Quiz Battle Questions Repository
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Manage MCQ items, answer keys, penalty deductions, and explanations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add MCQ Item</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80 font-mono text-xs">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by topic or text..."
          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
        />
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-500 font-mono text-xs">
            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
            <span>Loading Quiz Items...</span>
          </div>
        ) : (
          filtered.map((q: any, idx) => (
            <div
              key={q.id}
              className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-4 font-mono text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400">Q{idx + 1}.</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-300">
                    {q.category}
                  </span>
                  <Badge status={q.difficulty.toUpperCase()} size="sm" />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">+{q.points} pts</span>
                  {q.negativeMarking > 0 && (
                    <span className="text-rose-400">-{q.negativeMarking} penalty</span>
                  )}
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-sm font-sans font-medium text-slate-100">
                {q.questionText}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options?.map((opt: any) => {
                  const isCorrect = q.correctOptionKey === opt.optionKey;
                  return (
                    <div
                      key={opt.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-950/30 border-emerald-500 text-emerald-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>
                        <strong className="mr-1">{opt.optionKey}.</strong> {opt.optionText}
                      </span>
                      {isCorrect && (
                        <span className="text-[10px] text-emerald-400 uppercase">Correct Key</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] font-sans text-slate-400">
                  <strong className="text-purple-300 font-mono block mb-0.5">Admin Explanation:</strong>
                  {q.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingQuestion ? 'Edit MCQ Item' : 'Create New MCQ Item'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveQuestion} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-300 mb-1">Question Text *</label>
              <textarea
                required
                rows={3}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter clear technical question..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400 font-sans"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e: any) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Correct Key *</label>
                <select
                  value={correctOptionKey}
                  onChange={(e: any) => setCorrectOptionKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-emerald-500 rounded-xl text-emerald-300 font-bold focus:outline-none"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Points</label>
                <input
                  type="number"
                  min={1}
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Negative Marking (Penalty)</label>
                <input
                  type="number"
                  min={0}
                  value={negativeMarking}
                  onChange={(e) => setNegativeMarking(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Options A - D */}
            <div className="space-y-2">
              <label className="block text-slate-300">Answer Options *</label>
              <input
                type="text"
                required
                value={optA}
                onChange={(e) => setOptA(e.target.value)}
                placeholder="Option A Text"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
              />
              <input
                type="text"
                required
                value={optB}
                onChange={(e) => setOptB(e.target.value)}
                placeholder="Option B Text"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
              />
              <input
                type="text"
                required
                value={optC}
                onChange={(e) => setOptC(e.target.value)}
                placeholder="Option C Text"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
              />
              <input
                type="text"
                required
                value={optD}
                onChange={(e) => setOptD(e.target.value)}
                placeholder="Option D Text"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Official Solution Explanation</label>
              <textarea
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Detailed rationale shown to participants upon round completion..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400 font-sans"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                Save MCQ Item
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
