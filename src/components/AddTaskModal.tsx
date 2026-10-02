import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Tag, Flag, Repeat, Star } from 'lucide-react';
import { Category, Priority, RepeatType } from '../types';
import { useDayFlow } from '../context/DayFlowContext';
import { formatTimeTo12Hr, formatTimeTo24Hr, getTodayISODate } from '../utils/dateHelpers';

export const AddTaskModal: React.FC = () => {
  const {
    isTaskModalOpen,
    editingTask,
    defaultTaskDateForModal,
    closeTaskModal,
    addTask,
    updateTask,
    settings,
  } = useDayFlow();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [category, setCategory] = useState<Category>('Coding');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [repeat, setRepeat] = useState<RepeatType>('Never');
  const [isFocus, setIsFocus] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setDate(editingTask.date);
      setTime(formatTimeTo24Hr(editingTask.time));
      setCategory(editingTask.category);
      setPriority(editingTask.priority);
      setRepeat(editingTask.repeat);
      setIsFocus(!!editingTask.isFocus);
    } else {
      setTitle('');
      setDescription('');
      setDate(defaultTaskDateForModal || getTodayISODate());
      setTime('14:00');
      setCategory(settings.defaultCategory || 'Coding');
      setPriority(settings.defaultPriority || 'Medium');
      setRepeat('Never');
      setIsFocus(false);
    }
    setError('');
  }, [editingTask, defaultTaskDateForModal, isTaskModalOpen, settings]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isTaskModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeTaskModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTaskModalOpen, closeTaskModal]);

  if (!isTaskModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task Name is required');
      return;
    }
    if (!date) {
      setError('Date is required');
      return;
    }

    const formattedTime = formatTimeTo12Hr(time);

    if (editingTask) {
      updateTask(editingTask.id, {
        title: title.trim(),
        description: description.trim(),
        date,
        time: formattedTime,
        category,
        priority,
        repeat,
        isFocus,
      });
    } else {
      addTask({
        title: title.trim(),
        description: description.trim(),
        date,
        time: formattedTime,
        category,
        priority,
        repeat,
        isFocus,
        completed: false,
        completedAt: null,
      });
    }

    closeTaskModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeTaskModal();
      }}
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-[#E5E7EB] shadow-2xl p-5 sm:p-6 flex flex-col gap-4 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-150 max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto my-0 sm:my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
          <div>
            <h3 className="font-bold text-base text-[#111827]">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h3>
            <p className="text-xs text-[#6B7280]">
              {editingTask
                ? 'Update your task details and schedule.'
                : 'Schedule a new action item into your day.'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeTaskModal}
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
          {/* Task Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#111827]">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete Machine Learning Assignment"
              required
              className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-sm placeholder:text-[#9CA3AF] focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#111827]">
              Description <span className="text-[#6B7280] font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add checklist, context, or links..."
              rows={2}
              className="w-full p-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-sm placeholder:text-[#9CA3AF] focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Date</span> <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-xs focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
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
          </div>

          {/* Category & Repeat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Repeat</span>
              </label>
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as RepeatType)}
                className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-xs focus:bg-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="Never">Never</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
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

          {/* Mark as Today's Focus toggle */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 cursor-pointer hover:bg-indigo-50 transition-colors">
            <input
              type="checkbox"
              checked={isFocus}
              onChange={(e) => setIsFocus(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <div className="flex items-center gap-1.5 text-xs text-[#111827] font-medium">
              <Star className={`w-3.5 h-3.5 ${isFocus ? 'text-amber-500 fill-amber-500' : 'text-[#9CA3AF]'}`} />
              <span>Set as Today's Top Focus</span>
            </div>
          </label>

          {/* Actions */}
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={closeTaskModal}
              className="flex items-center justify-center h-10 sm:h-11 px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#111827] font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center justify-center h-10 sm:h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              {editingTask ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
