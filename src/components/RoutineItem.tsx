import React, { useState, useEffect, useRef } from 'react';
import { Check, Clock, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Routine } from '../types';
import { useDayFlow } from '../context/DayFlowContext';
import { getCategoryTheme, getPriorityTheme } from '../utils/categoryColors';

interface RoutineItemProps {
  routine: Routine;
  dateStr?: string;
  showManagementControls?: boolean;
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const RoutineItem: React.FC<RoutineItemProps> = ({
  routine,
  dateStr,
  showManagementControls = false,
}) => {
  const {
    todayDate,
    toggleRoutineCompletionForDate,
    isRoutineCompletedForDate,
    toggleRoutineEnabled,
    openAddRoutineModal,
    openConfirmModal,
    deleteRoutine,
  } = useDayFlow();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const targetDate = dateStr || todayDate;
  const isCompleted = isRoutineCompletedForDate(routine.id, targetDate);
  const catTheme = getCategoryTheme(routine.category);
  const prioTheme = getPriorityTheme(routine.priority);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleRoutineCompletionForDate(routine.id, targetDate);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openAddRoutineModal({ id: routine.id });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    openConfirmModal({
      title: 'Delete Routine?',
      message: `Are you sure you want to remove recurring routine "${routine.title}"?`,
      confirmButtonText: 'Delete Routine',
      isDanger: true,
      onConfirm: () => deleteRoutine(routine.id),
    });
  };

  return (
    <div
      onClick={handleEdit}
      className={`group flex items-start sm:items-center justify-between p-3.5 rounded-xl border bg-white transition-all cursor-pointer relative ${
        !routine.enabled
          ? 'border-[#E5E7EB] bg-slate-50/50 opacity-60'
          : isCompleted
          ? 'border-[#E5E7EB] bg-slate-50/60 opacity-75'
          : 'border-[#E5E7EB] hover:border-indigo-300 hover:shadow-xs hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start gap-1 sm:gap-3 min-w-0 flex-1">
        {/* Checkbox for date-specific completion with 40-44px touch area */}
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isCompleted ? 'Mark routine incomplete' : 'Mark routine complete'}
          className="p-1 -ml-1 -mt-0.5 sm:p-0 sm:ml-0 sm:mt-0.5 rounded-lg flex items-center justify-center shrink-0 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 cursor-pointer"
        >
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all active:scale-85 ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                : 'border-[#D1D5DB] hover:border-indigo-600 bg-white text-transparent'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </button>

        {/* Routine Title and Metadata */}
        <div className="flex flex-col min-w-0 pr-2 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-sm font-semibold text-[#111827] leading-snug break-words transition-all ${
                isCompleted ? 'line-through text-[#6B7280]' : ''
              }`}
            >
              {routine.title}
            </span>
            {!routine.enabled && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-[#6B7280]">
                Paused
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#6B7280]">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catTheme.chipClass}`}
            >
              {routine.category}
            </span>
            <span className="text-[#D1D5DB]">•</span>
            <span className="flex items-center gap-1 text-[11px] text-[#6B7280]">
              <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
              {routine.time}
            </span>

            {/* Repeat Days badges if management view */}
            {showManagementControls && (
              <>
                <span className="text-[#D1D5DB] hidden xs:inline">•</span>
                <div className="flex items-center gap-0.5 flex-wrap">
                  {DAY_LABELS.map((dayLabel, idx) => {
                    const active = routine.repeatDays.includes(idx);
                    return (
                      <span
                        key={idx}
                        className={`min-w-[18px] px-0.5 h-4 rounded text-[9px] font-bold flex items-center justify-center ${
                          active
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-[#9CA3AF] opacity-50'
                        }`}
                      >
                        {dayLabel}
                      </span>
                    );
                  })}
                </div>
              </>
            )}

            <span className={`sm:hidden px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${prioTheme.badge}`}>
              {routine.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${prioTheme.badge}`}
        >
          {routine.priority}
        </span>

        {/* Enable / Disable toggle switch */}
        <label
          className="relative inline-flex items-center cursor-pointer p-1"
          title={routine.enabled ? 'Pause Routine' : 'Enable Routine'}
          aria-label={routine.enabled ? 'Pause Routine' : 'Enable Routine'}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={routine.enabled}
            onChange={() => toggleRoutineEnabled(routine.id)}
            aria-label={routine.enabled ? 'Pause Routine' : 'Enable Routine'}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[6px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>

        {/* Mobile 3-Dot Action Menu */}
        <div className="relative sm:hidden" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Routine options"
            className="p-1.5 text-[#9CA3AF] hover:text-[#111827] rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {isMobileMenuOpen && (
            <div className="absolute right-0 top-9 w-36 bg-white border border-[#E5E7EB] rounded-xl shadow-xl p-1 z-30 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={(e) => {
                  handleEdit(e);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-[#374151] hover:bg-slate-50 rounded-lg w-full text-left"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Edit Routine</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  handleDelete(e);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg w-full text-left"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Delete Routine</span>
              </button>
            </div>
          )}
        </div>

        {/* Desktop Inline Actions */}
        <div className="hidden sm:flex items-center gap-1">
          {/* Edit Button */}
          <button
            type="button"
            onClick={handleEdit}
            title="Edit Routine"
            aria-label="Edit Routine"
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            title="Delete Routine"
            aria-label="Delete Routine"
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
