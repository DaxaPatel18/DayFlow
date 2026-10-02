import React, { useState, useEffect, useRef } from 'react';
import { Check, Clock, Edit2, Trash2, Star, MoreVertical } from 'lucide-react';
import { Task } from '../types';
import { useDayFlow } from '../context/DayFlowContext';
import { getCategoryTheme, getPriorityTheme } from '../utils/categoryColors';
import { formatFriendlyTaskDate } from '../utils/dateHelpers';

interface TaskCardProps {
  task: Task;
  showDate?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, showDate = false }) => {
  const { toggleTaskComplete, openAddTaskModal, openConfirmModal, deleteTask, setTaskAsFocus } =
    useDayFlow();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const catTheme = getCategoryTheme(task.category);
  const prioTheme = getPriorityTheme(task.priority);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    openConfirmModal({
      title: 'Delete Task?',
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      confirmButtonText: 'Delete Task',
      isDanger: true,
      onConfirm: () => deleteTask(task.id),
    });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openAddTaskModal({ id: task.id });
  };

  const handleToggleFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskAsFocus(task.id);
  };

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      setJustChecked(true);
      setTimeout(() => setJustChecked(false), 400);
    }
    toggleTaskComplete(task.id);
  };

  return (
    <div
      onClick={handleEdit}
      className={`group flex items-start sm:items-center justify-between p-3.5 rounded-xl border bg-white transition-all cursor-pointer relative task-row-hover ${
        task.completed
          ? 'border-[#E5E7EB] bg-slate-50/70 opacity-70'
          : task.isFocus
          ? 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-300'
          : 'border-[#E5E7EB]'
      }`}
    >
      <div className="flex items-start gap-1 sm:gap-3 min-w-0 flex-1">
        {/* Checkbox with accessible 44px tap target */}
        <button
          type="button"
          onClick={handleCheck}
          aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
          className="p-1 -ml-1 -mt-0.5 sm:p-0 sm:ml-0 sm:mt-0.5 rounded-lg flex items-center justify-center shrink-0 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 cursor-pointer"
        >
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
              task.completed
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-100'
                : 'border-[#D1D5DB] hover:border-indigo-500 bg-white text-transparent'
            } ${justChecked ? 'animate-check-spring' : ''}`}
          >
            <Check
              className={`w-3 h-3 stroke-[3] transition-opacity duration-150 ${
                task.completed ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        </button>

        {/* Content */}
        <div className="flex flex-col min-w-0 pr-2 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-sm font-semibold text-[#111827] leading-snug break-words transition-all duration-300 ${
                task.completed ? 'line-through text-[#9CA3AF]' : ''
              }`}
            >
              {task.title}
            </span>
            {task.isFocus && !task.completed && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold shrink-0">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                Focus
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-[#6B7280] line-clamp-1 mt-0.5 leading-relaxed break-words">
              {task.description}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-[#6B7280]">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catTheme.chipClass}`}>
              {task.category}
            </span>
            <span className="text-[#E5E7EB]">•</span>
            <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
              <Clock className="w-3 h-3" />
              {task.time}
            </span>
            {showDate && (
              <>
                <span className="text-[#E5E7EB]">•</span>
                <span className="text-[11px] font-medium text-[#6B7280]">
                  {formatFriendlyTaskDate(task.date)}
                </span>
              </>
            )}
            {/* Priority badge on mobile */}
            <span className={`sm:hidden px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${prioTheme.badge}`}>
              {task.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Priority badge on desktop */}
        <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${prioTheme.badge}`}>
          {task.priority}
        </span>

        {/* Mobile 3-Dot Action Menu */}
        <div className="relative sm:hidden" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Task options"
            className="p-1.5 text-[#9CA3AF] hover:text-[#111827] rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {isMobileMenuOpen && (
            <div className="absolute right-0 top-9 w-40 bg-white border border-[#E5E7EB] rounded-xl shadow-xl p-1 z-30 flex flex-col gap-0.5 animate-fade-in">
              <button
                type="button"
                onClick={(e) => { handleToggleFocus(e); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#374151] hover:bg-amber-50 hover:text-amber-700 rounded-lg w-full text-left"
              >
                <Star className={`w-3.5 h-3.5 ${task.isFocus ? 'fill-amber-500 text-amber-500' : 'text-amber-400'}`} />
                <span>{task.isFocus ? 'Unset Focus' : 'Set as Focus'}</span>
              </button>
              <button
                type="button"
                onClick={(e) => { handleEdit(e); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#374151] hover:bg-slate-50 rounded-lg w-full text-left"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Edit Task</span>
              </button>
              <div className="my-0.5 h-px bg-[#F3F4F6]" />
              <button
                type="button"
                onClick={(e) => { handleDelete(e); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg w-full text-left"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Desktop Inline Actions */}
        <div className="hidden sm:flex items-center gap-0.5">
          {/* Focus Star Toggle */}
          <button
            type="button"
            onClick={handleToggleFocus}
            title={task.isFocus ? 'Remove focus' : "Set as Today's Focus"}
            aria-label={task.isFocus ? "Remove from today's focus" : "Mark task as today's focus"}
            className={`p-1.5 rounded-lg transition-all ${
              task.isFocus
                ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                : 'text-[#9CA3AF] hover:text-amber-500 hover:bg-amber-50/60 opacity-0 group-hover:opacity-100'
            }`}
          >
            <Star className={`w-4 h-4 ${task.isFocus ? 'fill-amber-500' : ''}`} />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={handleEdit}
            title="Edit Task"
            aria-label="Edit Task"
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-indigo-600 hover:bg-indigo-50/60 transition-all opacity-0 group-hover:opacity-100"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            title="Delete Task"
            aria-label="Delete Task"
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
