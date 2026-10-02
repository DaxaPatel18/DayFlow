import React, { useState, useEffect } from 'react';
import { X, Clock, Tag, Flag } from 'lucide-react';
import { Category, Priority } from '../types';
import { useDayFlow } from '../context/DayFlowContext';
import { formatTimeTo12Hr, formatTimeTo24Hr } from '../utils/dateHelpers';

const DAYS_OF_WEEK = [
  { dayIndex: 1, label: 'Mo' },
  { dayIndex: 2, label: 'Tu' },
  { dayIndex: 3, label: 'We' },
  { dayIndex: 4, label: 'Th' },
  { dayIndex: 5, label: 'Fr' },
  { dayIndex: 6, label: 'Sa' },
  { dayIndex: 0, label: 'Su' },
];

export const AddRoutineModal: React.FC = () => {
  const { isRoutineModalOpen, editingRoutine, closeRoutineModal, addRoutine, updateRoutine } =
    useDayFlow();

  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00');
  const [category, setCategory] = useState<Category>('Health');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingRoutine) {
      setTitle(editingRoutine.title);
      setTime(formatTimeTo24Hr(editingRoutine.time));
      setCategory(editingRoutine.category);
      setPriority(editingRoutine.priority);
      setRepeatDays(editingRoutine.repeatDays || [1, 2, 3, 4, 5]);
      setEnabled(editingRoutine.enabled);
    } else {
      setTitle('');
      setTime('08:00');
      setCategory('Health');
      setPriority('Medium');
      setRepeatDays([0, 1, 2, 3, 4, 5, 6]); // all days by default
      setEnabled(true);
    }
    setError('');
  }, [editingRoutine, isRoutineModalOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isRoutineModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRoutineModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRoutineModalOpen, closeRoutineModal]);

  if (!isRoutineModalOpen) return null;

  const toggleDay = (dayIndex: number) => {
    if (repeatDays.includes(dayIndex)) {
      if (repeatDays.length === 1) return; // at least 1 day
      setRepeatDays(repeatDays.filter((d) => d !== dayIndex));
    } else {
      setRepeatDays([...repeatDays, dayIndex]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Routine Name is required');
      return;
    }
    if (repeatDays.length === 0) {
      setError('Select at least one day for repeat schedule');
      return;
    }

    const formattedTime = formatTimeTo12Hr(time);

    if (editingRoutine) {
      updateRoutine(editingRoutine.id, {
        title: title.trim(),
        time: formattedTime,
        category,
        priority,
        repeatDays,
        enabled,
      });
    } else {
      addRoutine({
        title: title.trim(),
        time: formattedTime,
        category,
        priority,
        repeatDays,
        enabled,
      });
    }

    closeRoutineModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeRoutineModal();
      }}
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-[#E5E7EB] shadow-2xl p-5 sm:p-6 flex flex-col gap-4 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-150 max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto my-0 sm:my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
          <div>
            <h3 className="font-bold text-base text-[#111827]">
              {editingRoutine ? 'Edit Routine Task' : 'Add Routine Task'}
            </h3>
            <p className="text-xs text-[#6B7280]">
              Build lasting habits with recurring daily schedule items.
            </p>
          </div>
          <button
            type="button"
            onClick={closeRoutineModal}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Routine Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#111827]">
              Routine Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Focus Study / Learning Session"
              required
              className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-sm placeholder:text-[#9CA3AF] focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
              autoFocus
            />
          </div>

          {/* Time & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Time</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-xs focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-xs focus:bg-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="Study">Study</option>
                <option value="Coding">Coding</option>
                <option value="Project">Project</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>Priority</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'High'] as Priority[]).map((p) => {
                const isSelected = priority === p;
                let activeStyle = '';
                if (isSelected) {
                  if (p === 'Low') activeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-100';
                  if (p === 'Medium') activeStyle = 'bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-100';
                  if (p === 'High') activeStyle = 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-100';
                } else {
                  activeStyle = 'bg-[#F8FAFC] text-[#6B7280] border-[#E5E7EB] hover:bg-slate-100';
                }
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${activeStyle}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Repeat Days: M T W T F S S */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#111827]">
              Repeat Days <span className="text-[#6B7280] font-normal">(Multi-select)</span>
            </label>
            <div className="flex items-center gap-1.5 sm:gap-2 justify-between sm:justify-start flex-wrap">
              {DAYS_OF_WEEK.map((item, idx) => {
                const isSelected = repeatDays.includes(item.dayIndex);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(item.dayIndex)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-[#F8FAFC] text-[#6B7280] border-[#E5E7EB] hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enable Routine Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#111827]">Enable Routine</span>
              <span className="text-[11px] text-[#6B7280]">
                Active routines repeat automatically on chosen days
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={closeRoutineModal}
              className="flex items-center justify-center h-10 sm:h-11 px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#111827] font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center justify-center h-10 sm:h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              {editingRoutine ? 'Save Changes' : 'Add Routine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
