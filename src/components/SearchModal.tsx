import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, CheckCircle2, Repeat, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { useDayFlow } from '../context/DayFlowContext';
import { getCategoryTheme } from '../utils/categoryColors';
import { formatFriendlyTaskDate } from '../utils/dateHelpers';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, tasks, routines, toggleTaskComplete, openAddTaskModal } =
    useDayFlow();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const filteredTasks = trimmed
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(trimmed) ||
          t.category.toLowerCase().includes(trimmed) ||
          (t.description && t.description.toLowerCase().includes(trimmed))
      )
    : tasks.slice(0, 5);

  const filteredRoutines = trimmed
    ? routines.filter(
        (r) =>
          r.title.toLowerCase().includes(trimmed) ||
          r.category.toLowerCase().includes(trimmed)
      )
    : routines.slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-20 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsSearchOpen(false);
      }}
    >
      <div className="w-full max-w-xl bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E5E7EB] gap-3">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, routines, categories..."
            className="w-full bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111827]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 rounded bg-slate-100 text-[#6B7280] text-xs font-mono border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 flex flex-col gap-4">
          {/* Tasks Section */}
          <div>
            <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
              <span>Tasks ({filteredTasks.length})</span>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  navigate('/tasks');
                }}
                className="text-indigo-600 hover:underline flex items-center gap-1 font-medium capitalize"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {filteredTasks.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] px-2 py-2">No matching tasks found.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredTasks.map((t) => {
                  const catTheme = getCategoryTheme(t.category);
                  return (
                    <div
                      key={t.id}
                      className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setIsSearchOpen(false);
                        openAddTaskModal({ id: t.id });
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskComplete(t.id);
                          }}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                            t.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 hover:border-indigo-500'
                          }`}
                        >
                          {t.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <span
                          className={`text-xs font-medium text-[#111827] truncate ${
                            t.completed ? 'line-through text-[#9CA3AF]' : ''
                          }`}
                        >
                          {t.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catTheme.chipClass}`}
                        >
                          {t.category}
                        </span>
                        <span className="text-[11px] text-[#6B7280]">
                          {formatFriendlyTaskDate(t.date)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Routines Section */}
          <div>
            <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-bold text-[#6B7280] uppercase tracking-wider border-t border-[#E5E7EB] pt-3">
              <span>Daily Routines ({filteredRoutines.length})</span>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  navigate('/routine');
                }}
                className="text-indigo-600 hover:underline flex items-center gap-1 font-medium capitalize"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {filteredRoutines.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] px-2 py-2">No matching routines found.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredRoutines.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigate('/routine');
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Repeat className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="text-xs font-medium text-[#111827]">{r.title}</span>
                    </div>
                    <span className="text-[11px] text-[#6B7280]">{r.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
          <span>Click any item to edit or complete</span>
          <span className="flex items-center gap-1">
            Press <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono">ESC</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
};
